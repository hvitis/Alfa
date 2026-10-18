"""Alfa.pdf (cover, plan, 1:1 templates) and Alfa-cut-templates.pdf with SVG/DXF.

Reads facts.json, verification.json and the renders in previews/; draws every
elevation from the same shapes as the CAD (woodkit.paper.View).
"""
from __future__ import annotations

import json
import math
from pathlib import Path

from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Polygon, Rectangle
from PIL import Image

from lib.house import (COLORS, FELT, ROOF, WOOD, build, case_parameters, geometry, label_of, roof_part, wire_specs)
from woodkit import scenery
from woodkit.paper import AMBER, GREEN, MUTED, NAVY, View, footer, page, paragraph, picture, table
from woodkit.templates import pack, save_dxf, save_svg, template_pages

ROOT = Path(__file__).resolve().parents[1]
FACTS = json.loads((ROOT / "facts.json").read_text())
REPORT = json.loads((ROOT / "verification.json").read_text())
G = geometry()
P = G.p
NAME, TITLE = P["name"], P["title"]
FOOT = f"{NAME} · {TITLE} · rev {P['revision']} · millimetres"


def render(name):
    return Image.open(ROOT / "previews" / f"{name}.png").convert("RGB")


def clipped(ax, start, rect):
    clip = Rectangle(rect[:2], rect[2], rect[3], transform=ax.transData, facecolor="none")
    for artist in ax.patches[start[0]:] + ax.lines[start[1]:] + ax.texts[start[2]:] + ax.images[start[3]:]:
        artist.set_clip_path(clip)
    ax.add_patch(Rectangle(rect[:2], rect[2], rect[3], facecolor="none", edgecolor=MUTED, lw=.5, zorder=12))


def marks(ax):
    return (len(ax.patches), len(ax.lines), len(ax.texts), len(ax.images))


# ------------------------------------------------------------------ cover

