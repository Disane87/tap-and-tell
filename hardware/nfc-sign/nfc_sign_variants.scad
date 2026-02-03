/*
 * Tap & Tell NFC Sign - Style Variants
 * =====================================
 * Different design styles for the NFC sign.
 * Choose your preferred variant by uncommenting the render call.
 */

include <nfc_sign.scad>

// =====================
// VARIANT 1: Minimalist
// =====================
module sign_minimalist() {
    // Override parameters
    _corner_radius = 4;
    _title_size = 10;

    difference() {
        rounded_rect(sign_width, sign_height, sign_thickness, _corner_radius);

        // NFC pocket
        translate([0, 0, -0.1])
            cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                     h = nfc_thickness + 0.2);

        // Hanging hole
        translate([0, sign_height/2 - hanging_hole_offset, -0.1])
            cylinder(d = hanging_hole_diameter, h = sign_thickness + 0.2);
    }

    // Simple NFC indicator ring
    color(text_color)
    translate([0, 0, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            difference() {
                circle(d = nfc_diameter + 8);
                circle(d = nfc_diameter + 2);
            }

    // Minimal tap icon
    color(accent_color)
    translate([0, nfc_diameter/2 + 15, sign_thickness - 0.01])
        nfc_waves(10, text_depth);
}

// =====================
// VARIANT 2: Badge Style
// =====================
module sign_badge() {
    badge_width = 85;
    badge_height = 55;
    badge_radius = 5;

    difference() {
        // Rounded rectangle badge
        rounded_rect(badge_width, badge_height, sign_thickness, badge_radius);

        // NFC pocket (centered)
        translate([badge_width/4, 0, -0.1])
            cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                     h = nfc_thickness + 0.2);

        // Clip slot at top
        translate([0, badge_height/2 - 3, -0.1])
            rounded_rect(30, 4, sign_thickness + 0.2, 2);
    }

    // Text on left side
    color(text_color)
    translate([-badge_width/4, 8, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            text("Tap & Tell", size = 7, font = title_font,
                 halign = "center", valign = "center");

    color(text_color)
    translate([-badge_width/4, -2, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            text("Gästebuch", size = 5, font = subtitle_font,
                 halign = "center", valign = "center");

    // NFC indicator
    color(accent_color)
    translate([badge_width/4, 0, sign_thickness - 0.01])
        nfc_waves(12, text_depth);
}

// =====================
// VARIANT 3: Keychain
// =====================
module sign_keychain() {
    key_width = 45;
    key_height = 55;
    key_radius = 6;
    ring_hole = 6;

    difference() {
        union() {
            // Main body
            rounded_rect(key_width, key_height - 8, sign_thickness, key_radius);

            // Top tab with hole
            translate([0, key_height/2 - 4, 0])
                rounded_rect(20, 16, sign_thickness, 8);
        }

        // Keyring hole
        translate([0, key_height/2, -0.1])
            cylinder(d = ring_hole, h = sign_thickness + 0.2);

        // NFC pocket
        translate([0, -5, -0.1])
            cylinder(d = 22, h = nfc_thickness + 0.2);
    }

    // NFC ring indicator
    color(text_color)
    translate([0, -5, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            difference() {
                circle(d = 28);
                circle(d = 24);
            }

    // Small text
    color(text_color)
    translate([0, key_height/2 - 22, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            text("TAP", size = 5, font = title_font,
                 halign = "center", valign = "center");
}

// =====================
// VARIANT 4: Table Tent
// =====================
module sign_table_tent() {
    tent_width = 100;
    tent_height = 80;
    fold_angle = 50;

    // Front panel
    color(base_color) {
        difference() {
            rounded_rect(tent_width, tent_height, sign_thickness, corner_radius);

            // NFC pocket
            translate([0, -10, -0.1])
                cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                         h = nfc_thickness + 0.2);
        }
    }

    // Text and graphics
    color(text_color) {
        translate([0, tent_height/2 - 15, sign_thickness - 0.01])
            linear_extrude(height = text_depth)
                text(title_text, size = 12, font = title_font,
                     halign = "center", valign = "center");

        translate([0, tent_height/2 - 28, sign_thickness - 0.01])
            linear_extrude(height = text_depth)
                text(subtitle_text, size = 8, font = subtitle_font,
                     halign = "center", valign = "center");

        translate([0, -10, sign_thickness - 0.01])
            linear_extrude(height = text_depth)
                difference() {
                    circle(d = nfc_diameter + 6);
                    circle(d = nfc_diameter + 1);
                }
    }

    color(accent_color)
    translate([0, -10 + nfc_diameter/2 + 10, sign_thickness - 0.01])
        nfc_waves(12, text_depth);

    // Back support leg (angled)
    color(base_color)
    translate([0, -tent_height/2, 0])
        rotate([-fold_angle, 0, 0])
            translate([-tent_width/4, 0, 0])
                cube([tent_width/2, tent_height * 0.6, sign_thickness]);
}

// =====================
// VARIANT 5: Circular
// =====================
module sign_circular() {
    circ_diameter = 80;

    difference() {
        cylinder(d = circ_diameter, h = sign_thickness);

        // NFC pocket (centered)
        translate([0, 0, -0.1])
            cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                     h = nfc_thickness + 0.2);

        // Hanging hole
        translate([0, circ_diameter/2 - 8, -0.1])
            cylinder(d = 4, h = sign_thickness + 0.2);
    }

    // Outer ring decoration
    color(accent_color)
    translate([0, 0, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            difference() {
                circle(d = circ_diameter - 4);
                circle(d = circ_diameter - 8);
            }

    // NFC indicator ring
    color(text_color)
    translate([0, 0, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            difference() {
                circle(d = nfc_diameter + 6);
                circle(d = nfc_diameter + 1);
            }

    // Text around the circle
    color(text_color)
    translate([0, circ_diameter/2 - 18, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            text("TAP HERE", size = 6, font = title_font,
                 halign = "center", valign = "center");

    translate([0, -circ_diameter/2 + 14, sign_thickness - 0.01])
        linear_extrude(height = text_depth)
            text("Tap & Tell", size = 5, font = subtitle_font,
                 halign = "center", valign = "center");
}

// =====================
// VARIANT 6: Frame (Picture Frame Style)
// =====================
module sign_frame() {
    frame_width = 120;
    frame_height = 90;
    frame_border = 10;
    inner_depth = 2;

    difference() {
        // Outer frame
        rounded_rect(frame_width, frame_height, sign_thickness, corner_radius);

        // Inner recess
        translate([0, 0, sign_thickness - inner_depth])
            rounded_rect(frame_width - frame_border * 2,
                        frame_height - frame_border * 2,
                        inner_depth + 0.1, corner_radius/2);

        // NFC pocket
        translate([frame_width/4 - 5, 0, -0.1])
            cylinder(d = nfc_diameter + nfc_pocket_extra * 2,
                     h = nfc_thickness + 0.2);

        // Stand notch at bottom
        translate([0, -frame_height/2 + frame_border/2, -0.1])
            rounded_rect(40, frame_border, sign_thickness + 0.2, 2);
    }

    // Inner content area (raised slightly)
    color([0.98, 0.98, 0.98])
    translate([0, 0, sign_thickness - inner_depth])
        rounded_rect(frame_width - frame_border * 2 - 1,
                    frame_height - frame_border * 2 - 1,
                    inner_depth - 0.5, corner_radius/2);

    // Title in inner area
    color(base_color) {
        translate([-frame_width/4 + 10, 15, sign_thickness - 0.5])
            linear_extrude(height = 0.6)
                text(title_text, size = 10, font = title_font,
                     halign = "center", valign = "center");

        translate([-frame_width/4 + 10, 3, sign_thickness - 0.5])
            linear_extrude(height = 0.6)
                text(subtitle_text, size = 7, font = subtitle_font,
                     halign = "center", valign = "center");

        translate([-frame_width/4 + 10, -12, sign_thickness - 0.5])
            linear_extrude(height = 0.6)
                text(custom_text, size = 5, font = subtitle_font,
                     halign = "center", valign = "center");
    }

    // NFC area highlight
    color(accent_color)
    translate([frame_width/4 - 5, 0, sign_thickness - 0.5])
        linear_extrude(height = 0.6)
            difference() {
                circle(d = nfc_diameter + 8);
                circle(d = nfc_diameter + 2);
            }

    // NFC waves icon
    color(base_color)
    translate([frame_width/4 - 5, nfc_diameter/2 + 8, sign_thickness - 0.5])
        nfc_waves(10, 0.6);
}

// =====================
// SELECT VARIANT TO RENDER
// =====================

// Uncomment ONE of the following to render:

// complete_sign();        // Default sign with stand
// sign_minimalist();      // Clean, minimal design
// sign_badge();           // ID badge style with clip slot
// sign_keychain();        // Small keychain version
// sign_table_tent();      // Table tent / A-frame style
// sign_circular();        // Round medallion style
// sign_frame();           // Picture frame style

// Show all variants for preview
module show_all_variants() {
    translate([0, 0, 0]) complete_sign();
    translate([150, 0, 0]) sign_minimalist();
    translate([250, 0, 0]) sign_badge();
    translate([350, 0, 0]) sign_keychain();
    translate([0, -150, 0]) sign_table_tent();
    translate([150, -150, 0]) sign_circular();
    translate([300, -150, 0]) sign_frame();
}

// Uncomment to see all variants
// show_all_variants();
