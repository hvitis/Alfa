#!/usr/bin/env python3
"""Build the Alfa Pi 3 shield with KiCad 9's Python module.

Run in the pinned KiCad container described in README.md. No third-party
generator libraries are required. Dimensions are millimeters, viewed from above.
"""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
import re
import sys
import subprocess
import uuid

import pcbnew as k

ROOT = Path(__file__).resolve().parent
NAME = "alfa-pi3-shield"
LIB = Path("/usr/share/kicad/footprints")
ORIGIN = (100.0, 100.0)
SHEET_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "alfa/pi3-shield/rev-a"))


def uid(key):
    return str(uuid.uuid5(uuid.UUID(SHEET_ID), key))


def q(value):
    return json.dumps(str(value))


def point(x, y):
    return k.VECTOR2I(k.FromMM(x), k.FromMM(y))


def absolute(x, y):
    return point(x + ORIGIN[0], y + ORIGIN[1])


# Nets on J1 use physical Pi header numbers. Unused pins remain isolated.
PI_NETS = {
    1: "+3V3", 2: "+5V", 3: "I2C_SDA", 4: "+5V", 5: "I2C_SCL",
    6: "GND", 9: "GND", 12: "I2S_BCLK", 13: "LCD_RST", 14: "GND",
    16: "AMP_ENABLE", 17: "+3V3", 18: "LCD_BL", 19: "LCD_MOSI",
    20: "GND", 22: "LCD_DC", 23: "LCD_SCK", 24: "LCD_CS",
    25: "GND", 30: "GND", 34: "GND", 35: "I2S_LRCLK", 39: "GND",
    40: "I2S_DIN",
}
PI_NAMES = [
    "3V3", "5V", "GPIO2/SDA", "5V", "GPIO3/SCL", "GND", "GPIO4", "GPIO14",
    "GND", "GPIO15", "GPIO17", "GPIO18/BCLK", "GPIO27/RST", "GND", "GPIO22",
    "GPIO23/ENABLE", "3V3", "GPIO24/BL", "GPIO10/MOSI", "GND", "GPIO9",
    "GPIO25/DC", "GPIO11/SCK", "GPIO8/CE0", "GND", "GPIO7", "ID_SD/RESERVED",
    "ID_SC/RESERVED", "GPIO5", "GND", "GPIO6", "GPIO12", "GPIO13", "GND",
    "GPIO19/LRCLK", "GPIO16", "GPIO26", "GPIO20", "GND", "GPIO21/DIN",
]
COMPONENTS = []


def component(ref, value, footprint, xy, pins, names=None, mpn="", maker="",
              angle=0, side="top", note="", schematic=None):
    data = dict(ref=ref, value=value, footprint=footprint, xy=xy, pins=pins,
                names=names or {p: p for p in pins}, mpn=mpn, maker=maker,
                angle=angle, side=side, note=note, schematic=schematic)
    COMPONENTS.append(data)
    return data


component("J1", "Pi 3 underside socket", "Alfa:Pi_40_Underside", (0, 0),
          {str(n): PI_NETS.get(n) for n in range(1, 41)},
          {str(n): v for n, v in enumerate(PI_NAMES, 1)},
          "SSQ-120-01-G-D", "Samtec", side="bottom",
          note="2x20 female, 2.54 mm; select socket/standoff heights as a matched pair.",
          schematic=(45, 75))
component("U1", "ADS1115IDGSR", "Package_SO:VSSOP-10_3x3mm_P0.5mm", (27, 29),
          {"1":"GND", "2":None, "3":"GND", "4":"KEY_SENSE", "5":"GND",
           "6":"GND", "7":"GND", "8":"+3V3", "9":"I2C_SDA", "10":"I2C_SCL"},
          dict(zip(map(str, range(1,11)), ["ADDR", "ALERT/RDY", "GND", "AIN0",
               "AIN1", "AIN2", "AIN3", "VDD", "SDA", "SCL"])),
          "ADS1115IDGSR", "Texas Instruments", schematic=(115, 48),
          note="16-bit ADC; address 0x48; A0 keypad input. Replaces ADS breakout.")
