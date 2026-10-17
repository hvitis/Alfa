"""The app reads one complete configuration for every runtime entry point."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from app.config import ROOT, Settings


class ConfigTests(unittest.TestCase):
    def test_default_reads_only_config_json_and_ignores_old_settings_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = json.loads((ROOT / 'config.json').read_text())
            (root / 'config.json').write_text(json.dumps(data))
            # Stale files on an existing Pi must never override the single config.
            for name in ('settings.json', 'config.alphabet.json', 'config.standalone.json'):
                (root / name).write_text('invalid old JSON')
            original = Path.read_text
            reads = []
            def read(path, *args, **kwargs):
                reads.append(path)
                return original(path, *args, **kwargs)
            with patch.object(Path, 'read_text', autospec=True, side_effect=read):
                settings = Settings.load(root=root)
            self.assertEqual(reads, [root / 'config.json'])
            self.assertEqual(settings.data, data)
            self.assertTrue(settings.data['letter_drawing']['enabled'])
            self.assertTrue(settings.data['animations']['enabled'])

    def test_explicit_config_is_a_complete_replacement_and_never_reads_the_default(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            custom = root / 'device.json'
            data = json.loads((ROOT / 'config.json').read_text())
            data['lesson']['letters'] = ['Ż', 'A']
            custom.write_text(json.dumps(data))
            (root / 'config.json').write_text('invalid default JSON')
            settings = Settings.load(custom, root=root)
            self.assertEqual(settings.data['lesson']['letters'], ['Ż', 'A'])
            self.assertEqual(settings.path('images', 'prepared'), (root / 'media/alphabet').resolve())
            custom.write_text(json.dumps({'lesson': {'letters': ['A']}}))
            with self.assertRaisesRegex(ValueError, 'all sections'):
                Settings.load(custom, root=root)

    def test_checkout_has_one_runtime_config(self):
        self.assertEqual({path.name for path in ROOT.glob('config*.json')}, {'config.json'})
        self.assertFalse((ROOT / 'settings.json').exists())


if __name__ == '__main__':
    unittest.main()
