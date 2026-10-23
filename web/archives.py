"""Create reproducible download archives from verified CAD exports, without CAD."""
import argparse
import json
import os
from pathlib import Path
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CLOUD = ROOT / "design/cloud-radio/generated/cloud"
MEMBERS = (
    "README.md", "IMPROVEMENTS.md", "build.py", "run-cad.sh", "parameters.json", "manifest.json", "verification.json", "cloud-ender.scad",
    "front.stl", "rear.stl", "battery_door.stl", "cloud-radio.brep", "cloud-radio.glb",
    "snap-coupon-0.2.stl", "snap-coupon-0.3.stl", "snap-coupon-0.4.stl",
    "front.3mf", "rear.3mf", "battery_door.3mf", "button-fit-coupon.stl",
    "button-fit-coupon.3mf", "insert-fit-coupon.stl", "insert-fit-coupon.3mf", "print-settings.json",
    "snap-coupon-0.2.3mf", "snap-coupon-0.3.3mf", "snap-coupon-0.4.3mf",
    "plywood-assembly-guide.pdf",
)


def create_cloud_archive(destination, source=CLOUD):
    """Package a complete verified snapshot; replace an existing ZIP atomically."""
    source, destination = Path(source), Path(destination)
    if not (source / "plywood-assembly-guide.pdf").exists():
        fallback_pdf = ROOT / "docs/plywood-assembly-guide.pdf"
        if fallback_pdf.exists():
            import shutil
            shutil.copyfile(fallback_pdf, source / "plywood-assembly-guide.pdf")
    # The development CAD publisher swaps this directory atomically. Retry if
    # it changes while reading; never mix members from different snapshots.
    for attempt in range(3):
        before = source.stat().st_ino
        try:
            # Older verified snapshots predate the OpenSCAD inspection wrapper.
            # Keep them buildable while a newer CAD snapshot is being prepared.
            published = json.loads((source / "manifest.json").read_bytes())
            members = tuple(name for name in MEMBERS if name != "cloud-ender.scad" or name in published.get("files", []))
            contents = {name: (source / name).read_bytes() for name in members}
        except FileNotFoundError:
            if attempt < 2 and source.stat().st_ino != before:
                continue
            raise
        if source.stat().st_ino == before:
            break
    else:
        raise RuntimeError("Cloud CAD exports changed repeatedly while packaging")
    manifest = json.loads(contents["manifest.json"])
    verification = json.loads(contents["verification.json"])
    parameters = json.loads(contents["parameters.json"])
    if not manifest.get("passed") or not verification.get("passed"):
        raise ValueError("Cloud archive requires verified CAD exports")
    if len({manifest["revision"], verification["revision"], parameters["revision"]}) != 1:
        raise ValueError("Cloud archive inputs have different revisions")
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=".cloud-archive-", suffix=".zip", dir=destination.parent)
    os.close(descriptor)
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name, content in sorted(contents.items()):
                info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, content, compresslevel=9)
        os.replace(temporary, destination)
    finally:
        Path(temporary).unlink(missing_ok=True)
    return destination


def create_wooden_case_archive(destination):
    """Package the birch plywood case files into a reproducible download archive."""
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    wooden_case_dir = ROOT / "design/wooden-case"
    excluded = {".cad-cache", "tmp", "viewer-dist", "__pycache__", ".DS_Store"}
    files = [p for p in wooden_case_dir.rglob("*") if p.is_file() and not any(part in excluded for part in p.relative_to(wooden_case_dir).parts)]
    for name in ("wiring.md", "improvements-todo.md", "raspberry-pi-standalone.md"):
        doc = ROOT / "docs" / name
        if doc.exists():
            files.append(doc)
    setup_json = ROOT / "web/hardware-visualisation/src/data/setup.json"
    if setup_json.exists():
        files.append(setup_json)
    planner = ROOT / "web/hardware-visualisation/case-planner"
    if planner.exists():
        files.extend([p for p in planner.rglob("*") if p.is_file()])
    build_viewer = ROOT / "web/hardware-visualisation/scripts/build-case-viewer.mjs"
    if build_viewer.exists():
        files.append(build_viewer)

    descriptor, temporary = tempfile.mkstemp(prefix=".case-archive-", suffix=".zip", dir=destination.parent)
    os.close(descriptor)
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for p in sorted(set(files)):
                try:
                    rel_path = p.relative_to(ROOT)
                except ValueError:
                    rel_path = p.name
                info = zipfile.ZipInfo(str(Path("alfa-case") / rel_path), date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, p.read_bytes(), compresslevel=9)
            start_here = zipfile.ZipInfo("alfa-case/START-HERE.txt", date_time=(1980, 1, 1, 0, 0, 0))
            start_here.create_system = 3
            start_here.external_attr = 0o100644 << 16
            start_here.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(start_here, b"Open design/wooden-case/viewer.html in a desktop browser.\nPrint design/wooden-case/PDF/a4_cutting_and_drilling.pdf at 100%.\nRead design/wooden-case/README.md before cutting.\nThis bundle contains case planning files, not the Pi application.\n", compresslevel=9)
        os.replace(temporary, destination)
    finally:
        Path(temporary).unlink(missing_ok=True)
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    print(create_cloud_archive(parser.parse_args().destination))
