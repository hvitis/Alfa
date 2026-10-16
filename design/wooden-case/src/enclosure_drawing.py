from pathlib import Path
from cadgen import read_step
from cadgen.eng_drawing import Sheet, eng_drawing


@eng_drawing(out="../PDF/enclosure_drawing.pdf")
def enclosure_drawing():
    part = read_step(Path(__file__).resolve().parents[1] / "STEP/enclosure.step")
    wood = [child for child in part.children if child.label.startswith("wood_") and
            child.label not in ("wood_switch_cover", "wood_switch_clamp")]
    from cadgen import build123d as bd
    shell = bd.Compound(children=wood)
    sheet = Sheet("A4", scale=.35, title="ALFA CASE", part_number="WOOD-CASE-A",
                  material="6 mm plywood", revision="A", units="mm")
    top = sheet.view(shell, "top", at=(75, 140), label="FACE VIEW")
    front = sheet.view(shell, "front", at=(75, 80), label="EDGE VIEW")
    sheet.view(shell, "right", at=(190, 80), label="SIDE VIEW")
    sheet.view(shell, "iso", at=(222, 143), label="ISOMETRIC", scale=.35)
    top.overall()
    front.dim((150, 0, 0), (150, 0, -64), orientation="v", offset=12)
    return sheet


if __name__ == "__main__":
    enclosure_drawing()
