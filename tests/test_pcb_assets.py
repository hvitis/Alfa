"""A website build must reject stale or altered PCB downloads."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

MODULE_PATH=Path(__file__).resolve().parents[1]/"design/pi3-shield/assets.py"
spec=importlib.util.spec_from_file_location("pcb_assets_under_test",MODULE_PATH)
assets=importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)


class PcbExportFreshnessTests(unittest.TestCase):
    def setUp(self):
        self.temporary=tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root=Path(self.temporary.name)/"design/pi3-shield"
        self.root.mkdir(parents=True)
        for name in assets.SOURCE_NAMES:
            path=self.root/name
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(f"source: {name}\n")
        for name in assets.REQUIRED_OUTPUTS:
            path=self.root/"generated"/name
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(f"export: {name}\n")
        assets.record(self.root)

    def test_complete_snapshot_validates_without_kicad(self):
        self.assertEqual(assets.validate(self.root)["schema"],1)

    def test_changed_routed_board_rejects_old_preview(self):
        path=self.root/"alfa-pi3-shield.kicad_pcb"
        path.write_text(path.read_text()+"moved connector\n")
        with self.assertRaisesRegex(ValueError,"sources changed"):
            assets.validate(self.root)

    def test_changed_configuration_rejects_old_exports(self):
        config=(self.root/"../../config.json").resolve()
        config.write_text('{"audio":{"shutdown_pin":24}}')
        with self.assertRaisesRegex(ValueError,"sources changed"):
            assets.validate(self.root)

    def test_download_tampering_is_detected(self):
        (self.root/"generated/fabrication-draft.zip").write_bytes(b"different board")
        with self.assertRaisesRegex(ValueError,"changed after validation"):
            assets.validate(self.root)

    def test_missing_3d_model_cannot_be_published(self):
        (self.root/"generated/shield.glb").unlink()
        with self.assertRaisesRegex(ValueError,"incomplete"):
            assets.record(self.root)


if __name__=="__main__":unittest.main()