component("U2", "MAX98357AETE+T", "Package_DFN_QFN:TQFN-16-1EP_3x3mm_P0.5mm_EP1.23x1.23mm",
          (47, 29),
          {"1":"I2S_DIN", "2":None, "3":"GND", "4":"AMP_SD", "5":None,
           "6":None, "7":"+5V", "8":"+5V", "9":"SPK_P", "10":"SPK_N",
           "11":"GND", "12":None, "13":None, "14":"I2S_LRCLK", "15":"GND",
           "16":"I2S_BCLK", "17":"GND"},
          dict(zip(map(str, range(1,18)), ["DIN", "GAIN_SLOT", "GND", "SD_MODE",
              "NC", "NC", "VDD", "VDD", "OUTP", "OUTN", "GND", "NC", "NC",
              "LRCLK", "GND", "BCLK", "EP"])),
          "MAX98357AETE+T", "Analog Devices", schematic=(195, 58),
          note="I2S A variant, 16-pin TQFN, gain pin open = 9 dB; left channel.")

for ref, count, xy, nets, names, sch in [
    ("J2", 8, (10, 46), ["+3V3","GND","LCD_MOSI","LCD_SCK","LCD_CS","LCD_DC","LCD_RST","LCD_BL"],
     ["VCC","GND","DIN","CLK","CS","DC","RST","BL"], (115, 105)),
    ("J3", 2, (51, 46), ["SPK_P","SPK_N"], ["SPK+","SPK-"], (255, 48)),
    ("J4", 3, (34, 46), ["KEY_OUT","+5V","GND"], ["OUT","5V","GND"], (255, 103)),
]:
    component(ref, f"JST PH {count}", f"Connector_JST:JST_PH_B{count}B-PH-K_1x{count:02d}_P2.00mm_Vertical",
              xy, dict(zip(map(str, range(1, count+1)), nets)),
              dict(zip(map(str, range(1, count+1)), names)),
              f"B{count}B-PH-K-S(LF)(SN)", "JST", schematic=sch,
              note="Through-hole; supplier can hand-assemble. Harness pin order is defined by this PCB.")

for ref, value, xy, nets, mpn, sch in [
    ("R1", "10k 1%", (28, 37), ["KEY_OUT","KEY_SENSE"], "RC0805FR-0710KL", (115,147)),
    ("R2", "10k 1%", (33, 37), ["KEY_SENSE","GND"], "RC0805FR-0710KL", (145,147)),
    ("R3", "1k 1%", (40, 24), ["AMP_ENABLE","AMP_SD"], "RC0805FR-071KL", (195,120)),
    ("R4", "100k 1%", (40, 29), ["AMP_SD","GND"], "RC0805FR-07100KL", (225,120)),
]:
    component(ref,value,"Resistor_SMD:R_0805_2012Metric",xy,
              dict(zip(["1","2"],nets)),mpn=mpn,maker="Yageo",schematic=sch)

for ref, value, footprint, xy, nets, mpn, sch in [
    ("C1", "100nF 50V X7R", "C_0805_2012Metric", (32.5,29), ["+3V3","GND"], "GRM21BR71H104KA01L", (115,171)),
    ("C2", "100nF 50V X7R", "C_0805_2012Metric", (46,34), ["+5V","GND"], "GRM21BR71H104KA01L", (175,171)),
    ("C3", "10uF 10V X7R", "C_1206_3216Metric", (50.5,34), ["+5V","GND"], "GRM31CR71A106KA01L", (205,171)),
    ("C4", "47uF 10V X5R", "C_1210_3225Metric", (56,34), ["+5V","GND"], "GRM32ER61A476KE20L", (235,171)),
]:
    component(ref,value,f"Capacitor_SMD:{footprint}",xy,dict(zip(["1","2"],nets)),
              mpn=mpn,maker="Murata",schematic=sch)

