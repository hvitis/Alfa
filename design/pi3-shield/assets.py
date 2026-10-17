"""Track PCB source and export freshness without requiring KiCad."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GENERATED = ROOT / "generated"
IMAGE = "kicad/kicad@sha256:f7d67c2bfff3733b84d5ef9b47eff152a69c1cd7ac1f8060bcc1d98a857a8913"
SOURCE_NAMES = (
    "alfa-pi3-shield.kicad_pro", "alfa-pi3-shield.kicad_sch", "alfa-pi3-shield.kicad_pcb",
    "Alfa.kicad_sym", "Alfa.pretty/Pi_40_Underside.kicad_mod", "fp-lib-table", "sym-lib-table",
    "models/ADS1115-DGS.step", "models/MAX98357A-T1633.step",
    "README.md", "build.py", "build_models.py", "export.py", "check_design.py", "assets.py", "refresh.py",
)
REQUIRED_OUTPUTS = (
    "design.json", "bom.csv", "connections.csv", "placement.csv", "schematic.xml",
    "erc.rpt", "drc.rpt", "verification.json", "schematic.pdf", "assembly-top.pdf",
    "assembly-bottom.pdf", "board-top.svg", "shield.step", "shield.glb",
    "fabrication-draft.zip", "alfa-pi3-shield-prototype.zip",
    "fabrication/alfa-pi3-shield-F_Cu.gtl", "fabrication/alfa-pi3-shield-B_Cu.gbl",
    "fabrication/alfa-pi3-shield-Edge_Cuts.gm1", "fabrication/alfa-pi3-shield-PTH.drl",
    "fabrication/alfa-pi3-shield-NPTH.drl",
)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def source_hashes(root=ROOT):
    result = {name: digest(root / name) for name in SOURCE_NAMES}
    config = (root / "../../config.json").resolve()
    if config.exists():
        result["../../config.json"] = digest(config)
    return result


def validate(root=ROOT):
    """Reject missing, changed, or mixed exports, including altered downloads."""
    generated = root / "generated"
    try:
        manifest = json.loads((generated / "manifest.json").read_text())
        if manifest.get("schema") != 1 or manifest.get("toolchain") != IMAGE:
            raise ValueError("PCB export manifest has a different toolchain or format")
        if source_hashes(root) != manifest.get("sources"):
            raise ValueError("PCB sources changed after the last export")
        for name in REQUIRED_OUTPUTS:
            if name not in manifest.get("outputs", {}):
                raise ValueError(f"PCB export is incomplete: {name}")
        for name, expected in manifest["outputs"].items():
            if digest(generated / name) != expected:
                raise ValueError(f"PCB export changed after validation: {name}")
    except (OSError, KeyError, json.JSONDecodeError) as error:
        raise ValueError("PCB exports are missing or incomplete. Run make pcb.") from error
    return manifest


def record(root=ROOT):
    generated = root / "generated"
    outputs = {str(p.relative_to(generated)): digest(p) for p in sorted(generated.rglob("*"))
               if p.is_file() and p.name != "manifest.json"}
    for name in REQUIRED_OUTPUTS:
        if name not in outputs:
            raise ValueError(f"Cannot publish incomplete PCB exports: {name}")
    manifest = {"schema": 1, "toolchain": IMAGE, "sources": source_hashes(root), "outputs": outputs}
    (generated / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return validate(root)


def ensure():
    """Generate fresh exports when a development or website build needs them."""
    try:
        validate()
    except ValueError:
        import subprocess
        import sys
        subprocess.run([sys.executable, str(ROOT / "refresh.py")], check=True)
        validate()


if __name__ == "__main__":
    validate()
    print("PASS: PCB exports match the design sources and all output checksums")
