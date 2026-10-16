"""Alfa, the little house radio: complete geometry.

Millimetres, woodkit axes: X right (centred), Y up (floor y = 0), Z toward the
viewer (front face z = 0, back face z = -depth). The roof is 45 degrees.

Everything that is drawn, cut, checked or bought comes from `build(mode)`:
plywood panels, glued blocks, electronics envelopes, cable/plug envelopes,
hinges, magnets, the handle and every fastener with the length chosen by the
woodkit fastener calculator.
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from types import SimpleNamespace

from woodkit.fasteners import Joint, Layer, size
from woodkit.shapes import Box, Circle, Mark, Panel, Poly, Pose, Rect, Rod, place, ring, then, vents

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT.parents[1]
CASE = ROOT.parent / "wooden-case"
SQ2 = math.sqrt(2)

WOOD, BLOCK, ROOF, DOWEL = "#d8b384", "#b38f62", "#b4553e", "#c9935a"
FELT, METAL, BRASS, MAGNET, NYLON = "#4f7cac", "#9aa3ab", "#c9a227", "#6b7177", "#ece9df"
WOOD_COLORS = [WOOD, BLOCK, ROOF]
COLORS = {"pi": "#287557", "lcd": "#255988", "screen": "#f2f0de", "keypad": "#242933", "cap": "#f0c52d",
          "speaker": "#292d33", "battery": "#f1f0eb", "amp": "#69418b", "adc": "#69418b",
          "divider": "#b78046", "switch": "#30373e", "plug": "#22272d", "metal": "#b2b8be"}
MODES = ("assembled", "roof_open", "inside", "exploded")


def parameters():
    return json.loads((ROOT / "parameters.json").read_text())


def case_parameters():
    # Electronics sizes and keypad button positions come from the wooden case.
    return json.loads((CASE / "parameters.json").read_text())


# ------------------------------------------------------------------ geometry

def geometry(p=None):
    p = p or parameters()
    assert p["house"]["pitch_deg"] == 45, "the roof and wedge geometry assume a 45 degree roof"
    t, W, D = p["plywood"], p["house"]["width"], p["house"]["depth"]
    half, eave = W / 2, p["house"]["eave"]
    peak = eave + half
    k = t / SQ2
    over = p["roof"]["overhang"]
    U = (0.0, peak - 2 * k)                                  # ridge underside corner (both boards)
    wall_h = U[1] - half                                       # underside line y = |x| ... meets the wall face
    P = (half, wall_h)                                         # right wall's outer top corner, the pivot line
    length = (half + over / SQ2 - k) * SQ2                     # board length along the slope
    hinge = p["hinge"]
    # Hinge axis: `offset` mm outside both the wall face and the roof underside.
    off = p["roof"]["hinge_axis_offset"] / math.sin(math.radians(22.5))
    bis = (math.cos(math.radians(-67.5)), math.sin(math.radians(-67.5)))
    Q = (P[0] + off * bis[0], P[1] + off * bis[1])
    dowel_y = peak + p["handle"]["above_peak"]
    c = p["roof"]["end_clearance"]
    return SimpleNamespace(
        p=p, t=t, W=W, D=D, half=half, eave=eave, peak=peak, k=k, over=over, U=U, wall_h=wall_h, P=P, Q=Q,
        length=length, pivot_local=(half * SQ2, 0), z_board=(-D + t + c, -t - c), dowel_y=dowel_y,
        dowel_d=p["handle"]["dowel_d"], tab=p["handle"]["tab_half_width"], top=dowel_y + p["handle"]["tab_half_width"],
        xi=half - t, inner_z=(-D + t, -t), hinge=hinge, outer_w=2 * (half + over / SQ2))


def mirror_x(prims):
    out = []
    for q in prims:
        if isinstance(q, Rect):
            out.append(Rect(-q.u - q.w, q.v, q.w, q.h, q.r))
        elif isinstance(q, Circle):
            out.append(Circle(-q.u, q.v, q.d))
        elif isinstance(q, Mark):
            out.append(Mark(-q.u, q.v, q.label, q.transfer))
        else:
            out.append(Poly([(-x, y) for x, y in q.points]))
    return out


# ------------------------------------------------------------------ front parts

def lcd(cx, cy):
    """Waveshare 2-inch LCD, glass against the inside of the gable on 4 mm spacers."""
    x, y = cx - 17.5, cy - 29
    return [Box("lcd", "lcd_glass", (cx - 17, cy - 23.5, -9.8), (cx + 17, cy + 23.5, -6.4), COLORS["lcd"]),
            Box("lcd", "lcd_active_area", (cx - 15.3, cy - 20.4, -6.4), (cx + 15.3, cy + 20.4, -6.05), COLORS["screen"]),
            Box("lcd", "lcd_pcb", (x, y, -11.6), (x + 35, y + 58, -10), COLORS["lcd"]),
            # 8-pin header: pins at x + 26.39 - i * 2.54, i = 0..7.
            Box("lcd", "lcd_header", (x + 7.3, y + 52, -19.6), (x + 27.7, y + 57, -11.6), "#24282e")] + \
        [Box("lcd", f"lcd_spacer_{i}", (hx - 2.5, hy - 2.5, -10), (hx + 2.5, hy + 2.5, -6), NYLON)
         for i, (hx, hy) in enumerate(lcd_holes(cx, cy), 1)]


def lcd_holes(cx, cy):
    # 30 x 53 mm mounting pitch from the Waveshare drawing.
    return [(cx + dx, cy + dy) for dx in (-15, 15) for dy in (-26.5, 26.5)]


def lcd_window(cx, cy):
    return Rect(cx - 16, cy - 23, 32, 46, 2)


def keypad_buttons(cx, cy, case):
    ox, oy, _ = case["keypad"]["origin"]
    return [(cx - 15 + bx - ox, cy + 32.5 - (by - oy)) for bx, by in case["keypad"]["button_centres"]]


def keypad(cx, cy, case):
    """Five-button board 1 mm behind the gable (as in the case); caps 1 mm below the front face."""
    x, y = cx - 15, cy - 32.5
    parts = [Box("keypad", "keypad_pcb", (x, y, -8.6), (x + 30, y + 65, -7), COLORS["keypad"]),
             # Right-angle header at the bottom-right, OUT/VCC/GND, plus jumper sockets.
             Box("keypad", "keypad_header", (x + 30, y + 12, -11.6), (x + 36, y + 21, -8.6), "#24282e"),
             Box("keypad", "keypad_sockets", (x + 36, y + 12, -12.1), (x + 50, y + 21, -8.1), "#30353c")]
    for i, (bx, by) in enumerate(keypad_buttons(cx, cy, case), 1):
        parts.append(Box("keypad", f"key_switch_{i}", (bx - 4, by - 4, -7), (bx + 4, by + 4, -3), "#48505a"))
        parts.append(Box("keypad", f"key_cap_{i}", (bx - 4.2, by - 4.2, -3), (bx + 4.2, by + 4.2, -1), COLORS["cap"]))
    return parts


def keypad_window(cx, cy):
    """The wooden case's stepped window; plywood tabs cover the board's corner holes."""
    steps = [(-9, -31.5), (9, -31.5), (9, -25), (14, -25), (14, 25), (9, 25),
             (9, 31.5), (-9, 31.5), (-9, 25), (-14, 25), (-14, -25), (-9, -25)]
    return Poly([(cx + dx, cy + dy) for dx, dy in steps])


def keypad_tab_holes(cx, cy):
    # Corner mounting holes under the plywood tabs: provisional, transfer from the board.
    return [(cx + dx, cy + dy) for dx in (-12, 12) for dy in (-29.5, 29.5)]


def speaker(cx, cy):
    # The round body is a Rod in rods(); corner screws sit outside it, as on the real frame.
    return [Box("speaker", "speaker_frame", (cx - 20, cy - 20, -8.2), (cx + 20, cy + 20, -7), COLORS["speaker"])]


def speaker_holes(cx, cy):
    return [(cx + dx, cy + dy) for dx in (-16.5, 16.5) for dy in (-16.5, 16.5)]


# ------------------------------------------------------------------ panels

def gable_outline(g):
    return [Poly([(-g.half, 0), (g.half, 0), (g.half, g.eave), (0, g.peak), (-g.half, g.eave)]),
            Rect(-g.tab, g.peak - 30, 2 * g.tab, g.dowel_y - g.peak + 30), Circle(0, g.dowel_y, 2 * g.tab)]


def panels(g, case):
    p, t = g.p, g.t
    f = p["front"]
    lcd_c, key_c, spk_c = f["lcd_centre"], f["keypad_centre"], f["speaker_centre"]
    attic = [Circle(*spk_c, 4)] + ring(*spk_c, 8, 6, 4) + ring(*spk_c, 16, 12, 4, math.pi / 12)
    front = Panel("front_gable", "xy", -t, gable_outline(g),
                  [lcd_window(*lcd_c), keypad_window(*key_c), Circle(0, g.dowel_y, g.dowel_d)] + attic +
                  [Circle(x, y, 2.9) for x, y in lcd_holes(*lcd_c)] +
                  [Circle(x, y, 3.4) for x, y in speaker_holes(*spk_c)],
                  marks=[Mark(x, y, "transfer", True) for x, y in keypad_tab_holes(*key_c)],
                  title="FRONT GABLE", note="Outside face shown. LCD window, button window, attic grille.")
    sw = p["switch_cable"]
    sx, sy = sw["switch_origin"]
    sw_w, sw_h, _ = sw["switch_envelope"]
    back = Panel("back_gable", "xy", -g.D, gable_outline(g),
                 [Circle(0, g.dowel_y, g.dowel_d), Circle(sx + sw_w / 2, sy + sw_h / 2, sw["button_d"])] +
                 [Circle(x, y, 3.4) for x, y in block_screws(g)] +
                 [Circle(x, y, 3.4) for x, y in clamp_screws(g)] +
                 vents(-20, 150, 5, 2) + vents(-20, 12, 5, 1),
                 title="BACK GABLE", note="Removable: 4 screws + the dowel screw. Outside face shown.")
    pi_holes = [Circle(-z, y, 2.9) for z, y in pi_hole_zy(g)]
    left = Panel("left_wall", "zy", -g.half, [Rect(t, 0, g.D - 2 * t, g.wall_h)],
                 [Circle(-z, y, 3.4) for z, y in hinge_wall_holes(g)] + pi_holes + vents(36, 62, 3, 3),
                 title="LEFT WALL", note="Raspberry Pi on the inside; hinge bolts at the top edge.")
    right = Panel("right_wall", "zy", g.xi, [Rect(t, 0, g.D - 2 * t, g.wall_h)],
                  [Circle(-z, y, 3.4) for z, y in hinge_wall_holes(g)] + vents(30, 60, 4, 1),
                  title="RIGHT WALL")
    floor = Panel("floor", "xz", 0, [Rect(-g.xi, t, 2 * g.xi, g.D - 2 * t)], vents(10, 30, 4, 2),
                  marks=[Mark(x, -z, "transfer", True) for x, z in board_holes(g)],
                  title="FLOOR")
    out = [front, back, left, right, floor]
    s = p["blocks"]["size"]
    for i, (x, y) in enumerate(block_screws(g), 1):
        out.append(Panel(f"corner_block_{i}", "xy", -g.D + t, [Rect(x - s / 2, y - s / 2, s, s)], [Circle(x, y, 3.4)],
                         thickness=s, color=BLOCK, cut=(s, s), copies=2, title="BLOCK PAD",
                         note="Glue two pads into one 12 mm block; glue an M3 nut on the inner face."))
    out.append(Panel("battery_fence", "xy", -78, [Rect(-34.5, t, 69, 12)], title="BATTERY FENCE",
                     note="Glued to the floor in front of the power bank."))
    out.append(Panel("switch_clamp", "xy", -g.D + t + 12, [Rect(26, 113, 38, 18)],
                     [Circle(x, y, 3.4) for x, y in clamp_screws(g)], title="SWITCH CLAMP",
                     note="Holds the QUARKZMAN switch body against the back gable."))
    return out


def block_screws(g):
    s, (y0, y1) = g.p["blocks"]["size"], g.p["blocks"]["y"]
    return [(sx * (g.xi - s / 2), y + s / 2) for sx in (-1, 1) for y in (y0, y1)]


def clamp_screws(g):
    return [(31, 119), (59, 119)]


def hinge_wall_holes(g):
    """(z, y) of the wall-leaf bolts; same on both walls."""
    h = g.hinge
    y = g.Q[1] - h["hole_from_axis"]
    return [(zc + dz, y) for zc in h["z_centres"] for dz in (-h["hole_pitch"] / 2, h["hole_pitch"] / 2)]


def pi_frame(g):
    pi = g.p["pi"]
    return dict(z_front=pi["z_front"], z_back=pi["z_front"] - 56, y0=pi["y_bottom"], y1=pi["y_bottom"] + 85,
                pcb_x=-g.xi + pi["standoff"])


def pi_hole_zy(g):
    f = pi_frame(g)
    # Pi 3 B: 58 x 49 mm pattern, 3.5 mm from the SD-card end (up) and the long edges.
    return [(z, y) for z in (f["z_front"] - 3.5, f["z_back"] + 3.5) for y in (f["y1"] - 3.5, f["y1"] - 61.5)]


def board_holes(g):
    """(x, z) of the small boards' floor screws: provisional, transfer from the boards."""
    b = g.p["boards"]
    return [(b["amp"][0] + 2.5, b["amp"][1] - 2.5), (b["amp"][0] + 17.5, b["amp"][1] - 12.5),
            (b["adc"][0] + 4.5, b["adc"][1] - 3), (b["adc"][0] + 4.5, b["adc"][1] - 26),
            (b["divider"][0] + 2.5, b["divider"][1] - 2.5), (b["divider"][0] + 13.5, b["divider"][1] - 17.5)]


