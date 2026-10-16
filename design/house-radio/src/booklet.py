"""Moomin-assembly.pdf: an IKEA-style, nearly wordless assembly booklet."""
from __future__ import annotations

import json
from pathlib import Path

from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import PathPatch
from matplotlib.path import Path as MPath

from lib.house import build, joints
from lib.steps import CHARGING, STEPS
from woodkit import booklet as bk
from woodkit.fasteners import METRIC, size
from woodkit.paper import face_path, page, picture
from woodkit.shapes import bounds

ROOT = Path(__file__).resolve().parents[1]
FACTS = json.loads((ROOT / "facts.json").read_text())
SIZED = {j.id: (j, size(j)) for j in joints(__import__("lib.house", fromlist=["geometry"]).geometry())}
LETTERS = [("A", "front_gable", 1), ("B", "back_gable", 1), ("C", "left_wall", 1), ("D", "right_wall", 1), ("E", "floor", 1),
           ("F", "roof_right", 2), ("G", "switch_clamp", 1), ("H", "battery_fence", 1), ("J", "corner_block_1", 8),
           ("K", "magnet_wedge_right_1", 12)]
GLUE_STEPS = {1, 2, 3, 10, 12}


def image(name):
    return bk.line_art(ROOT / "previews" / f"{name}.png")


def hw_draw(joint_id):
    """Tiny drawing for a callout box (not to scale)."""
    joint, sized = SIZED[joint_id]

    def draw(ax, x, y):
        d = float(joint.thread if joint.kind == "wood" else METRIC[joint.thread]["d"])
        length = min(sized["length"], 12) * .9
        if joint.kind == "wood":
            bk.wood_screw(ax, x, y - length, d * .9, length, joint.head)
        else:
            bk.machine_screw(ax, x, y - length, d * .9, length, joint.head)
    return draw


def short(joint_id):
    j, s = SIZED[joint_id]
    return s["designation"].replace(" countersunk", "").replace(" pan head", " pan").split(" (")[0]


def cover():
    fig, ax = page()
    ax.text(105, 34, "MOOMIN", fontsize=46, weight="bold", ha="center", color=bk.INK)
    ax.text(105, 46, "Little House Radio", fontsize=10, ha="center", color=bk.INK)
    picture(ax, image("line_iso"), 25, 58, 160, 190)
    bk.person(ax, 30, 282, 16)
    ax.text(38, 279, "×1", fontsize=10, weight="bold", color=bk.INK)
    ax.text(185, 281, "6 mm plywood · hand tools", fontsize=6.5, ha="right", color=bk.GREY)
    return fig


