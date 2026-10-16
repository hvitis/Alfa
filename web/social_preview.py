"""Render the verified cloud CAD and all original public preview images."""
from pathlib import Path
import subprocess
import sys

if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    subprocess.run(["node", "web/render-assets.mjs", *sys.argv[1:]], cwd=root, check=True)