# ------------------------------------------------------------------ roof

def roof_pose(g, side):
    """Board-local frame -> house. Local x runs down the slope from the ridge, y up through the board."""
    return [Pose(axis=(0, 0, 1), angle=-45 * side), Pose(move=(g.U[0], g.U[1], 0))]


def open_pose(g, side, fraction=1.0):
    Q = (side * g.Q[0], g.Q[1], 0)
    return Pose(pivot=Q, axis=(0, 0, 1), angle=-side * g.p["roof"]["open_deg"] * fraction)


def roof_side(g, side, opened=0.0):
    """One roof half: board, magnet wedges, magnets, knob, hinge leaves and roof bolts.
    side = +1 right, -1 left. `opened` is 0 (closed) to 1 (standing up)."""
    p, t, h = g.p, g.t, g.hinge
    name = "right" if side > 0 else "left"
    sgn = side
    z0, z1 = g.z_board
    L = g.length
    knob = p["knob"]
    pivot_u = g.pivot_local[0]
    # Board-local x of the knuckle axis, then the leaf and its bolt line.
    q_local = pivot_u + p["roof"]["hinge_axis_offset"] * (1 + SQ2)
    bolt_u = q_local + h["hole_from_axis"]
    holes = [Circle(sgn * knob["from_ridge"], 50, 3.5)]
    holes += [Circle(sgn * bolt_u, -zc - dz, 3.4) for zc in h["z_centres"] for dz in (-h["hole_pitch"] / 2, h["hole_pitch"] / 2)]
    u0 = 0 if sgn > 0 else -L
    board_place = roof_pose(g, side)
    opening = [open_pose(g, side, opened)] if opened else []
    pose = then(board_place, opening)
    board = Panel(f"roof_{name}", "xz", 0, [Rect(u0, -z1, L, z1 - z0)], holes, color=ROOF, pose=pose,
                  title="ROOF BOARD", note="Two identical boards. Top face shown; knob on top, hinges under the eave.")
    parts = {"panels": [board], "boxes": [], "rods": []}
    # Magnet wedges: right-angle triangles, vertical face on the ridge plane x = 0 when closed.
    mg = p["magnet"]
    leg = mg["wedge_leg"]
    Uy = g.U[1]
    tri = [(0, Uy), (0, Uy - leg), (sgn * leg, Uy - leg)]
    for i, zc in enumerate(mg["z_centres"], 1):
        thick = 6 * mg["wedge_layers"]
        parts["panels"].append(Panel(f"magnet_wedge_{name}_{i}", "xy", zc - thick / 2, [Poly(tri)], thickness=thick,
                                     color=BLOCK, pose=opening, cut=(leg, leg), copies=mg["wedge_layers"],
                                     title="MAGNET WEDGE",
                                     note="Glue three triangles into an 18 mm wedge; magnet pocket in the upright face."))
        x0, x1 = sorted((sgn * mg["recess"], sgn * (mg["recess"] + mg["h"])))
        parts["rods"].append(Rod(f"magnet_{name}_{i}", "x", (Uy - mg["centre_below_ridge"], zc), (x0, x1), mg["d"],
                                 MAGNET, pose=opening))
    # Knob: a 14 mm slice of the 22 mm dowel, screwed from below.
    kx = sgn * knob["from_ridge"]
    parts["rods"].append(Rod(f"handle_knob_{name}", "y", (kx, -50), (t, t + knob["h"]), knob["d"], DOWEL,
                             module="knobs", pose=pose))
    # Hinge roof leaves under the overhang; knuckle on the hinge axis.
    for i, zc in enumerate(h["z_centres"], 1):
        za, zb = zc - h["length"] / 2, zc + h["length"] / 2
        ua, ub = sorted((sgn * (q_local - 1.0), sgn * (q_local + h["leaf"])))
        parts["boxes"].append(Box("hinge", f"hinge_roof_leaf_{name}_{i}", (ua, -h["thickness"], za), (ub, 0, zb), BRASS, pose=pose))
        parts["rods"].append(Rod(f"hinge_knuckle_{name}_{i}", "z", (sgn * q_local, -1.0), (za, zb), h["knuckle_d"],
                                 BRASS, pose=pose))
    return parts


