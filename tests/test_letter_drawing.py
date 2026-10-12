import copy
import importlib.util
import json
import tempfile
import unittest
import wave
from pathlib import Path
from unittest.mock import Mock, patch

from PIL import Image, ImageChops

from moomin.animation import CharacterAnimation
from moomin.app import run_gallery
from moomin.audio import LetterRecordings, StreamingAudioPlayer
from moomin.config import ROOT, Settings
from moomin.frames import AnimationPresenter
from moomin.hardware import ST7789, rgb565
from moomin.letter_lesson import LetterLesson
from moomin.letter_paths import LetterCatalog, Stroke
from moomin.player import PlayerSession


class LetterDrawingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = LetterCatalog(ROOT / "assets/letter-drawing/letters.json")

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.now = 100.0
        self.lesson = LetterLesson(self.catalog, clock=lambda: self.now)
        self.settings = Settings(self.root, copy.deepcopy(Settings.load().data))
        self.audio = StreamingAudioPlayer(self.settings, simulate=True)
        self.addCleanup(self.audio.close)
        self.paths = [self.root / name for name in ("000-00-A.png", "031-31-Ż.png")]
        for path, color in zip(self.paths, ("red", "blue")):
            Image.new("RGB", (240, 320), color).save(path)
        self.session = PlayerSession(self.paths, [], self.audio, fullscreen=True)
        self.session.animation = CharacterAnimation(ROOT / "media/animations", clock=lambda: self.now)
        self.session.drawing = self.lesson
        self.session.letter_recordings = LetterRecordings(self.catalog, self.root, self.audio)

    def recording(self, letter, seconds=1):
        path = self.catalog.audio_path(self.root, letter)
        path.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(path), "wb") as recording:
            recording.setnchannels(2)
            recording.setsampwidth(2)
            recording.setframerate(48000)
            recording.writeframes(bytes(round(seconds * 48000) * 4))
        return path

    def test_all_32_cards_have_correct_order_and_reproducible_lightweight_data(self):
        characters = json.loads((ROOT / "assets/alphabet/characters.json").read_text())
        self.assertEqual(list(self.catalog.letters), characters["alphabet"])
        self.assertEqual(len(self.catalog.letters), 32)
        for card in characters["characters"]:
            self.assertEqual(self.catalog.letter_for_image(card["prepared"]), card["letter"])
            self.assertEqual(self.catalog.letter_for_image(card["master"]), card["letter"])
            self.assertGreaterEqual(len(self.catalog.strokes(card["letter"])), 1)
        self.assertIsNone(self.catalog.letter_for_image("holiday.png"))
        self.assertLess((ROOT / "assets/letter-drawing/letters.json").stat().st_size, 8192)
        spec = importlib.util.spec_from_file_location("generate", ROOT / "scripts/generate-letter-data.py")
        script = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(script)
        generated = self.root / "letters.json"
        script.generate(generated)
        self.assertEqual(generated.read_bytes(), (ROOT / "assets/letter-drawing/letters.json").read_bytes())

    def test_variants_reuse_base_and_draw_all_polish_marks_last(self):
        for letter, base in (("Ą", "A"), ("Ć", "C"), ("Ę", "E"), ("Ł", "L"),
                             ("Ń", "N"), ("Ó", "O"), ("Ś", "S"), ("Ź", "Z"), ("Ż", "Z")):
            strokes = self.catalog.strokes(letter)
            original = self.catalog.strokes(base)
            self.assertEqual(strokes[:-1], original)
            self.assertEqual(len(strokes), len(original) + 1)
        self.assertEqual(self.catalog.strokes("Ż")[-1].length, 0)

    def test_interpolation_uses_distance_and_curves_keep_exact_endpoints(self):
        stroke = Stroke.from_commands([["M", 0, 0], ["L", 10, 0], ["L", 10, 30]])
        self.assertEqual(stroke.prefix(.5)[-1], (10, 10))
        self.assertEqual(stroke.prefix(0)[-1], (0, 0))
        self.assertEqual(stroke.prefix(1), stroke.points)
        curve = Stroke.from_commands([["M", 10, 20], ["Q", 40, 90, 80, 20]])
        self.assertEqual(curve.points[-1], (80, 20))
        self.assertGreater(curve.length, 70)
        for bad in ([['L', 1, 2]], [['M', 1, 2]], [['M', 1, 2], ['L', float('nan'), 3]],
                    [['M', 1, 2], ['M', 3, 4]], [['M', 1, 2], ['X', 3, 4]]):
            with self.assertRaises(ValueError): Stroke.from_commands(bad)

    def test_center_draws_selected_card_restarts_and_restores_the_same_image(self):
        self.session.action("right")
        self.session.action("center")
        self.assertEqual(self.lesson.active, "Ż")
        self.assertEqual(self.audio.volume, .2)
        self.assertFalse(self.audio.playing, "Missing custom sound is a silent placeholder")
        self.assertEqual(self.lesson.state()[0], "intro")
        initial_key = self.session.render_key()
        self.now += .1
        self.assertEqual(self.session.render_key(), initial_key)
        self.now = self.lesson.started + self.lesson.timeline[0][0] + .2
        self.assertEqual(self.lesson.state()[0], "draw")
        first_key = self.session.render_key()
        self.now += .06
        self.assertNotEqual(self.session.render_key(), first_key)
        self.session.action("center")
        self.assertEqual(self.lesson.serial, 2)
        self.assertEqual(self.lesson.state()[0], "intro")
        self.now = self.lesson.started + self.lesson.duration + .001
        self.assertEqual(self.session.frame().tobytes(), Image.new("RGB", (240, 320), "blue").tobytes())
        self.assertIsNone(self.lesson.active)
        self.assertIsNone(self.lesson.renderer.guide)

    def test_every_stroke_pause_finish_and_celebration_boundary(self):
        self.lesson.start("Ą")
        origin = self.lesson.started
        for index, (start, end) in enumerate(self.lesson.timeline):
            self.now = origin + start + .001
            self.assertEqual(self.lesson.state()[:3], ("draw", index, index))
            self.now = origin + end + .001
            expected = ("pause", index + 1, index + 1) if index < 3 else ("hold", 4, None)
            self.assertEqual(self.lesson.state()[:3], expected)
        self.now = origin + self.lesson.celebration_start + .01
        self.assertEqual(self.lesson.state()[:3], ("celebrate", 4, None))
        self.now = origin + self.lesson.duration
        self.assertIsNone(self.lesson.frame())

    def test_fireworks_preserve_completed_letter_pixels_for_every_letter(self):
        for letter in self.catalog.letters:
            self.lesson.start(letter)
            self.now = self.lesson.started + self.lesson.draw_end + .01
            completed = self.lesson.frame()
            self.now = self.lesson.started + self.lesson.celebration_start + .5
            celebrating = self.lesson.frame()
            self.assertIsNotNone(ImageChops.difference(completed, celebrating).getbbox())
            ink = tuple(int(self.lesson.renderer.ink[i:i + 2], 16) for i in (1, 3, 5))
            for index, pixel in enumerate(completed.getdata()):
                if pixel == ink:
                    self.assertEqual(celebrating.getdata()[index], ink)

    def test_navigation_and_character_controls_cancel_both_drawing_and_recording(self):
        self.recording("A", seconds=12)
        for button in ("left", "right", "up", "down"):
            self.session.gallery.index = 0
            self.session.action("center")
            self.assertTrue(self.audio.playing)
            self.session.action(button)
            self.assertIsNone(self.lesson.active)
            self.assertFalse(self.audio.playing)
            self.assertEqual(self.audio.volume, .2)
            if button in ("up", "down"):
                self.assertEqual(self.session.animation.active, "listening" if button == "up" else "speaking")

    def test_recording_for_current_letter_plays_in_full_before_fireworks_and_mute_still_draws(self):
        self.recording("Ż", seconds=12)
        self.session.action("right")
        self.session.action("center")
        self.assertTrue(self.audio.playing)
        self.assertEqual(self.audio.duration, 12)
        self.assertEqual(self.lesson.celebration_start, 12)
        self.assertGreater(self.lesson.duration, self.audio.duration)
        self.now = self.lesson.started + 10
        self.assertEqual(self.lesson.state()[0], "hold")
        self.session.letter_recordings.enabled = False
        self.session.action("center")
        self.assertFalse(self.audio.playing)
        self.assertLess(self.lesson.celebration_start, 12)

    def test_region_updates_reconstruct_exact_frames_and_skip_identical_pixels(self):
        canvas = Image.new("RGB", (240, 320))
        areas = []
        class Display:
            def show(self, frame): canvas.paste(frame)
            def show_region(self, frame, box):
                areas.append(frame.width * frame.height)
                canvas.paste(frame, box)
        presenter = AnimationPresenter(Display())
        self.lesson.start("A")
        for tick in range(30):
            self.now = self.lesson.started + .5 + tick / 20
            frame = self.lesson.frame()
            presenter.show(frame)
            self.assertEqual(canvas.tobytes(), frame.tobytes())
        self.assertTrue(areas)
        self.assertLess(max(areas), 240 * 320 / 4)
        before = len(areas)
        presenter.show(frame)
        self.assertEqual(len(areas), before)
        presenter.reset()
        self.assertIsNone(presenter.previous)

    def test_hardware_region_coordinates_and_pixel_rotation_match_full_frame(self):
        for rotation in (0, 90, 180, 270):
            display = ST7789.__new__(ST7789)
            display.size = (320, 240) if rotation in (90, 270) else (240, 320)
            display.cfg = {"rotation": rotation}
            display.command, display.dc, display.spi = Mock(), Mock(), Mock()
            box = (20, 40, 70, 80)
            full = Image.new("RGB", display.size, "black")
            crop = Image.new("RGB", (50, 40), "red")
            crop.putpixel((1, 2), (0, 0, 255))
            full.paste(crop, box)
            display.show_region(crop, box)
            native_box = full.rotate(rotation, expand=True).getbbox()
            left, top, right, bottom = native_box
            display.command.assert_any_call(0x2A, [left >> 8, left & 255, (right - 1) >> 8, (right - 1) & 255])
            display.command.assert_any_call(0x2B, [top >> 8, top & 255, (bottom - 1) >> 8, (bottom - 1) & 255])
            display.spi.writebytes2.assert_called_once_with(rgb565(crop.rotate(rotation, expand=True)))
            with self.assertRaises(ValueError): display.show_region(crop, (-1, 40, 49, 80))
            with self.assertRaises(ValueError): display.show_region(crop, (20, 40, 71, 80))

    def test_real_gallery_loop_draws_with_compiled_cards_and_restores_after_success(self):
        settings = Settings.load(ROOT / "config.alphabet.json")
        elapsed = [100.0]
        events, frames, sessions = [], [], []
        class Display:
            closed = False
            def show(self, frame): events.append("full"); frames.append(frame)
            def show_region(self, frame, box): events.append("region")
            def show_rgb565(self, payload): events.append("wire")
            def close(self): self.closed = True
        display = Display()
        class Keyboard:
            calls = 0
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self):
                self.calls += 1
                return " " if self.calls == 1 else "q" if elapsed[0] > 110 else ""
        class Session(PlayerSession):
            def __init__(self, *args): super().__init__(*args); sessions.append(self)
        def make_lesson(*args, **kwargs): return LetterLesson(*args, **kwargs, clock=lambda: elapsed[0])
        def sleep(seconds): elapsed[0] += seconds
        with patch("moomin.app.prepare_images", return_value=self.paths), patch("moomin.app.prepare_audio", side_effect=AssertionError("Unrelated audio conversion")), patch("moomin.app.display_resource", side_effect=lambda stack, *args: (stack.callback(display.close), display)[1]), patch("moomin.app.Keyboard", Keyboard), patch("moomin.app.PlayerSession", Session), patch("moomin.app.LetterLesson", side_effect=make_lesson), patch("moomin.app.WireFrames") as wire, patch("moomin.app.time.monotonic", side_effect=lambda: elapsed[0]), patch("moomin.app.time.sleep", side_effect=sleep):
            wire.return_value.frame.return_value = bytes(153600)
            run_gallery(settings, simulate=True, no_audio=True, autoplay=True)
        self.assertTrue(display.closed)
        self.assertEqual(events[0], "wire")
        self.assertEqual(events[-1], "wire")
        self.assertIn("full", events)
        self.assertGreater(events.count("region"), 50)
        self.assertEqual(sessions[0].gallery.index, 0)
        self.assertIsNone(sessions[0].drawing.active)

    def test_configuration_rejects_invalid_timing_and_landscape(self):
        settings = Settings.load(ROOT / "config.alphabet.json")
        for key in ("fps", "draw_seconds", "stroke_pause", "intro_seconds", "hold_seconds", "celebration_seconds"):
            for bad in (float("nan"), -1, True):
                value = settings.data["letter_drawing"][key]
                settings.data["letter_drawing"][key] = bad
                with self.assertRaisesRegex(ValueError, "Letter drawing"): settings.validate()
                settings.data["letter_drawing"][key] = value
        settings.data["display"]["rotation"] = 90
        with self.assertRaisesRegex(ValueError, "portrait"): settings.validate()

    def test_physical_center_starts_on_press_even_when_held_then_restarts_on_next_press(self):
        settings = Settings.load(ROOT / "config.alphabet.json")
        elapsed, level, sessions, snapshots = [0.0], ["idle"], [], []
        # The real debouncer receives idle, a >2s hold, release, then a short tap.
        batches = iter(((0, "idle"), (.1, "idle"), (.2, "center"), (.3, "center"),
                        (3, "center"), (3.1, "idle"), (3.2, "idle"),
                        (3.3, "center"), (3.4, "center"), (3.5, "idle"), (3.6, "idle")))
        class Keyboard:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self):
                if sessions:
                    snapshots.append((elapsed[0], sessions[0].drawing.serial, sessions[0].drawing.active))
                try:
                    elapsed[0], level[0] = next(batches)
                except StopIteration:
                    raise KeyboardInterrupt from None
                return ""
        class Session(PlayerSession):
            def __init__(self, *args): super().__init__(*args); sessions.append(self)
        def make_lesson(*args, **kwargs): return LetterLesson(*args, **kwargs, clock=lambda: elapsed[0])
        display = Mock(spec=["show", "close"])
        with patch("moomin.app.prepare_images", return_value=self.paths), patch("moomin.app.display_resource", return_value=display), patch("moomin.app.adc_resource", return_value=Mock()), patch("moomin.app.load_calibration", return_value={}), patch("moomin.app.classify", side_effect=lambda *_: level[0]), patch("moomin.app.Keyboard", Keyboard), patch("moomin.app.PlayerSession", Session), patch("moomin.app.LetterLesson", side_effect=make_lesson), patch("moomin.app.time.monotonic", side_effect=lambda: elapsed[0]), patch("moomin.app.time.sleep"):
            with self.assertRaises(KeyboardInterrupt):
                run_gallery(settings, simulate=False, no_audio=True, standalone=True)
        self.assertIn((.3, 1, "A"), snapshots, "The lesson must start before the button is released")
        self.assertIn((3, 1, "A"), snapshots, "Holding CENTER must not suppress or restart the lesson")
        self.assertIn((3.4, 2, "A"), snapshots)
        self.assertEqual(sessions[0].drawing.serial, 2, "Release must not trigger a second lesson")


if __name__ == "__main__":
    unittest.main()
