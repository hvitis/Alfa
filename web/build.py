"""Build the complete, backend-free website from sources in web/."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from web.project import metadata
from web.archives import create_cloud_archive
from web.pcb.assets import ensure_pcb_assets


def export_site(destination=ROOT / "_site"):
    destination = Path(destination).resolve()
    # Vite empties the output directory. Never allow a source folder as output.
    protected = (ROOT / "web", ROOT / "app", ROOT / "scripts", ROOT / "tests", ROOT / "design", ROOT / "docs", ROOT / "assets", ROOT / "media", ROOT / ".git")
    if destination == ROOT or destination in ROOT.parents or any(destination == p or destination in p.parents or p in destination.parents for p in protected):
        raise ValueError("The website output must be a separate generated directory, such as _site/.")
    generated = ROOT / "web/.generated"
    ensure_pcb_assets()
    cloud_manifest = ROOT / "design/cloud-radio/generated/cloud/manifest.json"
    if not cloud_manifest.exists():
        raise FileNotFoundError("Cloud CAD assets are missing. Run: bash design/cloud-radio/run-cad.sh")
    generated.mkdir(parents=True, exist_ok=True)
    (generated / "manifest.json").write_text(json.dumps(metadata(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    subprocess.run(["node", str(ROOT / "web/build.mjs"), str(destination)], cwd=ROOT, check=True)
    create_cloud_archive(destination / "cloud/cloud-radio.zip")
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", nargs="?", default=str(ROOT / "_site"))
    print(f"Static website: {export_site(parser.parse_args().destination)}")