def wall_leaves(g):
    h = g.hinge
    out = []
    for side in (-1, 1):
        x0, x1 = sorted((side * g.half, side * (g.half + h["thickness"])))
        for i, zc in enumerate(h["z_centres"], 1):
            out.append(Box("hinge", f"hinge_wall_leaf_{'right' if side > 0 else 'left'}_{i}",
                           (x0, g.Q[1] - h["leaf"], zc - h["length"] / 2), (x1, g.Q[1] - 1.0, zc + h["length"] / 2), BRASS))
    return out


# ------------------------------------------------------------------ inside

def electronics(g, case):
    p, t = g.p, g.t
    f = p["front"]
    parts = lcd(*f["lcd_centre"]) + keypad(*f["keypad_centre"], case) + speaker(*f["speaker_centre"])
    # Raspberry Pi 3 B on the left wall: PCB parallel to the wall, components toward the centre.
    pf = pi_frame(g)
    x0, zf, zb, y0, y1 = pf["pcb_x"], pf["z_front"], pf["z_back"], pf["y0"], pf["y1"]
    xp = x0 + 1.6
    parts += [Box("pi", "pi_pcb", (x0, y0, zb), (xp, y1, zf), COLORS["pi"]),
              Box("pi", "pi_low_components", (xp, y0 + 2, zb + 2), (xp + 6, y1 - 2, zf - 2), COLORS["metal"]),
              Box("pi", "pi_usb_ethernet", (xp, y0 - 2, zb + 1), (xp + 16, y0 + 21, zf - 1), COLORS["metal"]),
              Box("pi", "gpio_jumper_sockets", (xp, 52, zf - 7), (xp + 22.5, 105, zf), "#24282e"),
              Box("pi", "microusb_upangle_plug", (xp, 94, zb - 4), (xp + 20, 105, zb + 6), COLORS["plug"])]
    for i, (z, y) in enumerate(pi_hole_zy(g), 1):
        parts.append(Box("pi", f"pi_standoff_{i}", (-g.xi, y - 2.5, z - 2.5), (x0, y + 2.5, z + 2.5), NYLON))
    # Baseus 5000 mAh standing on the floor against the back gable, port up.
    bw, bh, bd = case["battery"]["size"]
    zb_back = -g.D + t + p["battery"]["gap_to_back"]
    parts += [Box("battery", "Baseus_5000mAh", (-bw / 2, t, zb_back), (bw / 2, t + bh, zb_back + bd), COLORS["battery"]),
              Box("battery", "hook_and_loop_pads", (-20, 40, -g.D + t), (20, 80, zb_back), "#50575a")]
    top = t + bh
    zc = zb_back + bd / 2
    # QUARKZMAN male plug in the bank's USB-C port (overmould envelope, provisional).
    parts.append(Box("power", "quarkzman_male_plug", (-6, top, zc - 3.25), (6, top + 22, zc + 3.25), COLORS["plug"]))
    # QUARKZMAN inline switch body held by the clamp, button through the back gable.
    sw = p["switch_cable"]
    sx, sy = sw["switch_origin"]
    w, h, d = sw["switch_envelope"]
    parts.append(Box("switch", "quarkzman_switch_PROVISIONAL", (sx, sy, -g.D + t), (sx + w, sy + h, -g.D + t + d), COLORS["switch"]))
    parts.append(Box("switch", "switch_button", (sx + w / 2 - 4, sy + h / 2 - 4, -g.D + 2), (sx + w / 2 + 4, sy + h / 2 + 4, -g.D + t),
                     "#242a30"))
    for i, (x, y) in enumerate(clamp_screws(g), 1):
        parts.append(Box("switch", f"clamp_spacer_{i}", (x - 3, y - 3, -g.D + t), (x + 3, y + 3, -g.D + t + 12), NYLON))
    b = p["boards"]
    for module, (x, z), (w, dz) in (("amp", b["amp"], (20, 15)), ("adc", b["adc"], (9, 29)), ("divider", b["divider"], (16, 20))):
        parts.append(Box(module, module + "_board", (x, t, z - dz), (x + w, t + 8, z), COLORS[module]))
    return parts