def cover():
    fig, ax = page()
    W, H = 210, 297
    scenery.sky(ax, W, H, horizon_y=.66)
    scenery.stars(ax, W, 120)
    scenery.moon(ax, 162, 52, 9)
    scenery.hills(ax, W, 178)
    for x, g_y, h, z in ((22, 205, 46, 3), (40, 200, 30, 2.9), (186, 207, 52, 3), (168, 201, 34, 2.9), (12, 214, 38, 3.2),
                         (200, 220, 40, 3.2)):
        scenery.pine(ax, x, g_y, h, z=z)
    # Foreground snow and a soft path toward the door.
    ax.add_patch(Polygon([(0, 230), (60, 222), (105, 226), (150, 221), (210, 229), (210, 297), (0, 297)],
                         facecolor="#f7fafd", edgecolor="none", zorder=4))
    ax.add_patch(Polygon([(98, 241), (122, 241), (140, 297), (80, 297)], facecolor="#eaf0f8", edgecolor="none", zorder=4.1))
    # The house, front elevation at 1:2 from the real panels.
    s = .52
    ground = 241
    view = View(ax, "front", (105, ground), s)
    shapes = build("assembled", wires=False)
    colors = {"front_gable": "#e1bf8f", "back_gable": "#c79d68"}
    from matplotlib.patches import Ellipse
    ax.add_patch(Ellipse((105, ground + 1), 200 * s, 12, facecolor="#b9c9df", edgecolor="none", alpha=.5, zorder=4.2))
    start = marks(ax)
    view.paint(shapes, skip=lambda label: label.startswith(("fastener_K", "fastener_E")), label_of=label_of, colors=colors, z=5)
    for artist in ax.patches[start[0]:]:
        artist.set_zorder(5)
    # Warm screen with a drawn letter, as the app does.
    cx, cy = P["front"]["lcd_centre"]
    px, py = view.p(cx, cy)
    scenery.glow(ax, px, py, 12, z=5.5)
    view.polygon([(cx - 15.3, cy - 20.4), (cx + 15.3, cy - 20.4), (cx + 15.3, cy + 20.4), (cx - 15.3, cy + 20.4)], "#ffe7a3",
                 edge="none", z=6)
    ax.text(px, py + .5, "A", fontsize=15, color="#d9603b", ha="center", va="center", zorder=6.2, fontproperties=scenery.title_font())
    spx, spy = view.p(*P["front"]["speaker_centre"])
    scenery.glow(ax, spx, spy, 5, color="#a9c8ff", z=5.5)
    # Snow lying on both roof slopes, the chimney tab and the knobs.
    over = G.over / math.sqrt(2)
    for side in (-1, 1):
        eave = (side * (G.half + over), G.eave - over + 0)
        line = [view.p(side * (G.half + over), G.eave - over), view.p(side * G.tab, G.peak - G.tab)]
        ax.add_patch(Polygon(scenery.snow_band(line, 3.1, seed=4 + side), facecolor="#fbfdff", edgecolor="#d2deec", lw=.3, zorder=8))
        ex, ey = view.p(*eave)
        x0, x1 = sorted((ex, view.p(side * G.half, 0)[0]))
        scenery.icicles(ax, x0, x1, ey + 1.2, 4, seed=7 + side)
        kx, ky = view.p(side * (P["knob"]["from_ridge"] / math.sqrt(2) + G.k), G.U[1] - P["knob"]["from_ridge"] / math.sqrt(2) + 20)
    arc = [view.p(G.tab * math.cos(a), G.dowel_y + G.tab * math.sin(a)) for a in [math.pi * i / 16 for i in range(17)]]
    ax.add_patch(Polygon(scenery.snow_band(arc, 2.6, seed=9), facecolor="#fbfdff", edgecolor="#d2deec", lw=.3, zorder=8))
    lx, ly = view.p(0, 0)
    scenery.glow(ax, lx - 2, ly + 10, 16, z=4.3)
    for i, (fx, fy) in enumerate([(116, 262), (110, 270), (119, 279), (112, 289)]):
        ax.add_patch(Polygon([(fx - 1.2, fy), (fx + 1.2, fy), (fx + 1, fy + 3), (fx - 1, fy + 3)], facecolor="#d9e4f1",
                             edgecolor="none", zorder=4.5))
    scenery.snowfall(ax, W, 250)
    font = scenery.title_font()
    ax.text(105.6, 31.6, NAME, fontsize=54, color="#0b1528", ha="center", va="center", fontproperties=font, alpha=.35, zorder=21)
    ax.text(105, 31, NAME, fontsize=54, color="#fdf8ec", ha="center", va="center", fontproperties=font, zorder=22)
    ax.text(105, 47, f"{TITLE.upper()}  ·  BUILD PLAN", fontsize=8.5, color="#cfe0f5", ha="center", zorder=22, weight="bold")
    ax.text(105, 54, "A cozy wooden radio for a small child, cut at home from 6 mm plywood", fontsize=7, color="#cfe0f5",
            ha="center", zorder=22)
    ax.text(105, 291, f"Raspberry Pi 3 · 2-inch screen · five buttons · split magnetic roof · rev {P['revision']}",
            fontsize=6.2, color="#5d7180", ha="center", zorder=22)
    return fig


# ------------------------------------------------------------------ plan pages

