"""2D primitives and 3D part descriptions. Pure Python: no CAD needed to import.

Panel outlines are primitives in projected (u, v):
  "xy" panels: (X, Y), extruded +Z from `level`  (fronts, backs, gables)
  "zy" panels: (-Z, Y), extruded +X from `level` (side walls)
  "xz" panels: (X, -Z), extruded +Y from `level` (floors, lids)
CAD, drawings and templates all read these same primitives.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field


@dataclass
class Rect:
    u: float
    v: float
    w: float
    h: float
    r: float = 0


@dataclass
class Circle:
    u: float
    v: float
    d: float


@dataclass
class Poly:
    points: list


@dataclass
class Mark:
    """Template-only mark: a centre cross, optionally amber ("transfer from the part")."""
    u: float
    v: float
    label: str = ""
    transfer: bool = False


@dataclass
class Pose:
    """Rotation about an axis through `pivot`, then a translation. Angles in degrees."""
    pivot: tuple = (0, 0, 0)
    axis: tuple = (0, 0, 1)
    angle: float = 0
    move: tuple = (0, 0, 0)

    def apply(self, point):
        x, y, z = (p - c for p, c in zip(point, self.pivot))
        ax, ay, az = self.axis
        n = math.sqrt(ax * ax + ay * ay + az * az)
        ax, ay, az = ax / n, ay / n, az / n
        a = math.radians(self.angle)
        c, s = math.cos(a), math.sin(a)
        dot = ax * x + ay * y + az * z
        cross = (ay * z - az * y, az * x - ax * z, ax * y - ay * x)
        r = [p * c + q * s + k * dot * (1 - c) for p, q, k in zip((x, y, z), cross, (ax, ay, az))]
        return tuple(v + p + m for v, p, m in zip(r, self.pivot, self.move))


def poses(pose):
    """A part's pose may be None, one Pose, or a list applied in order."""
    if pose is None:
        return []
    return list(pose) if isinstance(pose, (list, tuple)) else [pose]


def place(point, pose):
    for step in poses(pose):
        point = step.apply(point)
    return point


def then(pose, *more):
    """Append poses: then(board_pose, open_pose) places a board, then opens it."""
    return poses(pose) + [m for p in more for m in poses(p)]


@dataclass
class Panel:
    name: str
    plane: str
    level: float
    outline: list
    holes: list = field(default_factory=list)
    thickness: float = 6
    color: str = "#d8b384"
    # Flat cut size when the extrusion is not the plywood thickness (prisms such as roof boards).
    cut: tuple | None = None
    copies: int = 1
    marks: list = field(default_factory=list)
    title: str = ""
    note: str = ""
    pose: object = None    # None, a Pose, or a list of Poses applied in order
    group: str = "wood"


@dataclass
class Box:
    module: str
    part: str
    lo: tuple
    hi: tuple
    color: str
    pose: object = None    # None, a Pose, or a list of Poses applied in order


@dataclass
class Rod:
    name: str
    axis: str
    centre: tuple
    span: tuple
    d: float
    color: str
    module: str = ""
    pose: object = None    # None, a Pose, or a list of Poses applied in order


def bounds(primitives):
    us, vs = [], []
    for p in primitives:
        if isinstance(p, Rect):
            us += [p.u, p.u + p.w]
            vs += [p.v, p.v + p.h]
        elif isinstance(p, Circle):
            us += [p.u - p.d / 2, p.u + p.d / 2]
            vs += [p.v - p.d / 2, p.v + p.d / 2]
        else:
            us += [x for x, _ in p.points]
            vs += [y for _, y in p.points]
    return min(us), min(vs), max(us), max(vs)


def flat_size(panel):
    if panel.cut:
        return tuple(sorted(panel.cut))
    u0, v0, u1, v1 = bounds(panel.outline)
    return tuple(sorted((round(u1 - u0, 1), round(v1 - v0, 1))))


def signed_area(points):
    return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(points, points[1:] + points[:1])) / 2


def vogel(cx, cy, count, radius, d):
    """Sunflower hole pattern; spacing stays even as the count changes."""
    golden = math.radians(137.508)
    return [Circle(cx + radius * math.sqrt((i + .5) / count) * math.cos(i * golden),
                   cy + radius * math.sqrt((i + .5) / count) * math.sin(i * golden), d)
            for i in range(count)]


def ring(cx, cy, radius, count, d, phase=0):
    return [Circle(cx + radius * math.cos(phase + 2 * math.pi * i / count),
                   cy + radius * math.sin(phase + 2 * math.pi * i / count), d) for i in range(count)]


def vents(x0, y0, columns, rows, pitch=10, d=5):
    return [Circle(x0 + i * pitch, y0 + j * pitch, d) for i in range(columns) for j in range(rows)]


def to_uv(plane, point):
    """Global (x, y, z) to a panel's projected (u, v)."""
    x, y, z = point
    return {"xy": (x, y), "zy": (-z, y), "xz": (x, -z)}[plane]


def box_of(lo, size):
    return lo, tuple(a + b for a, b in zip(lo, size))


def merge_bounds(boxes):
    lo = [min(b[0][i] for b in boxes) for i in range(3)]
    hi = [max(b[1][i] for b in boxes) for i in range(3)]
    return lo, hi