def rods(g):
    p = g.p
    spk = p["front"]["speaker_centre"]
    return [Rod("handle_dowel", "z", (0, g.dowel_y), (-g.D, 0), g.dowel_d, DOWEL, module="handle"),
            Rod("felt_speaker_cloth", "z", tuple(spk), (-7, -6), 42, FELT),
            Rod("e_speaker__speaker_body", "z", tuple(spk), (-27, -8.2), 34, COLORS["speaker"], module="speaker")]


# ------------------------------------------------------------------ fasteners

def joints(g):
    """Every fastening, sized by woodkit.fasteners. Thicknesses are the real stack."""
    t = g.t
    h = g.hinge["thickness"]
    J = [
        Joint("A", "Back gable to corner blocks", "glued_nut", "M3", [Layer("back gable", t), Layer("block", 12)], 4,
              washer=False, note="Nut glued on each block's inner face before the blocks go in."),
        Joint("B", "Hinge leaf to wall", "bolt", "M3", [Layer("hinge leaf", h), Layer("wall", t)], 8,
              note="Countersink through the leaf into the wall so the head is flush; nuts inside."),
        Joint("C", "Hinge leaf to roof eave", "acorn", "M3", [Layer("hinge leaf", h), Layer("roof", t)], 8,
              note="Head flush in the leaf under the eave; brass acorn nuts on the roof top."),
        Joint("D", "Knob to roof board", "wood", 3.0, [Layer("roof", t)], 2, receiving=14, receiving_name="knob",
              hard=True, note="From below, plus glue. Pilot 2.2 mm into the end grain."),
        Joint("E", "Dowel handle ends", "wood", 4.0, [Layer("repair washer 25 mm", 1.5)], 2, receiving=45,
              receiving_name="dowel end grain", hard=True, head="pan", extras=[("repair washer 4.3 × 25 mm", 1)],
              note="One per end; the washers overlap the gable holes so the dowel cannot slide out."),
        Joint("F", "LCD to front gable", "bolt", "M2.5", [Layer("front gable", t), Layer("spacer", 4), Layer("LCD PCB", 1.6)], 4,
              extras=[("M2.5 × 4 nylon spacer", 1)], note="Spacers keep the glass just touching the gable."),
        Joint("G", "Speaker to front gable", "bolt", "M3", [Layer("front gable", t), Layer("felt", 1), Layer("speaker frame", 1.2)], 4),
        Joint("H", "Keypad to front gable tabs", "bolt", "M2.5", [Layer("front gable", t), Layer("nylon washer", 1), Layer("keypad PCB", 1.6)], 4,
              extras=[("M2.5 nylon washer 1 mm", 1)], note="Transfer the hole positions from the board."),
        Joint("I", "Pi standoffs to left wall", "standoff", "M2.5", [Layer("left wall", t)], 4, receiving=5,
              receiving_name="standoff thread", extras=[("M2.5 × 8 female-female standoff", 1)]),
        Joint("J", "Pi board to standoffs", "standoff", "M2.5", [Layer("Pi PCB", 1.6)], 4, head="pan", receiving=5,
              receiving_name="standoff thread"),
        Joint("K", "Small boards to floor", "bolt", "M2.5", [Layer("floor", t), Layer("spacer", 4), Layer("board", 1.6)], 6,
              head="pan", extras=[("M2.5 × 4 nylon spacer", 1)], material="nylon",
              note="Nylon screws and nuts; transfer holes from the boards."),
        Joint("L", "Switch clamp through back gable", "bolt", "M3", [Layer("back gable", t), Layer("spacer", 12), Layer("clamp", t)], 2,
              extras=[("M3 × 12 nylon spacer", 1)], note="Spacer length follows the measured switch body."),
    ]
    return J


