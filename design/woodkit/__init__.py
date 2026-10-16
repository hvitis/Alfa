"""Woodkit: reusable pieces for hand-cut plywood enclosure plans.

shapes      2D primitives, panels, envelopes, rods, poses (pure Python)
cad         build123d solids and assemblies from those shapes (cadgen env)
fasteners   metric screw/bolt length calculator and shopping list (pure Python)
paper       A4 pages, elevations, dimensions, text blocks (matplotlib)
templates   1:1 A4 cut-and-drill sheets, SVG and DXF (matplotlib, ezdxf)
booklet     IKEA-style wordless assembly pages (matplotlib)
scenery     illustrated cover scenes (matplotlib)
render      batch cadgen snapshots and image clean-up
checks      saved-STEP checks with a JSON report
viewer      copy built models into the hardware viewer

Coordinates everywhere: millimetres, X right, Y up, Z toward the viewer.
"""
