"""Compatibility entry point; the graphic generator lives in web/."""
import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).resolve().parents[1] / "web/social_preview.py"), run_name="__main__")
