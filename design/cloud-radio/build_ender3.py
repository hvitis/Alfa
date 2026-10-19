"""Generate and verify the Ender 3 modular split edition of the Alfa Cloud Radio.

Splits the enclosure into 4 parts at Y = 58.0 mm so that all components fit
flat (outside face on bed) within the 220 x 220 mm build plate of a Creality
Ender 3 printer:
  1. front_top:    ~215 x 187 mm (fits 220 x 220 mm)
  2. front_bottom: ~213 x 58 mm  (fits 220 x 220 mm)
  3. rear_top:     ~215 x 187 mm (fits 220 x 220 mm)
  4. rear_bottom:  ~213 x 58 mm  (fits 220 x 220 mm)

The split includes:
  - Stepped interlocking alignment lip (tongue & groove) with 0.35 mm PETG fit clearance.
  - Internal M3 screw bosses for rigid assembly of the top and bottom halves.
  - Once assembled, the front and rear shells retain the original screwless
    closure (bottom pivot tongues and 5 releasable perimeter snaps).
"""
from __future__ import annotations

import argparse
from collections import Counter
import json
import math
from pathlib import Path
import shutil
import struct
import tempfile
import zipfile
from xml.etree import ElementTree as ET

from cadgen import build123d as b

ROOT = Path(__file__).resolve().parent
import sys
sys.path.insert(0, str(ROOT))
import build as cb

OUTPUT = ROOT / "generated" / "ender3"
ENDER3_BED = [220, 220]
Y_SPLIT = 58.0
LIP_HEIGHT = 3.5
LIP_THICKNESS = 1.4
FIT_CLEARANCE = 0.35  # Calibrated for PETG thermal expansion and layer seams

COLORS = {
    "front_top": "#86bfea",
    "front_bottom": "#6ea8d6",
    "rear_top": "#70acd9",
    "rear_bottom": "#5c96c4",
}


def box(x, y, z, w, h, d):
    return b.Pos(x, y, z) * b.Box(w, h, d, align=(b.Align.MIN,) * 3)


def cylinder(x, y, z, r, height):
    return b.Pos(x, y, z) * b.Cylinder(r, height, align=(b.Align.CENTER, b.Align.CENTER, b.Align.MIN))


def cylinder_y(x, y, z, r, height):
    return b.Pos(x, y, z) * b.Rot(-90, 0, 0) * b.Cylinder(r, height, align=(b.Align.CENTER, b.Align.CENTER, b.Align.MIN))


