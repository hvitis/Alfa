"""Print exact A4 cut profiles and physical wiring overlays from the CAD atlas."""
from __future__ import annotations

import csv
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

import ezdxf
from ezdxf.path import make_path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle, Circle, Polygon

from lib.geometry import parameters, panel_specs, panel_holes, sheet_layout, grille, wire_specs, pin_points


ROOT = Path(__file__).resolve().parents[1]
NAVY, AMBER, GREEN = "#1c3547", "#ad611b", "#23735a"
WOOD = "#f4e4c8"
NAMES = {"front": "FRONT", "rear": "REAR / INSIDE FACE", "left": "LEFT WALL",
         "right": "RIGHT WALL", "top": "TOP", "bottom": "BOTTOM (ROTATED)",
         "switch_cover": "SWITCH COVER", "switch_clamp": "SWITCH CLAMP", "block_pad": "BLOCK PAD"}


def page(title, subtitle):
    fig = plt.figure(figsize=(210 / 25.4, 297 / 25.4), dpi=150)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 210)
    ax.set_ylim(297, 0)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.text(10, 8, "MOOMIN  /  WOODEN CASE", fontsize=7, color=GREEN, weight="bold")
    ax.text(10, 14, title, fontsize=10, color=NAVY, weight="bold")
    ax.text(10, 19, subtitle, fontsize=6.5, color=NAVY)
    return fig, ax


def gauge(ax, y=278):
    ax.plot([30, 130], [y, y], color=NAVY, lw=.65)
    for x in range(30, 131, 10):
        ax.plot([x, x], [y - 1.5, y + 1.5], color=NAVY, lw=.65)
    ax.text(30, y + 5, "100 mm calibration line - measure before drilling", fontsize=6.5, color=NAVY)


def stock(ax):
    ax.add_patch(Rectangle((5, 24), 200, 265, fill=False, edgecolor="#d1d6da", lw=.35, ls="--"))


def ghost(ax, p, name, offset=(0, 0), label=True):
    ox, oy = offset
    x, y, _ = p[name]["origin"]
    w, h = p[name]["size"][:2]
    colors = {"pi": "#267556", "battery": "#84908f", "lcd": "#326ca3", "keypad": "#30353c",
              "speaker": "#343a42", "amp": "#7352a3", "adc": "#7352a3", "divider": "#b28150"}
    ax.add_patch(Rectangle((ox + x, oy + y), w, h, fill=False,
                          edgecolor=colors[name], lw=.6, ls=(0, (3, 2))))
    if label:
        ax.text(ox + x + w / 2, oy + y + h / 2, name.upper(), fontsize=6,
                ha="center", va="center", color=colors[name])


def transfer_mark(ax, x, y, label=None):
    ax.plot([x - 1.7, x + 1.7], [y, y], color=AMBER, lw=.6)
    ax.plot([x, x], [y - 1.7, y + 1.7], color=AMBER, lw=.6)
    ax.add_patch(Circle((x, y), 1.5, fill=False, edgecolor=AMBER, lw=.4, ls="--"))
    if label:
        ax.text(x + 3, y, label, fontsize=5.5, color=AMBER, va="center")


