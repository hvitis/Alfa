"""Regression checks: idle time must never stop the player or power off the Pi."""
import copy
from contextlib import redirect_stdout
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

from PIL import Image

from app.app import main
from app.config import Settings
from app.player import PlayerSession


class PowerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.settings = Settings(self.root, copy.deepcopy(Settings.load().data))
        self.photos = [self.root / f"{index}.png" for index in range(2)]
        for photo in self.photos:
            Image.new("RGB", (240, 320), "white").save(photo)

    def run_loop(self, batches, simulate=False, standalone=True):
        clock, closed, consumed, sessions = [0.0], [], [], []
        audio = Mock(spec=["playing", "close"])
        audio.playing = False
        audio.close.side_effect = lambda: closed.append("audio")
        display = Mock(spec=["show", "close"])
        display.close.side_effect = lambda: closed.append("display")
        adc = Mock(spec=["read_voltage", "close"])
        adc.close.side_effect = lambda: closed.append("adc")
        iterator = iter(batches)

        class Keyboard:
            def __enter__(self): return self
            def __exit__(self, *args): closed.append("keyboard")
            def read(self):
                try:
                    now, keys, playing = next(iterator)
                except StopIteration:
                    raise KeyboardInterrupt from None
                consumed.append(now)
                clock[0], audio.playing = now, playing
                return keys

        class Session(PlayerSession):
            def __init__(self, *args):
                super().__init__(*args)
                sessions.append(self)

        arguments = ["player", "--fullscreen", "--no-audio"]
        if simulate:
            arguments.insert(0, "--simulate")
        if standalone:
            arguments.append("--standalone")
        with patch("app.app.Settings.load", return_value=self.settings), \
             patch("app.app.prepare_images", return_value=self.photos), \
             patch("app.app.StreamingAudioPlayer", return_value=audio), \
             patch("app.app.ST7789", return_value=display), \
             patch("app.app.PreviewDisplay", return_value=display), \
             patch("app.app.ADS1x15", return_value=adc), \
             patch("app.app.load_calibration", return_value={}), \
             patch("app.app.classify", return_value="idle"), \
             patch("app.app.Keyboard", Keyboard), \
             patch("app.app.PlayerSession", Session), \
             patch("app.app.time.monotonic", side_effect=lambda: clock[0]), \
             patch("app.app.time.sleep"), \
             patch("app.app.subprocess.run") as command, redirect_stdout(io.StringIO()):
            status = main(arguments)
        command.assert_not_called()
        return status, consumed, closed, sessions[0]

    def test_hardware_remains_running_after_five_minutes_and_a_day_without_input(self):
        batches = [(0, "", False), (300, "", False), (301, "", False),
                   (3600, "", False), (86400, "d", False)]
        status, consumed, closed, session = self.run_loop(batches)
        self.assertEqual(status, 0)
        self.assertEqual(consumed, [batch[0] for batch in batches])
        self.assertEqual(session.gallery.index, 1, "Navigation must still work after long inactivity")
        self.assertEqual(closed, ["keyboard", "adc", "audio", "display"])

    def test_audio_finishing_does_not_start_a_shutdown_countdown(self):
        batches = [(0, "", True), (600, "", True), (601, "", False),
                   (901, "", False), (86400, "d", False)]
        status, consumed, _, session = self.run_loop(batches)
        self.assertEqual(status, 0)
        self.assertEqual(len(consumed), len(batches))
        self.assertEqual(session.gallery.index, 1)

    def test_simulation_ignores_old_service_poweroff_environment(self):
        with patch.dict(os.environ, {"ALFA_IDLE_POWEROFF": "1"}):
            status, consumed, closed, _ = self.run_loop(
                [(300, "", False), (86400, "", False)], simulate=True)
        self.assertEqual(status, 0)
        self.assertEqual(consumed, [300, 86400])
        self.assertEqual(closed, ["keyboard", "audio", "display"])

    def test_manual_quit_still_releases_hardware_after_long_inactivity(self):
        status, consumed, closed, _ = self.run_loop(
            [(300, "", False), (86400, "q", False)], standalone=False)
        self.assertEqual(status, 0)
        self.assertEqual(consumed, [300, 86400])
        self.assertEqual(closed, ["keyboard", "adc", "audio", "display"])

    def test_old_power_override_does_not_reenable_shutdown_or_prevent_startup(self):
        custom = self.root / "old-config.json"
        custom.write_text(json.dumps({"power": {"idle_shutdown_seconds": 300}}))
        settings = Settings.load(custom)
        self.assertNotIn("power", settings.data)


if __name__ == "__main__":
    unittest.main()
