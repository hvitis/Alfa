"""Export project data without copying private or character media."""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.project import ROOT, metadata, write_json


def export_site(destination):
    import shutil

    destination = Path(destination).resolve()
    source = ROOT / "web"
    destination.mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "app.js", "style.css", "device.svg", ".nojekyll"):
        if destination != source.resolve():
            shutil.copy2(source / name, destination / name)
    write_json(destination / "data/manifest.json", metadata())
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", nargs="?", default=str(ROOT / "web"))
    args = parser.parse_args()
    print(f"Static showcase: {export_site(args.destination)}")
