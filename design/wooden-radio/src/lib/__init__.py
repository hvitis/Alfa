import sys
from pathlib import Path

# Make design/woodkit importable for every entrypoint under src/.
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
