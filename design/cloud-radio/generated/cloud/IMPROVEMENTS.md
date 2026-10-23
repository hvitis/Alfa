# Enclosure improvements

This revision implements the following changes. CAD and mesh checks are recorded in `verification.json`; print-dependent results remain explicitly unverified.

| # | Improvement | Benefit / validation |
| --- | --- | --- |
| 1 | Reduce width from 210 to 206 mm | 4 mm extra print-bed margin; checked bounds |
| 2 | Reduce height from 215 to 211 mm | 4 mm extra print-bed margin; checked bounds |
| 3 | Reduce depth from 78 to 72 mm | 6 mm thinner body; checked envelope |
| 4 | Put battery broad face parallel to back | Only its 14 mm thickness uses case depth |
| 5 | Put Pi PCB parallel to back | Replaces the projecting horizontal shelf |
| 6 | Separate Pi and battery in XY | Avoids stacking their thicknesses |
| 7 | Add an independent side battery lid | Main case can remain closed during replacement |
| 8 | Check the complete side extraction corridor | Rails, main shells and other hardware must clear a moving bank |
| 9 | Add front lips to battery guides | Battery stays in its bay when the front opens |
| 10 | Add a positive insertion stop | Repeatable battery position without pushing on the cable |
| 11 | Leave room for a fabric pull ribbon | Battery can be withdrawn without pulling wires; ribbon supplied separately |
| 12 | Use replaceable metal nuts for lid screws | Repeated opening does not wear a printed thread |
| 13 | Add a flush lid seat and grip recess | Predictable alignment with no extra case width |
| 14 | Move all five complete bores into the front | Buttons stay mounted when the rear is removed |
| 15 | Retain 4.8 mm plastic beyond every button bore | A continuous bridge separates the bore from the seam |
| 16 | Put nut recesses inside the mounting panels | Keeps plastic beneath the bezel; original nuts retain buttons |
| 17 | Replace round speaker perforations with seven clouds | Requested cloud grille, with material between separate apertures |
| 18 | Mount Pi on rear posts instead of a shelf | Less internal structure and no horizontal PCB posts to support |
| 19 | Reserve full 16 mm Pi connector height | Uses the official mechanical drawing, replacing the previous 14 mm envelope |
| 20 | Clear snap beams along the curved side walls | Prevents the wall from obstructing beam motion; retain hook ledges |
| 21 | Move LCD and switch clear of the new layout | Keeps the smaller body compatible with the existing hardware |
| 22 | Update preview, lid downloads and assembly motion | Exported parts and visual instructions describe the same revision |
| 23 | Reflect detailed Pi 3 B structure and micro-USB port | Mechanical ports, micro-USB receptacle, dual USB, Ethernet, HDMI, GPIO, and SoC processor package verified |
| 24 | Hide front screw holes with solid exterior skin | Replaced through-face speaker and amp mounting slots with blind internal pads; front exterior skin is 100% solid and smooth |
| 25 | Hide visual power cable on assembly model | Omitted visual cable sweep from the 3D model while keeping keepout clearances verified |

Further improvements worth testing before a final production print:

| # | Next improvement | Evidence needed |
| --- | --- | --- |
| 24 | Add a thin speaker gasket | Measure the basket rim; compare rattle and sound leakage |
| 25 | Add removable battery anti-rattle foam | Measure the printed bay and real bank; keep the withdrawal path free |
| 26 | Add a plug-specific cable anchor near the side opening | Measure the USB-C plug and bend radius before fixing the anchor location |
| 27 | Tune upper/lower ventilation from powered tests | Log Pi and bank temperatures with LCD and audio running |
| 28 | Add a harness tether/service-loop anchor | Check real harness length and shell-opening motion first |
| 29 | Tune snap root fillets and beam orientation | Print coupons and cycle them; do not infer fatigue life from CAD strain alone |
| 30 | Add non-slip feet away from the bottom button | Check intended standing orientation and button travel |
| 31 | Check grille open area and tune it acoustically | Compare listening level and frequency response with the bare speaker |

The lid and main shell remain prototypes until actual hardware fit and repeated opening have been tested. Mesh validation is not a substitute for slicing and inspecting every layer on the chosen Ender profile.
