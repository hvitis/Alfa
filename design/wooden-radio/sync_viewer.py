"""Copy the concept images and summary into the hardware viewer's Wooden Radio tab.

The tab now shows the full house design (design/house-radio); concepts appear as images.

Plain Python on purpose: run with python3 after build_concepts.py, no CAD needed.
"""
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parent
DATA = ROOT.parents[1] / "web/hardware-visualisation/src/data"


def main():
    settings = json.loads((ROOT / "concepts.json").read_text())
    report = json.loads((ROOT / "verification.json").read_text())
    if not report["passed"]:
        raise SystemExit("verification.json has failing checks; fix them before syncing the viewer.")
    (DATA / "radio-images").mkdir(exist_ok=True)
    concepts = []
    for meta in settings["concepts"]:
        cid = meta["id"]
        facts = json.loads((ROOT / "facts" / f"{cid}.json").read_text())
        check = report["concepts"][cid]
        shutil.copyfile(ROOT / "previews" / f"{cid}_thumb.png", DATA / "radio-images" / f"{cid}.png")
        shutil.copyfile(ROOT / "previews" / f"sheet_{cid}.png", DATA / "radio-images" / f"sheet_{cid}.png")
        concepts.append({**{k: meta[k] for k in ("id", "letter", "name", "tagline", "story", "handle", "pros", "cons", "accent")},
                         "outer_mm": facts["outer_mm"], "handle_facts": facts["handle"],
                         "plywood_parts": facts["plywood_parts"], "hole_counts": facts["hole_counts"],
                         "modules": facts["modules"], "mass_estimate_g": check["mass_estimate_g"],
                         "checks": {"passed": check["passed"], "count": check["count"]}})
    shutil.copyfile(ROOT / "previews/sheet_overview.png", DATA / "radio-images/sheet_overview.png")
    manifest = {"revision": settings["revision"], "units": "mm", "plywood": settings["plywood"],
                "wood_colors": facts["wood_colors"], "common": settings["common"], "concepts": concepts}
    (DATA / "radio-concepts.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Synced {len(concepts)} concepts into {DATA.relative_to(ROOT.parents[1])}.")


if __name__ == "__main__":
    main()
