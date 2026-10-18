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

from cadgen import build123d as b

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "generated" / "cloud"
COLORS = {"front": "#86bfea", "rear": "#70acd9", "battery_door": "#fff0b5"}


def box(x, y, z, w, h, d):
    return b.Pos(x, y, z) * b.Box(w, h, d, align=(b.Align.MIN,) * 3)


def cylinder(x, y, z, r, height):
    return b.Pos(x, y, z) * b.Cylinder(r, height, align=(b.Align.CENTER, b.Align.CENTER, b.Align.MIN))


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
    return box(*origin, *size)


def cloud_profile():
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
    edges = []
    for points in segments:
        curve = b.Line(*points) if len(points)==2 else b.Bezier(*points)
        edges.extend(curve.edges())
    return b.Face(b.Wire(edges))


def handle_profile(p):
    h = p["handle"]
    return rr(h["center"][0]-h["opening"][0]/2, h["center"][1]-h["opening"][1]/2,
              *h["opening"], h["opening"][1]/2-.01)


def rounded_rim(profile, surface_z, radius, direction=1, opening=False):
    # Parallel profiles follow a quarter circle. A native smooth loft avoids
    # OCCT rolling-ball failures at tangent joins between the cloud lobes.
    sections=[]
    for i in range(9):
        angle=(math.pi/2)*i/8
        z=radius*(1-math.cos(angle))
        inset=radius*(1-math.sin(angle))
        face=b.offset(profile,amount=inset if opening else -inset) if inset>1e-8 else profile
        sections.append(b.Pos(0,0,surface_z+direction*z)*face)
    return b.loft(sections)


def door_profile():
    # Horizontal door stays below the carry handle. Its right ear gives access
    # to the bank's side-facing USB-C plug without entering the handle crown.
    return rr(-59, 3.5, 118, 81.5, 6) + rr(50, 26, 38, 59, 6)


def shoulder_profile(p):
    """Closed YZ roof: rounded body, concave handle roots, and round crown.

    The roof extends across the entire cloud width. There are no rectangular
    side recesses, residual horns, or open pockets beside the handle.
    """
    h,c=p["handle"],p["case"]
    sh=h["shoulder"]
    y,r,root,cap=sh["height"],sh["front_radius"],sh["root_radius"],sh["crown_radius"]
    mid=c["split"]+c["seam_gap"]/2
    lo,hi=mid-h["grip_depth"]/2,mid+h["grip_depth"]/2
    top=190
    depth=c["depth"]
    k=.5522847498307936
    # Coordinates below are (depth Z, height Y), then mapped to Plane.YZ.
    segments=[
        [(0,-10),(0,y-r)],
        [(0,y-r),(0,y-r+k*r),(r-k*r,y),(r,y)],
        [(r,y),(lo-root,y)],
        [(lo-root,y),(lo-root+k*root,y),(lo,y+root-k*root),(lo,y+root)],
        [(lo,y+root),(lo,top-cap)],
        [(lo,top-cap),(lo,top-cap+k*cap),(mid-k*cap,top),(mid,top)],
        [(mid,top),(mid+k*cap,top),(hi,top-cap+k*cap),(hi,top-cap)],
        [(hi,top-cap),(hi,y+root)],
        [(hi,y+root),(hi,y+root-k*root),(hi+root-k*root,y),(hi+root,y)],
        [(hi+root,y),(depth-r,y)],
        [(depth-r,y),(depth-r+k*r,y),(depth,y-r+k*r),(depth,y-r)],
        [(depth,y-r),(depth,-10)],[(depth,-10),(0,-10)],
    ]
    edges=[]
    for points in segments:
        points=[(yy,zz) for zz,yy in points]
        curve=b.Line(*points) if len(points)==2 else b.Bezier(*points)
        edges.extend(curve.edges())
    return b.Plane.YZ * b.Face(b.Wire(edges))


