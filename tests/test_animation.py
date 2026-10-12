import copy
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from moomin.animation import CharacterAnimation
from moomin.app import run_gallery
from moomin.audio import StreamingAudioPlayer
from moomin.config import ROOT, Settings
from moomin.hardware import ST7789, rgb565
from moomin.player import PlayerSession


class AnimationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.now = 100.0
        self.animation = CharacterAnimation(ROOT / "media/animations", clock=lambda: self.now)
        self.settings = Settings(self.root, copy.deepcopy(Settings.load().data))
        self.audio = StreamingAudioPlayer(self.settings, simulate=True)
        self.addCleanup(self.audio.close)
        self.photos = [self.root / f"{index}.png" for index in range(2)]
        for path, color in zip(self.photos, ("red", "blue")):
            Image.new("RGB", (240, 320), color).save(path)
        self.session = PlayerSession(self.photos, [], self.audio, fullscreen=True)
        self.session.animation = self.animation

    def test_top_and_bottom_show_matching_characters_without_changing_letter_or_volume(self):
        for button, name in (("up", "listening"), ("down", "speaking")):
            self.session.action(button)
            self.assertEqual(self.animation.active, name)
            self.assertEqual(self.session.gallery.index, 0)
            self.assertEqual(self.audio.volume, .2)
            with Image.open(ROOT / f"media/animations/{name}/frame-00.png") as expected:
                self.assertEqual(self.session.frame().tobytes(), expected.tobytes())

    def test_two_cycles_at_five_fps_end_on_original_letter_card(self):
        self.session.action("down")
        self.assertEqual(self.animation.index(), 0)
        key = self.session.render_key()
        self.now += .1
        self.assertEqual(self.session.render_key(), key)
        for tick in range(1, 8):
            self.now = 100 + tick / 5 + .001
            self.assertEqual(self.animation.index(), tick % 4)
        self.now = 101.601
        self.assertEqual(self.session.frame().tobytes(), Image.new("RGB", (240, 320), "red").tobytes())
        self.assertIsNone(self.animation.active)
        self.assertEqual(self.animation.payloads, [])

    def test_navigation_interrupts_animation_and_preserves_wraparound(self):
        self.session.action("up")
        self.session.action("left")
        self.assertEqual(self.session.gallery.index, 1)
        self.assertIsNone(self.animation.active)
        self.assertEqual(self.session.frame().getpixel((0, 0)), (0, 0, 255))
        self.session.action("down")
        self.session.action("right")
        self.assertEqual(self.session.gallery.index, 0)
        self.assertIsNone(self.animation.active)

    def test_new_press_restarts_or_switches_the_loop_immediately(self):
        self.session.action("down")
        self.now += .401
        self.assertEqual(self.animation.index(), 2)
        self.session.action("up")
        self.assertEqual(self.animation.index(), 0)
        self.assertEqual(self.animation.active, "listening")
        serial = self.animation.serial
        self.now += .601
        self.session.action("up")
        self.assertEqual(self.animation.index(), 0)
        self.assertEqual(self.animation.serial, serial + 1)

    def test_bundled_png_raw_and_wire_frames_match_exactly(self):
        for name, frames in self.animation.clips.items():
            self.assertEqual(len(frames), 4)
            self.animation.start(name)
            self.assertEqual(sum(map(len, self.animation.payloads)), 614400)
            for frame in frames:
                with Image.open(self.animation.directory / frame["png"]) as png:
                    self.assertEqual(png.mode, "RGB")
                    self.assertEqual(png.size, (240, 320))
                    expected = rgb565(png)
                wire = (self.animation.directory / frame["bin"]).read_bytes()
                raw = (self.animation.directory / frame["raw"]).read_bytes()
                self.assertEqual(wire, expected)
                self.assertEqual(raw[0::2], wire[1::2])
                self.assertEqual(raw[1::2], wire[0::2])

    def test_rotated_wire_payload_preserves_pixel_words(self):
        animation = CharacterAnimation(ROOT / "media/animations", rotation=180)
        animation.start("speaking")
        with Image.open(ROOT / "media/animations/speaking/frame-00.png") as png:
            expected = rgb565(png.rotate(180))
        self.assertEqual(animation.wire_frame(), expected)

    def test_display_sends_precompiled_bytes_and_rejects_truncated_payload_before_spi(self):
        self.animation.start("speaking")
        payload = self.animation.wire_frame()
        display = ST7789.__new__(ST7789)
        from unittest.mock import Mock
        display.spi, display.dc, display.command = Mock(), Mock(), Mock()
        with patch("moomin.hardware.rgb565", side_effect=AssertionError("Unexpected runtime encoding")):
            display.show_rgb565(payload)
        display.spi.writebytes2.assert_called_once_with(payload)
        self.assertEqual(display.command.call_args_list[-1].args, (0x2C,))
        display.command.reset_mock()
        with self.assertRaisesRegex(ValueError, "153600"):
            display.show_rgb565(payload[:-1])
        display.command.assert_not_called()

    def test_compiler_has_known_primary_color_byte_order(self):
        source, destination = self.root / "source", self.root / "compiled"
        source.mkdir()
        for name in ("listening", "speaking"):
            Image.new("RGB", (480, 640), "red").save(source / f"{name}-atlas.png")
        spec = importlib.util.spec_from_file_location("prepare_animations", ROOT / "scripts/prepare-animations.py")
        compiler = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(compiler)
        compiler.prepare(source, destination)
        self.assertEqual((destination / "speaking/frame-00.raw").read_bytes(), bytes.fromhex("00f8") * (240 * 320))
        self.assertEqual((destination / "speaking/frame-00.bin").read_bytes(), bytes.fromhex("f800") * (240 * 320))

    def test_alphabet_configuration_requires_portrait_and_hardware_fps(self):
        settings = Settings.load(ROOT / "config.alphabet.json")
        self.assertTrue(settings.data["animations"]["enabled"])
        for rotation in (90, 270):
            settings.data["display"]["rotation"] = rotation
            with self.assertRaisesRegex(ValueError, "portrait"):
                settings.validate()
        settings.data["display"]["rotation"] = 0
        settings.data["animations"]["fps"] = 12
        with self.assertRaisesRegex(ValueError, "FPS"):
            settings.validate()

    def test_keyboard_loop_uses_raw_frames_and_limits_transfers_with_spi_time(self):
        settings = Settings.load(ROOT / "config.alphabet.json")
        sent, pngs = [], []
        elapsed = [100.0]
        class Display:
            closed = False
            def show(self, frame): pngs.append(frame)
            def show_rgb565(self, payload):
                sent.append((elapsed[0], payload))
                elapsed[0] += .123  # Native full-screen transfer at 10 MHz.
            def close(self): self.closed = True
        display = Display()
        class Keyboard:
            calls = 0
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self):
                self.calls += 1
                return "w" if self.calls == 1 else "q" if self.calls >= 100 else ""
        def make_animation(*args):
            return CharacterAnimation(*args, clock=lambda: elapsed[0])
        def sleep(seconds): elapsed[0] += seconds
        with patch("moomin.app.prepare_images", return_value=self.photos), patch("moomin.app.display_resource", side_effect=lambda stack, *args: (stack.callback(display.close), display)[1]), patch("moomin.app.CharacterAnimation", side_effect=make_animation), patch("moomin.app.Keyboard", Keyboard), patch("moomin.app.time.monotonic", side_effect=lambda: elapsed[0]), patch("moomin.app.time.sleep", side_effect=sleep):
            run_gallery(settings, simulate=True, no_audio=True)
        self.assertTrue(display.closed)
        self.assertGreaterEqual(len(sent), 4)
        self.assertTrue(all(b[0] - a[0] >= .2 for a, b in zip(sent, sent[1:])))
        self.assertGreaterEqual(len(pngs), 2, "Initial and restored letter cards must reach the display")
        self.assertEqual(pngs[-1].tobytes(), pngs[0].tobytes())
        self.assertEqual(sent[0][1], (ROOT / "media/animations/listening/frame-00.bin").read_bytes())


if __name__ == "__main__":
    unittest.main()
