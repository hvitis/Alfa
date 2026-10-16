"""build123d solids from woodkit shapes. Import inside the cadgen environment."""
from __future__ import annotations

from cadgen import build123d as bd, srgb

from .shapes import Box, Circle, Panel, Rect, Rod, poses, signed_area

PLANES = {"xy": ((0, 0, 1), (1, 0, 0), (0, 0, 1)),
          "zy": ((1, 0, 0), (0, 0, -1), (1, 0, 0)),
          "xz": ((0, 1, 0), (1, 0, 0), (0, 1, 0))}


def face(primitives, holes=()):
    """One 2D face in (u, v) from outline primitives minus holes."""
    def one(p):
        if isinstance(p, Rect):
            shape = bd.RectangleRounded(p.w, p.h, p.r) if p.r else bd.Rectangle(p.w, p.h)
            return bd.Pos(p.u + p.w / 2, p.v + p.h / 2) * shape
        if isinstance(p, Circle):
            return bd.Pos(p.u, p.v) * bd.Circle(p.d / 2)
        # Counter-clockwise points give a +normal face, so extrusion keeps its direction.
        return bd.Polygon(*(p.points if signed_area(p.points) > 0 else p.points[::-1]), align=None)

    result = one(primitives[0])
    for p in primitives[1:]:
        result += one(p)
    for h in holes:
        result -= one(h)
    return result


def posed(solid, pose):
    for step in poses(pose):
        if step.angle:
            solid = solid.rotate(bd.Axis(step.pivot, step.axis), step.angle)
        if any(step.move):
            solid = solid.moved(bd.Location(step.move))
    return solid


def labelled(solid, label, color):
    solid.label, solid.color = label, srgb(color)
    return solid


def panel_solid(panel: Panel, prefix="wood_"):
    axis, x_dir, z_dir = PLANES[panel.plane]
    plane = bd.Plane(origin=tuple(panel.level * a for a in axis), x_dir=x_dir, z_dir=z_dir)
    solid = bd.extrude(plane * face(panel.outline, panel.holes), amount=panel.thickness, dir=z_dir)
    return labelled(posed(solid, panel.pose), prefix + panel.name, panel.color)


def box_solid(b: Box, prefix):
    size = [h - l for l, h in zip(b.lo, b.hi)]
    centre = [(l + h) / 2 for l, h in zip(b.lo, b.hi)]
    return labelled(posed(bd.Pos(*centre) * bd.Box(*size), b.pose), prefix + b.part, b.color)


def rod_solid(rod: Rod, label=None):
    a, b = rod.span
    c1, c2 = rod.centre
    origin = {"x": (a, c1, c2), "y": (c1, a, c2), "z": (c1, c2, a)}[rod.axis]
    direction = {"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}[rod.axis]
    solid = bd.Solid.make_cylinder(rod.d / 2, b - a, bd.Plane(origin=origin, z_dir=direction))
    return labelled(posed(solid, rod.pose), label or rod.name, rod.color)


def compound(children, label):
    return bd.Compound(children=children, label=label)
