"""Create and independently validate a deterministic runtime distribution."""
import hashlib
import json
import re
import stat
import zipfile
from pathlib import Path

KIT_NAME = "Alfa-Build-Kit.zip"
REQUIRED = {
    "runtime/app/__main__.py", "runtime/config.json", "runtime/requirements.txt",
    "runtime/media/images/000-demo.png", "runtime/media/images/manifest.json",
    "site/index.html", "site/data/manifest.json", "site/docs/adr.md",
    "site/docs/architecture.mmd", "site/THIRD-PARTY-LICENSES.txt",
    "LICENSE", "THIRD_PARTY_NOTICES.md", "START-HERE.md", "checksums.json",
}


def digest(content):
    return hashlib.sha256(content).hexdigest()


def create_kit(staging, output):
    staging, output = Path(staging), Path(output)
    files = {p.relative_to(staging).as_posix(): p.read_bytes() for p in sorted(staging.rglob("*")) if p.is_file()}
    files["checksums.json"] = (json.dumps({name: digest(value) for name, value in files.items()}, indent=2, sort_keys=True) + "\n").encode()
    archive = output / KIT_NAME
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as kit:
        for name, content in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            mode = 0o755 if name.endswith(".sh") else 0o644
            info.external_attr = (stat.S_IFREG | mode) << 16
            kit.writestr(info, content)
    return archive


def validate_release_kit(directory):
    directory = Path(directory)
    archive = directory / KIT_NAME
    with zipfile.ZipFile(archive) as kit:
        names = kit.namelist()
        if len(names) != len(set(names)) or not REQUIRED.issubset(names):
            raise ValueError("The release kit has duplicate or missing required files.")
        for name in names:
            path = Path(name)
            if path.is_absolute() or ".." in path.parts or "\\" in name:
                raise ValueError("Unsafe path in release kit.")
            if any(part in {".git", ".state", ".venv", "node_modules", "photos", "imgs", "animations", "alphabet"} for part in path.parts):
                raise ValueError(f"Private or unreviewed content in release kit: {name}")
            viewer_mesh = re.fullmatch(r"site/assets/(?:enclosure|internals|exploded|house_(?:assembled|roof_open|inside|exploded))-[A-Za-z0-9_-]+\.glb", name)
            reviewed_pdf = name in {"site/docs/adr.pdf", "site/docs/teaching-material-adr-example-not-a-medical-device.pdf"}
            cloud_mesh = name == "site/cloud/cloud-radio.glb"
            if (name.endswith((".wav", ".mp3", ".jpg", ".jpeg", ".gif")) or (name.endswith(".pdf") and not reviewed_pdf)
                    or (name.endswith(".glb") and not (viewer_mesh or cloud_mesh))):
                raise ValueError(f"Unreviewed binary media in release kit: {name}")
        checksums = json.loads(kit.read("checksums.json"))
        if set(checksums) != set(names) - {"checksums.json"}:
            raise ValueError("Archive checksum inventory differs from its contents.")
        for name, expected in checksums.items():
            if digest(kit.read(name)) != expected:
                raise ValueError(f"Archive checksum mismatch: {name}")
    manifest = json.loads((directory / "reports/build-manifest.json").read_text())
    expected = manifest["artifacts"][KIT_NAME]["sha256"]
    if digest(archive.read_bytes()) != expected:
        raise ValueError("Release archive checksum mismatch.")
    lines = (directory / "SHA256SUMS").read_text().splitlines()
    if lines != [f"{expected}  {KIT_NAME}"]:
        raise ValueError("SHA256SUMS differs from the build manifest.")
    validation = json.loads((directory / "reports/validation.json").read_text())
    if validation["status"] != "PASS" or not validation["checks"] or not all(c["passed"] for c in validation["checks"]):
        raise ValueError("Build validation did not pass.")
    for report in ("hardware.csv", "build-manifest.json", "validation.json"):
        if not (directory / "reports" / report).is_file():
            raise ValueError(f"Missing report: {report}")
    return manifest
