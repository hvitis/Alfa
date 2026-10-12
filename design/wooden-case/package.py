"""Bundle case artifacts and source without caches or Node/Python environments."""
from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parents[1]
OUT=ROOT.parent/'moomin-wooden-case.zip'
excluded={'.cad-cache','tmp','viewer-dist','__pycache__','.DS_Store'}
files=[p for p in ROOT.rglob('*') if p.is_file() and not any(part in excluded for part in p.relative_to(ROOT).parts)]
files += [PROJECT/'docs'/name for name in ('wiring.md','improvements-todo.md','raspberry-pi-standalone.md')]
files += [PROJECT/'hardware-visualisation/src/data/setup.json']
with zipfile.ZipFile(OUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for p in sorted(files):archive.write(p,Path('moomin-case')/p.relative_to(PROJECT))
    archive.writestr('moomin-case/START-HERE.txt','Open design/wooden-case/viewer.html in a desktop browser.\nPrint design/wooden-case/PDF/a4_cutting_and_drilling.pdf at 100%.\nRead design/wooden-case/README.md before cutting.\nThis bundle contains case planning files, not the Pi application.\n')
print(f'Wrote {OUT.name}: {len(files)} files, {OUT.stat().st_size/1048576:.1f} MiB')