def glance():
    fig, ax = page("At a glance", f"{FACTS['outer_mm'][0]:g} × {FACTS['outer_mm'][1]:g} × {FACTS['outer_mm'][2]:g} mm "
                   f"(with roof overhang) · about {REPORT['facts']['mass_g']} g · 6 mm plywood", f"{NAME.upper()}  /  PLAN")
    shapes = build("assembled", wires=False)
    s, ground = .5, 182
    front = View(ax, "front", (62, ground), s)
    front.paint(shapes, label_of=label_of)
    side = View(ax, "side", (128, ground), s)
    side.paint(shapes, label_of=label_of)
    W, H, D = FACTS["outer_mm"]
    front.dim((-W / 2, 0), (W / 2, 0), f"{W:g}", -16)
    front.dim((-W / 2, 0), (-W / 2, H), f"{H:g}", -10, vertical=True)
    side.dim((0, 0), (D, 0), f"{D:g}", -16)
    side.dim((0, G.U[1] + G.k), (0, G.dowel_y - G.dowel_d / 2), f"{FACTS['handle']['finger_gap']:g} finger space", 50, vertical=True)
    side.dim((G.t, G.dowel_y + 16), (D - G.t, G.dowel_y + 16), f"grip {FACTS['handle']['grip_length']:g}", 0)
    ax.text(62, ground + 15, "FRONT  1:2", fontsize=6.5, ha="center", weight="bold", color=NAVY)
    ax.text(153, ground + 15, "SIDE  1:2", fontsize=6.5, ha="center", weight="bold", color=NAVY)
    picture(ax, render("house_iso"), 10, 203, 82, 72)
    v = REPORT["facts"]
    y = paragraph(ax, 100, 205, "WHAT IT IS", [
        "The little house from concept B, in full detail. Screen = window, buttons = door, speaker = round attic window.",
        "The roof splits open in two halves for charging and snaps shut on four magnets.",
        f"Carry it by the 22 mm beech dowel between the chimney tabs: {FACTS['handle']['grip_length']} mm grip.",
    ], width=58)
    y = paragraph(ax, 100, y, "CHECKED IN CAD", [
        f"{sum(c['pass'] for c in REPORT['checks'])}/{len(REPORT['checks'])} checks pass: no part collisions, roof swing 0-45° clear, "
        "every part fits one A4 template.",
        f"Stands steady: it tilts {min(v['tip_angles_deg'].values()):.0f}° before tipping (backwards is the weakest way).",
    ], width=58)
    footer(ax, FOOT, 2)
    return fig


def inside():
    fig, ax = page("Inside: where everything goes", "Front gable and right wall taken away. Dashed: the outline of the removed panel.",
                   f"{NAME.upper()}  /  PLACEMENT")
    shapes = build("assembled", wires=False)
    s, ground = .5, 172
    front = View(ax, "front", (62, ground), s)
    hide_front = lambda label: label.startswith(("wood_front_gable", "felt_", "fastener_F", "fastener_G", "fastener_H", "handle_",
                                                 "fastener_E")) or roof_part(label)
    front.paint(shapes, skip=hide_front, label_of=label_of)
    front.outline(shapes, lambda label: label == "wood_front_gable", MUTED, label_of=label_of)
    side = View(ax, "side", (133, ground), s)
    hide_side = lambda label: label.startswith(("wood_right_wall", "fastener_B_1", "hinge_wall_leaf_right", "handle_")) or roof_part(label)
    side.paint(shapes, skip=hide_side, label_of=label_of)
    side.outline(shapes, lambda label: label == "wood_right_wall", MUTED, label_of=label_of)
    tags = {"lcd": "LCD", "keypad": "5 buttons", "speaker": "speaker", "pi": "Pi 3", "battery": "power bank",
            "switch": "switch", "amp": "amp", "adc": "ADC", "divider": "R1/R2"}
    for key, text in tags.items():
        b = FACTS["modules"][key]
        cx, cy, cz = [(a + c) / 2 for a, c in zip(b["min"], b["max"])]
        for view, (u, v) in ((front, (cx, cy)), (side, (-cz, cy))):
            view.text(u, v, text, fontsize=4.6, ha="center", va="center", weight="bold",
                      bbox=dict(boxstyle="round,pad=.15", fc="#ffffffd8", ec="none"))
    ax.text(62, ground + 8, "FRONT SECTION  1:2", fontsize=6.3, ha="center", weight="bold", color=NAVY)
    ax.text(158, ground + 8, "SIDE SECTION  1:2 (from the right)", fontsize=6.3, ha="center", weight="bold", color=NAVY)
    m = FACTS["modules"]
    rows = []
    places = [("Raspberry Pi 3", "pi", "Left wall, inside; 4 × M2.5 standoffs 8 mm; SD card up, GPIO toward the front"),
              ("Power bank Baseus 5000 mAh", "battery", "Floor, against the back gable; hook-and-loop + floor fence; USB-C on top"),
              ("QUARKZMAN switch", "switch", "Back gable attic, clamp + 2 spacers; button through a Ø12 hole"),
              ("2-inch LCD", "lcd", "Front gable window; 4 × M2.5 on 4 mm spacers"),
              ("Five buttons", "keypad", "Front gable door window; 4 × M2.5 through the tabs"),
              ("Speaker 40 mm", "speaker", "Attic window; felt disc behind the grille; 4 × M3"),
              ("MAX98357A amplifier", "amp", "Floor, nylon screws on 4 mm spacers"),
              ("ADS ADC", "adc", "Floor, nylon screws on 4 mm spacers"),
              ("R1/R2 divider board", "divider", "Floor, nylon screws on 4 mm spacers")]
    for name, key, how in places:
        lo, hi = m[key]["min"], m[key]["max"]
        rows.append([name, f"{lo[0]:.0f} … {hi[0]:.0f}", f"{lo[1]:.0f} … {hi[1]:.0f}", f"{-hi[2]:.0f} … {-lo[2]:.0f}", how])
    y = table(ax, 12, 190, [("Part", 38), ("X (mm)", 20), ("Y up", 20), ("depth", 20), ("Mounting", 88)], rows, wrap={4: 62})
    ax.text(12, y + 3, "X from the centre line (+ right), Y up from the floor, depth back from the front face.", fontsize=5.6, color=MUTED)
    footer(ax, FOOT, 3)
    return fig


