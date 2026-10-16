from cadgen import dxf
from lib.geometry import nested_profiles, parameters


@dxf(out="../DXF/rear_cutting.dxf")
def rear_cutting():
    return nested_profiles(parameters(), 1)


if __name__ == "__main__":
    rear_cutting()
