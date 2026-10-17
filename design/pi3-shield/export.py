#!/usr/bin/env python3
"""Export the routed PCB without modifying the editable source files."""
from pathlib import Path
import argparse
import csv
import shutil
import subprocess
import tempfile
import zipfile

from assets import ROOT, GENERATED, SOURCE_NAMES


def cli(work, *args):
    print("KiCad:", " ".join(map(str, args)), flush=True)
    subprocess.run(["kicad-cli", *map(str, args)], cwd=work, check=True)


def write_zip(destination, members):
    """Use fixed ZIP metadata and an explicit list of members."""
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, path in sorted(members.items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes(), compresslevel=9)


def archive(output=GENERATED):
    output = Path(output)
    write_zip(output / "fabrication-draft.zip", {p.name: p for p in (output / "fabrication").iterdir() if p.is_file()})
    members = {f"alfa-pi3-shield/{name}": ROOT / name for name in SOURCE_NAMES}
    for path in output.rglob("*"):
        if path.is_file() and path.name not in {"alfa-pi3-shield-prototype.zip", "manifest.json"}:
            members[f"alfa-pi3-shield/generated/{path.relative_to(output)}"] = path
    write_zip(output / "alfa-pi3-shield-prototype.zip", members)


def export(output):
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    fabrication = output / "fabrication"
    fabrication.mkdir(exist_ok=True)
    # KiCad can write editor preferences while loading a project. Export a copy,
    # so neither CI nor a local refresh changes the committed design.
    with tempfile.TemporaryDirectory(prefix="alfa-kicad-") as temporary:
        work = Path(temporary)
        for name in SOURCE_NAMES:
            target = work / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / name, target)
        board = work / "alfa-pi3-shield.kicad_pcb"
        schematic = work / "alfa-pi3-shield.kicad_sch"
        cli(work, "sch", "erc", "--exit-code-violations", "-o", output / "erc.rpt", schematic)
        cli(work, "pcb", "drc", "--exit-code-violations", "-o", output / "drc.rpt", board)
        cli(work, "sch", "export", "netlist", "--format", "kicadxml", "-o", output / "schematic.xml", schematic)
        cli(work, "sch", "export", "pdf", "-o", output / "schematic.pdf", schematic)
        cli(work, "pcb", "export", "gerbers", "--use-drill-file-origin", "-l", "F.Cu,B.Cu,F.Mask,B.Mask,F.SilkS,B.SilkS,F.Paste,Edge.Cuts", "-o", str(fabrication) + "/", board)
        cli(work, "pcb", "export", "drill", "--drill-origin", "plot", "--excellon-separate-th", "--generate-map", "-o", str(fabrication) + "/", board)
        cli(work, "pcb", "export", "pdf", "--mode-single", "-l", "F.Fab,F.SilkS,Edge.Cuts", "--sketch-pads-on-fab-layers", "-o", output / "assembly-top.pdf", board)
        cli(work, "pcb", "export", "pdf", "--mode-single", "--mirror", "-l", "B.Fab,B.SilkS,Edge.Cuts", "--sketch-pads-on-fab-layers", "-o", output / "assembly-bottom.pdf", board)
        cli(work, "pcb", "export", "svg", "--mode-single", "--fit-page-to-board", "--exclude-drawing-sheet", "-l", "F.Cu,F.SilkS,Edge.Cuts", "-o", output / "board-top.svg", board)
        cli(work, "pcb", "export", "step", "--force", "--subst-models", "--user-origin", "100x100mm", "-o", output / "shield.step", board)
        cli(work, "pcb", "export", "glb", "--force", "--subst-models", "--include-pads", "--include-silkscreen", "--user-origin", "100x100mm", "-o", output / "shield.glb", board)
        for name in ["shield.step", "shield.glb"]:
            if not (output / name).is_file() or (output / name).stat().st_size < 1000:
                raise RuntimeError(f"KiCad did not produce {name}")
    from build import build_manifest
    build_manifest(output)
    import pcbnew as k
    pcb = k.LoadBoard(str(ROOT / "alfa-pi3-shield.kicad_pcb"))
    with (output / "placement.csv").open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["Designator", "Mid X", "Mid Y", "Layer", "Rotation"])
        for fp in sorted(pcb.GetFootprints(), key=lambda item: item.GetReference()):
            if not fp.GetReference().startswith(("U", "R", "C")):
                continue
            p = fp.GetPosition()
            writer.writerow([fp.GetReference(), f"{k.ToMM(p.x)-100:.4f}mm", f"{156-k.ToMM(p.y):.4f}mm", "Top", f"{fp.GetOrientationDegrees():.2f}"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=GENERATED)
    export(parser.parse_args().output)
