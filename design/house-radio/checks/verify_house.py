"""Check the saved house STEP files and facts. Run after the models and facts, through run-cad.sh.

Saved-file checks: valid solids, interference, envelopes, A4 template fit, hole webs,
wiring atlas and route containment. The roof swing is checked from source geometry
at 10 opening angles, because the STEP files hold only closed and fully open poses.
"""
from pathlib import Path
import json
import math
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from cadgen import read_scene  # noqa: E402
from lib.house import build, geometry, label_of, roof_fastener_rods, roof_part, roof_side  # noqa: E402
from woodkit.cad import box_solid, panel_solid, rod_solid  # noqa: E402
from woodkit.checks import Report, interference, mass_and_centre, min_web, round_holes, tip_angles  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
facts = json.loads((ROOT / "facts.json").read_text())
routing = json.loads((ROOT / "routing.json").read_text())
g = geometry()
p = g.p
report = Report(limitations=[
    "Electronics are envelopes: board outlines from your measurements and vendor drawings, simplified connectors.",
    "The QUARKZMAN switch body, its button and the USB-C plug overmoulds are provisional envelopes; measure them.",
    "Keypad, small-board and speaker mounting holes are placement suggestions; transfer them from the parts.",
    "Wires are planning centre lines; jumper bends and cable stiffness are not modelled.",
    "Countersunk screw heads are not modelled; their countersinks are drilled on assembly.",
    "Mass and centre of gravity are estimates: wood volume x density plus placed electronics weights.",
])

# Parts that overlap by design: magnets sit in pockets, screws enter what they fasten.
ALLOW = [("magnet_*", "wood_magnet_wedge_*"), ("fastener_D_*", "handle_knob_*"), ("fastener_E_*", "handle_dowel"),
         ("fastener_F_*", "e_lcd__lcd_pcb"), ("fastener_F_*", "e_lcd__lcd_spacer_*"),
         ("fastener_G_*", "e_speaker__speaker_frame"), ("fastener_H_*", "e_keypad__keypad_pcb"),
         ("fastener_I_*", "e_pi__pi_standoff_*"), ("fastener_J_*", "e_pi__pi_standoff_*"), ("fastener_J_*", "e_pi__pi_pcb"),
         ("fastener_K_*", "e_amp__*"), ("fastener_K_*", "e_adc__*"), ("fastener_K_*", "e_divider__*"),
         ("fastener_L_*", "e_switch__clamp_spacer_*"), ("fastener_*_washer", "fastener_*_shank"),
         ("fastener_*_nut", "fastener_*_shank"), ("fastener_*_acorn", "fastener_*_shank"),
         ("fastener_E_*", "fastener_E_*"),
         # Hinge screws go through the leaves' own holes; leaves wrap their knuckle.
         ("fastener_B_*", "hinge_wall_leaf_*"), ("fastener_C_*", "hinge_roof_leaf_*"), ("hinge_*_leaf_*", "hinge_knuckle_*"),
         # Keypad and small-board holes are drilled after transferring them from the real boards.
         ("fastener_H_*", "wood_front_gable"), ("fastener_K_*", "wood_floor")]


def module(label):
    return label[2:].split("__")[0] if label.startswith("e_") else None


def leaves(path):
    scene = read_scene(path)
    return [(o.label, scene.resolve(o.ref).shape()) for o in scene.leaves()]


# ---------------------------------------------------------------- saved models
models = {mode: leaves(ROOT / "STEP" / f"house_{mode}.step") for mode in ("assembled", "roof_open", "inside", "exploded")}
for mode, parts in models.items():
    bad = [n for n, s in parts if not (s.is_valid and s.volume > 0)]
    report.check(f"{mode}: {len(parts)} valid positive-volume solids", not bad, bad)

parts = [(n, s) for n, s in models["assembled"] if not n.startswith("wire_")]
electronics = [(n, s) for n, s in parts if n.startswith("e_")]
structure = [(n, s) for n, s in parts if not n.startswith("e_")]
hits = interference(electronics, structure, ALLOW)
report.check("Electronics clear of wood, felt, hinges, magnets, handle and fasteners (<= 0.01 mm3)", not hits, hits)
hits = interference(electronics, None, ALLOW, same=lambda a, b: module(a) == module(b))
report.check("Electronic modules clear of each other", not hits, hits)
fasteners = [(n, s) for n, s in structure if n.startswith("fastener_")]
others = [(n, s) for n, s in structure if not n.startswith("fastener_")]
hits = interference(fasteners, others, ALLOW)
report.check("Fasteners pass through their holes and stop clear of other parts", not hits, hits)
hits = interference(fasteners, None, ALLOW, same=lambda a, b: a.rsplit("_", 1)[0] == b.rsplit("_", 1)[0])
report.check("Fasteners clear of each other", not hits, hits)
wood = [(n, s) for n, s in others if n.startswith(("wood_", "hinge_", "magnet_", "handle_", "felt_"))]
hits = interference(wood, None, ALLOW)
report.check("Wood, hinges, magnets, felt and handle do not overlap (glue faces only touch)", not hits, hits)

