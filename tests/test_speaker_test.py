import copy
import io
import json
import tempfile
import unittest
import wave
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest.mock import patch

from moomin.app import main, parser
from moomin.config import Settings
from moomin.speaker_test import inspect_wav, make_test_tone, run_speaker_test
from moomin.ui import speaker_status_frame


class SpeakerTestTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.settings = Settings(Path(self.temp.name), copy.deepcopy(Settings.load().data))
        self.output = io.StringIO()
        self.stdout = redirect_stdout(self.output)
        self.stderr = redirect_stderr(self.output)
        self.stdout.__enter__()
        self.stderr.__enter__()
        self.addCleanup(self.stdout.__exit__, None, None, None)
        self.addCleanup(self.stderr.__exit__, None, None, None)

    def report(self):
        paths = list((self.settings.state / "diagnostics").glob("*.json"))
        self.assertEqual(len(paths), 1)
        return json.loads(paths[0].read_text())

    def test_generated_tone_is_non_silent_stereo_pcm_and_does_not_require_original_sounds(self):
        path = make_test_tone(self.settings, seconds=.2)
        info = inspect_wav(path)
        self.assertEqual((info["rate"], info["channels"], info["bits"]), (48000, 2, 16))
        self.assertAlmostEqual(info["seconds"], .2)
        self.assertGreater(info["peak"], .3)
        self.assertLessEqual(info["peak"], .35)
        self.assertIsNotNone(info["rms_dbfs"])
        self.assertFalse((self.settings.root / "sounds").exists())

    def test_simulation_repeats_and_saves_lcd_frames_without_hardware_access(self):
        with patch("moomin.speaker_test.audio_device", side_effect=AssertionError("hardware access")), patch("moomin.speaker_test.shutil.which", return_value="/tool"):
            code = run_speaker_test(self.settings, simulate=True, with_screen=True, verbose=True, tone=True, repeat=2, pause=0, hold=0)
        self.assertEqual(code, 0)
        report = self.report()
        self.assertEqual(report["outcome"], "simulation_finished")
        self.assertEqual(len(report["playbacks"]), 2)
        self.assertFalse(report["hearing_confirmed"])
        self.assertTrue((self.settings.state / "preview/speaker-finished.png").exists())
        self.assertIn("LRC, BCLK, DIN", self.output.getvalue())
        self.assertIn("PROGRESS", self.output.getvalue())
        self.assertTrue(all(p["aplay_exit"] is None for p in report["playbacks"]))

    def test_playback_failure_releases_audio_and_display_and_records_failed_stage(self):
        class Display:
            closed = False
            names = []
            def __init__(self, *args): pass
            def show(self, frame, name="current"): self.names.append(name)
            def close(self): type(self).closed = True
        class Player:
            closed = False
            def __init__(self, *args, **kwargs): pass
            def play(self, path): raise RuntimeError("aplay exit 1: Device or resource busy")
            def stop(self): pass
            def close(self): type(self).closed = True
        with patch("moomin.speaker_test.ST7789", Display), patch("moomin.speaker_test.AudioPlayer", Player), patch("moomin.speaker_test.audio_device", return_value="plughw:CARD=max98357a,DEV=0"), patch("moomin.speaker_test.shutil.which", return_value="/tool"):
            code = run_speaker_test(self.settings, with_screen=True, tone=True, hold=0)
        self.assertEqual(code, 1)
        self.assertTrue(Display.closed)
        self.assertTrue(Player.closed)
        self.assertIn("speaker-error", Display.names)
        report = self.report()
        self.assertEqual(report["outcome"], "error")
        self.assertEqual(report["failed_stage"], "playback 1/1")
        self.assertIn("resource busy", report["error"])
        self.assertEqual(report["playbacks"], [])

    def test_silent_file_fails_before_opening_an_audio_player(self):
        path = self.settings.root / "silent.wav"
        with wave.open(str(path), "wb") as output:
            output.setnchannels(2)
            output.setsampwidth(2)
            output.setframerate(48000)
            output.writeframes(bytes(1920))
        with patch("moomin.speaker_test.prepare_audio", return_value=[path]), patch("moomin.speaker_test.AudioPlayer") as player, patch("moomin.speaker_test.shutil.which", return_value="/tool"):
            code = run_speaker_test(self.settings, simulate=True, hold=0)
        self.assertEqual(code, 1)
        player.assert_not_called()
        self.assertIn("all samples are zero", self.report()["error"])

    def test_interrupt_stops_player_and_reports_exit_130(self):
        class Player:
            closed = False
            def __init__(self, *args, **kwargs): pass
            def play(self, path): raise KeyboardInterrupt
            def close(self): type(self).closed = True
        with patch("moomin.speaker_test.AudioPlayer", Player), patch("moomin.speaker_test.shutil.which", return_value="/tool"):
            code = run_speaker_test(self.settings, simulate=True, tone=True, hold=0)
        self.assertEqual(code, 130)
        self.assertTrue(Player.closed)
        self.assertEqual(self.report()["outcome"], "interrupted")

    def test_invalid_arguments_do_not_start_hardware_or_create_reports(self):
        for arguments in ({"repeat": 0}, {"volume": float("nan")}, {"pause": -1}, {"hold": float("inf")}, {"track": -1}):
            with self.subTest(arguments=arguments), self.assertRaises(ValueError), patch("moomin.speaker_test.ST7789") as display:
                run_speaker_test(self.settings, **arguments)
                display.assert_not_called()
        self.assertFalse(self.settings.state.exists())

    def test_cli_passes_options_and_propagates_playback_failure(self):
        with patch("moomin.app.run_speaker_test", return_value=1) as runner:
            code = main(["speaker-test", "--with-screen", "--verbose", "--repeat", "3", "--volume", "0.1", "--tone"])
        self.assertEqual(code, 1)
        self.assertTrue(runner.call_args.kwargs["with_screen"])
        self.assertTrue(runner.call_args.kwargs["verbose"])
        self.assertEqual(runner.call_args.kwargs["repeat"], 3)
        self.assertEqual(runner.call_args.kwargs["volume"], .1)
        self.assertFalse(parser().parse_args(["speaker-test"]).with_screen)

    def test_lcd_status_supports_both_orientations_and_long_device_names(self):
        for size in [(240, 320), (320, 240)]:
            frame = speaker_status_frame(size, "Playing 1/3", ["plughw:CARD=sndrpimax98357a,DEV=0", "file with a long name.wav", "Volume: 10%"], .5)
            self.assertEqual(frame.size, size)
            self.assertEqual(frame.mode, "RGB")
            self.assertGreater(len(set(frame.getdata())), 3)


if __name__ == "__main__":
    unittest.main()
