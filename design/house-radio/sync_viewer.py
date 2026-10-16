"""Copy the built house into the hardware viewer's Wooden Radio tab.

Plain Python: run with python3 after build_all.py, no CAD needed.
"""
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parent
DATA = ROOT.parents[1] / "hardware-visualisation/src/data"
MODES = ("assembled", "roof_open", "inside", "exploded")


def main():
    report = json.loads((ROOT / "verification.json").read_text())
    if not report["passed"]:
        raise SystemExit("verification.json has failing checks; fix them before syncing the viewer.")
    facts = json.loads((ROOT / "facts.json").read_text())
    routing = json.loads((ROOT / "routing.json").read_text())
    (DATA / "radio-glb").mkdir(exist_ok=True)
    (DATA / "radio-images").mkdir(exist_ok=True)
    for mode in MODES:
        shutil.copyfile(ROOT / "GLB" / f"house_{mode}.glb", DATA / "radio-glb" / f"house_{mode}.glb")
    for name in ("page_cover",):
        shutil.copyfile(ROOT / "previews" / f"{name}.png", DATA / "radio-images" / f"{name}.png")
    manifest = {
        "name": facts["name"], "title": facts["title"], "revision": facts["revision"], "outer_mm": facts["outer_mm"],
        "handle": facts["handle"], "wood_colors": facts["wood_colors"], "modules": facts["modules"],
        "modes": list(MODES), "wires": [{k: w[k] for k in ("id", "group", "from", "to", "title", "color", "route",
                                                          "route_length_mm", "suggested_length_mm")} for w in routing["wires"]],
        "fasteners": [{k: f[k] for k in ("id", "title", "designation", "count")} for f in facts["fasteners"]],
        "cut_list": [{k: c[k] for k in ("part", "title", "size_mm", "quantity")} for c in facts["cut_list"]],
        "checks": {"passed": report["passed"], "count": len(report["checks"])},
        "mass_g": report["facts"]["mass_g"], "tip_angles_deg": report["facts"]["tip_angles_deg"],
        "documents": {"plan": "/design/house-radio/PDF/Moomin.pdf", "assembly": "/design/house-radio/PDF/Moomin-assembly.pdf",
                      "templates": "/design/house-radio/PDF/Moomin-cut-templates.pdf",
                      "step": "/design/house-radio/STEP/house_assembled.step"},
    }
    (DATA / "radio-house.json").write_text(json.dumps(manifest, indent=1) + "\n")
    print(f"Synced Moomin house: {len(MODES)} models, {len(manifest['wires'])} wires, into {DATA.relative_to(ROOT.parents[1])}.")


if __name__ == "__main__":
    main()
