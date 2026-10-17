#!/usr/bin/env python3
"""Check exported schematic connectivity against PCB pads and working Pi pins."""
import json
import argparse
from pathlib import Path
import xml.etree.ElementTree as ET
import pcbnew as k

ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output",type=Path,default=ROOT/"generated")
OUTPUT=parser.parse_args().output
spec=json.loads((OUTPUT/"design.json").read_text())
board=k.LoadBoard(str(ROOT/"alfa-pi3-shield.kicad_pcb"))
schematic=ET.parse(OUTPUT/"schematic.xml")
actual={}
for net in schematic.findall("./nets/net"):
    for node in net.findall("node"):actual[(node.attrib["ref"],node.attrib["pin"])]=net.attrib["name"].lstrip("/")
expected={(c["ref"],pin):net for c in spec["components"] for pin,net in c["pins"].items() if net}
pcb={(fp.GetReference(),p.GetNumber()):p.GetNetname() for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetname()}
checks=[]
def check(name,result):
    checks.append({"name":name,"pass":bool(result)})
    if not result:raise AssertionError(name)

for key,net in expected.items():
    check(f"schematic {key[0]}.{key[1]} = {net}",actual.get(key)==net)
    check(f"PCB {key[0]}.{key[1]} = {net}",pcb.get(key)==net)
check("PCB has no unintended connected pads",pcb==expected)
check("Schematic has no unintended connected pads",{p:n for p,n in actual.items() if not n.startswith('unconnected-')}==expected)
# Independent reference to docs/wiring.md and the later amplifier sleep section.
working={"3":"I2C_SDA","5":"I2C_SCL","12":"I2S_BCLK","13":"LCD_RST",
         "16":"AMP_ENABLE","18":"LCD_BL","19":"LCD_MOSI","22":"LCD_DC",
         "23":"LCD_SCK","24":"LCD_CS","35":"I2S_LRCLK","40":"I2S_DIN"}
for pin,net in working.items():check(f"working Pi physical pin {pin}",pcb.get(("J1",pin))==net)
check("HAT ID pins are unused",all(("J1",pin) not in pcb for pin in ["27","28"]))
check("Speaker outputs never connect to ground",pcb[("J3","1")]=="SPK_P" and pcb[("J3","2")]=="SPK_N")
config_path=(ROOT/"../../config.json").resolve()
config=json.loads(config_path.read_text()) if config_path.exists() else None
if config:
    check("LCD GPIO configuration matches",all(config["display"][key]==val for key,val in {"dc_pin":25,"reset_pin":27,"backlight_pin":24,"spi_bus":0,"spi_device":0}.items()))
    check("ADC configuration matches ADS1115 / 0x48",config["adc"]["model"]=="ads1115" and int(config["adc"]["address"],0)==0x48)
    check("Amplifier sleep GPIO configuration matches",config["audio"]["shutdown_pin"]==23)
socket=next(fp for fp in board.GetFootprints() if fp.GetReference()=="J1")
check("Pi socket is on underside",socket.GetLayer()==k.B_Cu)
for pad in socket.Pads():
    n=int(pad.GetNumber());p=pad.GetPosition()
    check(f"Pi physical pad {n} geometry",abs(k.ToMM(p.x)-(107+((n-1)//2)*2.54))<.001 and abs(k.ToMM(p.y)-(104.77 if n%2 else 102.23))<.001)
for filename,phrase in [("drc.rpt","Found 0 DRC violations"),("drc.rpt","Found 0 unconnected pads"),("erc.rpt","Errors 0  Warnings 0")]:
    check(f"KiCad {phrase}",phrase in (OUTPUT/filename).read_text())
result={"status":"digital checks pass; hardware tests pending","count":len(checks),"checks":checks}
(OUTPUT/"verification.json").write_text(json.dumps(result,indent=2)+"\n")
print(f"PASS: {len(checks)} connectivity, pin assignment, geometry and KiCad report checks")
