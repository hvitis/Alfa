from tests.support import photo_settings
import copy
import json
import itertools
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from app.audio import audio_device
from app.buttons import Debouncer, calibrate, calibration_from_samples, classify, load_calibration
from app.config import ROOT, Settings
from app.hardware import ADS1x15, ST7789, adc_voltage, rgb565
from app.media import atomic_json, fit_image, prepare_images
from app.ui import Gallery
from app.app import Keyboard


class MediaTests(unittest.TestCase):
    def test_rgb565_primary_colors_and_byte_order(self):
        image = Image.new("RGB", (3, 1))
        image.putdata([(255, 0, 0), (0, 255, 0), (0, 0, 255)])
        self.assertEqual(rgb565(image), bytes.fromhex("f80007e0001f"))

    def test_contain_preserves_whole_image_and_flattens_transparency(self):
        image = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
        image.putpixel((0, 0), (255, 0, 0, 255))
        result = fit_image(image, (240, 320))
        self.assertEqual(result.mode, "RGB")
        self.assertEqual(result.size, (240, 320))
        self.assertEqual(result.getpixel((120, 160)), (255, 255, 255))
        self.assertEqual(result.getpixel((120, 10)), (255, 255, 255))
        self.assertGreater(result.getpixel((0, 40))[0], 200)

    def test_preparation_rebuilds_after_source_changes_and_ignores_stale_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "imgs").mkdir()
            Image.new("RGB", (20, 20), "red").save(root / "imgs/photo.png")
            settings = photo_settings(root)
            paths = prepare_images(settings)
            self.assertEqual(len(paths), 1)
            modified = paths[0].stat().st_mtime_ns
            self.assertEqual(prepare_images(settings)[0].stat().st_mtime_ns, modified)
            Image.new("RGB", (20, 20), "blue").save(root / "imgs/photo.png")
            with Image.open(prepare_images(settings)[0]) as image:
                self.assertEqual(image.getpixel((120, 160)), (0, 0, 255))
            Image.new("RGB", (240, 320), "green").save(paths[0].parent / "stale.png")
            self.assertEqual(len(prepare_images(settings)), 1)

    def test_gallery_wraps_and_first_last_buttons(self):
        gallery = Gallery([Path("a.png"), Path("b.png"), Path("c.png")])
        gallery.navigate("left")
        self.assertEqual(gallery.index, 2)
        gallery.navigate("right")
        self.assertEqual(gallery.index, 0)
        gallery.navigate("down")
        self.assertEqual(gallery.index, 2)
        gallery.navigate("up")
        self.assertEqual(gallery.index, 0)


class ButtonTests(unittest.TestCase):
    def test_mapping_uses_chosen_case_actions_for_horizontal_vertical_and_reversed_boards(self):
        for voltages in ((2.5, 0, .3, .6, 1, 1.6), (2.5, .6, 1, .3, 0, 1.6),
                         (2.5, .3, 0, 1, .6, 1.6)):
            with tempfile.TemporaryDirectory() as directory:
                settings = Settings(Path(directory), copy.deepcopy(Settings.load().data))
                samples = iter(voltages)
                adc = type('ADC', (), {'read_voltage': lambda self: self.voltage})()
                def choose_button(_):
                    adc.voltage = next(samples)
                ticks = itertools.count(step=.01)
                with patch('builtins.input', side_effect=choose_button), \
                     patch('app.buttons.time.monotonic', side_effect=lambda: next(ticks)), \
                     patch('app.buttons.time.sleep'), patch('sys.stdout', new_callable=io.StringIO):
                    calibrate(adc, settings)
                states = load_calibration(settings)
                for name, voltage in zip(('idle', 'left', 'right', 'up', 'down', 'center'), voltages):
                    self.assertEqual(classify(voltage, states), name)

    def samples(self):
        return {name: [value + 0.001 * (i % 3) for i in range(15)] for name, value in
                zip(("idle", "left", "right", "up", "down", "center"), (2.5, 0.0, 0.3, 0.6, 1.0, 1.6))}

    def test_calibration_identifies_all_states_and_rejects_transition_voltage(self):
        states = calibration_from_samples(self.samples())
        for name, state in states.items():
            self.assertEqual(classify(state["voltage"], states), name)
        self.assertIsNone(classify(1.3, states))
        self.assertIsNone(classify(float("nan"), states))

    def test_calibration_rejects_duplicate_and_unstable_keys(self):
        samples = self.samples()
        samples["left"] = samples["right"]
        with self.assertRaisesRegex(ValueError, "overlaps"):
            calibration_from_samples(samples)
        samples = self.samples()
        samples["center"] = [1.0, 2.1] * 10
        with self.assertRaisesRegex(ValueError, "unstable"):
            calibration_from_samples(samples)

    def test_debounce_requires_idle_and_prevents_repeat_or_transient_keys(self):
        button = Debouncer(0.08)
        self.assertIsNone(button.update("right", 0))
        self.assertIsNone(button.update("right", 0.2))  # Held during startup.
        button.update("idle", 0.3)
        button.update("idle", 0.5)
        button.update("left", 0.6)
        self.assertIsNone(button.update("idle", 0.62))  # Bounce.
        button.update("left", 0.7)
        self.assertEqual(button.update("left", 0.9), ("press", "left"))
        self.assertIsNone(button.update("left", 1.1))
        button.update("right", 1.2)
        self.assertIsNone(button.update("right", 1.4))  # No stable release.
        button.update("idle", 1.5)
        self.assertEqual(button.update("idle", 1.7), ("release", "left"))
        button.update("right", 1.8)
        self.assertEqual(button.update("right", 2.0), ("press", "right"))

    def test_adc_change_requires_new_calibration(self):
        from app.buttons import adc_identity
        with tempfile.TemporaryDirectory() as directory:
            settings = Settings(Path(directory), copy.deepcopy(Settings.load().data))
            atomic_json(settings.state / "buttons.json", {"version": 1, "adc": adc_identity(settings), "states": calibration_from_samples(self.samples())})
            self.assertEqual(len(load_calibration(settings)), 6)
            settings.data["adc"]["model"] = "ads1015"
            with self.assertRaisesRegex(ValueError, "changed"):
                load_calibration(settings)