for ref, value, xy, sch in [("TP1","+5V",(57,15),(35,147)),
                            ("TP2","+3V3",(12,15),(55,147)),
                            ("TP3","GND",(17,15),(35,171)),
                            ("TP4","KEY_SENSE",(23,37),(55,171))]:
    component(ref,value,"TestPoint:TestPoint_Pad_D1.5mm",xy,{"1":value},
              note="Bare copper test pad; no component to purchase.",schematic=sch)


def save_project():
    project = {
        "meta":{"filename":f"{NAME}.kicad_pro","version":1},
        "board":{"design_settings":{"defaults":{"board_outline_line_width":0.05},
                  "rules":{"min_clearance":0.15,"min_track_width":0.15,
                           "min_via_diameter":0.45,"min_through_hole_diameter":0.2,
                           "min_copper_edge_clearance":0.3}}},
        "net_settings":{"classes":[
            {"name":"Default","clearance":0.15,"track_width":0.2,
             "via_diameter":0.6,"via_drill":0.3,"microvia_diameter":0.3,"microvia_drill":0.1,
             "diff_pair_width":0.2,"diff_pair_gap":0.25,"diff_pair_via_gap":0.25,
             "pcb_color":"rgba(0, 0, 0, 0.000)","schematic_color":"rgba(0, 0, 0, 0.000)",
             "wire_width":6,"bus_width":12,"line_style":0},
            {"name":"Power","clearance":0.2,"track_width":0.7,
             "via_diameter":0.8,"via_drill":0.4,"microvia_diameter":0.3,"microvia_drill":0.1,
             "diff_pair_width":0.2,"diff_pair_gap":0.25,"diff_pair_via_gap":0.25,
             "pcb_color":"rgba(0, 0, 0, 0.000)","schematic_color":"rgba(0, 0, 0, 0.000)",
             "wire_width":6,"bus_width":12,"line_style":0}],
            "netclass_patterns":[{"netclass":"Power","pattern":n} for n in ["+5V","SPK_P","SPK_N"]],
            "meta":{"version":3}},
    }
    (ROOT/f"{NAME}.kicad_pro").write_text(json.dumps(project,indent=2)+"\n")


def text(board, message, xy, size=0.85, layer=k.F_SilkS):
    item=k.PCB_TEXT(board)
    item.SetText(message)
    item.SetPosition(absolute(*xy))
    item.SetTextSize(point(max(size,0.8),max(size,0.8)))
    item.SetTextThickness(k.FromMM(0.12))
    item.SetLayer(layer)
    board.Add(item)
    return item


def line(board, a, b, layer=k.Edge_Cuts, width=0.05):
    shape=k.PCB_SHAPE(board)
    shape.SetShape(k.SHAPE_T_SEGMENT)
    shape.SetStart(absolute(*a)); shape.SetEnd(absolute(*b))
    shape.SetLayer(layer); shape.SetWidth(k.FromMM(width)); board.Add(shape)


def outline(board):
    # 65 x 56 mm, standard 58 x 49 mm Pi mounting pattern, R3 corners.
    for a,b in [((3,0),(62,0)),((65,3),(65,53)),((62,56),(3,56)),((0,53),(0,3))]:
        line(board,a,b)
    for a,m,b in [((62,0),(64.12132,0.87868),(65,3)),
                  ((65,53),(64.12132,55.12132),(62,56)),
                  ((3,56),(0.87868,55.12132),(0,53)),
                  ((0,3),(0.87868,0.87868),(3,0))]:
        arc=k.PCB_SHAPE(board); arc.SetShape(k.SHAPE_T_ARC)
        arc.SetArcGeometry(absolute(*a),absolute(*m),absolute(*b))
        arc.SetLayer(k.Edge_Cuts); arc.SetWidth(k.FromMM(0.05)); board.Add(arc)


