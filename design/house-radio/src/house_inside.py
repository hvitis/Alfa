from cadgen import step, glb
from lib.house import cad_assembly


@step(out="../STEP/house_inside.step")
def house_inside():
    return cad_assembly("inside", wires=True)


@glb(out="../GLB/house_inside.glb")
def house_inside_mesh():
    # The viewer draws the wires itself from routing.json; meshes keep only visible fasteners.
    return cad_assembly("inside", wires=False, all_fasteners=False)


if __name__ == "__main__":
    house_inside()
    house_inside_mesh()
