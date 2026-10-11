import argparse
import importlib.util
import os
import select
import shutil
import signal
import subprocess
import sys
import time
from contextlib import ExitStack
from pathlib import Path

from .audio import AudioPlayer, audio_device
from .buttons import Debouncer, calibrate, classify, load_calibration
from .config import Settings
from .hardware import ADS1x15, PreviewDisplay, ST7789
from .media import prepare_audio, prepare_images
from .ui import Gallery, screen_patterns


class Keyboard:
    """Non-blocking SSH terminal input; works without a graphical desktop."""
    def __enter__(self):
        self.saved = None
        self.buffer = ""
        if sys.stdin.isatty():
            import termios
            import tty
            self.saved = termios.tcgetattr(sys.stdin)
            tty.setcbreak(sys.stdin.fileno())
        return self

    def read(self):
        if self.saved is not None and select.select([sys.stdin], [], [], 0)[0]:
            self.buffer += os.read(sys.stdin.fileno(), 32).decode(errors="ignore")
        keys = ""
        while self.buffer:
            if self.buffer.startswith("\x1b["):
                if len(self.buffer) < 3:
                    break
                keys += {"A": "w", "B": "s", "C": "d", "D": "a"}.get(self.buffer[2], "")
                self.buffer = self.buffer[3:]
            elif self.buffer.startswith("\x1b"):
                if len(self.buffer) == 1:
                    break
                self.buffer = self.buffer[1:]
            else:
                keys += self.buffer[0]
                self.buffer = self.buffer[1:]
        return keys

    def __exit__(self, *args):
        if self.saved is not None:
            import termios
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.saved)


def display_resource(stack, settings, simulate):
    display = PreviewDisplay(settings) if simulate else ST7789(settings)
    stack.callback(display.close)
    return display


def adc_resource(stack, settings):
    adc = ADS1x15(settings)
    stack.callback(adc.close)
    return adc


def doctor(settings, simulate=False):
    errors = []
    def report(name, good, detail):
        print(f"{'OK' if good else 'FAIL'}  {name}: {detail}")
        if not good:
            errors.append(name)
    report("images", settings.path("images", "input").is_dir(), str(settings.path("images", "input")))
    report("sounds", settings.path("audio", "input").is_dir(), str(settings.path("audio", "input")))
    for program in ("ffmpeg", "ffprobe"):
        report(program, bool(shutil.which(program)), shutil.which(program) or "Install ffmpeg.")
    if simulate:
        print("SKIP  SPI, GPIO, I²C and ALSA: simulation does not access Pi hardware.")
        return 1 if errors else 0
    for module in ("gpiozero", "lgpio", "spidev", "smbus2"):
        report(module, importlib.util.find_spec(module) is not None, "Python dependency")
    for device in ("/dev/spidev0.0", f"/dev/i2c-{settings.data['adc']['bus']}"):
        report(device, os.access(device, os.R_OK | os.W_OK), "Read/write access; enable interfaces and join spi/i2c groups.")
    gpio = list(Path("/dev").glob("gpiochip*"))
    report("GPIO", any(os.access(p, os.R_OK | os.W_OK) for p in gpio), "Join the gpio group and log in again.")
    try:
        device = audio_device(settings.data["audio"]["device"])
        report("audio card", True, device)
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        report("audio card", False, str(error))
    try:
        with ExitStack() as stack:
            adc = adc_resource(stack, settings)
            voltage = adc.read_voltage()
        report("ADC A0", True, f"{voltage:.3f} V, {settings.data['adc']['model']}, address {settings.address:#04x}")
    except (ImportError, OSError, RuntimeError) as error:
        report("ADC A0", False, str(error))
    if (settings.state / "buttons.json").exists():
        try:
            load_calibration(settings)
            report("buttons", True, "Calibration matches the ADC configuration.")
        except ValueError as error:
            report("buttons", False, str(error))
    else:
        print("NEXT  Run calibrate-buttons before starting the button-controlled gallery.")
    return 1 if errors else 0


