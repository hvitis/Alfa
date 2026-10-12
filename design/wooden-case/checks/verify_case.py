"""Check saved STEP/DXF artifacts. Run after build_all.py, through run-cad.sh."""
from pathlib import Path
from itertools import combinations
from collections import Counter
import json, math, sys
import ezdxf
from cadgen import read_scene, read_step
from cadgen.geometry import closest_points, overlap_volume
from cadgen.drawing_checks import validate_dxf_file

ROOT = Path(__file__).resolve().parents[1]
p = json.loads((ROOT / 'parameters.json').read_text())
report = {'units': 'mm', 'checks': [], 'clearances_mm': {}, 'limitations': [
    'Actual keypad centres/height and mounting holes require transfer from hardware.',
    'Switch envelope, plugs and simplified connector heights require physical fit verification.',
    'Wires show insulated planning centre lines, not measured assembled harnesses.',
    'Real fasteners, component undersides and thermal performance are not fully modelled.']}

def check(title, condition, detail=None):
    report['checks'].append({'check': title, 'pass': bool(condition), 'detail': detail})
    if not condition: print('FAIL:', title, detail)

def near(a,b,tol=1e-5): return abs(a-b) <= tol

scene = read_scene(ROOT / 'STEP/enclosure.step')
parts = [(o.label, scene.resolve(o.ref).shape()) for o in scene.leaves()]
by_name = {name: shape for name, shape in parts}
for name, shape in parts:
    check('Valid positive-volume solid: '+name, shape.is_valid and shape.volume > 0)
    if name.endswith('_segment'):
        bounds = shape.bounding_box()
        check('Wire remains inside the case: '+name,
              bounds.min.X >= 6-1e-5 and bounds.max.X <= 144+1e-5 and
              bounds.min.Y >= -194-1e-5 and bounds.max.Y <= -6+1e-5 and
              bounds.min.Z >= -58-1e-5 and bounds.max.Z <= -6+1e-5)

sizes = {'wood_front': (150,200,6), 'wood_rear': (150,200,6), 'wood_left':(6,188,52),
         'wood_right':(6,188,52),'wood_top':(150,6,52),'wood_bottom':(150,6,52),
         'Baseus_5000mAh_user_envelope':(69,106,14), 'pi_pcb':(56,85,1.6),
         'keypad_pcb':(30,65,1.6),'amp_pcb':(20,15,1.6),'adc_pcb':(9,29,1.6),'lcd_pcb':(35,58,1.6)}
for name, expected in sizes.items():
    actual = tuple(by_name[name].bounding_box().size)
    check(name+' envelope', all(near(a,b) for a,b in zip(actual,expected)), {'expected':expected,'actual':actual})

mechanical = [(n,s) for n,s in parts if not n.endswith('_segment')]
collisions=[]; candidate_count=0
for (na,a),(nb,b) in combinations(mechanical,2):
    ba,bb=a.bounding_box(optimal=False),b.bounding_box(optimal=False)
    if not all(min(ahi,bhi)-max(alo,blo)>1e-5 for alo,ahi,blo,bhi in zip(ba.min,ba.max,bb.min,bb.max)): continue
    candidate_count += 1
    volume = sum(overlap_volume(sa,sb) for sa in a.solids() for sb in b.solids())
    if volume > .01: collisions.append([na,nb,round(volume,4)])
check('Mechanical interference <= 0.01 mm3 (insulated wire segments excluded)', not collisions,
      {'pairs_considered': len(mechanical)*(len(mechanical)-1)//2,'exact_candidate_pairs':candidate_count,'overlaps_mm3':collisions})
for other in ('GPIO_jumper_socket_clearance','Pi_Ethernet_envelope','speaker_magnet','wood_right'):
    distance = closest_points(by_name['Baseus_5000mAh_user_envelope'],by_name[other]).distance
    report['clearances_mm']['battery_to_'+other]=round(distance,3)
    check('Battery clearance to '+other, distance >= 1.9, distance)

for label, pitch, diameter in (('lcd_pcb',(30,53),3),('pi_pcb',(49,58),2.75)):
    centres=set()
    for edge in by_name[label].edges():
        try:
            if near(edge.radius,diameter/2): centres.add(tuple(round(c,5) for c in edge.arc_center))
        except ValueError: pass
    xy={(c[0],c[1]) for c in centres}
    span=(max(c[0] for c in xy)-min(c[0] for c in xy),max(c[1] for c in xy)-min(c[1] for c in xy))
    check(label+' four mounting holes and pitch',len(xy)==4 and all(near(a,b) for a,b in zip(span,pitch)),{'pitch':span,'holes':sorted(xy)})

cut_list=json.loads((ROOT/'cut-list.json').read_text())
for page in range(1,5):
    boxes=[]
    for entry in cut_list['parts']:
        if entry['sheet']!=page: continue
        x,y=entry['sheet_origin_mm'];w,h,_=entry['size_mm']
        if entry['rotated']: w,h=h,w
        check(f'A4 sheet {page} contains {entry["part"]}',x>=5 and y>=5 and x+w<=205 and y+h<=292,[x,y,w,h])
        boxes.append((x,y,x+w,y+h))
    for a,b in combinations(boxes,2):
        gap=max(b[0]-a[2],a[0]-b[2],b[1]-a[3],a[1]-b[3])
        check(f'A4 sheet {page}: >= 5 mm saw gap',gap>=5-1e-5,gap)
    names=('front_cutting','rear_cutting','walls_cutting','accessories_cutting')
    path=ROOT/'DXF'/f'{names[page-1]}.dxf'
    findings=validate_dxf_file(path)
    check(path.name+' closed contours / no duplicate or zero-length paths',not any(f.severity=='error' for f in findings),[f.render() for f in findings])
    doc=ezdxf.readfile(path)
    check(path.name+' millimetre units',doc.units==4,doc.units)
    # Saved DXF dimensions, independent of the source profiles.
    from ezdxf import bbox
    bounds=bbox.extents(doc.modelspace())
    check(path.name+' geometry within A4',bounds.extmin.x>=5 and bounds.extmax.x<=205 and bounds.extmin.y>=5 and bounds.extmax.y<=292)

atlas=json.loads((ROOT.parents[1]/'hardware-visualisation/src/data/setup.json').read_text())['wires']
routes=json.loads((ROOT/'routing.json').read_text())['wires']
keys=('id','group','from','to','color')
check('27 nets match existing electrical atlas exactly',len(routes)==27 and [{k:v[k] for k in keys} for v in routes]==[{k:v[k] for k in keys} for v in atlas])
for name in ('exploded','internals'):
    other_scene=read_scene(ROOT/'STEP'/f'{name}.step')
    check(name+' STEP can be read and contains valid positive solids',all(other_scene.resolve(o.ref).shape().is_valid and other_scene.resolve(o.ref).shape().volume>0 for o in other_scene.leaves()))

# These are saved geometry facts, useful for a reviewer and the offline viewer.
report['part_envelopes']=[{'label':n,'min':list(s.bounding_box().min),'max':list(s.bounding_box().max)} for n,s in mechanical]
report['passed']=all(c['pass'] for c in report['checks'])
(ROOT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'{sum(c["pass"] for c in report["checks"])}/{len(report["checks"])} checks passed; clearances: {report["clearances_mm"]}')
sys.exit(0 if report['passed'] else 1)