class HardwareTests(unittest.TestCase):
    def test_keyboard_keeps_split_arrow_sequence_until_complete(self):
        keyboard = Keyboard()
        keyboard.saved, keyboard.buffer = True, ""
        with patch("app.app.select.select", return_value=([1], [], [])), patch("app.app.os.read", side_effect=[b"\x1b", b"[", b"D", b"q"]):
            self.assertEqual(keyboard.read(), "")
            self.assertEqual(keyboard.read(), "")
            self.assertEqual(keyboard.read(), "a")
            self.assertEqual(keyboard.read(), "q")

    def test_adc_scaling_for_both_chips_and_signed_noise(self):
        self.assertAlmostEqual(adc_voltage(0x4000, "ads1115"), 2.048)
        self.assertAlmostEqual(adc_voltage(0x4000, "ads1015"), 2.048)
        self.assertAlmostEqual(adc_voltage(0xFFF0, "ads1015"), -0.002)
        self.assertAlmostEqual(adc_voltage(0xFFFF, "ads1115"), -0.000125)

    def test_adc_bus_uses_a0_single_shot_big_endian_and_detects_high_voltage(self):
        class Bus:
            raw = 0x4000
            writes = []
            def write_i2c_block_data(self, address, register, data):
                self.writes.append((address, register, data))
            def read_i2c_block_data(self, address, register, length):
                return [0xC3, 0x83] if register == 1 else [self.raw >> 8, self.raw & 255]
            def close(self):
                pass
        bus = Bus()
        adc = ADS1x15(Settings.load(), bus)
        self.assertAlmostEqual(adc.read_voltage(), 2.048)
        self.assertEqual(bus.writes[-1], (0x48, 1, [0xC3, 0x83]))
        bus.raw = 0x7FFF
        with self.assertRaisesRegex(RuntimeError, "divider"):
            adc.read_voltage()

    def test_display_window_and_frame_bytes_match_panel(self):
        class SPI:
            payload = None
            def writebytes2(self, data):
                self.payload = data
        class Pin:
            def on(self):
                pass
        display = ST7789.__new__(ST7789)
        display.cfg = {"rotation": 0}
        display.size = (240, 320)
        display.spi, display.dc = SPI(), Pin()
        commands = []
        display.command = lambda command, data=None: commands.append((command, data))
        display.show(Image.new("RGB", (240, 320), "red"))
        self.assertEqual(commands, [(0x2A, [0, 0, 0, 239]), (0x2B, [0, 0, 1, 63]), (0x2C, None)])
        self.assertEqual(len(display.spi.payload), 240 * 320 * 2)
        self.assertEqual(display.spi.payload[:2], bytes.fromhex("f800"))

    def test_landscape_rotates_to_native_frame_size(self):
        class Pin:
            def on(self):
                pass
        class SPI:
            def writebytes2(self, data):
                self.payload = data
        display = ST7789.__new__(ST7789)
        display.cfg, display.size = {"rotation": 90}, (320, 240)
        display.dc, display.spi = Pin(), SPI()
        display.command = lambda *args: None
        with patch("app.hardware.rgb565", wraps=rgb565) as encoder:
            display.show(Image.new("RGB", display.size, "blue"))
            self.assertEqual(encoder.call_args.args[0].size, (240, 320))

    def test_configuration_rejects_backlight_on_audio_clock(self):
        settings = Settings.load()
        settings.data["display"]["backlight_pin"] = 18
        with self.assertRaisesRegex(ValueError, "conflict"):
            settings.validate()

    def test_named_audio_card_excludes_hdmi_and_rejects_ambiguity(self):
        listing = "card 0: vc4hdmi [HDMI], device 0: HDMI\ncard 2: sndrpimax98357a [MAX98357A], device 0: HiFi\n"
        self.assertEqual(audio_device(listing=listing), "plughw:CARD=sndrpimax98357a,DEV=0")
        with self.assertRaises(ValueError):
            audio_device(listing="card 0: vc4hdmi [HDMI], device 0: HDMI")
        with self.assertRaises(ValueError):
            audio_device(listing=listing + "card 3: second [MAX98357A], device 0: HiFi\n")


if __name__ == "__main__":
    unittest.main()
