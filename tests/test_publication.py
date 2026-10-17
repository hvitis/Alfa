"""Behavioral tests for release provenance and distribution integrity."""
import json
import os
import shutil
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

from web.build import export_site
from web.archives import CLOUD, MEMBERS, create_cloud_archive
from scripts.package import KIT_NAME, REQUIRED, create_kit, digest, validate_release_kit
from scripts.project import ROOT, write_json
from scripts.verify_release_ref import SEMVER, verify


class ReleaseRefTests(unittest.TestCase):
    def test_semver_rejects_malformed_or_shell_like_tags(self):
        for tag in ("v1.2.3", "v0.0.0", "v2.1.0-rc.1+build.5"):
            self.assertIsNotNone(SEMVER.fullmatch(tag), tag)
        for tag in ("main", "v1", "v01.2.3", "v1.2.3-01", "v1.2.3;echo", "--help", "v1.2.3\n"):
            self.assertIsNone(SEMVER.fullmatch(tag), tag)

    def test_verifies_actual_tag_commit_ancestry_and_checkout(self):
        with tempfile.TemporaryDirectory() as directory:
            def git(*args):
                return subprocess.check_output(["git", *args], cwd=directory, stderr=subprocess.DEVNULL, text=True).strip()
            git("init", "-b", "main")
            git("config", "user.email", "test@example.invalid")
            git("config", "user.name", "Release test")
            git("commit", "--allow-empty", "-m", "main")
            git("tag", "-a", "v1.0.0", "-m", "release")
            main = git("rev-parse", "HEAD")
            self.assertEqual(verify("v1.0.0", main_ref="main", cwd=directory), main)
            git("checkout", "-b", "feature")
            git("commit", "--allow-empty", "-m", "off main")
            git("tag", "v1.1.0")
            with self.assertRaises(subprocess.CalledProcessError):
                verify("v1.1.0", main_ref="main", cwd=directory)
            git("checkout", "main")
            with self.assertRaisesRegex(ValueError, "checkout"):
                verify("v1.1.0", main_ref="main", cwd=directory)


