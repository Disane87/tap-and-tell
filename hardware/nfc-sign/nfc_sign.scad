/*
 * Tap & Tell NFC Sign
 * ====================
 * A parametric sign for NFC tags with optional QR code display.
 * Can be used as a standing sign or wall-mounted.
 *
 * Author: Tap & Tell Project
 * License: MIT
 *
 * Usage:
 * - Adjust parameters below to customize the sign
 * - For QR codes, use the qr_data module or import an SVG/DXF
 * - Print in two colors for best results (base + text/logo)
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

// Font settings (use fonts installed on your system)
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
has_stand = true;           // Include integrated stand
stand_angle = 75;           // Lean angle from vertical [degrees] (90 = vertical)
stand_depth = 60;           // How far back the stand extends [mm]
stand_thickness = 3;        // Stand material thickness [mm]

// Hanging hole settings
has_hanging_hole = true;    // Include hanging hole
hanging_hole_diameter = 5;  // Hole diameter [mm]
hanging_hole_offset = 8;    // Distance from top edge [mm]

// Visual settings
$fn = 64;                   // Circle resolution

// =====================
// COLORS (for preview)
// =====================
base_color = [0.2, 0.2, 0.25];      // Dark gray base
text_color = [0.95, 0.95, 0.95];    // White text
accent_color = [0.39, 0.4, 0.95];   // Indigo accent (#6366f1)

// =====================
// MODULES
// =====================

// Rounded rectangle in XZ plane (standing upright)
module rounded_rect_xz(width, height, thickness, radius) {
    // Create in XY plane then rotate to XZ
    rotate([90, 0, 0])
        translate([0, 0, -thickness])
            hull() {
                for (x = [-1, 1], y = [-1, 1]) {
                    translate([x * (width/2 - radius), y * (height/2 - radius), 0])
                        cylinder(r = radius, h = thickness);
                }
            }
}

// WiFi-style NFC indicator (in XZ plane)
module nfc_waves_xz(size = 15, depth = 1) {
    rotate([90, 0, 0])
        translate([0, 0, -depth])
            linear_extrude(height = depth) {
                for (i = [0:2]) {
                    difference() {
                        circle(d = size * 0.4 + i * size * 0.3);
                        circle(d = size * 0.4 + i * size * 0.3 - size * 0.08);
                        translate([-size, -size, 0])
                            square([size, size*2]);
                        translate([0, -size, 0])
                            square([size, size*0.9]);
                    }
                }
                // Center dot
                circle(d = size * 0.15);
            }
}

// Simple QR-like pattern (placeholder)
module qr_code_placeholder_xz(size, depth) {
    unit = size / 21;

    rotate([90, 0, 0])
        translate([0, 0, -depth])
            linear_extrude(height = depth) {
                // Corner position markers
                for (pos = [[-1, -1], [-1, 1], [1, -1]]) {
                    translate([pos[0] * (size/2 - unit*3.5), pos[1] * (size/2 - unit*3.5), 0]) {
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
                        translate([x * unit, y * unit, 0])
                            square(unit * 0.9, center = true);
                    }
                }
            }
}

// Main sign body (standing upright in XZ plane)
module sign_body() {
    difference() {
        // Main plate - centered at origin, bottom at z=0
        translate([0, 0, sign_height/2])
            rounded_rect_xz(sign_width, sign_height, sign_thickness, corner_radius);

        // NFC tag pocket (from back, into -Y direction)
        translate([0, sign_thickness/2 + 0.1, nfc_position_z])
            rotate([90, 0, 0])
                cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                         h = nfc_thickness + 0.2);

        // Hanging hole (through Y axis)
        if (has_hanging_hole) {
            translate([0, sign_thickness/2 + 0.1, sign_height - hanging_hole_offset])
                rotate([90, 0, 0])
                    cylinder(d = hanging_hole_diameter, h = sign_thickness + 0.2);
        }

        // Engraved text (if not embossed)
        if (!text_embossed) {
            translate([0, -sign_thickness/2 - 0.01, 0])
                sign_text_3d();
        }

        // QR code recess
        if (show_qr_placeholder) {
            translate([0, -sign_thickness/2 - 0.01, qr_position_z])
                rotate([90, 0, 0])
                    translate([0, 0, -qr_depth - 0.1])
                        linear_extrude(height = qr_depth + 0.2)
                            square(qr_size + qr_border * 2, center = true);
        }
    }
}

// Text elements (in 3D, facing -Y direction)
module sign_text_3d() {
    // Title
    translate([0, 0, sign_height - 18])
        rotate([90, 0, 0])
            translate([0, 0, -text_depth])
                linear_extrude(height = text_depth)
                    text(title_text, size = title_size,
                         font = title_font, halign = "center", valign = "center");

    // Subtitle
    translate([0, 0, sign_height - 32])
        rotate([90, 0, 0])
            translate([0, 0, -text_depth])
                linear_extrude(height = text_depth)
                    text(subtitle_text, size = subtitle_size,
                         font = subtitle_font, halign = "center", valign = "center");

    // NFC symbol near tag area
    translate([0, 0, nfc_position_z + nfc_diameter/2 + 10])
        nfc_waves_xz(12, text_depth);

    // Custom text below NFC area
    translate([0, 0, nfc_position_z - nfc_diameter/2 - 10])
        rotate([90, 0, 0])
            translate([0, 0, -text_depth])
                linear_extrude(height = text_depth)
                    text(custom_text, size = custom_text_size,
                         font = subtitle_font, halign = "center", valign = "center");

    // NFC ring indicator
    translate([0, 0, nfc_position_z])
        rotate([90, 0, 0])
            translate([0, 0, -text_depth])
                linear_extrude(height = text_depth)
                    difference() {
                        circle(d = nfc_diameter + 6);
                        circle(d = nfc_diameter + 2);
                    }
}

// QR code element (white background + black code)
module qr_code_element_3d() {
    // White background
    color(text_color)
        translate([0, -sign_thickness/2 + qr_depth, qr_position_z])
            rotate([90, 0, 0])
                translate([0, 0, -qr_depth])
                    linear_extrude(height = qr_depth)
                        square(qr_size + qr_border * 2, center = true);

    // QR code pattern (placeholder)
    color(base_color)
        translate([0, -sign_thickness/2, qr_position_z])
            qr_code_placeholder_xz(qr_size, 0.4);
}

// Stand module - supports the sign from behind
module stand_support() {
    // Calculate geometry based on lean angle
    // The sign leans back, so stand connects at bottom-back and extends to floor

    lean_back = 90 - stand_angle; // How much the sign leans back from vertical

    // Base plate on the ground
    base_width = sign_width * 0.6;
    base_length = stand_depth;

    // Ground base
    translate([-base_width/2, 0, 0])
        cube([base_width, base_length, stand_thickness]);

    // Angled support struts (left and right)
    strut_width = 8;
    strut_height = sign_height * 0.3;

    for (side = [-1, 1]) {
        translate([side * (base_width/2 - strut_width/2), sign_thickness/2, 0]) {
            // Triangular support
            hull() {
                // Bottom back corner
                translate([-strut_width/2, stand_depth - stand_thickness, 0])
                    cube([strut_width, stand_thickness, stand_thickness]);

                // Top connection to sign (at the back of the sign)
                translate([-strut_width/2, 0, strut_height])
                    cube([strut_width, stand_thickness, stand_thickness]);

                // Bottom front corner (at sign base)
                translate([-strut_width/2, 0, 0])
                    cube([strut_width, stand_thickness, stand_thickness]);
            }
        }
    }

    // Back crossbar for stability
    translate([-base_width/2, stand_depth - stand_thickness, 0])
        cube([base_width, stand_thickness, stand_thickness * 2]);

    // Front lip to hold the sign
    translate([-base_width/2, -stand_thickness, 0])
        cube([base_width, stand_thickness + sign_thickness/2, stand_thickness]);
}

// Alternative: Simple angled stand
module simple_stand() {
    base_width = sign_width * 0.5;

    // Base plate
    translate([-base_width/2, 0, 0])
        cube([base_width, stand_depth, stand_thickness]);

    // Back support (angled)
    support_height = stand_depth * tan(90 - stand_angle);

    translate([-base_width/2, stand_depth - stand_thickness, 0])
        rotate([-(90 - stand_angle), 0, 0])
            cube([base_width, stand_thickness, sqrt(pow(stand_depth, 2) + pow(support_height, 2))]);

    // Front lip
    translate([-base_width/2, -stand_thickness, 0])
        cube([base_width, stand_thickness * 2, stand_thickness * 3]);
}

// Elegant A-frame stand
module a_frame_stand() {
    base_width = sign_width * 0.5;
    base_depth = stand_depth;

    // Calculate back support angle
    back_angle = atan(base_depth / (sign_height * 0.4));
    support_length = sqrt(pow(base_depth, 2) + pow(sign_height * 0.4, 2));

    // Ground base plate
    color(base_color)
    translate([-base_width/2, -stand_thickness, 0])
        cube([base_width, base_depth + stand_thickness * 2, stand_thickness]);

    // Two angled back supports
    for (side = [-1, 1]) {
        color(base_color)
        translate([side * base_width/3, sign_thickness/2 + stand_thickness, stand_thickness]) {
            rotate([-back_angle, 0, 0])
                translate([-stand_thickness, 0, 0])
                    cube([stand_thickness * 2, stand_thickness, support_length]);
        }
    }

    // Front retaining lip
    color(base_color)
    translate([-base_width/2, -stand_thickness, 0])
        cube([base_width, stand_thickness, stand_thickness * 4]);

    // Back crossbar
    color(base_color)
    translate([-base_width/2, base_depth, 0])
        cube([base_width, stand_thickness, stand_thickness * 2]);
}

// =====================
// ASSEMBLY
// =====================

module complete_sign() {
    // The sign stands upright, front face in -Y direction
    // Bottom of sign at Z=0

    // Base sign body
    color(base_color)
        sign_body();

    // Embossed text (on front face)
    if (text_embossed) {
        color(text_color)
            translate([0, -sign_thickness/2 - 0.01, 0])
                sign_text_3d();
    }

    // QR code
    if (show_qr_placeholder) {
        qr_code_element_3d();
    }

    // Stand
    if (has_stand) {
        a_frame_stand();
    }
}

// =====================
// RENDER
// =====================

// Complete assembled sign
complete_sign();

// =====================
// PRINT HELPERS
// =====================

// Uncomment these for printing separate parts:

// Sign body only - lay flat for printing
// rotate([90, 0, 0]) sign_body();

// Sign with text - lay flat for printing
// rotate([90, 0, 0]) { sign_body(); translate([0, -sign_thickness/2 - 0.01, 0]) sign_text_3d(); }

// Stand only - already flat
// a_frame_stand();

/*
 * PRINTING TIPS:
 * ==============
 * 1. For the sign: rotate 90° to lay flat (front face down)
 * 2. Use 0.2mm layer height for good detail
 * 3. For multi-color text:
 *    - Print base in dark color
 *    - Pause at text layer height
 *    - Switch to white/light filament
 *    - Or use multi-material printer
 * 4. NFC tag installation:
 *    - Insert NFC sticker into pocket from back
 *    - Secure with tape or thin layer of glue
 * 5. Stand can be printed separately and glued
 *
 * CUSTOMIZATION:
 * ==============
 * - For real QR codes, export your QR as SVG and import:
 *   import("your_qr_code.svg");
 * - Or use the qr_code library for OpenSCAD
 * - Adjust nfc_diameter to match your NFC tags
 * - Common NFC tag sizes: 25mm, 30mm, 35mm diameter
 */
