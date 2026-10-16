from cadgen import step, glb
from lib.house import cad_assembly


@step(out="../STEP/house_roof_open.step")
def house_roof_open():
    return cad_assembly("roof_open", wires=False)


@glb(out="../GLB/house_roof_open.glb")
def house_roof_open_mesh():
    # The viewer draws the wires itself from routing.json; meshes keep only visible fasteners.
    return cad_assembly("roof_open", wires=False, all_fasteners=False)


if __name__ == "__main__":
    house_roof_open()
    house_roof_open_mesh()