def roof_page():
    fig, ax = page("The split roof: open, plug in, snap shut", "Two identical boards on four small hinges. They open in either order, "
                   "stand upright on their own and close onto four magnets.", f"{NAME.upper()}  /  ROOF")
    closed, opened = build("assembled", wires=False), build("roof_open", wires=False)
    s, ground = .37, 140
    for shapes, x, title in ((closed, 55, "CLOSED"), (opened, 150, "OPEN · each half stands up 45° on its hinge")):
        v = View(ax, "front", (x, ground), s)
        v.paint(shapes, label_of=label_of)
        ax.text(x, ground + 7, title, fontsize=6.3, ha="center", weight="bold", color=NAVY)
    # Opening arrows on the open view.
    for side in (-1, 1):
        x0, y0 = View(ax, "front", (150, ground), s).p(side * 40, 175)
        x1, y1 = View(ax, "front", (150, ground), s).p(side * 82, 222)
        ax.add_patch(FancyArrowPatch((x0, y0), (x1, y1), connectionstyle=f"arc3,rad={-.35 * side}", arrowstyle="-|>",
                                     mutation_scale=8, color=GREEN, lw=1.1, zorder=12))
    # Details are sections: the front gable and what it carries are left out.
    section = lambda label: label.startswith(("wood_front_gable", "felt_", "fastener_F", "fastener_G", "fastener_H", "e_lcd",
                                              "e_keypad", "e_speaker", "fastener_E", "handle_dowel"))
    # Detail 1: the hinge at the right eave, 4:1.
    rect = (12, 152, 90, 62)
    start = marks(ax)
    q = G.Q
    v = View(ax, "front", (rect[0] + rect[2] / 2 - 4 * q[0], rect[1] + rect[3] / 2 + 4 * q[1]), 4.0)
    eave = lambda label: not label.startswith(("wood_right_wall", "wood_roof_right", "hinge_wall_leaf_right", "hinge_roof_leaf_right",
                                                "hinge_knuckle_right", "fastener_B_1", "fastener_C_right"))
    v.paint(closed, skip=eave, label_of=label_of)
    clipped(ax, start, rect)
    ax.text(rect[0] + 2, rect[1] + 4, "HINGE AT THE RIGHT EAVE  4:1 (section)", fontsize=6, weight="bold", color=NAVY, zorder=13)
    ax.text(rect[0], rect[1] + rect[3] + 4, "Brass leaf on the wall, brass leaf under the overhang, M3 bolts. Opening closes the hinge:\n"
            "the overhang lands on the wall exactly upright. That is the stop.", fontsize=5.2, color=NAVY, va="top")
    # Detail 2: the magnet wedges at the ridge, 3:1.
    rect = (108, 152, 90, 62)
    start = marks(ax)
    v = View(ax, "front", (rect[0] + rect[2] / 2, rect[1] + rect[3] / 2 + 3 * (G.U[1] - 8)), 3.0)
    ridge = lambda label: not label.startswith(("wood_roof_", "wood_magnet_wedge", "magnet_"))
    v.paint(closed, skip=ridge, label_of=label_of)
    v.outline(closed, lambda label: label.startswith("magnet_"), "#6b7177", label_of=label_of, z=8)
    clipped(ax, start, rect)
    ax.text(rect[0] + 2, rect[1] + 4, "MAGNETS AT THE RIDGE  3:1 (section)", fontsize=6, weight="bold", color=NAVY, zorder=13)
    ax.text(rect[0], rect[1] + rect[3] + 4, "Two 18 mm wedges under each half; dashed: the Ø10 × 3 magnet, 0.5 mm below the\n"
            "upright face. The faces meet on the centre line, 1 mm of epoxy between the magnets.", fontsize=5.2, color=NAVY, va="top")
    y = paragraph(ax, 12, 230, "CHARGING, THE PLEASANT WAY", [
        "1  Let the radio go to sleep (screen dark), then press the switch on the back.",
        "2  Hold the dowel with one hand; with the other, pull a knob up and outward. Each half swings up and rests upright.",
        "3  The power bank's USB-C socket is right under the ridge. Pull out the radio's plug, plug in your charger.",
        "4  When the bank is full: charger out, radio plug back in, fold the halves down. The magnets click them shut.",
    ], width=118, bullet=False)
    y = paragraph(ax, 12, y, "SAFETY", [
        "Neodymium magnets are dangerous if swallowed. Set them 0.5 mm deep in 2-part epoxy and cover them with a thin layer "
        "of epoxy. Never use loose or glued-on-the-surface magnets. Check them every few months.",
        "Test polarity before gluing: stack each left magnet on its right partner, mark the touching faces, glue those faces outward.",
    ], width=118)
    footer(ax, FOOT, 4)
    return fig


