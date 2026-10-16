"""1:1 A4 cut-and-drill templates from woodkit panels, plus SVG and DXF.

Each part is laid flat in its own (u, v) and drawn at true size: cut lines from
the CAD face, a centre cross and diameter for every drilled hole, amber crosses
for holes you transfer from a real part, dashed "behind the plywood" ghosts,
labels and a 100 mm calibration gauge on every sheet.
"""
from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass, field

from matplotlib.patches import Circle as Disc, PathPatch, Rectangle
from matplotlib.path import Path as MPath

from .paper import AMBER, GREEN, MUTED, NAVY, face_path, gauge, page
from .shapes import Circle, Panel, bounds

PAPER, MARGIN, GAP = (210, 297), 6, 6
LEFT = 16          # parts start right of the vertical 100 mm gauge
WOOD_FILL = "#f4e4c8"


@dataclass
class Placement:
    panel: Panel
    x: float
    y: float
    rotate: bool = False         # quarter turn to save paper
    flip: bool = False           # draw mirrored (inside face up)
    label: str = ""
    copies: int = 1
    ghosts: list = field(default_factory=list)    # [(label, u0, v0, u1, v1, color)] in the part's (u, v)


def part_size(panel, rotate=False):
    u0, v0, u1, v1 = bounds(panel.outline)
    w, h = u1 - u0, v1 - v0
    return (h, w) if rotate else (w, h)


def pack(items, width=PAPER[0], height=PAPER[1], top=24, bottom=18):
    """Place [(panel, label, copies, ghosts)] on as few A4 sheets as possible, biggest first.
    A part too tall for a header gets its own "tall" sheet with 6 mm margins and a side title."""
    sheets, order = [], sorted(items, key=lambda it: -max(part_size(it[0])) * min(part_size(it[0])))
    tall = [it for it in order if part_size(it[0])[1] > height - top - bottom]
    for panel, label, copies, ghosts in tall:
        for _ in range(copies):
            w, h = part_size(panel)
            if h > height - 2 * MARGIN or w > width - 2 * MARGIN - 40:
                raise ValueError(f"{panel.name} does not fit on A4")
            sheets.append([Placement(panel, LEFT + 6, (height - h) / 2, label=label, ghosts=ghosts)])
    tall_sheets = len(sheets)
    order = [it for it in order if it not in tall]
    for panel, label, copies, ghosts in order:
        for _ in range(copies):
            placed = False
            for rotate in (False, True):
                w, h = part_size(panel, rotate)
                if w > width - 2 * MARGIN or h > height - top - bottom:
                    continue
                for sheet in sheets[tall_sheets:]:
                    spot = sheet_spot(sheet, w, h, width, height, top, bottom)
                    if spot:
                        sheet.append(Placement(panel, *spot, rotate=rotate, label=label, ghosts=ghosts))
                        placed = True
                        break
                if not placed:
                    spot = sheet_spot([], w, h, width, height, top, bottom)
                    if spot:
                        sheets.append([Placement(panel, *spot, rotate=rotate, label=label, ghosts=ghosts)])
                        placed = True
                if placed:
                    break
            if not placed:
                raise ValueError(f"{panel.name} does not fit on A4")
    return sheets


def sheet_spot(sheet, w, h, width, height, top, bottom):
    """First free position on a grid, keeping GAP mm between parts for the saw."""
    taken = [(p.x, p.y) + part_size(p.panel, p.rotate) for p in sheet]
    step = 2
    for y in range(int(top), int(height - bottom - h) + 1, step):
        for x in range(LEFT, int(width - MARGIN - w) + 1, step):
            if all(x + w + GAP <= tx or tx + tw + GAP <= x or y + h + GAP <= ty or ty + th + GAP <= y
                   for tx, ty, tw, th in taken):
                return x, y
    return None


class Flat:
    """Maps a part's (u, v) to paper mm inside its placement box (paper y grows downward)."""

    def __init__(self, placement):
        self.pl = placement
        self.u0, self.v0, self.u1, self.v1 = bounds(placement.panel.outline)

    def __call__(self, u, v):
        pl = self.pl
        if pl.flip:
            u = self.u0 + self.u1 - u
        if pl.rotate:
            return pl.x + (v - self.v0), pl.y + (u - self.u0)
        return pl.x + (u - self.u0), pl.y + (self.v1 - v)


