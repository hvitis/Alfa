from cadgen import step, glb
from lib.geometry import assembly, parameters


@step(out="../STEP/exploded.step")
@glb(out="../GLB/exploded.glb")
def exploded():
    return assembly(parameters(), explode=65)


if __name__ == "__main__":
    exploded()
