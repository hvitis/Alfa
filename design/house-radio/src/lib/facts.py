"""Saved facts for checks, drawings and the viewer: cut list, fasteners, shopping list, routes."""
from __future__ import annotations

import math

from woodkit.fasteners import shopping_list, size
from woodkit.shapes import Circle, Panel, flat_size

from .house import build, case_parameters, geometry, joints, module_bounds, pin_points, wire_specs

# Bought or kept items that are not screws, nuts or washers: (item, quantity).
OTHER_ITEMS = [
    ("6 mm birch plywood, A4 pieces (see the cut templates)", 0),
    ("beech dowel Ø22 mm, 300 mm (handle 100 + two 14 mm knobs + saw cuts)", 1),
    ("brass butt hinge 25 × 20 mm (leaves 10 mm)", 4),
    ("neodymium disc magnet Ø10 × 3 mm N42 (2 spare for polarity tests)", 6),
    ("2-part epoxy, 5 minute", 1),
    ("wood glue (PVA)", 1),
    ("blue felt disc Ø42 mm (speaker cloth)", 1),
    ("self-adhesive felt pad Ø15 mm (feet)", 4),
    ("hook-and-loop pads 20 × 40 mm, pair (power bank)", 1),
    ("QUARKZMAN USB-C switch cable 0.28 m (you have two)", 1),
    ("USB-C male to micro-USB male lead, up-angled micro plug, about 20 cm, 3 A", 1),
    ("female-female jumper wires 10/15/20 cm (see wiring.csv)", 25),
    ("speaker wire, 2 × 250 mm", 1),
    ("cable ties 100 mm", 6),
    ("adhesive cable-tie mounts", 3),
]


def cut_list(g):
    rows = []
    seen = {}
    for p in build("assembled", wires=False)["panels"]:
        key = p.title or p.name
        size_mm = list(flat_size(p))
        # Identical parts (roof boards, wedges, block pads) collapse into one row.
        family = {"BLOCK PAD": "corner_block", "MAGNET WEDGE": "magnet_wedge"}.get(p.title, p.name)
        if p.title == "ROOF BOARD":
            family = "roof_board"
        if family in seen:
            seen[family]["quantity"] += p.copies
            continue
        row = {"part": family, "title": key, "plane": p.plane, "size_mm": size_mm, "thickness": 6,
               "quantity": p.copies, "holes": len(p.holes), "marks": len(p.marks),
               "coping_saw": any(isinstance(x, Circle) for x in p.outline) or any(not isinstance(h, Circle) for h in p.holes),
               "note": p.note}
        seen[family] = row
        rows.append(row)
    return rows


def fastener_table(g):
    return [size(j) for j in joints(g)]


def shopping(g, a4_sheets=None):
    other = [(item, a4_sheets if item.startswith("6 mm birch") and a4_sheets else n) for item, n in OTHER_ITEMS]
    other = [(item, n) for item, n in other if n]
    return [{"item": item, "needed": n, "buy": buy} for item, n, buy in shopping_list(joints(g), other)]


def facts(a4_sheets=None):
    g = geometry()
    case = case_parameters()
    wires = wire_specs(g, case)
    ridge_top = g.U[1] + g.k                      # top corners of the two boards at the ridge
    return {
        "name": g.p["name"], "title": g.p["title"], "revision": g.p["revision"],
        "outer_mm": [round(g.outer_w, 1), round(g.top, 1), g.D],
        "body_mm": [g.W, g.D], "wall_height": round(g.wall_h, 2), "roof_board": [round(g.length, 1), round(g.z_board[1] - g.z_board[0], 1)],
        "hinge_axis": [round(v, 3) for v in g.Q], "ridge_underside": [round(v, 3) for v in g.U],
        "handle": {"grip_length": g.D - 2 * g.t, "finger_gap": round(g.dowel_y - g.dowel_d / 2 - ridge_top, 1),
                   "grip_diameter": g.dowel_d},
        "cut_list": cut_list(g), "fasteners": fastener_table(g), "shopping": shopping(g, a4_sheets),
        "modules": module_bounds(g, case), "wood_colors": ["#d8b384", "#b38f62", "#b4553e"],
        "routing": {"points": pin_points(g, case), "wires": wires},
        "parameters": g.p,
    }
