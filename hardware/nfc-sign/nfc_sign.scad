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
nfc_position_y = -15;       // Y offset from center [mm]

// QR code settings
show_qr_placeholder = true; // Show QR code placeholder area
qr_size = 25;               // QR code size [mm]
qr_position_y = 25;         // Y offset from center [mm]
qr_depth = 0.6;             // QR code depth [mm]
qr_border = 2;              // Border around QR code [mm]

// Stand settings
has_stand = true;           // Include integrated stand
stand_angle = 70;           // Stand angle [degrees]
stand_width = 40;           // Stand width [mm]
stand_depth = 50;           // Stand depth [mm]
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

// Rounded rectangle module
module rounded_rect(width, height, thickness, radius) {
    hull() {
        for (x = [-1, 1], y = [-1, 1]) {
            translate([x * (width/2 - radius), y * (height/2 - radius), 0])
                cylinder(r = radius, h = thickness);
        }
    }
}

// NFC symbol (tap icon)
module nfc_symbol(size = 20, depth = 1) {
    // Hand/finger icon with signal waves
    linear_extrude(height = depth) {
        // Finger
        translate([0, -size*0.15, 0])
            resize([size*0.25, size*0.5])
                circle(d = 1);

        // Signal waves
        for (i = [1:3]) {
            difference() {
                circle(d = size * 0.3 + i * size * 0.18);
                circle(d = size * 0.3 + i * size * 0.18 - size * 0.06);
                translate([-size, -size*1.5, 0])
                    square([size*2, size*1.5]);
                translate([-size, 0, 0])
                    square([size*0.4, size]);
            }
        }
    }
}

// WiFi-style NFC indicator
module nfc_waves(size = 15, depth = 1) {
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

// QR code placeholder (checkerboard pattern)
module qr_placeholder(size, depth, modules = 5) {
    module_size = size / modules;

    linear_extrude(height = depth) {
        for (x = [0:modules-1], y = [0:modules-1]) {
            if ((x + y) % 2 == 0 ||
                (x < 2 && y < 2) ||
                (x < 2 && y > modules-3) ||
                (x > modules-3 && y < 2)) {
                translate([
                    -size/2 + x * module_size + module_size/2,
                    -size/2 + y * module_size + module_size/2,
                    0
                ])
                    square(module_size * 0.9, center = true);
            }
        }
    }
}

// Position markers for QR code corners
module qr_position_marker(size, depth) {
    module_size = size / 7;
    linear_extrude(height = depth) {
        difference() {
            square(module_size * 7, center = true);
            square(module_size * 5, center = true);
        }
        square(module_size * 3, center = true);
    }
}

// Simple QR-like pattern (placeholder - replace with actual QR import)
module qr_code_placeholder(size, depth) {
    unit = size / 21; // Standard QR is 21x21 minimum

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

        // Some random data pattern (for visual effect)
        for (i = [0:30]) {
            x = (i * 7) % 15 - 7;
            y = (i * 11) % 15 - 7;
            if (abs(x) > 4 || abs(y) > 4) { // Avoid corner markers
                translate([x * unit, y * unit, 0])
                    square(unit * 0.9, center = true);
            }
        }
    }
}

// Stand module
module stand(width, depth, thickness, angle) {
    // Back support that connects to sign
    rotate([90 - angle, 0, 0]) {
        // Triangular support
        linear_extrude(height = thickness) {
            polygon([
                [0, 0],
                [width, 0],
                [width, depth * sin(angle)],
                [0, depth * sin(angle)]
            ]);
        }
    }

    // Base foot
    translate([0, -depth * cos(angle) + thickness, 0])
        cube([width, depth * cos(angle), thickness]);

    // Connecting piece to sign back
    translate([0, 0, 0])
        cube([width, thickness, sign_thickness]);
}

// Main sign body
module sign_body() {
    difference() {
        // Main plate
        rounded_rect(sign_width, sign_height, sign_thickness, corner_radius);

        // NFC tag pocket (from back)
        translate([0, nfc_position_y, -0.1])
            cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                     h = nfc_thickness + 0.2);

        // Hanging hole
        if (has_hanging_hole) {
            translate([0, sign_height/2 - hanging_hole_offset, -0.1])
                cylinder(d = hanging_hole_diameter, h = sign_thickness + 0.2);
        }

        // Engraved text (if not embossed)
        if (!text_embossed) {
            translate([0, 0, sign_thickness - text_depth + 0.01])
                sign_text();
        }

        // QR code recess
        if (show_qr_placeholder) {
            translate([0, qr_position_y, sign_thickness - qr_depth + 0.01])
                linear_extrude(height = qr_depth + 0.1)
                    square(qr_size + qr_border * 2, center = true);
        }
    }
}

// Text elements
module sign_text() {
    // Title
    translate([0, sign_height/2 - 18, 0])
        linear_extrude(height = text_depth)
            text(title_text, size = title_size,
                 font = title_font, halign = "center", valign = "center");

    // Subtitle
    translate([0, sign_height/2 - 32, 0])
        linear_extrude(height = text_depth)
            text(subtitle_text, size = subtitle_size,
                 font = subtitle_font, halign = "center", valign = "center");

    // NFC symbol near tag area
    translate([0, nfc_position_y + nfc_diameter/2 + 12, 0])
        nfc_waves(12, text_depth);

    // Custom text below NFC area
    translate([0, nfc_position_y - nfc_diameter/2 - 8, 0])
        linear_extrude(height = text_depth)
            text(custom_text, size = custom_text_size,
                 font = subtitle_font, halign = "center", valign = "center");

    // NFC ring indicator
    translate([0, nfc_position_y, 0])
        linear_extrude(height = text_depth)
            difference() {
                circle(d = nfc_diameter + 4);
                circle(d = nfc_diameter + 1);
            }
}

// QR code element (white background + black code)
module qr_code_element() {
    // White background
    color(text_color)
        translate([0, qr_position_y, sign_thickness - qr_depth])
            linear_extrude(height = qr_depth)
                square(qr_size + qr_border * 2, center = true);

    // QR code pattern (placeholder)
    color(base_color)
        translate([0, qr_position_y, sign_thickness])
            qr_code_placeholder(qr_size, 0.4);
}

// =====================
// ASSEMBLY
// =====================

module complete_sign() {
    // Base sign
    color(base_color)
        sign_body();

    // Embossed text
    if (text_embossed) {
        color(text_color)
            translate([0, 0, sign_thickness - 0.01])
                sign_text();
    }

    // QR code
    if (show_qr_placeholder) {
        qr_code_element();
    }

    // Stand
    if (has_stand) {
        color(base_color)
            translate([-stand_width/2, -sign_height/2 + corner_radius, 0])
                rotate([0, 0, 0])
                    stand(stand_width, stand_depth, stand_thickness, stand_angle);
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

// Sign body only (for main print)
// sign_body();

// Text plate only (for multi-color or inlay)
// translate([0, 0, sign_thickness]) sign_text();

// Stand only
// translate([-stand_width/2, 0, 0]) stand(stand_width, stand_depth, stand_thickness, stand_angle);

// Flat stand (for easier printing)
// translate([-stand_width/2, sign_height/2 + 10, stand_thickness])
//     rotate([180, 0, 0])
//         stand(stand_width, stand_depth, stand_thickness, stand_angle);

/*
 * PRINTING TIPS:
 * ==============
 * 1. Print sign face-down for smooth front surface
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
