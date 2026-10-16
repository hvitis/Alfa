"""A4 pages and orthographic drawings painted from woodkit shapes (matplotlib).

View paints parts far-to-near. Unposed panels seen face-on are drawn from their
CAD face, with real holes; anything else is drawn as the convex silhouette of
its posed corners, which is exact for the flat boards, boxes and rods used here.
"""
from __future__ import annotations

import math
import textwrap

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import Circle as Disc, PathPatch, Polygon as Poly2D, Rectangle  # noqa: E402
from matplotlib.path import Path as MPath  # noqa: E402

from .shapes import Box, Panel, Rod, bounds, place, poses, signed_area  # noqa: E402

NAVY, GREEN, AMBER, MUTED, LIGHT = "#1c3547", "#23735a", "#ad611b", "#5d7180", "#dfe6eb"
A4 = (210, 297)


def page(title="", subtitle="", eyebrow="", landscape=False, size=A4):
    w, h = (size[1], size[0]) if landscape else size
    fig = plt.figure(figsize=(w / 25.4, h / 25.4), dpi=150)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, w)
    ax.set_ylim(h, 0)
    ax.set_aspect("equal")
    ax.axis("off")
    if eyebrow:
        ax.text(12, 11, eyebrow, fontsize=7, color=GREEN, weight="bold")
    if title:
        ax.text(12, 19.5, title, fontsize=14, color=NAVY, weight="bold")
    if subtitle:
        ax.text(12, 25.5, subtitle, fontsize=7.6, color=NAVY)
    return fig, ax


def footer(ax, text, page_no=None, width=210, height=297):
    ax.plot([12, width - 12], [height - 12, height - 12], color=LIGHT, lw=.5)
    ax.text(12, height - 7.5, text, fontsize=5.8, color=MUTED)
    if page_no is not None:
        ax.text(width - 12, height - 7.5, str(page_no), fontsize=6.5, color=NAVY, ha="right")


def paragraph(ax, x, y, heading, lines, width=60, size=6.6, color=NAVY, bullet=True, gap=3.1):
    if heading:
        ax.text(x, y, heading, fontsize=6.4, color=GREEN, weight="bold", va="top")
        y += 3.9
    for line in lines:
        for j, part in enumerate(textwrap.wrap(line, width - 2)):
            prefix = ("•  " if j == 0 else "    ") if bullet else ""
            ax.text(x, y, prefix + part, fontsize=size, color=color, va="top")
            y += gap * size / 6.6
        y += .5
    return y + 2


def table(ax, x, y, columns, rows, size=5.9, row_h=4.2, header=True, zebra=True, wrap=None):
    """columns: [(title, width_mm)]; rows: lists of strings. Returns the y below the table."""
    wrap = wrap or {}
    if header:
        cx = x
        for title, w in columns:
            ax.text(cx + 1, y, title, fontsize=size, color=GREEN, weight="bold", va="top")
            cx += w
        y += row_h
    for i, row in enumerate(rows):
        cells = [textwrap.wrap(str(v), wrap.get(j, 200)) or [""] for j, v in enumerate(row)]
        lines = max(len(c) for c in cells)
        h = row_h + (lines - 1) * size * .42
        if zebra and i % 2 == 0:
            ax.add_patch(Rectangle((x, y - .9), sum(w for _, w in columns), h, facecolor="#f3f6f8", edgecolor="none", zorder=0))
        cx = x
        for (title, w), cell in zip(columns, cells):
            for k, line in enumerate(cell):
                ax.text(cx + 1, y + k * size * .42, line, fontsize=size, color=NAVY, va="top")
            cx += w
        y += h
    return y


def gauge(ax, x, y, vertical=False, label="100 mm: measure before cutting"):
    if vertical:
        ax.plot([x, x], [y, y + 100], color=NAVY, lw=.65)
        for t in range(0, 101, 10):
            ax.plot([x - 1.5, x + 1.5], [y + t, y + t], color=NAVY, lw=.65)
        ax.text(x + 3, y + 50, label, fontsize=5.8, rotation=-90, va="center", ha="left", color=NAVY)
    else:
        ax.plot([x, x + 100], [y, y], color=NAVY, lw=.65)
        for t in range(0, 101, 10):
            ax.plot([x + t, x + t], [y - 1.5, y + 1.5], color=NAVY, lw=.65)
        ax.text(x, y + 4.5, label, fontsize=5.8, color=NAVY)


