/*
 * Tap & Tell NFC Sign
 * ====================
 * Minimalist two-part design:
 * - Sign plate (lays against stand)
 * - Stand with angled back rest and front lip
 *
 * Author: Tap & Tell Project
 * License: MIT
 */

// =====================
// USER PARAMETERS
// =====================

// Sign dimensions
sign_width = 120;           // Width [mm]
sign_height = 90;           // Height [mm]
sign_thickness = 3;         // Thickness [mm]
corner_radius = 3;

// Text settings
title_text = "Tap & Tell";
subtitle_text = "Gästebuch";
custom_text = "Tippe hier!";
title_size = 14;
subtitle_size = 9;
custom_text_size = 6;
text_depth = 0.6;
text_embossed = true;

// Fonts
title_font = "Liberation Sans:style=Bold";
subtitle_font = "Liberation Sans:style=Regular";

// NFC settings
nfc_diameter = 30;
nfc_thickness = 0.5;
nfc_pocket_extra = 0.5;
nfc_offset_x = -25;
nfc_offset_y = 5;

// QR settings
show_qr = true;
qr_size = 25;
qr_offset_x = 30;
qr_offset_y = 10;
qr_depth = 0.4;

// Stand settings
stand_width = 110;          // Width of stand [mm]
stand_base_depth = 35;      // Base depth [mm]
stand_height = 15;          // Height at front [mm]
lean_angle = 75;            // Angle of back rest from horizontal [degrees]
lip_height = 5;             // Front lip to hold sign [mm]
wall_thickness = 4;         // Thickness of back rest wall [mm]

$fn = 64;

// Colors
base_color = [0.12, 0.12, 0.12];
sign_color = [0.96, 0.96, 0.94];
text_color = [0.15, 0.15, 0.15];

// =====================
// HELPER MODULES
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
// SIGN PLATE
// =====================

module sign_plate() {
    difference() {
        linear_extrude(height = sign_thickness)
            rounded_rect_2d(sign_width, sign_height, corner_radius);

        // NFC pocket
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

    // QR area
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
// STAND (with angled back rest)
// =====================

module stand_part() {
    // Calculate back rest dimensions
    back_height = stand_base_depth * tan(lean_angle);

    difference() {
        union() {
            // Base plate
            hull() {
                // Front - rounded
                translate([0, -stand_base_depth/2 + stand_height/2, stand_height/2])
                    rotate([0, 90, 0])
                        cylinder(d = stand_height, h = stand_width, center = true);

                // Back corners - small
                translate([0, stand_base_depth/2 - 2, 1])
                    rotate([0, 90, 0])
                        cylinder(d = 2, h = stand_width, center = true);

                // Bottom fill
                translate([0, 0, 0.5])
                    cube([stand_width, stand_base_depth, 1], center = true);
            }

            // Angled back rest (sign rests against this)
            translate([0, stand_base_depth/2, 0])
                rotate([lean_angle, 0, 0])
                    translate([0, wall_thickness/2, back_height/2])
                        cube([stand_width, wall_thickness, back_height], center = true);

            // Front lip (holds bottom of sign)
            translate([0, -stand_base_depth/2 + stand_height/2 + wall_thickness, stand_height/2 + lip_height/2])
                cube([stand_width, wall_thickness, lip_height + stand_height], center = true);
        }

        // Cut bottom flat
        translate([0, 0, -50])
            cube([stand_width + 10, stand_base_depth + 50, 100], center = true);
    }
}

// =====================
// ASSEMBLED VIEW
// =====================

module assembled_view() {
    // Stand
    color(base_color)
        stand_part();

    // Sign leaning against back rest
    // Back rest starts at y = stand_base_depth/2, angled at lean_angle
    // Sign's back face should touch the front of the back rest

    back_rest_y = stand_base_depth/2;
    sign_bottom_z = stand_height + 1;  // Sits on top of front lip area

    translate([0, back_rest_y - sign_thickness * cos(lean_angle), sign_bottom_z])
        rotate([lean_angle, 0, 0])
            translate([0, sign_height/2, 0])
                sign_part();
}

// =====================
// RENDER
// =====================

// Assembled preview
assembled_view();

// For printing - uncomment one:
// sign_part();     // Print flat
// stand_part();    // Print as-is

/*
 * PRINTING:
 * - Sign: Print flat, text side up or down
 * - Stand: Print as-is, no supports needed
 *
 * ASSEMBLY:
 * - Place sign in stand, leaning against back rest
 * - Front lip prevents sign from sliding forward
 */