class PackageTests(unittest.TestCase):
    def test_kit_detects_mutation_and_missing_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            staging, output = root / "staging", root / "output"
            output.mkdir()
            for name in REQUIRED - {"checksums.json"}:
                path = staging / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("fixture")
            kit = create_kit(staging, output)
            checksum = digest(kit.read_bytes())
            write_json(output / "reports/build-manifest.json", {"artifacts": {KIT_NAME: {"sha256": checksum}}})
            write_json(output / "reports/validation.json", {"status": "PASS", "checks": [{"passed": True}]})
            (output / "reports/hardware.csv").write_text("part,quantity,interface\n")
            (output / "SHA256SUMS").write_text(f"{checksum}  {KIT_NAME}\n")
            validate_release_kit(output)
            first = kit.read_bytes()
            self.assertEqual(first, create_kit(staging, output).read_bytes())
            # Rebuild an otherwise valid ZIP with a modified file, keeping old checksums.
            with zipfile.ZipFile(kit) as archive:
                contents = {name: archive.read(name) for name in archive.namelist()}
            contents["runtime/config.json"] = b"tampered"
            with zipfile.ZipFile(kit, "w") as archive:
                for name, content in contents.items():
                    archive.writestr(name, content)
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                validate_release_kit(output)
            (staging / "runtime/config.json").unlink()
            create_kit(staging, output)
            with self.assertRaisesRegex(ValueError, "missing required"):
                validate_release_kit(output)

    def test_site_export_is_self_contained_and_excludes_character_media(self):
        with tempfile.TemporaryDirectory() as directory:
            export_site(directory)
            files = {p.relative_to(directory).as_posix() for p in Path(directory).rglob("*") if p.is_file()}
            self.assertTrue({"index.html", "en/index.html", ".nojekyll", "data/manifest.json", "docs/adr.md", "docs/adr.pl.md", "docs/teaching-adr.pl.md", "docs/architecture.mmd", "THIRD-PARTY-LICENSES.txt", "docs/adr.pdf", "og-cloud.png", "og-pcb.png", "pcb/index.html"}.issubset(files))
            index = (Path(directory) / "index.html").read_text(encoding="utf-8")
            self.assertIn('<html lang="pl"', index)
            self.assertNotIn("<base ", index)
            pcb = (Path(directory) / "pcb/index.html").read_text(encoding="utf-8")
            self.assertIn('<base href="../">', pcb)
            self.assertIn("og-pcb.png", pcb)
            english = (Path(directory) / "en/index.html").read_text(encoding="utf-8")
            self.assertIn('<html lang="en"', english)
            self.assertIn('<base href="../">', english)
            self.assertIn("Little radio.", english)
            self.assertIn("cloud/cloud-radio.zip", files)
            with zipfile.ZipFile(Path(directory)/"cloud/cloud-radio.zip") as archive:
                self.assertEqual(set(archive.namelist()), set(MEMBERS))
                self.assertEqual(archive.read("front.stl"), (CLOUD/"front.stl").read_bytes())
                self.assertTrue(json.loads(archive.read("verification.json"))["passed"])
            self.assertTrue(any(name.endswith(".glb") for name in files))
            self.assertTrue(any(name.endswith(".js") for name in files))
            # Only the original CAD render and social cards are public raster assets.
            pngs={name for name in files if name.endswith(".png")}
            self.assertEqual(pngs,{"og-cloud.png", "og-pcb.png"})
            self.assertFalse(any(name.endswith((".jpg", ".wav", ".gif")) for name in files))
            self.assertTrue((Path(directory)/"docs/adr.pdf").read_bytes().startswith(b"%PDF-"))
            # The fictional MDR example ships only as clearly marked teaching material.
            teaching = Path(directory)/"docs/teaching-material-adr-example-not-a-medical-device"
            self.assertTrue(teaching.with_suffix(".pdf").read_bytes().startswith(b"%PDF-"))
            notice = teaching.with_suffix(".md").read_text(encoding="utf-8")
            for phrase in ("TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY", "Alfa is not a medical device", "Nobody signed anything", "## End of teaching example"):
                self.assertIn(phrase, notice)
            self.assertEqual((Path(directory)/"og-cloud.png").read_bytes(),(ROOT/"web/assets/og-cloud.png").read_bytes())
            self.assertEqual((Path(directory)/"og-pcb.png").read_bytes(),(ROOT/"web/assets/og-pcb.png").read_bytes())
            data = json.loads((Path(directory) / "data/manifest.json").read_text())
            self.assertEqual(len(data["alphabet"]), 32)
            self.assertLessEqual(data["audio"]["initial_volume"], data["audio"]["max_volume"])

    def test_cloud_zip_is_reproducible_and_preserves_last_valid_archive_on_invalid_inputs(self):
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/"cad"
            source.mkdir()
            for name in MEMBERS:
                shutil.copyfile(CLOUD/name,source/name)
            destination=Path(directory)/"download.zip"
            create_cloud_archive(destination,source)
            original=destination.read_bytes()
            for file in source.iterdir():
                os.utime(file,(1700000000,1700000000))
            create_cloud_archive(destination,source)
            self.assertEqual(destination.read_bytes(),original)
            verification=json.loads((source/"verification.json").read_text())
            verification["passed"]=False
            (source/"verification.json").write_text(json.dumps(verification))
            with self.assertRaisesRegex(ValueError,"verified CAD"):
                create_cloud_archive(destination,source)
            self.assertEqual(destination.read_bytes(),original)
            (source/"front.stl").unlink()
            with self.assertRaises(FileNotFoundError):
                create_cloud_archive(destination,source)
            self.assertEqual(destination.read_bytes(),original)

    def test_site_export_rejects_source_directories_before_emptying_them(self):
        from scripts.project import ROOT
        for directory in (ROOT, ROOT / "web", ROOT / "app", ROOT / "web/output", ROOT.parent):
            with self.subTest(directory=directory), self.assertRaisesRegex(ValueError, "separate generated directory"):
                export_site(directory)


if __name__ == "__main__":
    unittest.main()
