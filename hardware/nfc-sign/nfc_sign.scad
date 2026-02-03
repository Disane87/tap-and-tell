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
title_text = "Tap & Tell";  // Main title text
subtitle_text = "Gästebuch"; // Subtitle text
custom_text = "Tippe hier!"; // Call-to-action text
title_size = 14;            // Title font size [mm]
subtitle_size = 9;          // Subtitle font size [mm]
custom_text_size = 6;       // Custom text font size [mm]
text_depth = 0.6;           // Text depth [mm]
text_embossed = true;       // true = raised, false = engraved

// Font settings
title_font = "Liberation Sans:style=Bold";
subtitle_font = "Liberation Sans:style=Regular";

// NFC tag settings
nfc_diameter = 30;          // NFC tag diameter [mm]
nfc_thickness = 0.5;        // NFC tag thickness [mm]
nfc_pocket_extra = 0.5;     // Extra clearance [mm]
nfc_offset_x = -25;         // X offset from center [mm]
nfc_offset_y = -5;          // Y offset from center [mm]

// QR code settings
show_qr = true;             // Show QR code area
qr_size = 25;               // QR code size [mm]
qr_offset_x = 30;           // X offset from center [mm]
qr_offset_y = 10;           // Y offset from center [mm]
qr_depth = 0.4;             // QR recess depth [mm]

// Stand settings
stand_width = 100;          // Width of stand [mm]
stand_depth = 25;           // Depth of stand [mm]
stand_height = 15;          // Height of stand [mm]
slot_angle = 75;            // Angle of slot (90=vertical, smaller=more tilt back)
slot_depth = 12;            // How deep the slot is [mm]
slot_tolerance = 0.4;       // Extra space for sign fit [mm]

// Hanging hole
has_hanging_hole = false;   // Include hanging hole
hanging_hole_diameter = 4;
hanging_hole_offset = 6;

// Visual settings
$fn = 64;

// Colors
base_color = [0.15, 0.15, 0.15];    // Dark stand
sign_color = [0.95, 0.95, 0.93];    // Off-white sign
text_color = [0.2, 0.2, 0.2];       // Dark text

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

    // Corner markers
    for (pos = [[-1, -1], [-1, 1], [1, -1]]) {
        translate([pos[0] * (size/2 - unit*3.5), pos[1] * (size/2 - unit*3.5)]) {
            difference() {
                square(unit * 7, center = true);
                square(unit * 5, center = true);
            }
            square(unit * 3, center = true);
        }
    }

    // Random data pattern
    for (i = [0:25]) {
        x = (i * 7) % 13 - 6;
        y = (i * 11) % 13 - 6;
        if (abs(x) > 4 || abs(y) > 4)
            translate([x * unit, y * unit])
                square(unit * 0.85, center = true);
    }
}

// =====================
// PART 1: SIGN PLATE
// =====================

module sign_plate() {
    difference() {
        // Main plate
        linear_extrude(height = sign_thickness)
            rounded_rect_2d(sign_width, sign_height, corner_radius);

        // NFC pocket (from back, doesn't go all the way through)
        translate([nfc_offset_x, nfc_offset_y, -0.1])
            cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                     h = nfc_thickness + 0.2);

        // Hanging hole
        if (has_hanging_hole)
            translate([0, sign_height/2 - hanging_hole_offset, -0.1])
                cylinder(d = hanging_hole_diameter, h = sign_thickness + 0.2);

        // QR recess
        if (show_qr)
            translate([qr_offset_x, qr_offset_y, sign_thickness - qr_depth])
                linear_extrude(height = qr_depth + 0.1)
                    square(qr_size + 4, center = true);
    }
}

module sign_graphics() {
    // Title (top area)
    translate([qr_offset_x, qr_offset_y + qr_size/2 + 8, sign_thickness])
        linear_extrude(height = text_depth)
            text(title_text, size = title_size,
                 font = title_font, halign = "center", valign = "center");

    // NFC indicator ring
    translate([nfc_offset_x, nfc_offset_y, sign_thickness])
        linear_extrude(height = text_depth)
            difference() {
                circle(d = nfc_diameter + 4);
                circle(d = nfc_diameter);
            }

