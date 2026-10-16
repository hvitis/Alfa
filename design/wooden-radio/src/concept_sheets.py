"""Quick concept drawings: an overview and one A4 landscape sheet per concept.

Elevations are painted from the same panel primitives as the CAD, far parts
first, with real holes, so the screen and keys show through their windows.
"""
from __future__ import annotations

import json
import textwrap
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Circle as Disc, PathPatch, Rectangle
from matplotlib.path import Path as MPath
from PIL import Image

from lib.radio import bounds, concept, settings
from woodkit.cad import face as _face

ROOT = Path(__file__).resolve().parents[1]
NAVY, GREEN, AMBER, MUTED, PAPER = "#1c3547", "#23735a", "#ad611b", "#5d7180", "#ffffff"
GHOST = {"pi": "#287557", "battery": "#6f7b7a", "speaker": "#343a42", "lcd": "#326ca3", "keypad": "#30353c"}
IDS = [c["id"] for c in settings()["concepts"]]


def page(title, subtitle, eyebrow="ALFA  /  WOODEN RADIO  /  CONCEPTS"):
    fig = plt.figure(figsize=(297 / 25.4, 210 / 25.4), dpi=150)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 297)
    ax.set_ylim(210, 0)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.text(12, 10, eyebrow, fontsize=7, color=GREEN, weight="bold")
    ax.text(12, 18.5, title, fontsize=14, color=NAVY, weight="bold")
    ax.text(12, 24.5, subtitle, fontsize=8, color=NAVY)
    return fig, ax


def ring_points(wire):
    n = max(24, int(wire.length / 0.4))
    pts = [wire @ (i / n) for i in range(n)]
    return [(p.X, p.Y) for p in pts]


def signed_area(points):
    return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(points, points[1:] + points[:1])) / 2


def panel_path(panel):
    """CAD face of a panel in its own (u, v): outer rings CCW, holes CW."""
    verts, codes = [], []
    for face in _face(panel.outline, panel.holes).faces():
        for index, wire in enumerate([face.outer_wire(), *face.inner_wires()]):
            pts = ring_points(wire)
            if (signed_area(pts) > 0) != (index == 0):
                pts.reverse()
            verts += pts + [pts[0]]
            codes += [MPath.MOVETO] + [MPath.LINETO] * (len(pts) - 1) + [MPath.CLOSEPOLY]
    return MPath(verts, codes)


class View:
    """Paper placement: u right, v up, `scale` paper mm per model mm."""

    def __init__(self, ax, left, ground, scale, u0):
        self.ax, self.left, self.ground, self.s, self.u0 = ax, left, ground, scale, u0

    def p(self, u, v):
        return self.left + (u - self.u0) * self.s, self.ground - v * self.s

    def path(self, path, color, lw=.45, z=1):
        verts = [self.p(u, v) for u, v in path.vertices]
        self.ax.add_patch(PathPatch(MPath(verts, path.codes), facecolor=color, edgecolor=NAVY, lw=lw, zorder=z))

    def rect(self, u0, v0, u1, v1, color, lw=.4, z=1, **kw):
        x, y = self.p(u0, v1)
        self.ax.add_patch(Rectangle((x, y), (u1 - u0) * self.s, (v1 - v0) * self.s,
                                    facecolor=color, edgecolor=kw.pop("edge", NAVY), lw=lw, zorder=z, **kw))

    def disc(self, u, v, d, color, z=1):
        self.ax.add_patch(Disc(self.p(u, v), d / 2 * self.s, facecolor=color, edgecolor=NAVY, lw=.4, zorder=z))

    def line(self, points, color, lw=.6, z=5, **kw):
        xy = [self.p(u, v) for u, v in points]
        self.ax.plot([a for a, _ in xy], [b for _, b in xy], color=color, lw=lw, zorder=z, **kw)

    def text(self, u, v, s, **kw):
        self.ax.text(*self.p(u, v), s, **{"fontsize": 5.5, "color": NAVY, **kw})

    def dim(self, a, b, label, offset, vertical=False):
        """Dimension between model points a and b, pushed `offset` model mm sideways."""
        (u0, v0), (u1, v1) = a, b
        if vertical:
            pts = [(u0 + offset, v0), (u0 + offset, v1)]
        else:
            pts = [(u0, v0 + offset), (u1, v0 + offset)]
        (x0, y0), (x1, y1) = (self.p(*pt) for pt in pts)
        self.ax.annotate("", (x0, y0), (x1, y1), arrowprops=dict(arrowstyle="<|-|>", lw=.45, color=NAVY,
                                                                  mutation_scale=5, shrinkA=0, shrinkB=0), zorder=6)
        mid = ((x0 + x1) / 2, (y0 + y1) / 2)
        self.ax.text(mid[0] + (1.2 if vertical else 0), mid[1] - (0 if vertical else 1), label, fontsize=5.8,
                     color=NAVY, ha="left" if vertical else "center", va="center" if vertical else "bottom", zorder=6)


