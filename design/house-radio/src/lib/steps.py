"""Assembly steps for the IKEA-style booklet: which parts each step adds, and how to look at them."""
from __future__ import annotations

from fnmatch import fnmatch

from .house import build, label_of

FRONT_RIGHT = [0.8, 0.55, 1.5]
BACK_RIGHT = [0.75, 0.75, -1.25]
BACK = [-0.55, 0.45, -1.4]
BACK_INNER = [0.35, 0.35, 1.0]

# (number, title, new part patterns, camera, mode, hardware callouts as (joint id or item, count))
STEPS = [
    (1, "Glue the walls to the floor", ["wood_floor", "wood_left_wall", "wood_right_wall"], FRONT_RIGHT, "assembled", []),
    (2, "Glue on the front gable", ["wood_front_gable"], FRONT_RIGHT, "assembled", []),
    (3, "Corner blocks and the battery fence", ["wood_corner_block_*", "fastener_A_*_nut", "wood_battery_fence"], BACK_RIGHT,
     "assembled", [("M3 hex nut, glued", 4)]),
    (4, "Screen, buttons and speaker", ["e_lcd__*", "e_keypad__*", "e_speaker__*", "felt_*", "fastener_F_*", "fastener_G_*",
                                        "fastener_H_*"], BACK, "assembled", [("F", 4), ("G", 4), ("H", 4)]),
    (5, "Raspberry Pi on the left wall", ["e_pi__*", "fastener_I_*", "fastener_J_*"], BACK_RIGHT, "assembled", [("I", 4), ("J", 4)]),
    (6, "Small boards on the floor", ["e_amp__*", "e_adc__*", "e_divider__*", "fastener_K_*"], BACK_RIGHT, "assembled", [("K", 6)]),
    (7, "Switch on the back gable", ["wood_back_gable", "e_switch__*", "wood_switch_clamp", "fastener_L_*"], BACK_INNER,
     "bench", [("L", 2)]),
    (8, "Connect the wires", ["wire_*"], BACK_RIGHT, "assembled", [("jumper wires", 25)]),
    (9, "Power bank in, back gable on", ["e_battery__*", "e_power__*", "wood_back_gable", "e_switch__*", "wood_switch_clamp",
                                         "fastener_L_*", "fastener_A_*"], BACK, "assembled", [("A", 4)]),
    (10, "Fit the handle", ["handle_dowel", "fastener_E_*"], FRONT_RIGHT, "assembled", [("E", 2)]),
    (11, "Hinges on the walls", ["hinge_wall_leaf_*", "fastener_B_*"], FRONT_RIGHT, "assembled", [("B", 8)]),
    (12, "Roof halves: wedges, magnets, knobs, hinges", ["wood_roof_*", "wood_magnet_wedge_*", "magnet_*", "handle_knob_*",
                                                         "hinge_roof_leaf_*", "hinge_knuckle_*", "fastener_C_*", "fastener_D_*"],
     FRONT_RIGHT, "roof_open", [("C", 8), ("D", 2), ("magnet Ø10 × 3", 4)]),
    (13, "Close the roof: the magnets click", ["wood_roof_*", "handle_knob_*"], FRONT_RIGHT, "assembled", []),
]
CHARGING = (0, "Charging", ["e_power__*", "e_battery__*"], [0.5, 1.0, 0.9], "roof_open", [])


def matches(label, patterns):
    return any(fnmatch(label, p) for p in patterns)


def visible(number):
    """Labels added up to and including `number`; step 7 is a bench sub-assembly of the back gable."""
    seen = []
    for n, _, new, _, mode, _ in STEPS:
        if n > number:
            break
        if mode == "bench" and n != number:
            continue
        seen += new
    return seen


def step_parts(number):
    if number == 0:
        n, title, new, camera, mode, hardware = CHARGING
        patterns = ["*"]
    else:
        n, title, new, camera, mode, hardware = STEPS[number - 1]
        patterns = new if mode == "bench" else visible(number)
    shapes = build("roof_open" if mode == "roof_open" else "assembled", wires=any(p.startswith("wire") for p in patterns))
    keep = {k: [s for s in v if matches(label_of(s), patterns)] for k, v in shapes.items()}
    return keep, new, camera


def cad_step(number):
    from woodkit.cad import box_solid, compound, panel_solid, rod_solid
    parts, _, _ = step_parts(number)
    solids = [panel_solid(s) for s in parts["panels"]]
    solids += [box_solid(b, "e_" + b.module + "__" if b.module not in ("hinge", "wood") else "") for b in parts["boxes"]]
    solids += [rod_solid(r) for r in parts["rods"]]
    return compound(solids, f"Moomin_step_{number}")