def power_page():
    sw = P["switch_cable"]
    fig, ax = page("Power: the QUARKZMAN switch cable", "USB-C male → USB-C female, 0.28 m, 22 AWG, 3 A, power only "
                   "(Amazon.pl B0H1JMNHQT). One of your two cables does the job.", f"{NAME.upper()}  /  POWER")
    chain = [("Baseus 5000 mAh", "USB-C socket on top"), ("QUARKZMAN male plug", "into the bank"),
             ("Switch body", "clamped in the back gable"), ("QUARKZMAN female end", "inside, near the Pi"),
             ("USB-C → micro-USB lead", "up-angled micro plug"), ("Raspberry Pi 3", "micro-USB power")]
    x = 12
    for i, (title, sub) in enumerate(chain):
        ax.add_patch(FancyBboxPatch((x, 34), 27, 18, boxstyle="round,pad=0,rounding_size=2", facecolor="#eef4f8" if i % 5 else "#fff4dc",
                                    edgecolor=NAVY, lw=.5))
        ax.text(x + 13.5, 40.5, title, fontsize=5.4, weight="bold", ha="center", color=NAVY, wrap=True)
        ax.text(x + 13.5, 47.5, sub, fontsize=4.6, ha="center", color=MUTED)
        if i < len(chain) - 1:
            ax.add_patch(FancyArrowPatch((x + 27.5, 43), (x + 31, 43), arrowstyle="-|>", mutation_scale=6, color=GREEN, lw=.8))
        x += 31.5
    shapes = build("assembled", wires=False)
    back = View(ax, "back", (60, 205), .5)
    back.paint(shapes, label_of=label_of)
    ax.text(60, 212, "BACK  1:2 · seen from behind, the button is high on the left", fontsize=6.2, ha="center", weight="bold", color=NAVY)
    inside_view = View(ax, "front", (155, 205), .5)
    hide = lambda label: label.startswith(("wood_front_gable", "felt_", "e_lcd", "e_keypad", "e_speaker", "fastener_F", "fastener_G",
                                           "fastener_H", "handle_", "fastener_E", "wood_left_wall", "e_pi", "fastener_I", "fastener_J",
                                           "wood_right_wall", "fastener_B", "hinge_wall")) or roof_part(label)
    inside_view.paint(shapes, skip=hide, label_of=label_of)
    power = next(w for w in wire_specs(G, case_parameters()) if w["group"] == "Power")
    inside_view.route(power["route"], "#293440", lw=1.6)
    ax.text(155, 212, "SEEN FROM THE FRONT, PANELS AWAY · cable path", fontsize=6.2, ha="center", weight="bold", color=NAVY)
    paragraph(ax, 12, 222, "BEFORE YOU CLOSE THE HOUSE", [
        sw["note"],
        "It is a 2-wire, power-only cable. Test the whole chain on the bench: bank → QUARKZMAN → lead → Pi. The Pi must boot, and "
        "`vcgencmd get_throttled` must print 0x0 while the screen and loud audio run.",
        "If the bank does not start through the cable (some banks need a USB-C sink signal), plug the lead directly into the bank to "
        "compare. Keep the second QUARKZMAN cable as a spare.",
        "Switch off only after the radio has gone to sleep. The program halts the Pi after 5 minutes without a button press.",
        "Coil the cable slack in the attic corner with one cable tie; keep it away from the roof wedges.",
    ], width=118)
    footer(ax, FOOT, 5)
    return fig