def draw_placement(ax, pl, dxf=None):
    panel, f = pl.panel, Flat(pl)
    path = face_path(panel)
    verts = [f(u, v) for u, v in path.vertices]
    ax.add_patch(PathPatch(MPath(verts, path.codes), facecolor=WOOD_FILL, edgecolor=NAVY, lw=.6, zorder=2))
    if dxf is not None:
        rings, ring = [], []
        for (x, y), code in zip(verts, path.codes):
            if code == MPath.MOVETO:
                ring = [(x, y)]
            elif code == MPath.CLOSEPOLY:
                rings.append(ring)
            else:
                ring.append((x, y))
        dxf.extend(rings)
    w, h = part_size(panel, pl.rotate)
    for label, u0, v0, u1, v1, color in pl.ghosts:
        (xa, ya), (xb, yb) = f(u0, v0), f(u1, v1)
        ax.add_patch(Rectangle((min(xa, xb), min(ya, yb)), abs(xb - xa), abs(yb - ya), facecolor="none", edgecolor=color,
                               lw=.55, ls=(0, (3, 1.6)), zorder=3))
        ax.text((xa + xb) / 2, (ya + yb) / 2, label, fontsize=4.8, color=color, ha="center", va="center", zorder=3)
    sizes = {}
    for hole in panel.holes:
        if isinstance(hole, Circle):
            x, y = f(hole.u, hole.v)
            r = 1.2 if hole.d > 3 else .9
            ax.plot([x - r, x + r], [y, y], color=NAVY, lw=.35, zorder=4)
            ax.plot([x, x], [y - r, y + r], color=NAVY, lw=.35, zorder=4)
            sizes.setdefault(round(hole.d, 1), []).append((x, y))
    for mark in panel.marks:
        x, y = f(mark.u, mark.v)
        ax.plot([x - 1.7, x + 1.7], [y, y], color=AMBER, lw=.6, zorder=4)
        ax.plot([x, x], [y - 1.7, y + 1.7], color=AMBER, lw=.6, zorder=4)
        ax.add_patch(Disc((x, y), 1.45, fill=False, edgecolor=AMBER, lw=.4, ls="--", zorder=4))
    # One diameter label per hole size, next to its first hole.
    for d, pts in sorted(sizes.items()):
        x, y = pts[0]
        ax.text(x + d / 2 + 1, y - d / 2 - .5, f"Ø{d:g}" + (f" ×{len(pts)}" if len(pts) > 1 else ""), fontsize=4.6,
                color=NAVY, zorder=5, bbox=dict(boxstyle="round,pad=.1", fc="#ffffffc8", ec="none"))
    ax.text(pl.x + 2, pl.y + 4, pl.label or panel.title or panel.name, fontsize=6, weight="bold", color=NAVY, zorder=5)
    ax.text(pl.x + 2, pl.y + h - 2, f"{mm(w)} × {mm(h)} × 6 mm", fontsize=5, color=NAVY, zorder=5)
    if pl.panel.note and max(w, h) > 60:
        ax.text(pl.x + 2, pl.y + 8, pl.panel.note, fontsize=4.6, color=MUTED, zorder=5, wrap=True)
    return sizes


def mm(value):
    return f"{value:.1f}".rstrip("0").rstrip(".")


def template_pages(sheets, title, legend, footer_text):
    figs, dxf_rings = [], []
    heading = "6 mm plywood · print at Actual Size / 100 %, never Fit to page · measure the 100 mm gauge first"
    for n, sheet in enumerate(sheets, 1):
        tall = len(sheet) == 1 and part_size(sheet[0].panel, sheet[0].rotate)[1] > PAPER[1] - 42
        if tall:
            # No room above the part: title runs down the right margin.
            fig, ax = page()
            ax.text(203, 8, f"{title}  ·  A4 SHEET {n} / {len(sheets)}  ·  CUT AND DRILL 1:1  ·  {heading}",
                    fontsize=6, color=NAVY, rotation=-90, va="top", ha="left", weight="bold")
        else:
            fig, ax = page(f"A4 SHEET {n} / {len(sheets)}  ·  CUT AND DRILL  ·  1:1", heading, title)
        rings = []
        for pl in sheet:
            draw_placement(ax, pl, rings)
        dxf_rings.append(rings)
        gauge(ax, 9, 40, vertical=True)
        if tall:
            ax.text(196, 8, legend + "  ·  " + footer_text, fontsize=5.2, color=MUTED, rotation=-90, va="top", ha="left")
        else:
            ax.text(12, 290.5, legend, fontsize=5.4, color=MUTED)
            ax.text(198, 290.5, footer_text, fontsize=5.4, color=MUTED, ha="right")
        figs.append(fig)
    return figs, dxf_rings


def save_svg(fig, path):
    fig.savefig(path, format="svg")
    tree = ET.parse(path)
    tree.getroot().set("width", "210mm")
    tree.getroot().set("height", "297mm")
    tree.write(path, encoding="utf-8", xml_declaration=True)


def save_dxf(rings, path, height=PAPER[1]):
    """Cut contours in sheet millimetres, y up, one closed polyline per ring."""
    import ezdxf
    doc = ezdxf.new(units=4)
    msp = doc.modelspace()
    for ring in rings:
        msp.add_lwpolyline([(x, height - y) for x, y in ring], close=True)
    doc.saveas(path)
