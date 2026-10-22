// === DESCRIPTION ===
// Alfa cloud: two PETG shells for five 33 mm arcade controls, LCD, and a Raspberry Pi 3.
// The battery lies flat below the horizontal Pi and its integral shelf.
// Compact cloud lobes target a 235 mm Ender plate, conservatively using 220 mm travel.
// This OpenSCAD file inspects the exact CAD-exported meshes; it does not rescale them.
// Parametric geometry and hardware positions: build.py and parameters.json.
// Run bash run-cad.sh after editing that source, then verify this file again.
// Terminology: front/rear -> shell modules; shelf -> R-B01 in the native CAD.
// Dimensions: at most 216 x 216 x 50 mm per shell, outside face on the bed.
// Coordinate system: X = width, Y = enclosure height on plate, Z = print height.
// Assembly maps Y back to the upright height, Z to enclosure depth.
// Shell joins use two locating tongues and five releasable snaps, without screws.
// Physical release force, fatigue and actual nut diameter remain unverified.
// Final review: 2026-10-19, independent Codex reviewer; exact model ID unavailable.
// === PRINT SETTINGS ===
// Material: PETG, for flexible snap joints. Nozzle: assumed 0.4 mm.
// Layer height: 0.2 mm. Perimeters: 5. Infill: 25% gyroid.
// Supports: inspect horizontal side bores and snap features in the slicer;
// use local supports only where required, with snap/release cavities blocked.
// Orientation: as imported, outside faces down, Z=0. One shell per plate.
// Notes: 2 mm brim. Print the fit coupons before committing to either shell.
// Bed edge: 0.4 mm 45-degree chamfer in the authoritative CAD geometry.
// === PARAMETERS ===
nozzle_diameter = 0.4;
layer_height = 0.2;
build_x = 220;
build_y = 220;
build_z = 100;
physical_plate = 235;
brim = 2;
case_depth = 78;
split_depth = 39;
pivot_height = 0;
opening_angle = 20;
tolerance = 0.3;
// === DERIVED CONSTANTS ===
extrusion_width = nozzle_diameter * 1.125;
fudge = 0.01;
max_shell_xy = 216;
assert(max_shell_xy + 2*brim <= build_x);
assert(max_shell_xy + 2*brim <= build_y);
assert(build_x <= physical_plate && build_y <= physical_plate);
assert(case_depth < 110);
// === MODULES ===
module front() { import("generated/cloud/front.stl"); }
module rear() { import("generated/cloud/rear.stl"); }
module rear_assembled() { translate([0,0,case_depth]) rotate([180,0,0]) rear(); }
module assembly() { front(); rear_assembled(); }
module front_tilted(angle) {
    translate([0,pivot_height,split_depth]) rotate([-angle,0,0])
        translate([0,-pivot_height,-split_depth]) front();
}
module button_coupon() { import("generated/cloud/button-fit-coupon.stl"); }
module plate_snap_02() { import("generated/cloud/snap-coupon-0.2.stl"); }
module plate_snap_03() { import("generated/cloud/snap-coupon-0.3.stl"); }
module plate_snap_04() { import("generated/cloud/snap-coupon-0.4.stl"); }
// === ASSEMBLY / RENDER ===
part = "all"; // "all", "front", "rear", "button_coupon", "plate_snap_02", "plate_snap_03", "plate_snap_04", "clash_shells", "clash_mid", "clash_open"
if (part == "all") assembly();
if (part == "front") front();
if (part == "rear") rear();
// Separate intentional floor-seat contact by fudge for the clash diagnostic.
if (part == "clash_shells") intersection() { translate([0,-fudge,-fudge]) front(); rear_assembled(); }
if (part == "button_coupon") button_coupon();
if (part == "plate_snap_02") plate_snap_02();
if (part == "plate_snap_03") plate_snap_03();
if (part == "plate_snap_04") plate_snap_04();
if (part == "clash_mid") intersection() { front_tilted(opening_angle/2); rear_assembled(); }
if (part == "clash_open") intersection() { front_tilted(opening_angle); rear_assembled(); }
