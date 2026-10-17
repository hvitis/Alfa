"""Small early-boot entry point, independent of the player, ADC and audio."""
import argparse
import os
from pathlib import Path
import signal
import socket
import time

from .config import Settings
from .display_handoff import SPLASH_SOCKET
from .hardware import ST7789, rgb565
from .service import ServiceWatchdog


def prepare_splash(settings):
    # Rendering and RGB565 conversion happen during installation, never at boot.
    from PIL import Image, ImageDraw, ImageOps
    from .ui import font

    width, height = settings.size
    with Image.open(settings.root / "assets/splash/waving.png") as source:
        frame = ImageOps.fit(source.convert("RGB"), settings.size, Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(frame)
    draw.text((width // 2, height - 35), "Starting…", font=font(23), fill="#002d60", anchor="mm")
    settings.state.mkdir(parents=True, exist_ok=True)
    preview = settings.state / "boot-splash.png"
    frame.save(preview)
    payload = rgb565(frame.rotate(settings.data["display"]["rotation"], expand=True))
    destination = settings.state / "boot-splash.bin"
    temporary = destination.with_suffix(".tmp")
    temporary.write_bytes(payload)
    temporary.replace(destination)
    return preview


def wait_for_display(timeout=10):
    """Wait for device nodes and udev permissions, without udev-settle."""
    deadline = time.monotonic() + timeout
    while True:
        if all(os.access(path, os.R_OK | os.W_OK) for path in ("/dev/spidev0.0", "/dev/gpiochip0")):
            return
        if time.monotonic() >= deadline:
            raise TimeoutError("SPI/GPIO are unavailable for the boot splash.")
        time.sleep(.05)


def serve_splash(settings, socket_path=SPLASH_SOCKET):
    payload = (settings.state / "boot-splash.bin").read_bytes()
    if len(payload) != 240 * 320 * 2:
        raise ValueError("Run the service installer to prepare the boot splash.")
    wait_for_display()
    path = Path(socket_path)
    display = None
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as server:
        path.unlink(missing_ok=True)
        try:
            # Bind after initialization so the driver cannot hand off to itself.
            display = ST7789(settings, initial_payload=payload)
            server.bind(str(path))
            path.chmod(0o600)
            server.listen(1)
            print(f"Boot splash visible at {time.monotonic():.3f}s since kernel startup", flush=True)
            ServiceWatchdog().ready()
            while True:
                connection, _ = server.accept()
                with connection:
                    connection.settimeout(1)
                    try:
                        request = connection.recv(32)
                    except TimeoutError:
                        continue
                    if request != b"handoff":
                        continue
                    # Acknowledge only after the GPIOs and SPI are released.
                    display.close()
                    display = None
                    connection.sendall(b"released")
                    print("Boot splash handed the display to the app", flush=True)
                    return
        finally:
            if display is not None:
                display.close()
            path.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=None)
    parser.add_argument("--prepare", action="store_true", help="Prepare the splash and PNG preview without hardware.")
    args = parser.parse_args()
    settings = Settings.load(args.config)
    if args.prepare:
        print(f"Prepared boot splash: {prepare_splash(settings)}")
        return 0

    def stop(signum, frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, stop)
    try:
        serve_splash(settings)
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
