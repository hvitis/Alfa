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
    "README.md", "build.py", "run-cad.sh", "parameters.json", "manifest.json", "verification.json",
    "front.stl", "rear.stl", "battery_door.stl", "cloud-radio.step", "cloud-radio.glb",
    "snap-coupon-0.2.stl", "snap-coupon-0.3.stl", "snap-coupon-0.4.stl",
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
            contents = {name: (source / name).read_bytes() for name in MEMBERS}
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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    print(create_cloud_archive(parser.parse_args().destination))