    // NFC waves icon
    translate([nfc_offset_x, nfc_offset_y + nfc_diameter/2 + 8, sign_thickness])
        linear_extrude(height = text_depth)
            nfc_waves_2d(10);

    // "Tap here" text under NFC
    translate([nfc_offset_x, nfc_offset_y - nfc_diameter/2 - 8, sign_thickness])
        linear_extrude(height = text_depth)
            text(custom_text, size = custom_text_size,
                 font = subtitle_font, halign = "center", valign = "center");

    // QR code area
    if (show_qr) {
        // White background for QR
        translate([qr_offset_x, qr_offset_y, sign_thickness - qr_depth])
            linear_extrude(height = qr_depth)
                square(qr_size + 4, center = true);

        // QR pattern
        color(text_color)
        translate([qr_offset_x, qr_offset_y, sign_thickness])
            linear_extrude(height = 0.3)
                qr_pattern_2d(qr_size);
    }

    // Subtitle at bottom
    translate([0, -sign_height/2 + 10, sign_thickness])
        linear_extrude(height = text_depth)
            text(subtitle_text, size = subtitle_size,
                 font = subtitle_font, halign = "center", valign = "center");
}

module sign_part() {
    color(sign_color)
        sign_plate();

    if (text_embossed)
        color(text_color)
            sign_graphics();
}

// =====================
// PART 2: STAND (Simple slot base)
// =====================

module stand_part() {
    slot_width = sign_thickness + slot_tolerance;

    difference() {
        // Main body - simple rounded rectangle block
        hull() {
            // Front edge (rounded)
            translate([0, -stand_depth/2 + stand_height/2, stand_height/2])
                rotate([0, 90, 0])
                    cylinder(d = stand_height, h = stand_width, center = true);

            // Back edge (rounded)
            translate([0, stand_depth/2 - 3, 1.5])
                rotate([0, 90, 0])
                    cylinder(d = 3, h = stand_width, center = true);

            // Bottom plate
            translate([0, 0, 1])
                cube([stand_width, stand_depth, 2], center = true);
        }

        // Angled slot for sign
        translate([0, -stand_depth/2 + stand_height/2 + 2, 0])
            rotate([90 - slot_angle, 0, 0])
                translate([0, slot_depth/2, 0])
                    cube([sign_width + 2, slot_depth, slot_width], center = true);

        // Extend slot through bottom
        translate([0, -stand_depth/2 + stand_height/2 + 2, -1])
            rotate([90 - slot_angle, 0, 0])
                translate([0, 0, 0])
                    cube([sign_width + 2, 3, slot_width + 2], center = true);
    }
}

// =====================
// ASSEMBLY VIEW
// =====================

module assembled_view() {
    // Stand
    color(base_color)
        stand_part();

    // Sign inserted in slot
    slot_y = -stand_depth/2 + stand_height/2 + 2;

    translate([0, slot_y, 0])
        rotate([90 - slot_angle, 0, 0])
            translate([0, sign_height/2, sign_thickness/2])
                rotate([0, 0, 0])
                    sign_part();
}

// =====================
// RENDER OPTIONS
// =====================

// Default: Assembled preview
assembled_view();

// For printing - uncomment ONE:
// sign_part();                    // Sign plate (print face-down)
// stand_part();                   // Stand base

// Both parts for print plate:
// translate([-70, 0, 0]) sign_part();
// translate([70, 0, 0]) stand_part();

/*
 * PRINTING GUIDE:
 * ===============
 *
 * SIGN PLATE:
 * - Print face-down for smooth front surface
 * - Material: White/light PLA, PETG
 * - Layer: 0.2mm, Infill: 20%
 * - For multi-color: pause at text layer
 *
 * STAND:
 * - Print as-is (flat bottom)
 * - Material: Black/dark PLA, PETG
 * - Layer: 0.2mm, Infill: 30%
 *
 * ASSEMBLY:
 * - Simply slide sign into slot
 * - Friction fit holds it in place
 * - Adjust slot_tolerance if too tight/loose
 *
 * NFC TAG:
 * - Stick NFC tag in pocket on back of sign
 * - Tag sits flush, invisible from front
 */