def shoulder_envelopes(p,outer):
    profile=shoulder_profile(p)
    roof=b.Pos(-110,0,0)*b.extrude(profile,amount=220)
    # Offset the actual curved roof in its own plane to preserve wall thickness.
    inner_profile=b.offset(profile,amount=-p["case"]["wall"])
    cavity=b.Pos(-110,0,0)*b.extrude(inner_profile,amount=220)
    outer_solid=slab(outer,0,p["case"]["depth"]) & roof
    inside=b.offset(outer,amount=-p["case"]["wall"])
    inner_solid=slab(inside,0,p["case"]["depth"]) & cavity
    return roof,outer_solid-inner_solid


def place_snap(shape, site):
    x, y, angle = site
    return b.Pos(x, y, 0) * b.Rot(0, 0, angle) * shape


def nut_pocket(x, y, z):
    # DIN 934 M3: 5.5 AF, 2.4 high; 0.2 mm allowance on flats.
    pocket = slab(b.Pos(x, y) * b.RegularPolygon(5.7 / math.sqrt(3), 6), z, 2.7)
    # Side loading leaves a roof above the nut so the screw clamps both shells.
    return pocket + box(x-7 if x>0 else x, y-2.85, z, 7, 5.7, 2.7)


def slotted_pad(cx, cy, top, axis="x"):
    pad = box(cx - 5.5, cy - 4, 3, 11, 8, top - 3)
    profile = rr(cx - 4, cy - 1.5, 8, 3, 1.49)
    if axis == "y":
        profile = b.Pos(cx, cy) * b.Rot(0, 0, 90) * rr(-4, -1.5, 8, 3, 1.49)
    return pad - slab(profile, -1, top + 2)


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
    outer = cloud_profile()
    inside = b.offset(outer, amount=-t)
    ring = outer - inside
    radius=c["edge_radius"]
    front = rounded_rim(outer,0,radius) + slab(outer,radius,t-radius) + slab(ring,t,split-t)
    rear = slab(ring,split+gap,depth-t-split-gap) + slab(outer,depth-t,t-radius) + rounded_rim(outer,depth,radius,-1)
    handle = handle_profile(p)
    handle_ring = b.offset(handle, amount=p["handle"]["wall"]) - handle
    front += slab(handle_ring, t, split-t)
    rear += slab(handle_ring, split+gap, depth-t-split-gap)
    front -= slab(handle, -1, depth+2)
    rear -= slab(handle, -1, depth+2)
    front -= rounded_rim(handle,0,radius,opening=True)
    rear -= rounded_rim(handle,depth,radius,-1,opening=True)
    lip = b.offset(outer, amount=-t-gap) - b.offset(outer, amount=-t-1.5)
    lip = slab(lip, split, 3)

    # Free cantilevers live INSIDE the wall; roots alone connect to the shell.
    for site in sn["sites"]:
        lip -= place_snap(box(-6, -1, split - .1, 12, 9, 3.2), site)
    front += slab(outer-b.offset(outer,amount=-t-1.5), split-1.5, 1.5)
    front += lip
    for index,site in enumerate(sn["sites"],1):
        stem = box(-sn["width"]/2, t + gap, sn["root_z"], sn["width"], sn["thickness"], sn["length"])
        root = box(-sn["width"]/2-1, 1, sn["root_z"]-3, sn["width"]+2, t+gap+sn["thickness"]-1, 3.1)
        inner = t + gap
        tip = inner - (gap + sn["engagement"])
        z0 = sn["root_z"] + sn["length"] - 2.2
        wedge = b.Plane.YZ * b.Polygon((tip, z0), (inner + sn["thickness"], z0),
                                     (inner + sn["thickness"], z0+2.2), (inner, z0+2.2), align=None)
        hook = b.Pos(-sn["width"]/2, 0, 0) * b.extrude(wedge, amount=sn["width"])
        front += record(place_snap(stem + root + hook, site),f"F-N{index:02}","Snap hook","front")
        rear -= place_snap(box(-sn["width"]/2-.4, -1, z0-.3, sn["width"]+.8, 7, 2.8), site)

    items = {v["id"]: v for v in p["components"]}
    lcd = items["lcd"]
    lx, ly, lz = lcd["origin"]
    # Official drawing: active area position inferred from the dimensioned view;
    # 0.5 mm per edge display clearance. Hole pitch is authoritative.
    front -= slab(rr(lx + 1.7, ly + 10.3, 31.6, 41.8, 1), -1, t+2)
    for index,(x,y) in enumerate(((x,y) for x in (lx+2.5,lx+32.5) for y in (ly+2.5,ly+55.5)),1):
        front += record(cylinder(x,y,t,2.4,lz-t),f"F-L{index:02}","LCD mounting post","front")
        front -= cylinder(x, y, 1, 1.1, lz+1)

    # 6 Arcade Push Buttons (28 mm diameter mounting hole, 33 mm bezel):
    # 1 top, 1 bottom, 1 left of screen, 1 right of screen, 1 left side wall, 1 right side wall
    front -= record(cylinder(0, 118, -1, 14, t+2), "F-BTN01", "Top arcade button hole 28 mm", "front")
    front -= record(cylinder(0, 20, -1, 14, t+2), "F-BTN02", "Bottom arcade button hole 28 mm", "front")
    front -= record(cylinder(48, 68, -1, 14, t+2), "F-BTN03", "Left arcade button hole 28 mm", "front")
    front -= record(cylinder(-48, 68, -1, 14, t+2), "F-BTN04", "Right arcade button hole 28 mm", "front")

    # 2 side wall arcade buttons (28 mm diameter mounting hole)
    side_left_hole = b.Pos(105, 50, 21.5) * b.Rot(0, 90, 0) * b.Cylinder(14, 60, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER))
    front -= record(side_left_hole, "F-BTN05", "Left side arcade button hole 28 mm", "front")
    side_right_hole = b.Pos(-105, 50, 21.5) * b.Rot(0, 90, 0) * b.Cylinder(14, 60, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER))
    front -= record(side_right_hole, "F-BTN06", "Right side arcade button hole 28 mm", "front")

    diagonal = 4.5 / math.sqrt(2)
    speaker = items["speaker"]
    sx, sy, sz = speaker["origin"]
    for dx in range(-12, 13, 6):
        for dy in range(-12, 13, 6):
            if math.hypot(dx, dy) <= 13:
                front -= cylinder(sx+20+dx, sy+20+dy, -1, 1.8, t+2)
    for index,(x,y) in enumerate(((x,y) for x in (sx+diagonal,sx+40-diagonal) for y in (sy+diagonal,sy+40-diagonal)),1):
        front += record(slotted_pad(x,y,sz),f"F-SP{index:02}","Speaker mounting slot","front")

    amp = items["amp"]
    ax, ay, az = amp["origin"]
    aw, ah, _ = amp["size"]
    for index,yy in enumerate((ay-4,ay+ah+4),1):
        front += record(slotted_pad(ax+aw/2,yy,az),f"F-AMP{index:02}","Amplifier support slot","front")

    # The battery cradle is supported from the perimeter. Upper shelves grow
    # inward from the side walls; no tall towers stand between the controls.
    for index,side in enumerate((-1,1),1):
        x=side*57.5
        base=cylinder(x,5.5,t,3,57.5-t) & slab(inside,t,57.5-t)
        base += box(x-4,1.5,57.5,8,8,3) & slab(inside,57.5,3)
        front += record(base,f"F-B{index:02}","Battery lower edge support","front")
        shelf=box(-105 if side<0 else 53.5,77.5,57.5,51.5,8,3) & slab(outer,57.5,3)
        shelf -= box(side*90-1.5,79.7,57,3,3.6,4)
        rear += record(shelf,f"R-B{index+2:02}","Battery wall shelf and strap slot","rear")
        front += record(box(x-2,3.5,60.5,4,4,19),f"F-BF{index}1","Battery lower retaining fence","front")
        rear += record(box(x-2,79.5,60.5,4,4,19),f"R-BF{index}2","Battery upper retaining fence","rear")
        front -= box(x-1.5,3.7,53.5,3,3.6,2)

    # Pi back-mounted: official 58 x 49 pitch, components toward the front.
    px, py, pz = items["pi"]["origin"]
    for index,(x,y) in enumerate(((x,y) for x in (px+3.5,px+61.5) for y in (py+3.5,py+52.5)),1):
        rear += record(cylinder(x,y,pz+1.6,2.7,depth-t-pz-1.6),f"R-P{index:02}","Raspberry Pi mounting post","rear")
        rear -= cylinder(x, y, pz+.6, 1.1, depth-pz)

    # QUARKZMAN housing clamped with insulated ties. Two rows of 5 mm travel.
    sw = items["switch"]
    wx, wy, wz = sw["origin"]
    ww, wh, wd = sw["size"]
    rear -= slab(rr(wx+ww/2-8, wy+wh/2-12, 16, 24, 5), depth-t-1, t+2)
    # The third lug sits ABOVE the bank removal path. A symmetric right lug
    # would block extraction even when it clears the bank in its installed pose.
    for index,(x,y) in enumerate(p["switch_lugs"],1):
        lug = box(x-3, y-4, 77, 6, 8, depth-t-77)
        lug -= box(x-1.5, y-2.5, 76, 3, 5, 4)
        rear += record(lug,f"R-SW{index:02}","Switch retaining slot","rear")

    # Shell screws sit beside the outer wall. The bosses meet at the shell
    # split; their outer flanks merge into the perimeter wall for support.
    for index,(x,y) in enumerate(p["exterior_screws"],1):
        front += record(cylinder(x,y,t,5.2,split-t),f"F-S{index:02}","Perimeter case screw post","front")
        front -= cylinder(x,y,28,1.7,split-27)
        front -= nut_pocket(x,y,32)
        rear += record(cylinder(x,y,split+gap,5.2,depth-t-split-gap),f"R-S{index:02}","Perimeter case screw receiver","rear")
        rear -= cylinder(x,y,split,1.7,depth-split+1)
        rear -= cylinder(x,y,depth-2.5,3.2,3.5)
    # Keep the front alignment lip free of the new wall-connected receivers.
    lip_clear=b.offset(outer,amount=-t)-b.offset(outer,amount=-t-1.5-gap)
    rear -= slab(lip_clear,split,3+gap)

    dp = door_profile()
    door_clear = b.offset(dp, amount=gap)
    rear -= slab(door_clear, depth-t-.01, t+1)
    # A 2 mm deep, 2.5 mm wide rebate supports the door; opening beneath it
    # still exceeds battery + 5 mm and the plug extraction envelope.
    ledge = b.offset(dp,amount=2.5) - b.offset(dp, amount=-2.5)
    rear += slab(ledge, depth-t-2, 2)
    door = slab(dp, depth-t, t)
    for index,x in enumerate((-42,32),1):
        tab = box(x-5,2,depth-t-1.8,10,5,1.8)
        door += record(tab,f"B-T{index:02}","Battery door retaining tab","battery_door")
        rear -= box(x-5.3,1.7,depth-t-2.1,10.6,5.6,2.2)
    dx, dy = p["battery_door_screw"]
    rear += record(cylinder(dx,dy,depth-13,5.2,10),"R-D01","Battery door screw receiver","rear")
    rear -= nut_pocket(dx, dy, depth-11)
    rear -= cylinder(dx, dy, depth-15, 1.7, 13)
    door -= cylinder(dx, dy, depth-4, 1.7, 5)
    door -= cylinder(dx, dy, depth-2.5, 3.2, 3.5)
    # Adult lifting notch beside the door screw, no separate pull tab.
    door -= cylinder(76,85,depth-1.2,5,2)

    # Small protected rear vent slots over the Pi; not behind the battery.
    for x in range(-34,35,8):
        rear -= slab(rr(x, 110, 3, 18, 1.4), depth-t-1, t+2)

    # Preserve the through-opening after adding the shell alignment lip.
    front -= slab(handle,-1,depth+2)
    rear -= slab(handle,-1,depth+2)

    # Replace the cut-away crown with a closed rounded roof. Its smooth
    # concave roots lift the handle from the body at the centre of the depth.
    lower_region=box(-110,-1,-1,220,141,depth+2)
    lower_before={"front":front & lower_region,"rear":rear & lower_region}
    roof,skin=shoulder_envelopes(p,outer)
    # Add only the new roof skin. Lower walls keep their existing battery
    # door, snap receiver windows, and fastener reliefs.
    skin &= box(-110,p["handle"]["shoulder"]["height"]-12,-1,220,70,depth+2)
    front &= roof
    rear &= roof
    front += skin & box(-110,-10,0,220,220,split)
    rear_skin=skin & box(-110,-10,split+gap,220,220,depth-split-gap)
    # The default union can return an empty shape at these nearly coincident
    # curved faces. Glue matching surfaces at a 0.00001 mm Boolean tolerance
    # and independently require all lower-frame material to remain.
    rear_base=rear
    rear=rear_base.fuse(rear_skin,glue=True,tol=.00001)
    if not rear or rear.volume<rear_base.volume-.02:
        debug=ROOT/".build-debug"
        debug.mkdir(exist_ok=True)
        b.export_brep(rear_base,debug/"rear-base.brep")
        b.export_brep(rear_skin,debug/"rear-roof.brep")
        raise ValueError("Rear roof union removed existing case material")
    # The solid handle bridges the outer crown and the rim of the opening.
    # Only the upper crown is solid; the electronics remain in a hollow case.
    raised=box(-110,p["handle"]["shoulder"]["height"],0,220,60,depth)
    crown=slab(outer,0,depth) & roof & raised
    front += crown & box(-110,140,0,220,70,split)
    rear += crown & box(-110,140,split+gap,220,70,depth-split-gap)
    front -= slab(handle,-1,depth+2)
    rear -= slab(handle,-1,depth+2)
    # End the original planar alignment lip below the curved roof. The other
    # perimeter sections and four snaps continue to align the two shells.
    front -= box(-110,p["handle"]["shoulder"]["height"]-t,split,220,65,3.1)
    middle=split+gap/2
    grip_start=middle-p["handle"]["grip_depth"]/2
    grip_end=middle+p["handle"]["grip_depth"]/2
    front -= rounded_rim(handle,grip_start,radius,opening=True)
    rear -= rounded_rim(handle,grip_end,radius,-1,opening=True)
    record(front & raised,"F-H01","Rounded front handle and shoulder","front")
    record(rear & raised,"R-H01","Rounded rear handle and shoulder","rear")

    for name,shape in (("front",front),("rear",rear)):
        # Compare actual missing/added regions rather than subtracting two
        # large curved-solid volume integrals, which have numerical noise.
        missing=lower_before[name]-shape
        added=(shape & lower_region)-lower_before[name]
        missing_volume=sum(v.volume for v in missing.solids()) if missing else 0
        added_volume=sum(v.volume for v in added.solids()) if added else 0
        if missing_volume>.02 or added_volume>.02:
            debug=ROOT/".build-debug"
            debug.mkdir(exist_ok=True)
            if missing:b.export_brep(missing,debug/f"{name}-missing.brep")
            if added:b.export_brep(added,debug/f"{name}-added.brep")
            raise ValueError(f"{name}: shoulder changed lower frame (missing {missing_volume}, added {added_volume} mm3)")
    # Rounded caps only add material outside the original core. The shallow
    # anchor stays within the existing wall; shoulders and the joint are masked.
    relief=p["side_relief"]
    protected=slab(b.offset(outer,amount=-relief["anchor"]),-1,depth+2)
    wire=outer.outer_wire()
    samples=[wire.position_at(i/1600) for i in range(1601)]
    core_parts={"front":front,"rear":rear}
    for name,depths in (("front",relief["front_depths"]),("rear",relief["rear_depths"])):
        shape=core_parts[name]
        mask=box(-110,8,5 if name=="front" else 52,220,126,32 if name=="front" else 29)
        for side in (-1,1):
            for row,y in enumerate(relief["rows"]):
                point=min((v for v in samples if side*v.X>75),key=lambda v:abs(v.Y-y))
                # Outward normal from neighbouring points on the native wire.
                u=min(range(len(samples)),key=lambda i:(samples[i]-point).length)
                tangent=samples[min(u+1,1600)]-samples[max(0,u-1)]
                nx,ny=tangent.Y,-tangent.X
                length=math.hypot(nx,ny);nx/=length;ny/=length
                if nx*side<0:nx,ny=-nx,-ny
                for z in depths:
                    r=relief["radius"]+(row%2)
                    cap=b.Pos(point.X-nx*(r-relief["protrusion"]),point.Y-ny*(r-relief["protrusion"]),z)*b.Sphere(r)
                    cap=(cap-protected) & mask
                    shape=shape.fuse(cap)
            # One ID per side keeps the frame reference readable.
        addition=shape-core_parts[name]
        if overlap(addition,protected)>.02:
            raise ValueError("Side relief entered the protected core")
        if overlap(addition,box(-120,140,-1,240,70,depth+2))>.02:
            raise ValueError("Side relief changed the handle or shoulders")
        record(addition,"F-C01" if name=="front" else "R-C01","Rounded cumulus side relief",name)
        if name=="front":front=shape
        else:rear=shape
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
            shape = box(x, y, z, w, h, 1.6)
            for hx in (x+3.5, x+61.5):
                for hy in (y+3.5, y+52.5):
                    shape -= cylinder(hx, hy, z-1, 1.375, 4)
        elif item["id"] == "lcd":
            shape = box(x, y, z, w, h, 1.6)
            for hx in (x+2.5, x+w-2.5):
                for hy in (y+2.5, y+h-2.5):
                    shape -= cylinder(hx, hy, z-1, 1.5, 4)
        elif item["id"].startswith("button_"):
            if "side" not in item["id"]:
                cx = x + w / 2
                cy = y + h / 2
                shape = cylinder(cx, cy, 3, 13.8, d)
            elif "left" in item["id"]:
                cy = y + h / 2
                cz = z + d / 2
                shape = b.Pos(x + w / 2, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(13.8, w, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER))
            else:
                cy = y + h / 2
                cz = z + d / 2
                shape = b.Pos(x + w / 2, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(13.8, w, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER))
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
        if "side" not in btn["id"]:
            cx = btn["origin"][0] + btn["size"][0] / 2
            cy = btn["origin"][1] + btn["size"][1] / 2
            extras[f"bezel_{btn['id']}"] = color(cylinder(cx, cy, -3, 16.5, 3), f"bezel_{btn['id']}", "#1e293b")
            extras[f"cap_{btn['id']}"] = color(cylinder(cx, cy, -4, 12, 2.5), f"cap_{btn['id']}", btn["color"])
        elif "left" in btn["id"]:
            cy = btn["origin"][1] + btn["size"][1] / 2
            cz = btn["origin"][2] + btn["size"][2] / 2
            extras[f"bezel_{btn['id']}"] = color(b.Pos(104.5, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(16.5, 3, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER)), f"bezel_{btn['id']}", "#1e293b")
            extras[f"cap_{btn['id']}"] = color(b.Pos(106.5, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(12, 2.5, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER)), f"cap_{btn['id']}", btn["color"])
        else:
            cy = btn["origin"][1] + btn["size"][1] / 2
            cz = btn["origin"][2] + btn["size"][2] / 2
            extras[f"bezel_{btn['id']}"] = color(b.Pos(-104.5, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(16.5, 3, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER)), f"bezel_{btn['id']}", "#1e293b")
            extras[f"cap_{btn['id']}"] = color(b.Pos(-106.5, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(12, 2.5, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER)), f"cap_{btn['id']}", btn["color"])
    for item in p["keepouts"]:
        extras[item["id"]] = color(box(*item["origin"], *item["size"]), "connector_"+item["id"], "#5b6670")

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