def screws_page():
    fig, ax = page("Screws and fixings, calculated", "Each length comes from the real stack of parts (woodkit.fasteners): grip + washer + "
                   "nut + one thread, rounded up to a standard length.", f"{NAME.upper()}  /  HARDWARE")
    rows = []
    for r in FACTS["fasteners"]:
        d = r["drill"]
        drill = f"Ø{d['clearance']:g}" + (f", pilot Ø{d['pilot']:g}" if d["pilot"] else "") + (f", csk Ø{d['countersink']:g}" if d["countersink"] else "")
        rows.append([r["id"], r["title"], r["designation"].replace(" (ISO 10642)", "").replace(" (ISO 7045)", ""), r["count"],
                     r["stack"], drill])
    y = table(ax, 10, 34, [("", 5), ("Where", 34), ("Fastener", 40), ("Qty", 8), ("Stack, head side first (mm)", 54), ("Drill", 49)],
              rows, size=5.5, wrap={1: 24, 2: 30, 4: 40, 5: 34})
    notes = [f"{r['id']}: {r['note']}" for r in FACTS["fasteners"] if r["note"]]
    y = paragraph(ax, 12, y + 4, "NOTES", notes, width=122, size=6)
    paragraph(ax, 12, y, "WHY THESE ARE SAFE FOR A CHILD", [
        "All machine-screw tails end inside the house. Outside you only see flush countersunk heads, the two dowel washers and eight "
        "domed brass acorn nuts on the eaves.",
        "The back gable needs a screwdriver to open, so the power bank stays out of reach.",
    ], width=122, size=6)
    footer(ax, FOOT, 6)
    return fig


def shopping_page(sheets):
    fig, ax = page("Shopping list", "‘Buy’ adds a spare for small parts. Quantities are totals for one radio.", f"{NAME.upper()}  /  SHOPPING")
    rows = [["6 mm birch plywood, A4 pieces (or one 300 × 450 mm board)", sheets, sheets]]
    rows += [[s["item"], s["needed"], s["buy"]] for s in FACTS["shopping"]]
    y = table(ax, 12, 34, [("Item", 140), ("Need", 16), ("Buy", 16)], rows, size=5.8, wrap={0: 110})
    paragraph(ax, 12, y + 5, "TOOLS", [
        "Saw with a mitre box (straight cuts and the 45° magnet-wedge triangles); coping or fret saw (windows, chimney tabs).",
        "Drill with 2.0, 2.2, 2.5, 2.9, 3.0, 3.4, 3.5, 4, 5, 10, 12 and 22 mm bits; a countersink bit; a depth stop or tape for the "
        "3.5 mm magnet pockets.",
        "Screwdrivers (Phillips/hex to suit the screws), small spanner for M2.5/M3 nuts, clamps, sandpaper 120/240, square, pencil.",
    ], width=122, size=6)
    footer(ax, FOOT, 7)
    return fig