def component_overlay(ax, p, offset, rear=False):
    ox, oy = offset
    names = ("pi", "battery") if rear else ("lcd", "keypad", "speaker", "battery", "amp", "adc", "divider")
    for name in names:
        ghost(ax, p, name, offset, label=False)
    if rear:
        ax.text(ox + 43, oy + 78, "PI 3 B", fontsize=8, color=GREEN)
        ax.text(ox + 43, oy + 84, "56 x 85 PCB", fontsize=6, color=GREEN)
        ax.text(ox + 108, oy + 104, "BATTERY", fontsize=7, color="#677574", ha="center")
        ax.text(ox + 108, oy + 110, "at front, below this plane", fontsize=5.5, color="#677574", ha="center")
        ax.text(ox + 20, oy + 174, "4 rear screws / Pi on 8 mm standoffs", fontsize=6, color=NAVY)
        return
    labels = [(26, 81, "LCD PCB 35 x 58 / active 30.6 x 40.8"),
              (91, 58, "SPEAKER 40 x 40"), (91, 63, "20 mm deep"),
              (21, 182, "KEYPAD 30 x 65"), (48, 84, "MAX98357A"),
              (72, 150, "ADS 9 x 29"), (53, 198, "2 x 10k divider")]
    for x, y, text in labels:
        ax.text(ox + x, oy + y, text, fontsize=5.3, color=NAVY)
    ax.text(ox + 107, oy + 126, "BASEUS", fontsize=9, color="#677574", ha="center")
    ax.text(ox + 107, oy + 132, "69 x 106 x 14", fontsize=6.5, color="#677574", ha="center")
    ax.text(ox + 107, oy + 138, "foam + Velcro under bank", fontsize=5.2, color="#677574", ha="center")
    for x, y in p["keypad"]["button_centres"]:
        ax.add_patch(Circle((ox + x, oy + y), 6, facecolor="#f8d45d", edgecolor="#846b2b", lw=.45, alpha=.6))
    for x, y in ((25, 113), (49, 113), (25, 172), (49, 172),
                 (95.5, 15.5), (128.5, 15.5), (95.5, 48.5), (128.5, 48.5),
                 (62, 138), (62, 161), (53.5, 91.5), (68.5, 91.5)):
        transfer_mark(ax, ox + x, oy + y)


def dimension(ax, a, b, text, offset=5):
    x1, y1 = a
    x2, y2 = b
    if abs(y1 - y2) < .001:
        yy = y1 - offset
        ax.annotate("", (x1, yy), (x2, yy), arrowprops=dict(arrowstyle="|-|", lw=.45, color=NAVY))
        ax.text((x1 + x2) / 2, yy - 1, text, fontsize=6, ha="center", color=NAVY)
    else:
        xx = x1 - offset
        ax.annotate("", (xx, y1), (xx, y2), arrowprops=dict(arrowstyle="|-|", lw=.45, color=NAVY))
        ax.text(xx - 1, (y1 + y2) / 2, text, fontsize=6, va="center", ha="right", rotation=90, color=NAVY)


def draw_dxf(ax, path):
    doc = ezdxf.readfile(path)
    for entity in doc.modelspace():
        if entity.dxftype() == "CIRCLE":
            x, y, _ = entity.dxf.center
            ax.add_patch(Circle((x, 297 - y), entity.dxf.radius, facecolor="white", edgecolor=NAVY, lw=.5))
        else:
            vertices = list(make_path(entity).flattening(distance=.02))
            if vertices:
                ax.plot([v.x for v in vertices], [297 - v.y for v in vertices], color=NAVY, lw=.55)


def save_svg(fig, path):
    fig.savefig(path, format="svg")
    tree = ET.parse(path)
    tree.getroot().set("width", "210mm")
    tree.getroot().set("height", "297mm")
    tree.write(path, encoding="utf-8", xml_declaration=True)


