"""Validate the app and static site, then package an original-media runtime kit."""
import argparse
import csv
import importlib.metadata
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from web.build import export_site
from scripts.package import KIT_NAME, create_kit, digest, validate_release_kit
from scripts.project import ROOT, git, metadata, timestamp, write_json


def stage_runtime(staging):
    from PIL import Image, ImageDraw

    runtime = staging / "runtime"
    runtime.mkdir(parents=True)
    for folder in ("app",):
        for source in sorted((ROOT / folder).rglob("*.py")):
            if source.is_symlink():
                raise ValueError(f"Runtime source cannot be a symlink: {source.name}")
            destination = runtime / source.relative_to(ROOT)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
    for name in ("config.json", "requirements.txt", "requirements-pi.txt"):
        shutil.copy2(ROOT / name, runtime / name)
    (runtime / "scripts").mkdir()
    for name in ("setup-pi.sh",):
        shutil.copy2(ROOT / "scripts" / name, runtime / "scripts" / name)
    (runtime / "README.md").write_text("# Runtime\n\nRead ../START-HERE.md for installation and simulation commands.\n")
    (runtime / "docs").mkdir()
    shutil.copy2(ROOT / "docs/wiring.md", runtime / "docs/wiring.md")
    # Original geometric card: never copy repository artwork or recordings.
    demo = Image.new("RGB", (240, 320), "#f3f0e7")
    draw = ImageDraw.Draw(demo)
    draw.rounded_rectangle((25, 50, 215, 255), radius=18, fill="#20392e")
    draw.rectangle((45, 70, 195, 190), fill="#c7ed78")
    draw.text((70, 120), "RADIO LAB", fill="#20392e")
    for x in (80, 120, 160):
        draw.ellipse((x - 10, 210, x + 10, 230), fill="#f3f0e7")
    image_dir = runtime / "media/images"
    image_dir.mkdir(parents=True)
    demo.save(image_dir / "000-demo.png")
    write_json(image_dir / "manifest.json", {"items": [{"file": "000-demo.png", "size": [240, 320], "source": "original generated demo"}]})
    # An empty source directory makes user-supplied audio optional.
    (runtime / "sounds").mkdir()
    (runtime / "sounds/README.md").write_text("Add your own WAV or MP3 recordings here.\n")


def build():
    output = ROOT / "output"
    reports = output / "reports"
    reports.mkdir(parents=True, exist_ok=True)
    checks = []
    validation = {"timestamp": timestamp(), "git_commit": git("rev-parse", "HEAD"), "status": "FAIL", "checks": checks}
    # Fail closed: replace any previous success report before running checks.
    write_json(reports / "validation.json", validation)

    def run(name, command, cwd=ROOT):
        log = reports / f"{name}.log"
        with log.open("w") as stream:
            result = subprocess.run(command, cwd=cwd, stdout=stream, stderr=subprocess.STDOUT)
        checks.append({"name": name, "passed": result.returncode == 0})
        write_json(reports / "validation.json", validation)
        if result.returncode:
            print(log.read_text()[-12000:], file=sys.stderr)
            raise RuntimeError(f"{name} failed. See {log}")
        print(f"PASS: {name}", flush=True)

    run("repository", [sys.executable, "scripts/check_repo.py"])
    run("unit-tests", [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"])
    run("javascript-syntax", ["node", "web/tests/check-syntax.mjs"])
    # Node expands this glob with --test on the supported Node 22 runtime.
    viewer_tests = sorted(str(p.relative_to(ROOT)) for p in (ROOT / "web/hardware-visualisation/tests").glob("*.test.js"))
    run("viewer-data-tests", ["node", "--test", *viewer_tests])
    export_site(ROOT / "_site")
    run("browser-smoke", ["node", "web/tests/smoke-tests.mjs"])
    with tempfile.TemporaryDirectory(prefix="alfa-kit-") as temp:
        staging = Path(temp)
        stage_runtime(staging)
        shutil.copytree(ROOT / "_site", staging / "site")
        for name in ("LICENSE", "THIRD_PARTY_NOTICES.md"):
            shutil.copy2(ROOT / name, staging / name)
        shutil.copy2(ROOT / "docs/RELEASE-CONTENTS.md", staging / "START-HERE.md")
        run("packaged-runtime", [sys.executable, "-m", "app", "--simulate", "player", "--once", "--no-audio"], cwd=staging / "runtime")
        shutil.rmtree(staging / "runtime/.state")
        for cache in list(staging.rglob("__pycache__")):
            shutil.rmtree(cache)
        archive = create_kit(staging, output)
    with (reports / "hardware.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["part", "quantity", "interface"])
        writer.writeheader()
        writer.writerows(metadata()["hardware"])
    checksum = digest(archive.read_bytes())
    manifest = {
        "schema_version": 1, "git_commit": git("rev-parse", "HEAD"),
        "dirty": bool(git("status", "--porcelain")), "timestamp": timestamp(),
        "versions": {"python": sys.version.split()[0], "pillow": importlib.metadata.version("Pillow"), "node": subprocess.check_output(["node", "--version"], text=True).strip()},
        "artifacts": {KIT_NAME: {"sha256": checksum, "bytes": archive.stat().st_size}},
        "scope": "Python runtime, neutral demo image, static atlas with CAD viewer meshes, wiring guide. CAD fabrication builds and character media are excluded.",
    }
    write_json(reports / "build-manifest.json", manifest)
    (output / "SHA256SUMS").write_text(f"{checksum}  {KIT_NAME}\n")
    validation["status"] = "PASS"
    write_json(reports / "validation.json", validation)
    try:
        validate_release_kit(output)
    except Exception:
        validation["status"] = "FAIL"
        checks.append({"name": "release-kit", "passed": False})
        write_json(reports / "validation.json", validation)
        raise
    checks.append({"name": "release-kit", "passed": True})
    write_json(reports / "validation.json", validation)
    print(f"Build kit ready: {archive}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    build()