def verify(p, parts, electronics, outer, features):
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
            check(name+": retains full lower frame",bb.min.Y<.01 and bb.min.X < -104.9 and bb.max.X>104.9,
                  [round(v,3) for v in bb.size])
        check(name+": fits configured print field", bb.size.X <= p["case"]["print_limit"][0]+.01 and bb.size.Y <= p["case"]["print_limit"][1]+.01,
              [round(v,3) for v in bb.size])
    for (na,a),(nc,c) in combinations(parts.items(),2):
        vol = overlap(a,c)
        check(f"Assembled shells: {na} / {nc} do not interfere", vol < .01, round(vol,5))
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
        outside = max(0, envelope.volume-overlap(envelope,internal))
        check("Expanded envelope inside shell: "+item["id"], outside < .02, round(outside,4))
        bounds.append((item,envelope))
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

    # Battery must translate straight out through the open door, after its plug
    # is disconnected. Test the complete swept +5 mm bank cross section.
    bank=next(v for v in p["components"] if v["id"]=="battery")
    x,y,z=bank["origin"];w,h,d=bank["size"]
    sweep=box(x-2.5,y-2.5,z-2.5,w+5,h+5,p["case"]["depth"]-z+40)
    for name in ("front","rear"):
        vol=overlap(parts[name],sweep)
        check("Battery removal +5 mm swept clearance: "+name,vol<.02,round(vol,4))
    # Simple beam screening, not FEA or a strength certification.
    sn=p["snap"]
    deflection=sn["engagement"]+p["case"]["fit_clearance"]
    strain=1.5*sn["thickness"]*deflection/sn["length"]**2
    check("Snap elastic-strain screening <= 2%",strain<=.02,{"estimated_strain":round(strain,5),"assumed_limit":.02})
    check("Four enclosure screw axes",len(p["exterior_screws"])==3 and len(p["battery_door_screw"])==2)
    items={item["id"]:item for item in p["components"]}
    check("Front layout: 6 arcade buttons present", len([c for c in p["components"] if c["id"].startswith("button_")]) == 6)
    check("LCD centered horizontally on front cover", abs(items["lcd"]["origin"][0]+items["lcd"]["size"][0]/2) < 0.1)
    hand_sweep=slab(handle_profile(p),-1,p["case"]["depth"]+2)
    for name,shape in parts.items():
        vol=overlap(shape,hand_sweep)
        check("Integrated handle through-opening: "+name,vol<.02,round(vol,4))
    check("Handle opening at least 64 x 22 mm",p["handle"]["opening"][0]>=64 and p["handle"]["opening"][1]>=22)
    check("Horizontal battery door remains below handle",parts["battery_door"].bounding_box().max.Y < p["handle"]["shoulder"]["height"]-20)
    check("Grip depth <= 20 mm",p["handle"]["grip_depth"]<=20)
    middle=p["case"]["split"]+p["case"]["seam_gap"]/2
    start=middle-p["handle"]["grip_depth"]/2
    end=middle+p["handle"]["grip_depth"]/2
    # The former four upright tips must be completely absent. These regions
    # cover both sides of the front and rear shoulder above the body roof.
    level=p["handle"]["shoulder"]["height"]
    root=p["handle"]["shoulder"]["root_radius"]
    for side,z,thickness in (("front",-1,start-root),("rear",end+root+1,p["case"]["depth"]-end-root)):
        for edge,x in (("left",-100),("right",40)):
            probe=box(x,level+.1,z,60,60,thickness)
            check(f"No raised side tip: {side} {edge}",sum(overlap(shape,probe) for shape in parts.values())<.02)
    # Measure the grasped crown above the finger opening. Rounded roots below
    # this band deliberately widen into the body for a continuous transition.
    crown=box(-100,p["handle"]["center"][1]+p["handle"]["opening"][1]/2+4,-1,200,40,p["case"]["depth"]+2)
    front_grip=parts["front"] & crown
    rear_grip=parts["rear"] & crown
    fb,rb=front_grip.bounding_box(),rear_grip.bounding_box()
    check("Handle centred on shell joint",abs((fb.min.Z+rb.max.Z)/2-middle)<.01)
    check("Equal handle depth in both shells",abs(fb.size.Z-rb.size.Z)<.01,
          {"front_mm":round(fb.size.Z,3),"rear_mm":round(rb.size.Z,3),"seam_mm":p["case"]["seam_gap"]})
    # Curved-surface offsets and lofts have a small numerical volume error.
    # Compare relative volumes as well as the exact depth and centring above.
    error=abs(front_grip.volume-rear_grip.volume)/max(front_grip.volume,rear_grip.volume)
    check("Front and rear grip volumes within 0.1%",error<.001,
          {"front_mm3":round(front_grip.volume,3),"rear_mm3":round(rear_grip.volume,3),"relative_error":round(error,7)})
    for index,(x,y) in enumerate(p["exterior_screws"],1):
        distance=outer.outer_wire().distance_to(b.Vertex(x,y,0))
        check(f"Case screw {index} beside perimeter wall",5.2<=distance<=p["case"]["wall"]+5.2,round(distance,3))
    check("Arcade button mounting holes: 28 mm diameter", all(b.get("diameter_mm") == 28 for b in p["components"] if b["id"].startswith("button_")))
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
    # Two separate connected solids per file, print flat. Same wall and tooth
    # concept, with a labelled clearance via filename; use before the shells.
    for clearance in (.2,.3,.4):
        stem=box(0,0,0,24,8,3)+box(3,3,3,8,1.5,18)
        wedge=b.Plane.YZ*b.Polygon((2,18.8),(4.5,18.8),(4.5,21),(3,21),align=None)
        stem += b.Pos(3,0,0)*b.extrude(wedge,amount=8)
        receiver=box(34,0,0,24,10,3)+box(37,0,3,8+2*clearance,3,21)
        receiver -= box(36, -1, 18.8-clearance, 10+2*clearance, 6, 2.2+2*clearance)
        out[f"snap-coupon-{clearance:.1f}"]=b.Compound(children=[stem,receiver])
    return out