def fastener_rods(g):
    """Shanks, washers and nuts as solids, from the calculated lengths."""
    t = g.t
    sized = {j.id: size(j) for j in joints(g)}
    out = []

    def screw(tag, axis, centre, start, sign, joint, nut_at=None, nut_d=6.4, nut_h=2.4, washer=.5, pose=None, color=METAL):
        L = sized[joint]["length"]
        d = float(joint_thread(joint))
        a, b = sorted((start, start + sign * L))
        out.append(Rod(f"fastener_{joint}_{tag}_shank", axis, centre, (a, b), d, color, pose=pose))
        if nut_at is not None:
            w0, w1 = sorted((nut_at, nut_at + sign * washer))
            if washer:
                out.append(Rod(f"fastener_{joint}_{tag}_washer", axis, centre, (w0, w1), nut_d + .6, color, pose=pose))
            n0, n1 = sorted((nut_at + sign * washer, nut_at + sign * (washer + nut_h)))
            out.append(Rod(f"fastener_{joint}_{tag}_nut", axis, centre, (n0, n1), nut_d, color, pose=pose))

    def joint_thread(j):
        return {"A": 3, "B": 3, "C": 3, "D": 3, "E": 4, "F": 2.5, "G": 3, "H": 2.5, "I": 2.5, "J": 2.5, "K": 2.5, "L": 3}[j]

    for i, (x, y) in enumerate(block_screws(g), 1):
        screw(f"{i}", "z", (x, y), -g.D, +1, "A", nut_at=-g.D + t + 12, washer=0)
    for side in (-1, 1):
        for i, (z, y) in enumerate(hinge_wall_holes(g), 1):
            face = side * (g.half + g.hinge["thickness"])
            screw(f"{side}_{i}", "x", (y, z), face, -side, "B", nut_at=side * g.xi)
    f = g.p["front"]
    for i, (x, y) in enumerate(lcd_holes(*f["lcd_centre"]), 1):
        screw(f"{i}", "z", (x, y), 0, -1, "F", nut_at=-t - 4 - 1.6, nut_d=5.1, nut_h=2.0)
    for i, (x, y) in enumerate(speaker_holes(*f["speaker_centre"]), 1):
        screw(f"{i}", "z", (x, y), 0, -1, "G", nut_at=-t - 1 - 1.2)
    for i, (x, y) in enumerate(keypad_tab_holes(*f["keypad_centre"]), 1):
        screw(f"{i}", "z", (x, y), 0, -1, "H", nut_at=-t - 1 - 1.6, nut_d=5.1, nut_h=2.0)
    for i, (z, y) in enumerate(pi_hole_zy(g), 1):
        screw(f"wall_{i}", "x", (y, z), -g.half, +1, "I")
        screw(f"pcb_{i}", "x", (y, z), pi_frame(g)["pcb_x"] + 1.6, -1, "J")
    for i, (x, z) in enumerate(board_holes(g), 1):
        screw(f"{i}", "y", (x, z), -1.5, +1, "K", nut_at=t + 4 + 1.6, nut_d=5.1, nut_h=2.0, color=NYLON)
    for i, (x, y) in enumerate(clamp_screws(g), 1):
        screw(f"{i}", "z", (x, y), -g.D, +1, "L", nut_at=-g.D + t + 12 + t)
    # Dowel end screws and their repair washers.
    for end, (start, sign) in (("front", (1.5, -1)), ("back", (-g.D - 1.5, +1))):
        screw(end, "z", (0, g.dowel_y), start, sign, "E")
        a, b = sorted((start, start - sign * 1.5))
        out.append(Rod(f"fastener_E_{end}_repair_washer", "z", (0, g.dowel_y), (a, b), 25, METAL))
    return out


