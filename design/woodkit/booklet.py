"""IKEA-style assembly pages: big step numbers, line drawings, hardware callouts, 1:1 hardware.

All drawing units are millimetres on an A4 page (y down), so hardware drawn here is true size.
"""
from __future__ import annotations

import math

from matplotlib.patches import Circle as Disc, FancyBboxPatch, Polygon, Rectangle, RegularPolygon, Wedge
from PIL import Image, ImageOps

INK, GREY, PALE, OK, NO = "#111111", "#7d7d7d", "#ececec", "#2f8f4e", "#c8372d"


def line_art(path, darken=.6):
    """Renderer line drawing to print-friendly black lines; ghosted parts stay mid grey."""
    image = ImageOps.grayscale(Image.open(path))
    return image.point(lambda v: 255 if v > 248 else int(v * darken)).convert("RGB")


def box(ax, x, y, w, h, fill="white", edge=INK, lw=.6, r=2.5, z=1):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}", facecolor=fill, edgecolor=edge, lw=lw, zorder=z))


def badge(ax, x, y, good=True, r=4):
    ax.add_patch(Disc((x, y), r, facecolor=OK if good else NO, edgecolor="none", zorder=6))
    if good:
        ax.plot([x - r * .45, x - r * .1, x + r * .5], [y, y + r * .4, y - r * .45], color="white", lw=1.4, zorder=7,
                solid_capstyle="round")
    else:
        for s in (1, -1):
            ax.plot([x - r * .4, x + r * .4], [y - s * r * .4, y + s * r * .4], color="white", lw=1.4, zorder=7, solid_capstyle="round")


# ------------------------------------------------------------------ icons (s = height in mm)

def person(ax, x, y, s=14):
    ax.add_patch(Disc((x, y - s * .82), s * .14, facecolor="white", edgecolor=INK, lw=.7))
    ax.add_patch(Polygon([(x - s * .22, y), (x - s * .2, y - s * .62), (x + s * .2, y - s * .62), (x + s * .22, y)],
                         facecolor="white", edgecolor=INK, lw=.7))


def glue(ax, x, y, s=10):
    ax.add_patch(FancyBboxPatch((x - s * .22, y - s * .62), s * .44, s * .62, boxstyle="round,pad=0,rounding_size=1",
                                facecolor="white", edgecolor=INK, lw=.6))
    ax.add_patch(Polygon([(x - s * .12, y - s * .62), (x + s * .12, y - s * .62), (x, y - s)], facecolor=INK, edgecolor=INK, lw=.4))
    ax.add_patch(Disc((x + s * .3, y - s * .95), s * .07, facecolor=INK, edgecolor="none"))


def screwdriver(ax, x, y, s=12):
    ax.add_patch(FancyBboxPatch((x - s * .12, y - s), s * .24, s * .42, boxstyle="round,pad=0,rounding_size=1",
                                facecolor="white", edgecolor=INK, lw=.6))
    ax.plot([x, x], [y - s * .58, y - s * .05], color=INK, lw=1.0)
    ax.plot([x - s * .06, x + s * .06], [y - s * .05, y - s * .05], color=INK, lw=.9)


def drill(ax, x, y, s=12):
    ax.add_patch(FancyBboxPatch((x - s * .45, y - s), s * .7, s * .3, boxstyle="round,pad=0,rounding_size=1",
                                facecolor="white", edgecolor=INK, lw=.6))
    ax.add_patch(Polygon([(x - s * .1, y - s * .7), (x + s * .1, y - s * .7), (x + s * .05, y - s * .15), (x - s * .15, y - s * .15)],
                         facecolor="white", edgecolor=INK, lw=.6))
    ax.plot([x + s * .25, x + s * .6], [y - s * .85, y - s * .85], color=INK, lw=.8)


def saw(ax, x, y, s=12):
    teeth = [(x - s * .5 + i * s * .1, y - s * .25 + (i % 2) * s * .06) for i in range(9)]
    ax.add_patch(Polygon([(x - s * .5, y - s * .45)] + teeth + [(x + s * .32, y - s * .45)], facecolor="white", edgecolor=INK, lw=.6))
    ax.add_patch(FancyBboxPatch((x + s * .3, y - s * .6), s * .25, s * .3, boxstyle="round,pad=0,rounding_size=1",
                                facecolor="white", edgecolor=INK, lw=.6))