def make_ender3_split(p):
    """Generate the 4 modular split parts for Ender 3."""
    parts, electronics, extras, outer, features = cb.make(p)
    front, rear = parts["front"], parts["rear"]
    t = p["case"]["wall"]
    split_z = p["case"]["split"]
    depth = p["case"]["depth"]

    # Cut base geometry at Y_SPLIT
    cutter_lower = b.Pos(-150, -10, -10) * b.Box(300, Y_SPLIT + 10, depth + 20, align=(b.Align.MIN, b.Align.MIN, b.Align.MIN))
    cutter_upper = b.Pos(-150, Y_SPLIT, -10) * b.Box(300, 260, depth + 20, align=(b.Align.MIN, b.Align.MIN, b.Align.MIN))

    f_bottom = front & cutter_lower
    f_top = front & cutter_upper
    r_bottom = rear & cutter_lower
    r_top = rear & cutter_upper

    # --- Interlocking Lip (Tongue & Groove) ---
    outer_wire = cb.cloud_profile(p["case"]["height_extension"])
    
    # Lower tongue: sits on inner half of the wall, extending upward from Y_SPLIT by LIP_HEIGHT
    tongue_2d = b.offset(outer_wire, amount=-(t - LIP_THICKNESS)) - b.offset(outer_wire, amount=-t)
    
    # Upper groove: pocket in top half extending from Y_SPLIT by (LIP_HEIGHT + 0.3)
    groove_2d = b.offset(outer_wire, amount=-(t - LIP_THICKNESS - FIT_CLEARANCE)) - b.offset(outer_wire, amount=-(t + 0.8))

    # Front tongue & groove (extrude in Z from 0 to split_z)
    # Leave 3 mm margin near the split seam to not interfere with perimeter snaps/tongues
    f_tongue = b.Pos(0, Y_SPLIT, 2.0) * b.Rot(-90, 0, 0) * b.extrude(tongue_2d, amount=LIP_HEIGHT)
    f_tongue = f_tongue & box(-115, Y_SPLIT - 0.1, 2.0, 230, LIP_HEIGHT + 0.2, split_z - 3.5)
    f_bottom = f_bottom + f_tongue

    f_groove = b.Pos(0, Y_SPLIT - 0.1, 1.5) * b.Rot(-90, 0, 0) * b.extrude(groove_2d, amount=LIP_HEIGHT + 0.4)
    f_groove = f_groove & box(-115, Y_SPLIT - 0.2, 1.5, 230, LIP_HEIGHT + 0.6, split_z - 3.0)
    f_top = f_top - f_groove

    # Rear tongue & groove (extrude in Z from split_z + gap to depth)
    r_tongue = b.Pos(0, Y_SPLIT, split_z + 1.0) * b.Rot(-90, 0, 0) * b.extrude(tongue_2d, amount=LIP_HEIGHT)
    r_tongue = r_tongue & box(-115, Y_SPLIT - 0.1, split_z + 1.0, 230, LIP_HEIGHT + 0.2, depth - split_z - 3.0)
    r_bottom = r_bottom + r_tongue

    r_groove = b.Pos(0, Y_SPLIT - 0.1, split_z + 0.5) * b.Rot(-90, 0, 0) * b.extrude(groove_2d, amount=LIP_HEIGHT + 0.4)
    r_groove = r_groove & box(-115, Y_SPLIT - 0.2, split_z + 0.5, 230, LIP_HEIGHT + 0.6, depth - split_z - 2.5)
    r_top = r_top - r_groove

    # --- Internal M3 Fastening Screw Bosses ---
    # Fasten front_bottom to front_top at X = +/-88 mm, Z = 25 mm
    for sx in (-88, 88):
        # Lower boss: height Y = 44 to 58 (14 mm tall), OD = 8.5 mm, M3 clearance hole 3.4 mm + counterbore
        boss_low = cylinder_y(sx, 44, 25, 4.25, 14)
        boss_low -= cylinder_y(sx, 43, 25, 1.7, 16)  # 3.4 mm diameter clearance hole
        boss_low -= cylinder_y(sx, 43, 25, 3.2, 7)   # 6.4 mm diameter counterbore for M3 head
        # Gusset connecting boss to shell wall
        gusset_low = box(sx - 3 if sx > 0 else sx - 12, 44, 22, 15, 14, 6)
        gusset_low &= box(-105, 44, 3, 210, 14, split_z - 3)
        f_bottom = f_bottom + boss_low + gusset_low

        # Upper boss: height Y = 58 to 72 (14 mm tall), OD = 8.5 mm, M3 pilot hole 2.8 mm
        boss_up = cylinder_y(sx, 58, 25, 4.25, 14)
        boss_up -= cylinder_y(sx, 57, 25, 1.4, 16)   # 2.8 mm pilot hole for M3 screw / insert
        gusset_up = box(sx - 3 if sx > 0 else sx - 12, 58, 22, 15, 14, 6)
        gusset_up &= box(-105, 58, 3, 210, 14, split_z - 3)
        f_top = f_top + boss_up + gusset_up

    # Fasten rear_bottom to rear_top at X = -88 (Z = 72 mm) and X = +88 (Z = 74 mm)
    for sx, sz in ((-88, 72), (88, 74)):
        boss_low = cylinder_y(sx, 44, sz, 4.25, 14)
        boss_low -= cylinder_y(sx, 43, sz, 1.7, 16)
        boss_low -= cylinder_y(sx, 43, sz, 3.2, 7)
        gusset_low = box(sx - 3 if sx > 0 else sx - 12, 44, sz - 3, 15, 14, 6)
        gusset_low &= box(-105, 44, split_z + 2, 210, 14, depth - split_z - 2)
        r_bottom = r_bottom + boss_low + gusset_low

        boss_up = cylinder_y(sx, 58, sz, 4.25, 14)
        boss_up -= cylinder_y(sx, 57, sz, 1.4, 16)
        gusset_up = box(sx - 3 if sx > 0 else sx - 12, 58, sz - 3, 15, 14, 6)
        gusset_up &= box(-105, 58, split_z + 2, 210, 14, depth - split_z - 2)
        r_top = r_top + boss_up + gusset_up

    # Ensure clean button openings and keepouts are respected
    buttons = [item for item in p["components"] if item["id"].startswith("button_")]
    for item in buttons:
        f_top -= cb.button_hole(item, p)
        f_bottom -= cb.button_hole(item, p)
        r_top -= cb.button_hole(item, p)
        r_bottom -= cb.button_hole(item, p)

    split_parts = {
        "front_top": f_top,
        "front_bottom": f_bottom,
        "rear_top": r_top,
        "rear_bottom": r_bottom,
    }
    for name, shape in split_parts.items():
        cb.color(shape, name, COLORS[name])

    return split_parts, electronics, extras, outer, features


