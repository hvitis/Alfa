"""Prepare and install the ST7789 splash executed by Raspberry Pi firmware."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import struct
import subprocess
import sys
import tempfile

from .config import Settings
from .display_init import st7789_commands

MAGIC = b"SPLASH ASM" + bytes(5) + b"\x01"
BOOT_IMAGE = "alfa-splash.bin"
BEGIN = "# BEGIN ALFA FIRMWARE SPLASH"
END = "# END ALFA FIRMWARE SPLASH"
FILES = (BOOT_IMAGE, "alfa-splash.splash", "pixels.bin", "preview.png", "config.txt.fragment")
UPSTREAM = "https://github.com/raspberrypi/utils/tree/b57c48e97f7f43d95d86334798650cfda1ebc8a1/splashasm"
MAX_COMMAND_BYTES = 1024  # Upstream parser limit, narrower than the 16-bit size field.


def digest(content):
    return hashlib.sha256(content).hexdigest()


def settings_digest(settings):
    return digest(json.dumps(settings.data, sort_keys=True, ensure_ascii=False).encode())


def atomic_write(path, content):
    """Stage beside the destination, flush, and replace without truncating live files."""
    path = Path(path)
    mode = path.stat().st_mode & 0o777 if path.exists() else 0o644
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary, mode)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def program(display, pixels):
    """Encode format v1 and an equivalent source file for the official assembler."""
    if len(pixels) != 240 * 320 * 2:
        raise ValueError("Firmware splash pixels must contain exactly 153600 bytes.")
    if display["spi_bus"] != 0 or display["spi_device"] != 0:
        raise ValueError("Firmware splash supports SPI0 CE0 only.")
    # splashasm uses 1 for the default CPOL/CPHA and active-low CS settings.
    params = struct.pack("<8BI", 10, 9, 11, 8, display["dc_pin"], 1, 1, 1, display["spi_hz"])
    binary = bytearray(MAGIC + b"\x01SPI " + bytes([len(params), 0, 0, 0]) + params)
    source = ["# Prepared from Alfa config.json; assemble with Raspberry Pi splashasm.",
              f"define lcd spi [copi 10] [cipo 9] [sclk 11] [cs 8] [dc {display['dc_pin']}] "
              f"[freq {display['spi_hz']}]",
              "# Default SPI mode 0 and active-low CS use format v1 encodings."]

    def delay(microseconds):
        binary.extend(b"\x00" + struct.pack("<I", microseconds))
        source.append(f"delay [US] {microseconds}")

    def transfer(packet, data_only=False):
        if not 0 < len(packet) <= MAX_COMMAND_BYTES:
            raise ValueError("Firmware SPI command exceeds the upstream 1024-byte parser limit.")
        binary.extend(bytes([0x10, 0, int(data_only)]) + struct.pack("<H", len(packet)) + packet)
        source.append("lcd " + ("[DATA_ONLY] " if data_only else "") + packet.hex(" "))

    def command(number, data=b""):
        transfer(bytes([number]) + data)

    delay(20000)  # Reset is held HIGH by the firmware GPIO configuration.
    for number, data, wait in st7789_commands(display):
        if number == 0x29:
            continue  # Keep the panel off until its entire RAM contains our image.
        command(number, data)
        if wait:
            delay(wait)
    # Follow the upstream ST7789 example: RAMWR then small DATA_ONLY row transfers.
    command(0x2A, struct.pack(">HH", 0, 239))
    command(0x2B, struct.pack(">HH", 0, 319))
    command(0x2C, pixels[:480])
    for offset in range(480, len(pixels), 480):
        transfer(pixels[offset:offset + 480], data_only=True)
    command(0x29)
    delay(20000)
    return bytes(binary), "\n".join(source) + "\n"


def snippet(display):
    # This block is always appended under [all], never under an inherited Pi/HDMI filter.
    return (f"{BEGIN}\n[all]\n"
            f"gpio={display['reset_pin']}=op,dh\n"
            f"gpio={display['backlight_pin']}=op,dh\n"
            f"splash_screen={BOOT_IMAGE}\n{END}\n")


def prepare(settings):
    from .splash import prepare_splash

    preview = prepare_splash(settings)
    pixels = (settings.state / "boot-splash.bin").read_bytes()
    binary, source = program(settings.data["display"], pixels)
    bundle = settings.state / "firmware-splash"
    bundle.mkdir(parents=True, exist_ok=True)
    contents = {BOOT_IMAGE: binary, "alfa-splash.splash": source.encode(), "pixels.bin": pixels,
                "preview.png": preview.read_bytes(), "config.txt.fragment": snippet(settings.data["display"]).encode()}
    for name, content in contents.items():
        atomic_write(bundle / name, content)
    manifest = {"version": 2, "format": "SPLASH ASM v1", "upstream": UPSTREAM,
                "settings_sha256": settings_digest(settings), "display": settings.data["display"],
                "size": [240, 320], "windows": 1, "image_transfers": 320,
                "max_command_bytes": MAX_COMMAND_BYTES, "delay_us": 310000,
                "files": {name: digest(content) for name, content in contents.items()}}
    # Commit the inventory last. An interrupted preparation cannot pass installation checks.
    atomic_write(bundle / "manifest.json", (json.dumps(manifest, indent=2) + "\n").encode())
    return bundle


def load_bundle(settings, bundle):
    bundle = Path(bundle)
    manifest = json.loads((bundle / "manifest.json").read_text())
    if manifest.get("version") != 2 or manifest.get("settings_sha256") != settings_digest(settings):
        raise ValueError("Firmware splash configuration changed. Run make firmware-splash again.")
    if set(manifest.get("files", {})) != set(FILES):
        raise ValueError("Firmware splash inventory is incomplete.")
    contents = {name: (bundle / name).read_bytes() for name in FILES}
    for name, content in contents.items():
        if digest(content) != manifest["files"][name]:
            raise ValueError(f"Firmware splash checksum mismatch: {name}")
    binary, source = program(settings.data["display"], contents["pixels.bin"])
    if contents[BOOT_IMAGE] != binary or contents["alfa-splash.splash"] != source.encode():
        raise ValueError("Firmware splash program does not match the panel settings and pixels.")
    if contents["config.txt.fragment"] != snippet(settings.data["display"]).encode():
        raise ValueError("Firmware splash GPIO configuration does not match config.json.")
    return contents


def without_block(text):
    lines = text.splitlines(keepends=True)
    starts = [index for index, line in enumerate(lines) if line.strip() == BEGIN]
    ends = [index for index, line in enumerate(lines) if line.strip() == END]
    if not starts and not ends:
        return text, False
    if len(starts) != 1 or len(ends) != 1 or starts[0] >= ends[0]:
        raise ValueError("The managed firmware splash block is malformed. Restore its config.txt backup before retrying.")
    before = "".join(lines[:starts[0]])
    after = "".join(lines[ends[0] + 1:])
    # Preserve the [all] context of user edits appended after our managed block.
    return before + ("[all]\n" if after.strip() else "") + after, True


def check_includes(boot, text, visited=None, removing=False):
    """Reject competing splash definitions, including definitions in included files."""
    visited = set() if visited is None else visited
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        splash = re.fullmatch(r"splash_screen\s*=\s*(.*)", line)
        if splash and (not removing or splash[1].strip() == BOOT_IMAGE):
            raise ValueError("An unmanaged splash_screen setting conflicts with this operation. Remove that setting before retrying.")
        match = re.fullmatch(r"include\s+(.+)", line)
        if match:
            relative = Path(match[1])
            if relative.is_absolute() or ".." in relative.parts:
                raise ValueError("A boot include points outside the boot directory.")
            path = (boot / relative).resolve()
            if not path.is_relative_to(boot.resolve()):
                raise ValueError("A boot include points outside the boot directory.")
            if path in visited:
                raise ValueError("Boot configuration includes a cycle.")
            visited.add(path)
            if path.exists():
                check_includes(boot, path.read_text(), visited, removing=removing)
            visited.remove(path)


def check_host(boot):
    model_path = Path("/proc/device-tree/model")
    model = model_path.read_text().rstrip("\x00\n") if model_path.exists() else "unknown"
    if sys.platform != "linux" or not model.startswith("Raspberry Pi 3"):
        raise ValueError(f"This installer targets Raspberry Pi 3. Detected: {model}. Use --dry-run for offline review.")
    if os.geteuid() != 0:
        raise ValueError("Boot installation requires root. Use make firmware-splash-install.")
    if not boot.is_mount():
        raise ValueError(f"{boot} is not a mounted boot partition. Mount it or select --boot-dir explicitly.")


def backup(boot, config):
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    folder = boot / f"alfa-splash-backup-{stamp}"
    folder.mkdir(mode=0o700)
    atomic_write(folder / "config.txt", config)
    image = boot / BOOT_IMAGE
    if image.exists():
        shutil.copy2(image, folder / BOOT_IMAGE)
    return folder


def check_services():
    """Do not enable a firmware image while stale service units cannot load the app."""
    for unit in ("alfa.service", "alfa-splash.service"):
        try:
            result = subprocess.run(["systemctl", "show", unit, "--property=ExecStart", "--value"],
                                    capture_output=True, text=True, timeout=5, check=True)
        except (OSError, subprocess.SubprocessError) as error:
            raise ValueError(f"Cannot inspect {unit}. Run make restart on the Pi before firmware installation.") from error
        if not result.stdout.strip() or re.search(r"config\.(?:standalone|alphabet)\.json", result.stdout):
            raise ValueError(f"{unit} is missing or references a retired configuration. "
                             "Run make restart on the Pi, then retry firmware installation.")


def install(settings, bundle, boot, dry_run=False):
    contents = load_bundle(settings, bundle)
    boot = Path(boot).resolve()
    path = boot / "config.txt"
    original = path.read_bytes()
    clean, managed = without_block(original.decode())
    check_includes(boot, clean)
    image = boot / BOOT_IMAGE
    if image.is_symlink() or path.is_symlink():
        raise ValueError("Boot splash files must be regular files, not symbolic links.")
    if image.exists() and not managed:
        raise ValueError(f"{BOOT_IMAGE} already exists without an Alfa configuration block. Rename it before installation.")
    separator = "" if not clean or clean.endswith("\n") else "\n"
    updated = (clean + separator + snippet(settings.data["display"])).encode()
    if dry_run:
        return {"dry_run": True, "config": updated.decode(), "bytes": len(contents[BOOT_IMAGE])}
    check_host(boot)
    check_services()
    previous_image = image.read_bytes() if image.exists() else None
    saved = backup(boot, original)
    try:
        # Install the complete program before enabling its filename in config.txt.
        atomic_write(image, contents[BOOT_IMAGE])
        atomic_write(path, updated)
        os.sync()
    except BaseException:
        atomic_write(path, original)
        if previous_image is None:
            image.unlink(missing_ok=True)
        else:
            atomic_write(image, previous_image)
        raise
    return {"backup": str(saved), "config": str(path), "bytes": len(contents[BOOT_IMAGE])}


def remove(boot, dry_run=False):
    boot = Path(boot).resolve()
    path = boot / "config.txt"
    if path.is_symlink() or (boot / BOOT_IMAGE).is_symlink():
        raise ValueError("Boot splash files must be regular files, not symbolic links.")
    original = path.read_bytes()
    clean, managed = without_block(original.decode())
    if not managed:
        return {"removed": False}
    # Do not delete an image that a user now references outside our block.
    check_includes(boot, clean, removing=True)
    if dry_run:
        return {"dry_run": True, "config": clean}
    check_host(boot)
    saved = backup(boot, original)
    image = boot / BOOT_IMAGE
    previous_image = image.read_bytes() if image.exists() else None
    try:
        atomic_write(path, clean.encode())
        image.unlink(missing_ok=True)
        os.sync()
    except BaseException:
        if previous_image is not None:
            atomic_write(image, previous_image)
        atomic_write(path, original)
        raise
    return {"removed": True, "backup": str(saved)}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("prepare", "install", "remove", "status"))
    parser.add_argument("--boot-dir", type=Path, default=Path("/boot/firmware"))
    parser.add_argument("--dry-run", action="store_true", help="Show the boot configuration change without writing it.")
    args = parser.parse_args(argv)
    try:
        settings = Settings.load() if args.command != "remove" else None
        bundle = settings.state / "firmware-splash" if settings else None
        if args.command == "prepare":
            bundle = prepare(settings)
            print(f"Prepared firmware program: {bundle / BOOT_IMAGE}")
            print(f"Preview: {bundle / 'preview.png'}")
            print("Boot files are unchanged. Firmware support and cold-boot timing require a test on the Pi.")
        elif args.command == "install":
            result = install(settings, bundle, args.boot_dir, args.dry_run)
            print(json.dumps(result, indent=2))
            if not args.dry_run:
                print("Firmware splash installed. Reboot after confirming compatible Raspberry Pi firmware is installed.")
        elif args.command == "remove":
            print(json.dumps(remove(args.boot_dir, args.dry_run), indent=2))
        else:
            print(f"Host: {socket.gethostname()} ({sys.platform})")
            if sys.platform != "linux":
                print("This is a local inspection. Boot files on the Raspberry Pi are not inspected.")
            print(f"Boot partition: {args.boot_dir}")
            path = args.boot_dir / "config.txt"
            active = False
            if path.exists():
                _, active = without_block(path.read_text())
            print(f"Alfa firmware splash configured: {active}")
            print(f"Installed program present: {(args.boot_dir / BOOT_IMAGE).is_file()}")
            if bundle.exists():
                contents = load_bundle(settings, bundle)
                print("Prepared bundle checksums and configuration: OK")
                image = args.boot_dir / BOOT_IMAGE
                if image.is_file():
                    print(f"Installed program matches prepared bundle: {image.read_bytes() == contents[BOOT_IMAGE]}")
            print("For installed firmware identity, run: vcgencmd version")
            print("The splash_screen feature must be supported by that firmware build.")
        return 0
    except (OSError, ValueError, KeyError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