def coping_saw(ax, x, y, s=12):
    ax.plot([x - s * .45, x - s * .45, x + s * .35, x + s * .35], [y - s * .3, y - s * .9, y - s * .9, y - s * .3], color=INK, lw=.8)
    ax.plot([x - s * .45, x + s * .35], [y - s * .3, y - s * .3], color=INK, lw=.4)
    ax.add_patch(FancyBboxPatch((x - s * .55, y - s * .3), s * .2, s * .3, boxstyle="round,pad=0,rounding_size=1",
                                facecolor="white", edgecolor=INK, lw=.6))


def clamp(ax, x, y, s=12):
    ax.plot([x - s * .4, x - s * .4, x + s * .3], [y - s * .9, y - s * .1, y - s * .1], color=INK, lw=.9)
    ax.plot([x - s * .4, x + s * .3], [y - s * .9, y - s * .9], color=INK, lw=.9)
    ax.plot([x + s * .1, x + s * .1], [y - s * .9, y - s * .35], color=INK, lw=.8)
    ax.add_patch(Rectangle((x - s * .05, y - s * .35), s * .3, s * .1, facecolor="white", edgecolor=INK, lw=.6))


def sandpaper(ax, x, y, s=12):
    ax.add_patch(Rectangle((x - s * .4, y - s * .7), s * .8, s * .55, facecolor="#f3efe4", edgecolor=INK, lw=.6, angle=8))
    for i in range(12):
        ax.add_patch(Disc((x - s * .3 + (i % 4) * s * .2, y - s * .55 + (i // 4) * s * .15), s * .02, facecolor=INK, edgecolor="none"))


def ruler(ax, x, y, s=12):
    ax.add_patch(Rectangle((x - s * .5, y - s * .45), s, s * .25, facecolor="white", edgecolor=INK, lw=.6))
    for i in range(11):
        ax.plot([x - s * .5 + i * s * .1] * 2, [y - s * .45, y - s * (.38 if i % 5 else .32)], color=INK, lw=.4)


def magnet(ax, x, y, s=10):
    ax.add_patch(Disc((x, y - s * .5), s * .38, facecolor="#cfd3d6", edgecolor=INK, lw=.6))
    ax.text(x, y - s * .5, "N", fontsize=s * .45, ha="center", va="center", color=INK, weight="bold")


ICONS = {"person": person, "glue": glue, "screwdriver": screwdriver, "drill": drill, "saw": saw, "coping saw": coping_saw,
         "clamp": clamp, "sandpaper": sandpaper, "ruler": ruler, "magnet": magnet}


# ------------------------------------------------------------------ 1:1 hardware

def machine_screw(ax, x, y, d, length, head="countersunk", label=None):
    """Side view, true size, head at the top, point downward; y is the head's top."""
    if head == "countersunk":
        k, dk = .6 * d, 1.9 * d
        ax.add_patch(Polygon([(x - dk / 2, y), (x + dk / 2, y), (x + d / 2, y + k), (x - d / 2, y + k)], facecolor="white",
                             edgecolor=INK, lw=.5))
        shank_from = y + k
        top = y
    else:
        k, dk = .7 * d, 1.9 * d
        ax.add_patch(FancyBboxPatch((x - dk / 2, y - k), dk, k, boxstyle="round,pad=0,rounding_size=.6", facecolor="white",
                                    edgecolor=INK, lw=.5))
        shank_from = y
        top = y - k
    bottom = (y + length) if head == "countersunk" else (y + length)
    ax.add_patch(Rectangle((x - d / 2, shank_from), d, bottom - shank_from, facecolor="white", edgecolor=INK, lw=.5))
    t = shank_from + .6
    while t < bottom - .3:
        ax.plot([x - d / 2, x + d / 2], [t, t + .25], color=INK, lw=.25)
        t += max(.45, d * .18)
    if label:
        ax.text(x, bottom + 3, label, fontsize=5.4, ha="center", va="top", color=INK)
    return top, bottom


def wood_screw(ax, x, y, d, length, head="countersunk", label=None):
    k, dk = .6 * d, 2 * d
    if head == "countersunk":
        ax.add_patch(Polygon([(x - dk / 2, y), (x + dk / 2, y), (x + d / 2, y + k), (x - d / 2, y + k)], facecolor="white",
                             edgecolor=INK, lw=.5))
        start = y + k
    else:
        ax.add_patch(FancyBboxPatch((x - dk / 2, y - k), dk, k, boxstyle="round,pad=0,rounding_size=.6", facecolor="white",
                                    edgecolor=INK, lw=.5))
        start = y
    tip = y + length
    ax.add_patch(Polygon([(x - d / 2, start), (x + d / 2, start), (x + d / 2, tip - d), (x, tip), (x - d / 2, tip - d)],
                         facecolor="white", edgecolor=INK, lw=.5))
    t = start + 1
    while t < tip - d:
        ax.plot([x - d / 2, x + d / 2], [t, t + d * .35], color=INK, lw=.3)
        t += d * .45
    if label:
        ax.text(x, tip + 3, label, fontsize=5.4, ha="center", va="top", color=INK)


def nut(ax, x, y, across_flats, label=None, acorn=False):
    r = across_flats / math.sqrt(3)
    ax.add_patch(RegularPolygon((x, y), 6, radius=r, orientation=0, facecolor="white", edgecolor=INK, lw=.5))
    ax.add_patch(Disc((x, y), across_flats * .32, facecolor="white" if not acorn else "#d9d9d9", edgecolor=INK, lw=.4))
    if label:
        ax.text(x, y + r + 2.5, label, fontsize=5.4, ha="center", va="top", color=INK)


def washer(ax, x, y, od, hole, label=None):
    ax.add_patch(Disc((x, y), od / 2, facecolor="white", edgecolor=INK, lw=.5))
    ax.add_patch(Disc((x, y), hole / 2, facecolor="white", edgecolor=INK, lw=.4))
    if label:
        ax.text(x, y + od / 2 + 2.5, label, fontsize=5.4, ha="center", va="top", color=INK)


def spacer(ax, x, y, od, length, label=None, threaded=False):
    ax.add_patch(Rectangle((x - od / 2, y), od, length, facecolor="white" if not threaded else "#e4e4e4", edgecolor=INK, lw=.5))
    if label:
        ax.text(x, y + length + 3, label, fontsize=5.4, ha="center", va="top", color=INK)


def hinge(ax, x, y, length, leaf, label=None):
    for side in (-1, 1):
        ax.add_patch(Rectangle((x + (0 if side > 0 else -leaf), y), leaf, length, facecolor="#f5ecd0", edgecolor=INK, lw=.5))
        for k in (.25, .75):
            ax.add_patch(Disc((x + side * leaf / 2, y + length * k), 1.7, facecolor="white", edgecolor=INK, lw=.4))
    ax.add_patch(Rectangle((x - 1, y), 2, length, facecolor="#e2d29c", edgecolor=INK, lw=.5))
    if label:
        ax.text(x, y + length + 3, label, fontsize=5.4, ha="center", va="top", color=INK)


def magnet_disc(ax, x, y, d, label=None):
    ax.add_patch(Disc((x, y), d / 2, facecolor="#cfd3d6", edgecolor=INK, lw=.5))
    if label:
        ax.text(x, y + d / 2 + 2.5, label, fontsize=5.4, ha="center", va="top", color=INK)


# ------------------------------------------------------------------ pages

def step_number(ax, x, y, n, size=30):
    ax.text(x, y, str(n), fontsize=size, weight="bold", color=INK, va="top", ha="left")


def callout(ax, x, y, count, text, draw=None, w=40, h=16):
    """Rounded hardware box: 'count×', a tiny drawing, the name."""
    box(ax, x, y, w, h, lw=.6)
    ax.text(x + 2.5, y + h / 2, f"{count}×", fontsize=8.5, weight="bold", va="center", color=INK)
    if draw:
        draw(ax, x + 14, y + h - 3)
    ax.text(x + 21, y + h / 2, text, fontsize=5.4, va="center", color=INK, wrap=True)


def step_panel(ax, x, y, w, h, n, image, caption, callouts=(), glue_step=False, flip_icon=None):
    from .paper import picture
    box(ax, x, y, w, h, fill="white", edge="#bdbdbd", lw=.4, r=3)
    step_number(ax, x + 4, y + 3, n)
    ax.text(x + 24, y + 9, caption, fontsize=7.5, color=INK, va="center")
    picture(ax, image, x + 22, y + 14, w - 26, h - (36 if callouts else 18))
    cx = x + w - 4
    for count, text, draw in callouts[::-1]:
        cx -= 44
        callout(ax, cx, y + h - 20, count, text, draw)
    if glue_step:
        glue(ax, x + 12, y + 33, 11)
