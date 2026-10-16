import copy
import io
import struct
import tempfile
import threading
import unittest
import wave
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from app.app import main, run_gallery
from app.audio import StreamingAudioPlayer, scale_pcm16
from app.config import Settings
from app.media import prepare_audio
from app.player import PlayerSession


class PlayerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.settings = Settings(self.root, copy.deepcopy(Settings.load().data))

    def recording(self, frames=960, name="recording.wav"):
        path = self.root / name
        with wave.open(str(path), "wb") as out:
            out.setnchannels(2)
            out.setsampwidth(2)
            out.setframerate(48000)
            out.writeframes(struct.pack("<hh", 1000, -1000) * frames)
        return path

    def photos(self, size=(240, 320)):
        paths = [self.root / "first.png", self.root / "second.png"]
        for path, color in zip(paths, ("red", "blue")):
            Image.new("RGB", size, color).save(path)
        return paths

    def test_all_five_actions_change_photos_volume_and_play_stop(self):
        audio = StreamingAudioPlayer(self.settings, simulate=True)
        session = PlayerSession(self.photos(), [self.recording(480000)], audio)
        session.action("left")
        self.assertEqual(session.gallery.index, 1)
        session.action("right")
        self.assertEqual(session.gallery.index, 0)
        session.action("up")
        self.assertEqual(audio.volume, .25)
        session.action("center")
        self.assertTrue(audio.playing)
        started = audio._started
        session.action("right")
        session.action("up")
        self.assertEqual((session.gallery.index, audio.volume), (1, .3))
        self.assertEqual(audio._started, started, "Volume and photos must not restart the recording")
        session.action("center")
        self.assertFalse(audio.playing)
        self.assertEqual(audio.position, 0)
        for _ in range(30):
            session.action("down")
        self.assertEqual(audio.volume, 0)
        for _ in range(30):
            session.action("up")
        self.assertEqual(audio.volume, self.settings.data["audio"]["max_volume"])
        self.assertEqual(session.last_action, "Volume 50%")
        audio.close()

    def test_simulation_uses_recording_duration_and_shows_finished_state(self):
        audio = StreamingAudioPlayer(self.settings, simulate=True)
        with patch("app.audio.time.monotonic", return_value=100):
            audio.play(self.recording(48000))
        with patch("app.audio.time.monotonic", return_value=100.5):
            self.assertTrue(audio.playing)
            self.assertEqual(audio.position, .5)
        with patch("app.audio.time.monotonic", return_value=101.1):
            self.assertFalse(audio.playing)
            self.assertEqual(audio.position, 1)
        audio.close()

    def test_live_pcm_stream_changes_volume_without_restart_and_preserves_channels(self):
        audio = StreamingAudioPlayer(self.settings, simulate=True)
        audio.play(self.recording())
        first = audio._mix_block()
        audio.set_volume(.45)
        second = audio._mix_block()
        self.assertEqual(struct.unpack("<hh", first[:4]), (200, -200))
        self.assertEqual(struct.unpack("<hh", second[:4]), (450, -450))
        self.assertFalse(audio.playing)
        self.assertEqual(len(first) + len(second), 960 * 4)
        audio.close()

    def test_close_unblocks_audio_worker_and_releases_pipe_and_log(self):
        audio = StreamingAudioPlayer(self.settings)
        writing, stopped = threading.Event(), threading.Event()
        class Pipe:
            closed = False
            def write(self, payload): writing.set(); stopped.wait(2); return len(payload)
            def close(self): self.closed = True
        class Process:
            stdin = Pipe()
            done = False
            def poll(self): return 0 if self.done else None
            def terminate(self): self.done = True; stopped.set()
            def wait(self, **kwargs): return 0
        process = Process()
        with patch("app.audio.audio_device", return_value="test"), patch("app.audio.subprocess.Popen", return_value=process):
            audio.play(self.recording())
            self.assertTrue(writing.wait(2))
            worker = audio._thread
            audio.close()
            self.assertFalse(worker.is_alive())
            self.assertTrue(process.stdin.closed)
            self.assertIsNone(audio._process)
            self.assertIsNone(audio._log)

    def test_playback_failure_is_reported_to_ui_loop_with_alsa_diagnostic(self):
        audio = StreamingAudioPlayer(self.settings)
        class Pipe:
            def close(self): pass
        class Process:
            stdin = Pipe()
            def poll(self): return 1
            def wait(self, **kwargs): return 1
        with patch("app.audio.audio_device", return_value="test"), patch("app.audio.subprocess.Popen", return_value=Process()):
            audio.play(self.recording())
            audio._thread.join(2)
            with self.assertRaisesRegex(RuntimeError, "aplay exit 1"):
                _ = audio.playing
        audio.close()

    def test_muted_pcm_is_zero_and_volume_rejects_invalid_values(self):
        payload = struct.pack("<hhh", -32768, 32767, 1000)
        self.assertEqual(scale_pcm16(payload, 0), bytes(6))
        self.assertEqual(scale_pcm16(payload, 1), payload)
        self.assertEqual(struct.unpack("<hhh", scale_pcm16(payload, .5)), (-16384, 16383, 500))
        audio = StreamingAudioPlayer(self.settings, simulate=True)
        for value in (-.1, 1.1, float("nan"), float("inf")):
            with self.assertRaises(ValueError): audio.set_volume(value)
        audio.close()

    def test_full_recording_preparation_is_separate_from_speaker_clip(self):
        directory = self.root / "sounds"
        directory.mkdir()
        self.recording(48000, "sounds/source.wav")
        self.settings.data["audio"]["clip_seconds"] = .1
        full = prepare_audio(self.settings, full=True)[0]
        clip = prepare_audio(self.settings)[0]
        with wave.open(str(full)) as recording:
            self.assertEqual(recording.getnframes(), 48000)
        with wave.open(str(clip)) as recording:
            self.assertEqual(recording.getnframes(), 4800)
        self.assertEqual(full.parent, clip.parent / "full")

    def test_screen_layout_supports_both_rotations_and_audio_disabled(self):
        for size in ((240, 320), (320, 240)):
            session = PlayerSession(self.photos(size), [], StreamingAudioPlayer(self.settings, simulate=True))
            session.action("center")
            self.assertEqual(session.last_action, "Audio disabled")
            frame = session.frame()
            self.assertEqual(frame.size, size)
            self.assertEqual(frame.mode, "RGB")
            self.assertGreater(len(set(frame.getdata())), 10)
            session.audio.close()

    def test_keyboard_loop_exercises_controls_and_always_closes_resources(self):
        paths, sound = self.photos(), self.recording(480000)
        frames, sessions = [], []
        class Display:
            closed = False
            def show(self, frame, *args): frames.append(frame)
            def close(self): self.closed = True
        display = Display()
        class Keyboard:
            batches = iter(("d", "w", " ", "s", " ", "q"))
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return next(self.batches)
        class Session(PlayerSession):
            def __init__(self, *args): super().__init__(*args); sessions.append(self)
        with patch("app.app.prepare_images", return_value=paths), patch("app.app.prepare_audio", return_value=[sound]), patch("app.app.PreviewDisplay", return_value=display), patch("app.app.Keyboard", Keyboard), patch("app.app.PlayerSession", Session), patch("app.app.time.sleep"):
            run_gallery(self.settings, simulate=True)
        self.assertEqual(sessions[0].gallery.index, 1)
        self.assertEqual(sessions[0].audio.volume, .2)
        self.assertFalse(sessions[0].audio.playing)
        self.assertTrue(display.closed)
        self.assertGreaterEqual(len(frames), 5)

    def test_fullscreen_preserves_complete_image_during_navigation(self):
        for size in ((240, 320), (320, 240)):
            audio = StreamingAudioPlayer(self.settings, simulate=True)
            session = PlayerSession(self.photos(size), [], audio, fullscreen=True)
            for color in ("red", "blue"):
                expected = Image.new("RGB", size, color)
                frame = session.frame()
                self.assertEqual(frame.size, size)
                self.assertEqual(frame.mode, "RGB")
                self.assertEqual(frame.tobytes(), expected.tobytes())
                session.action("right")
            audio.close()

    def test_fullscreen_cli_option_reaches_the_gallery(self):
        with patch("app.app.run_gallery") as run:
            self.assertEqual(main(["--simulate", "gallery", "--fullscreen", "--once", "--no-audio"]), 0)
            self.assertTrue(run.call_args.args[4])
            self.assertTrue(run.call_args.args[5])

    def test_player_and_gallery_cli_names_use_the_same_player(self):
        for command in ("player", "gallery"):
            with patch("app.app.run_gallery") as run:
                self.assertEqual(main(["--simulate", command, "--once"]), 0)
                self.assertTrue(run.call_args.args[1])
                self.assertTrue(run.call_args.args[3])


if __name__ == "__main__":
    unittest.main()
