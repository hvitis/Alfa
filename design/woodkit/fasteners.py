"""Choose screw and bolt lengths from the parts they clamp, and total a shopping list.

Pure Python. Machine-screw data follow ISO 4032 nuts, ISO 7089 washers, ISO 273
medium clearance holes and ISO 10642 / ISO 7046 countersunk heads. Countersunk
lengths are overall lengths, so the head sits inside the first layer.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

# d, pitch, nut height, washer thickness, washer OD, clearance hole, countersunk head Ø, head height
METRIC = {
    "M2":   dict(d=2.0, pitch=.40, nut=1.6, washer=.3, washer_od=5.0, clearance=2.4, head=3.8, head_k=1.2, acorn_depth=3.0),
    "M2.5": dict(d=2.5, pitch=.45, nut=2.0, washer=.5, washer_od=6.0, clearance=2.9, head=4.7, head_k=1.5, acorn_depth=3.5),
    "M3":   dict(d=3.0, pitch=.50, nut=2.4, washer=.5, washer_od=7.0, clearance=3.4, head=5.5, head_k=1.7, acorn_depth=4.0),
    "M4":   dict(d=4.0, pitch=.70, nut=3.2, washer=.8, washer_od=9.0, clearance=4.5, head=7.5, head_k=2.3, acorn_depth=5.5),
}
MACHINE_LENGTHS = {
    "M2": [4, 5, 6, 8, 10, 12, 16, 20],
    "M2.5": [4, 5, 6, 8, 10, 12, 16, 20, 25],
    "M3": [4, 5, 6, 8, 10, 12, 16, 20, 25, 30, 35, 40],
    "M4": [6, 8, 10, 12, 16, 20, 25, 30, 35, 40, 50],
}
# Wood screws (chipboard type): head Ø, pilot in plywood/softwood, pilot in hardwood/end grain, lengths
WOOD = {
    3.0: dict(head=6.0, pilot=2.0, pilot_hard=2.2, lengths=[10, 12, 16, 20, 25, 30]),
    3.5: dict(head=7.0, pilot=2.0, pilot_hard=2.5, lengths=[12, 16, 20, 25, 30, 35, 40]),
    4.0: dict(head=8.0, pilot=2.5, pilot_hard=3.0, lengths=[16, 20, 25, 30, 35, 40, 45, 50]),
}


@dataclass
class Layer:
    name: str
    thickness: float


@dataclass
class Joint:
    """One fastening repeated `count` times.

    kind:
      bolt      machine screw through `layers`, washer and hex nut on the far side
      acorn     machine screw through `layers`, washer and acorn (dome) nut
      glued_nut machine screw through `layers` into a nut glued on the last layer
      standoff  machine screw through `layers` into a female standoff (`receiving` = thread depth)
      wood      wood screw through `layers` into `receiving` mm of wood
    """
    id: str
    title: str
    kind: str
    thread: str | float
    layers: list
    count: int
    head: str = "countersunk"
    receiving: float = 0
    receiving_name: str = ""
    hard: bool = False
    washer: bool = True
    note: str = ""
    extras: list = field(default_factory=list)    # (item, quantity per joint)
    material: str = ""                            # e.g. "nylon"; default steel


def designation(kind, thread, length, head, material=""):
    if kind == "wood":
        return f"wood screw {thread:g} × {length} {'countersunk' if head == 'countersunk' else 'pan head'}"
    standard = "ISO 10642" if head == "countersunk" else "ISO 7045"
    made = f" {material}" if material else ""
    return f"{thread} × {length}{made} {'countersunk' if head == 'countersunk' else 'pan head'} ({standard})"


def size(joint: Joint) -> dict:
    grip = round(sum(layer.thickness for layer in joint.layers), 2)
    warnings = []
    if joint.kind == "wood":
        spec = WOOD[float(joint.thread)]
        d = float(joint.thread)
        longest = grip + joint.receiving - 1.5            # stop 1.5 mm short of breaking through
        shortest = grip + max(3 * d, 6)                     # light duty: at least 3 d of thread in the wood
        ideal = grip + min(6 * d, joint.receiving - 1.5)
        fits = [length for length in spec["lengths"] if shortest <= length <= longest]
        if not fits:
            raise ValueError(f"{joint.id}: no standard {d:g} mm wood screw between {shortest:.1f} and {longest:.1f} mm")
        length = min(fits, key=lambda length: (abs(length - ideal), -length))
        drill = {"clearance": round(d + .5, 1), "pilot": spec["pilot_hard" if joint.hard else "pilot"],
                 "countersink": spec["head"] + .5 if joint.head == "countersunk" else None}
        result = dict(length=length, grip=grip, penetration=round(length - grip, 1),
                      spare_depth=round(joint.receiving - (length - grip), 1))
    else:
        m = METRIC[joint.thread]
        washer = m["washer"] if joint.washer else 0
        if joint.kind in ("bolt", "glued_nut"):
            shortest = grip + washer + m["nut"] + m["pitch"]        # one thread past the nut
            longest = shortest + 4.5                                  # keep tails short inside the case
        elif joint.kind == "acorn":
            shortest = grip + washer + .8 * m["d"]                    # 0.8 d of thread engaged
            longest = grip + washer + m["acorn_depth"]                # must not bottom in the dome
        elif joint.kind == "standoff":
            shortest = grip + 1.2 * m["d"]
            longest = grip + joint.receiving - .3
        else:
            raise ValueError(joint.kind)
        fits = [length for length in MACHINE_LENGTHS[joint.thread] if shortest - 1e-6 <= length <= longest + 1e-6]
        if not fits:
            raise ValueError(f"{joint.id}: no standard {joint.thread} length between {shortest:.1f} and {longest:.1f} mm")
        length = fits[0]
        drill = {"clearance": m["clearance"], "pilot": None,
                 "countersink": m["head"] + .5 if joint.head == "countersunk" else None}
        if joint.head == "countersunk" and joint.layers and joint.layers[0].thickness < m["head_k"] + .3:
            warnings.append(f"first layer thinner than the {m['head_k']} mm head; it will stand proud")
        tail = length - grip - washer - (m["nut"] if joint.kind in ("bolt", "glued_nut") else 0)
        result = dict(length=length, grip=grip, tail=round(tail, 1))
    result.update(id=joint.id, title=joint.title, kind=joint.kind, count=joint.count,
                  designation=designation(joint.kind, joint.thread, result["length"], joint.head, joint.material),
                  drill=drill, warnings=warnings, note=joint.note,
                  stack=" + ".join(f"{layer.name} {layer.thickness:g}" for layer in joint.layers) +
                        (f" → {joint.receiving_name} {joint.receiving:g}" if joint.receiving else ""))
    return result


def companions(joint: Joint):
    """Nuts, washers and other items each joint consumes, per fastener."""
    items = []
    made = f" {joint.material}" if joint.material else ""
    if joint.kind in ("bolt", "acorn", "glued_nut"):
        if joint.washer:
            items.append(f"{joint.thread}{made} washer (ISO 7089)")
        items.append({"bolt": f"{joint.thread}{made} hex nut (ISO 4032)", "glued_nut": f"{joint.thread}{made} hex nut (ISO 4032)",
                      "acorn": f"{joint.thread}{made} acorn nut (DIN 1587)"}[joint.kind])
    return items + [item for item, _ in joint.extras]


def spare(quantity):
    # Small parts get lost: +10 %, at least one extra.
    return quantity + max(1, math.ceil(quantity * .1))


def shopping_list(joints, other_items=()):
    """[(item, needed, buy)] for fasteners, their nuts and washers, plus `other_items` (item, qty)."""
    totals = {}
    for joint in joints:
        sized = size(joint)
        totals[sized["designation"]] = totals.get(sized["designation"], 0) + joint.count
        extra = dict(joint.extras)
        for item in companions(joint):
            totals[item] = totals.get(item, 0) + joint.count * extra.get(item, 1)
    rows = [(item, n, spare(n)) for item, n in totals.items()]
    rows += [(item, n, n) for item, n in other_items]
    return sorted(rows, key=lambda row: row[0])
