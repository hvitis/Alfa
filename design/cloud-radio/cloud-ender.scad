// === DESCRIPTION ===
// Alfa cloud: front/rear PETG shells and an independent side battery lid.
// Battery and Pi broad faces are parallel to the rear lid (XY in assembly).
// All five button bores belong to the front shell, with 4.8 mm rear bridges.
// Seven cloud-shaped speaker apertures; side battery withdrawal toward +X.
// Authoritative parameters and geometry: parameters.json and build.py.
// This wrapper inspects exact CAD meshes; never rescale to change hardware fit.
// Terminology: battery_door -> flush side lid, rear -> battery rails/Pi posts.
// Dimensions: 206 x 211 x 72 mm assembled; 210 x 215 footprint with 2 mm brim.
// Printer: Ender, 235 mm physical plate, conservative 220 mm usable XY.
// X=width, Y=upright height, Z=depth in assembly. Printable parts lie on Z=0.
// Shells use bottom tongues and five snaps; side lid uses two M2.5 screws/nuts.
// Physical fit, snap release force/fatigue and exact connector sizes unverified.
// === PRINT SETTINGS ===
// PETG, assumed 0.4 mm nozzle, 0.2 mm layers, 5 perimeters, 25% gyroid.
// Shells and lid: outside face down, one large shell per plate, 2 mm brim.
// Local supports at side-button bores, hatch bridge and selected snap undersides.
// Keep supports out of nut pockets, pilot holes and snap flex/release spaces.
// Print button and snap coupons first; inspect actual Ender slicer layers.
// === PARAMETERS ===
nozzle_diameter = 0.4;
layer_height = 0.2;
build_x = 220;
build_y = 220;
build_z = 100;
physical_plate = 235;
brim = 2;
case_width = 206;
case_height = 211;
case_depth = 72;
split_depth = 43.5;
button_axis_z = 24.5;
button_hole_diameter = 28.4;
opening_angle = 20;
tolerance = 0.3;
// === DERIVED CONSTANTS ===
fudge = 0.01;
assert(case_width + 2*brim <= build_x);
assert(case_height + 2*brim <= build_y);
assert(build_x <= physical_plate && build_y <= physical_plate);
assert(case_width <= 210-4 && case_height <= 215-4 && case_depth <= 78-6);
assert(split_depth-button_axis_z-button_hole_diameter/2 >= 4.79);
// === MODULES ===
module front() { import("generated/cloud/front.stl"); }
module rear() { import("generated/cloud/rear.stl"); }
module battery_door() { import("generated/cloud/battery_door.stl"); }
module rear_assembled() { translate([0,0,case_depth]) rotate([180,0,0]) rear(); }
module door_assembled() { translate([case_width/2,0,0]) rotate([0,-90,0]) battery_door(); }
module assembly() { front(); rear_assembled(); door_assembled(); }
module front_tilted(angle) {
    translate([0,0,split_depth]) rotate([-angle,0,0])
        translate([0,0,-split_depth]) front();
}
module button_coupon() { import("generated/cloud/button-fit-coupon.stl"); }
module insert_coupon() { import("generated/cloud/insert-fit-coupon.stl"); }
module plate_snap_02() { import("generated/cloud/snap-coupon-0.2.stl"); }
module plate_snap_03() { import("generated/cloud/snap-coupon-0.3.stl"); }
module plate_snap_04() { import("generated/cloud/snap-coupon-0.4.stl"); }
// === ASSEMBLY / RENDER ===
part = "all"; // "all", "front", "rear", "battery_door", "button_coupon", "insert_coupon", "plate_snap_02", "plate_snap_03", "plate_snap_04", "clash_shells", "clash_lid", "clash_mid", "clash_open"
if (part == "all") assembly();
if (part == "front") front();
if (part == "rear") rear();
if (part == "battery_door") battery_door();
if (part == "clash_shells") intersection() { translate([0,-fudge,-fudge]) front(); rear_assembled(); }
if (part == "clash_lid") intersection() { door_assembled(); union() { front(); rear_assembled(); } }
if (part == "button_coupon") button_coupon();
if (part == "insert_coupon") insert_coupon();
if (part == "plate_snap_02") plate_snap_02();
if (part == "plate_snap_03") plate_snap_03();
if (part == "plate_snap_04") plate_snap_04();
if (part == "clash_mid") intersection() { front_tilted(opening_angle/2); rear_assembled(); }
if (part == "clash_open") intersection() { front_tilted(opening_angle); rear_assembled(); }
