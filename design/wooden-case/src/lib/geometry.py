"""Millimetre geometry. Front drawing coordinates: x right, y down, z inward."""
from __future__ import annotations

import json
import math
from pathlib import Path

from cadgen import build123d as bd, srgb


ROOT = Path(__file__).resolve().parents[2]


def parameters():
    return json.loads((ROOT / "parameters.json").read_text())


def xyz(point):
    x, y, z = point
    return (x, -y, z)


def box(origin, size, label, color):
    x, y, z = origin
    w, h, d = size
    shape = bd.Pos(x + w / 2, -y - h / 2, z + d / 2) * bd.Box(w, h, d)
    shape.label, shape.color = label, srgb(color)
    return shape


def disc(x, y, z, radius, depth, label, color):
    shape = bd.Pos(x, -y, z + depth / 2) * bd.Cylinder(radius, depth)
    shape.label, shape.color = label, srgb(color)
    return shape


def rect(x, y, width, height, radius=0):
    outline = bd.RectangleRounded(width, height, radius) if radius else bd.Rectangle(width, height)
    return bd.Pos(x + width / 2, -y - height / 2) * outline


def circle(x, y, radius):
    return bd.Pos(x, -y) * bd.Circle(radius)


def keypad_window(p):
    # One continuous window; leave plywood over all four PCB corners.
    x, y, _ = p["keypad"]["origin"]
    cx, cy = x + 15, y + 32.5
    points = [(-9, -31.5), (9, -31.5), (9, -25), (14, -25),
              (14, 25), (9, 25), (9, 31.5), (-9, 31.5),
              (-9, 25), (-14, 25), (-14, -25), (-9, -25)]
    return bd.Polygon(*[(cx + dx, -cy - dy) for dx, dy in points], align=None)


def grille(p):
    cx, cy = p["speaker"]["centre"]
    return [(cx + dx, cy + dy, 4) for dx in range(-12, 13, 6)
            for dy in range(-12, 13, 6) if math.hypot(dx, dy) <= 13.5]


def panel_specs(p):
    c = p["case"]
    w, h, d, t = (c[k] for k in ("width", "height", "depth", "plywood"))
    return {"front": (w, h), "rear": (w, h), "left": (d - 2 * t, h - 2 * t),
            "right": (d - 2 * t, h - 2 * t), "top": (w, d - 2 * t),
            "bottom": (w, d - 2 * t), "switch_cover": tuple(p["switch_cover"]["size"]),
            "switch_clamp": (22, 64), "block_pad": (12, 12)}


def panel_holes(name, p):
    t = p["case"]["plywood"]
    if name == "front":
        return [(x, y, 3) for x, y in p["lcd"]["mount_holes"]] + grille(p)
    if name == "rear":
        return [(x, y, 3) for x, y in p["pi"]["mount_holes"]] + \
               [(x, y, 3.5) for x, y in p["rear_screws"]] + \
               [(x, y, 4) for x in (30, 40, 50, 60, 70) for y in (146, 154)]
    if name in ("left", "right"):
        holes = [(26, y - t, 4) for y in (74, 86, 98, 110, 122)]
        if name == "left":
            holes += [(26, 132 - t, 3.5), (26, 188 - t, 3.5)]
        return holes
    if name in ("top", "bottom"):
        return [(x, 26, 4) for x in (30, 45, 60, 90, 105, 120)]
    if name == "switch_cover":
        return [(x, y, 3.5) for x, y in p["switch_cover"]["screw_holes"]]
    if name == "switch_clamp":
        return [(11, 4, 3.5), (11, 60, 3.5)]
    if name == "block_pad":
        return [(6, 6, 3.5)]
    return []


def panel_profile(name, p):
    w, h = panel_specs(p)[name]
    shape = rect(0, 0, w, h)
    if name == "front":
        shape -= rect(*p["lcd"]["window"], radius=2)
        shape -= keypad_window(p)
    elif name == "left":
        # General clearance window, covered by a screwed plywood plate.
        # Housing fit is provisional until the selected cable is measured.
        shape -= rect(13, 132, 26, 44)
    elif name == "switch_cover":
        # Model includes the proposed actuator opening; print marks it provisional.
        shape -= circle(20, 36, p["switch"]["actuator_diameter"] / 2)
    for x, y, diameter in panel_holes(name, p):
        shape -= circle(x, y, diameter / 2)
    return shape


