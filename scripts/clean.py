"""Delete only outputs owned by the repository publication tools."""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for path in (ROOT / "_site", ROOT / "web/.generated", ROOT / "output/reports"):
    if path.is_symlink():
        path.unlink()
    elif path.exists():
        shutil.rmtree(path)
for name in ("Alfa-Build-Kit.zip", "SHA256SUMS"):
    (ROOT / "output" / name).unlink(missing_ok=True)
