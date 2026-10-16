"""Explicit model catalog and printable outputs; run through run-cad.sh."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
TARGETS = (
    "enclosure", "exploded", "internals", "front_cutting", "rear_cutting",
    "walls_cutting", "accessories_cutting", "enclosure_drawing", "workshop_plans",
)


if __name__ == "__main__":
    log_dir = ROOT / "tmp/build-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    for name in TARGETS:
        with (log_dir / f"{name}.log").open("w") as log:
            result = subprocess.run([sys.executable, str(ROOT / "src" / f"{name}.py")],
                                    cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        if result.returncode:
            print((log_dir / f"{name}.log").read_text())
            raise SystemExit(result.returncode)
        print(f"Built {name}", flush=True)
