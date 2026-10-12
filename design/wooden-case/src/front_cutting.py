from cadgen import dxf
from lib.geometry import nested_profiles, parameters


@dxf(out="../DXF/front_cutting.dxf")
def front_cutting():
    return nested_profiles(parameters(), 0)


if __name__ == "__main__":
    front_cutting()