def export_print_3mf(stl, destination, bed):
    """Export unit-explicit 3MF Core mesh centered on Ender 3 bed (220 x 220 mm)."""
    ns = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
    ET.register_namespace("", ns)
    def node(parent, tag, **attrs):
        return ET.SubElement(parent, f"{{{ns}}}{tag}", attrs)

    root = ET.Element(f"{{{ns}}}model", unit="millimeter", xml_lang="en-US")
    resources = node(root, "resources")
    obj = node(resources, "object", id="1", type="model")
    mesh = node(obj, "mesh")
    vertices = node(mesh, "vertices")
    triangles = node(mesh, "triangles")

    raw = stl.read_bytes()
    count = struct.unpack_from("<I", raw, 80)[0]
    points = {}
    faces = []
    for i in range(count):
        vals = struct.unpack_from("<12fH", raw, 84 + i * 50)
        face = []
        for j in (3, 6, 9):
            point = tuple(round(vals[j + a], 4) for a in range(3))
            if point not in points:
                points[point] = len(points)
            face.append(points[point])
        faces.append(face)

    mins = [min(v[i] for v in points) for i in range(3)]
    maxs = [max(v[i] for v in points) for i in range(3)]
    shift = [(bed[i] - maxs[i] - mins[i]) / 2 for i in (0, 1)] + [-mins[2]]

    for point in points:
        node(vertices, "vertex", **{axis: f"{point[i] + shift[i]:.6f}" for i, axis in enumerate("xyz")})
    for face in faces:
        node(triangles, "triangle", **{f"v{i + 1}": str(v) for i, v in enumerate(face)})
    node(node(root, "build"), "item", objectid="1")

    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n'
            '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n'
            '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n'
            '</Types>\n',
        )
        archive.writestr(
            "_rels/.rels",
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n'
            '  <Relationship Target="/3D/3dmodel.model" Id="rel0" '
            'Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>\n'
            '</Relationships>\n',
        )
        archive.writestr("3D/3dmodel.model", ET.tostring(root, encoding="utf-8", xml_declaration=True))

    return {"unit": "millimeter", "triangles": len(faces), "matches_stl": True, "bed_centered": True}


def verify_ender3(p, split_parts):
    """Verify solids, bounds against Ender 3 print volume (220 x 220 x 250 mm)."""
    checks = []
    for name, shape in split_parts.items():
        is_valid = shape.is_valid and len(shape.solids()) == 1 and shape.volume > 0
        checks.append({
            "check": f"{name}: valid single connected solid",
            "pass": is_valid,
            "detail": {"solids": len(shape.solids()), "volume_mm3": round(shape.volume, 2)}
        })
        
        # Check printable bounds when placed flat on bed (outside face down)
        printable = shape if "front" in name else b.Rot(180, 0, 0) * shape
        bb = printable.bounding_box()
        sx, sy, sz = bb.size.X, bb.size.Y, bb.size.Z
        fits_bed = sx <= ENDER3_BED[0] + 0.1 and sy <= ENDER3_BED[1] + 0.1 and sz <= 250.0
        checks.append({
            "check": f"{name}: fits Ender 3 print volume (220x220x250 mm)",
            "pass": fits_bed,
            "detail": {"print_bounds_mm": [round(sx, 2), round(sy, 2), round(sz, 2)]}
        })

    return {"checks": checks, "passed": all(c["pass"] for c in checks)}


