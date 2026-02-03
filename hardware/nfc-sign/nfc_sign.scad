/*
 * Tap & Tell NFC Sign
 * ====================
 * Minimalist two-part design: Sign plate + Simple slot stand
 * Inspired by e-ink display stands
 *
 * Author: Tap & Tell Project
 * License: MIT
 */

// =====================
// USER PARAMETERS
// =====================

// Sign dimensions
sign_width = 120;           // Width of the sign [mm]
sign_height = 90;           // Height of the sign [mm]
sign_thickness = 3;         // Sign thickness [mm]
corner_radius = 3;          // Corner rounding [mm]

// Text settings
title_text = "Tap & Tell";
subtitle_text = "Gästebuch";
custom_text = "Tippe hier!";
title_size = 14;
subtitle_size = 9;
custom_text_size = 6;
text_depth = 0.6;
text_embossed = true;

// Font settings
title_font = "Liberation Sans:style=Bold";
subtitle_font = "Liberation Sans:style=Regular";

// NFC tag settings
nfc_diameter = 30;
nfc_thickness = 0.5;
nfc_pocket_extra = 0.5;
nfc_offset_x = -25;
nfc_offset_y = 5;

// QR code settings
show_qr = true;
qr_size = 25;
qr_offset_x = 30;
qr_offset_y = 10;
qr_depth = 0.4;

// Stand settings
stand_width = 100;          // Width of stand [mm]
stand_depth = 30;           // Depth (front to back) [mm]
stand_height = 12;          // Height of stand [mm]
slot_angle = 80;            // Angle from horizontal (90=vertical)
slot_insert_depth = 10;     // How deep sign goes into slot [mm]
slot_tolerance = 0.3;       // Gap for easy fit [mm]

// Visual settings
$fn = 64;

// Colors
base_color = [0.12, 0.12, 0.12];
sign_color = [0.96, 0.96, 0.94];
text_color = [0.15, 0.15, 0.15];

// =====================
// MODULES
// =====================

module rounded_rect_2d(width, height, radius) {
    hull() {
        for (x = [-1, 1], y = [-1, 1])
            translate([x * (width/2 - radius), y * (height/2 - radius)])
                circle(r = radius);
    }
}

module nfc_waves_2d(size = 15) {
    for (i = [0:2]) {
        difference() {
            circle(d = size * 0.4 + i * size * 0.28);
            circle(d = size * 0.4 + i * size * 0.28 - size * 0.07);
            translate([-size, -size]) square([size, size*2]);
            translate([0, -size]) square([size, size*0.85]);
        }
    }
    circle(d = size * 0.12);
}

module qr_pattern_2d(size) {
    unit = size / 21;
    for (pos = [[-1, -1], [-1, 1], [1, -1]]) {
        translate([pos[0] * (size/2 - unit*3.5), pos[1] * (size/2 - unit*3.5)]) {
            difference() {
                square(unit * 7, center = true);
                square(unit * 5, center = true);
            }
            square(unit * 3, center = true);
        }
    }
    for (i = [0:25]) {
        x = (i * 7) % 13 - 6;
        y = (i * 11) % 13 - 6;
        if (abs(x) > 4 || abs(y) > 4)
            translate([x * unit, y * unit])
                square(unit * 0.85, center = true);
    }
}

// =====================
// SIGN PLATE (prints flat)
// =====================

module sign_plate() {
    difference() {
        linear_extrude(height = sign_thickness)
            rounded_rect_2d(sign_width, sign_height, corner_radius);

        // NFC pocket from back
        translate([nfc_offset_x, nfc_offset_y, -0.1])
            cylinder(d = nfc_diameter + nfc_pocket_extra * 2, h = nfc_thickness + 0.2);

        // QR recess
        if (show_qr)
            translate([qr_offset_x, qr_offset_y, sign_thickness - qr_depth])
                linear_extrude(height = qr_depth + 0.1)
                    square(qr_size + 4, center = true);
    }
}

module sign_graphics() {
    // Title
    translate([qr_offset_x, qr_offset_y + qr_size/2 + 8, sign_thickness])
        linear_extrude(height = text_depth)
            text(title_text, size = title_size, font = title_font, halign = "center", valign = "center");

    // NFC ring
    translate([nfc_offset_x, nfc_offset_y, sign_thickness])
        linear_extrude(height = text_depth)
            difference() {
                circle(d = nfc_diameter + 4);
                circle(d = nfc_diameter);
            }

    // NFC waves
    translate([nfc_offset_x, nfc_offset_y + nfc_diameter/2 + 8, sign_thickness])
        linear_extrude(height = text_depth)
            nfc_waves_2d(10);

    // Tap text
    translate([nfc_offset_x, nfc_offset_y - nfc_diameter/2 - 8, sign_thickness])
        linear_extrude(height = text_depth)
            text(custom_text, size = custom_text_size, font = subtitle_font, halign = "center", valign = "center");

    // QR background + pattern
    if (show_qr) {
        translate([qr_offset_x, qr_offset_y, sign_thickness - qr_depth])
            linear_extrude(height = qr_depth)
                square(qr_size + 4, center = true);

        color(text_color)
        translate([qr_offset_x, qr_offset_y, sign_thickness])
            linear_extrude(height = 0.3)
                qr_pattern_2d(qr_size);
    }

    // Subtitle
    translate([0, -sign_height/2 + 10, sign_thickness])
        linear_extrude(height = text_depth)
            text(subtitle_text, size = subtitle_size, font = subtitle_font, halign = "center", valign = "center");
}

module sign_part() {
    color(sign_color) sign_plate();
    if (text_embossed) color(text_color) sign_graphics();
}

// =====================
// STAND (simple block with angled slot)
// =====================

module stand_part() {
    slot_width = sign_thickness + slot_tolerance;

    // Position of slot center from front
    slot_front_offset = 8;

    difference() {
        // Main body - rounded block
        hull() {
            // Front cylinder (creates rounded front edge)
            translate([0, -stand_depth/2 + stand_height/2, stand_height/2])
                rotate([0, 90, 0])
                    cylinder(d = stand_height, h = stand_width, center = true);

            // Back - flat with small rounding
            translate([0, stand_depth/2 - 2, 1])
                rotate([0, 90, 0])
                    cylinder(d = 2, h = stand_width, center = true);

            // Bottom
            translate([0, 0, 0.5])
                cube([stand_width, stand_depth, 1], center = true);
        }

        // Angled slot - cut from top
        // The slot is angled so sign leans back slightly
        translate([0, -stand_depth/2 + slot_front_offset, stand_height])
            rotate([-(90 - slot_angle), 0, 0])
                translate([0, 0, -slot_insert_depth])
                    cube([sign_width + 2, slot_width, slot_insert_depth * 2 + stand_height], center = true);
    }
}

// =====================
// ASSEMBLED VIEW
// =====================

module assembled_view() {
    // Stand on ground
    color(base_color)
        stand_part();

    // Sign in slot
    // Position: front of stand, rotated to match slot angle
    slot_front_offset = 8;

    translate([0, -stand_depth/2 + slot_front_offset, stand_height - 1])
        rotate([slot_angle, 0, 0])
            translate([0, sign_height/2, 0])
                sign_part();
}

// =====================
// RENDER
// =====================

assembled_view();

// For printing:
// sign_part();
// stand_part();
// translate([-70, 0, 0]) sign_part();  translate([60, 0, 0]) stand_part();

/*
 * PRINTING:
 * - Sign: print flat, face down for smooth surface
 * - Stand: print as-is, no supports needed
 * - Adjust slot_tolerance if fit is too tight/loose
 */