# Outer size from the saved wood.
wood_only = [s for n, s in parts if n.startswith("wood_")]
lo = [min(tuple(s.bounding_box().min)[i] for s in wood_only) for i in range(3)]
hi = [max(tuple(s.bounding_box().max)[i] for s in wood_only) for i in range(3)]
saved = [round(b - a, 1) for a, b in zip(lo, hi)]
report.check("Saved outer size matches facts", all(abs(a - b) < .3 for a, b in zip(saved, facts["outer_mm"])),
             {"saved": saved, "facts": facts["outer_mm"]})
outside = [n for n, s in electronics if any(tuple(s.bounding_box().min)[i] < lo[i] - 1e-5 or
                                             tuple(s.bounding_box().max)[i] > hi[i] + 1e-5 for i in range(3))]
report.check("Electronics inside the house", not outside, outside)

# Roof opened: the saved open model must be as clear as the closed one.
open_parts = [(n, s) for n, s in models["roof_open"] if n.startswith(("wood_roof", "wood_magnet", "magnet_", "handle_knob",
                                                                      "hinge_roof", "hinge_knuckle", "fastener_C", "fastener_D"))]
fixed = [(n, s) for n, s in models["roof_open"] if (n, s) not in open_parts]
hits = interference(open_parts, fixed, ALLOW)
report.check("Open roof halves (saved) clear of the house, handle and each other", not hits, hits)

# ---------------------------------------------------------------- roof swing
def solids(shapes):
    out = [(("wood_" + s.name), panel_solid(s)) for s in shapes["panels"]]
    out += [(("e_" + b.module + "__" if b.module not in ("hinge", "wood") else "") + b.part,
             box_solid(b, "e_" + b.module + "__" if b.module not in ("hinge", "wood") else "")) for b in shapes["boxes"]]
    out += [(r.name, rod_solid(r)) for r in shapes["rods"]]
    return out


base = build("assembled", wires=True)
fixed = solids({k: [s for s in v if not roof_part(label_of(s))] for k, v in base.items()})
worst = []
for frac in [i / 9 for i in range(10)]:
    for sides in ((-1,), (1,), (-1, 1)):
        moving = []
        for side in (-1, 1):
            r = roof_side(g, side, frac if side in sides else 0.0)
            r["rods"] = r["rods"] + roof_fastener_rods(g, side, frac if side in sides else 0.0)
            moving += solids(r)
        hits = interference([m for m in moving if any(f"_{'left' if s < 0 else 'right'}" in m[0] for s in sides)],
                            fixed, ALLOW)
        if len(sides) == 2:
            left = [m for m in moving if "left" in m[0]]
            right = [m for m in moving if "right" in m[0]]
            hits += interference(left, right, ALLOW)
        if hits:
            worst.append({"opened_deg": round(frac * p["roof"]["open_deg"], 1), "sides": sides, "hits": hits[:4]})
report.check("Roof halves swing 0-45 degrees, alone or together, without touching anything", not worst, worst[:3])

# Magnets meet face to face across the ridge.
mags = {n: s for n, s in parts if n.startswith("magnet_")}
pairs = []
for i in (1, 2):
    a, b = mags[f"magnet_left_{i}"].center(), mags[f"magnet_right_{i}"].center()
    gap = mags[f"magnet_right_{i}"].bounding_box().min.X - mags[f"magnet_left_{i}"].bounding_box().max.X
    pairs.append({"dy": round(a.Y - b.Y, 3), "dz": round(a.Z - b.Z, 3), "gap": round(gap, 2)})
report.check("Each magnet pair is coaxial with a 1 mm gap (0.5 mm recess each side)",
             all(abs(q["dy"]) < 1e-3 and abs(q["dz"]) < 1e-3 and abs(q["gap"] - 2 * p["magnet"]["recess"]) < .01 for q in pairs), pairs)

