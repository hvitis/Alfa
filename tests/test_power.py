import copy
from contextlib import redirect_stderr, redirect_stdout
import io
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest
from unittest.mock import Mock, patch

from PIL import Image

from moomin.app import main, run_gallery
from moomin.config import ROOT, Settings
from moomin.power import IDLE_POWEROFF_STATUS, IdleTimer, request_poweroff


class PowerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.settings = Settings(self.root, copy.deepcopy(Settings.load().data))
        self.photo = self.root / "letter.png"
        Image.new("RGB", (240, 320), "white").save(self.photo)

    def run_loop(self, batches, simulate=False, through_main=False, timeout=None, shutdown=None):
        """Drive real input handling with virtual time and closed hardware stubs."""
        clock = [0]
        current = ["idle"]
        closed = []
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
                    clock[0], keys, current[0], audio.playing = next(iterator)
                except StopIteration:
                    raise KeyboardInterrupt from None
                return keys

        with patch("moomin.app.Settings.load", return_value=self.settings), \
             patch("moomin.app.image_sources", return_value=([self.photo], True)), \
             patch("moomin.app.prepare_images", return_value=[self.photo]), \
             patch("moomin.app.prepare_audio", return_value=[]), \
             patch("moomin.app.StreamingAudioPlayer", return_value=audio), \
             patch("moomin.app.ST7789", return_value=display), \
             patch("moomin.app.PreviewDisplay", return_value=display), \
             patch("moomin.app.ADS1x15", return_value=adc), \
             patch("moomin.app.load_calibration", return_value={}), \
             patch("moomin.app.classify", side_effect=lambda *_: current[0]), \
             patch("moomin.app.Keyboard", Keyboard), \
             patch("moomin.app.time.monotonic", side_effect=lambda: clock[0]), \
             patch("moomin.app.time.sleep"), redirect_stdout(io.StringIO()):
            if through_main:
                arguments = ["player", "--fullscreen", "--standalone", "--no-audio"]
                if simulate:
                    arguments.insert(0, "--simulate")
                if timeout is not None:
                    arguments.extend(["--idle-shutdown-seconds", str(timeout)])
                if shutdown is not None:
                    with patch("moomin.app.request_poweroff", side_effect=lambda simulated: shutdown(simulated, closed)):
                        status = main(arguments)
                else:
                    status = main(arguments)
            else:
                status = run_gallery(self.settings, simulate=simulate, fullscreen=True,
                                     standalone=True, no_audio=True, idle_shutdown_seconds=timeout)
        return status, closed

    def test_timeout_is_exact_and_input_resets_it(self):
        timer = IdleTimer(300, 10)
        self.assertFalse(timer.expired(309.99))
        self.assertFalse(timer.expired(310, activity=True))
        self.assertFalse(timer.expired(609.99))
        self.assertTrue(timer.expired(610))

    def test_audio_finishes_before_a_full_five_minute_countdown(self):
        timer = IdleTimer(300, 0)
        self.assertFalse(timer.expired(600, busy=True))
        self.assertFalse(timer.expired(900))
        self.assertFalse(timer.expired(1199.99))
        self.assertTrue(timer.expired(1200))

    def test_real_keyboard_input_defers_shutdown_at_the_deadline(self):
        status, closed = self.run_loop([
            (300, "d", "idle", False), (599, "", "idle", False), (600, "", "idle", False)])
        self.assertEqual(status, IDLE_POWEROFF_STATUS)
        self.assertEqual(closed, ["keyboard", "adc", "audio", "display"])

    def test_debounced_press_held_button_and_release_defer_shutdown(self):
        status, _ = self.run_loop([
            (0, "", "idle", False), (.1, "", "idle", False),
            (299, "", "right", False), (299.1, "", "right", False),
            (700, "", "right", False), (701, "", "idle", False),
            (701.1, "", "idle", False), (1000, "", "idle", False),
            (1001.2, "", "idle", False)])
        self.assertEqual(status, IDLE_POWEROFF_STATUS)

    def test_playback_keeps_the_player_awake_then_starts_a_full_timeout(self):
        status, _ = self.run_loop([
            (300, "", "idle", True), (900, "", "idle", True),
            (901, "", "idle", False), (1200, "", "idle", False),
            (1201, "", "idle", False)])
        self.assertEqual(status, IDLE_POWEROFF_STATUS)

    def test_cli_requests_shutdown_only_after_releasing_hardware(self):
        requests = []
        def shutdown(simulated, closed):
            self.assertFalse(simulated)
            self.assertEqual(closed, ["keyboard", "adc", "audio", "display"])
            requests.append(True)
            return IDLE_POWEROFF_STATUS
        status, _ = self.run_loop([(300, "", "idle", False)], through_main=True, shutdown=shutdown)
        self.assertEqual(status, IDLE_POWEROFF_STATUS)
        self.assertEqual(requests, [True])

    def test_simulation_never_requests_host_shutdown_even_with_service_environment(self):
        with patch.dict(os.environ, {"MOOMIN_IDLE_POWEROFF": "1"}), patch("moomin.power.subprocess.run") as command:
            status, closed = self.run_loop([(300, "", "idle", False)], simulate=True, through_main=True)
        self.assertEqual(status, 0)
        self.assertEqual(closed, ["keyboard", "audio", "display"])
        command.assert_not_called()

    def test_config_and_cli_can_disable_shutdown_and_reject_invalid_timeouts(self):
        self.settings.data["power"]["idle_shutdown_seconds"] = 0
        self.settings.validate()
        timer = IdleTimer(0, 0)
        self.assertFalse(timer.expired(100000))
        for value in (-1, float("nan"), float("inf"), True, "300"):
            self.settings.data["power"]["idle_shutdown_seconds"] = value
            with self.assertRaisesRegex(ValueError, "Idle shutdown"):
                self.settings.validate()
        self.settings.data["power"]["idle_shutdown_seconds"] = 300
        for value in ("-1", "nan", "inf"):
            with patch("moomin.app.Settings.load", return_value=self.settings), redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                self.assertEqual(main(["--simulate", "player", "--idle-shutdown-seconds", value]), 1)

    def test_cli_zero_disables_timeout_even_after_hours_without_input(self):
        with patch("moomin.app.request_poweroff") as shutdown:
            status, _ = self.run_loop([(100000, "", "idle", False)], through_main=True, timeout=0)
        self.assertEqual(status, 0)
        shutdown.assert_not_called()

    def test_poweroff_refuses_other_computers(self):
        with patch("moomin.power.sys.platform", "darwin"), patch("moomin.power.subprocess.run") as command:
            with self.assertRaisesRegex(RuntimeError, "requires a Raspberry Pi"):
                request_poweroff()
        command.assert_not_called()

    def test_service_exit_and_interactive_os_request_are_separate(self):
        with patch("moomin.power.sys.platform", "linux"), \
             patch("moomin.power.Path.exists", return_value=True), \
             patch("moomin.power.Path.read_bytes", return_value=b"Raspberry Pi 3 Model B"), \
             patch("moomin.power.subprocess.run", return_value=Mock(returncode=0)) as command:
            with patch.dict(os.environ, {"MOOMIN_IDLE_POWEROFF": "1"}):
                self.assertEqual(request_poweroff(), IDLE_POWEROFF_STATUS)
                command.assert_not_called()
            with patch.dict(os.environ, {"MOOMIN_IDLE_POWEROFF": "0"}):
                self.assertEqual(request_poweroff(), 0)
                self.assertEqual(command.call_args.args[0], ["/usr/bin/systemctl", "--no-ask-password", "--no-block", "poweroff"])
                command.return_value = Mock(returncode=1, stderr="Access denied")
                with self.assertRaisesRegex(RuntimeError, "Access denied.*install-service"):
                    request_poweroff()

    def test_privileged_helper_ignores_crashes_signals_and_manual_stops(self):
        # Substitute a harmless command into a copy; never call real systemctl.
        calls = self.root / "calls"
        stub = self.root / "systemctl-stub"
        stub.write_text(f"#!/bin/sh\nprintf '%s\\n' \"$@\" > {shlex.quote(str(calls))}\n")
        stub.chmod(0o755)
        source = (ROOT / "scripts/poweroff-on-idle.sh").read_text()
        helper = self.root / "helper.sh"
        helper.write_text(source.replace("/usr/bin/systemctl", shlex.quote(str(stub))))
        cases = [("success", "exited", "0"), ("exit-code", "exited", "1"),
                 ("success", "killed", "TERM"), ("watchdog", "exited", "42"),
                 ("timeout", "exited", "42"), ("", "", "")]
        for result, code, status in cases:
            env = dict(os.environ, SERVICE_RESULT=result, EXIT_CODE=code, EXIT_STATUS=status)
            subprocess.run(["/bin/sh", str(helper)], env=env, check=True)
            self.assertFalse(calls.exists(), (result, code, status))
        env = dict(os.environ, SERVICE_RESULT="success", EXIT_CODE="exited", EXIT_STATUS="42")
        subprocess.run(["/bin/sh", str(helper)], env=env, check=True)
        self.assertEqual(calls.read_text().splitlines(), ["--no-block", "poweroff"])


if __name__ == "__main__":
    unittest.main()
