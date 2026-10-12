"""Render all saved CAD/drawing outputs for review; does not build source."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
CLI=str(Path(sys.executable).parent/'cadgen')
for name in ('enclosure','exploded','internals'):
    camera='{"direction":[1,1,-1],"up":[0,1,0]}' if name=='internals' else '{"direction":[1,1,1],"up":[0,1,0]}'
    subprocess.run([CLI,'step','snapshot',str(ROOT/'STEP'/f'{name}.step'),str(ROOT/'previews'/f'{name}.png'),'--camera',camera,'--size-profile','simple'],check=True,cwd=ROOT)
for name in ('front_cutting','rear_cutting','walls_cutting','accessories_cutting'):
    subprocess.run([CLI,'dxf','snapshot',str(ROOT/'DXF'/f'{name}.dxf'),str(ROOT/'previews'/f'{name}_dxf.png')],check=True,cwd=ROOT)