def build(check_only=False):
    p=json.loads((ROOT/"parameters.json").read_text())
    assert p["uncertain_dimension_allowance_mm"]==5, "This prototype specifies 5 mm total allowance"
    assert p["case"]["wall"]==3, "Snap geometry is calibrated for 3 mm walls"
    print("Building native cloud CAD…",flush=True)
    parts,electronics,extras,outer,features=make(p)
    print("Checking solids, fit allowances, and extraction paths…",flush=True)
    report=verify(p,parts,electronics,outer,features)
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
            # Print bed Z=0, rear and door outside face down. STEP/GLB retain
            # the assembled frame, so all exports describe identical geometry.
            printable=shape
            if name in ("rear","battery_door"):
                printable=b.Rot(180,0,0)*shape
            bb=printable.bounding_box()
            printable= b.Pos(0,0,-bb.min.Z)*printable
            path=staging/f"{name}.stl"
            b.export_stl(printable,path,tolerance=.035,angular_tolerance=.15)
            removed=weld_stl(path)
            mesh=mesh_check(path)
            mesh["removed_degenerate_triangles"]=removed
            meshes[name]=mesh
            report["checks"].append({"check":name+": saved STL manifold and outward winding", "pass":mesh["watertight"] and mesh["consistent_winding"] and mesh["volume_mm3"]>0,"detail":mesh})
        assembly=b.Compound(children=list(parts.values())+list(electronics.values())+list(extras.values()),label="cloud_radio")
        b.export_step(assembly,staging/"cloud-radio.step")
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
                  "core_mm":[210,190,p["case"]["depth"]],"side_relief":p["side_relief"],"arcade_buttons":[c for c in p["components"] if c["id"].startswith("button_")],
                  "allowance_mm":5,"material":p["material"],"components":p["components"],"keepouts":p["keepouts"],"handle":p["handle"],
                  "fasteners":p["fasteners"],"checks_count":len(report["checks"]),"passed":True,"files":["front.stl","rear.stl","battery_door.stl","cloud-radio.step","cloud-radio.zip"],
                  "print_parts":list(parts),"frame_features":features,
                  "frame_parts":[{"id":"F-00","name":"front","title":"Front shell"},{"id":"R-00","name":"rear","title":"Rear shell"},{"id":"B-00","name":"battery_door","title":"Battery door"}],"limits":report["limitations"]}
        (staging/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
        for name in ("parameters.json","README.md","build.py","run-cad.sh"):
            shutil.copyfile(ROOT/name,staging/name)
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
