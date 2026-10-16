from cadgen import dxf
from lib.geometry import nested_profiles, parameters


@dxf(out="../DXF/walls_cutting.dxf")
def walls_cutting():
    return nested_profiles(parameters(), 2)


if __name__ == "__main__":
    walls_cutting()
