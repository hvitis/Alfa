from cadgen import step, glb
from lib.geometry import assembly, parameters


@step(out="../STEP/enclosure.step")
@glb(out="../GLB/enclosure.glb")
def enclosure():
    return assembly(parameters())


if __name__ == "__main__":
    enclosure()