def items(c, side):
    """Paint list for one elevation: (depth key, rank, kind, payload)."""
    out = []
    for i, p in enumerate(c["panels"]):
        u0, v0, u1, v1 = bounds(p.outline)
        t = p.thickness
        if not side:
            if p.plane == "xy":
                out.append((p.level + t, 0, i, "path", (p, None)))
            elif p.plane == "zy":
                out.append((-u0, 0, i, "rect", (p.level, v0, p.level + t, v1, p.color)))
            else:
                out.append((-v0, 0, i, "rect", (u0, p.level, u1, p.level + t, p.color)))
        else:
            if p.plane == "zy":
                out.append((p.level + t, 0, i, "path", (p, None)))
            elif p.plane == "xy":
                out.append((u1, 0, i, "rect", (-(p.level + t), v0, -p.level, v1, p.color)))
            else:
                out.append((u1, 0, i, "rect", (v0, p.level, v1, p.level + t, p.color)))
    for i, b in enumerate(c["blocks"] + c["electronics"]):
        (x0, y0, z0), (x1, y1, z1) = b.lo, b.hi
        if side:
            out.append((x1, 2, i, "rect", (-z1, y0, -z0, y1, b.color)))
        else:
            out.append((z1, 2, i, "rect", (x0, y0, x1, y1, b.color)))
    for i, r in enumerate(c["rods"]):
        a, b = r.span
        c1, c2 = r.centre
        rr = r.d / 2
        if r.axis == "x":
            out.append((b, 1, i, "disc", (-c2, c1, r.d, r.color)) if side else
                       (c2 + rr, 1, i, "rect", (a, c1 - rr, b, c1 + rr, r.color)))
        else:
            out.append((c1 + rr, 1, i, "rect", (-b, c2 - rr, -a, c2 + rr, r.color)) if side else
                       (b, 1, i, "disc", (c1, c2, r.d, r.color)))
    return sorted(out, key=lambda item: item[:3])


def elevation(ax, c, side, left, ground, scale, ghosts=True, labels=True):
    W, H, D = c["outer"]
    view = View(ax, left, ground, scale, 0 if side else -W / 2)
    paths = {}
    for _, _, _, kind, payload in items(c, side):
        if kind == "path":
            panel = payload[0]
            paths.setdefault(panel.name, panel_path(panel))
            view.path(paths[panel.name], panel.color)
        elif kind == "rect":
            view.rect(*payload[:4], payload[4])
        else:
            view.disc(*payload)
    if not side:
        accent = c["meta"]["accent"]
        for points in c["decor"]:
            view.line(points, accent, lw=.9, z=4, alpha=.9)
    if ghosts:
        modules = {}
        for b in c["electronics"]:
            lo, hi = modules.get(b.module, (list(b.lo), list(b.hi)))
            modules[b.module] = ([min(p, q) for p, q in zip(lo, b.lo)], [max(p, q) for p, q in zip(hi, b.hi)])
        for name, color in GHOST.items():
            (x0, y0, z0), (x1, y1, z1) = modules[name]
            box = (-z1, y0, -z0, y1) if side else (x0, y0, x1, y1)
            view.rect(*box, "none", lw=.55, z=7, edge=color, ls=(0, (3, 1.6)))
            if labels and name in ("pi", "battery"):
                cu, cv = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
                view.text(cu, cv, "Pi 3" if name == "pi" else "battery", fontsize=5, color=color,
                          ha="center", va="center", zorder=8, weight="bold",
                          bbox=dict(boxstyle="round,pad=.15", fc="#ffffffcc", ec="none"))
    view.line([(view.u0 - 8, 0), (view.u0 + (D if side else W) + 8, 0)], "#9aa7b0", lw=.5, z=0)
    return view


