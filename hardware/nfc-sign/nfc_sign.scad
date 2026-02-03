/*
 * Tap & Tell NFC Sign - Parametric
 * =================================
 * All elements freely positionable
 *
 * Author: Tap & Tell Project
 * License: MIT
 */

// =====================
// SIGN PARAMETERS
// =====================

sign_width = 120;
sign_height = 90;
sign_thickness = 3;
corner_radius = 3;

// =====================
// ELEMENT POSITIONS (relative to sign center)
// =====================

// Title
show_title = true;
title_text = "Tap & Tell";
title_x = 0;
title_y = 30;
title_size = 16;
title_font = "Liberation Sans:style=Bold";

// Subtitle
show_subtitle = true;
subtitle_text = "Gästebuch";
subtitle_x = 0;
subtitle_y = -35;
subtitle_size = 10;
subtitle_font = "Liberation Sans:style=Regular";

// Custom text
show_custom_text = true;
custom_text = "Tippe hier!";
custom_text_x = 0;
custom_text_y = -25;
custom_text_size = 7;

// NFC area
show_nfc = true;
nfc_x = 0;
nfc_y = 0;
nfc_diameter = 30;
nfc_ring_visible = true;

// NFC waves icon
nfc_waves_visible = true;
nfc_waves_x = -2;               // X position (independent of nfc_x)
nfc_waves_y = -2;              // Y position (independent of nfc_y)
nfc_waves_size = 12;           // Size of the waves icon

// QR code
show_qr = false;
qr_x = 35;
qr_y = 10;
qr_size = 25;

// NFC pocket on back of sign
nfc_pocket_diameter = 25;  // Diameter of NFC sticker [mm]
nfc_pocket_depth = 0.5;    // Depth of pocket [mm]
nfc_pocket_extra = 0.5;    // Extra clearance around sticker [mm]

// Text/element depth
text_depth = 0.6;

// =====================
// STAND PARAMETERS
// =====================

stand_width = 100;
stand_depth = 22;
stand_height = 14;
lean_angle = 75;           // 90=vertical, 75=slight lean back

// Stand rotation for preview/printing
stand_rot_x = 0;           // Rotation around X axis
stand_rot_y = 0;           // Rotation around Y axis
stand_rot_z = 0;           // Rotation around Z axis

// =====================
// FRAME PARAMETERS
// =====================

show_frame = true;         // Show frame part
frame_border = 6;          // Width of frame border [mm]
frame_thickness = 4;       // Thickness of frame [mm]
frame_lip = 1.5;           // Lip to hold sign in place [mm]
frame_corner_radius = 5;   // Corner rounding [mm]
frame_tolerance = 0.3;     // Gap for sign to fit [mm]

// Frame rotation for preview/printing
frame_rot_x = 0;
frame_rot_y = 0;
frame_rot_z = 0;

$fn = 64;

// Colors
base_color = [0.1, 0.1, 0.1];
sign_color = [0.97, 0.97, 0.95];
text_color = [0.12, 0.12, 0.12];

// =====================
// MODULES
// =====================

module rounded_rect_2d(w, h, r) {
    hull() for (x=[-1,1], y=[-1,1])
        translate([x*(w/2-r), y*(h/2-r)]) circle(r=r);
}

module nfc_waves_2d(size) {
    for (i = [0:2]) {
        difference() {
            circle(d = size*0.4 + i*size*0.3);
            circle(d = size*0.4 + i*size*0.3 - size*0.08);
            translate([-size, -size]) square([size, size*2]);
            translate([0, -size]) square([size, size*0.9]);
        }
    }
    circle(d = size*0.12);
}

module qr_pattern_2d(size) {
    u = size/21;
    for (p = [[-1,-1],[-1,1],[1,-1]])
        translate([p[0]*(size/2-u*3.5), p[1]*(size/2-u*3.5)]) {
            difference() { square(u*7,true); square(u*5,true); }
            square(u*3, true);
        }
    for (i=[0:20]) {
        x=(i*7)%11-5; y=(i*11)%11-5;
        if (abs(x)>3||abs(y)>3) translate([x*u,y*u]) square(u*0.9,true);
    }
}

// =====================
// SIGN
// =====================

module sign_plate() {
    difference() {
        linear_extrude(sign_thickness)
            rounded_rect_2d(sign_width, sign_height, corner_radius);

        if (show_nfc)
            translate([nfc_x, nfc_y, -0.1])
                cylinder(d=nfc_pocket_diameter+nfc_pocket_extra*2, h=nfc_pocket_depth+0.2);

        if (show_qr)
            translate([qr_x, qr_y, sign_thickness-0.4])
                linear_extrude(0.5) square(qr_size+4, true);
    }
}

