"""Concept massing for three hand-cut child radios.

CAD axes match the exported wooden case: X right, Y up, Z toward the viewer.
The front face is z = 0, depth runs negative, the floor is y = 0, and X is
centred on the radio. Panel outlines are 2D primitives in projected (u, v):
  "xy" panels: (X, Y), extruded +Z from `level`  (front, back, gables, fin)
  "zy" panels: (-Z, Y), extruded +X from `level` (side walls)
  "xz" panels: (X, -Z), extruded +Y from `level` (top, bottom, floor)
The sheets draw these same primitives, so drawings and CAD cannot drift.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

# Primitives, panels and patterns live in the shared woodkit toolkit (design/woodkit).
from woodkit.shapes import Box, Circle, Panel, Poly, Rect, Rod, bounds, flat_size, ring, vents, vogel

ROOT = Path(__file__).resolve().parents[2]
CASE = ROOT.parent / "wooden-case"

WOOD, BLOCK, ROOF = "#d8b384", "#b38f62", "#b4553e"
DOWEL, FIN = "#c9935a", "#e3c69c"
WOOD_COLORS = [WOOD, BLOCK, ROOF]
COLORS = {"pi": "#287557", "lcd": "#255988", "screen": "#f2f0de", "keypad": "#242933",
          "cap": "#f0c52d", "speaker": "#292d33", "battery": "#f1f0eb", "amp": "#69418b",
          "adc": "#69418b", "divider": "#b78046", "switch": "#30373e", "metal": "#b2b8be"}


def settings():
    return json.loads((ROOT / "concepts.json").read_text())


def case_parameters():
    # Electronics sizes have one source: the wooden case.
    return json.loads((CASE / "parameters.json").read_text())


# ---------------------------------------------------------------- electronics

def lcd(cx, cy):
    # Portrait 35 x 58 PCB; glass against the inside face; window centred on the PCB.
    x, y = cx - 17.5, cy - 29
    return [Box("lcd", "lcd_module", (x, y, -16), (x + 35, y + 58, -6.4), COLORS["lcd"]),
            Box("lcd", "lcd_active_area", (cx - 15.3, cy - 20.4, -6.4), (cx + 15.3, cy + 20.4, -6), COLORS["screen"])]


def lcd_window(cx, cy):
    return Rect(cx - 16, cy - 23, 32, 46, 2)


def keypad_buttons(cx, cy, case):
    ox, oy, _ = case["keypad"]["origin"]
    # Case centres are measured from the PCB top-left with y down.
    return [(cx - 15 + bx - ox, cy + 32.5 - (by - oy)) for bx, by in case["keypad"]["button_centres"]]


def keypad(cx, cy, case):
    x, y = cx - 15, cy - 32.5
    parts = [Box("keypad", "keypad_pcb", (x, y, -13.6), (x + 30, y + 65, -12), COLORS["keypad"]),
             Box("keypad", "keypad_header", (x + 24, y + 4, -21), (x + 30, y + 14, -13.6), COLORS["keypad"])]
    for i, (bx, by) in enumerate(keypad_buttons(cx, cy, case), 1):
        parts.append(Box("keypad", f"key_switch_{i}", (bx - 4, by - 4, -12), (bx + 4, by + 4, -8), "#48505a"))
        parts.append(Box("keypad", f"key_cap_{i}", (bx - 4.5, by - 4.5, -8), (bx + 4.5, by + 4.5, -1.5), COLORS["cap"]))
    return parts


def keypad_window(cx, cy):
    """The wooden case's stepped window: one opening, plywood tabs over the four PCB corners.
    Separate 14 mm holes would leave a 1 mm web between the left and right caps."""
    steps = [(-9, -31.5), (9, -31.5), (9, -25), (14, -25), (14, 25), (9, 25),
             (9, 31.5), (-9, 31.5), (-9, 25), (-14, 25), (-14, -25), (-9, -25)]
    return Poly([(cx + dx, cy + dy) for dx, dy in steps])


def speaker(cx, cy):
    return [Box("speaker", "speaker_frame", (cx - 20, cy - 20, -8.2), (cx + 20, cy + 20, -7), COLORS["speaker"]),
            Box("speaker", "speaker_body", (cx - 16, cy - 16, -27), (cx + 16, cy + 16, -8.2), COLORS["speaker"])]


def felt(cx, cy, d, color):
    return Rod("felt_speaker_cloth", "z", (cx, cy), (-7, -6), d, color)


def battery(lo, size):
    # Baseus 5000 mAh envelope from the case; orientation chosen per concept.
    return [Box("battery", "Baseus_5000mAh", lo, tuple(a + b for a, b in zip(lo, size)), COLORS["battery"])]


def pi(x, y, back_inner_z, portrait=False):
    """Pi 3 B on 8 mm standoffs on the back panel, components facing the front."""
    w, h = (56, 85) if portrait else (85, 56)
    pcb = back_inner_z + 8
    parts = [Box("pi", "pi_pcb", (x, y, pcb), (x + w, y + h, pcb + 1.6), COLORS["pi"]),
             Box("pi", "pi_components", (x + 2, y + 2, pcb + 1.6), (x + w - 2, y + h - 2, pcb + 18.6), COLORS["metal"])]
    # 40-pin header plus jumper sockets along one long edge.
    if portrait:
        parts.append(Box("pi", "gpio_jumper_clearance", (x + w - 7, y + 7, pcb + 1.6), (x + w - 1, y + 58, pcb + 26), "#24282e"))
        holes = [(x + 3.5, y + 3.5), (x + 52.5, y + 3.5), (x + 3.5, y + 61.5), (x + 52.5, y + 61.5)]
    else:
        parts.append(Box("pi", "gpio_jumper_clearance", (x + 7, y + h - 7, pcb + 1.6), (x + 58, y + h - 1, pcb + 26), "#24282e"))
        holes = [(x + 3.5, y + 3.5), (x + 61.5, y + 3.5), (x + 3.5, y + 52.5), (x + 61.5, y + 52.5)]
    for i, (hx, hy) in enumerate(holes, 1):
        parts.append(Box("pi", f"pi_standoff_{i}", (hx - 2.5, hy - 2.5, back_inner_z), (hx + 2.5, hy + 2.5, pcb), "#e0ded7"))
    return parts, [Circle(hx, hy, 3) for hx, hy in holes]


def small_board(module, x, z, size_xz, color):
    # Lies on 4 mm insulating spacers on the floor; envelope includes its header.
    w, d = size_xz
    return [Box(module, module + "_board", (x, 6, z - d), (x + w, 14, z), color)]


def usb_switch(lo, wall_x, outward):
    """Inline USB switch body (provisional envelope) with its actuator in a side hole."""
    x, y, z = lo
    parts = [Box("switch", "usb_switch_PROVISIONAL", lo, (x + 18, y + 40, z + 22), COLORS["switch"])]
    cy, cz = y + 20, z + 11
    a0, a1 = (wall_x, wall_x + 6) if outward > 0 else (wall_x - 6, wall_x)
    parts.append(Box("switch", "switch_actuator", (a0, cy - 5, cz - 5), (a1, cy + 5, cz + 5), "#242a30"))
    return parts, Circle(-cz, cy, 16)


def corner_blocks(x_inner, y_lo, y_hi, back_inner_z):
    blocks, screws = [], []
    for sx in (-1, 1):
        for y in (y_lo, y_hi - 12):
            x0 = x_inner - 12 if sx > 0 else -x_inner
            blocks.append(Box("wood", f"corner_block_{len(blocks) + 1}", (x0, y, back_inner_z), (x0 + 12, y + 12, back_inner_z + 12), BLOCK))
            screws.append(Circle(x0 + 6, y + 6, 3.5))
    return blocks, screws


# ------------------------------------------------------------------- concepts

def lunchbox(s, case):
    W, H, D, t = 200, 150, 80, s["plywood"]
    xi = W / 2 - t                      # inner half width, 94
    dowel_y, dowel_z, neck = H + 46, -D / 2, 25
    lcd_c, key_c, spk_c = (14, 79), (62, 75), (-48, 75)
    pi_parts, pi_holes = pi(2, 50, -D + t)
    blocks, screws = corner_blocks(xi, t, H - t, -D + t)
    switch_parts, switch_hole = usb_switch((76, 8, -58), xi, +1)
    side = [Poly([(0, 0), (D, 0), (D, H), (D / 2 + neck, dowel_y), (D / 2 - neck, dowel_y), (0, H)]),
            Circle(D / 2, dowel_y, 2 * neck)]
    dowel_hole = Circle(-dowel_z, dowel_y, s["dowel_diameter"])
    panels = [
        Panel("left_side_ear", "zy", -W / 2, side, [dowel_hole]),
        Panel("right_side_ear", "zy", xi, side, [dowel_hole, switch_hole]),
        Panel("top", "xz", H - t, [Rect(-xi, 0, 2 * xi, D)]),
        Panel("bottom", "xz", 0, [Rect(-xi, 0, 2 * xi, D)], vents(-35, 30, 8, 2)),
        Panel("front", "xy", -t, [Rect(-xi, t, 2 * xi, H - 2 * t)],
              [lcd_window(*lcd_c), keypad_window(*key_c)] + vogel(*spk_c, 37, 31, 5)),
        Panel("back_removable", "xy", -D, [Rect(-xi, t, 2 * xi, H - 2 * t)],
              screws + pi_holes + vents(10, 112, 7, 2)),
    ]
    electronics = (lcd(*lcd_c) + keypad(*key_c, case) + speaker(*spk_c) + pi_parts +
                   battery((-90, 7, -44), (69, 106, 14)) +
                   small_board("amp", -15, -40, (20, 15), COLORS["amp"]) +
                   small_board("adc", 10, -30, (9, 29), COLORS["adc"]) +
                   small_board("divider", 25, -40, (16, 20), COLORS["divider"]) + switch_parts)
    rods = [Rod("handle_dowel", "x", (dowel_y, dowel_z), (-W / 2, W / 2), s["dowel_diameter"], DOWEL, "handle"),
            felt(*spk_c, 70, "#c8553d")]
    r = s["dowel_diameter"] / 2
    handle = {"type": "dowel between side ears", "grip_length": 2 * xi,
              "finger_gap": dowel_y - r - H, "grip_diameter": s["dowel_diameter"]}
    return dict(outer=(W, dowel_y + neck, D), panels=panels, blocks=blocks, electronics=electronics,
                rods=rods, handle=handle, decor=[])


def house(s, case):
    W, eave, D, t = 150, 130, 100, s["plywood"]
    half = W / 2
    peak = eave + half                  # 45 degree roof
    dowel_y, knob = peak + 48, 25
    lcd_c, key_c, spk_c = (-34, 88), (36, 50), (0, 152)
    pi_parts, pi_holes = pi(-10, 25, -D + t, portrait=True)
    xi = half - t
    blocks, screws = corner_blocks(xi, t, 116, -D + t)
    switch_parts, switch_hole = usb_switch((51, 80, -58), xi, +1)
    gable = [Poly([(-half, 0), (half, 0), (half, eave), (0, peak), (-half, eave)]),
             Rect(-knob, peak - 30, 2 * knob, dowel_y - peak + 30), Circle(0, dowel_y, 2 * knob)]
    dowel_hole = Circle(0, dowel_y, s["dowel_diameter"])
    # Lapped ridge: the left board runs to the apex; the right board stops under it.
    k, over = t / math.sqrt(2), 12 / math.sqrt(2)
    left_roof = [(-half - over, eave - over), (0, peak), (k, peak - k), (-half - over + k, eave - over - k)]
    right_roof = [(k, peak - k), (half + over, eave - over), (half + over - k, eave - over - k), (0, peak - 2 * k)]
    attic = [Circle(*spk_c, 4)] + ring(*spk_c, 8, 6, 4) + ring(*spk_c, 16, 12, 4, math.pi / 12)
    panels = [
        Panel("front_gable", "xy", -t, gable, [lcd_window(*lcd_c), keypad_window(*key_c), dowel_hole] + attic),
        Panel("back_gable_removable", "xy", -D, gable, [dowel_hole] + screws + pi_holes + vents(-45, 140, 3, 2)),
        Panel("left_wall", "zy", -half, [Rect(t, 0, D - 2 * t, 124)], vents(30, 116, 4, 1)),
        Panel("right_wall", "zy", xi, [Rect(t, 0, D - 2 * t, 124)], [switch_hole]),
        Panel("floor", "xz", 0, [Rect(-xi, t, 2 * xi, D - 2 * t)], vents(-20, 40, 5, 2)),
        Panel("roof_left", "xy", -D + t, [Poly(left_roof)], thickness=D - 2 * t, color=ROOF,
              cut=(round(math.dist(left_roof[0], left_roof[1]), 1), D - 2 * t)),
        Panel("roof_right", "xy", -D + t, [Poly(right_roof)], thickness=D - 2 * t, color=ROOF,
              cut=(round(math.dist(right_roof[0], right_roof[1]), 1), D - 2 * t)),
    ]
    electronics = (lcd(*lcd_c) + keypad(*key_c, case) + speaker(*spk_c) + pi_parts +
                   battery((-69, 7, -81), (14, 106, 69)) +
                   small_board("amp", -45, -30, (20, 15), COLORS["amp"]) +
                   small_board("adc", -20, -30, (9, 29), COLORS["adc"]) +
                   small_board("divider", -45, -55, (16, 20), COLORS["divider"]) + switch_parts)
    rods = [Rod("handle_dowel", "z", (0, dowel_y), (-D, 0), s["dowel_diameter"], DOWEL, "handle"),
            felt(*spk_c, 42, "#4f7cac")]
    r = s["dowel_diameter"] / 2
    handle = {"type": "dowel through chimney tabs", "grip_length": D - 2 * t,
              "finger_gap": round(dowel_y - r - peak, 1), "grip_diameter": s["dowel_diameter"]}
    # Paint lines only: the door around the keys, a frame round the screen window.
    door = [(key_c[0] - 22, 4), (key_c[0] - 22, key_c[1] + 22), (key_c[0], key_c[1] + 40),
            (key_c[0] + 22, key_c[1] + 22), (key_c[0] + 22, 4)]
    frame = [(lcd_c[0] - 22, lcd_c[1] - 29), (lcd_c[0] + 22, lcd_c[1] - 29),
             (lcd_c[0] + 22, lcd_c[1] + 29), (lcd_c[0] - 22, lcd_c[1] + 29), (lcd_c[0] - 22, lcd_c[1] - 29)]
    return dict(outer=(round(2 * (half + over)), dowel_y + knob, D), panels=panels, blocks=blocks,
                electronics=electronics, rods=rods, handle=handle, decor=[door, frame])


CLOUD_BUMPS = [(-74, 136, 15), (-50, 158, 26), (-18, 172, 28), (20, 175, 27), (50, 158, 26), (74, 136, 15)]
CLOUD_SLOT = (0, 150, 100, 34)          # centre x, centre y, length, height


def cloud_outline(top):
    return [Rect(-84, top, 168, 26)] + [Circle(x, y, 2 * r) for x, y, r in CLOUD_BUMPS]


def cloud_slot():
    cx, cy, length, height = CLOUD_SLOT
    straight = length - height
    return [Rect(cx - straight / 2, cy - height / 2, straight, height),
            Circle(cx - straight / 2, cy, height), Circle(cx + straight / 2, cy, height)]


def cloud_bar():
    """Thinnest wood above the hand hole, sampled across the hole."""
    cx, cy, length, height = CLOUD_SLOT
    straight, r = (length - height) / 2, height / 2
    worst = math.inf
    for i in range(201):
        x = cx - length / 2 + length * i / 200
        dx = max(0, abs(x - cx) - straight)
        hole_top = cy + math.sqrt(max(0, r * r - dx * dx))
        tops = [y + math.sqrt(rr * rr - (x - bx) ** 2) for bx, y, rr in CLOUD_BUMPS if abs(x - bx) < rr]
        worst = min(worst, max(tops) - hole_top)
    return round(worst, 1)


def cloud(s, case):
    W, H, D, t = 200, 120, 90, s["plywood"]
    xi = W / 2 - t
    lcd_c, key_c, spk_c = (2, 62), (-58, 60), (60, 62)
    pi_parts, pi_holes = pi(-42, 40, -D + t)
    blocks, screws = corner_blocks(xi, t, H - t, -D + t)
    switch_parts, switch_hole = usb_switch((-94, 30, -58), -xi, -1)
    sun = [Circle(*spk_c, 5)] + ring(*spk_c, 8, 6, 5) + ring(*spk_c, 16, 12, 5, math.pi / 12) + ring(*spk_c, 26, 12, 4)
    fin_outline, fin_holes = cloud_outline(H), cloud_slot()
    panels = [
        Panel("left_side", "zy", -W / 2, [Rect(0, 0, D, H)], [switch_hole]),
        Panel("right_side", "zy", xi, [Rect(0, 0, D, H)], vents(30, 30, 4, 1)),
        Panel("top", "xz", H - t, [Rect(-xi, 0, 2 * xi, D)], [Circle(x, D / 2, 3.5) for x in (-50, 0, 50)]),
        Panel("bottom", "xz", 0, [Rect(-xi, 0, 2 * xi, D)], vents(-80, 25, 3, 3)),
        Panel("front", "xy", -t, [Rect(-xi, t, 2 * xi, H - 2 * t)],
              [lcd_window(*lcd_c), keypad_window(*key_c)] + sun),
        Panel("back_removable", "xy", -D, [Rect(-xi, t, 2 * xi, H - 2 * t)], screws + pi_holes + vents(-35, 100, 8, 1)),
    ]
    # Three identical layers, glued into an 18 mm fin; not plywood-coloured so it stays shown.
    for i in range(3):
        panels.append(Panel(f"cloud_handle_layer_{i + 1}", "xy", -D / 2 - 9 + 6 * i, fin_outline, fin_holes, color=FIN))
    electronics = (lcd(*lcd_c) + keypad(*key_c, case) + speaker(*spk_c) + pi_parts +
                   battery((-53, 7, -81), (106, 14, 69)) +
                   small_board("amp", 58, -40, (20, 15), COLORS["amp"]) +
                   small_board("adc", 56, -60, (29, 9), COLORS["adc"]) +
                   small_board("divider", -80, -30, (16, 20), COLORS["divider"]) + switch_parts)
    rods = [felt(*spk_c, 56, "#f2c14e")]
    handle = {"type": "cloud fin with hand hole", "grip_length": CLOUD_SLOT[2], "finger_gap": CLOUD_SLOT[3],
              "bar_height": cloud_bar(), "fin_thickness": 18}
    top = max(y + r for _, y, r in CLOUD_BUMPS)
    return dict(outer=(W, top, D), panels=panels, blocks=blocks, electronics=electronics,
                rods=rods, handle=handle, decor=[])


BUILDERS = {"lunchbox": lunchbox, "house": house, "cloud": cloud}


def concept(concept_id):
    s = settings()
    meta = next(c for c in s["concepts"] if c["id"] == concept_id)
    return dict(BUILDERS[concept_id](s, case_parameters()), meta=meta, id=concept_id)


# ----------------------------------------------------------------- CAD export

def assembly(c):
    from woodkit.cad import box_solid, compound, panel_solid, rod_solid
    parts = [panel_solid(p) for p in c["panels"]]
    parts += [box_solid(b, "wood_") for b in c["blocks"]]
    parts += [rod_solid(r) for r in c["rods"]]
    parts += [box_solid(b, f"e_{b.module}__") for b in c["electronics"]]
    return compound(parts, "wooden_radio_" + c["id"])


# ---------------------------------------------------------------- saved facts

def hole_counts(panels):
    counts = {}
    for p in panels:
        for h in p.holes:
            if isinstance(h, Circle):
                key = f"{h.d:g}"
                counts[key] = counts.get(key, 0) + p.copies
    return dict(sorted(counts.items(), key=lambda kv: float(kv[0])))


def module_bounds(c):
    out = {}
    for b in c["electronics"]:
        lo, hi = out.get(b.module, (list(b.lo), list(b.hi)))
        out[b.module] = ([min(a, x) for a, x in zip(lo, b.lo)], [max(a, x) for a, x in zip(hi, b.hi)])
    for r in c["rods"]:
        if r.module:
            a, b = r.span
            c1, c2 = r.centre
            rr = r.d / 2
            lo = {"x": (a, c1 - rr, c2 - rr), "z": (c1 - rr, c2 - rr, a)}[r.axis]
            hi = {"x": (b, c1 + rr, c2 + rr), "z": (c1 + rr, c2 + rr, b)}[r.axis]
            out[r.module] = (list(lo), list(hi))
    if c["id"] == "cloud":
        fins = [p for p in c["panels"] if p.name.startswith("cloud_handle")]
        u0, v0, u1, v1 = bounds(fins[0].outline)
        out["handle"] = ([u0, v0, fins[0].level], [u1, v1, fins[-1].level + 6])
    return {k: {"min": [round(v, 2) for v in lo], "max": [round(v, 2) for v in hi]} for k, (lo, hi) in out.items()}


def facts(c, volume_mm3=None):
    s = settings()
    # A coping saw is needed for curved outlines and closed windows; round holes are drilled.
    cut = [{"part": p.name, "plane": p.plane, "size_mm": list(flat_size(p)), "copies": p.copies,
            "coping_saw": any(isinstance(x, Circle) for x in p.outline) or any(not isinstance(h, Circle) for h in p.holes),
            "holes": len(p.holes)} for p in c["panels"]]
    cut += [{"part": b.part, "plane": "block", "size_mm": [12, 12], "copies": 1, "coping_saw": False, "holes": 1}
            for b in c["blocks"]]
    return {"id": c["id"], "outer_mm": [round(v, 1) for v in c["outer"]], "handle": c["handle"],
            "cut_list": cut, "plywood_parts": len(c["panels"]), "hole_counts": hole_counts(c["panels"]),
            "modules": module_bounds(c), "wood_colors": WOOD_COLORS, "a4_part_limit": s["a4_part_limit"]}
