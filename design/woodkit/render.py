"""Batch cadgen snapshots and print-ready clean-up. Run inside the cadgen environment."""
from __future__ import annotations

import json
import subprocess
import sys
from fnmatch import fnmatch
from pathlib import Path

from PIL import Image

CLI = str(Path(sys.executable).parent / "cadgen")
BACKGROUND = (240, 244, 248)


def occurrences(step_path, cwd):
    out = subprocess.run([CLI, "step", "snapshot", str(step_path), "--mode", "list"], check=True, cwd=cwd,
                         capture_output=True, text=True).stdout
    start = out.index("[")
    return json.loads(out[start:out.rindex("]") + 1])


def job(step_path, outputs, display="solid", focus=(), hide=(), cwd="."):
    """One render job; `focus`/`hide` are name patterns resolved to occurrence refs."""
    entry = {"input": str(step_path), "display": display,
             "outputs": [{"path": str(path), "width": w, "height": h, "camera": {"direction": cam, "up": [0, 1, 0]}}
                         for path, cam, w, h in outputs]}
    if focus or hide:
        names = occurrences(step_path, cwd)
        key, patterns = ("focus", focus) if focus else ("hide", hide)
        entry["selection"] = {key: [o["ref"] for o in names if any(fnmatch(o["name"], p) for p in patterns)]}
    return entry


def run(jobs, cwd, job_file):
    job_file.parent.mkdir(parents=True, exist_ok=True)
    job_file.write_text(json.dumps({"jobs": jobs}, indent=1))
    subprocess.run([CLI, "step", "snapshot", "--job", str(job_file)], check=True, cwd=cwd, stdout=subprocess.DEVNULL)


def whiten(path, out=None, crop=True, pad=30):
    """Renderer background to white, optionally cropped to the drawing."""
    image = Image.open(path).convert("RGB")
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b = px[x, y]
            if abs(r - BACKGROUND[0]) < 6 and abs(g - BACKGROUND[1]) < 6 and abs(b - BACKGROUND[2]) < 6:
                px[x, y] = (255, 255, 255)
    if crop:
        mask = Image.eval(image.convert("L"), lambda v: 0 if v > 250 else 255)
        box = mask.getbbox()
        if box:
            image = image.crop((max(0, box[0] - pad), max(0, box[1] - pad),
                                min(image.width, box[2] + pad), min(image.height, box[3] + pad)))
    image.save(out or path, optimize=True)
    return out or path
