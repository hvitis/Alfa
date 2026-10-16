import copy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.audio import AudioPlayer
from app.config import Settings


class AudioPlayerTests(unittest.TestCase):
    def test_verbose_playback_records_command_and_successful_exit_without_using_a_shell(self):
        with tempfile.TemporaryDirectory() as directory:
            settings = Settings(Path(directory), copy.deepcopy(Settings.load().data))
            messages = []
            player = AudioPlayer(settings, volume=.1, device="plughw:CARD=max98357a,DEV=0", verbose=True, report=messages.append)
            class Process:
                codes = iter([None, 0])
                def poll(self): return next(self.codes)
            with patch("app.audio.run_tool") as convert, patch("app.audio.subprocess.Popen", return_value=Process()) as spawn:
                player.play(Path("file with spaces.wav"))
                self.assertTrue(player.playing)
                self.assertFalse(player.playing)
                self.assertEqual(player.last_returncode, 0)
                self.assertEqual(spawn.call_args.args[0][:2], ["aplay", "-v"])
                self.assertIs(spawn.call_args.kwargs["stdout"], spawn.call_args.kwargs["stderr"])
                self.assertNotIn("shell", spawn.call_args.kwargs)
                self.assertIn("volume=0.1", convert.call_args.args[0])
                self.assertTrue(any("Playback command" in message for message in messages))
            player.close()

    def test_nonzero_playback_exit_keeps_the_diagnostic_message_and_exit_code(self):
        with tempfile.TemporaryDirectory() as directory:
            settings = Settings(Path(directory), copy.deepcopy(Settings.load().data))
            player = AudioPlayer(settings, device="plughw:CARD=max98357a,DEV=0", report=lambda message: None)
            class Process:
                def poll(self): return 7
            with patch("app.audio.run_tool"), patch("app.audio.subprocess.Popen", return_value=Process()):
                player.play(Path("sound.wav"))
                player.log.write("Device or resource busy")
                with self.assertRaisesRegex(RuntimeError, "aplay exit 7.*resource busy"):
                    _ = player.playing
                self.assertEqual(player.last_returncode, 7)
                self.assertIsNone(player.process)
            player.close()


if __name__ == "__main__":
    unittest.main()