def panel_shape(name, p):
    shape = bd.extrude(panel_profile(name, p), amount=p["case"]["plywood"])
    shape.label, shape.color = "wood_" + name, srgb("#cfab76")
    return shape


def place_panel(shape, name, p, explode=0):
    c = p["case"]
    w, h, d, t = (c[k] for k in ("width", "height", "depth", "plywood"))
    if name == "front":
        return shape.moved(bd.Location((0, 0, -explode)))
    if name == "rear":
        return shape.moved(bd.Location((0, 0, d - t + explode)))
    if name in ("left", "right", "switch_cover", "switch_clamp"):
        # Local flat x becomes inward depth; local y stays height; extrusion is x.
        rotated = shape.rotate(bd.Axis.Y, -90)
        if name == "left":
            return rotated.moved(bd.Location((t, -t, t)))
        if name == "right":
            return rotated.moved(bd.Location((w, -t, t)))
        if name == "switch_clamp":
            return rotated.moved(bd.Location((24, -128, 21)))
        y, z = p["switch_cover"]["origin_yz"]
        return rotated.moved(bd.Location((0, -y, z)))
    # Local flat y becomes depth; extrusion becomes negative global y.
    rotated = shape.rotate(bd.Axis.X, -90)
    return rotated.moved(bd.Location((0, -t if name == "top" else -h, t)))


def pcb(p, name, color, z_shift=0):
    origin = list(p[name]["origin"])
    origin[2] += z_shift
    size = p[name]["size"][:2] + [1.6]
    shape = box(origin, size, name + "_pcb", color)
    return shape