def save_pages(pdf, figs, png_dir=None, names=None, dpi=110):
    for i, fig in enumerate(figs):
        pdf.savefig(fig)
        if png_dir is not None and names:
            fig.savefig(png_dir / f"{names[i]}.png", dpi=dpi)
        plt.close(fig)


def picture(ax, image, x, y, w, h, zorder=2):
    ratio = min(w / image.width, h / image.height)
    pw, ph = image.width * ratio, image.height * ratio
    ax.imshow(image, extent=(x + (w - pw) / 2, x + (w + pw) / 2, y + (h + ph) / 2, y + (h - ph) / 2), zorder=zorder)
    return (x + (w - pw) / 2, y + (h - ph) / 2, pw, ph)


# ------------------------------------------------------------------ geometry helpers

def hull(points):
    pts = sorted(set((round(a, 4), round(b, 4)) for a, b in points))
    if len(pts) <= 2:
        return pts
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def panel_corners(panel: Panel):
    u0, v0, u1, v1 = bounds(panel.outline)
    a, b = panel.level, panel.level + panel.thickness
    out = []
    for u in (u0, u1):
        for v in (v0, v1):
            for w in (a, b):
                out.append({"xy": (u, v, w), "zy": (w, v, -u), "xz": (u, w, -v)}[panel.plane])
    return [place(c, panel.pose) for c in out]


def box_corners(b: Box):
    return [place((x, y, z), b.pose) for x in (b.lo[0], b.hi[0]) for y in (b.lo[1], b.hi[1]) for z in (b.lo[2], b.hi[2])]


def rod_points(r: Rod, n=20):
    a, b = r.span
    c1, c2 = r.centre
    out = []
    for s in (a, b):
        for i in range(n):
            t = 2 * math.pi * i / n
            p, q = c1 + r.d / 2 * math.cos(t), c2 + r.d / 2 * math.sin(t)
            out.append({"x": (s, p, q), "y": (p, s, q), "z": (p, q, s)}[r.axis])
    return [place(c, r.pose) for c in out]


def face_path(panel, faces_cache={}):
    """CAD face of a panel in its own (u, v); needs cadgen (build123d). Cached by content."""
    key = (panel.plane, repr(panel.outline), repr(panel.holes))
    if key in faces_cache:
        return faces_cache[key]
    from .cad import face
    verts, codes = [], []
    for f in face(panel.outline, panel.holes).faces():
        for index, wire in enumerate([f.outer_wire(), *f.inner_wires()]):
            n = max(24, int(wire.length / 0.4))
            pts = [(q.X, q.Y) for q in (wire @ (i / n) for i in range(n))]
            if (signed_area(pts) > 0) != (index == 0):
                pts.reverse()
            verts += pts + [pts[0]]
            codes += [MPath.MOVETO] + [MPath.LINETO] * (len(pts) - 1) + [MPath.CLOSEPOLY]
    faces_cache[key] = MPath(verts, codes)
    return faces_cache[key]


# ------------------------------------------------------------------ views

