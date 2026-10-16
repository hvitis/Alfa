"""Render saved house and step STEP files for the PDFs and the viewer; does not build source."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from lib.steps import CHARGING, STEPS  # noqa: E402
from woodkit.render import job, run, whiten  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "previews"
OUT.mkdir(exist_ok=True)
FRONT, REAR = [0.8, 0.55, 1.5], [-0.9, 0.5, -1.4]

jobs = [
    job(ROOT / "STEP/house_assembled.step", [(OUT / "house_iso.png", FRONT, 1600, 1200), (OUT / "house_rear.png", REAR, 1600, 1200),
                                             (OUT / "house_front.png", [0, .02, 1], 1600, 1600)], cwd=ROOT),
    job(ROOT / "STEP/house_roof_open.step", [(OUT / "house_roof_open.png", [0.6, 0.7, 1.3], 1600, 1200)], cwd=ROOT),
    job(ROOT / "STEP/house_inside.step", [(OUT / "house_inside.png", [1.2, 0.9, 0.5], 1600, 1200)], cwd=ROOT),
    job(ROOT / "STEP/house_exploded.step", [(OUT / "house_exploded.png", [1.0, 0.6, 1.3], 1600, 1200)], cwd=ROOT),
    job(ROOT / "STEP/house_assembled.step", [(OUT / "line_iso.png", FRONT, 1400, 1400)], display="hidden-line", cwd=ROOT),
    job(ROOT / "STEP/house_roof_open.step", [(OUT / "line_roof_open.png", [0.4, 0.6, 1.4], 1400, 1400)], display="hidden-line", cwd=ROOT),
]
for n, _, new, camera, _, _ in [CHARGING] + STEPS:
    focus = ["wood_roof_*", "handle_knob_*", "magnet_*"] if n == 13 else new
    jobs.append(job(ROOT / f"tmp/steps/step_{n:02d}.step", [(OUT / f"step_{n:02d}.png", camera, 1400, 1100)],
                    display="hidden-line", focus=focus, cwd=ROOT))
run(jobs, ROOT, ROOT / "tmp/render-jobs.json")
for path in OUT.glob("step_*.png"):
    whiten(path)
for name in ("line_iso", "line_roof_open"):
    whiten(OUT / f"{name}.png")
print(f"Rendered {len(jobs)} views into previews/.")