def handle_dims(c, front, side):
    h = c["handle"]
    if c["id"] == "lunchbox":
        dowel = next(r for r in c["rods"] if r.module == "handle")
        lid = dowel.centre[0] - dowel.d / 2 - h["finger_gap"]
        front.dim((70, lid), (70, dowel.centre[0] - dowel.d / 2), f"{h['finger_gap']:g}", 0, vertical=True)
        front.dim((-94, dowel.centre[0] + 18), (94, dowel.centre[0] + 18), f"grip {h['grip_length']:g}", 0)
    elif c["id"] == "house":
        dowel = next(r for r in c["rods"] if r.module == "handle")
        ridge = dowel.centre[1] - dowel.d / 2 - h["finger_gap"]
        side.dim((50, ridge), (50, dowel.centre[1] - dowel.d / 2), f"{h['finger_gap']:g}", 0, vertical=True)
        side.dim((6, dowel.centre[1] + 17), (94, dowel.centre[1] + 17), f"grip {h['grip_length']:g}", 0)
    else:
        from lib.radio import CLOUD_SLOT
        cx, cy, length, height = CLOUD_SLOT
        front.dim((cx - length / 2, cy - height / 2 - 4), (cx + length / 2, cy - height / 2 - 4), f"{length:g}", 0)
        front.dim((cx + length / 2 + 4, cy - height / 2), (cx + length / 2 + 4, cy + height / 2), f"{height:g}", 0, vertical=True)


def trimmed(path, background=(240, 244, 248)):
    image = Image.open(path).convert("RGB")
    # Crop the renderer's flat background so the model fills its frame.
    mask = Image.eval(image.convert("L"), lambda v: 0 if abs(v - sum(background) / 3) < 4 else 255)
    box = mask.getbbox() or (0, 0, *image.size)
    pad = 24
    return image.crop((max(0, box[0] - pad), max(0, box[1] - pad),
                       min(image.width, box[2] + pad), min(image.height, box[3] + pad)))


def picture(ax, path, x, y, w, h):
    image = trimmed(path)
    ratio = min(w / image.width, h / image.height)
    pw, ph = image.width * ratio, image.height * ratio
    ax.imshow(image, extent=(x + (w - pw) / 2, x + (w + pw) / 2, y + (h + ph) / 2, y + (h - ph) / 2), zorder=2)


def paragraph(ax, x, y, heading, lines, width=58, size=6.6, color=NAVY, bullet=True):
    ax.text(x, y, heading, fontsize=6.4, color=GREEN, weight="bold", va="top")
    y += 3.8
    for line in lines:
        wrapped = textwrap.wrap(line, width - 2)
        for j, part in enumerate(wrapped):
            prefix = ("•  " if j == 0 else "    ") if bullet else ""
            ax.text(x, y, prefix + part, fontsize=size, color=color, va="top")
            y += 3.1
        y += .4
    return y + 3


def build_lines(c, facts):
    cuts = facts["cut_list"]
    ply = [p for p in cuts if p["plane"] != "block"]
    coping = [p["part"].replace("_removable", "").replace("_", " ") for p in ply if p["coping_saw"]]
    holes = ", ".join(f"Ø{d} × {n}" for d, n in facts["hole_counts"].items())
    lines = [f"{len(ply)} plywood parts + {len(cuts) - len(ply)} corner blocks; all fit one A4 template each.",
             f"Coping saw: {', '.join(coping)}." if coping else "No coping-saw cuts.",
             f"Drill: {holes}."]
    rod = next((r for r in c["rods"] if r.module == "handle"), None)
    if rod:
        lines.append(f"Beech dowel Ø{rod.d:g} × {rod.span[1] - rod.span[0]:g} mm.")
    return lines


def concept_sheet(c, facts, check):
    meta = c["meta"]
    W, H, D = c["outer"]
    fig, ax = page(f"CONCEPT {meta['letter']}  ·  {meta['name']}", meta["tagline"])
    ax.text(12, 30, meta["story"], fontsize=7, color=MUTED)
    scale, ground = .5, 178
    front = elevation(ax, c, False, 20, ground, scale)
    side_left = 20 + W * scale + 24
    side = elevation(ax, c, True, side_left, ground, scale)
    front.dim((-W / 2, 0), (W / 2, 0), f"{W:g}", -14)
    front.dim((-W / 2, 0), (-W / 2, H), f"{H:g}", -12, vertical=True)
    side.dim((0, 0), (D, 0), f"{D:g}", -14)
    handle_dims(c, front, side)
    ax.text(20 + W * scale / 2, ground + 13, "FRONT  1:2", fontsize=6.5, color=NAVY, ha="center", weight="bold")
    ax.text(side_left + D * scale / 2, ground + 13, "SIDE  1:2", fontsize=6.5, color=NAVY, ha="center", weight="bold")
    ax.text(12, 197, "Dashed outlines: Pi, battery, speaker, LCD and keypad behind the plywood.",
            fontsize=5.8, color=MUTED)

    x = 200
    picture(ax, ROOT / "previews" / f"{c['id']}_iso.png", x, 34, 87, 62)
    y = paragraph(ax, x, 102, "HANDLE", [meta["handle"]], bullet=False)
    y = paragraph(ax, x, y, "GOOD FOR A SMALL CHILD", meta["pros"])
    y = paragraph(ax, x, y, "WATCH OUT", meta["cons"])
    y = paragraph(ax, x, y, "CUT AT HOME", build_lines(c, facts), size=6.2)
    status = "PASS" if check["passed"] else "FAIL"
    ax.text(x, y, f"Fit checks {status}: {sum(k['pass'] for k in check['checks'])}/{check['count']}  ·  "
                  f"about {check['mass_estimate_g']} g  ·  {W:g} × {H:g} × {D:g} mm",
            fontsize=6.4, color=GREEN if check["passed"] else AMBER, weight="bold")
    ax.text(12, 204, "Concept massing at 1:2, not a cutting template. Pick one concept; its full CAD then "
                     "produces the 1:1 A4 cut and drill templates.", fontsize=6.2, color=AMBER)
    return fig