def roof_fastener_rods(g, side, opened=0.0):
    """Knob screw and roof hinge bolts in the board's own frame, posed with the board."""
    t, h, p = g.t, g.hinge, g.p
    sized = {j.id: size(j) for j in joints(g) if j.id in "CD"}
    sgn = side
    name = "right" if side > 0 else "left"
    pose = then(roof_pose(g, side), [open_pose(g, side, opened)] if opened else [])
    q_local = g.pivot_local[0] + p["roof"]["hinge_axis_offset"] * (1 + SQ2)
    bolt_u = q_local + h["hole_from_axis"]
    out = [Rod(f"fastener_D_{name}_shank", "y", (sgn * p["knob"]["from_ridge"], -50), (0, sized["D"]["length"]), 3.0, METAL, pose=pose)]
    Lc = sized["C"]["length"]
    for i, zc in enumerate(h["z_centres"], 1):
        for j, dz in enumerate((-h["hole_pitch"] / 2, h["hole_pitch"] / 2), 1):
            c = (sgn * bolt_u, zc + dz)
            out += [Rod(f"fastener_C_{name}_{i}{j}_shank", "y", c, (-h["thickness"], -h["thickness"] + Lc), 3.0, BRASS, pose=pose),
                    Rod(f"fastener_C_{name}_{i}{j}_washer", "y", c, (t, t + .5), 7.0, BRASS, pose=pose),
                    Rod(f"fastener_C_{name}_{i}{j}_acorn", "y", c, (t + .5, t + 6.5), 5.5, BRASS, pose=pose)]
    return out


# ------------------------------------------------------------------ wiring