def monitor_buttons(settings, seconds=0):
    path = settings.state / "buttons.json"
    states = load_calibration(settings) if path.exists() else None
    debounce = Debouncer(settings.data["adc"]["debounce_ms"] / 1000)
    started, printed = time.monotonic(), 0.0
    with ExitStack() as stack:
        adc = adc_resource(stack, settings)
        print("Press each button separately. Ctrl+C stops. Before calibration, only voltage is displayed.")
        while not seconds or time.monotonic() - started < seconds:
            voltage = adc.read_voltage()
            now = time.monotonic()
            name = classify(voltage, states) if states else None
            event = debounce.update(name, now) if states else None
            if event or now - printed >= 0.25:
                print(f"A0={voltage:.3f} V  state={name or 'unknown'}  event={event or '-'}", flush=True)
                printed = now
            time.sleep(0.01)


def run_gallery(settings, simulate=False, keyboard_only=False, once=False, no_audio=False):
    gallery = Gallery(prepare_images(settings))
    sounds = [] if no_audio else prepare_audio(settings)
    with ExitStack() as stack:
        display = display_resource(stack, settings, simulate)
        player = AudioPlayer(settings, simulate)
        stack.callback(player.close)
        display.show(gallery.frame())
        if once:
            print("Displayed the first photo." + (f" Preview: {settings.state / 'preview/current.png'}" if simulate else ""))
            return
        states, adc = None, None
        if not simulate and not keyboard_only:
            states = load_calibration(settings)
            adc = adc_resource(stack, settings)
        debounce = Debouncer(settings.data["adc"]["debounce_ms"] / 1000)
        keyboard = stack.enter_context(Keyboard())
        center_since = None
        last_playing = False
        print("Gallery: A/D or left/right arrows = photos; W/S = first/last; Space = sound; Q = quit.")
        print("Buttons: LEFT/RIGHT = photos; UP/DOWN = first/last; tap CENTER = sound; hold CENTER 2 seconds = quit.")
        if simulate:
            print(f"Simulation saves each frame to {settings.state / 'preview/current.png'}.")
        def action(button):
            if button == "center":
                if no_audio:
                    display.show(gallery.frame("Audio disabled"))
                elif player.playing:
                    player.stop()
                else:
                    player.play(sounds[0])
            else:
                gallery.navigate(button)
                display.show(gallery.frame("Playing" if player.playing else "Ready"))
                print(f"Photo {gallery.index + 1}/{len(gallery.paths)}: {gallery.paths[gallery.index].name}")
        while True:
            keys = keyboard.read()
            for key in keys.lower():
                if key in ("q", "\x03"):
                    return
                if key in {"a", "d", "w", "s", " "}:
                    action({"a": "left", "d": "right", "w": "up", "s": "down", " ": "center"}[key])
            if adc:
                name = classify(adc.read_voltage(), states)
                now = time.monotonic()
                event = debounce.update(name, now)
                if event:
                    kind, button = event
                    if kind == "press":
                        if button == "center":
                            center_since = now
                        else:
                            action(button)
                    elif button == "center" and center_since is not None:
                        if now - center_since < 2:
                            action("center")
                        center_since = None
                if center_since is not None and name == "center" and now - center_since >= 2:
                    print("Center held: stopping the gallery.")
                    return
            playing = player.playing
            if playing != last_playing:
                display.show(gallery.frame("Playing" if playing else "Ready"))
                last_playing = playing
            time.sleep(0.01)


