"""Manifest edits must reach Piper without overwriting personal recordings."""
import hashlib
import importlib.util
import io
import json
import shutil
import sys
import tempfile
import types
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import Mock, patch

from app.config import ROOT


class PrepareLetterAudioTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        catalog = self.root / 'assets/letter-drawing/letters.json'
        catalog.parent.mkdir(parents=True)
        catalog.write_text(json.dumps({'letters': {
            'A': {'audio': 'media/letter-sounds/00-A.wav'},
            'Ą': {'audio': 'media/letter-sounds/01-Ą.wav'},
        }}))
        self.folder = self.root / 'media/letter-sounds'
        self.folder.mkdir(parents=True)
        self.manifest_path = self.folder / 'manifest.json'
        recordings = {}
        for name, filename, text in [('A', '00-A.wav', None), ('Ą', '01-Ą.wav', 'ą, gąska'),
                                     ('prompt', 'prompt.wav', 'Powiedz jaka to literka.'),
                                     ('praise_1', 'praise_1.wav', None), ('praise_2', 'praise_2.wav', None)]:
            payload = name.encode('utf-8')
            (self.folder / filename).write_bytes(payload)
            recordings[name] = {'file': f'media/letter-sounds/{filename}',
                                'source': 'personal' if text is None else 'Piper',
                                'text': text, 'sha256': hashlib.sha256(payload).hexdigest()}
        self.manifest_path.write_text(json.dumps({'version': 1, 'recordings': recordings}))
        spec = importlib.util.spec_from_file_location('prepare_letter_audio', ROOT / 'scripts/prepare-letter-audio.py')
        self.script = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.script)
        self.spoken = []

        def synthesize(text, recording):
            self.spoken.append(text)
            recording.setnchannels(1)
            recording.setsampwidth(2)
            recording.setframerate(22050)
            recording.writeframes(text.encode('utf-8') * 2)

        self.voice = Mock()
        self.voice.synthesize_wav.side_effect = synthesize
        self.piper = types.SimpleNamespace(PiperVoice=Mock())
        self.piper.PiperVoice.load.return_value = self.voice

    def prepare(self, replace=False):
        with patch.dict(sys.modules, {'piper': self.piper}), \
             patch.object(self.script, 'convert', side_effect=shutil.copyfile), redirect_stdout(io.StringIO()):
            self.script.prepare(self.root, self.root / 'voice.onnx', replace=replace)

    def test_edited_manifest_text_is_synthesized_and_a_second_run_does_no_work(self):
        personal = (self.folder / '00-A.wav').read_bytes()
        self.prepare()
        self.assertEqual(self.spoken, ['ą, gąska', 'Powiedz jaka to literka.'])
        self.assertEqual((self.folder / '00-A.wav').read_bytes(), personal)
        manifest = json.loads(self.manifest_path.read_text())
        entry = manifest['recordings']['Ą']
        self.assertEqual(entry['sha256'], hashlib.sha256((self.root / entry['file']).read_bytes()).hexdigest())
        self.assertEqual(entry['text'], 'ą, gąska')
        self.prepare()
        self.assertEqual(len(self.spoken), 2)
        manifest['recordings']['Ą']['text'] = 'ą, jak pąk'
        self.manifest_path.write_text(json.dumps(manifest))
        self.prepare()
        self.assertEqual(self.spoken[-1], 'ą, jak pąk')
        self.assertEqual(len(self.spoken), 3)

    def test_manual_wav_replacement_is_preserved_during_ordinary_regeneration(self):
        replacement = self.folder / '01-Ą.wav'
        replacement.write_bytes(b'my voice')
        self.prepare()
        self.assertEqual(replacement.read_bytes(), b'my voice')
        self.assertEqual(self.spoken, ['Powiedz jaka to literka.'])

    def test_replace_still_uses_the_edited_manifest_phrase(self):
        self.prepare(replace=True)
        self.assertIn('ą, gąska', self.spoken)
        self.assertNotIn(self.script.WORDS['Ą'], self.spoken)

    def test_root_brawo_recordings_replace_old_praise_sources_and_refresh_after_edits(self):
        for number in (1, 2):
            (self.root / f'brawo_{number}.wav').write_bytes(f'new bravo {number}'.encode())
            (self.root / f'praise_{number}.wav').write_bytes(b'old praise')
        self.prepare()
        for number in (1, 2):
            source = self.root / f'brawo_{number}.wav'
            self.assertEqual((self.folder / f'praise_{number}.wav').read_bytes(), source.read_bytes())
            entry = json.loads(self.manifest_path.read_text())['recordings'][f'praise_{number}']
            self.assertEqual(entry['source'], source.name)
            self.assertEqual(entry['source_sha256'], hashlib.sha256(source.read_bytes()).hexdigest())
            self.assertIsNone(entry['text'])
        (self.root / 'brawo_1.wav').write_bytes(b'updated bravo one')
        self.prepare()
        self.assertEqual((self.folder / 'praise_1.wav').read_bytes(), b'updated bravo one')
        self.assertEqual(self.spoken, ['ą, gąska', 'Powiedz jaka to literka.'])
        for number in (1, 2):
            (self.root / f'brawo_{number}.wav').unlink()
            (self.root / f'praise_{number}.wav').unlink()
        self.prepare()
        self.assertEqual((self.folder / 'praise_1.wav').read_bytes(), b'updated bravo one')
        self.assertEqual((self.folder / 'praise_2.wav').read_bytes(), b'new bravo 2')
        self.assertEqual(self.spoken, ['ą, gąska', 'Powiedz jaka to literka.'])


if __name__ == '__main__':
    unittest.main()
