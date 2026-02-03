/*
 * Tap & Tell NFC Sign
 * ====================
 * A parametric sign for NFC tags with optional QR code display.
 * Two-part design: Sign plate + Stand (snap-fit connection)
 *
 * Author: Tap & Tell Project
 * License: MIT
 */

// =====================
// USER PARAMETERS
// =====================

// Sign dimensions
sign_width = 100;           // Width of the sign [mm]
sign_height = 120;          // Height of the sign [mm]
sign_thickness = 4;         // Base thickness [mm]
corner_radius = 8;          // Corner rounding [mm]

// Text settings
title_text = "Tap & Tell";  // Main title text
subtitle_text = "Gästebuch"; // Subtitle text
custom_text = "Tippe hier!"; // Call-to-action text
title_size = 12;            // Title font size [mm]
subtitle_size = 8;          // Subtitle font size [mm]
custom_text_size = 6;       // Custom text font size [mm]
text_depth = 0.8;           // Text engraving/emboss depth [mm]
text_embossed = true;       // true = raised text, false = engraved

// Font settings
title_font = "Liberation Sans:style=Bold";
subtitle_font = "Liberation Sans:style=Regular";

// NFC tag settings
nfc_diameter = 25;          // NFC tag diameter [mm] (common: 25, 30, 35)
nfc_thickness = 0.5;        // NFC tag thickness [mm]
nfc_pocket_extra = 0.5;     // Extra space around NFC tag [mm]
nfc_position_z = 45;        // Height of NFC center from bottom [mm]

// QR code settings
show_qr_placeholder = true; // Show QR code placeholder area
qr_size = 25;               // QR code size [mm]
qr_position_z = 85;         // Height of QR center from bottom [mm]
qr_depth = 0.6;             // QR code depth [mm]
qr_border = 2;              // Border around QR code [mm]

// Stand settings
sign_angle = 45;            // Angle of sign from horizontal [degrees]
stand_width = 80;           // Width of stand base [mm]
stand_depth = 70;           // Depth of stand base [mm]
stand_thickness = 4;        // Stand material thickness [mm]
slot_tolerance = 0.3;       // Tolerance for slot fit [mm]

// Hanging hole settings
has_hanging_hole = true;    // Include hanging hole
hanging_hole_diameter = 5;  // Hole diameter [mm]
hanging_hole_offset = 8;    // Distance from top edge [mm]

// Visual settings
$fn = 64;

// =====================
// COLORS (for preview)
// =====================
base_color = [0.2, 0.2, 0.25];
text_color = [0.95, 0.95, 0.95];
accent_color = [0.39, 0.4, 0.95];

// =====================
// CONNECTOR DIMENSIONS
// =====================
tab_width = 20;             // Width of connection tab
tab_height = 15;            // Height of tab extending from sign
tab_thickness = sign_thickness - 1;  // Slightly thinner for fit

// =====================
// PART 1: SIGN PLATE
// =====================

module rounded_rect_2d(width, height, radius) {
    hull() {
        for (x = [-1, 1], y = [-1, 1]) {
            translate([x * (width/2 - radius), y * (height/2 - radius)])
                circle(r = radius);
        }
    }
}

module nfc_waves_2d(size = 15) {
    for (i = [0:2]) {
        difference() {
            circle(d = size * 0.4 + i * size * 0.3);
            circle(d = size * 0.4 + i * size * 0.3 - size * 0.08);
            translate([-size, -size])
                square([size, size*2]);
            translate([0, -size])
                square([size, size*0.9]);
        }
    }
    circle(d = size * 0.15);
}

module qr_code_placeholder_2d(size) {
    unit = size / 21;

    // Corner position markers
    for (pos = [[-1, -1], [-1, 1], [1, -1]]) {
        translate([pos[0] * (size/2 - unit*3.5), pos[1] * (size/2 - unit*3.5)]) {
            difference() {
                square(unit * 7, center = true);
                square(unit * 5, center = true);
            }
            square(unit * 3, center = true);
        }
    }

    // Data pattern
    for (i = [0:30]) {
        x = (i * 7) % 15 - 7;
        y = (i * 11) % 15 - 7;
        if (abs(x) > 4 || abs(y) > 4) {
            translate([x * unit, y * unit])
                square(unit * 0.9, center = true);
        }
    }
}

// Sign plate - designed to lay flat for printing
module sign_plate() {
    difference() {
        union() {
            // Main plate
            linear_extrude(height = sign_thickness)
                rounded_rect_2d(sign_width, sign_height, corner_radius);

            // Connection tabs at bottom (two tabs)
            for (x = [-1, 1]) {
                translate([x * (sign_width/4), -sign_height/2 - tab_height/2 + 0.1, 0])
                    linear_extrude(height = tab_thickness)
                        rounded_rect_2d(tab_width, tab_height, 2);
            }
        }

        // NFC tag pocket (from back)
        translate([0, nfc_position_z - sign_height/2, -0.1])
            cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                     h = nfc_thickness + 0.2);

        // Hanging hole
        if (has_hanging_hole) {
            translate([0, sign_height/2 - hanging_hole_offset, -0.1])
                cylinder(d = hanging_hole_diameter, h = sign_thickness + 0.2);
        }

