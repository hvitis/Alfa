import json
from pathlib import Path
from cadgen import step, glb
from lib.radio import assembly, concept, facts

CONCEPT = concept("house")


@step(out="../STEP/house.step")
@glb(out="../GLB/house.glb")
def house():
    return assembly(CONCEPT)


if __name__ == "__main__":
    house()
    out = Path(__file__).resolve().parents[1] / "facts"
    out.mkdir(exist_ok=True)
    (out / "house.json").write_text(json.dumps(facts(CONCEPT), indent=2) + "\n")
