import argparse
import importlib.util
import os
import select
import shutil
import signal
import subprocess
import sys
import time
import wave
from contextlib import ExitStack
from pathlib import Path

from .audio import StreamingAudioPlayer, audio_device
from .buttons import Debouncer, calibrate, classify, load_calibration
from .config import Settings
from .hardware import ADS1x15, PreviewDisplay, ST7789
from .media import image_sources, prepare_audio, prepare_images
from .ui import screen_patterns
from .player import PlayerSession
from .speaker_test import run_speaker_test


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
    try:
        images, prepared_only = image_sources(settings)
        directory = settings.path("images", "prepared" if prepared_only else "input")
        report("images", True, f"{len(images)} {'prepared photos' if prepared_only else 'original photos'} in {directory}")
    except (OSError, ValueError) as error:
        report("images", False, str(error))
    report("sounds", settings.path("audio", "input").is_dir(), str(settings.path("audio", "input")))
    for program in ("ffmpeg", "ffprobe"):
        report(program, bool(shutil.which(program)), shutil.which(program) or "Install ffmpeg.")
    if simulate:
        print("SKIP  SPI, GPIO, I²C and ALSA: simulation does not access Pi hardware.")
        return 1 if errors else 0
    for module in ("gpiozero", "lgpio", "spidev", "smbus2"):
        report(module, importlib.util.find_spec(module) is not None, "Python dependency")
    for device in ("/dev/spidev0.0", f"/dev/i2c-{settings.data['adc']['bus']}"):
        if not Path(device).exists():
            detail = "Missing device. Enable I2C: sudo raspi-config nonint do_i2c 0, then reboot." if "/i2c-" in device else "Missing device. Enable SPI in raspi-config, then reboot."
        else:
            detail = "Read/write access; join spi/i2c groups and log in again if access fails."
        report(device, os.access(device, os.R_OK | os.W_OK), detail)
    gpio = list(Path("/dev").glob("gpiochip*"))
    report("GPIO", any(os.access(p, os.R_OK | os.W_OK) for p in gpio), "Join the gpio group and log in again.")
    try:
        device = audio_device(settings.data["audio"]["device"])
        report("audio card", True, device)
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        report("audio card", False, str(error))
    adc_ready = False
    try:
        with ExitStack() as stack:
            adc = adc_resource(stack, settings)
            voltage = adc.read_voltage()
        adc_ready = True
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
        print("NEXT  Run calibrate-buttons before starting the player." if adc_ready else "NEXT  Fix the ADC / I2C failures, then run calibrate-buttons.")
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
    images = prepare_images(settings)
    sounds = [] if no_audio else prepare_audio(settings, full=True)
    with ExitStack() as stack:
        display = display_resource(stack, settings, simulate)
        audio = StreamingAudioPlayer(settings, simulate)
        stack.callback(audio.close)
        session = PlayerSession(images, sounds, audio)
        if sounds:
            import wave
            with wave.open(str(sounds[0]), "rb") as recording:
                audio.duration = recording.getnframes() / recording.getframerate()
        display.show(session.frame())
        if once:
            print("Displayed the player." + (f" Preview: {settings.state / 'preview/current.png'}" if simulate else ""))
            return
        adc = None
        if not simulate and not keyboard_only:
            states = load_calibration(settings)
            adc = adc_resource(stack, settings)
        debounce = Debouncer(settings.data["adc"]["debounce_ms"] / 1000)
        keyboard = stack.enter_context(Keyboard())
        center_since = None
        previous_frame = session.render_key()
        print("Player: LEFT/RIGHT (A/D) = photos; UP/DOWN (W/S) = volume; CENTER (Space) = play/stop.")
        print("Hold CENTER for 2 seconds or press Q / Ctrl+C to quit. Volume changes in 5% steps during playback.")
        if simulate:
            print(f"Simulation saves frames to {settings.state / 'preview/current.png'}; it produces no sound.")
        while True:
            for key in keyboard.read().lower():
                if key in ("q", "\x03"):
                    return
                if key in {"a", "d", "w", "s", " "}:
                    session.action({"a": "left", "d": "right", "w": "up", "s": "down", " ": "center"}[key])
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
                            session.action(button)
                    elif button == "center" and center_since is not None:
                        if now - center_since < 2:
                            session.action("center")
                        center_since = None
                if center_since is not None and name == "center" and now - center_since >= 2:
                    print("Center held: stopping the player.")
                    return
            key = session.render_key()
            if key != previous_frame:
                display.show(session.frame())
                previous_frame = key
            time.sleep(.01)