def wiring_page():
    fig, ax = page("Wiring: the same 27 connections", "Identical to the working setup and the wooden case. P numbers are physical Pi header "
                   "pins. Lengths include service slack.", f"{NAME.upper()}  /  WIRING")
    wires = json.loads((ROOT / "routing.json").read_text())["wires"]
    rows = [[w["id"], w["from"], w["to"], w["title"], f"{w['suggested_length_mm']}"] for w in wires]
    table(ax, 10, 34, [("ID", 9), ("From", 14), ("To", 18), ("Signal", 52), ("Lead mm", 14)], rows, size=5.2, row_h=3.6, wrap={3: 44})
    shapes = build("assembled", wires=False)
    v = View(ax, "side", (128, 168), .45)
    v.paint(shapes, skip=lambda label: label.startswith(("wood_right_wall", "fastener_B_1", "hinge_wall_leaf_right", "handle_",
                                                         "wood_left_wall")) or roof_part(label), label_of=label_of,
            colors={"front_gable": "#f1e3cc", "back_gable": "#f1e3cc", "floor": "#f1e3cc"})
    for w in wires:
        v.route(w["route"], w["color"], lw=.6, outline=w["color"].lower() in ("#f4f4f0", "#a2a6a8"))
    ax.text(150.5, 174, "ROUTES FROM THE RIGHT  1:2.2", fontsize=6, ha="center", weight="bold", color=NAVY)
    paragraph(ax, 120, 182, "", [
        "Wires leave the Pi's GPIO sockets toward the centre, run in a vertical lane behind the screen, and drop to the floor boards.",
        "Leave 100 mm spare on every lead that plugs into the Pi: the wall stays put, but you will want slack when the back is off.",
        "Speaker minus goes to the amplifier, never to ground. LCD backlight stays on physical pin 18.",
    ], width=60, size=5.8)
    footer(ax, FOOT, 8)
    return fig


def sheets():
    """Template placements with dashed ghosts of what sits behind each part."""
    shapes = build("assembled", wires=False)
    m = FACTS["modules"]
    by_name = {p.name: p for p in shapes["panels"]}

    def ghost(label, key, plane, color):
        lo, hi = m[key]["min"], m[key]["max"]
        if plane == "xy":
            return (label, lo[0], lo[1], hi[0], hi[1], color)
        if plane == "zy":
            return (label, -hi[2], lo[1], -lo[2], hi[1], color)
        return (label, lo[0], -hi[2], hi[0], -lo[2], color)

    items = [
        (by_name["front_gable"], "A  FRONT GABLE · outside face", 1,
         [ghost("LCD", "lcd", "xy", "#326ca3"), ghost("buttons", "keypad", "xy", "#30353c"), ghost("speaker", "speaker", "xy", "#343a42")]),
        (by_name["back_gable"], "B  BACK GABLE · inside face", 1,
         [ghost("power bank", "battery", "xy", "#677574"), ghost("switch", "switch", "xy", "#30373e")]),
        (by_name["left_wall"], "C  LEFT WALL · inside face", 1, [ghost("Pi 3", "pi", "zy", "#267556")]),
        (by_name["right_wall"], "D  RIGHT WALL · outside face", 1, []),
        (by_name["floor"], "E  FLOOR · top face, front edge down", 1,
         [ghost("amp", "amp", "xz", "#7352a3"), ghost("ADC", "adc", "xz", "#7352a3"), ghost("R1/R2", "divider", "xz", "#b28150")]),
        (by_name["roof_right"], "F  ROOF BOARD · top face, ×2", 2, []),
        (by_name["switch_clamp"], "G  SWITCH CLAMP", 1, []),
        (by_name["battery_fence"], "H  FENCE", 1, []),
        (by_name["corner_block_1"], "J", 8, []),
        (by_name["magnet_wedge_right_1"], "K", 12, []),
    ]
    return pack(items)