def overview(concepts, facts, report):
    s = settings()
    fig, ax = page("Three cozy wooden radios — choose one", "Same Pi 3 electronics as the wooden case. "
                   "Hand tools only, 6 mm plywood, every part fits one A4 template.")
    columns = [12 + i * 95 for i in range(3)]
    for x, c in zip(columns, concepts):
        meta = c["meta"]
        ax.text(x, 33, f"{meta['letter']}  ·  {meta['name']}", fontsize=10, color=NAVY, weight="bold")
        ax.add_patch(Rectangle((x, 36), 88, 62, facecolor="#f0f4f8", edgecolor="none", zorder=1))
        picture(ax, ROOT / "previews" / f"{c['id']}_iso.png", x, 36, 88, 62)
    rows = [("Character", lambda c, f, r: c["meta"]["story"].split(".")[0] + "."),
            ("Outer size", lambda c, f, r: "{:g} × {:g} × {:g} mm".format(*c["outer"])),
            ("Weight", lambda c, f, r: f"about {r['mass_estimate_g']} g with electronics"),
            ("Handle", lambda c, f, r: c["handle"]["type"]),
            ("Grip", lambda c, f, r: f"{c['handle']['grip_length']:g} mm long, {c['handle']['finger_gap']:g} mm finger space"),
            ("Parts", lambda c, f, r: f"{f['plywood_parts']} plywood, {sum(p['coping_saw'] for p in f['cut_list'])} need a coping saw"),
            ("Best at", lambda c, f, r: c["meta"]["pros"][0]),
            ("Trade-off", lambda c, f, r: c["meta"]["cons"][0]),
            ("Fit checks", lambda c, f, r: f"{sum(k['pass'] for k in r['checks'])}/{r['count']} passed")]
    y = 106
    for label, value in rows:
        ax.add_patch(Rectangle((10, y - 2.6), 279, .25, facecolor="#dfe6eb", edgecolor="none"))
        heights = []
        for x, c in zip(columns, concepts):
            lines = textwrap.wrap(value(c, facts[c["id"]], report["concepts"][c["id"]]), 52)
            for j, line in enumerate(lines):
                ax.text(x + 18, y + j * 3, line, fontsize=6.3, color=NAVY, va="top")
            heights.append(len(lines))
        ax.text(12, y, label.upper(), fontsize=5.6, color=GREEN, weight="bold", va="top")
        y += 3 * max(heights) + 3.2
    y = paragraph(ax, 12, y + 2, "ALL THREE", s["common"], width=150, size=6.2)
    return fig


def save(fig, pdf, name):
    pdf.savefig(fig)
    fig.savefig(ROOT / "previews" / f"sheet_{name}.png", dpi=110)
    plt.close(fig)


if __name__ == "__main__":
    report = json.loads((ROOT / "verification.json").read_text())
    concepts = [concept(cid) for cid in IDS]
    facts = {cid: json.loads((ROOT / "facts" / f"{cid}.json").read_text()) for cid in IDS}
    (ROOT / "PDF").mkdir(exist_ok=True)
    with PdfPages(ROOT / "PDF/radio_concepts.pdf") as pdf:
        save(overview(concepts, facts, report), pdf, "overview")
        for c in concepts:
            save(concept_sheet(c, facts[c["id"]], report["concepts"][c["id"]]), pdf, c["id"])
    print("Wrote PDF/radio_concepts.pdf: overview + 3 concept sheets, with PNG previews.")