def cutting_plans(p):
    names = ("front_cutting", "rear_cutting", "walls_cutting", "accessories_cutting")
    (ROOT / "PDF").mkdir(exist_ok=True)
    (ROOT / "SVG").mkdir(exist_ok=True)
    (ROOT / "previews").mkdir(exist_ok=True)
    with PdfPages(ROOT / "PDF/a4_cutting_and_drilling.pdf") as pdf:
        for page_no, name in enumerate(names):
            fig, ax = page(f"A4 SHEET {page_no + 1} / 4 - CUT AND DRILL",
                           "6 mm plywood / 1:1 / print Actual Size (100%), never Fit to page")
            stock(ax)
            for part, x, y, rotated in sheet_layout(p)[page_no]:
                w, h = panel_specs(p)[part]
                if rotated:
                    w, h = h, w
                ax.add_patch(Rectangle((x, y), w, h, facecolor=WOOD, edgecolor="none"))
                if part != "block_pad":
                    if part == "switch_clamp":
                        ax.text(x + w / 2, y + 15, "SWITCH\nCLAMP", fontsize=6.5,
                                ha="center", weight="bold", color=NAVY)
                    else:
                        ax.text(x + 2, y + 5, NAMES[part], fontsize=6.5, weight="bold", color=NAVY)
                    ax.text(x + 2, y + h - (9 if part == "switch_clamp" else 3),
                            f"{w:g} x {h:g} x 6 mm", fontsize=6, color=NAVY)
                if part in ("front", "rear"):
                    component_overlay(ax, p, (x, y), rear=part == "rear")
                    dimension(ax, (x, y), (x + w, y), f"{w:g}", 3)
                    dimension(ax, (x, y), (x, y + h), f"{h:g}", 7)
            draw_dxf(ax, ROOT / "DXF" / f"{name}.dxf")
            if page_no == 0:
                ax.text(30, 239, "LCD: 32 x 46 opening, R2 corners. Keypad: one 28 x 63 stepped opening.", fontsize=6, color=NAVY)
                ax.text(30, 245, "Drill 4 LCD mount holes at 3 mm; speaker grille: 21 holes at 4 mm.", fontsize=6, color=NAVY)
                ax.text(30, 251, "Amber marks are PROVISIONAL: transfer holes from your actual boards.", fontsize=6, color=AMBER)
                ax.text(30, 257, "Keypad corner tabs must cover its mounting holes. Check the paper opening first.", fontsize=6, color=NAVY)
                ax.text(30, 263, "Dashed outlines show components BEHIND the plywood, not cuts.", fontsize=6, color=NAVY)
            elif page_no == 1:
                ax.text(30, 239, "Drill on the INSIDE face. Pi mounting pattern: 49 x 58 mm, 4 holes at 3 mm.", fontsize=6, color=NAVY)
                ax.text(30, 245, "Rear cover: 4 holes at 3.5 mm for M3 screws; vents: 10 holes at 4 mm.", fontsize=6, color=NAVY)
                ax.text(30, 251, "The battery and Pi overlap in this projection, but occupy different depth layers.", fontsize=6, color=NAVY)
                ax.text(30, 257, "Keep TOP marked while turning panels over. Do not mirror this inside-face stencil.", fontsize=6, color=NAVY)
            elif page_no == 2:
                ax.text(10, 222, "5 mm or more between parts: leave saw kerf in the waste.", fontsize=6, color=NAVY)
                ax.text(10, 284, "Left switch clearance: 26 x 44, PROVISIONAL until housing is measured.", fontsize=6, color=AMBER)
                # Sheet 3 uses almost the full page; put its gauge in a clear right column.
                ax.plot([187, 187], [30, 130], color=NAVY, lw=.65)
                for yy in range(30, 131, 10):
                    ax.plot([185.5, 188.5], [yy, yy], color=NAVY, lw=.65)
                ax.text(192, 80, "100 mm check", fontsize=6, rotation=90, va="center", color=NAVY)
                pdf.savefig(fig)
                save_svg(fig, ROOT / "SVG" / f"a4_sheet_{page_no + 1}.svg")
                fig.savefig(ROOT / "previews" / f"a4_sheet_{page_no + 1}.png", dpi=150)
                plt.close(fig)
                continue
            else:
                ax.text(20, 105, "8 block pads: 12 x 12 x 6; drill centre at 3.5 mm.", fontsize=6, color=NAVY)
                ax.text(20, 112, "Glue two pads together for each of the 4 rear-cover blocks (12 mm thick).", fontsize=6, color=NAVY)
                ax.text(20, 125, "Switch cover: 40 x 72 x 6; clamp: 22 x 64 x 6.", fontsize=6, color=NAVY)
                ax.text(20, 132, "Switch actuator: proposed 16 mm opening; measure the real button first.", fontsize=6, color=AMBER)
                ax.text(20, 139, "Use the cable's existing switch; no extra GPIO button or electronics.", fontsize=6, color=NAVY)
                ax.text(20, 151, "Keep the remaining plywood for small-board spacers and cable retainers.", fontsize=6, color=NAVY)
            gauge(ax)
            ax.text(30, 289, "Rev A / mm / exact nominal contours / verify physical fit before cutting", fontsize=6, color=NAVY)
            pdf.savefig(fig)
            save_svg(fig, ROOT / "SVG" / f"a4_sheet_{page_no + 1}.svg")
            fig.savefig(ROOT / "previews" / f"a4_sheet_{page_no + 1}.png", dpi=150)
            plt.close(fig)


