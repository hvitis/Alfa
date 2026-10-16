from cadgen import dxf
from lib.geometry import nested_profiles, parameters


@dxf(out="../DXF/accessories_cutting.dxf")
def accessories_cutting():
    return nested_profiles(parameters(), 3)


if __name__ == "__main__":
    accessories_cutting()
