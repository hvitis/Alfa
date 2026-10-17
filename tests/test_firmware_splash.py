"""Decode firmware output and exercise boot edits without accessing a real SD card."""
import copy
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

from app.config import ROOT, Settings
from app import firmware_splash as splash
from app.hardware import rgb565


def decode(binary):
    """Independent reader for the subset of Raspberry Pi splashasm used here."""
    assert binary[:16] == b"SPLASH ASM\0\0\0\0\0\x01"
    assert binary[16:25] == b"\x01SPI \x0c\0\0\0"
    params = struct.unpack_from("<8BI", binary, 25)
    offset, commands, delays = 37, [], []
    while offset < len(binary):
        opcode = binary[offset]
        if opcode == 0:
            delays.append(struct.unpack_from("<I", binary, offset + 1)[0])
            offset += 5
        else:
            assert opcode == 0x10
            assert binary[offset + 1:offset + 3] == b"\0\0"
            length = struct.unpack_from("<H", binary, offset + 3)[0]
            packet = binary[offset + 5:offset + 5 + length]
            assert 0 < length <= 65535 and len(packet) == length
            commands.append((packet[0], packet[1:]))
            offset += 5 + length
    assert offset == len(binary)
    return params, commands, delays


class FirmwareSplashTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.settings = Settings(self.root, copy.deepcopy(Settings.load().data))
        images = self.root / "media/images"
        images.mkdir(parents=True)
        shutil.copyfile(ROOT / "media/images/000-illustration_0.png", images / "000-illustration_0.png")
        self.bundle = splash.prepare(self.settings)
        self.boot = self.root / "boot"
        self.boot.mkdir()
        self.config = self.boot / "config.txt"
        self.original = b"# Keep existing settings\ndtparam=spi=on\n[pi3]\ndtoverlay=hifiberry-dac\n\n"
        self.config.write_bytes(self.original)
        self.host = patch.object(splash, "check_host")
        self.host.start()
        self.addCleanup(self.host.stop)
        self.sync = patch.object(splash.os, "sync")
        self.sync.start()
        self.addCleanup(self.sync.stop)

    def test_program_reconstructs_native_frame_and_panel_registers(self):
        # Use a nonuniform frame so missing, swapped, or duplicated strips fail.
        pixels = bytes(index % 251 for index in range(153600))
        binary, _ = splash.program(self.settings.data["display"], pixels)
        params, commands, delays = decode(binary)
        self.assertEqual(params, (10, 9, 11, 8, 25, 1, 1, 1, 10000000))
        self.assertEqual(delays, [20000, 150000, 120000, 20000])
        self.assertEqual(commands[:4], [(1, b""), (0x11, b""), (0x36, b"\0"), (0x3A, b"\x55")])
        self.assertIn((0x21, b""), commands)
        self.assertEqual(commands[-13], (0x29, b""))
        strips = []
        for index, row in enumerate(range(0, 320, 80)):
            column, window, data = commands[-12 + index * 3:][:3]
            self.assertEqual(column, (0x2A, b"\0\0\0\xef"))
            self.assertEqual(window, (0x2B, struct.pack(">HH", row, row + 79)))
            self.assertEqual(data[0], 0x2C)
            self.assertEqual(len(data[1]), 38400)
            strips.append(data[1])
        self.assertEqual(b"".join(strips), pixels)

    def test_rotations_and_color_settings_match_linux_payload(self):
        for rotation in (0, 90, 180, 270):
            with self.subTest(rotation=rotation):
                display = self.settings.data["display"]
                display.update(rotation=rotation, bgr=True, invert=False)
                bundle = splash.prepare(self.settings)
                contents = splash.load_bundle(self.settings, bundle)
                _, commands, _ = decode(contents[splash.BOOT_IMAGE])
                self.assertIn((0x36, b"\x08"), commands)
                self.assertIn((0x20, b""), commands)
                self.assertNotIn((0x21, b""), commands)
                with Image.open(bundle / "preview.png") as preview:
                    self.assertEqual(contents["pixels.bin"], rgb565(preview.rotate(rotation, expand=True)))
                self.assertEqual(contents["pixels.bin"], (self.settings.state / "boot-splash.bin").read_bytes())

    def test_rejects_invalid_payload_or_bus(self):
        with self.assertRaisesRegex(ValueError, "153600"):
            splash.program(self.settings.data["display"], b"short")
        display = dict(self.settings.data["display"], spi_bus=1)
        with self.assertRaisesRegex(ValueError, "SPI0"):
            splash.program(display, bytes(153600))

    def test_stale_settings_and_corrupt_or_rehashed_program_cannot_install(self):
        self.settings.data["display"]["dc_pin"] = 26
        with self.assertRaisesRegex(ValueError, "configuration changed"):
            splash.install(self.settings, self.bundle, self.boot)
        self.settings.data["display"]["dc_pin"] = 25
        image = self.bundle / splash.BOOT_IMAGE
        image.write_bytes(b"invalid")
        with self.assertRaisesRegex(ValueError, "checksum"):
            splash.install(self.settings, self.bundle, self.boot)
        manifest_path = self.bundle / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["files"][splash.BOOT_IMAGE] = splash.digest(b"invalid")
        manifest_path.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError, "does not match"):
            splash.install(self.settings, self.bundle, self.boot)
        self.assertEqual(self.config.read_bytes(), self.original)
        self.assertFalse((self.boot / splash.BOOT_IMAGE).exists())

    def test_dry_run_makes_no_boot_writes_or_host_calls(self):
        before = {path.name: path.read_bytes() for path in self.boot.iterdir()}
        result = splash.install(self.settings, self.bundle, self.boot, dry_run=True)
        self.assertIn("[all]\ngpio=27=op,dh\ngpio=24=op,dh\nsplash_screen=alfa-splash.bin", result["config"])
        self.assertEqual(before, {path.name: path.read_bytes() for path in self.boot.iterdir()})
        splash.check_host.assert_not_called()

    def test_install_reinstall_and_remove_preserve_existing_config_and_backups(self):
        result = splash.install(self.settings, self.bundle, self.boot)
        installed = self.config.read_bytes()
        self.assertTrue(installed.startswith(self.original))
        self.assertEqual((Path(result["backup"]) / "config.txt").read_bytes(), self.original)
        splash.install(self.settings, self.bundle, self.boot)
        self.assertEqual(self.config.read_bytes(), installed)
        result = splash.remove(self.boot)
        self.assertTrue(result["removed"])
        self.assertEqual((Path(result["backup"]) / splash.BOOT_IMAGE).read_bytes(),
                         (self.bundle / splash.BOOT_IMAGE).read_bytes())
        self.assertEqual(self.config.read_bytes(), self.original)
        self.assertFalse((self.boot / splash.BOOT_IMAGE).exists())
        self.assertEqual(splash.remove(self.boot), {"removed": False})

    def test_removal_preserves_new_edits_and_their_all_context(self):
        splash.install(self.settings, self.bundle, self.boot)
        with self.config.open("a") as output:
            output.write("# New setting\narm_freq=1300\nsplash_screen=other.bin\n")
        splash.remove(self.boot)
        self.assertEqual(self.config.read_text(), self.original.decode() +
                         "[all]\n# New setting\narm_freq=1300\nsplash_screen=other.bin\n")

    def test_conflicts_and_include_cycles_are_rejected_without_writes(self):
        for extra in ("splash_screen=other.bin\n", "include custom.txt\n",
                      splash.BEGIN + "\n", "include ../outside.txt\n"):
            with self.subTest(extra=extra):
                (self.boot / "custom.txt").write_text("splash_screen=other.bin\n")
                self.config.write_text(self.original.decode() + extra)
                before = self.config.read_bytes()
                with self.assertRaises(ValueError):
                    splash.install(self.settings, self.bundle, self.boot)
                self.assertEqual(self.config.read_bytes(), before)
        (self.boot / "custom.txt").write_text("include custom.txt\n")
        self.config.write_text("include custom.txt\n")
        with self.assertRaisesRegex(ValueError, "cycle"):
            splash.install(self.settings, self.bundle, self.boot)

    def test_reinstall_failure_restores_config_and_previous_binary(self):
        splash.install(self.settings, self.bundle, self.boot)
        original = self.config.read_bytes()
        image = self.boot / splash.BOOT_IMAGE
        image.write_bytes(b"previous program")
        real_write = splash.atomic_write
        failed = False

        def fail_once(path, content):
            nonlocal failed
            if path == self.config and not failed:
                failed = True
                raise OSError("simulated config write failure")
            return real_write(path, content)

        with patch.object(splash, "atomic_write", side_effect=fail_once):
            with self.assertRaisesRegex(OSError, "simulated"):
                splash.install(self.settings, self.bundle, self.boot)
        self.assertEqual(self.config.read_bytes(), original)
        self.assertEqual(image.read_bytes(), b"previous program")

    def test_removal_failure_restores_enabled_program(self):
        splash.install(self.settings, self.bundle, self.boot)
        original = self.config.read_bytes()
        with patch.object(splash.os, "sync", side_effect=OSError("simulated sync failure")):
            with self.assertRaises(OSError):
                splash.remove(self.boot)
        self.assertEqual(self.config.read_bytes(), original)
        self.assertEqual((self.boot / splash.BOOT_IMAGE).read_bytes(),
                         (self.bundle / splash.BOOT_IMAGE).read_bytes())

    def test_host_rejection_leaves_boot_untouched(self):
        with patch.object(splash, "check_host", side_effect=ValueError("unsupported host")):
            with self.assertRaisesRegex(ValueError, "unsupported host"):
                splash.install(self.settings, self.bundle, self.boot)
        self.assertEqual(list(self.boot.iterdir()), [self.config])
        self.assertEqual(self.config.read_bytes(), self.original)

    def test_boot_symlink_is_rejected(self):
        actual = self.root / "actual-config.txt"
        self.config.rename(actual)
        self.config.symlink_to(actual)
        with self.assertRaisesRegex(ValueError, "symbolic"):
            splash.install(self.settings, self.bundle, self.boot)
        self.assertEqual(actual.read_bytes(), self.original)


