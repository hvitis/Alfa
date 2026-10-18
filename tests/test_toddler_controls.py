from tests.support import photo_settings
"""Toddler-proofing: volume cap, hard-to-trigger exit, and button mashing."""
import copy
import io
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import Mock, patch

from PIL import Image

from app.app import run_gallery
from app.audio import StreamingAudioPlayer
from app.buttons import CenterPress, Debouncer, MashGuard, PressGuard
from app.config import Settings
from app.player import PlayerSession
from app.ui import sad_face_frame


class ToddlerControlTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.settings = photo_settings(self.root)
        self.paths = []
        for i, color in enumerate(("red", "blue", "green", "yellow")):
            path = self.root / f"{i}.png"
            Image.new("RGB", (240, 320), color).save(path)
            self.paths.append(path)

    def test_volume_never_exceeds_the_cap_on_any_path(self):
        self.assertEqual(self.settings.data["audio"]["max_volume"], .5)
        audio = StreamingAudioPlayer(self.settings, simulate=True)
        audio.set_volume(.9)
        self.assertEqual(audio.volume, .5)
        audio.set_volume(.3)
        self.assertEqual(audio.volume, .3)
        with self.assertRaises(ValueError):
            audio.set_volume(1.5)
        audio.close()

    def test_config_rejects_a_start_volume_above_the_cap_and_bad_controls(self):
        for section, key, bad in (("audio", "max_volume", 0), ("audio", "max_volume", 1.5), ("audio", "volume", .6),
                                  ("controls", "exit_hold_seconds", 2), ("controls", "exit_hold_seconds", 61),
                                  ("controls", "press_guard_ms", -1), ("controls", "press_guard_ms", 2500)):
            settings = Settings(self.root, copy.deepcopy(self.settings.data))
            settings.data[section][key] = bad
            with self.assertRaises(ValueError, msg=f"{section}.{key}={bad}"):
                settings.validate()
        settings = Settings(self.root, copy.deepcopy(self.settings.data))
        settings.data["controls"]["exit_hold_seconds"] = 0
        settings.validate()
        self.assertEqual((settings.exit_hold, self.settings.exit_hold, self.settings.press_guard), (0, 10, .4))

    def test_press_guard_accepts_one_press_per_interval(self):
        guard = PressGuard(.4)
        accepted = [t for t in (0, .1, .2, .45, .5, .9, 2) if guard.accept(t)]
        self.assertEqual(accepted, [0, .45, .9, 2])

    def test_fifth_press_pauses_until_two_seconds_of_quiet(self):
        guard = MashGuard()
        for t in (0, .2, .4, .6):
            self.assertTrue(guard.accept(t))
            self.assertFalse(guard.blocked(t))
        self.assertFalse(guard.accept(.8))
        self.assertTrue(guard.blocked(2.79))
        self.assertFalse(guard.accept(2.79), "More presses extend the quiet period")
        self.assertTrue(guard.blocked(4.78))
        self.assertTrue(guard.accept(4.8))
        self.assertFalse(guard.blocked(4.8))

    def test_slow_presses_do_not_accumulate_and_mashing_history_is_bounded(self):
        guard = MashGuard()
        for i in range(100):
            self.assertTrue(guard.accept(i * .51))
        for i in range(10000):
            guard.accept(100 + i * .01)
        self.assertEqual(len(guard.presses), 5)
        self.assertTrue(guard.blocked(200))
        self.assertFalse(guard.blocked(202))

    def test_sad_face_replaces_the_card_and_clears_without_another_press(self):
        audio = StreamingAudioPlayer(self.settings, simulate=True)
        self.addCleanup(audio.close)
        session = PlayerSession(self.paths, [], audio, fullscreen=True)
        for index, button in enumerate(("left", "up", "right", "down", "center")):
            session.accept_press(button, index * .1)
        with patch("app.player.time.monotonic", return_value=.5):
            self.assertEqual(session.render_key(), ("buttons-paused",))
            self.assertEqual(session.frame().tobytes(), sad_face_frame((240, 320)).tobytes())
        with patch("app.player.time.monotonic", return_value=2.4):
            self.assertFalse(session.buttons_paused)
            self.assertEqual(session.frame().tobytes(), session.card().tobytes())

    def test_sitting_on_a_button_counts_as_one_press(self):
        debounce = Debouncer(.08)
        events = [debounce.update(state, t / 100) for t, state in
                  [(0, "idle"), (10, "idle")] + [(t, "right") for t in range(20, 520, 5)] + [(530, "idle"), (540, "idle")]]
        presses = [e for e in events if e and e[0] == "press"]
        self.assertEqual(presses, [("press", "right")])

    def test_center_short_release_replays_and_hold_draws_once(self):
        button = CenterPress()
        self.assertIsNone(button.release(0))
        button.press(0)
        self.assertIsNone(button.update(.599))
        self.assertEqual(button.release(.599), "center")
        button.press(1)
        self.assertEqual(button.update(1.6), "draw")
        self.assertIsNone(button.update(3))
        self.assertIsNone(button.release(4), "Long release must not replay the letter")
        button.press(5)
        self.assertEqual(button.release(5.61), "draw", "Release detects a hold even if polling was delayed")
        self.assertIsNone(button.release(6))

    def run_physical(self, batches, standalone=False):
        """Drive run_gallery with scripted (time, button) readings through the real debouncer."""
        elapsed, level, sessions, actions, snapshots = [0.0], ["idle"], [], [], []
        script = iter(batches)

        class Keyboard:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self):
                snapshots.append(elapsed[0])
                try:
                    elapsed[0], level[0] = next(script)
                except StopIteration:
                    raise KeyboardInterrupt from None
                return ""

        class Session(PlayerSession):
            def __init__(self, *args):
                super().__init__(*args)
                sessions.append(self)

            def action(self, button):
                actions.append((elapsed[0], button))
                super().action(button)

        self.physical_sessions = sessions
        self.physical_frames = []
        display = Mock(spec=["show", "close"])
        display.show.side_effect = lambda frame: self.physical_frames.append(frame.copy())
        out = io.StringIO()
        with patch("app.app.prepare_images", return_value=self.paths), patch("app.app.display_resource", return_value=display), \
                patch("app.app.adc_resource", return_value=Mock()), patch("app.app.load_calibration", return_value={}), \
                patch("app.app.classify", side_effect=lambda *_: level[0]), patch("app.app.Keyboard", Keyboard), \
                patch("app.app.PlayerSession", Session), patch("app.app.time.monotonic", side_effect=lambda: elapsed[0]), \
                patch("app.app.time.sleep"), redirect_stdout(out):
            try:
                run_gallery(self.settings, simulate=False, no_audio=True, standalone=standalone)
                finished = "returned"
            except KeyboardInterrupt:
                finished = "still running"
        return finished, actions, snapshots, out.getvalue()

    def test_mashing_right_stops_on_fifth_press_and_recovers_after_quiet(self):
        taps = []
        for k in range(6):
            t = .2 + k * .25
            taps += [(t, "right"), (t + .09, "right"), (t + .1, "idle"), (t + .19, "idle")]
        taps += [(4, "right"), (4.09, "right"), (4.1, "idle"), (4.19, "idle")]
        finished, actions, _, _ = self.run_physical([(0, "idle"), (.1, "idle")] + taps)
        rights = [t for t, b in actions if b == "right"]
        self.assertEqual(len(rights), 3, f"Two moves before the fifth press, plus one after quiet: {rights}")
        self.assertEqual(finished, "still running")
        sad = sad_face_frame((240, 320)).tobytes()
        self.assertIn(sad, [frame.tobytes() for frame in self.physical_frames])
        self.assertNotEqual(self.physical_frames[-1].tobytes(), sad)

    def test_rejected_center_press_cannot_replay_or_exit_during_cooldown(self):
        taps = [(0, "idle"), (.1, "idle")]
        for k, button in enumerate(("right", "left", "up", "down", "center")):
            t = .2 + k * .25
            taps += [(t, button), (t + .09, button), (t + .1, "idle"), (t + .19, "idle")]
        taps += [(4, "center"), (4.09, "center"), (4.1, "idle"), (4.19, "idle")]
        finished, actions, _, _ = self.run_physical(taps)
        self.assertEqual(finished, "still running")
        self.assertEqual([t for t, button in actions if button == "center"], [4.19])

    def test_center_must_be_held_ten_seconds_to_quit(self):
        hold = [(0, "idle"), (.1, "idle"), (.2, "center"), (.3, "center"), (5, "center"), (10.25, "center")]
        finished, _, snapshots, _ = self.run_physical(hold)
        self.assertEqual(finished, "still running", "Holding for 9.95 s must not quit")
        finished, _, snapshots, printed = self.run_physical(hold + [(10.35, "center")])
        self.assertEqual(finished, "returned")
        self.assertIn("CENTER held for 10 seconds", printed)
        self.assertIn("Hold CENTER for 10 seconds", printed)

    def test_service_mode_never_quits_from_a_held_button(self):
        hold = [(0, "idle"), (.1, "idle"), (.2, "center"), (.3, "center"), (20, "center"), (60, "center")]
        finished, _, _, printed = self.run_physical(hold, standalone=True)
        self.assertEqual(finished, "still running")
        self.assertIn("CENTER hold cannot exit", printed)


if __name__ == "__main__":
    unittest.main()