def parser():
    result = argparse.ArgumentParser(description="Test the Waveshare LCD, MAX98357A speaker and analog buttons over SSH.")
    result.add_argument("--config", help="JSON overrides; relative media paths still use this project directory.")
    result.add_argument("--simulate", action="store_true", help="Save PNG previews and skip Pi hardware and audio output.")
    result.add_argument("--debug", action="store_true", help="Show a traceback on errors.")
    commands = result.add_subparsers(dest="command", required=True)
    prepare = commands.add_parser("prepare", help="Prepare display PNGs and short stereo WAVs.")
    prepare.add_argument("--force", action="store_true")
    prepare.add_argument("--images-only", action="store_true")
    prepare.add_argument("--full-audio", action="store_true", help="Prepare complete recordings for the interactive player.")
    commands.add_parser("doctor", help="Check dependencies, interfaces, ADC and audio device.")
    screen = commands.add_parser("screen-test", help="Show colors, borders and orientation labels.")
    screen.add_argument("--seconds", type=float, default=1.5, help="Duration per pattern.")
    speaker = commands.add_parser("speaker-test", help="Play a prepared sound through the selected ALSA device.")
    speaker.add_argument("--track", type=int, default=0)
    speaker.add_argument("--volume", type=float)
    speaker.add_argument("--device", help="ALSA device, for example plughw:CARD=MAX98357A,DEV=0.")
    speaker.add_argument("--with-screen", action="store_true", help="Show speaker test status on the LCD; no buttons or ADC required.")
    speaker.add_argument("--verbose", action="store_true", help="Print wiring, signal levels, commands, progress, and ALSA details.")
    speaker.add_argument("--repeat", type=int, default=1, help="Number of playbacks (default: 1).")
    speaker.add_argument("--pause", type=float, default=1, help="Seconds between playbacks (default: 1).")
    speaker.add_argument("--hold", type=float, default=3, help="Seconds to keep the final LCD status visible (default: 3).")
    speaker.add_argument("--tone", action="store_true", help="Use a known 2-second 440 Hz tone instead of sounds/. No original files change.")
    commands.add_parser("calibrate-buttons", help="Measure idle plus all five buttons.")
    buttons = commands.add_parser("buttons", help="Print raw A0 voltage and calibrated button events.")
    buttons.add_argument("--seconds", type=float, default=0, help="0 means run until Ctrl+C.")
    gallery = commands.add_parser("player", aliases=["gallery"], help="Photo and recording player with button volume control.")
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
                sounds = prepare_audio(settings, args.force, full=args.full_audio)
                print(f"Prepared {len(sounds)} stereo WAVs: {settings.path('audio', 'prepared')}")
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
            return run_speaker_test(settings, simulate=args.simulate, volume=args.volume,
                                    device=args.device, track=args.track, with_screen=args.with_screen,
                                    verbose=args.verbose, repeat=args.repeat, pause=args.pause,
                                    hold=args.hold, tone=args.tone, debug=args.debug)
        elif args.command == "calibrate-buttons":
            with ExitStack() as stack:
                calibrate(adc_resource(stack, settings), settings)
        elif args.command == "buttons":
            if args.seconds < 0:
                raise ValueError("Monitoring duration cannot be negative.")
            monitor_buttons(settings, args.seconds)
        elif args.command in ("player", "gallery"):
            run_gallery(settings, args.simulate, args.keyboard, args.once, args.no_audio)
        return 0
    except KeyboardInterrupt:
        print("\nStopped. Audio and display resources released.")
        return 0
    except (OSError, ValueError, RuntimeError, ImportError, subprocess.TimeoutExpired, wave.Error, EOFError) as error:
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
