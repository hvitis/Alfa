"""Build, check, render and draw the three radio concepts; run through run-cad.sh."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
STEPS = (
    ("concept_lunchbox", "src/concept_lunchbox.py"),
    ("concept_house", "src/concept_house.py"),
    ("concept_cloud", "src/concept_cloud.py"),
    # Checks and renders read the saved STEP files, so they follow the models.
    ("verify_concepts", "checks/verify_concepts.py"),
    ("render_concepts", "checks/render_concepts.py"),
    ("concept_sheets", "src/concept_sheets.py"),
)


if __name__ == "__main__":
    log_dir = ROOT / "tmp/build-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    for name, script in STEPS:
        with (log_dir / f"{name}.log").open("w") as log:
            result = subprocess.run([sys.executable, str(ROOT / script)], cwd=ROOT,
                                    stdout=log, stderr=subprocess.STDOUT)
        if result.returncode:
            print((log_dir / f"{name}.log").read_text())
            raise SystemExit(result.returncode)
        print(f"Built {name}", flush=True)