def pin_points(g, case):
    p = g.p
    pf = pi_frame(g)
    tip = pf["pcb_x"] + 1.6 + 22.5
    pts = {}
    for pin in range(1, 41):
        j = (pin - 1) // 2
        # Odd pins sit on the inner row; pins 1/2 are nearest the SD-card end (top).
        pts[f"P{pin}"] = [tip, pf["y1"] - 7.5 - j * 2.54, pf["z_front"] - (4.77 if pin % 2 else 2.23)]
    cx, cy = p["front"]["lcd_centre"]
    for i, n in enumerate(("LVCC", "LGND", "LDIN", "LCLK", "LCS", "LDC", "LRST", "LBL")):
        pts[n] = [cx - 17.5 + 26.39 - i * 2.54, cy + 29 - 2.4, -19.6]
    ax, az = p["boards"]["amp"]
    for i, n in enumerate(("MLRC", "MBCLK", "MDIN", "MGAIN", "MSD", "MGND", "MVIN")):
        pts[n] = [ax + 2.38 + i * 2.54, 14, az - 13]
    pts["M-"], pts["M+"] = [ax + 6, 12, az - 2], [ax + 14, 12, az - 2]
    dx, dz = p["boards"]["adc"]
    for i, n in enumerate(("AVDD", "AGND", "ASCL", "ASDA", "AADDR", "AALERT", "AA0", "AA1", "AA2", "AA3")):
        pts[n] = [dx + 7.5, 14, dz - 3.07 - i * 2.54]
    vx, vz = p["boards"]["divider"]
    pts.update({"RIN": [vx + 2, 14, vz - 5], "J": [vx + 8, 14, vz - 12], "RGND": [vx + 14, 14, vz - 18],
                "GND_JOIN": [vx + 14, 14, vz - 5]})
    kx, ky = p["front"]["keypad_centre"]
    for i, n in enumerate(("KOUT", "KVCC", "KGND")):
        pts[n] = [kx - 15 + 50, ky - 32.5 + 19 - i * 2.54, -10.1]
    sx, sy = p["front"]["speaker_centre"]
    pts["S+"], pts["S-"] = [sx + 4, sy - 19, -12], [sx - 4, sy - 19, -12]
    bw, bh, bd = case["battery"]["size"]
    zc = -g.D + g.t + p["battery"]["gap_to_back"] + bd / 2
    sw = p["switch_cable"]
    swx = sw["switch_origin"][0] + sw["switch_envelope"][0] / 2
    pts["POWER"] = [0, g.t + bh + 22, zc]
    pts["SW_IN"] = [swx, sw["switch_origin"][1] + sw["switch_envelope"][1], -g.D + g.t + 6]
    pts["SW_OUT"] = [swx, sw["switch_origin"][1], -g.D + g.t + 6]
    pts["USB"] = [pf["pcb_x"] + 1.6 + 20, 99.4, pf["z_back"] + 1]
    return pts


def wire_specs(g, case):
    """The working program's 27 nets, routed as gentle orthogonal planning lines."""
    atlas = json.loads((PROJECT / "web/hardware-visualisation/src/data/setup.json").read_text())
    pts = pin_points(g, case)
    wires = []
    for index, entry in enumerate(atlas["wires"]):
        a, b = pts[entry["from"]], pts[entry["to"]]
        lane = index % 9
        xl = a[0] + 3 + lane * .55
        if entry["group"] == "Power":
            route = [a, [a[0], a[1] + 8, a[2]], [pts["SW_IN"][0], a[1] + 8, pts["SW_IN"][2]], pts["SW_IN"], pts["SW_OUT"],
                     [pts["SW_OUT"][0], pts["SW_OUT"][1] - 4, pts["SW_OUT"][2]],
                     [pts["SW_OUT"][0], pts["SW_OUT"][1] - 4, -70], [b[0] + 8, pts["SW_OUT"][1] - 4, -70],
                     [b[0] + 8, b[1], b[2]], b]
        elif entry["from"].startswith("P") and entry["group"] == "LCD":
            route = [a, [xl, a[1], a[2]], [xl, b[1] + 1 + lane * .4, a[2]], [xl, b[1] + 1 + lane * .4, b[2]], [b[0], b[1] + 1 + lane * .4, b[2]], b]
        elif entry["from"].startswith("P") and entry["to"].startswith("K"):
            # Socket ends are 2 mm from the right wall: arrive from behind.
            xk = b[0] + .5 + lane * .15
            route = [a, [xl, a[1], a[2]], [xl, b[1], a[2]], [xk, b[1], a[2]], [xk, b[1], b[2]], b]
        elif entry["from"].startswith("P"):
            yl = 20 + lane * .5
            route = [a, [xl, a[1], a[2]], [xl, yl, a[2]], [xl, yl, b[2]], [b[0], yl, b[2]], b]
        elif entry["from"] in ("M+", "M-"):
            route = [a, [a[0], a[1], -29 - lane * .3], [a[0], 128, -29 - lane * .3], [b[0], 128, -29 - lane * .3],
                     [b[0], 128, b[2]], b]
        elif entry["from"].startswith("K"):
            xk = a[0] + .8
            route = [a, [xk, a[1], a[2]], [xk, a[1], -24], [xk, 20, -24], [xk, 20, b[2]], [b[0], 20, b[2]], b]
        else:
            yl = 18 + lane * .4
            route = [a, [a[0], yl, a[2]], [b[0], yl, a[2]], [b[0], yl, b[2]], b]
        route = [list(map(float, q)) for i, q in enumerate(route) if i == 0 or q != route[i - 1]]
        length = sum(math.dist(u, v) for u, v in zip(route, route[1:]))
        allowance = 100 if entry["from"].startswith("P") else 30
        wires.append(dict(entry, route=route, route_length_mm=round(length, 1),
                          suggested_length_mm=math.ceil((length + allowance) / 50) * 50))
    return wires


def wire_rods(wire):
    out = []
    r = 3.5 if wire["group"] == "Power" else .9
    for i, (a, b) in enumerate(zip(wire["route"], wire["route"][1:])):
        axis = next((ax for ax, (u, v) in zip("xyz", zip(a, b)) if abs(u - v) > 1e-6), None)
        moving = [abs(u - v) > 1e-6 for u, v in zip(a, b)]
        if sum(moving) != 1:
            # Diagonal hops stay as two orthogonal legs for the solid model.
            mid = [b[0], a[1], a[2]] if moving[0] else [a[0], b[1], a[2]]
            out += wire_rods(dict(wire, route=[a, mid, b]))
            continue
        k = "xyz".index(axis)
        rest = [a[j] for j in range(3) if j != k]
        lo, hi = sorted((a[k], b[k]))
        out.append(Rod(f"wire_{wire['id']}_{i}", axis, tuple(rest), (lo, hi), r, wire["color"]))
    return out


