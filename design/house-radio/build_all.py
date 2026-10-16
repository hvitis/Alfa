"""Build, check, render and draw the Alfa house radio; run through run-cad.sh."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
STEPS = (
    ("house_assembled", "src/house_assembled.py"),
    ("house_roof_open", "src/house_roof_open.py"),
    ("house_inside", "src/house_inside.py"),
    ("house_exploded", "src/house_exploded.py"),
    ("house_facts", "src/house_facts.py"),
    # Checks and renders read the saved STEP files, so they follow the models.
    ("verify_house", "checks/verify_house.py"),
    ("booklet_steps", "src/booklet_steps.py"),
    ("render_house", "checks/render_house.py"),
    ("plans", "src/plans.py"),
    ("booklet", "src/booklet.py"),
)


if __name__ == "__main__":
    log_dir = ROOT / "tmp/build-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    for name, script in STEPS:
        with (log_dir / f"{name}.log").open("w") as log:
            result = subprocess.run([sys.executable, str(ROOT / script)], cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        if result.returncode:
            print((log_dir / f"{name}.log").read_text()[-4000:])
            raise SystemExit(result.returncode)
        print(f"Built {name}", flush=True)
