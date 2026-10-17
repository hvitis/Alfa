from tests.support import photo_settings
import copy
import io
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from app.app import doctor, main
from app.config import ROOT, Settings
from app.media import atomic_json, image_sources, prepare_images


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.settings = photo_settings(self.root)
        shutil.copytree(ROOT / "media/images", self.root / "media/images")
        (self.root / "sounds").mkdir()

    def test_git_checkout_without_original_images_uses_bundled_photos_without_rewriting(self):
        self.assertFalse((self.root / "imgs").exists())
        files, prepared_only = image_sources(self.settings)
        self.assertTrue(prepared_only)
        self.assertEqual(len(files), 6)
        before = {p.name: p.read_bytes() for p in files}
        self.assertEqual(prepare_images(self.settings), files)
        self.assertEqual(prepare_images(self.settings, force=True), files)
        self.assertEqual({p.name: p.read_bytes() for p in files}, before)
        with patch("app.app.shutil.which", return_value="/tool"), redirect_stdout(io.StringIO()) as output:
            self.assertEqual(doctor(self.settings, simulate=True), 0)
        self.assertIn("6 prepared photos", output.getvalue())

    def test_clone_player_preview_starts_without_imgs_or_hardware(self):
        with patch("app.app.Settings.load", return_value=self.settings), patch("app.app.adc_resource", side_effect=AssertionError("ADC accessed")):
            self.assertEqual(main(["--simulate", "player", "--once", "--no-audio"]), 0)
        with Image.open(self.settings.state / "preview/current.png") as frame:
            self.assertEqual(frame.size, (240, 320))

    def test_original_photos_take_priority_over_bundled_images(self):
        (self.root / "imgs").mkdir()
        original = self.root / "imgs/new.png"
        Image.new("RGB", (20, 20), "green").save(original)
        files, fallback = image_sources(self.settings)
        self.assertFalse(fallback)
        self.assertEqual(files, [original.resolve()])
        self.assertEqual(len(prepare_images(self.settings)), 1)

    def test_incomplete_or_wrong_size_prepared_images_are_reported_before_display_start(self):
        first = self.root / "media/images/000-illustration_0.png"
        first.unlink()
        with self.assertRaisesRegex(ValueError, "Cannot use prepared photos"):
            prepare_images(self.settings)
        Image.new("RGB", (320, 240)).save(first)
        with self.assertRaisesRegex(ValueError, "display needs"):
            prepare_images(self.settings)

    def test_manifest_cannot_select_a_file_outside_prepared_directory(self):
        manifest = self.root / "media/images/manifest.json"
        atomic_json(manifest, {"items": [{"file": "../../outside.png"}]})
        with self.assertRaisesRegex(ValueError, "filename"):
            prepare_images(self.settings)

    def test_doctor_reports_missing_i2c_and_delays_calibration(self):
        with patch("app.app.importlib.util.find_spec", return_value=object()), patch("app.app.shutil.which", return_value="/tool"), patch("app.app.os.access", side_effect=lambda path, mode: str(path) != "/dev/i2c-1"), patch("app.app.audio_device", return_value="MAX98357A"), patch("app.app.adc_resource", side_effect=FileNotFoundError("/dev/i2c-1")), redirect_stdout(io.StringIO()) as output:
            self.assertEqual(doctor(self.settings), 1)
        text = output.getvalue()
        self.assertIn("6 prepared photos", text)
        self.assertIn("sudo raspi-config nonint do_i2c 0", text)
        self.assertIn("NEXT  Fix the ADC / I2C failures", text)


if __name__ == "__main__":
    unittest.main()