def parser():
    result = argparse.ArgumentParser(description="Test the Waveshare LCD, MAX98357A speaker and analog buttons over SSH.")
    result.add_argument("--config", help="JSON overrides; relative media paths still use this project directory.")
    result.add_argument("--simulate", action="store_true", help="Save PNG previews and skip Pi hardware and audio output.")
    result.add_argument("--debug", action="store_true", help="Show a traceback on errors.")
    commands = result.add_subparsers(dest="command", required=True)
    prepare = commands.add_parser("prepare", help="Prepare display PNGs and short stereo WAVs.")
    prepare.add_argument("--force", action="store_true")
    prepare.add_argument("--images-only", action="store_true")
    commands.add_parser("doctor", help="Check dependencies, interfaces, ADC and audio device.")
    screen = commands.add_parser("screen-test", help="Show colors, borders and orientation labels.")
    screen.add_argument("--seconds", type=float, default=1.5, help="Duration per pattern.")
    speaker = commands.add_parser("speaker-test", help="Play a prepared sound through the selected ALSA device.")
    speaker.add_argument("--track", type=int, default=0)
    speaker.add_argument("--volume", type=float)
    speaker.add_argument("--device", help="ALSA device, for example plughw:CARD=MAX98357A,DEV=0.")
    commands.add_parser("calibrate-buttons", help="Measure idle plus all five buttons.")
    buttons = commands.add_parser("buttons", help="Print raw A0 voltage and calibrated button events.")
    buttons.add_argument("--seconds", type=float, default=0, help="0 means run until Ctrl+C.")
    gallery = commands.add_parser("gallery", help="Browse photos with buttons or the SSH keyboard.")
    gallery.add_argument("--keyboard", action="store_true", help="Skip ADC and calibration; use keyboard controls.")
    gallery.add_argument("--once", action="store_true", help="Display the first photo and exit.")
    gallery.add_argument("--no-audio", action="store_true", help="Run without preparing or playing audio.")
    return result


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        settings = Settings.load(args.config)
        if args.command in ("buttons", "calibrate-buttons") and args.simulate:
            raise ValueError("Button voltage and calibration need the real ADC. Simulation only supports display/audio commands.")
        if args.command == "prepare":
            images = prepare_images(settings, args.force)
            print(f"Prepared {len(images)} images at {settings.size}: {settings.path('images', 'prepared')}")
            if not args.images_only:
                sounds = prepare_audio(settings, args.force)
                print(f"Prepared {len(sounds)} short stereo WAVs: {settings.path('audio', 'prepared')}")
        elif args.command == "doctor":
            return doctor(settings, args.simulate)
        elif args.command == "screen-test":
            if args.seconds < 0:
                raise ValueError("Pattern duration cannot be negative.")
            with ExitStack() as stack:
                display = display_resource(stack, settings, args.simulate)
                for name, frame in screen_patterns(settings.size):
                    display.show(frame, name)
                    print(f"Screen pattern: {name}")
                    time.sleep(args.seconds)
        elif args.command == "speaker-test":
            sounds = prepare_audio(settings)
            if not 0 <= args.track < len(sounds):
                raise ValueError(f"Track must be between 0 and {len(sounds) - 1}.")
            player = AudioPlayer(settings, args.simulate, args.volume, args.device)
            try:
                player.play(sounds[args.track])
                while player.playing:
                    time.sleep(0.05)
            finally:
                player.close()
        elif args.command == "calibrate-buttons":
            with ExitStack() as stack:
                calibrate(adc_resource(stack, settings), settings)
        elif args.command == "buttons":
            if args.seconds < 0:
                raise ValueError("Monitoring duration cannot be negative.")
            monitor_buttons(settings, args.seconds)
        elif args.command == "gallery":
            run_gallery(settings, args.simulate, args.keyboard, args.once, args.no_audio)
        return 0
    except KeyboardInterrupt:
        print("\nStopped. Audio and display resources released.")
        return 0
    except (OSError, ValueError, RuntimeError, ImportError, subprocess.TimeoutExpired, EOFError) as error:
        print(f"Error: {error}", file=sys.stderr)
        if args.debug:
            import traceback
            traceback.print_exc()
        return 1


def stop_signal(signum, frame):
    raise KeyboardInterrupt


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, stop_signal)
    raise SystemExit(main())
