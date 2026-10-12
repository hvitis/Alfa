from cadgen import step, glb
from lib.geometry import assembly, parameters


@step(out="../STEP/internals.step")
@glb(out="../GLB/internals.glb")
def internals():
    return assembly(parameters(), open_case=True)


if __name__ == "__main__":
    internals()