def pin_points(p):
    x, y, z = p["pi"]["origin"]
    points = {}
    for pin in range(1, 41):
        # Standard 2.54 mm header pitch; envelope origin is schematic.
        row = 4.77 if pin % 2 else 2.23
        points["P" + str(pin)] = [x + 56 - row, y + 7.5 + ((pin - 1) // 2) * 2.54, z - 18]
    x, y, z = p["lcd"]["origin"]
    for i, name in enumerate(("LVCC", "LGND", "LDIN", "LCLK", "LCS", "LDC", "LRST", "LBL")):
        points[name] = [x + 26.39 - i * 2.54, y + 2.4, z + 11]
    x, y, z = p["amp"]["origin"]
    for i, name in enumerate(("MLRC", "MBCLK", "MDIN", "MGAIN", "MSD", "MGND", "MVIN")):
        points[name] = [x + 2.38 + i * 2.54, y + 13, z + 10]
    points["M-"] = [x + 7, y + 2, z + 5]
    points["M+"] = [x + 13, y + 2, z + 5]
    x, y, z = p["adc"]["origin"]
    for i, name in enumerate(("AVDD", "AGND", "ASCL", "ASDA", "AADDR", "AALERT", "AA0", "AA1", "AA2", "AA3")):
        points[name] = [x + 7.5, y + 3.07 + i * 2.54, z + 7]
    points["GND_JOIN"] = [68, 186, 12]
    x, y, z = p["keypad"]["origin"]
    for i, name in enumerate(("KOUT", "KVCC", "KGND")):
        points[name] = [x + 36, y + 46 + i * 2.54, z + 3]
    points.update({"RIN": [56, 180, 12], "J": [66, 180, 12], "RGND": [66, 190, 12],
                   "S+": [95, 31, 18], "S-": [95, 35, 18],
                   "POWER": [107.5, 82, 16], "USB": [28, 65.6, 43],
                   "SW_IN": [9, 140, 32], "SW_OUT": [9, 180, 32]})
    return points


def wire_specs(p):
    # Keep this atlas identical to the working program's documented electrical nets.
    project_root = ROOT.parents[1]
    atlas = json.loads((project_root / "hardware-visualisation/src/data/setup.json").read_text())
    points = pin_points(p)
    wires = []
    for index, entry in enumerate(atlas["wires"]):
        start, end = points[entry["from"]], points[entry["to"]]
        lane = 26 + (index % 5) * .65
        if entry["group"] == "Power":
            route = [start, [107.5, 60, 16], [107.5, 60, 25], [87, 78, 25],
                     [16, 78, 25], [16, 136, 25], points["SW_IN"],
                     points["SW_OUT"], [16, 190, 40], [16, 82, 40], [16, 65.6, 43], end]
        elif entry["from"].startswith("P"):
            lane_x = 69.1 + (index % 4) * .4
            route = [start, [start[0], start[1], lane],
                     [lane_x, start[1], lane], [lane_x, end[1], lane],
                     [end[0], end[1], lane], end]
        elif entry["from"] in ("M+", "M-"):
            route = [start, [start[0], 78, 18], [87, 78, 18], [87, end[1], 18], end]
        else:
            route = [start, [start[0], start[1], 19], [end[0], start[1], 19],
                     [end[0], end[1], 19], end]
        # Delete identical points before estimating cable length or constructing solids.
        route = [point for i, point in enumerate(route) if i == 0 or point != route[i - 1]]
        length = sum(math.dist(a, b) for a, b in zip(route, route[1:]))
        wires.append(dict(entry, route=route, route_length_mm=round(length, 1),
                          suggested_length_mm=math.ceil((length + (100 if entry["from"].startswith("P") else 30)) / 50) * 50))
    return wires


def wire_shape(wire, p, explode=0):
    route = []
    for i, point in enumerate(wire["route"]):
        x, y, z = point
        if explode:
            if i == 0 and wire["from"].startswith("P"):
                z += explode
            elif i == len(wire["route"]) - 1 and wire["to"] == "USB":
                z += explode
            elif i == len(wire["route"]) - 1 or i == 0:
                z -= explode
        route.append(xyz([x, y, z]))
    radius = 1.6 if wire["group"] == "Power" else .45
    solids = []
    for a, b in zip(route, route[1:]):
        length = math.dist(a, b)
        if length < 1e-6:
            continue
        axis = tuple(v - u for u, v in zip(a, b))
        body = bd.Solid.make_cylinder(radius, length, bd.Plane(origin=a, z_dir=axis))
        body.label, body.color = wire["id"] + "_segment", srgb(wire["color"])
        solids.append(body)
    return bd.Compound(children=solids, label="wire_" + wire["id"])


def electronic_parts(p, explode=0):
    parts = []
    for name, color in (("pi", "#287557"), ("keypad", "#242933"),
                        ("lcd", "#255988"), ("amp", "#69418b"),
                        ("adc", "#69418b"), ("divider", "#b78046")):
        shift = explode if name == "pi" else -explode
        if name == "lcd":
            origin = list(p[name]["origin"])
            origin[2] += 4 - explode
            part = box(origin, p[name]["size"][:2] + [1.6], "lcd_pcb", color)
            for x, y in p["lcd"]["mount_holes"]:
                part -= disc(x, y, origin[2] - 1, 1.5, 4, "tool", color)
            part.label, part.color = "lcd_pcb", srgb(color)
            parts.append(part)
        else:
            part = pcb(p, name, color, shift)
            if name == "pi":
                for x, y in p[name]["mount_holes"]:
                    part -= disc(x, y, p[name]["origin"][2] + shift - 1, 1.375, 4, "tool", color)
                part.label, part.color = "pi_pcb", srgb(color)
            parts.append(part)
    x, y, z = p["battery"]["origin"]
    parts.append(box([x, y, z - explode], p["battery"]["size"], "Baseus_5000mAh_user_envelope", "#f1f0eb"))
    parts.append(box([x + 10, y + 10, 6 - explode], [49, 85, 3], "battery_foam_and_Velcro", "#50575a"))
    for band_y in (104, 158):
        parts.append(box([x, band_y, z + 14 - explode], [69, 12, 1], "battery_retention_band", "#59646a"))
    # User supplied overall speaker size; internal profile is an illustrative envelope.
    x, y, z = p["speaker"]["origin"]
    parts.append(box([x, y, z - explode], [40, 40, 1.2], "speaker_square_frame", "#292d33"))
    parts.append(disc(x + 20, y + 20, z + 1.2 - explode, 18, 8.8, "speaker_cone_body", "#343b43"))
    parts.append(disc(x + 20, y + 20, z + 10 - explode, 12, 10, "speaker_magnet", "#1c2026"))
    # Actual display area; 1.8 mm along-board offset is inferred, not a machining datum.
    parts.append(box([26.7, 28.4, 6 - explode], [30.6, 40.8, 4], "LCD_active_area", "#f2f0de"))
    m_points = [(-10, -10), (-5, -10), (0, 0), (5, -10), (10, -10),
                (10, 10), (6, 10), (6, -3), (0, 6), (-6, -3), (-6, 10), (-10, 10)]
    letter = bd.extrude(bd.Polygon(*[(42 + dx, -49 - dy) for dx, dy in m_points], align=None), amount=.05)
    letter = letter.moved(bd.Location((0, 0, 5.95 - explode)))
    letter.label, letter.color = "letter_M_on_screen", srgb("#193951")
    parts.append(letter)
    for i, (x, y) in enumerate(p["keypad"]["button_centres"]):
        parts.append(box([x - 4, y - 4, 3 - explode], [8, 8, 4], f"key_switch_{i + 1}", "#48505a"))
        parts.append(disc(x, y, 1 - explode, 6, 2, f"yellow_button_{i + 1}", "#f0c52d"))
    # Pi connectors, in the rotated 85 x 56 PCB envelope; no side port cutouts are needed.
    rear = explode
    parts.append(box([32.5, 116.5, 32.4 + rear], [15, 25.5, 16], "Pi_Ethernet_envelope", "#b2b8be"))
    parts.append(box([49, 116.5, 32.4 + rear], [13, 25.5, 16], "Pi_USB_stack_envelope", "#b2b8be"))
    parts.append(box([66, 116.5, 34.9 + rear], [15, 25.5, 13.5], "Pi_USB_stack_2_envelope", "#b2b8be"))
    parts.append(box([78, 60, 39.9 + rear], [5.1, 50.8, 8.5], "Pi_GPIO_header_envelope", "#24282e"))
    parts.append(box([76.5, 59, 28.9 + rear], [8, 53, 11], "GPIO_jumper_socket_clearance", "#48505a"))
    parts.append(box([28, 77, 42.9 + rear], [12, 15, 5.5], "Pi_HDMI_envelope", "#aab2b9"))
    parts.append(box([28, 61.8, 42.9 + rear], [6, 8, 5.5], "Pi_microUSB_socket", "#aab2b9"))
    parts.append(box([10, 61, 38.5 + rear], [18, 10, 9], "microUSB_right_angle_plug_keepout", "#22272d"))
    parts.append(box([100.5, 52, 10 - explode], [14, 30, 12], "Baseus_USB_C_plug_keepout", "#22272d"))
    # Board headers use the photographed label order. Simplified bodies retain measured board sizes.
    parts.append(box([51.5, 99, 11.6 - explode], [19, 4, 8.4], "amp_7_pin_header", "#d7b82a"))
    parts.append(box([56, 89, 11.6 - explode], [10, 5, 5], "amp_speaker_terminal", "#73b98d"))
    parts.append(box([65, 136.5, 10.6 - explode], [2.5, 25.4, 5.4], "adc_10_pin_header", "#282c33"))
    parts.append(box([52, 154.5, 7 - explode], [6, 10, 4], "keypad_right_angle_header", "#242933"))
    for y in (179, 186):
        parts.append(box([57, y, 10.6 - explode], [7, 2, 2], "10k_resistor", "#bead74"))
    parts.append(box(p["switch"]["origin"], p["switch"]["size"], "inline_USB_switch_PROVISIONAL", "#30373e"))
    # Actuator faces outward through the side cover; its size must be measured.
    actuator = bd.Solid.make_cylinder(7, 2, bd.Plane(origin=(-2, -160, 32), z_dir=(1, 0, 0)))
    actuator.label, actuator.color = "switch_actuator_PROVISIONAL", srgb("#242a30")
    parts.append(actuator)
    return parts


def supports(p, explode=0):
    parts = []
    d, t = p["case"]["depth"], p["case"]["plywood"]
    for i, y in enumerate((132, 188), 1):
        # Prevent the clamp screws bending the plywood across the 12 mm void.
        plane = bd.Plane(origin=(6, -y, 32), z_dir=(1, 0, 0))
        spacer = bd.Solid.make_cylinder(3, 12, plane)
        spacer -= bd.Solid.make_cylinder(1.75, 12, plane)
        spacer.label, spacer.color = f"USB_switch_clamp_spacer_{i}", srgb("#e0ded7")
        parts.append(spacer)
    for i, (x, y) in enumerate(p["rear_screws"]):
        block = box([x - 6, y - 6, d - t - 12], [12, 12, 12], f"rear_screw_block_{i + 1}", "#ae8e60")
        block -= disc(x, y, d - t - 13, 1.75, 14, "tool", "#ae8e60")
        block.label, block.color = f"rear_screw_block_{i + 1}", srgb("#ae8e60")
        parts.append(block)
    for i, (x, y) in enumerate(p["pi"]["mount_holes"]):
        spacer = disc(x, y, 50 + explode, 2.5, 8, f"Pi_M2_5_spacer_{i + 1}", "#e0ded7")
        spacer -= disc(x, y, 49 + explode, 1.25, 10, "tool", "#e0ded7")
        spacer.label, spacer.color = f"Pi_M2_5_spacer_{i + 1}", srgb("#e0ded7")
        parts.append(spacer)
    for i, (x, y) in enumerate(p["lcd"]["mount_holes"]):
        parts.append(disc(x, y, 6 - explode, 2.5, 4, f"LCD_spacer_{i + 1}", "#e0ded7"))
    return parts


def assembly(p, explode=0, open_case=False, wires=True):
    names = [name for name in panel_specs(p) if name != "block_pad"]
    if open_case:
        names.remove("rear")
        names.remove("right")
    parts = [place_panel(panel_shape(name, p), name, p, explode) for name in names]
    parts += supports(p, explode) + electronic_parts(p, explode)
    if wires:
        parts += [wire_shape(wire, p, explode) for wire in wire_specs(p)]
    # Export with the front facing +Z: x right, y up, depth into the box is -Z.
    # Reflect each native occurrence so names and colors remain selectable.
    def front_facing(part):
        if part.children:
            return bd.Compound(children=[front_facing(child) for child in part.children],
                               label=part.label, color=part.color)
        return part.mirror(bd.Plane.XY)
    parts = [front_facing(part) for part in parts]
    return bd.Compound(children=parts, label="Moomin_wooden_case")


def sheet_layout(p):
    # Positions are A4 millimetres from its top-left; saw space is 5 mm or more.
    return [
        [("front", 30, 30, False)],
        [("rear", 30, 30, False)],
        [("left", 10, 30, False), ("right", 67, 30, False),
         ("bottom", 124, 30, True), ("top", 10, 225, False)],
        [("switch_cover", 20, 25, False), ("switch_clamp", 75, 25, False)] +
        [("block_pad", 120 + column * 17, 25 + row * 17, False)
         for row in range(4) for column in range(2)],
    ]


def nested_profiles(p, page):
    parts = []
    for name, x, y, rotated in sheet_layout(p)[page]:
        profile = panel_profile(name, p)
        if rotated:
            # 150 x 52 -> 52 x 150, while keeping its top-left placement fixed.
            width, height = panel_specs(p)[name]
            profile = profile.rotate(bd.Axis.Z, -90).moved(bd.Location((height, 0, 0)))
        profile = profile.moved(bd.Location((x, 297 - y, 0)))
        parts.append(profile)
    return bd.Compound(children=parts)