# An open half must lean outward onto its hinge stop, not fall back closed.
for side, name in ((-1, "left"), (1, "right")):
    r = roof_side(g, side, 1.0)
    r["rods"] += roof_fastener_rods(g, side, 1.0)
    items = []
    for label, s in solids(r):
        density = .68 if label.startswith("wood_") else .72 if "knob" in label else 7.5 if label.startswith(("magnet", "hinge", "fastener")) else .68
        items.append((s, density))
    grams, centre = mass_and_centre(items)
    lever = (centre[0] - side * g.Q[0]) * side
    report.check(f"Open {name} half leans outward on its stop (centre of mass {lever:.1f} mm outboard of the hinge)",
                 lever > 1.0, {"grams": round(grams, 1), "centre_x": round(centre[0], 2), "hinge_x": round(side * g.Q[0], 2)})

# ---------------------------------------------------------------- facts
rules = facts["handle"]
report.check("Handle finger space above the ridge >= 34 mm", rules["finger_gap"] >= 34, rules["finger_gap"])
report.check("Handle grip length >= 85 mm", rules["grip_length"] >= 85, rules["grip_length"])
limit = sorted(p["a4_part_limit"])
for row in facts["cut_list"]:
    w, h = sorted(row["size_mm"])
    report.check(f"{row['part']} fits one A4 template", w <= limit[0] and h <= limit[1], [w, h])
for n, s in parts:
    if n.startswith("wood_") and not n.startswith(("wood_corner", "wood_magnet", "wood_roof")):
        holes = round_holes(s)
        if len(holes) > 1:
            web = min_web(holes)
            report.check(f"{n}: plywood between round holes >= 2.5 mm", web >= 2.5 - 1e-6, round(web, 2))
# The roof boards are saved at 45 degrees, so read their flat hole pattern from source.
from woodkit.shapes import Circle  # noqa: E402
board = next(q for q in base["panels"] if q.name == "roof_right")
web = min_web([(h.u, h.v, h.d) for h in board.holes if isinstance(h, Circle)])
report.check("roof boards: plywood between round holes >= 2.5 mm", web >= 2.5 - 1e-6, round(web, 2))
for r in facts["fasteners"]:
    report.check(f"Fastener {r['id']} ({r['title']}) has a standard length: {r['designation']}", r["length"] > 0, r["warnings"])

atlas = json.loads((ROOT.parents[1] / "web/hardware-visualisation/src/data/setup.json").read_text())["wires"]
keys = ("id", "group", "from", "to", "color")
report.check("27 nets match the working electrical atlas exactly",
             len(routing["wires"]) == 27 and [{k: w[k] for k in keys} for w in routing["wires"]] == [{k: w[k] for k in keys} for w in atlas])
stray = []
for w in routing["wires"]:
    for x, y, z in w["route"]:
        roof = g.U[1] - abs(x)
        if not (-g.xi <= x <= g.xi and g.t <= y <= roof and g.inner_z[0] <= z <= g.inner_z[1]):
            stray.append([w["id"], [round(x, 1), round(y, 1), round(z, 1)]])
report.check("Every wire route stays inside the walls and under the roof", not stray, stray[:5])

# Mass, centre of gravity and how far it tilts before tipping.
weights = {"battery": 150, "pi": 45, "lcd": 20, "speaker": 40, "keypad": 15, "amp": 4, "adc": 3, "divider": 3, "switch": 25, "power": 10}
items = [(s, .72 if n.startswith("handle_") else .68) for n, s in parts if n.startswith(("wood_", "handle_"))]
for m, grams in weights.items():
    box = facts["modules"][m]
    items.append((tuple((a + b) / 2 for a, b in zip(box["min"], box["max"])), grams))
items.append(((0, 60, -50), 25))     # wires, felt, screws and magnets, spread out
grams, centre = mass_and_centre(items)
angles = tip_angles(centre, (-g.half, g.half, -g.D, 0))
report.fact("mass_g", round(grams))
report.fact("centre_of_mass_mm", [round(v, 1) for v in centre])
report.fact("tip_angles_deg", {k: round(v, 1) for k, v in angles.items()})
report.check(f"Stands steadily: tilts at least 18 degrees before tipping (worst {min(angles.values()):.1f})",
             min(angles.values()) >= 18, {k: round(v, 1) for k, v in angles.items()})

ok = report.write(ROOT / "verification.json")
print(f"About {round(grams)} g; centre of mass {[round(v) for v in centre]}; tip angles {[round(v) for v in angles.values()]}")
sys.exit(0 if ok else 1)