module sign_elements() {
    if (show_title)
        translate([title_x, title_y, sign_thickness])
            linear_extrude(text_depth)
                text(title_text, size=title_size, font=title_font, halign="center", valign="center");

    if (show_subtitle)
        translate([subtitle_x, subtitle_y, sign_thickness])
            linear_extrude(text_depth)
                text(subtitle_text, size=subtitle_size, font=subtitle_font, halign="center", valign="center");

    if (show_custom_text)
        translate([custom_text_x, custom_text_y, sign_thickness])
            linear_extrude(text_depth)
                text(custom_text, size=custom_text_size, font=subtitle_font, halign="center", valign="center");

    if (show_nfc && nfc_ring_visible)
        translate([nfc_x, nfc_y, sign_thickness])
            linear_extrude(text_depth)
                difference() { circle(d=nfc_diameter+3); circle(d=nfc_diameter-1); }

    if (show_nfc && nfc_waves_visible)
        translate([nfc_waves_x, nfc_waves_y, sign_thickness])
            linear_extrude(text_depth) nfc_waves_2d(nfc_waves_size);

    if (show_qr) {
        translate([qr_x, qr_y, sign_thickness-0.3])
            linear_extrude(0.3) square(qr_size+4, true);
        color(text_color)
        translate([qr_x, qr_y, sign_thickness])
            linear_extrude(0.3) qr_pattern_2d(qr_size);
    }
}

module sign_part() {
    color(sign_color) sign_plate();
    color(text_color) sign_elements();
}

// =====================
// STAND - Compact block with slot
// =====================

module stand_part() {
    slot_width = sign_thickness + 0.5;
    front_lip = 5;
    slot_y = front_lip + 1;  // Position of slot from front

    color(base_color)
    difference() {
        // Solid rounded block
        hull() {
            // Front - full height, rounded top
            translate([0, front_lip/2, stand_height/2])
                cube([stand_width, front_lip, stand_height], center=true);

            translate([0, front_lip/2, stand_height - 2])
                rotate([0, 90, 0])
                    cylinder(d=4, h=stand_width, center=true);

            // Back - lower, rounded
            translate([0, stand_depth - 2, 2])
                rotate([0, 90, 0])
                    cylinder(d=4, h=stand_width, center=true);
        }

        // Angled slot for sign - cuts from top down into the block
        translate([0, slot_y, -1])
            rotate([90 - lean_angle, 0, 0])
                translate([0, 0, 0])
                    cube([sign_width + 2, stand_height + 10, slot_width], center=true);
    }
}

// =====================
// FRAME - Surrounds the sign
// =====================

module frame_part() {
    outer_width = sign_width + frame_border * 2;
    outer_height = sign_height + frame_border * 2;
    inner_width = sign_width + frame_tolerance * 2;
    inner_height = sign_height + frame_tolerance * 2;

    color(base_color)
    difference() {
        // Outer frame
        linear_extrude(frame_thickness)
            rounded_rect_2d(outer_width, outer_height, frame_corner_radius);

        // Inner cutout (sign opening) - goes through most of the frame
        translate([0, 0, frame_lip])
            linear_extrude(frame_thickness)
                rounded_rect_2d(inner_width, inner_height, corner_radius);

        // Back opening (larger, for inserting sign)
        translate([0, 0, -0.1])
            linear_extrude(frame_lip + 0.2)
                rounded_rect_2d(inner_width + frame_lip*2, inner_height + frame_lip*2, corner_radius + 1);
    }
}

// =====================
// ASSEMBLY
// =====================

module assembled() {
    stand_part();

    // Sign in slot
    front_lip = 5;
    slot_y = front_lip + 1;
    translate([0, slot_y, 0])
        rotate([90 - lean_angle, 0, 0])
            translate([0, sign_height/2, -sign_thickness/2])
                sign_part();
}

// =====================
// RENDER
// =====================

// All parts for printing
translate([-sign_width/2 - 20, 0, 0])
    sign_part();

translate([stand_width/2 + 20, 0, 0])
    rotate([stand_rot_x, stand_rot_y, stand_rot_z])
        stand_part();

if (show_frame)
    translate([0, sign_height + 20, 0])
        rotate([frame_rot_x, frame_rot_y, frame_rot_z])
            frame_part();

// For assembled preview:
// assembled();

// =====================
// MULTI-COLOR EXPORT
// =====================
// Export each separately, then combine in slicer:
//
// Color 1 - Sign base (white):
// sign_plate();
//
// Color 2 - Sign text/graphics (black):
// sign_elements();
//
// Color 3 - Stand (black):
// stand_part();
//
// Color 4 - Frame (black):
// frame_part();
