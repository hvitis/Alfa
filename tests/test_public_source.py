"""Public copies must preserve assets and exclude private state and old history."""
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.export_public import export_public
from scripts.publication import check_public_file


class PublicSourceTests(unittest.TestCase):
    def test_copy_preserves_current_files_without_private_state_or_prior_commits(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source, destination = root / 'source', root / 'public'
            source.mkdir()

            def git(*args):
                return subprocess.check_output(['git', *args], cwd=source, stderr=subprocess.DEVNULL)

            git('init', '-b', 'main')
            (source / 'retired.txt').write_text('Private historical content')
            git('add', '.')
            git('-c', 'user.name=Fixture', '-c', 'user.email=test@example.invalid',
                '-c', 'commit.gpgsign=false', 'commit', '-m', 'Private history')
            (source / 'retired.txt').unlink()
            (source / '.gitignore').write_text('.env\noutput/\n')
            (source / '.env').write_text('PRIVATE_FIXTURE=excluded')
            (source / 'README.md').write_text('# Alfa\n')
            (source / 'output').mkdir()
            image = b'unchanged image bytes\x00\xff'
            (source / 'output/retained.png').write_bytes(image)
            git('add', '-f', 'output/retained.png')
            export_public(destination, source)
            self.assertFalse((destination / '.env').exists())
            self.assertFalse((destination / 'retired.txt').exists())
            self.assertEqual((destination / 'output/retained.png').read_bytes(), image)
            self.assertEqual((destination / 'README.md').read_text(), '# Alfa\n')
            log = subprocess.check_output(['git', 'log', '--all', '--format=%s'], cwd=destination, text=True)
            self.assertEqual(log.strip(), 'Initial public Alfa source')
            self.assertEqual(subprocess.check_output(['git', 'status', '--porcelain'], cwd=destination), b'')
            with self.assertRaises(ValueError):
                export_public(source, source)
            with self.assertRaises(ValueError):
                export_public(destination, source)

    def test_public_policy_rejects_private_files_keys_and_retired_names(self):
        for name in ('.env', '.env.production', '.aws/config', 'config.local.json', 'client.p12', '.netrc'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                check_public_file(name, b'fixture')
        with self.assertRaises(ValueError):
            check_public_file('image.png', b'embedded moo' + b'min metadata')
        with self.assertRaises(ValueError):
            check_public_file('config.txt', b'-----BEGIN OPENSSH ' + b'PRIVATE KEY-----')
        check_public_file('.env.example', b'EXAMPLE=')
        check_public_file('README.md', b'# Alfa')

    def test_copy_rejects_symlinks_before_writing_destination(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source, destination = root / 'source', root / 'public'
            source.mkdir()
            subprocess.run(['git', 'init', '-b', 'main', str(source)], check=True, stdout=subprocess.DEVNULL)
            (source / 'external').symlink_to(root / 'outside')
            with self.assertRaisesRegex(ValueError, 'symlink'):
                export_public(destination, source)
            self.assertFalse(destination.exists())


if __name__ == '__main__':
    unittest.main()
