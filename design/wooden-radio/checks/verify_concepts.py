"""Check saved concept STEP files and facts. Run after the models, through run-cad.sh."""
from collections import Counter
from itertools import combinations
from pathlib import Path
import json
import math
import sys

from cadgen import read_scene
from cadgen.geometry import overlap_volume

ROOT = Path(__file__).resolve().parents[1]
settings = json.loads((ROOT / "concepts.json").read_text())
rules = settings["handle_rules"]
report = {"units": "mm", "concepts": {}, "limitations": [
    "Concept massing only: electronics are envelopes from the wooden case, connectors and cables are not routed.",
    "Joints are glued butt joints; glue cleats, screws and corner bevels are described, not all modelled.",
    "Mass is an estimate from plywood/dowel volume and a fixed electronics allowance.",
]}


def overlap(a, b):
    ba, bb = a.bounding_box(optimal=False), b.bounding_box(optimal=False)
    if not all(min(ahi, bhi) - max(alo, blo) > 1e-5 for alo, ahi, blo, bhi in zip(ba.min, ba.max, bb.min, bb.max)):
        return 0
    return sum(overlap_volume(sa, sb) for sa in a.solids() for sb in b.solids())


def min_web(panel_holes):
    # Plywood left between neighbouring round holes; thin webs split when drilled.
    worst = math.inf
    for (x0, y0, d0), (x1, y1, d1) in combinations(panel_holes, 2):
        worst = min(worst, math.dist((x0, y0), (x1, y1)) - (d0 + d1) / 2)
    return worst


for facts_path in sorted((ROOT / "facts").glob("*.json")):
    facts = json.loads(facts_path.read_text())
    cid = facts["id"]
    checks = []

    def check(title, condition, detail=None):
        checks.append({"check": title, "pass": bool(condition), "detail": detail})
        if not condition:
            print(f"FAIL [{cid}]:", title, detail)

    scene = read_scene(ROOT / "STEP" / f"{cid}.step")
    parts = [(o.label, scene.resolve(o.ref).shape()) for o in scene.leaves()]
    for name, shape in parts:
        check("Valid positive-volume solid: " + name, shape.is_valid and shape.volume > 0)

    electronics = [(n, s) for n, s in parts if n.startswith("e_")]
    structure = [(n, s) for n, s in parts if not n.startswith("e_")]
    module = lambda name: name[2:].split("__")[0]
    hits = []
    for (na, a), (nb, b) in ((x, y) for x in electronics for y in structure):
        v = overlap(a, b)
        if v > .01:
            hits.append([na, nb, round(v, 3)])
    check("Electronics clear of wood, felt and handle (<= 0.01 mm3)", not hits, hits)
    hits = []
    for (na, a), (nb, b) in combinations(electronics, 2):
        if module(na) != module(nb) and (v := overlap(a, b)) > .01:
            hits.append([na, nb, round(v, 3)])
    check("Electronic modules clear of each other (<= 0.01 mm3)", not hits, hits)

    wood = [s for n, s in structure if n.startswith("wood_")]
    lo = [min(tuple(w.bounding_box().min)[i] for w in wood) for i in range(3)]
    hi = [max(tuple(w.bounding_box().max)[i] for w in wood) for i in range(3)]
    outside = [n for n, s in electronics
               if any(tuple(s.bounding_box().min)[i] < lo[i] - 1e-5 or tuple(s.bounding_box().max)[i] > hi[i] + 1e-5
                      for i in range(3))]
    check("Electronics inside the wooden envelope", not outside, outside)
    check("Saved outer size matches facts", all(abs((h - l) - o) < .2 for l, h, o in zip(lo, hi, facts["outer_mm"])),
          {"saved": [round(h - l, 1) for l, h in zip(lo, hi)], "facts": facts["outer_mm"]})

    limit = sorted(facts["a4_part_limit"])
    for part in facts["cut_list"]:
        w, h = sorted(part["size_mm"])
        check(f"{part['part']} fits one A4 template", w <= limit[0] and h <= limit[1], [w, h])

    handle = facts["handle"]
    check(f"Handle finger gap >= {rules['min_finger_gap']} mm", handle["finger_gap"] >= rules["min_finger_gap"], handle["finger_gap"])
    check(f"Handle grip length >= {rules['min_grip_length']} mm", handle["grip_length"] >= rules["min_grip_length"], handle["grip_length"])
    if "bar_height" in handle:
        check(f"Hand-hole bar >= {rules['min_bar_height']} mm", handle["bar_height"] >= rules["min_bar_height"], handle["bar_height"])

    for label, shape in structure:
        if not label.startswith("wood_"):
            continue
        circles = {}
        for edge in shape.edges():
            if not edge.is_closed:
                continue    # rounded window corners are arcs, not drilled holes
            try:
                r, c = edge.radius, edge.arc_center
            except ValueError:
                continue
            if r < 20:
                circles[(round(c.X, 2), round(c.Y, 2), round(c.Z, 2))] = 2 * r
        # Project hole centres onto the panel face: drop the thinnest axis.
        size = tuple(shape.bounding_box().size)
        thin = min(range(3), key=lambda i: size[i])
        holes = [(*[c[i] for i in range(3) if i != thin], d) for c, d in circles.items()]
        holes = list({(round(a, 1), round(b, 1), round(d, 1)) for a, b, d in holes})
        if len(holes) > 1:
            web = min_web(holes)
            check(f"{label}: plywood web between holes >= 2.5 mm", web >= 2.5 - 1e-6, round(web, 2))

    density = settings["plywood_density_g_cm3"]
    wood_g = sum(s.volume for n, s in structure if n.startswith("wood_")) / 1000 * density
    rods_g = sum(s.volume for n, s in structure if n.startswith("handle_")) / 1000 * settings["dowel_density_g_cm3"]
    mass = round(wood_g + rods_g + settings["electronics_mass_g"])
    report["concepts"][cid] = {"passed": all(c["pass"] for c in checks), "count": len(checks),
                               "mass_estimate_g": mass, "labels": dict(Counter(n.split("_")[0] for n, _ in parts)),
                               "checks": checks}
    print(f"{cid}: {sum(c['pass'] for c in checks)}/{len(checks)} checks passed; about {mass} g")

report["passed"] = all(c["passed"] for c in report["concepts"].values())
(ROOT / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
sys.exit(0 if report["passed"] else 1)
