"""Create package envelopes for missing KiCad models with FreeCAD.

Dimensions follow the TI DGS and ADI T1633 package outlines. These are package
envelopes, not vendor CAD. Run with FreeCAD's bundled Python in headless mode.
"""
from pathlib import Path
import FreeCAD as App
import Part
import Import

ROOT=Path(__file__).resolve().parent/"models"
ROOT.mkdir(exist_ok=True)


def make(name, body, pins):
    doc=App.newDocument(name)
    def solid(label, size, origin, color):
        obj=doc.addObject("PartDesign::Feature",label)
        obj.Shape=Part.makeBox(*size,App.Vector(*origin))
        if obj.ViewObject:obj.ViewObject.ShapeColor=color
        return obj
    items=[solid("Package",body,(-body[0]/2,-body[1]/2,0.1),(.16,.17,.18))]
    for i,(size,origin) in enumerate(pins):items.append(solid(f"Lead{i+1}",size,origin,(.68,.7,.72)))
    doc.recompute()
    Import.export(items,str(ROOT/f"{name}.step"))
    App.closeDocument(doc.Name)


qfn=[]
for index in range(4):
    v=-.875+index*.5
    qfn.extend([((.45,.25,.15),(-1.5,v,0)),((.45,.25,.15),(1.05,v,0)),
                ((.25,.45,.15),(v,-1.5,0)),((.25,.45,.15),(v,1.05,0))])
qfn.append(((1.23,1.23,.1),(-.615,-.615,0)))
make("MAX98357A-T1633",(3,3,.65),qfn)
leads=[]
for index in range(5):
    v=-1.125+index*.5
    leads.extend([((1,.25,.15),(-2.45,v,0)),((1,.25,.15),(1.45,v,0))])
make("ADS1115-DGS",(3,3,1),leads)
print("Created both IC package models")