def socket(board):
    # Pad coordinates are defined from the official mechanical drawing, not a
    # guessed flip of a top-side male header. Pin 1 is the inner, lower-left pad.
    fp=k.FOOTPRINT(board); fp.SetReference("J1"); fp.SetValue("Pi 3 underside socket")
    fp.SetFPID(k.LIB_ID("Alfa","Pi_40_Underside")); fp.SetPosition(absolute(0,0))
    fp.SetLayer(k.B_Cu); fp.SetAttributes(k.FP_THROUGH_HOLE)
    for number in range(1,41):
        pad=k.PAD(fp); pad.SetNumber(str(number)); pad.SetAttribute(k.PAD_ATTRIB_PTH)
        pad.SetShape(k.PAD_SHAPE_RECT if number==1 else k.PAD_SHAPE_CIRCLE)
        pad.SetSize(point(1.7,1.7)); pad.SetDrillSize(point(1,1))
        pad.SetLayerSet(pad.PTHMask())
        pad.SetPosition(absolute(7+((number-1)//2)*2.54,4.77 if number%2 else 2.23))
        fp.Add(pad)
    for layer in [k.F_Fab,k.B_Fab]:
        for a,b in [((5.5,0.7),(56.8,0.7)),((56.8,0.7),(56.8,6.3)),
                    ((56.8,6.3),(5.5,6.3)),((5.5,6.3),(5.5,0.7))]:
            s=k.PCB_SHAPE(fp);s.SetShape(k.SHAPE_T_SEGMENT);s.SetStart(absolute(*a));s.SetEnd(absolute(*b))
            s.SetWidth(k.FromMM(0.1));s.SetLayer(layer);fp.Add(s)
    board.Add(fp)
    return fp


def build_board():
    board=k.BOARD(); board.SetCopperLayerCount(2)
    board.GetDesignSettings().SetBoardThickness(k.FromMM(1.6))
    board.GetDesignSettings().SetAuxOrigin(absolute(0,56))
    title=k.TITLE_BLOCK();title.SetTitle("Alfa Raspberry Pi 3 shield - prototype A")
    title.SetRevision("A");title.SetComment(0,"Engineering prototype: physical fit and hardware tests pending")
    board.SetTitleBlock(title)
    names=sorted({net for c in COMPONENTS for net in c["pins"].values() if net})
    nets={}
    for name in names:
        net=k.NETINFO_ITEM(board,name);board.Add(net);nets[name]=net
    outline(board)
    for c in COMPONENTS:
        if c["ref"]=="J1": fp=socket(board)
        else:
            library,footprint=c["footprint"].split(":")
            fp=k.FootprintLoad(str(LIB/f"{library}.pretty"),footprint)
            if not fp: raise RuntimeError(f"Footprint unavailable: {c['footprint']}")
            fp.SetPosition(absolute(*c["xy"]));fp.SetOrientationDegrees(c["angle"])
            fp.SetReference(c["ref"]);fp.SetValue(c["value"]);board.Add(fp)
            if c["ref"] in ["U1","U2"]:
                model="ADS1115-DGS" if c["ref"]=="U1" else "MAX98357A-T1633"
                fp.Models()[0].m_Filename=f"${{KIPRJMOD}}/models/{model}.step"
        fp.SetPath(k.KIID_PATH(f"/{SHEET_ID}/{uid(c['ref'])}"))
        fp.Reference().SetTextSize(point(0.8,0.8));fp.Reference().SetTextThickness(k.FromMM(0.12))
        fp.Value().SetVisible(False)
        if c["ref"]=="J1": fp.Reference().SetPosition(absolute(31,8))
        for pad in fp.Pads():
            name=c["pins"].get(pad.GetNumber())
            if name:pad.SetNet(nets[name])
    for n,xy in enumerate([(3.5,3.5),(61.5,3.5),(3.5,52.5),(61.5,52.5)],1):
        fp=k.FootprintLoad(str(LIB/"MountingHole.pretty"),"MountingHole_2.7mm_M2.5")
        fp.SetPosition(absolute(*xy));fp.SetReference(f"H{n}");fp.Reference().SetVisible(False)
        fp.Value().SetVisible(False);board.Add(fp)
        # Override standard 2.7 mm library drill to official 2.75 mm.
        for pad in fp.Pads():pad.SetDrillSize(point(2.75,2.75));pad.SetSize(point(2.75,2.75))
    text(board,"ALFA / PI 3",(32.5,12),1.5)
    text(board,"REV A - PROTOTYPE",(32.5,15),0.85)
    text(board,"J2 LCD",(17,41.5))
    text(board,"J4 KEYPAD",(36,41.5))
    text(board,"J3 SPEAKER",(52,41.5))
    text(board,"1=3V3  2=GND",(17,53.5),0.7)
    text(board,"1=OUT  2=5V  3=GND",(36,53.5),0.65)
    text(board,"1=+  2=-",(52,53.5),0.7)
    text(board,"POWER THROUGH PI USB ONLY",(32.5,19),0.75)
    text(board,"1",(7,7.8),0.8)
    for label,xy in [("5V",(57,17)),("3V3",(12,17)),("GND",(17,17)),("A0",(23,39))]:
        text(board,label,xy,0.65)
    # Narrow escapes from the 0.5 mm-pitch amplifier leads. The remaining
    # supply/output routes use 0.7 mm copper, rather than forcing wide copper
    # between adjacent IC leads.
    amp=next(f for f in board.GetFootprints() if f.GetReference()=="U2")
    for number in ["7","8","9","10"]:
        pad=next(p for p in amp.Pads() if p.GetNumber()==number)
        start=pad.GetPosition();x,y=k.ToMM(start.x)-100,k.ToMM(start.y)-100
        path=[(x,y),(x,y+1.6)] if number in ["7","8"] else [
            (x,y),(x+0.8,y),(x+1.8,y+(1 if number=="9" else -1))]
        for a,b in zip(path,path[1:]):
            track=k.PCB_TRACK(board);track.SetStart(absolute(*a));track.SetEnd(absolute(*b))
            track.SetWidth(k.FromMM(0.2));track.SetLayer(k.F_Cu);track.SetNet(pad.GetNet());board.Add(track)
    via=k.PCB_VIA(board);via.SetPosition(absolute(47,29));via.SetWidth(k.FromMM(0.6))
    via.SetDrill(k.FromMM(0.3));via.SetViaType(k.VIATYPE_THROUGH);via.SetLayerPair(k.F_Cu,k.B_Cu)
    via.SetNet(nets["GND"]);board.Add(via)
    # Make the custom underside socket available when updating from schematic.
    custom=ROOT/"Alfa.pretty";custom.mkdir(exist_ok=True)
    k.PCB_IO_MGR.PluginFind(k.PCB_IO_MGR.KICAD_SEXP).FootprintSave(str(custom),next(f for f in board.GetFootprints() if f.GetReference()=="J1"))
    (ROOT/"fp-lib-table").write_text('(fp_lib_table (lib (name "Alfa") (type "KiCad") (uri "${KIPRJMOD}/Alfa.pretty") (options "") (descr "Alfa shield socket")))\n')
    save_project()
    board.Save(str(ROOT/f"{NAME}.kicad_pcb"))
    board.Save(str(ROOT/"routing-input.kicad_pcb"))
    if not k.ExportSpecctraDSN(board,str(ROOT/f"{NAME}.dsn")):
        raise RuntimeError("KiCad DSN export failed")
    dsn=ROOT/f"{NAME}.dsn"
    content=dsn.read_text()
    content=content.replace('(class kicad_default +3V3 +5V', '(class kicad_default +3V3')
    content=content.replace('LCD_SCK SPK_N SPK_P\n', 'LCD_SCK\n')
    content=content.replace('  (wiring\n', '  (wiring\n')
    # Insert an independent power class at the end of the network block.
    marker='  )\n  (wiring'
    power='    (class Power +5V SPK_N SPK_P (circuit (use_via "Via[0-1]_600:300_um")) (rule (width 700) (clearance 200)))\n'
    if marker not in content:raise RuntimeError("Unexpected KiCad DSN structure")
    content=content.replace(marker,power+marker,1)
    dsn.write_text(content)
    print("Created unrouted board and routing input",flush=True)


def symbol_definition(c):
    # A labeled block for each real component, embedded so schematics are portable.
    count=len(c["pins"]); half=(count+1)//2 if count>2 else count
    h=max(5.08,(half+1)*2.54/2);w=12.7 if count>10 else 8.89
    out=[f'(symbol "Alfa:{c["ref"]}" (pin_names (offset 0.508)) (in_bom yes) (on_board yes)',
         f'(property "Reference" {q(c["ref"])} (at 0 {h+3.81} 0) (effects (font (size 1.27 1.27))))',
         f'(property "Value" {q(c["value"])} (at 0 {h+1.27} 0) (effects (font (size 1.0 1.0))))',
         f'(symbol "{c["ref"]}_0_1" (rectangle (start {-w} {h}) (end {w} {-h}) (stroke (width 0.254) (type default)) (fill (type background))))',
         f'(symbol "{c["ref"]}_1_1"']
    coords={}
    for i,pin in enumerate(c["pins"]):
        left=i<half;idx=i if left else i-half
        y=((half-1)/2-idx)*2.54
        x=-(w+2.54) if left else w+2.54;angle=0 if left else 180
        # Connectors and R/C pins are passive; IC inputs/outputs carry real ERC types.
        kind="passive"
        if c["ref"]=="U1":
            kind={"1":"input","2":"open_collector","3":"power_in","4":"input",
                  "5":"input","6":"input","7":"input","8":"power_in","9":"bidirectional","10":"input"}[pin]
        if c["ref"]=="U2":
            kind="power_in" if pin in ["3","7","8","11","15","17"] else "output" if pin in ["9","10"] else "input"
            if pin in ["5","6","12","13"]:kind="no_connect"
        if c["ref"]=="J1" and pin in ["1","2","6"]:kind="power_out"
        out.append(f'(pin {kind} line (at {x} {y} {angle}) (length 2.54) '
                   f'(name {q(c["names"].get(pin,pin))} (effects (font (size 0.85 0.85)))) '
                   f'(number {q(pin)} (effects (font (size 0.85 0.85)))))')
        coords[pin]=(x,y,left)
    out.append("))")
    return "\n".join(out),coords


def build_schematic():
    definitions=[];instances=[]
    for c in COMPONENTS:
        definition,coords=symbol_definition(c);definitions.append(definition)
        sx,sy=c["schematic"]
        if c["ref"].startswith("C"):sy=158
        x,y=[round(round(v/1.27)*1.27,4) for v in [sx,sy]]
        inst=[f'(symbol (lib_id "Alfa:{c["ref"]}") (at {x} {y} 0) (unit 1) '
              f'(in_bom yes) (on_board yes) (dnp no) (uuid {uid(c["ref"])})',
              f'(property "Reference" {q(c["ref"])} (at {x} {y-((len(c["pins"])+1)//2+1)*1.27-4} 0) (effects (font (size 1.27 1.27))))',
              f'(property "Value" {q(c["value"])} (at {x} {y-((len(c["pins"])+1)//2+1)*1.27-2} 0) (effects (font (size 1 1))))',
              f'(property "Footprint" {q(c["footprint"])} (at {x} {y} 0) (effects (font (size 1 1)) hide))',
              f'(property "MPN" {q(c["mpn"])} (at {x} {y} 0) (effects (font (size 1 1)) hide))',
              f'(instances (project {q(NAME)} (path "/{SHEET_ID}" (reference {q(c["ref"])}) (unit 1))))',")"]
        instances.extend(inst)
        for pin,net in c["pins"].items():
            dx,dy,left=coords[pin];px,py=round(x+dx,4),round(y-dy,4)
            if net:
                ex=round(px+(-5.08 if left else 5.08),4)
                instances.append(f'(wire (pts (xy {px} {py}) (xy {ex} {py})) (stroke (width 0) (type default)) (uuid {uid(c["ref"]+pin+"wire")}))')
                instances.append(f'(label {q(net)} (at {ex} {py} {0 if left else 180}) (effects (font (size 0.85 0.85)) (justify {"left" if left else "right"} bottom)) (uuid {uid(c["ref"]+pin+"label")}))')
            else:
                instances.append(f'(no_connect (at {px} {py}) (uuid {uid(c["ref"]+pin+"nc")}))')
    out=[f'(kicad_sch (version 20250114) (generator "alfa-shield-builder") (uuid {SHEET_ID}) (paper "A4")',
         '(title_block (title "Alfa Raspberry Pi 3 shield") (rev "A") (comment 1 "Engineering prototype - hardware validation pending"))',
         "(lib_symbols",*definitions,")",*instances,
         '(text '+q("Power: Pi micro-USB only. J1 socket on UNDERSIDE. No ID EEPROM.\nU1: ADS1115 / address 0x48 / A0. U2: I2S / left channel / 9 dB.\nR1/R2: keypad 5 V output divided to about 2.5 V.\nGPIO23 HIGH enables audio. LOW shuts down U2. Neither speaker output is ground.")+' (at 16 192 0) (effects (font (size 1 1)) (justify left)) (uuid '+uid("notes")+'))',
         ")"]
    (ROOT/f"{NAME}.kicad_sch").write_text("\n".join(out)+"\n")
    # Library symbols use their local name without the library nickname.
    library="\n".join(re.sub(r'\(symbol "Alfa:', '(symbol "', d, count=1) for d in definitions)
    (ROOT/"Alfa.kicad_sym").write_text('(kicad_symbol_lib (version 20241209) (generator "alfa-shield-builder")\n'+library+'\n)\n')
    (ROOT/"sym-lib-table").write_text('(sym_lib_table (lib (name "Alfa") (type "KiCad") (uri "${KIPRJMOD}/Alfa.kicad_sym") (options "") (descr "Alfa shield symbols")))\n')


def build_manifest(output=ROOT/"generated"):
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    data={"name":NAME,"revision":"A","status":"engineering prototype; not released for production",
          "controller":"Raspberry Pi 3 Model B","dimensions_mm":[65,56,1.6],
          "mount_hole_pitch_mm":[58,49],"mount_drill_mm":2.75,
          "components":COMPONENTS,"pi_nets":PI_NETS}
    (output/"design.json").write_text(json.dumps(data,indent=2)+"\n")
    with (output/"bom.csv").open("w",newline="") as f:
        writer=csv.writer(f);writer.writerow(["Reference","Quantity","Value","Manufacturer","MPN","Footprint","Assembly","Notes"])
        for c in COMPONENTS:
            if c["ref"].startswith("TP"):continue
            writer.writerow([c["ref"],1,c["value"],c["maker"],c["mpn"],c["footprint"],
                             "THT underside" if c["ref"]=="J1" else "THT top" if c["ref"].startswith("J") else "SMT top",c["note"]])
    with (output/"connections.csv").open("w",newline="") as f:
        writer=csv.writer(f);writer.writerow(["Reference","Pin","Pin name","Net"])
        for c in COMPONENTS:
            for pin,net in c["pins"].items():writer.writerow([c["ref"],pin,c["names"].get(pin,pin),net or "NC"])


def finish_board():
    board=k.LoadBoard(str(ROOT/"routing-input.kicad_pcb"))
    session=ROOT/f"{NAME}.ses"
    if not session.exists():raise RuntimeError("Route the exported DSN first")
    if not k.ImportSpecctraSES(board,str(session)):raise RuntimeError("Routing import failed")
    # Join the two adjacent VDD leads locally. Remove the unused escape on pin 7
    # and the output stub that the router shortened at its junction.
    target=ROOT/f"{NAME}.kicad_pcb"
    board.Save(str(target))
    content=target.read_text()
    supply=re.search(r'\(net (\d+) "\+5V"\)',content).group(1)
    positive=re.search(r'\(net (\d+) "SPK_P"\)',content).group(1)
    def retain(match):
        segment=match.group(0)
        a=re.search(r'\(start ([\d.-]+) ([\d.-]+)\)',segment)
        b=re.search(r'\(end ([\d.-]+) ([\d.-]+)\)',segment)
        net=re.search(r'\(net (\d+)\)',segment).group(1)
        ax,ay,bx,by=[float(v)-100 for v in [*a.groups(),*b.groups()]]
        if (net==supply and abs(ax-47.25)<0.002 and abs(bx-47.25)<0.002
                and min(ay,by)>30.4 and max(ay,by)<32.1):return ""
        if (net==positive and max(ax,bx)>50.2 and min(ay,by)>30.2
                and max(ay,by)<30.8):return ""
        return segment
    content=re.sub(r'\t\(segment\n.*?\n\t\)\n',retain,content,flags=re.S)
    bridge=f'(segment (start 147.25 130.4375) (end 147.75 130.4375) (width 0.2) (layer "F.Cu") (net {supply}) (uuid {uid("vdd-bridge")}))\n'
    at=content.rfind(")")
    target.write_text(content[:at]+bridge+content[at:])
    # Keep imports and zone fills in separate processes. KiCad 9's SWIG wrapper
    # can invalidate type proxies after track deletion or session import.
    subprocess.run([sys.executable,str(Path(__file__).resolve()),"--fill"],check=True)


def fill_board():
    board=k.LoadBoard(str(ROOT/f"{NAME}.kicad_pcb"))
    ground=board.FindNet("GND")
    # Ground fills on both sides provide a short return path and amplifier cooling.
    for layer in [k.F_Cu,k.B_Cu]:
        zone=k.ZONE(board);zone.SetLayer(layer);zone.SetNet(ground)
        zone.SetLocalClearance(k.FromMM(0.2));zone.SetThermalReliefGap(k.FromMM(0.25))
        zone.SetThermalReliefSpokeWidth(k.FromMM(0.3));zone.SetPadConnection(k.ZONE_CONNECTION_FULL)
        poly=zone.Outline();poly.NewOutline()
        for x,y in [(0.5,0.5),(64.5,0.5),(64.5,55.5),(0.5,55.5)]:
            p=absolute(x,y);poly.Append(p.x,p.y)
        board.Add(zone)
    filler=k.ZONE_FILLER(board);filler.Fill(board.Zones())
    board.Save(str(ROOT/f"{NAME}.kicad_pcb"))
    board=k.LoadBoard(str(ROOT/f"{NAME}.kicad_pcb"))
    # Placement CSV is intentionally assembler-neutral; origin is PCB upper left.
    with (ROOT/"placement.csv").open("w",newline="") as f:
        writer=csv.writer(f);writer.writerow(["Designator","Mid X","Mid Y","Layer","Rotation"])
        for fp in sorted(board.GetFootprints(),key=lambda f:f.GetReference()):
            if fp.GetReference().startswith(("H","TP","J")):continue
            x,y=fp.GetPosition();writer.writerow([fp.GetReference(),f"{k.ToMM(x)-100:.4f}mm",f"{56-(k.ToMM(y)-100):.4f}mm",
                "Bottom" if fp.GetLayer()==k.B_Cu else "Top",f"{fp.GetOrientationDegrees():.2f}"])
    print("Imported routes, filled ground planes, wrote placement.csv",flush=True)


if __name__=="__main__":
    if "--fill" in sys.argv:fill_board()
    elif "--finish" in sys.argv:finish_board()
    else:
        build_manifest();build_schematic();build_board()
