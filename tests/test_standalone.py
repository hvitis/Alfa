import copy
from contextlib import redirect_stdout
import io
import os
import pwd
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import unittest
from unittest.mock import Mock, patch
import wave

from PIL import Image

from moomin.app import main, run_gallery
from moomin.audio import StreamingAudioPlayer
from moomin.config import ROOT, Settings
from moomin.frames import prepare_wire_images, WireFrames
from moomin.hardware import rgb565
from moomin.media import prepared_audio, atomic_json
from moomin.service import ServiceWatchdog, render_unit


class StandaloneTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.settings = Settings(self.root, copy.deepcopy(Settings.load().data))
        shutil.copytree(ROOT / "media/images", self.root / "media/images")
        (self.root / "imgs").mkdir()
        Image.new("RGB", (20, 20), "red").save(self.root / "imgs/source.png")
        self.audio_dir = self.root / "media/sounds/full"
        self.audio_dir.mkdir(parents=True)
        self.sound = self.audio_dir / "recording.wav"
        with wave.open(str(self.sound), "wb") as recording:
            recording.setnchannels(2)
            recording.setsampwidth(2)
            recording.setframerate(48000)
            recording.writeframes(bytes(48000 * 4))
        atomic_json(self.audio_dir / "manifest.json", {"items": [{"file": self.sound.name}]})

    def test_prepared_startup_does_not_hash_resize_or_convert_originals(self):
        with patch("moomin.app.Settings.load", return_value=self.settings), patch("moomin.app.prepare_images", side_effect=AssertionError("Original images accessed")), patch("moomin.app.prepare_audio", side_effect=AssertionError("ffmpeg accessed")), redirect_stdout(io.StringIO()):
            self.assertEqual(main(["--simulate", "player", "--prepared-only", "--fullscreen", "--once"]), 0)
        with Image.open(self.settings.state / "preview/current.png") as frame:
            with Image.open(ROOT / "media/images/000-moomin_0.png") as expected:
                self.assertEqual(frame.tobytes(), expected.tobytes())

    def test_prepared_audio_rejects_traversal_and_truncated_wav(self):
        self.assertEqual(prepared_audio(self.settings), [self.sound.resolve()])
        self.sound.write_bytes(self.sound.read_bytes()[:-8])
        with self.assertRaisesRegex(ValueError, "truncated"):
            prepared_audio(self.settings)
        atomic_json(self.audio_dir / "manifest.json", {"items": [{"file": "../outside.wav"}]})
        with self.assertRaisesRegex(ValueError, "filename"):
            prepared_audio(self.settings)

    def test_wire_frames_match_original_pixels_in_both_portrait_rotations(self):
        for rotation in (0, 180):
            self.settings.data["display"]["rotation"] = rotation
            prepare_wire_images(self.settings)
            frames = WireFrames(self.settings)
            photo = self.root / "media/images/000-moomin_0.png"
            with Image.open(photo) as source:
                expected = rgb565(source.rotate(rotation))
            self.assertEqual(frames.frame(photo), expected)
            self.assertIs(frames.frame(photo), frames.payload)
            Image.new("RGB", (240, 320), "blue").save(photo)
            self.assertIsNone(frames.frame(photo), "A stale compiled frame must never hide updated artwork")

    def test_standalone_autoplays_and_survives_quit_key_and_held_center(self):
        display = Mock(spec=["show"])
        sessions = []
        from moomin.player import PlayerSession
        class Session(PlayerSession):
            def __init__(self, *args):
                super().__init__(*args)
                sessions.append(self)
        class Keyboard:
            calls = 0
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self):
                self.calls += 1
                if self.calls >= 4:
                    raise KeyboardInterrupt
                return "q"
        elapsed = [0]
        def clock():
            elapsed[0] += 3
            return elapsed[0]
        debounce = Mock()
        debounce.update.side_effect = [("press", "center"), None, None]
        audio = StreamingAudioPlayer(self.settings, simulate=True)
        with patch("moomin.app.StreamingAudioPlayer", return_value=audio), patch("moomin.app.display_resource", return_value=display), patch("moomin.app.adc_resource", return_value=Mock()), patch("moomin.app.load_calibration", return_value={}), patch("moomin.app.classify", return_value="center"), patch("moomin.app.Debouncer", return_value=debounce), patch("moomin.app.Keyboard", Keyboard), patch("moomin.app.PlayerSession", Session), patch("moomin.app.time.monotonic", side_effect=clock), patch("moomin.app.time.sleep") as sleep, redirect_stdout(io.StringIO()):
            with self.assertRaises(KeyboardInterrupt):
                run_gallery(self.settings, simulate=False, fullscreen=True, standalone=True, prepared_only=True, autoplay=True)
        self.assertEqual(sessions[0].last_action, "Playing")
        self.assertEqual(display.show.call_count, 1, "A static full-screen card does not need audio-progress redraws")
        self.assertEqual(sleep.call_count, 3)
        sleep.assert_called_with(.04)

    def test_service_notifies_local_manager_and_calibration_stays_persistent(self):
        address = str(self.root / "notify.sock")
        with socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM) as server:
            server.bind(address)
            server.settimeout(1)
            with patch.dict(os.environ, {"NOTIFY_SOCKET": address, "WATCHDOG_USEC": "30000000", "WATCHDOG_PID": str(os.getpid()), "MOOMIN_RUNTIME_DIR": str(self.root / "runtime")}), patch("moomin.service.time.monotonic", return_value=100):
                watchdog = ServiceWatchdog()
                watchdog.ready()
                self.assertIn(b"READY=1", server.recv(128))
                self.assertEqual(self.settings.runtime_state, self.root / "runtime")
                self.assertEqual(self.settings.state, self.root / ".state")
            with patch("moomin.service.time.monotonic", return_value=106):
                watchdog.tick()
                self.assertEqual(server.recv(128), b"WATCHDOG=1")

    def test_unit_starts_offline_restarts_and_uses_a_nonroot_hardware_user(self):
        unit = render_unit("/home/pi/Code/my project%", "pi", "/home/pi/Code/my project%/.venv/bin/python")
        self.assertIn("Restart=always", unit)
        self.assertNotIn("ExecStopPost", unit)
        self.assertNotIn("SuccessExitStatus=42", unit)
        self.assertNotIn("RestartPreventExitStatus=42", unit)
        self.assertNotIn("MOOMIN_IDLE_POWEROFF", unit)
        self.assertNotIn("poweroff", unit)
        self.assertIn("WatchdogSec=30", unit)
        self.assertIn("--standalone --prepared-only --autoplay", unit)
        self.assertIn('WorkingDirectory=/home/pi/Code/my project%%\n', unit)
        working_directory = next(line.split("=", 1)[1] for line in unit.splitlines() if line.startswith("WorkingDirectory="))
        self.assertTrue(Path(working_directory).is_absolute(), "systemd checks the literal path, including any quotes")
        self.assertIn('ExecStart="/home/pi/Code/my project%%/.venv/bin/python"', unit)
        self.assertNotIn("network-online", unit)
        with self.assertRaises(ValueError): render_unit("/path", "root", "/python")
        with self.assertRaises(ValueError): render_unit("/path\ninjected", "pi", "/python")
        with self.assertRaises(ValueError): render_unit("relative/path", "pi", "/python")
        with self.assertRaises(ValueError): render_unit("/path\0injected", "pi", "/python")

    @unittest.skipUnless(shutil.which("systemd-analyze"), "systemd validation requires a Linux host")
    def test_rendered_unit_passes_the_real_systemd_parser(self):
        user = pwd.getpwuid(os.getuid()).pw_name
        if user == "root":
            user = "nobody"
        project = self.root / 'project with spaces%'
        project.mkdir()
        unit = self.root / "moomin.service"
        unit.write_text(render_unit(project, user, "/bin/true"))
        result = subprocess.run(["systemd-analyze", "verify", str(unit)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