def build_ender3(check_only=False):
    p = json.loads((ROOT / "parameters.json").read_text())
    print("Generating Ender 3 modular split CAD...", flush=True)
    split_parts, electronics, extras, outer, features = make_ender3_split(p)
    
    print("Verifying solids and Ender 3 dimensions...", flush=True)
    report = verify_ender3(p, split_parts)
    print(json.dumps(report, indent=2))
    
    if check_only or not report["passed"]:
        return report["passed"]

    OUTPUT.mkdir(parents=True, exist_ok=True)
    print(f"Exporting verified STLs and 3MFs to {OUTPUT}...", flush=True)
    
    for name, shape in split_parts.items():
        printable = shape if "front" in name else b.Rot(180, 0, 0) * shape
        bb = printable.bounding_box()
        printable = b.Pos(0, 0, -bb.min.Z) * printable
        
        stl_path = OUTPUT / f"{name}.stl"
        b.export_stl(printable, stl_path, tolerance=0.035, angular_tolerance=0.15)
        cb.weld_stl(stl_path)
        
        mf3_path = OUTPUT / f"{name}.3mf"
        export_print_3mf(stl_path, mf3_path, ENDER3_BED)
        print(f"  ✓ {name}: STL and 3MF ({bb.size.X:.1f} x {bb.size.Y:.1f} x {bb.size.Z:.1f} mm)")

    # Export assembled STEP
    assembly = b.Compound(
        children=list(split_parts.values()) + list(electronics.values()) + list(extras.values()),
        label="cloud_radio_ender3"
    )
    b.export_step(assembly, OUTPUT / "cloud-radio-ender3.step")
    b.export_gltf(assembly, OUTPUT / "cloud-radio-ender3.glb", binary=True, linear_deflection=0.08, angular_deflection=0.15)

    # Export test coupons
    coupon_dict = cb.coupons(p)
    for cname, cshape in coupon_dict.items():
        cpath = OUTPUT / f"{cname}.stl"
        b.export_stl(cshape, cpath, tolerance=0.035, angular_tolerance=0.15)
        cb.weld_stl(cpath)
        export_print_3mf(cpath, OUTPUT / f"{cname}.3mf", ENDER3_BED)

    # Write print-settings-ender3-petg.json
    ender3_settings = {
        "printer": "Creality Ender 3 (all variants: base, Pro, V2, S1, V3)",
        "build_volume_mm": [220, 220, 250],
        "material": "PETG",
        "units": "mm",
        "layer_height_mm": 0.20,
        "initial_layer_height_mm": 0.24,
        "perimeters_walls": 4,
        "top_solid_layers": 5,
        "bottom_solid_layers": 5,
        "infill_percent": 20,
        "infill_pattern": "gyroid",
        "temperatures": {
            "nozzle_celsius": 240,
            "bed_celsius": 75,
            "initial_layer_nozzle_celsius": 245,
            "initial_layer_bed_celsius": 80
        },
        "fan_cooling": {
            "initial_layers_fan_speed_percent": 0,
            "regular_fan_speed_percent": 25,
            "max_fan_speed_percent": 40
        },
        "retraction_bowden": {
            "retraction_distance_mm": 5.5,
            "retraction_speed_mm_s": 45,
            "z_hop_mm": 0.2
        },
        "print_speeds_mm_s": {
            "outer_wall": 35,
            "inner_wall": 45,
            "infill": 50,
            "first_layer": 20
        },
        "bed_adhesion": {
            "brim_type": "outer_only",
            "brim_width_mm": 5.0,
            "release_agent": "Glue stick or hairspray recommended on smooth PEI/glass to prevent bed tearing"
        },
        "parts_manifest": {
            "front_top": "Top half of front shell containing arcade buttons, LCD, speaker grill, amp mounts. Print flat face down.",
            "front_bottom": "Bottom half of front shell with bottom locating tongues. Print flat face down.",
            "rear_top": "Top half of rear shell with power switch and ventilation slots. Print flat face down.",
            "rear_bottom": "Bottom half of rear shell containing Baseus battery cradle and Pi 3 shelf. Print flat face down.",
            "button-fit-coupon": "Test coupon with 28.0, 28.4, 28.8 mm holes to verify button nut fit before full print.",
            "snap-coupon-0.2/0.3/0.4": "Test coupons to verify PETG cantilever snap engagement and release force."
        },
        "assembly_hardware": {
            "shell_split_fasteners": "4 x M3 x 10 mm socket head cap screws (or M3 thread-forming) through internal lower bosses into upper bosses",
            "front_to_rear_closure": "Screwless: 2 bottom pivot tongues + 5 perimeter cantilever snaps",
            "pi_and_lcd": "4 x M2.5 x 6 mm internal screws each",
            "arcade_buttons": "6 x original button retaining nuts (28.4 mm holes)",
            "speaker": "4 x M2.5 bolts with insulating washers"
        }
    }
    (OUTPUT / "print-settings-ender3-petg.json").write_text(json.dumps(ender3_settings, indent=2) + "\n")
    print(f"PASS: Ender 3 modular edition exported to {OUTPUT}", flush=True)
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    success = build_ender3(args.check_only)
    raise SystemExit(0 if success else 1)
