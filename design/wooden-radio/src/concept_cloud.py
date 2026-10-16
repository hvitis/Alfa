import json
from pathlib import Path
from cadgen import step, glb
from lib.radio import assembly, concept, facts

CONCEPT = concept("cloud")


@step(out="../STEP/cloud.step")
@glb(out="../GLB/cloud.glb")
def cloud():
    return assembly(CONCEPT)


if __name__ == "__main__":
    cloud()
    out = Path(__file__).resolve().parents[1] / "facts"
    out.mkdir(exist_ok=True)
    (out / "cloud.json").write_text(json.dumps(facts(CONCEPT), indent=2) + "\n")