class FirmwareWrapperTests(unittest.TestCase):
    def test_prepare_precedes_sudo_and_dry_run_never_uses_sudo(self):
        with tempfile.TemporaryDirectory(prefix="alfa with spaces ") as folder:
            root = Path(folder)
            (root / "scripts").mkdir()
            (root / ".venv/bin").mkdir(parents=True)
            shutil.copyfile(ROOT / "scripts/firmware-splash.sh", root / "scripts/firmware-splash.sh")
            interpreter = root / ".venv/bin/python"
            interpreter.write_text('#!/bin/bash\nprintf "PYTHON %s\\n" "$*" >> "$CALL_LOG"\n')
            interpreter.chmod(0o755)
            sudo = root / ".venv/bin/sudo"
            sudo.write_text('#!/bin/bash\nprintf "SUDO\\n" >> "$CALL_LOG"\nexec "$@"\n')
            sudo.chmod(0o755)
            log = root / "calls.txt"
            env = dict(os.environ, CALL_LOG=str(log), PATH=f"{sudo.parent}:{os.environ['PATH']}")
            for dry_run in (False, True):
                log.unlink(missing_ok=True)
                args = ["bash", str(root / "scripts/firmware-splash.sh"), "install", "--boot-dir", "/boot/firmware"]
                if dry_run:
                    args.append("--dry-run")
                result = subprocess.run(args, env=env, capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                calls = log.read_text().splitlines()
                self.assertEqual(calls[0], "PYTHON -m app.firmware_splash prepare")
                self.assertEqual("SUDO" in calls, not dry_run)
                self.assertTrue(calls[-1].startswith("PYTHON -m app.firmware_splash install --boot-dir /boot/firmware"))


if __name__ == "__main__":
    unittest.main()
