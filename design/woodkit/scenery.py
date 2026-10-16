"""Illustrated cover scenes for plans (matplotlib). Deterministic: every random choice is seeded."""
from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from matplotlib import font_manager
from matplotlib.patches import Circle as Disc, Ellipse, Polygon

SERIF_CANDIDATES = ["/System/Library/Fonts/Supplemental/Georgia Bold.ttf", "/System/Library/Fonts/Supplemental/Georgia.ttf",
                    "/Library/Fonts/Georgia.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"]


def title_font():
    for path in SERIF_CANDIDATES:
        if Path(path).exists():
            return font_manager.FontProperties(fname=path)
    return font_manager.FontProperties(family="DejaVu Serif", weight="bold")


def sky(ax, width, height, top="#0f1d38", mid="#28426f", horizon="#9db4d3", horizon_y=.62):
    rows = np.linspace(0, 1, 400)[:, None]
    def mix(a, b, t):
        a = np.array([int(a[i:i + 2], 16) for i in (1, 3, 5)]) / 255
        b = np.array([int(b[i:i + 2], 16) for i in (1, 3, 5)]) / 255
        return a + (b - a) * t
    colors = np.where(rows < horizon_y * .55, 0, 1)
    upper = mix(top, mid, np.clip(rows / (horizon_y * .55), 0, 1))
    lower = mix(mid, horizon, np.clip((rows - horizon_y * .55) / (horizon_y * .45), 0, 1))
    image = np.where(colors[..., None] == 0, upper[:, None, :], lower[:, None, :])
    image = np.repeat(image, 4, axis=1)
    ax.imshow(image, extent=(0, width, height * horizon_y, 0), aspect="auto", zorder=0, interpolation="bicubic")


def stars(ax, width, y_max, count=90, seed=3):
    rnd = random.Random(seed)
    for _ in range(count):
        x, y = rnd.uniform(4, width - 4), rnd.uniform(3, y_max) ** 1.0
        r = rnd.choice([.18, .22, .3, .45])
        ax.add_patch(Disc((x, y * (y / y_max) ** .4), r, color="#ffffff", alpha=rnd.uniform(.45, .95), zorder=1, lw=0))


def moon(ax, x, y, r, color="#fdf6d8"):
    for k, a in ((3.2, .05), (2.2, .08), (1.5, .12)):
        ax.add_patch(Disc((x, y), r * k, color=color, alpha=a, zorder=1, lw=0))
    ax.add_patch(Disc((x, y), r, color=color, zorder=1.1, lw=0))
    for dx, dy, rr in ((-.3, -.2, .18), (.25, .3, .12), (.1, -.45, .1)):
        ax.add_patch(Disc((x + dx * r, y + dy * r), rr * r, color="#ece1b8", zorder=1.2, lw=0))


def hills(ax, width, base_y, layers=(("#c9d7ea", 22, 2), ("#e3ebf6", 14, 5), ("#f4f7fc", 8, 9)), seed=5):
    rnd = random.Random(seed)
    for i, (color, amp, phase) in enumerate(layers):
        xs = np.linspace(-2, width + 2, 200)
        k1, k2 = rnd.uniform(.012, .02), rnd.uniform(.03, .05)
        ys = base_y + i * 12 - amp * (0.6 * np.sin(xs * k1 + phase) + 0.4 * np.sin(xs * k2 + 2 * phase)) * .5
        pts = list(zip(xs, ys)) + [(width + 2, 400), (-2, 400)]
        ax.add_patch(Polygon(pts, closed=True, facecolor=color, edgecolor="none", zorder=2 + i * .1))


def pine(ax, x, ground, h, z=3, color="#1f4a3a", snow="#f4f8fc"):
    w = h * .42
    ax.add_patch(Polygon([(x - w * .08, ground), (x + w * .08, ground), (x + w * .08, ground - h * .15), (x - w * .08, ground - h * .15)],
                         facecolor="#3a2a1e", edgecolor="none", zorder=z))
    for i in range(4):
        top = ground - h * (.25 + .22 * i) - h * .2
        half = w * (1 - .2 * i) / 2
        base = ground - h * (.12 + .22 * i)
        ax.add_patch(Polygon([(x - half, base), (x + half, base), (x, top)], facecolor=color, edgecolor="none", zorder=z + .01 * i))
        # Snow resting on each tier.
        ax.add_patch(Polygon([(x - half * .75, base - h * .03), (x, top + h * .02), (x + half * .55, base - h * .05),
                              (x + half * .2, base - h * .08), (x - half * .3, base - h * .06)],
                             facecolor=snow, edgecolor="none", zorder=z + .015 + .01 * i, alpha=.95))


def snowfall(ax, width, height, count=160, seed=11, z=20):
    rnd = random.Random(seed)
    for _ in range(count):
        x, y = rnd.uniform(0, width), rnd.uniform(0, height)
        r = rnd.choice([.25, .35, .5, .7, .9])
        ax.add_patch(Disc((x, y), r, color="#ffffff", alpha=rnd.uniform(.5, .95), zorder=z, lw=0))
    for _ in range(14):
        x, y, r = rnd.uniform(8, width - 8), rnd.uniform(30, height * .7), rnd.uniform(1.5, 2.6)
        for k in range(3):
            a = math.pi / 3 * k + rnd.uniform(0, .5)
            ax.plot([x - r * math.cos(a), x + r * math.cos(a)], [y - r * math.sin(a), y + r * math.sin(a)],
                    color="#ffffff", lw=.45, alpha=.85, zorder=z)


def glow(ax, x, y, r, color="#ffd77a", z=4):
    for k, a in ((3.0, .05), (2.2, .08), (1.6, .12), (1.15, .18)):
        ax.add_patch(Ellipse((x, y), 2 * r * k, 2 * r * k * .8, color=color, alpha=a, zorder=z, lw=0))


def snow_band(points, thickness, seed=1, bumps=.35):
    """A soft snow layer lying on a polyline (paper coords, y down): returns polygon points."""
    rnd = random.Random(seed)
    top, bottom = [], []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        L = math.dist((x0, y0), (x1, y1))
        n = max(2, int(L / 2.2))
        nx, ny = (y1 - y0) / L, -(x1 - x0) / L        # normal pointing up on paper (y down)
        if ny > 0:
            nx, ny = -nx, -ny
        for i in range(n):
            t = i / n
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            lift = thickness * (1 + bumps * math.sin(i * 1.7 + rnd.uniform(0, 1)))
            top.append((x + nx * lift, y + ny * lift))
            bottom.append((x, y))
    top.append(points[-1])
    return top + bottom[::-1]


def icicles(ax, x0, x1, y, count, seed=2, z=9):
    rnd = random.Random(seed)
    for i in range(count):
        x = x0 + (x1 - x0) * (i + .5) / count + rnd.uniform(-.4, .4)
        length = rnd.uniform(1.2, 3.4)
        ax.add_patch(Polygon([(x - .45, y), (x + .45, y), (x, y + length)], facecolor="#e6f1fb", edgecolor="#b9cde2",
                             lw=.2, zorder=z))
