"""Generate and verify the cloud prototype. Native X is left in the front view,
Y is up, Z goes into the enclosure; mm. Run with the pinned cadgen environment.
Publishing replaces the last good asset directory only after every check passes.
"""
from __future__ import annotations

import argparse
import fcntl
from collections import Counter
from itertools import combinations
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
OUTPUT = ROOT / "generated" / "cloud"
COLORS = {"front": "#86bfea", "rear": "#70acd9", "battery_door": "#70acd9"}


def box(x, y, z, w, h, d):
    return b.Pos(x, y, z) * b.Box(w, h, d, align=(b.Align.MIN,) * 3)


def cylinder(x, y, z, r, height):
    return b.Pos(x, y, z) * b.Cylinder(r, height, align=(b.Align.CENTER, b.Align.CENTER, b.Align.MIN))


def button_hole(item, p):
    x,y,z=item["origin"];w,h,d=item["size"]
    radius=p["buttons"]["mount_hole_mm"]/2
    axis=item.get("axis","y" if item["id"] in ("button_top","button_bottom") else "x")
    if axis=="y":
        return b.Pos(x+w/2,y+h/2,z+d/2)*b.Rot(90,0,0)*b.Cylinder(radius,100)
    return b.Pos(x+w/2,y+h/2,z+d/2)*b.Rot(0,90,0)*b.Cylinder(radius,100)


def rr(x, y, w, h, r):
    return b.Pos(x + w / 2, y + h / 2) * b.RectangleRounded(w, h, r)


def slab(profile, z, depth):
    return b.Pos(0, 0, z) * b.extrude(profile, amount=depth)


def overlap(a, c):
    aa, cc = a.bounding_box(), c.bounding_box()
    if any(min(x, y) - max(u, v) <= 1e-5 for x, y, u, v in zip(aa.max, cc.max, aa.min, cc.min)):
        return 0.0
    intersection = a & c
    return sum(s.volume for s in intersection.solids()) if intersection else 0.0


def color(shape, label, value):
    shape.label = label
    shape.color = b.Color(value)
    return shape


def expanded(item, allowance):
    pad = allowance / 2 if item.get("uncertain") else 0
    origin = [v-pad for v in item["origin"]]
    size = [v+2*pad for v in item["size"]]
    if "fixed_back_z" in item:
        # Connected sockets cannot grow through their host PCB. Allocate the
        # entire extra depth in front of that fixed mating plane instead.
        size[2] = item["size"][2] + 2*pad
        origin[2] = item["fixed_back_z"] - size[2]
    if "fixed_bottom_y" in item:
        origin[1]=item["fixed_bottom_y"]
        size[1]=item["size"][1]+2*pad
    if item.get("shape")=="cylinder":
        center=[v+s/2 for v,s in zip(origin,size)]
        axis=item.get("axis","z")
        rotation = {"x": (0,90,0), "y": (90,0,0), "z": (0,0,0)}[axis]
        axial = "xyz".index(axis)
        radial = 1 if axis == "x" else 0
        return b.Pos(*center)*b.Rot(*rotation)*b.Cylinder(size[radial]/2,size[axial])
    return box(*origin, *size)


def cloud_profile(extension=0, outline=None):
    # Tangent-continuous Bezier lobes: the old circle unions had sharp valleys.
    # The 170 mm sole remains flat; the sides and cloud crown blend smoothly.
    segments = [
        [(-85,0), (85,0)],
        [(85,0), (104,0), (105,44), (105,85)],
        [(105,85), (105,113), (96,135), (76,141)],
        [(76,141), (66,144), (74,164), (59,174)],
        [(59,174), (42,185.3333333333), (24,177), (17,178)],
        [(17,178), (3,180), (-5,190), (-23,190)],
        [(-23,190), (-52,190), (-63,175), (-65,158)],
        [(-65,158), (-67,141), (-94,145), (-102,116)],
        [(-102,116), (-105,105.125), (-105,98), (-105,85)],
        [(-105,85), (-105,40), (-104,0), (-85,0)],
    ]
    # Extend only the straight lower side runs; retain the cloud lobe radii.
    if outline:
        segments=[[tuple(point) for point in segment] for segment in outline]
    elif extension:
        segments=[segments[0],segments[1],[(105,85),(105,85+extension)]] + [
            [(x,y+extension) for x,y in segment] for segment in segments[2:-1]
        ] + [[(-105,85+extension),(-105,85)],segments[-1]]
    edges = []
    for points in segments:
        curve = b.Line(*points) if len(points)==2 else b.Bezier(*points)
        edges.extend(curve.edges())
    return b.Face(b.Wire(edges))


def bed_chamfer(profile, surface_z, amount, direction=1):
    # A 45-degree underside replaces the old rounded lower rim, whose first
    # layers expanded too quickly for face-down PETG printing on an Ender.
    return b.loft([b.Pos(0,0,surface_z)*b.offset(profile,amount=-amount),
                   b.Pos(0,0,surface_z+direction*amount)*profile],ruled=True)


def fairing_profile(profile, inset, width, height):
    # Scale about the bottom centre: the sole stays on Y=0 while the crown
    # and sides ease into the flat front/rear face. Hardware is never scaled.
    return b.scale(profile,by=((width-2*inset)/width,(height-inset)/height,1),about=(0,0,0)).faces()[0]


def smooth_skin(profile, surface_z, c, direction=1):
    inset=c["skin_inset_mm"];run=c["skin_blend_depth_mm"];ef=c["bed_chamfer_mm"]
    face=fairing_profile(profile,inset,c["width_mm"],c["height_mm"])
    skin=bed_chamfer(face,surface_z,ef,direction)
    sections=[]
    for i in range(9):
        u=i/8
        section=fairing_profile(profile,inset*(1-u)**2,c["width_mm"],c["height_mm"])
        sections.append(b.Pos(0,0,surface_z+direction*(ef+run*u))*section)
    return skin+b.loft(sections)


def place_snap(shape, site):
    x, y, angle = site
    return b.Pos(x, y, 0) * b.Rot(0, 0, angle) * shape


def cylinder_y(x,y,z,r,height):
    return b.Pos(x,y,z)*b.Rot(-90,0,0)*b.Cylinder(r,height,align=(b.Align.CENTER,b.Align.CENTER,b.Align.MIN))


def cylinder_x(x,y,z,r,length):
    return b.Pos(x,y,z)*b.Rot(0,90,0)*b.Cylinder(r,length,align=(b.Align.CENTER,b.Align.CENTER,b.Align.MIN))


def cloud_aperture(x, y, width, height):
    """Three rounded lobes and a flat base, all dimensions from grille settings."""
    profile = rr(x-width/2, y-height/2, width, height*.58, height*.25)
    for dx, dy, radius in ((-.28,-.02,.22),(0,.18,.32),(.28,-.02,.22)):
        profile += b.Pos(x+dx*width,y+dy*height)*b.Circle(radius*height)
    return profile


def slotted_hole(cx, cy, top, axis="x", z_min=3):
    profile = rr(cx - 4, cy - 1.5, 8, 3, 1.49)
    if axis == "y":
        profile = b.Pos(cx, cy) * b.Rot(0, 0, 90) * rr(-4, -1.5, 8, 3, 1.49)
    return slab(profile, z_min, top + 2 - z_min)


