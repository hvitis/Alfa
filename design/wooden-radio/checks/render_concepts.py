"""Render saved concept STEP files for the drawings and the viewer; does not build source."""
from pathlib import Path
import json
import subprocess
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CLI = str(Path(sys.executable).parent / "cadgen")
VIEWS = {"iso": [0.8, 0.55, 1.5], "rear": [-0.9, 0.5, -1.4]}

(ROOT / "previews").mkdir(exist_ok=True)
for concept in json.loads((ROOT / "concepts.json").read_text())["concepts"]:
    cid = concept["id"]
    for view, direction in VIEWS.items():
        out = ROOT / "previews" / f"{cid}_{view}.png"
        camera = json.dumps({"direction": direction, "up": [0, 1, 0]})
        subprocess.run([CLI, "step", "snapshot", str(ROOT / "STEP" / f"{cid}.step"), str(out),
                        "--camera", camera, "--size-profile", "simple"], check=True, cwd=ROOT)
    # Small card image for the hardware viewer tab.
    image = Image.open(ROOT / "previews" / f"{cid}_iso.png").convert("RGB")
    image.thumbnail((480, 360))
    image.save(ROOT / "previews" / f"{cid}_thumb.png", optimize=True)
