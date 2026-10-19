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
COLORS = {"front": "#86bfea", "rear": "#70acd9"}


def box(x, y, z, w, h, d):
    return b.Pos(x, y, z) * b.Box(w, h, d, align=(b.Align.MIN,) * 3)


def cylinder(x, y, z, r, height):
    return b.Pos(x, y, z) * b.Cylinder(r, height, align=(b.Align.CENTER, b.Align.CENTER, b.Align.MIN))


def button_hole(item, p):
    x,y,z=item["origin"];w,h,d=item["size"]
    radius=p["buttons"]["mount_hole_mm"]/2
    if "side" in item["id"]:
        return b.Pos(x+w/2,y+h/2,z+d/2)*b.Rot(0,90,0)*b.Cylinder(radius,100)
    return cylinder(x+w/2,y+h/2,-1,radius,p["case"]["wall"]+2)


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
        return b.Pos(*center)*b.Rot(0,90 if axis=="x" else 0,0)*b.Cylinder(size[1]/2,size[0] if axis=="x" else size[2])
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
    face=fairing_profile(profile,inset,210,c["height_mm"])
    skin=bed_chamfer(face,surface_z,ef,direction)
    sections=[]
    for i in range(9):
        u=i/8
        section=fairing_profile(profile,inset*(1-u)**2,210,c["height_mm"])
        sections.append(b.Pos(0,0,surface_z+direction*(ef+run*u))*section)
    return skin+b.loft(sections)


def place_snap(shape, site):
    x, y, angle = site
    return b.Pos(x, y, 0) * b.Rot(0, 0, angle) * shape


