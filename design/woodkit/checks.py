"""Checks on saved CAD files, with a JSON report. Import inside the cadgen environment."""
from __future__ import annotations

import fnmatch
import json
import math
from itertools import combinations

from cadgen.geometry import overlap_volume


class Report:
    def __init__(self, units="mm", limitations=()):
        self.data = {"units": units, "checks": [], "limitations": list(limitations), "facts": {}}

    def check(self, title, condition, detail=None):
        self.data["checks"].append({"check": title, "pass": bool(condition), "detail": detail})
        if not condition:
            print("FAIL:", title, detail)
        return bool(condition)

    def fact(self, key, value):
        self.data["facts"][key] = value

    @property
    def passed(self):
        return all(c["pass"] for c in self.data["checks"])

    def write(self, path):
        self.data["passed"] = self.passed
        path.write_text(json.dumps(self.data, indent=2) + "\n")
        n = len(self.data["checks"])
        print(f"{sum(c['pass'] for c in self.data['checks'])}/{n} checks passed")
        return self.passed


def boxes_touch(a, b, tol=1e-5):
    ba, bb = a.bounding_box(optimal=False), b.bounding_box(optimal=False)
    return all(min(ahi, bhi) - max(alo, blo) > tol for alo, ahi, blo, bhi in zip(ba.min, ba.max, bb.min, bb.max))


def overlap(a, b):
    if not boxes_touch(a, b):
        return 0.0
    return sum(overlap_volume(sa, sb) for sa in a.solids() for sb in b.solids())


def allowed(name_a, name_b, allow):
    """`allow` is a list of (pattern, pattern) pairs that may overlap by design."""
    return any((fnmatch.fnmatch(name_a, p) and fnmatch.fnmatch(name_b, q)) or
               (fnmatch.fnmatch(name_a, q) and fnmatch.fnmatch(name_b, p)) for p, q in allow)


def interference(parts_a, parts_b=None, allow=(), limit=.01, same=lambda a, b: False):
    """Overlapping pairs above `limit` mm3. With one list, every pair inside it."""
    pairs = combinations(parts_a, 2) if parts_b is None else ((a, b) for a in parts_a for b in parts_b)
    hits = []
    for (na, a), (nb, b) in pairs:
        if na == nb or same(na, nb) or allowed(na, nb, allow):
            continue
        volume = overlap(a, b)
        if volume > limit:
            hits.append([na, nb, round(volume, 3)])
    return hits


def round_holes(shape, max_d=40):
    """Centres and diameters of full circular edges, projected on the panel's face."""
    circles = {}
    for edge in shape.edges():
        if not edge.is_closed:
            continue
        try:
            r, c = edge.radius, edge.arc_center
        except ValueError:
            continue
        if 2 * r <= max_d:
            circles[(round(c.X, 2), round(c.Y, 2), round(c.Z, 2))] = 2 * r
    size = tuple(shape.bounding_box().size)
    thin = min(range(3), key=lambda i: size[i])
    return sorted({(round(c[a], 1), round(c[b], 1), round(d, 1))
                   for c, d in circles.items() for a, b in [[i for i in range(3) if i != thin]]})


def min_web(holes):
    worst = math.inf
    for (x0, y0, d0), (x1, y1, d1) in combinations(holes, 2):
        worst = min(worst, math.dist((x0, y0), (x1, y1)) - (d0 + d1) / 2)
    return worst


def mass_and_centre(items):
    """items: (shape, density g/cm3) or (point, grams). Returns grams and centre of mass."""
    total, moment = 0.0, [0.0, 0.0, 0.0]
    for item, value in items:
        if isinstance(item, (tuple, list)):
            grams, centre = value, item
        else:
            grams = item.volume / 1000 * value
            c = item.center()
            centre = (c.X, c.Y, c.Z)
        total += grams
        moment = [m + grams * v for m, v in zip(moment, centre)]
    return total, [m / total for m in moment]


def tip_angles(centre, footprint):
    """Degrees of tilt before tipping over each edge of a rectangular footprint (x0, x1, z0, z1) on y = 0."""
    x, y, z = centre
    x0, x1, z0, z1 = footprint
    return {"left": math.degrees(math.atan2(x - x0, y)), "right": math.degrees(math.atan2(x1 - x, y)),
            "back": math.degrees(math.atan2(z - z0, y)), "front": math.degrees(math.atan2(z1 - z, y))}