def prepare():
    fig, ax = page()
    ax.text(12, 22, "Before you start", fontsize=14, weight="bold", color=bk.INK)
    tools = ["saw", "coping saw", "drill", "screwdriver", "clamp", "sandpaper", "glue", "ruler"]
    for i, name in enumerate(tools):
        x, y = 22 + (i % 4) * 46, 52 + (i // 4) * 32
        bk.box(ax, x - 14, y - 22, 36, 28, fill="#fafafa", edge="#cfcfcf", lw=.4)
        bk.ICONS[name](ax, x + 4, y, 14)
        ax.text(x + 4, y + 3.5, name, fontsize=5.6, ha="center", color=bk.INK)
    panels = [
        (True, "ruler", "Print the templates at 100 %. Measure the 100 mm gauge."),
        (False, "magnet", "Never leave magnets loose near a child."),
        (True, "magnet", "Magnets go 0.5 mm deep in 2-part epoxy, then covered."),
        (True, "screwdriver", "Test the power chain before closing the back."),
        (True, "sandpaper", "Round every outside edge (R3) and sand smooth."),
        (False, "glue", "No glue on the back gable or the roof hinges: they come off."),
    ]
    for i, (good, icon, text) in enumerate(panels):
        x, y = 12 + (i % 2) * 96, 132 + (i // 2) * 48
        bk.box(ax, x, y, 90, 42, fill="white", edge="#cfcfcf", lw=.5)
        bk.ICONS[icon](ax, x + 22, y + 32, 22)
        bk.badge(ax, x + 82, y + 8, good)
        import textwrap
        for k, line in enumerate(textwrap.wrap(text, 30)):
            ax.text(x + 40, y + 16 + k * 4.2, line, fontsize=6.4, color=bk.INK)
    return fig


def parts():
    fig, ax = page()
    ax.text(12, 22, "Wooden parts", fontsize=14, weight="bold", color=bk.INK)
    panels = {p.name: p for p in build("assembled", wires=False)["panels"]}
    for i, (letter, name, qty) in enumerate(LETTERS):
        x, y = 12 + (i % 3) * 64, 32 + (i // 3) * 64
        bk.box(ax, x, y, 60, 60, fill="white", edge="#cfcfcf", lw=.4)
        ax.text(x + 3, y + 3, letter, fontsize=12, weight="bold", va="top", color=bk.INK)
        ax.text(x + 57, y + 57, f"×{qty}", fontsize=9, weight="bold", ha="right", va="bottom", color=bk.INK)
        p = panels[name]
        u0, v0, u1, v1 = bounds(p.outline)
        k = min(40 / (u1 - u0), 40 / (v1 - v0))
        cx, cy = x + 30, y + 30
        path = face_path(p)
        verts = [(cx + (u - (u0 + u1) / 2) * k, cy - (v - (v0 + v1) / 2) * k) for u, v in path.vertices]
        ax.add_patch(PathPatch(MPath(verts, path.codes), facecolor="#f6ead3", edgecolor=bk.INK, lw=.5))
    ax.text(12, 290, "J: glue two pads into one block (4 blocks). K: glue three triangles into one wedge (4 wedges).",
            fontsize=6.2, color=bk.INK)
    return fig


def hardware():
    fig, ax = page()
    ax.text(12, 22, "Hardware  1:1", fontsize=14, weight="bold", color=bk.INK)
    ax.text(198, 22, "lay your screws on the drawings", fontsize=6.5, color=bk.GREY, ha="right")
    x, y = 18, 36
    for jid in "ABCDEFGHIJKL":
        joint, s = SIZED[jid]
        d = float(joint.thread) if joint.kind == "wood" else METRIC[joint.thread]["d"]
        label = f"{jid}  {short(jid)}  ×{joint.count}"
        if x > 185:
            x, y = 18, y + 52
        if joint.kind == "wood":
            bk.wood_screw(ax, x, y, d, s["length"], joint.head, label)
        else:
            bk.machine_screw(ax, x, y, d, s["length"], joint.head, label)
        x += 30
    y += 58
    shopping = {row["item"]: row["needed"] for row in FACTS["shopping"]}
    items = [(bk.nut, "M3 hex nut", 5.5, "M3 hex nut (ISO 4032)"), (bk.nut, "M2.5 hex nut", 5.0, "M2.5 hex nut (ISO 4032)"),
             (bk.nut, "M3 acorn nut", 5.5, "M3 acorn nut (DIN 1587)")]
    x = 22
    for draw, label, af, key in items:
        draw(ax, x, y, af, f"{label} ×{shopping.get(key, 0)}", acorn="acorn" in label)
        x += 30
    for label, od, hole, key in (("M3 washer", 7, 3.2, "M3 washer (ISO 7089)"), ("M2.5 washer", 6, 2.7, "M2.5 washer (ISO 7089)"),
                                 ("repair washer", 25, 4.3, "repair washer 4.3 × 25 mm")):
        bk.washer(ax, x + (8 if od > 20 else 0), y, od, hole, f"{label} ×{shopping.get(key, 0)}")
        x += 30 if od < 20 else 40
    y += 34
    x = 22
    for label, od, length, key, threaded in (("standoff M2.5 × 8", 5, 8, "M2.5 × 8 female-female standoff", True),
                                             ("spacer M2.5 × 4", 5, 4, "M2.5 × 4 nylon spacer", False),
                                             ("spacer M3 × 12", 6, 12, "M3 × 12 nylon spacer", False)):
        bk.spacer(ax, x, y, od, length, f"{label} ×{shopping.get(key, 0)}", threaded)
        x += 34
    bk.hinge(ax, x + 12, y, 25, 10, "hinge 25 × 20 ×4")
    bk.magnet_disc(ax, x + 52, y + 5, 10, "magnet Ø10 × 3 ×4")
    return fig


def steps_pages():
    figs = []
    order = [s for s in STEPS]
    for i in range(0, len(order), 2):
        fig, ax = page()
        for k, (n, title, _, _, _, hardware_list) in enumerate(order[i:i + 2]):
            y = 12 + k * 140
            callouts = []
            for ref, count in hardware_list:
                if ref in SIZED:
                    callouts.append((count, short(ref), hw_draw(ref)))
                else:
                    callouts.append((count, ref, (lambda a, xx, yy: bk.magnet(a, xx, yy + 1, 9)) if "magnet" in ref else None))
            bk.step_panel(ax, 10, y, 190, 134, n, image(f"step_{n:02d}"), title, callouts, glue_step=n in GLUE_STEPS)
        figs.append(fig)
    return figs


def charging():
    fig, ax = page()
    ax.text(12, 22, "Charging", fontsize=14, weight="bold", color=bk.INK)
    picture(ax, image("line_roof_open"), 15, 30, 110, 120)
    picture(ax, image("step_00"), 120, 40, 80, 100)
    lines = ["Screen dark → press the switch on the back.", "Pull both knobs up and out: the roof halves stand up.",
             "Unplug the radio lead from the power bank; plug in the charger.",
             "Bank full → charger out, radio lead in. Fold the halves down: click."]
    for k, text in enumerate(lines):
        y = 168 + k * 26
        bk.step_number(ax, 14, y - 4, k + 1, size=20)
        ax.text(30, y + 5, text, fontsize=8.5, color=bk.INK)
    bk.magnet(ax, 182, 288, 10)
    bk.badge(ax, 194, 281, True, 4)
    return fig


if __name__ == "__main__":
    (ROOT / "PDF").mkdir(exist_ok=True)
    figs = [cover(), prepare(), parts(), hardware()] + steps_pages() + [charging()]
    with PdfPages(ROOT / "PDF/Moomin-assembly.pdf") as pdf:
        for i, fig in enumerate(figs, 1):
            pdf.savefig(fig)
            fig.savefig(ROOT / "previews" / f"booklet_{i:02d}.png", dpi=90)
    print(f"Wrote PDF/Moomin-assembly.pdf ({len(figs)} pages).")