def route_page(p, group, wires):
    fig, ax = page(f"PHYSICAL ROUTING / {group.upper()}",
                   "1:1 front coordinate view / cables shown over plywood / crossings are not joins")
    ox, oy = 30, 27
    ax.add_patch(Rectangle((ox, oy), 150, 200, facecolor=WOOD, edgecolor=NAVY, lw=.6))
    for name in ("pi", "lcd", "speaker", "keypad", "amp", "adc", "divider", "battery"):
        ghost(ax, p, name, (ox, oy), label=False)
    for wire in wires:
        points = wire["route"]
        xx, yy = [ox + pt[0] for pt in points], [oy + pt[1] for pt in points]
        lw = 1.3 if group == "Power" else .65
        if wire["color"] == "#f4f4f0":
            ax.plot(xx, yy, color="#7b8387", lw=lw + .7)
        ax.plot(xx, yy, color=wire["color"], lw=lw, alpha=.95)
        for index, (x, y, z) in enumerate((points[0], points[-1])):
            ax.add_patch(Circle((ox + x, oy + y), .9, color=wire["color"], ec=NAVY, lw=.25))
            terminal = wire["to"] if index else wire["from"]
            if terminal.startswith("P") and terminal[1:].isdigit():
                right = int(terminal[1:]) % 2 == 0
                ax.text(ox + x + (2 if right else -2), oy + y,
                        terminal, fontsize=4.7, ha="left" if right else "right", va="center", color=NAVY)
            elif terminal in ("S+", "S-", "POWER", "USB"):
                ax.text(ox + x + 2, oy + y, terminal, fontsize=4.7,
                        ha="left", va="center", color=NAVY)
    for name, text, location in (("lcd", "LCD", (25, 82)), ("speaker", "SPEAKER", (91, 57)),
                                 ("pi", "PI / rear depth", (29, 52)), ("amp", "MAX98357A", (49, 84)),
                                 ("adc", "ADC", (58, 132)), ("keypad", "5 BUTTONS", (22, 181)),
                                 ("divider", "2 x 10k", (54, 198)), ("battery", "BASEUS 5000", (86, 76))):
        ax.text(ox + location[0], oy + location[1], text, fontsize=5.8, color=NAVY)
    ax.text(30, 236, "Signal wires: depth Z26-29; battery: Z9-23; GPIO plugs: Z29-48.", fontsize=6, color=NAVY)
    ax.text(30, 242, "Routes are planning centre lines. Form gentle bends and retain lid service loops.", fontsize=6, color=NAVY)
    if group == "Power":
        ax.text(30, 249, "Baseus USB-C -> short C-to-micro lead -> switched micro extension -> Pi.", fontsize=6, color=NAVY)
        ax.text(30, 255, "Remove rear screws; unplug Pi power before lifting the lid farther.", fontsize=6, color=NAVY)
        ax.text(30, 261, "Unplug the output lead from the bank to recharge its shared USB-C socket.", fontsize=6, color=NAVY)
    else:
        ax.text(30, 249, "Keep 100 mm spare on GPIO leads; label both ends with the wire ID.", fontsize=6, color=NAVY)
        ax.text(30, 255, "Exact electrical connections are on the table page and wiring.csv.", fontsize=6, color=NAVY)
    gauge(ax)
    return fig