class View:
    """An orthographic view placed on the page. `kind` is front, back or side (from the right)."""

    def __init__(self, ax, kind, origin, scale, u_ref=0.0):
        self.ax, self.kind, (self.x0, self.y0), self.s, self.u_ref = ax, kind, origin, scale, u_ref

    def uv(self, point):
        x, y, z = point
        return {"front": (x, y), "back": (-x, y), "side": (-z, y)}[self.kind]

    def depth(self, point):
        x, y, z = point
        return {"front": z, "back": -z, "side": x}[self.kind]

    def p(self, u, v):
        return self.x0 + (u - self.u_ref) * self.s, self.y0 - v * self.s

    # Low-level drawing in model (u, v).
    def polygon(self, uvs, face, edge=NAVY, lw=.4, z=1, **kw):
        self.ax.add_patch(Poly2D([self.p(*q) for q in uvs], closed=True, facecolor=face, edgecolor=edge, lw=lw, zorder=z, **kw))

    def path(self, path, face, mirror=False, edge=NAVY, lw=.45, z=1, **kw):
        verts = [self.p(-u if mirror else u, v) for u, v in path.vertices]
        self.ax.add_patch(PathPatch(MPath(verts, path.codes), facecolor=face, edgecolor=edge, lw=lw, zorder=z, **kw))

    def line(self, uvs, color, lw=.6, z=5, **kw):
        xy = [self.p(*q) for q in uvs]
        self.ax.plot([a for a, _ in xy], [b for _, b in xy], color=color, lw=lw, zorder=z, solid_capstyle="round", **kw)

    def text(self, u, v, s, **kw):
        self.ax.text(*self.p(u, v), s, **{"fontsize": 5.5, "color": NAVY, "zorder": 9, **kw})

    def disc(self, u, v, d, face, edge=NAVY, z=6):
        self.ax.add_patch(Disc(self.p(u, v), d / 2 * self.s, facecolor=face, edgecolor=edge, lw=.4, zorder=z))

    def dim(self, a, b, label, offset, vertical=False, z=8):
        (u0, v0), (u1, v1) = a, b
        pts = [(u0 + offset, v0), (u0 + offset, v1)] if vertical else [(u0, v0 + offset), (u1, v0 + offset)]
        (x0, y0), (x1, y1) = (self.p(*q) for q in pts)
        for (ua, va), (xa, ya) in zip((a, b), ((x0, y0), (x1, y1))):
            xe, ye = self.p(ua, va)
            self.ax.plot([xe, xa], [ye, ya], color=MUTED, lw=.3, zorder=z)
        self.ax.annotate("", (x0, y0), (x1, y1), arrowprops=dict(arrowstyle="<|-|>", lw=.45, color=NAVY, mutation_scale=5,
                                                                  shrinkA=0, shrinkB=0), zorder=z)
        mid = ((x0 + x1) / 2, (y0 + y1) / 2)
        self.ax.text(mid[0] + (1.2 if vertical else 0), mid[1] - (0 if vertical else 1), label, fontsize=5.8, color=NAVY,
                     ha="left" if vertical else "center", va="center" if vertical else "bottom", zorder=z,
                     bbox=dict(boxstyle="round,pad=.12", fc="#ffffffd0", ec="none"))

    # Painting woodkit shapes.
    def items(self, shapes, skip=lambda label: False, label_of=lambda s: getattr(s, "name", "")):
        out = []
        for kind in ("panels", "boxes", "rods"):
            for i, s in enumerate(shapes.get(kind, [])):
                label = label_of(s)
                if skip(label):
                    continue
                if isinstance(s, Panel):
                    corners = panel_corners(s)
                    face_on = not poses(s.pose) and ((s.plane == "xy" and self.kind in ("front", "back")) or
                                                    (s.plane == "zy" and self.kind == "side"))
                    payload = ("path", s) if face_on else ("hull", hull([self.uv(c) for c in corners]), s.color)
                elif isinstance(s, Box):
                    corners = box_corners(s)
                    payload = ("hull", hull([self.uv(c) for c in corners]), s.color)
                else:
                    corners = rod_points(s)
                    payload = ("hull", hull([self.uv(c) for c in corners]), s.color)
                out.append((max(self.depth(c) for c in corners), {"panels": 0, "boxes": 2, "rods": 1}[kind], i, payload))
        return sorted(out, key=lambda t: t[:3])

    def paint(self, shapes, skip=lambda label: False, label_of=lambda s: getattr(s, "name", ""), edge=NAVY, lw=.4,
              colors=None, z=1):
        for _, _, _, payload in self.items(shapes, skip, label_of):
            if payload[0] == "path":
                panel = payload[1]
                mirror = self.kind == "back"
                color = (colors or {}).get(panel.name, panel.color)
                self.path(face_path(panel), color, mirror=mirror, edge=edge, lw=lw, z=z)
            else:
                _, uvs, color = payload
                if len(uvs) >= 3:
                    self.polygon(uvs, color, edge=edge, lw=lw, z=z)

    def outline(self, shapes, select, color, ls=(0, (3, 1.6)), lw=.55, label_of=lambda s: getattr(s, "name", ""), z=7):
        """Dashed silhouette of the selected parts drawn over everything."""
        for _, _, _, payload in self.items(shapes, lambda label: not select(label), label_of):
            if payload[0] == "path":
                self.path(face_path(payload[1]), "none", mirror=self.kind == "back", edge=color, lw=lw, z=z, ls=ls)
            elif len(payload[1]) >= 3:
                self.polygon(payload[1], "none", edge=color, lw=lw, z=z, ls=ls)

    def route(self, points, color, lw=.7, z=6, outline=False):
        uvs = [self.uv(q) for q in points]
        if outline:
            self.line(uvs, "#7b8387", lw=lw + .6, z=z)
        self.line(uvs, color, lw=lw, z=z + .1)
