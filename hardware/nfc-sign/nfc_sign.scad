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

// Pockets/depths
nfc_pocket_depth = 0.6;
nfc_pocket_extra = 0.5;
text_depth = 0.6;

// =====================
// STAND PARAMETERS
// =====================

stand_width = 100;
stand_depth = 22;
stand_height = 14;
lean_angle = 75;           // 90=vertical, 75=slight lean back

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
                cylinder(d=nfc_diameter+nfc_pocket_extra*2, h=nfc_pocket_depth+0.2);

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
    front_lip = 4;

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

        // Angled slot for sign
        translate([0, front_lip + 2, 0])
            rotate([lean_angle, 0, 0])
                translate([0, 0, -5])
                    cube([sign_width + 2, slot_width, 50], center=true);
    }
}

// =====================
// ASSEMBLY
// =====================

module assembled() {
    stand_part();

    // Sign in slot
    front_lip = 4;
    translate([0, front_lip + 2, 0])
        rotate([lean_angle, 0, 0])
            translate([0, sign_height/2, sign_thickness/2])
                sign_part();
}

// =====================
// RENDER
// =====================

// Both parts for printing (sign on back, stand beside it)
translate([-sign_width/2 - 10, 0, 0])
    sign_part();

translate([stand_width/2 + 10, 0, 0])
    stand_part();

// For assembled preview:
// assembled();

// Single parts:
// sign_part();
// stand_part();
