from cadgen import step, glb
from lib.house import cad_assembly


@step(out="../STEP/house_assembled.step")
def house_assembled():
    return cad_assembly("assembled", wires=True)


@glb(out="../GLB/house_assembled.glb")
def house_assembled_mesh():
    # The viewer draws the wires itself from routing.json; meshes keep only visible fasteners.
    return cad_assembly("assembled", wires=False, all_fasteners=False)


if __name__ == "__main__":
    house_assembled()
    house_assembled_mesh()