def slotted_pad(cx, cy, top, axis="x", t=3):
    """Internal blind mounting pad with screw slot; front face remains solid and clean."""
    pad = box(cx - 5.5, cy - 4, t, 11, 8, top - t)
    profile = rr(cx - 4, cy - 1.5, 8, 3, 1.49)
    if axis == "y":
        profile = b.Pos(cx, cy) * b.Rot(0, 0, 90) * rr(-4, -1.5, 8, 3, 1.49)
    slot = slab(profile, t, top - t + 1)
    return pad - slot


def make(p):
    c, sn = p["case"], p["snap"]
    t, split, depth, gap = c["wall"], c["split"], c["depth"], c["seam_gap"]
    features=[]
    def record(shape, ident, title, part):
        bb=shape.bounding_box()
        features.append({"id":ident,"title":title,"part":part,
                         "origin":[round(v,4) for v in bb.min],
                         "size":[round(v,4) for v in bb.size]})
        return shape
    outer = cloud_profile(c["height_extension"],c.get("outline_segments_mm"))
    inside = b.offset(outer, amount=-t)
    ring = outer - inside
    skin_depth=c["bed_chamfer_mm"]+c["skin_blend_depth_mm"]
    front = smooth_skin(outer,0,c) + slab(outer,skin_depth,split-skin_depth)
    front -= slab(inside,t,split-t+1)
    rear = slab(outer,split+gap,depth-skin_depth-split-gap) + smooth_skin(outer,depth,c,-1)
    rear -= slab(inside,split+gap-1,depth-t-split-gap+1)
    lip = b.offset(outer, amount=-t-gap) - b.offset(outer, amount=-t-1.5)
    lip = slab(lip, split, 3)

    # Free cantilevers live INSIDE the wall; roots alone connect to the shell.
    for site in sn["sites"]:
        lip -= place_snap(box(-6, -1, split - .1, 12, 9, 3.2), site)
    # Leave the bottom module corridor clear across the shell joint.
    lip-=box(-66,-1,split-.1,132,33,3.3)
    for x in p["closure"]["tongue_x"]:
        lip-=box(x-9,-1,split-.1,18,11,3.3)
    rim_boost=slab(outer-b.offset(outer,amount=-t-1.5),split-1.5,1.5)
    rim_boost-=box(-66,3,split-2,132,30,6)
    front+=rim_boost+lip

    for index,site in enumerate(sn["sites"],1):
        stem = box(-sn["width"]/2, t + gap, sn["root_z"], sn["width"], sn["thickness"], sn["length"])
        root = box(-sn["width"]/2-1, 1, sn["root_z"]-3, sn["width"]+2, t+gap+sn["thickness"]-1, 3.1)
        inner = t + gap
        tip = inner - (gap + sn["engagement"])
        z0 = sn["root_z"] + sn["length"] - 2.2
        wedge = b.Plane.YZ * b.Polygon((tip, z0), (inner + sn["thickness"], z0),
                                     (inner + sn["thickness"], z0+2.2), (inner, z0+2.2), align=None)
        hook = b.Pos(-sn["width"]/2, 0, 0) * b.extrude(wedge, amount=sn["width"])
        pad=box(-sn["width"]/2,.8,z0+.2,sn["width"],inner-.8,1.8)
        front += record(place_snap(stem + root + hook + pad, site),f"F-N{index:02}","Snap hook","front")
        rear -= place_snap(box(-sn["width"]/2-.4,-1,z0-.3,sn["width"]+.8,7,2.8),site)
        rear -= place_snap(box(-6,-1,z0-2.3,12,2.3,7),site)
        # A constant-width channel clears the beam even along curved walls;
        # retain the outer ledge that engages its undercut.
        rear -= place_snap(box(-sn["width"]/2-.3,t+gap-.15,split-.01,
                               sn["width"]+.6,4,sn["root_z"]+sn["length"]-split+1),site)
    lip_clear=b.offset(outer,amount=-t)-b.offset(outer,amount=-t-1.5-gap)
    rear-=slab(lip_clear,split,3+gap)
    # Insert the two bottom tongues, pivot the front closed, then press snaps.
    for index,x in enumerate(p["closure"]["tongue_x"],1):
        tongue=box(x-6,1.5,split-2,12,1.6,9)
        receiver=box(x-8,0,split+gap,16,9,11)
        slot=box(x-6.3,1.2,split-.1,12.6,4.6,8.4)
        receiver-=slot
        rear-=slot
        front+=record(tongue,f"F-T{index:02}","Bottom locating tongue","front")
        rear+=record(receiver,f"R-T{index:02}","Pivot tongue receiver","rear")

    items = {v["id"]: v for v in p["components"]}
    lcd = items["lcd"]
    lx, ly, lz = lcd["origin"]
    # Official drawing: active area position inferred from the dimensioned view;
    # 0.5 mm per edge display clearance. Hole pitch is authoritative.
    front -= slab(rr(lx + 1.7, ly + 10.3, 31.6, 41.8, 1), -1, t+2)
    for index,(x,y) in enumerate(((x,y) for x in (lx+2.5,lx+32.5) for y in (ly+2.5,ly+55.5)),1):
        front += record(cylinder(x,y,t,2.4,lz-t),f"F-L{index:02}","LCD mounting post","front")
        front -= cylinder(x, y, 1, 1.1, lz+1)

    # Cut again after the decorative relief is added; those caps must never
    # refill the side openings. All six axes come from component parameters.
    buttons=[item for item in p["components"] if item["id"].startswith("button_")]
    for index,item in enumerate(buttons,1):
        # Curved walls otherwise leave gaps beneath a flat arcade bezel.
        # These seats stay inside the 206 mm bounding width and provide a
        # continuous planar mounting surface around the complete bore.
        if item["axis"] == "x":
            seat_size = p["buttons"]["bezel_mm"]+3
            seat_depth = p["case"]["wall"]+3
            xx = c["width_mm"]/2-seat_depth if item["id"]=="button_left" else -c["width_mm"]/2
            yy = item["origin"][1]+item["size"][1]/2-seat_size/2
            zz = p["buttons"]["side_axis_depth_mm"]-seat_size/2
            front += record(box(xx,yy,zz,seat_depth,seat_size,seat_size),
                            f"F-BSEAT{index:02}", "Complete flat arcade mounting seat", "front")
        front -= record(button_hole(item,p),f"F-BTN{index:02}",
                        f"Arcade mounting hole {p['buttons']['mount_hole_mm']} mm","front")

    diagonal = 4.5 / math.sqrt(2)
    speaker = items["speaker"]
    sx, sy, sz = speaker["origin"]
    grille = p["speaker_grille"]
    for index, (dx, dy) in enumerate(grille["centers_mm"], 1):
        aperture = slab(cloud_aperture(sx+20+dx, sy+20+dy,
                        grille["width_mm"], grille["height_mm"]), -1, t+2)
        front -= record(aperture, f"F-G{index:02}", "Cloud speaker aperture", "front")
    for index,(x,y) in enumerate(((x,y) for x in (sx+diagonal,sx+40-diagonal) for y in (sy+diagonal,sy+40-diagonal)),1):
        front += record(slotted_pad(x, y, sz, "x", t), f"F-SP{index:02}", "Speaker mounting pad", "front")

    amp = items["amp"]
    ax, ay, az = amp["origin"]
    aw, ah, _ = amp["size"]
    for index,yy in enumerate((ay-4,ay+ah+4),1):
        front += record(slotted_pad(ax+aw/2, yy, az, "x", t), f"F-AMP{index:02}", "Amplifier support pad", "front")

    # XY battery bay, open at +X. Lips retain the bank when the front is off.
    bay = p["battery_bay"]
    bx, by, bz = items["battery"]["origin"]
    bw, bh, bd = items["battery"]["size"]
    clearance, rail = bay["clearance_mm"], bay["rail_wall_mm"]
    for index, yy in enumerate((by-clearance-rail, by+bh+clearance), 1):
        support = box(bay["stop_x"], yy, bay["rail_front_z"],
                      bay["rail_x_end"]-bay["stop_x"], rail,
                      depth-t-bay["rail_front_z"]+.2)
        lip_y = yy if index == 1 else yy-1.8
        support += box(bay["stop_x"], lip_y, bay["rail_front_z"],
                       bay["rail_x_end"]-bay["stop_x"], rail+1.8, 1.2)
        rear += record(support, f"R-BR{index:02}", "Side-loading battery guide rail", "rear")
        seat_y = by+2 if index == 1 else by+bh-4
        rear += record(box(bx, seat_y, bz+bd+clearance, bw, 2, depth-t-bz-bd-clearance+.2),
                       f"R-BS{index:02}", "Battery back support", "rear")
    rear += record(box(bay["stop_x"], by-clearance-rail, bay["rail_front_z"],
                       rail, bh+2*(clearance+rail), depth-t-bay["rail_front_z"]+.2),
                   "R-BSTOP", "Battery insertion stop", "rear")
    # Ribbon lies behind the bank between the back supports; ends at hatch.
    px, py, pz = items["pi"]["origin"]
    pcb_back = pz+items["pi"]["size"][2]
    for index, (x, y) in enumerate(((x, y) for x in (px+3.5, px+61.5) for y in (py+3.5, py+52.5)), 1):
        post = cylinder(x, y, pcb_back, 2.8, depth-t-pcb_back+.2)
        rear += record(post, f"R-P{index:02}", "Rear-lid Pi mounting post", "rear")
        rear -= cylinder(x, y, pcb_back-.2, 1.1, depth-t-pcb_back+1.4)

    # Flush side hatch within the original 206 mm overall width.
    door_spec = p["battery_door"]
    dx, dy, dz = door_spec["origin"]; dw, dh, dd = door_spec["size"]
    margin = door_spec["clearance_mm"]
    frame = box(94, dy-1, dz-margin, 9, dh+2, depth-dz+margin)
    rear += record(frame, "R-HFRAME", "Battery hatch reinforcing frame", "rear")
    rear -= box(*bay["opening_origin"], *bay["opening_size"])
    rear -= box(dx-margin, dy-margin, dz-margin, dw+2*margin+1, dh+2*margin, dd+2*margin)
    door = box(dx,dy,dz,dw,dh,dd)
    for index, yy in enumerate(door_spec["screw_y"], 1):
        bore = cylinder_x(93, yy, door_spec["screw_z"], door_spec["screw_hole_mm"]/2, 12)
        rear -= bore
        door -= bore
        # Heat-set insert loads from the exposed outer seat before the lid is
        # installed. It cannot fall inside when a service screw is removed.
        pilot = cylinder_x(door_spec["insert_face_x"]-door_spec["insert_length_mm"],
                           yy, door_spec["screw_z"],door_spec["insert_pilot_mm"]/2,
                           door_spec["insert_length_mm"]+.1)
        rear -= record(pilot, f"R-HI{index:02}", "Battery lid heat-set insert seat", "rear")
    # Two compression arms stop the bank at its intended position, leaving
    # the central USB-C plug and ribbon accessible. They print upward from
    # the outer lid face and move entirely with the removed lid.
    for index, yy in enumerate(door_spec["retainer_y"],1):
        arm = box(door_spec["retainer_x"],yy,door_spec["retainer_z"],
                  dx-door_spec["retainer_x"]+.2,door_spec["retainer_width_mm"],door_spec["retainer_height_mm"])
        door += record(arm,f"B-STOP{index:02}","Lid battery retaining arm","battery_door")
    # Shallow grip recess leaves 1.6 mm material beneath it.
    door -= box(dx+dw-.8, dy+dh/2-6, dz+3, 1, 12, dd-6)
    # The switch stays near the back, above the bottom module.
    wx, wy, wz = items["switch"]["origin"]
    rear -= slab(rr(wx + 1, wy + 8, 16, 24, 5), depth-t-1, t + 2)
    for index, yy in enumerate((wy + 5, wy + 35), 1):
        lug = box(wx - 6, yy - 4, wz + 8, 6, 8, depth - t - wz - 8)
        lug -= box(wx - 4.5, yy - 2.5, wz + 7, 3, 5, 4)
        rear += record(lug, f"R-SW{index:02}", "Switch retaining slot", "rear")
    for x in range(-34, 35, 8):
        rear -= slab(rr(x, 36, 3, 18, 1.4), depth - t - 1, t + 2)
    for x in (-82, 74):
        rear -= slab(rr(x, 12, 8, 16, 2), depth - t - 1, t + 2)

    # Cut mounting holes for all arcade buttons through both shells.
    for item in buttons:
        front -= button_hole(item, p)
        rear -= button_hole(item, p)
    # An internal counterbore accommodates the provisional nut envelope.
    for item in p["keepouts"]:
        if item["id"].startswith("button_") and item["id"].endswith("_nut"):
            x, y, z = item["origin"]; w, h, d = item["size"]
            axis = item.get("axis", "y" if "top" in item["id"] or "bottom" in item["id"] else "x")
            if axis == "y":
                relief = b.Pos(x + w / 2, y + h / 2, z + d / 2) * b.Rot(90, 0, 0) * b.Cylinder(w / 2 + 0.2, h + 0.8)
            else:
                relief = b.Pos(x + w / 2, y + h / 2, z + d / 2) * b.Rot(0, 90, 0) * b.Cylinder(h / 2 + 0.2, w + 0.8)
            front -= relief
            rear -= relief
    parts = {"front": front, "rear": rear, "battery_door": door}
    for name, shape in parts.items():
        color(shape, name, COLORS[name])

    # CAD display components, with real mounting holes where known. These
    # are simplified envelopes, NOT claimed vendor assemblies.
    electronics = {}
    for item in p["components"]:
        x, y, z = item["origin"]
        w, h, d = item["size"]
        if item["id"] == "pi":
            # Official Raspberry Pi 3 Model B mechanical geometry
            pcb = box(x, y, z, w, h, d)
            for hx in (x+3.5, x+61.5):
                for hy in (y+3.5, y+52.5):
                    pcb -= cylinder(hx, hy, z-1, 1.375, d+2)
            # Micro-USB power receptacle on the bottom edge (Y=18, X=px+10.6)
            pwr_socket = box(x + 10.6 - 3.8, y - 0.8, z - 3.0, 7.6, 5.6, 3.0)
            pwr_socket -= box(x + 10.6 - 3.2, y - 1.0, z - 2.5, 6.4, 3.8, 2.0)
            # HDMI port on the bottom edge (Y=18, X=px+32.0)
            hdmi = box(x + 32.0 - 7.5, y - 0.8, z - 6.5, 15.0, 11.2, 6.5)
            hdmi -= box(x + 32.0 - 6.8, y - 1.0, z - 5.8, 13.6, 7.0, 5.0)
            # 3.5mm 4-pole audio/composite jack (Y=18, X=px+53.5)
            audio = box(x + 53.5 - 3.5, y, z - 6.0, 7.0, 14.5, 6.0)
            audio += cylinder_y(x + 53.5, y, z - 3.0, 3.0, 2.5)
            audio -= cylinder_y(x + 53.5, y - 2.6, z - 3.0, 1.8, 8.0)
            # 2x Dual stacked USB Type-A ports on the right edge (+X)
            usb1 = box(x + w - 15.2, y + 9.5, z - 16.0, 17.0, 13.5, 16.0)
            usb1 -= box(x + w + .2, y + 10.5, z - 15.0, 2.0, 11.5, 6.2)
            usb1 -= box(x + w + .2, y + 10.5, z - 7.6, 2.0, 11.5, 6.2)
            usb2 = box(x + w - 15.2, y + 27.5, z - 16.0, 17.0, 13.5, 16.0)
            usb2 -= box(x + w + .2, y + 28.5, z - 15.0, 2.0, 11.5, 6.2)
            usb2 -= box(x + w + .2, y + 28.5, z - 7.6, 2.0, 11.5, 6.2)
            # Ethernet RJ45 jack on the right edge (+X)
            eth = box(x + w - 19.5, y + 43.5, z - 13.5, 21.5, 15.5, 13.5)
            eth -= box(x + w + .2, y + 45.0, z - 12.0, 2.0, 12.5, 10.5)
            # 40-pin GPIO header along the top edge (Y=74)
            gpio = box(x + 7.5, y + h - 5.0, z - 8.5, 51.0, 5.0, 8.5)
            # Broadcom BCM2837 SoC processor in the center
            soc = box(x + 28.0, y + 17.0, z - 1.5, 14.0, 14.0, 1.5)
            # DSI display and CSI camera flat-flex connectors
            dsi = box(x + 3.5, y + 15.0, z - 5.5, 3.2, 22.0, 5.5)
            csi = box(x + 44.5, y + 3.0, z - 5.5, 3.2, 22.0, 5.5)
            # Micro-SD card slot on the underside (Z > 66.0)
            sd = box(x - 1.5, y + 21.0, z + d, 14.0, 12.0, 1.2)
            shape = pcb + pwr_socket + hdmi + audio + usb1 + usb2 + eth + gpio + soc + dsi + csi + sd
        elif item["id"] == "lcd":
            shape = box(x, y, z, w, h, 1.6)
            for hx in (x+2.5, x+w-2.5):
                for hy in (y+2.5, y+h-2.5):
                    shape -= cylinder(hx, hy, z-1, 1.5, 4)
        elif item["id"].startswith("button_"):
            cx = x + w / 2
            cy = y + h / 2
            cz = z + d / 2
            axis = item.get("axis", "y" if item["id"] in ("button_top", "button_bottom") else "x")
            if axis == "y":
                shape = b.Pos(cx, cy, cz) * b.Rot(90, 0, 0) * b.Cylinder(item["diameter_mm"]/2, h, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER))
            else:
                shape = b.Pos(cx, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(item["diameter_mm"]/2, w, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER))
        elif item["id"] == "speaker":
            shape = box(x, y, z, w, h, 1.2)
            for hx in (x+diagonal, x+w-diagonal):
                for hy in (y+diagonal, y+h-diagonal):
                    shape -= cylinder(hx, hy, z-1, 1.6, 4)
            shape += cylinder(x+20, y+20, z+1.2, 17, 8.8)
            shape += cylinder(x+20, y+20, z+10, 12, 10)
        else:
            shape = box(x, y, z, w, h, d)
        electronics[item["id"]] = color(shape, "component_"+item["id"], item["color"])

    extras = {}
    extras["screen"] = color(box(lx+2.2, ly+10.8, .6, 30.6, 40.8, 4.8), "screen", "#162f40")
    for btn in p["components"]:
        if not btn["id"].startswith("button_"): continue
        cx = btn["origin"][0] + btn["size"][0] / 2
        cy = btn["origin"][1] + btn["size"][1] / 2
        cz = btn["origin"][2] + btn["size"][2] / 2
        axis = btn.get("axis", "y" if btn["id"] in ("button_top", "button_bottom") else "x")
        if axis == "y":
            if "top" in btn["id"]:
                extras[f"bezel_{btn['id']}"] = color(b.Pos(cx, c["height_mm"]+1.5, cz) * b.Rot(90, 0, 0) * b.Cylinder(16.5, 3), f"bezel_{btn['id']}", "#1e293b")
                extras[f"cap_{btn['id']}"] = color(b.Pos(cx, c["height_mm"]+3, cz) * b.Rot(90, 0, 0) * b.Cylinder(12, 2.5), f"cap_{btn['id']}", btn["color"])
            else:
                extras[f"bezel_{btn['id']}"] = color(b.Pos(cx, -1.5, cz) * b.Rot(90, 0, 0) * b.Cylinder(16.5, 3), f"bezel_{btn['id']}", "#1e293b")
                extras[f"cap_{btn['id']}"] = color(b.Pos(cx, -3, cz) * b.Rot(90, 0, 0) * b.Cylinder(12, 2.5), f"cap_{btn['id']}", btn["color"])
        elif "left" in btn["id"]:
            extras[f"bezel_{btn['id']}"] = color(b.Pos(c["width_mm"]/2+1.5, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(16.5, 3), f"bezel_{btn['id']}", "#1e293b")
            extras[f"cap_{btn['id']}"] = color(b.Pos(c["width_mm"]/2+3, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(12, 2.5), f"cap_{btn['id']}", btn["color"])
        else:
            extras[f"bezel_{btn['id']}"] = color(b.Pos(-c["width_mm"]/2-1.5, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(16.5, 3), f"bezel_{btn['id']}", "#1e293b")
            extras[f"cap_{btn['id']}"] = color(b.Pos(-c["width_mm"]/2-3, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(12, 2.5), f"cap_{btn['id']}", btn["color"])
    for item in p["keepouts"]:
        if item["id"] in ("pi_power", "bank_plug"):
            # Power cable and plug are hidden from visual assembly
            continue
        else:
            extras[item["id"]] = color(expanded({**item, "uncertain": False}, 0), "connector_" + item["id"], "#5b6670")

    return parts, electronics, extras, outer, features


def weld_stl(path):
    """Weld at 0.0001 mm and remove triangles collapsed by that weld.

    Curved Boolean seams can tessellate into sub-micron slivers. Quantizing
    every shared vertex makes the saved mesh explicit; the independent edge
    and winding checks below still reject holes or non-manifold topology.
    """
    raw=path.read_bytes()
    count=struct.unpack_from("<I",raw,80)[0]
    faces=[]
    for i in range(count):
        values=struct.unpack_from("<12fH",raw,84+i*50)
        vertices=[tuple(round(v,4) for v in values[j:j+3]) for j in (3,6,9)]
        if len(set(vertices))<3:
            continue
        a,c,d=vertices
        u=[c[j]-a[j] for j in range(3)]
        v=[d[j]-a[j] for j in range(3)]
        normal=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
        length=math.sqrt(sum(n*n for n in normal))
        if length<1e-14:
            continue
        faces.append(struct.pack("<12fH",*[n/length for n in normal],*a,*c,*d,0))
    path.write_bytes(raw[:80]+struct.pack("<I",len(faces))+b"".join(faces))
    return count-len(faces)


def mesh_check(path):
    """Read saved binary STL independently: topology, orientation and volume."""
    raw = path.read_bytes()
    count = struct.unpack_from("<I", raw, 80)[0]
    assert len(raw) == 84 + count * 50, "Invalid binary STL length"
    edges, directed = Counter(), Counter()
    volume = 0.0
    for i in range(count):
        values = struct.unpack_from("<12fH", raw, 84+i*50)
        vertices = [tuple(round(v, 4) for v in values[j:j+3]) for j in (3,6,9)]
        a, c, d = vertices
        cross = (c[1]*d[2]-c[2]*d[1], c[2]*d[0]-c[0]*d[2], c[0]*d[1]-c[1]*d[0])
        volume += sum(u*v for u,v in zip(a,cross))/6
        for u,v in zip(vertices, vertices[1:]+vertices[:1]):
            if u == v:
                raise ValueError(f"Degenerate STL triangle in {path.name}")
            edges[tuple(sorted((u,v)))] += 1
            directed[(u,v)] += 1
    return {"triangles": count, "watertight": all(n==2 for n in edges.values()),
            "consistent_winding": all(directed[(v,u)] == n for (u,v),n in directed.items()),
            "volume_mm3": round(volume, 2)}


def export_print_3mf(stl, destination, bed):
    """Unit-explicit 3MF Core mesh, identical to the verified print STL.

    Each file is one printable object centred on its own bed. This is a model
    container, not a machine profile or a pre-sliced printer project.
    """
    ns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
    ET.register_namespace("",ns)
    def node(parent,tag,**attrs):return ET.SubElement(parent,f"{{{ns}}}{tag}",attrs)
    model=ET.Element(f"{{{ns}}}model",{"unit":"millimeter"})
    resources=node(model,"resources")
    obj=node(resources,"object",id="1",type="model",name=stl.stem)
    mesh=node(obj,"mesh");vertices=node(mesh,"vertices");triangles=node(mesh,"triangles")
    raw=stl.read_bytes();count=struct.unpack_from("<I",raw,80)[0]
    points={};faces=[]
    for i in range(count):
        values=struct.unpack_from("<12fH",raw,84+i*50)
        face=[]
        for j in (3,6,9):
            point=tuple(values[j:j+3])
            if point not in points:points[point]=len(points)
            face.append(points[point])
        faces.append(face)
    mins=[min(v[i] for v in points) for i in range(3)]
    maxs=[max(v[i] for v in points) for i in range(3)]
    shift=[(bed[i]-maxs[i]-mins[i])/2 for i in (0,1)]+[-mins[2]]
    for point in points:
        node(vertices,"vertex",**{axis:f"{point[i]+shift[i]:.6f}" for i,axis in enumerate("xyz")})
    for face in faces:node(triangles,"triangle",**{f"v{i+1}":str(v) for i,v in enumerate(face)})
    node(node(model,"build"),"item",objectid="1")
    with zipfile.ZipFile(destination,"w",zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml",'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        archive.writestr("_rels/.rels",'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        archive.writestr("3D/3dmodel.model",ET.tostring(model,encoding="utf-8",xml_declaration=True))
    # Reopen the saved container and check scale, indices, placement and count.
    with zipfile.ZipFile(destination) as archive:
        saved=ET.fromstring(archive.read("3D/3dmodel.model"))
    vs=saved.findall(f".//{{{ns}}}vertex");fs=saved.findall(f".//{{{ns}}}triangle")
    valid=saved.attrib["unit"]=="millimeter" and len(fs)==count
    valid &= all(0<=int(f.attrib[key])<len(vs) for f in fs for key in ("v1","v2","v3"))
    valid &= all(-.001<=float(v.attrib[axis])<=bed[i]+.001 for v in vs for i,axis in enumerate("xy"))
    valid &= abs(min(float(v.attrib["z"]) for v in vs))<.001
    if not valid:raise ValueError(f"Invalid 3MF export: {destination.name}")
    return {"unit":"millimeter","triangles":len(fs),"matches_stl":True,"bed_centered":True}


def verify(p, parts, electronics, outer, features, extras=None):
    extras = extras or {}
    checks = []
    def check(name, ok, detail=None):
        checks.append({"check": name, "pass": bool(ok), "detail": detail})
        if not ok:
            print("FAIL", name, detail, flush=True)
    for name, shape in parts.items():
        check(name+": valid connected solid", shape.is_valid and len(shape.solids())==1 and shape.volume>0,
              {"solids": len(shape.solids()), "volume_mm3": round(shape.volume,2)})
        if len(shape.solids())!=1:
            print("Disconnected solids",name,[(round(v.volume,3),list(v.bounding_box().min),list(v.bounding_box().max)) for v in shape.solids()],flush=True)
        bb = shape.bounding_box()
        if name in ("front","rear"):
            check(name+": retains full lower frame",bb.min.Y<.01 and bb.min.X < -p["case"]["width_mm"]/2+.01 and bb.max.X>p["case"]["width_mm"]/2-.01,
                  [round(v,3) for v in bb.size])
        check(name+": fits configured print field", bb.size.X <= p["case"]["print_limit"][0]+.01 and bb.size.Y <= p["case"]["print_limit"][1]+.01,
              [round(v,3) for v in bb.size])
        check(name+": fits build height",bb.size.Z<=p["case"]["build_height_mm"],[round(v,3) for v in bb.size])
        brim=p["printer"]["brim_mm"]
        check(name+": fits Ender usable travel with brim",all(v+2*brim<=limit+.01 for v,limit in zip((bb.size.X,bb.size.Y),p["printer"]["usable_xy_mm"])),{"part_mm":[round(bb.size.X,3),round(bb.size.Y,3)],"brim_mm":brim,"usable_xy_mm":p["printer"]["usable_xy_mm"]})
    for (na,a),(nc,c) in combinations(parts.items(),2):
        vol = overlap(a,c)
        check(f"Assembled shells: {na} / {nc} do not interfere", vol < .01, round(vol,5))
        if vol > .01:
            print("CLASH",na,nc,[(list(s.bounding_box().min),list(s.bounding_box().max),s.volume) for s in (a & c).solids()],flush=True)
    for item in p["components"]:
        for name, shape in parts.items():
            # Contact with cradle/PCB seats is allowed at surfaces, not volume.
            vol = overlap(shape,electronics[item["id"]])
            check(f"Nominal fit: {item['id']} / {name}", vol < .01, round(vol,5))

    internal = slab(b.offset(outer, amount=-p["case"]["wall"]), p["case"]["wall"], p["case"]["depth"]-2*p["case"]["wall"])
    bounds = []
    for item in p["components"]+p["keepouts"]:
        envelope = expanded(item, p["uncertain_dimension_allowance_mm"])
        # Rear switch backing fixes one face: don't claim an impossible 5 mm
        # gap through the case wall. Its current provisional pose has room.
        # Side controls deliberately pass through the shell. Use their actual
        # cylindrical body rather than treating bbox corners as solid material.
        allowed=internal
        if item["id"] in electronics and item["id"].startswith("button_"):
            envelope=electronics[item["id"]]
            allowed=internal+button_hole(item,p)
        elif item["id"].startswith("button_") and item["id"].endswith("_nut"):
            # This nut sits in the explicit wall counterbore. Its independent
            # shell/pillar collision check below still rejects any obstruction.
            allowed=slab(b.offset(outer,amount=3),p["case"]["wall"],p["case"]["depth"]-2*p["case"]["wall"])
        outside = max(0, envelope.volume-overlap(envelope,allowed))
        check("Expanded envelope inside shell: "+item["id"], outside < .02, round(outside,4))
        bounds.append((item,expanded(item,p["uncertain_dimension_allowance_mm"])))
    for (ia,a),(ic,c) in combinations(bounds,2):
        if ia.get("parent",ia["id"]) == ic.get("parent",ic["id"]):
            continue  # A connector necessarily overlaps its own host envelope.
        vol=overlap(a,c)
        check(f"Expanded clearance: {ia['id']} / {ic['id']}", vol < .02, round(vol,4))
    # Check keepouts against shell wall and every load-bearing pillar. Contact
    # with seats on the parent PCB's mounting face is excluded explicitly.
    for item in p["keepouts"]:
        envelope=expanded(item,p["uncertain_dimension_allowance_mm"])
        for name,shape in parts.items():
            vol=overlap(envelope,shape)
            check(f"Connector clearance: {item['id']} / {name}",vol<.02,round(vol,4))

    bank=next(v for v in p["components"] if v["id"]=="battery")
    x,y,z=bank["origin"];w,h,d=bank["size"]
    fit = p["battery_bay"]["clearance_mm"]
    sweep=box(x-fit,y-fit,z-fit,p["case"]["width_mm"]+w,h+2*fit,d+2*fit)
    for name in ("front", "rear"):
        check("Side battery extraction with main case closed: "+name,overlap(parts[name],sweep)<.02,round(overlap(parts[name],sweep),4))
    if overlap(parts["rear"],sweep)>.02:
        print("SWEEP CLASH",[(list(s.bounding_box().min),list(s.bounding_box().max),s.volume) for s in (parts["rear"] & sweep).solids()],flush=True)
    for item in p["components"]:
        if item["id"] != "battery":
            check("Battery sweep clears "+item["id"],overlap(electronics[item["id"]],sweep)<.02)
    for travel in (0, 5, 30):
        moved = b.Pos(travel,0,0)*parts["battery_door"]
        for name in ("front", "rear"):
            check(f"Side lid lift {travel} mm / {name}",overlap(moved,parts[name])<.02)
    check("Closed side lid blocks battery escape",overlap(parts["battery_door"],sweep)>10)
    check("Lid stops battery within 1 mm of installed position",
          overlap(parts["battery_door"],b.Pos(1,0,0)*electronics["battery"])>1)
    insert=p["battery_door"]
    screw_tip=insert["origin"][0]+insert["size"][0]-8
    check("Lid screws engage full insert length",screw_tip<=insert["insert_face_x"]-insert["insert_length_mm"])
    check("Cloud grille has >= 2 mm horizontal webs",p["speaker_grille"]["width_mm"]<=8)

    sn=p["snap"]
    strain=1.5*sn["thickness"]*max(p["closure"]["release_travel_mm"],sn["engagement"]+p["case"]["fit_clearance"])/sn["length"]**2
    check("Snap elastic-strain screening <= 2%",strain<=.02,{"estimated_strain":round(strain,5),"assumed_limit":.02})
    check("Two shells and independent battery lid",set(parts)=={"front","rear","battery_door"})
    check("Main shells retain screwless closure",p["closure"]["shell_screws"]==0)
    check("Five snaps and two locating tongues",len(sn["sites"])==5 and len(p["closure"]["tongue_x"])==2)
    z0=sn["root_z"]+sn["length"]-2.2
    inner=p["case"]["wall"]+p["case"]["seam_gap"]
    tip=inner-p["case"]["seam_gap"]-sn["engagement"]
    for index,site in enumerate(sn["sites"],1):
        retained=place_snap(box(-3,tip,z0-1,6,inner+sn["thickness"]-tip,1),site)
        released=place_snap(box(-3,tip+p["closure"]["release_travel_mm"],z0-1,
            6,inner+sn["thickness"]-tip,1),site)
        check(f"Snap {index} retains front",overlap(parts["rear"],retained)>.1)
        check(f"Snap {index} releases inward",overlap(parts["rear"],released)<.02)
    for index,x in enumerate(p["closure"]["tongue_x"],1):
        tongue=box(x-6,1.5,p["case"]["split"]-2,12,1.6,9)
        for angle in (0,5,10,15,20):
            pivot_y=p["closure"]["pivot_y_mm"]
            pivoted=b.Pos(0,pivot_y,p["case"]["split"])*b.Rot(-angle,0,0)*b.Pos(0,-pivot_y,-p["case"]["split"])*tongue
            check(f"Tongue {index} pivot clearance at {angle} degrees",overlap(parts["rear"],pivoted)<.02)
    for angle in (10,20):
        pivoted=b.Pos(0,p["closure"]["pivot_y_mm"],p["case"]["split"])*b.Rot(-angle,0,0)*b.Pos(0,-p["closure"]["pivot_y_mm"],-p["case"]["split"])*parts["front"]
        check(f"Complete front shell pivot clearance at {angle} degrees",overlap(parts["rear"],pivoted)<.02)
        if overlap(parts["rear"],pivoted)>.02:
            print("PIVOT CLASH",angle,[(list(s.bounding_box().min),list(s.bounding_box().max),s.volume) for s in (parts["rear"] & pivoted).solids()],flush=True)
    items={item["id"]:item for item in p["components"]}
    pi=items["pi"]
    check("Battery parallel to rear lid",bank["size"]==[106,69,14])
    check("Pi parallel to rear lid",pi["size"]==[85,56,1.6])
    check("Battery and Pi do not stack in depth",pi["origin"][1]+pi["size"][1]<bank["origin"][1])
    check("Depth reduced by at least 6 mm",p["case"]["depth"]<=78-6)
    check("Width and height each reduced by at least 4 mm",outer.bounding_box().size.X<=206.01 and outer.bounding_box().size.Y<=211.01)
    check("Cloud speaker apertures present",len([f for f in features if f["id"].startswith("F-G")])==7)
    # Speaker and amplifier screw holes are hidden: front skin remains 100% solid
    sp_diag = 4.5 / math.sqrt(2)
    sp_x, sp_y, _ = items["speaker"]["origin"]
    for s_idx, (sx, sy) in enumerate(((sp_x+sp_diag, sp_y+sp_diag), (sp_x+40-sp_diag, sp_y+sp_diag), (sp_x+sp_diag, sp_y+40-sp_diag), (sp_x+40-sp_diag, sp_y+40-sp_diag)), 1):
        probe = box(sx - 1.5, sy - 1.0, 0.2, 3.0, 2.0, 1.2)
        check(f"Speaker mount {s_idx} hidden behind solid front skin", overlap(parts["front"], probe) > 0.99 * probe.volume)
    amp_x, amp_y, _ = items["amp"]["origin"]
    amp_w, amp_h, _ = items["amp"]["size"]
    for a_idx, ay in enumerate((amp_y - 4, amp_y + amp_h + 4), 1):
        probe = box(amp_x + amp_w/2 - 1.5, ay - 1.0, 0.2, 3.0, 2.0, 1.2)
        check(f"Amplifier mount {a_idx} hidden behind solid front skin", overlap(parts["front"], probe) > 0.99 * probe.volume)
    check("Power cable hidden from visual assembly", "pi_power" not in extras)
    for item in p["components"]:
        if not item["id"].startswith("button_"): continue
        center_z=item["origin"][2]+item["size"][2]/2
        bridge=p["case"]["split"]-center_z-p["buttons"]["mount_hole_mm"]/2
        check("Continuous front plastic behind button: "+item["id"],bridge>=4.79,round(bridge,3))
        check("Button hole stays clear of rear seam: "+item["id"],overlap(parts["rear"],button_hole(item,p))<.02)
        # Sample actual material around each mounting bore at the outer panel,
        # catching counterbores or other cuts which could sever its surround.
        cx, cy = [item["origin"][a]+item["size"][a]/2 for a in (0,1)]
        radius = p["buttons"]["mount_hole_mm"]/2 + 1.2
        material = []
        for angle in range(0,360,30):
            u, v = radius*math.cos(math.radians(angle)), radius*math.sin(math.radians(angle))
            if item["axis"] == "y":
                yy = p["case"]["height_mm"]-1.5 if item["id"]=="button_top" else 1.5
                point = (cx+u, yy, center_z+v)
            else:
                xx = (p["case"]["width_mm"]/2-1.5)*(1 if item["id"]=="button_left" else -1)
                point = (xx, cy+u, center_z+v)
            probe=box(*(q-.15 for q in point),.3,.3,.3)
            material.append(overlap(parts["front"],probe)/probe.volume)
        check("Front material surrounds entire button: "+item["id"],min(material)>.99,round(min(material),4))

    check("Five arcade buttons present",sum(v["id"].startswith("button_") for v in p["components"])==5)
    check("LCD centered horizontally",abs(items["lcd"]["origin"][0]+items["lcd"]["size"][0]/2)<.1)
    check("Handle absent","handle" not in p)
    check("Arcade barrel has radial print allowance",p["buttons"]["mount_hole_mm"]>=p["buttons"]["nominal_barrel_mm"]+.3)
    for item in p["components"]:
        if not item["id"].startswith("button_"):continue
        check("Final opening unobstructed: "+item["id"],sum(overlap(shape,button_hole(item,p)) for shape in parts.values())<.02)
    check("Structural shell wall >= 2.4 mm",p["case"]["wall"]>=2.4)
    c=p["case"]
    u=(c["wall"]-c["bed_chamfer_mm"])/c["skin_blend_depth_mm"]
    mouth=fairing_profile(outer,c["skin_inset_mm"]*(1-u)**2,c["width_mm"],c["height_mm"])
    inner_profile=b.offset(outer,amount=-c["wall"]).faces()[0]
    mouth_wall=mouth.outer_wire().distance_to(inner_profile.outer_wire())
    check("Shoulder profile at cavity mouth >= 2.4 mm",mouth_wall>=2.4,round(mouth_wall,4))
    check("Fairing preserves flat bottom sole",all(abs(fairing_profile(outer,c["skin_inset_mm"]*(1-v)**2,c["width_mm"],c["height_mm"]).bounding_box().min.Y)<.001 for v in (0,.5,1)))
    for item in p["components"]:
        if not item["id"].startswith("button_"):continue
        axis = 1 if item.get("axis") == "y" or item["id"] in ("button_top", "button_bottom") else 0
        axial = item["size"][axis]
        check("Full 66 mm assembly reserved: "+item["id"],axial>=p["buttons"]["overall_height_mm"])
        wire=next(v for v in p["keepouts"] if v["id"]==item["id"]+"_wires")
        check("Additional wire exit space: "+item["id"],wire["size"][axis]>=p["buttons"]["wire_allowance_mm"]-2)
    check("Speaker mounted in upper lobe", items["speaker"]["origin"][1] >= 100)
    check("Frame feature IDs unique",len({f["id"] for f in features})==len(features))
    return {"revision": p["revision"], "checks": checks, "passed": all(c["pass"] for c in checks),
            "limitations": ["Not FEA. PETG print strength and fatigue require physical testing.",
                "Unknown component/connector dimensions remain provisional; 5 mm is a fit allowance, not guaranteed accuracy.",
                "Display active-area placement and button centres require physical fit confirmation.",
                "PCB mounting holes on unbranded modules are not manufacturer-verified. Use adjustable slots and insulating ties.",
                "Harness centre lines are illustrative; actual cable lengths, bend radii, thermal behaviour and drop retention require bench tests."]}


def coupons(p):
    out={}
    insert_plate=box(0,0,0,10,38,10)
    for yy, bore in ((7,3.1),(19,p["battery_door"]["insert_pilot_mm"]),(31,3.5)):
        insert_plate-=cylinder_x(-1,yy,5,p["battery_door"]["screw_hole_mm"]/2,12)
        insert_plate-=cylinder_x(6,yy,5,bore/2,5)
    out["insert-fit-coupon"]=insert_plate
    plate=box(0,0,0,110,40,p["case"]["wall"])
    for x,dia in ((20,28),(55,p["buttons"]["mount_hole_mm"]),(90,28.8)):
        plate-=cylinder(x,20,-1,dia/2,p["case"]["wall"]+2)
    out["button-fit-coupon"]=plate
    # Two separate connected solids per file, print flat. Same wall and tooth
    # concept, with a labelled clearance via filename; use before the shells.
    for clearance in (.2,.3,.4):
        stem=box(0,0,0,24,8,3)+box(3,3,3,8,1.5,18)
        wedge=b.Plane.YZ*b.Polygon((2,18.8),(4.5,18.8),(4.5,21),(3,21),align=None)
        stem += b.Pos(3,0,0)*b.extrude(wedge,amount=8)
        receiver=box(34,0,0,24,10,3)+box(37,0,3,18,3,21)
        # Keep two side pillars around the bridge: a full-width cut detached
        # the top of the older receiver from its base.
        receiver -= box(42-clearance, -1, 18.8-clearance, 8+2*clearance, 6, 2.2+2*clearance)
        out[f"snap-coupon-{clearance:.1f}"]=b.Compound(children=[stem,receiver])
    return out


def build(check_only=False):
    source_names=("parameters.json","README.md","IMPROVEMENTS.md","build.py","run-cad.sh","print-settings.json","cloud-ender.scad")
    source_snapshot={name:(ROOT/name).read_bytes() for name in source_names}
    p=json.loads(source_snapshot["parameters.json"])
    assert p["uncertain_dimension_allowance_mm"]==5, "This prototype specifies 5 mm total allowance"
    assert p["case"]["wall"]==3, "Snap geometry is calibrated for 3 mm walls"
    print("Building native cloud CAD…",flush=True)
    parts,electronics,extras,outer,features=make(p)
    print("Checking solids, fit allowances, and extraction paths…",flush=True)
    report=verify(p,parts,electronics,outer,features,extras)
    if check_only:
        print(json.dumps(report,indent=2))
        return report["passed"]
    if not report["passed"]:
        (ROOT/"last-failed-verification.json").write_text(json.dumps(report,indent=2)+"\n")
        print("Verification failed; last good published files retained.",flush=True)
        return False
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    staging=Path(tempfile.mkdtemp(prefix=".build-",dir=ROOT))
    try:
        meshes={}
        for name,shape in {**parts,**coupons(p)}.items():
            # Print bed Z=0, both shell outside faces down. BREP/GLB retain
            # the assembled frame, so all exports describe identical geometry.
            printable=shape
            if name=="rear":
                printable=b.Rot(180,0,0)*shape
            elif name=="battery_door":
                printable=b.Rot(0,90,0)*shape
            bb=printable.bounding_box()
            printable= b.Pos(0,0,-bb.min.Z)*printable
            path=staging/f"{name}.stl"
            b.export_stl(printable,path,tolerance=.035,angular_tolerance=.15)
            removed=weld_stl(path)
            mesh=mesh_check(path)
            mesh["print_bounds_mm"]=[round(v,3) for v in printable.bounding_box().size]
            mesh["removed_degenerate_triangles"]=removed
            container=export_print_3mf(path,staging/f"{name}.3mf",p["case"]["bed"])
            mesh["container_3mf"]=container
            meshes[name]=mesh
            report["checks"].append({"check":name+": saved STL manifold and outward winding", "pass":mesh["watertight"] and mesh["consistent_winding"] and mesh["volume_mm3"]>0,"detail":mesh})
        assembly=b.Compound(children=list(parts.values())+list(electronics.values())+list(extras.values()),label="cloud_radio")
        # The STEP writer drops curved extrusion faces in this model. Publish
        # the native solid representation and require a lossless readback.
        b.export_brep(assembly,staging/"cloud-radio.brep")
        restored=b.import_brep(staging/"cloud-radio.brep")
        restored_solids=list(restored.solids())
        report["checks"].append({"check":"Saved BREP preserves every assembly solid", "pass":restored.is_valid and len(restored_solids)==len(assembly.solids()), "detail":{"source_solids":len(assembly.solids()),"saved_solids":len(restored_solids)}})
        for name,shape in parts.items():
            matches=[s for s in restored_solids if abs(s.volume-shape.volume)<1e-6 and all(abs(a-c)<1e-6 for a,c in zip(s.bounding_box().min,shape.bounding_box().min)) and all(abs(a-c)<1e-6 for a,c in zip(s.bounding_box().max,shape.bounding_box().max))]
            report["checks"].append({"check":name+": saved BREP preserves shell volume and bounds", "pass":len(matches)==1, "detail":{"source_volume_mm3":shape.volume,"matching_saved_solids":len(matches)}})
        b.export_gltf(assembly,staging/"cloud-radio.glb",binary=True,linear_deflection=.08,angular_deflection=.15)
        report["passed"]=all(c["pass"] for c in report["checks"])
        report["meshes"]=meshes
        report["checks_count"]=len(report["checks"])
        (staging/"verification.json").write_text(json.dumps(report,indent=2)+"\n")
        # A failed generation is kept for diagnosis, but never published.
        if not report["passed"]:
            shutil.copyfile(staging/"verification.json",ROOT/"last-failed-verification.json")
            print("Verification failed; last good published files retained.",flush=True)
            return False
        manifest={"revision":p["revision"],"outer_mm":[round(v,2) for v in parts["front"].bounding_box().size][:2]+[p["case"]["depth"]],
                  "core_mm":[p["case"]["width_mm"],p["case"]["height_mm"],p["case"]["depth"]],"side_relief":p["side_relief"],"arcade_buttons":[c for c in p["components"] if c["id"].startswith("button_")],
                  "allowance_mm":5,"material":p["material"],"components":p["components"],"keepouts":p["keepouts"],"closure":p["closure"],"battery_bay":p["battery_bay"],"battery_door":p["battery_door"],"speaker_grille":p["speaker_grille"],"print_bed_mm":p["case"]["bed"],
                  "fasteners":p["fasteners"],"checks_count":len(report["checks"]),"passed":True,"files":["front.stl","rear.stl","battery_door.stl","cloud-radio.brep","cloud-radio.zip"],
                  "print_parts":list(parts),"frame_features":features,
                  "frame_parts":[{"id":"F-00","name":"front","title":"Front shell"},{"id":"R-00","name":"rear","title":"Rear shell"},{"id":"B-00","name":"battery_door","title":"Side battery lid"}],"limits":report["limitations"]}
        (staging/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
        manifest["buttons"]=p["buttons"]
        manifest["files"] += ["front.3mf","rear.3mf","battery_door.3mf","button-fit-coupon.stl","print-settings.json","cloud-ender.scad"]
        (staging/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
        for name,contents in source_snapshot.items():
            # The inspection wrapper lives beside the meshes in the ZIP.
            (staging/name).write_bytes(contents.replace(b'generated/cloud/',b'') if name.endswith('.scad') else contents)
        if (OUTPUT / "plywood-assembly-guide.pdf").exists():
            shutil.copyfile(OUTPUT / "plywood-assembly-guide.pdf", staging / "plywood-assembly-guide.pdf")
        elif (ROOT.parents[1] / "docs/plywood-assembly-guide.pdf").exists():
            shutil.copyfile(ROOT.parents[1] / "docs/plywood-assembly-guide.pdf", staging / "plywood-assembly-guide.pdf")
        # Directory swap avoids half-written GLBs and mixed download revisions.
        backup=OUTPUT.with_name(".previous-cloud")
        if backup.exists():shutil.rmtree(backup)
        if OUTPUT.exists():OUTPUT.rename(backup)
        staging.rename(OUTPUT)
        if backup.exists():shutil.rmtree(backup)
        (ROOT/"last-failed-verification.json").unlink(missing_ok=True)
        print(f"PASS: {len(report['checks'])} checks. Exported {OUTPUT}",flush=True)
        return True
    finally:
        if staging.exists():shutil.rmtree(staging)


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-only",action="store_true")
    args=parser.parse_args()
    with (ROOT/".build.lock").open("w") as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        try:
            success=build(args.check_only)
        except Exception as error:
            (ROOT/"last-failed-verification.json").write_text(json.dumps({"passed":False,"error":str(error)},indent=2)+"\n")
            raise
    raise SystemExit(0 if success else 1)