def cut_list_page(layout):
    fig, ax = page("Cut list", f"{len(layout)} A4 sheets of 6 mm plywood. Letters match the templates and the assembly booklet.",
                   f"{NAME.upper()}  /  PARTS")
    where = {}
    for n, sheet in enumerate(layout, 1):
        for pl in sheet:
            where.setdefault(pl.label.split()[0], set()).add(n)
    letters = {"front_gable": "A", "back_gable": "B", "left_wall": "C", "right_wall": "D", "floor": "E", "roof_board": "F",
               "switch_clamp": "G", "battery_fence": "H", "corner_block": "J", "magnet_wedge": "K"}
    rows = []
    for r in FACTS["cut_list"]:
        letter = letters.get(r["part"], "?")
        rows.append([letter, r["title"].title(), " × ".join(f"{v:g}" for v in r["size_mm"]) + " × 6", r["quantity"],
                     "yes" if r["coping_saw"] else "", ", ".join(map(str, sorted(where.get(letter, [])))), r["note"]])
    y = table(ax, 10, 34, [("", 6), ("Part", 30), ("Size mm", 30), ("Qty", 9), ("Coping saw", 16), ("Sheet", 12), ("Note", 87)], rows,
              size=5.6, wrap={6: 62})
    paragraph(ax, 12, y + 5, "CUTTING AT HOME", [
        "Print the template pages at Actual Size / 100 %. Measure the 100 mm gauge on every page before you cut.",
        "Glue or tape each template to the plywood. Saw on the waste side of the line, then sand to the line.",
        "Windows: drill a starter hole inside, thread the coping-saw blade through, cut, sand. Round every outside edge (R3).",
        "Blocks J: glue two 12 × 12 pads into one 12 mm block (four blocks). Wedges K: glue three triangles into one 18 mm wedge (four).",
        "Dashed outlines are parts that sit behind the plywood, not cuts. Amber crosses: mark through from the real board first.",
    ], width=120, size=6)
    footer(ax, FOOT, 9)
    return fig


if __name__ == "__main__":
    for folder in ("PDF", "SVG", "DXF"):
        (ROOT / folder).mkdir(exist_ok=True)
    # Sheet count can shrink; drop this script's own stale sheet files first.
    for stale in [*(ROOT / "SVG").glob("sheet_*.svg"), *(ROOT / "DXF").glob("sheet_*.dxf"), *(ROOT / "previews").glob("sheet_*.png")]:
        stale.unlink()
    layout = sheets()
    legend = "Solid: cut. + : drill at Ø shown. Amber: transfer from the part. Dashed: behind the plywood. Round all edges R3."
    figs = [cover(), glance(), inside(), roof_page(), power_page(), screws_page(), shopping_page(len(layout)), wiring_page(), cut_list_page(layout)]
    names = ["page_cover", "page_glance", "page_inside", "page_roof", "page_power", "page_screws", "page_shopping", "page_wiring", "page_cuts"]
    t_figs, rings = template_pages(layout, f"{NAME.upper()}  /  CUT TEMPLATES", legend, FOOT)
    with PdfPages(ROOT / "PDF/Alfa.pdf") as pdf:
        for fig, name in zip(figs, names):
            pdf.savefig(fig)
            fig.savefig(ROOT / "previews" / f"{name}.png", dpi=110)
        for fig in t_figs:
            pdf.savefig(fig)
    with PdfPages(ROOT / "PDF/Alfa-cut-templates.pdf") as pdf:
        for n, (fig, ring) in enumerate(zip(t_figs, rings), 1):
            pdf.savefig(fig)
            save_svg(fig, ROOT / "SVG" / f"sheet_{n}.svg")
            fig.savefig(ROOT / "previews" / f"sheet_{n}.png", dpi=110)
            save_dxf(ring, ROOT / "DXF" / f"sheet_{n}.dxf")
    print(f"Wrote PDF/Alfa.pdf ({len(figs) + len(t_figs)} pages) and PDF/Alfa-cut-templates.pdf ({len(t_figs)} sheets).")