def cylinder_y(x,y,z,r,height):
    return b.Pos(x,y,z)*b.Rot(-90,0,0)*b.Cylinder(r,height,align=(b.Align.CENTER,b.Align.CENTER,b.Align.MIN))


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
        front -= record(button_hole(item,p),f"F-BTN{index:02}",
                        f"Arcade mounting hole {p['buttons']['mount_hole_mm']} mm","front")

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

    # Rear-integral U cradle: flat bank at the floor, Pi flat on its roof.
    shelf=p["shelf"]
    sy=shelf["battery_ceiling_y"]
    shelf_roof=box(-62,sy,6,124,shelf["thickness"],depth-6-t+.6)
    rear+=record(shelf_roof,"R-B01","Horizontal battery ceiling and Pi shelf","rear")
    for index,side in enumerate((-1,1),1):
        rail=box(-61 if side<0 else 57,3,6,4,sy+3-3,depth-6-t+.6)
        rail-=box(-62 if side<0 else 56,10,35,6,5,12)
        if side>0:
            rail-=box(56,7,33,7,15,19)
        rear+=record(rail,f"R-BF{index:02}","Battery side rail and strap slot","rear")
        seat=box(-57 if side<0 else 49,3,6,8,1,depth-6-t+.6)
        rear+=record(seat,f"R-BS{index:02}","Battery floor foam seat","rear")
    px,py,pz=items["pi"]["origin"]
    for index,(x,z) in enumerate(((x,z) for x in (px+3.5,px+61.5) for z in (pz+3.5,pz+52.5)),1):
        post=cylinder_y(x,sy+3,z,2.8,py-sy-3)
        rear+=record(post,f"R-P{index:02}","Horizontal Pi shelf post","rear")
        rear-=cylinder_y(x,sy+.8,z,1.1,py-sy+.2)
    # The switch stays near the back, above the bottom module.
    wx,wy,wz=items["switch"]["origin"]
    rear-=slab(rr(wx+1,wy+8,16,24,5),depth-t-1,t+2)
    for index,yy in enumerate((wy+5,wy+35),1):
        lug=box(wx-6,yy-4,wz+8,6,8,depth-t-wz-8)
        lug-=box(wx-4.5,yy-2.5,wz+7,3,5,4)
        rear+=record(lug,f"R-SW{index:02}","Switch retaining slot","rear")
    for x in range(-34,35,8):
        rear-=slab(rr(x,36,3,18,1.4),depth-t-1,t+2)
    for x in (-82,74):
        rear-=slab(rr(x,12,8,16,2),depth-t-1,t+2)

    # Continuous smooth side walls; no decorative caps or bumps.
    # Flat annular lands let side bezels seat on the curved cloud. Their inner
    # faces are at +/-99 mm; conservative 66 mm bodies extend to +/-40 mm.
    for index,item in enumerate((v for v in buttons if "side" in v["id"]),1):
        side=1 if "left" in item["id"] else -1
        cy=item["origin"][1]+item["size"][1]/2
        cz=item["origin"][2]+item["size"][2]/2
        pad=b.Pos(side*102.5,cy,cz)*b.Rot(0,90,0)*b.Cylinder(18,7)
        front += record(pad,f"F-BL{index:02}","Flat side-button bezel seat","front")
        # Remove all relief in front of the bezel, leaving a flat X=+/-106 face.
        front -= box(106 if side>0 else -116,cy-18,cz-18,10,36,36)
    for item in buttons:
        front -= button_hole(item,p)
        rear -= button_hole(item,p)
    # An internal counterbore accommodates the provisional nut envelope where
    # the curved inner wall approaches the flat bezel seat.
    for item in p["keepouts"]:
        if item["id"].startswith("button_side_") and item["id"].endswith("_nut"):
            x,y,z=item["origin"];w,h,d=item["size"]
            relief=b.Pos(x+w/2,y+h/2,z+d/2)*b.Rot(0,90,0)*b.Cylinder(h/2+.2,w+.8)
            front -= relief
    parts = {"front": front, "rear": rear}
    for name, shape in parts.items():
        color(shape, name, COLORS[name])

    # CAD display components, with real mounting holes where known. These
    # are simplified envelopes, NOT claimed vendor assemblies.
    electronics = {}
    for item in p["components"]:
        x, y, z = item["origin"]
        w, h, d = item["size"]
        if item["id"] == "pi":
            shape=box(x,y,z,w,h,d)
            for hx in (x+3.5,x+61.5):
                for hz in (z+3.5,z+52.5):
                    shape-=cylinder_y(hx,y-1,hz,1.375,h+2)
        elif item["id"] == "lcd":
            shape = box(x, y, z, w, h, 1.6)
            for hx in (x+2.5, x+w-2.5):
                for hy in (y+2.5, y+h-2.5):
                    shape -= cylinder(hx, hy, z-1, 1.5, 4)
        elif item["id"].startswith("button_"):
            if "side" not in item["id"]:
                cx = x + w / 2
                cy = y + h / 2
                shape = cylinder(cx, cy, z, item["diameter_mm"]/2, d)
            elif "left" in item["id"]:
                cy = y + h / 2
                cz = z + d / 2
                shape = b.Pos(x + w / 2, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(item["diameter_mm"]/2, w, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER))
            else:
                cy = y + h / 2
                cz = z + d / 2
                shape = b.Pos(x + w / 2, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(item["diameter_mm"]/2, w, align=(b.Align.CENTER, b.Align.CENTER, b.Align.CENTER))
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
            extras[f"bezel_{btn['id']}"] = color(b.Pos(107.5, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(16.5, 3), f"bezel_{btn['id']}", "#1e293b")
            extras[f"cap_{btn['id']}"] = color(b.Pos(109, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(12, 2.5), f"cap_{btn['id']}", btn["color"])
        else:
            cy = btn["origin"][1] + btn["size"][1] / 2
            cz = btn["origin"][2] + btn["size"][2] / 2
            extras[f"bezel_{btn['id']}"] = color(b.Pos(-107.5, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(16.5, 3), f"bezel_{btn['id']}", "#1e293b")
            extras[f"cap_{btn['id']}"] = color(b.Pos(-109, cy, cz) * b.Rot(0, 90, 0) * b.Cylinder(12, 2.5), f"cap_{btn['id']}", btn["color"])
    for item in p["keepouts"]:
        extras[item["id"]] = color(expanded({**item,"uncertain":False},0), "connector_"+item["id"], "#5b6670")

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
        check(name+": fits build height",bb.size.Z<=p["case"]["build_height_mm"],[round(v,3) for v in bb.size])
        brim=p["printer"]["brim_mm"]
        check(name+": fits Ender usable travel with brim",all(v+2*brim<=limit+.01 for v,limit in zip((bb.size.X,bb.size.Y),p["printer"]["usable_xy_mm"])),{"part_mm":[round(bb.size.X,3),round(bb.size.Y,3)],"brim_mm":brim,"usable_xy_mm":p["printer"]["usable_xy_mm"]})
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
        # Side controls deliberately pass through the shell. Use their actual
        # cylindrical body rather than treating bbox corners as solid material.
        allowed=internal
        if item["id"] in electronics and item["id"].startswith("button_side_"):
            envelope=electronics[item["id"]]
            allowed=internal+button_hole(item,p)
        elif item["id"].startswith("button_side_") and item["id"].endswith("_nut"):
            # This nut sits in the explicit wall counterbore. Its independent
            # shell/pillar collision check below still rejects any obstruction.
            allowed=slab(outer,p["case"]["wall"],p["case"]["depth"]-2*p["case"]["wall"])
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
    sweep=box(x-2.5,y-2.5,-40,w+5,h+5,z+d+42.5)
    check("Bank slides forward below shelf after front removal",overlap(parts["rear"],sweep)<.02)
    sn=p["snap"]
    strain=1.5*sn["thickness"]*max(p["closure"]["release_travel_mm"],sn["engagement"]+p["case"]["fit_clearance"])/sn["length"]**2
    check("Snap elastic-strain screening <= 2%",strain<=.02,{"estimated_strain":round(strain,5),"assumed_limit":.02})
    check("Exactly two printed shell parts",set(parts)=={"front","rear"})
    check("No shell screws or battery door",p["closure"]["shell_screws"]==0 and "exterior_screws" not in p and "battery_door" not in p)
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
    back_probe=box(-50,5,p["case"]["depth"]-p["case"]["wall"],100,18,p["case"]["wall"])
    check("Battery hatch replaced by continuous rear cover",overlap(parts["rear"],back_probe)>=back_probe.volume-.02)
    items={item["id"]:item for item in p["components"]}
    pi=items["pi"]
    check("Battery lies flat along XZ",bank["size"]==[106,14,69])
    check("Pi lies flat along XZ",pi["size"]==[85,1.6,56])
    check("Pi shelf above bank",bank["origin"][1]+bank["size"][1]<p["shelf"]["battery_ceiling_y"]<pi["origin"][1])
    check("Depth below previous 110 mm",p["case"]["depth"]<110)
    check("Six arcade buttons present",sum(v["id"].startswith("button_") for v in p["components"])==6)
    check("LCD centered horizontally",abs(items["lcd"]["origin"][0]+items["lcd"]["size"][0]/2)<.1)
    check("Handle absent","handle" not in p)
    check("Arcade barrel has radial print allowance",p["buttons"]["mount_hole_mm"]>=p["buttons"]["nominal_barrel_mm"]+.3)
    for item in p["components"]:
        if not item["id"].startswith("button_"):continue
        check("Final opening unobstructed: "+item["id"],sum(overlap(shape,button_hole(item,p)) for shape in parts.values())<.02)
    check("Structural shell wall >= 2.4 mm",p["case"]["wall"]>=2.4)
    c=p["case"]
    u=(c["wall"]-c["bed_chamfer_mm"])/c["skin_blend_depth_mm"]
    mouth=fairing_profile(outer,c["skin_inset_mm"]*(1-u)**2,210,c["height_mm"])
    inner_profile=b.offset(outer,amount=-c["wall"]).faces()[0]
    mouth_wall=mouth.outer_wire().distance_to(inner_profile.outer_wire())
    check("Shoulder profile at cavity mouth >= 2.4 mm",mouth_wall>=2.4,round(mouth_wall,4))
    check("Fairing preserves flat bottom sole",all(abs(fairing_profile(outer,c["skin_inset_mm"]*(1-v)**2,210,c["height_mm"]).bounding_box().min.Y)<.001 for v in (0,.5,1)))
    for item in p["components"]:
        if not item["id"].startswith("button_"):continue
        axial=item["size"][0 if "side" in item["id"] else 2]
        check("Full 66 mm assembly reserved: "+item["id"],axial>=p["buttons"]["overall_height_mm"])
        wire=next(v for v in p["keepouts"] if v["id"]==item["id"]+"_wires")
        check("Additional wire exit space: "+item["id"],wire["size"][0 if "side" in item["id"] else 2]>=p["buttons"]["wire_allowance_mm"])
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
    source_names=("parameters.json","README.md","build.py","run-cad.sh","print-settings.json","cloud-ender.scad")
    source_snapshot={name:(ROOT/name).read_bytes() for name in source_names}
    p=json.loads(source_snapshot["parameters.json"])
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
            # Print bed Z=0, both shell outside faces down. BREP/GLB retain
            # the assembled frame, so all exports describe identical geometry.
            printable=shape
            if name=="rear":
                printable=b.Rot(180,0,0)*shape
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
                  "core_mm":[210,p["case"]["height_mm"],p["case"]["depth"]],"side_relief":p["side_relief"],"arcade_buttons":[c for c in p["components"] if c["id"].startswith("button_")],
                  "allowance_mm":5,"material":p["material"],"components":p["components"],"keepouts":p["keepouts"],"closure":p["closure"],"shelf":p["shelf"],"print_bed_mm":p["case"]["bed"],
                  "fasteners":p["fasteners"],"checks_count":len(report["checks"]),"passed":True,"files":["front.stl","rear.stl","cloud-radio.brep","cloud-radio.zip"],
                  "print_parts":list(parts),"frame_features":features,
                  "frame_parts":[{"id":"F-00","name":"front","title":"Front shell"},{"id":"R-00","name":"rear","title":"Rear shell"}],"limits":report["limitations"]}
        (staging/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
        manifest["buttons"]=p["buttons"]
        manifest["files"] += ["front.3mf","rear.3mf","button-fit-coupon.stl","print-settings.json","cloud-ender.scad"]
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
