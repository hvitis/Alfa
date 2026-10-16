import json
from pathlib import Path
from cadgen import step, glb
from lib.radio import assembly, concept, facts

CONCEPT = concept("lunchbox")


@step(out="../STEP/lunchbox.step")
@glb(out="../GLB/lunchbox.glb")
def lunchbox():
    return assembly(CONCEPT)


if __name__ == "__main__":
    lunchbox()
    out = Path(__file__).resolve().parents[1] / "facts"
    out.mkdir(exist_ok=True)
    (out / "lunchbox.json").write_text(json.dumps(facts(CONCEPT), indent=2) + "\n")
