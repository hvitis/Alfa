from cadgen import step, glb
from lib.house import cad_assembly


@step(out="../STEP/house_exploded.step")
def house_exploded():
    return cad_assembly("exploded", wires=False)


@glb(out="../GLB/house_exploded.glb")
def house_exploded_mesh():
    # The viewer draws the wires itself from routing.json; meshes keep only visible fasteners.
    return cad_assembly("exploded", wires=False, all_fasteners=False)


if __name__ == "__main__":
    house_exploded()
    house_exploded_mesh()