def wiring_plans(p):
    wires = wire_specs(p)
    with (ROOT / "wiring.csv").open("w", newline="") as out:
        writer = csv.DictWriter(out, fieldnames=("id", "group", "from", "to", "title", "color", "route_length_mm", "suggested_length_mm"))
        writer.writeheader()
        writer.writerows({key: wire[key] for key in writer.fieldnames} for wire in wires)
    (ROOT / "routing.json").write_text(json.dumps({"parameters": p, "points": pin_points(p), "wires": wires}, indent=2) + "\n")
    with PdfPages(ROOT / "PDF/placement_and_wiring.pdf") as pdf:
        for group in ("LCD", "Audio", "ADC", "Keypad", "Power"):
            fig = route_page(p, group, [wire for wire in wires if wire["group"] == group])
            pdf.savefig(fig)
            fig.savefig(ROOT / "previews" / f"routing_{group.lower()}.png", dpi=150)
            plt.close(fig)
        fig, ax = page("CONNECTIONS / PHYSICAL PI HEADER NUMBERS", "Matches docs/wiring.md and the existing working hardware diagram")
        headers = [(10, "ID"), (25, "From"), (57, "To"), (102, "Signal / connection")]
        for x, title in headers:
            ax.text(x, 31, title, fontsize=7, weight="bold", color=NAVY)
        descriptions = {"L1": "3.3 V (purple)", "L2": "GND (white)", "L3": "GPIO10 / MOSI", "L4": "GPIO11 / clock",
                        "L5": "GPIO8 / chip select", "L6": "GPIO25 / DC", "L7": "GPIO27 / reset", "L8": "GPIO24 / backlight",
                        "S1": "5 V amplifier supply", "S2": "Common GND", "S3": "GPIO18 / I2S BCLK", "S4": "GPIO19 / I2S LRC",
                        "S5": "GPIO21 / I2S data", "S6": "Speaker positive", "S7": "Speaker negative: never GND",
                        "A1": "3.3 V ADC supply", "A2": "GND to divider join", "A3": "GPIO2 / I2C SDA", "A4": "GPIO3 / I2C SCL",
                        "A5": "Select ADC address 0x48", "A6": "ADC G to shared GND", "K1": "5 V keypad supply", "K2": "Common GND",
                        "K3": "OUT through R1 (10k)", "K4": "Divider node to ADC A0", "K5": "R2 (10k) to GND",
                        "USB": "5 V through USB cable switch"}
        for index, wire in enumerate(wires):
            yy = 39 + index * 7.5
            if index % 2 == 0:
                ax.add_patch(Rectangle((9, yy - 3), 192, 7.5, facecolor="#f3f5f5", edgecolor="none"))
            for x, text in ((10, wire["id"]), (25, wire["from"]), (57, wire["to"]), (102, descriptions[wire["id"]])):
                ax.text(x, yy, text, fontsize=6.2, color=NAVY)
        ax.text(10, 260, "R1 = R2 = 10 kohm. A0 = keypad OUT / 2 (maximum about 2.5 V).", fontsize=7, color=NAVY)
        ax.text(10, 267, "LCD BL stays on GPIO24 / physical 18; GPIO18 / physical 12 is audio BCLK.", fontsize=6.4, color=NAVY)
        ax.text(10, 274, "Numbers P1-P40 are physical header pins, not BCM GPIO numbers.", fontsize=6.5, color=NAVY)
        ax.text(10, 285, "No GPIO3 power button. Power comes through Pi micro-USB, not the GPIO rail.", fontsize=6.5, color=NAVY)
        pdf.savefig(fig)
        plt.close(fig)


def manifests(p):
    rows = []
    for page_no, entries in enumerate(sheet_layout(p), 1):
        for name, x, y, rotated in entries:
            w, h = panel_specs(p)[name]
            rows.append({"part": name, "sheet": page_no, "size_mm": [w, h, 6], "sheet_origin_mm": [x, y],
                         "rotated": rotated, "holes_local_mm": panel_holes(name, p)})
    (ROOT / "cut-list.json").write_text(json.dumps({"sheet_mm": [210, 297], "parts": rows}, indent=2) + "\n")


if __name__ == "__main__":
    settings = parameters()
    cutting_plans(settings)
    wiring_plans(settings)
    manifests(settings)
    print("Wrote four exact A4 templates, five wiring overlays, the connection table, SVGs and manifests.")