        // QR code recess
        if (show_qr_placeholder) {
            translate([0, qr_position_z - sign_height/2, sign_thickness - qr_depth])
                linear_extrude(height = qr_depth + 0.1)
                    square(qr_size + qr_border * 2, center = true);
        }
    }
}

// Text and graphics for sign face
module sign_graphics() {
    // Title
    translate([0, sign_height/2 - 18, sign_thickness])
        linear_extrude(height = text_depth)
            text(title_text, size = title_size,
                 font = title_font, halign = "center", valign = "center");

    // Subtitle
    translate([0, sign_height/2 - 32, sign_thickness])
        linear_extrude(height = text_depth)
            text(subtitle_text, size = subtitle_size,
                 font = subtitle_font, halign = "center", valign = "center");

    // NFC waves icon
    translate([0, nfc_position_z - sign_height/2 + nfc_diameter/2 + 10, sign_thickness])
        linear_extrude(height = text_depth)
            nfc_waves_2d(12);

    // Custom text
    translate([0, nfc_position_z - sign_height/2 - nfc_diameter/2 - 10, sign_thickness])
        linear_extrude(height = text_depth)
            text(custom_text, size = custom_text_size,
                 font = subtitle_font, halign = "center", valign = "center");

    // NFC ring indicator
    translate([0, nfc_position_z - sign_height/2, sign_thickness])
        linear_extrude(height = text_depth)
            difference() {
                circle(d = nfc_diameter + 6);
                circle(d = nfc_diameter + 2);
            }

    // QR code (white background + pattern)
    if (show_qr_placeholder) {
        // White background
        color(text_color)
        translate([0, qr_position_z - sign_height/2, sign_thickness - qr_depth])
            linear_extrude(height = qr_depth)
                square(qr_size + qr_border * 2, center = true);

        // QR pattern
        color(base_color)
        translate([0, qr_position_z - sign_height/2, sign_thickness])
            linear_extrude(height = 0.4)
                qr_code_placeholder_2d(qr_size);
    }
}

// Complete sign part (for printing flat)
module sign_part() {
    color(base_color)
        sign_plate();

    if (text_embossed) {
        color(text_color)
            sign_graphics();
    }
}

// =====================
// PART 2: STAND
// =====================

module stand_part() {
    slot_width = tab_width + slot_tolerance * 2;
    slot_depth = tab_thickness + slot_tolerance;
    slot_height = tab_height + 2;

    // Calculate the back support height based on angle
    support_height = stand_depth * tan(sign_angle);

    difference() {
        union() {
            // Base plate
            linear_extrude(height = stand_thickness)
                rounded_rect_2d(stand_width, stand_depth, 4);

            // Front edge / sign holder
            translate([0, -stand_depth/2 + stand_thickness, 0])
                cube([stand_width - 8, stand_thickness * 2, stand_thickness + slot_height], center = true);

            // Angled back support
            translate([0, stand_depth/2 - stand_thickness, stand_thickness])
                rotate([sign_angle, 0, 0])
                    translate([0, 0, 0])
                        cube([stand_width - 20, stand_thickness, support_height / sin(sign_angle)], center = true);
        }

        // Slots for sign tabs
        for (x = [-1, 1]) {
            translate([x * (sign_width/4), -stand_depth/2 + stand_thickness, stand_thickness - 0.1]) {
                // Angled slot matching sign angle
                rotate([sign_angle, 0, 0])
                    translate([0, -slot_depth/2, -1])
                        cube([slot_width, slot_depth, slot_height + 2], center = true);
            }
        }
    }
}

// =====================
// ASSEMBLY VIEW
// =====================

module assembled_view() {
    // Stand (on ground)
    color(base_color)
        stand_part();

    // Sign (inserted at angle)
    translate([0, -stand_depth/2 + stand_thickness * 1.5, stand_thickness])
        rotate([sign_angle, 0, 0])
            translate([0, sign_height/2 + tab_height - 2, 0])
                sign_part();
}

// =====================
// RENDER OPTIONS
// =====================

// Choose what to render:

// Option 1: Assembled preview (default)
assembled_view();

// Option 2: Sign plate only (for printing)
// translate([0, 0, 0]) sign_part();

// Option 3: Stand only (for printing)
// translate([0, 0, 0]) stand_part();

// Option 4: Both parts side by side (for print plate)
// translate([-sign_width/2 - 10, 0, 0]) sign_part();
// translate([stand_width/2 + 10, 0, 0]) stand_part();

/*
 * PRINTING INSTRUCTIONS:
 * ======================
 *
 * PART 1 - Sign Plate:
 * - Print face-down (text side on build plate) for smooth front
 * - Or print face-up for easier multi-color text
 * - Layer height: 0.2mm
 * - Infill: 20%
 *
 * PART 2 - Stand:
 * - Print as-is (flat on build plate)
 * - Layer height: 0.2mm
 * - Infill: 30% (for strength)
 *
 * ASSEMBLY:
 * 1. Insert sign tabs into stand slots
 * 2. Sign should click/friction fit at 45° angle
 * 3. Optional: Add small drop of glue for permanent assembly
 *
 * NFC TAG:
 * - Insert NFC sticker into pocket on back of sign
 * - Common sizes: 25mm, 30mm, 35mm diameter
 */