# ------------------------------------------------------------------ assembly modes

GROUP_FRONT = ("front_gable",)
EXPLODE = {"front": (0, 0, 55), "back": (0, 0, -65), "left": (-50, 0, 0), "right": (40, 0, 0), "handle": (0, 45, 0)}


def group_of(label):
    """Which explode group a part belongs to."""
    front_e = ("e_lcd", "e_keypad", "e_speaker", "felt_", "fastener_F", "fastener_G", "fastener_H", "wood_front_gable")
    back_e = ("e_battery", "e_power", "e_switch", "wood_back_gable", "wood_switch_clamp", "fastener_L", "fastener_A")
    left_e = ("e_pi", "wood_left_wall", "fastener_I", "fastener_J", "fastener_B_-1", "hinge_wall_leaf_left")
    right_e = ("wood_right_wall", "fastener_B_1", "hinge_wall_leaf_right")
    for name, prefixes in (("front", front_e), ("back", back_e), ("left", left_e), ("right", right_e)):
        if label.startswith(prefixes):
            return name
    if label.startswith(("handle_dowel", "fastener_E")):
        return "handle"
    return None


def build(mode="assembled", wires=True, p=None):
    """All parts for one view. Returns dict(panels, boxes, rods) of woodkit shapes."""
    g = geometry(p)
    case = case_parameters()
    opened = 1.0 if mode in ("roof_open", "exploded") else 0.0
    out = {"panels": panels(g, case), "boxes": electronics(g, case) + wall_leaves(g),
           "rods": rods(g) + fastener_rods(g)}
    for side in (-1, 1):
        r = roof_side(g, side, opened)
        out["panels"] += r["panels"]
        out["boxes"] += r["boxes"]
        out["rods"] += r["rods"] + roof_fastener_rods(g, side, opened)
    if wires and mode in ("assembled", "inside"):
        for w in wire_specs(g, case):
            out["rods"] += wire_rods(w)
    if mode == "inside":
        # Right wall and both roof halves taken off: look in from the right, above.
        drop = ("wood_right_wall", "fastener_B_1", "hinge_wall_leaf_right")
        out = {k: [s for s in v if not (label_of(s).startswith(drop) or roof_part(label_of(s)))] for k, v in out.items()}
    if mode == "exploded":
        for kind in out.values():
            for s in kind:
                grp = group_of(label_of(s))
                if grp:
                    s.pose = then(s.pose, Pose(move=EXPLODE[grp]))
                elif roof_part(label_of(s)):
                    side = -1 if "left" in label_of(s) else 1
                    s.pose = then(s.pose, Pose(move=(side * 25, 35, 0)))
    return out


def roof_part(label):
    return any(key in label for key in ("roof_left", "roof_right", "magnet_", "knob_", "hinge_roof", "hinge_knuckle",
                                        "fastener_C", "fastener_D"))


def label_of(shape):
    if isinstance(shape, Panel):
        return "wood_" + shape.name
    if isinstance(shape, Box):
        return ("e_" + shape.module + "__" if shape.module not in ("hinge", "wood") else "") + shape.part
    return shape.name


VISIBLE_FASTENERS = ("fastener_C_", "fastener_E_")   # acorn nuts on the eaves, dowel washers


def cad_assembly(mode="assembled", wires=True, all_fasteners=True):
    """CAD compound for one view. The viewer meshes keep only the fasteners you see from outside."""
    from woodkit.cad import box_solid, compound, panel_solid, rod_solid
    parts = build(mode, wires)
    if not all_fasteners:
        parts["rods"] = [r for r in parts["rods"] if not r.name.startswith("fastener_") or
                         (r.name.startswith(VISIBLE_FASTENERS) and not r.name.endswith("_shank"))]
    solids = [panel_solid(s) for s in parts["panels"]]
    solids += [box_solid(b, "e_" + b.module + "__" if b.module not in ("hinge", "wood") else "") for b in parts["boxes"]]
    solids += [rod_solid(r) for r in parts["rods"]]
    return compound(solids, f"Alfa_house_radio_{mode}")


# ------------------------------------------------------------------ facts

def module_bounds(g, case, mode="assembled"):
    parts = build(mode, wires=False)
    out = {}
    for b in parts["boxes"]:
        if b.module in ("hinge", "wood"):
            continue
        module = b.module
        corners = [place((x, y, z), b.pose) for x in (b.lo[0], b.hi[0]) for y in (b.lo[1], b.hi[1]) for z in (b.lo[2], b.hi[2])]
        lo = [min(c[i] for c in corners) for i in range(3)]
        hi = [max(c[i] for c in corners) for i in range(3)]
        if module in out:
            lo = [min(a, b_) for a, b_ in zip(out[module][0], lo)]
            hi = [max(a, b_) for a, b_ in zip(out[module][1], hi)]
        out[module] = (lo, hi)
    r = g.dowel_d / 2
    out["handle"] = ([-r, g.dowel_y - r, -g.D], [r, g.dowel_y + r, 0])
    return {k: {"min": [round(v, 2) for v in lo], "max": [round(v, 2) for v in hi]} for k, (lo, hi) in out.items()}
