"""Compatibility entry point. Website generation lives in web/build.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from web.build import export_site

if __name__ == "__main__":
    print(export_site(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "_site"))
