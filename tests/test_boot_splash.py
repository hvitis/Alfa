"""Boot ordering and a real Unix-socket handoff without Pi hardware."""
import copy
from contextlib import redirect_stdout
import io
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import Mock, patch

from PIL import Image

from app.config import ROOT, Settings
from app.display_handoff import release_boot_splash
from app.hardware import ST7789, rgb565
from app.service import render_unit
from app.splash import prepare_splash, serve_splash, wait_for_display


class BootSplashTests(unittest.TestCase):
    def setUp(self):
        # Unix socket paths must fit within macOS's 104-byte limit.
        self.temp = tempfile.TemporaryDirectory(dir="/tmp")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.settings = Settings(self.root, copy.deepcopy(Settings.load().data))
        (self.root / "media/images").mkdir(parents=True)
        shutil.copyfile(ROOT / "media/images/000-illustration_0.png",
                        self.root / "media/images/000-illustration_0.png")

    def test_installed_payload_matches_preview_in_all_rotations(self):
        for rotation in (0, 90, 180, 270):
            with self.subTest(rotation=rotation):
                self.settings.data["display"]["rotation"] = rotation
                preview = prepare_splash(self.settings)
                with Image.open(preview) as image:
                    self.assertEqual(image.size, self.settings.size)
                    # The supplied Alfa artwork and navy text both reach the preview.
                    self.assertTrue(any(r > 200 and g < 180 and b > 100 for r, g, b in image.getdata()))
                    self.assertTrue(any(b > r + 30 for r, g, b in image.crop((0, image.height - 55, image.width, image.height)).getdata()))
                    self.assertEqual((self.settings.state / "boot-splash.bin").read_bytes(),
                                     rgb565(image.rotate(rotation, expand=True)))

    def test_handoff_acknowledges_after_hardware_closes(self):
        prepare_splash(self.settings)
        socket_path = self.root / "handoff.sock"
        ready = threading.Event()
        errors = []
        display = Mock()
        watchdog = Mock()
        watchdog.ready.side_effect = ready.set

        def run_server():
            try:
                serve_splash(self.settings, socket_path)
            except BaseException as error:
                errors.append(error)
                ready.set()

        with patch("app.splash.wait_for_display"), patch("app.splash.ST7789", return_value=display) as driver, patch("app.splash.ServiceWatchdog", return_value=watchdog), redirect_stdout(io.StringIO()):
            worker = threading.Thread(target=run_server, daemon=True)
            worker.start()
            try:
                self.assertTrue(ready.wait(3), "Splash did not become ready")
                self.assertFalse(errors, errors)
                display.close.assert_not_called()
                # An unrelated client cannot prematurely release the screen.
                with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
                    client.connect(str(socket_path))
                    client.sendall(b"invalid")
                release_boot_splash(socket_path)
                display.close.assert_called_once()
                driver.assert_called_once_with(self.settings, initial_payload=(self.settings.state / "boot-splash.bin").read_bytes())
            finally:
                if worker.is_alive() and socket_path.exists():
                    release_boot_splash(socket_path)
                worker.join(3)
            self.assertFalse(worker.is_alive())
        self.assertFalse(errors, errors)
        self.assertFalse(socket_path.exists())
        # Subsequent app restarts and manual screen tests need no splash service.
        release_boot_splash(socket_path)

    def test_stale_socket_does_not_block_normal_startup(self):
        path = self.root / "stale.sock"
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as server:
            server.bind(str(path))
        release_boot_splash(path)

    def test_ready_failure_releases_display_and_socket(self):
        prepare_splash(self.settings)
        path = self.root / "failed.sock"
        display = Mock()
        with patch("app.splash.wait_for_display"), patch("app.splash.ST7789", return_value=display), patch("app.splash.ServiceWatchdog") as watchdog, redirect_stdout(io.StringIO()):
            watchdog.return_value.ready.side_effect = RuntimeError("notification failed")
            with self.assertRaisesRegex(RuntimeError, "notification failed"):
                serve_splash(self.settings, path)
        display.close.assert_called_once()
        self.assertFalse(path.exists())

    def test_driver_hands_off_before_claiming_gpio_and_lights_the_prepared_frame(self):
        events = []
        spi = Mock()
        factory = Mock()
        pins = []

        def pin(number, **kwargs):
            result = Mock()
            if number == self.settings.data["display"]["backlight_pin"]:
                result.on.side_effect = lambda: events.append("backlight on")
            pins.append(result)
            return result

        gpiozero = Mock()
        gpiozero.OutputDevice.side_effect = pin
        lgpio = Mock()
        lgpio.LGPIOFactory.side_effect = lambda: (events.append("claim GPIO"), factory)[1]
        spidev = Mock()
        spidev.SpiDev.return_value = spi
        spi.writebytes2.side_effect = lambda payload: events.append("frame sent") if len(payload) == 153600 else None
        payload = bytes(153600)
        with patch.dict(sys.modules, {"spidev": spidev, "gpiozero": gpiozero, "gpiozero.pins.lgpio": lgpio}), patch("app.display_handoff.release_boot_splash", side_effect=lambda: events.append("handoff")), patch("app.hardware.time.sleep"):
            display = ST7789(self.settings, initial_payload=payload)
            self.assertEqual(events, ["handoff", "claim GPIO", "frame sent", "backlight on"])
            display.close()
        for output in pins:
            output.close.assert_called_once()
        spi.close.assert_called_once()
        factory.close.assert_called_once()

    def test_device_wait_is_bounded_and_requires_permissions(self):
        with patch("app.splash.os.access", return_value=False), patch("app.splash.time.monotonic", side_effect=[0, 0, 11]), patch("app.splash.time.sleep") as sleep:
            with self.assertRaisesRegex(TimeoutError, "SPI/GPIO"):
                wait_for_display()
            sleep.assert_called_once_with(.05)
        with patch("app.splash.os.access", return_value=True), patch("app.splash.time.sleep") as sleep:
            wait_for_display()
            sleep.assert_not_called()

    def test_splash_bypasses_sysinit_and_does_not_restart_after_handoff(self):
        unit = render_unit("/home/pi/my project%", "pi", "/usr/bin/python3", splash=True)
        self.assertIn("DefaultDependencies=no", unit)
        self.assertIn("WantedBy=sysinit.target", unit)
        self.assertIn("Before=alfa.service shutdown.target", unit)
        self.assertIn('RequiresMountsFor=/usr "/home/pi/my project%%" "/usr/bin/python3"', unit)
        self.assertIn("Restart=no", unit)
        self.assertIn("Type=notify", unit)
        self.assertNotIn("PrivateTmp", unit)  # Would add a wait for tmpfiles setup.
        for delayed_target in ("sound.target", "local-fs.target", "basic.target", "network-online.target"):
            self.assertNotIn(delayed_target, unit)
        normal = render_unit("/home/pi/project", "pi", "/usr/bin/python3")
        self.assertIn("After=local-fs.target sound.target alfa-splash.service", normal)
        self.assertNotIn("Requires=alfa-splash.service", normal)
        self.assertNotIn("Wants=alfa-splash.service", normal)

    def test_boot_entry_point_does_not_import_player_audio_or_adc_tools(self):
        result = subprocess.run([sys.executable, "-c", "import sys; import app.splash; assert not any(name in sys.modules for name in ('app.app', 'app.audio', 'app.buttons', 'smbus2'))"], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
