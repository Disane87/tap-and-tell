# Tap & Tell NFC Sign

A parametric 3D-printable sign for NFC tags, perfect for your Tap & Tell digital guestbook.

## Features

- **Parametric Design**: Fully customizable dimensions, text, and styles
- **NFC Tag Pocket**: Recessed area for standard NFC stickers (25mm, 30mm, 35mm)
- **QR Code Support**: Optional QR code display area
- **Multiple Mounting Options**: Integrated stand or hanging hole
- **Multi-Color Ready**: Designed for single or multi-material printing

## Files

| File | Description |
|------|-------------|
| `nfc_sign.scad` | Main parametric sign design |
| `nfc_sign_variants.scad` | Style variants (badge, keychain, circular, etc.) |

## Quick Start

1. Open `nfc_sign.scad` in OpenSCAD
2. Adjust the parameters at the top of the file
3. Render (F6) and export as STL
4. Print and install your NFC tag

## Parameters

### Sign Dimensions
```scad
sign_width = 100;       // Width [mm]
sign_height = 120;      // Height [mm]
sign_thickness = 4;     // Thickness [mm]
corner_radius = 8;      // Corner rounding [mm]
```

### Text Customization
```scad
title_text = "Tap & Tell";    // Main title
subtitle_text = "Gästebuch";  // Subtitle
custom_text = "Tippe hier!";  // Call-to-action
title_size = 12;              // Font size [mm]
```

### NFC Tag Settings
```scad
nfc_diameter = 25;      // Common sizes: 25, 30, 35mm
nfc_thickness = 0.5;    // Tag thickness
nfc_pocket_extra = 0.5; // Extra clearance
```

### Stand & Mounting
```scad
has_stand = true;           // Include stand
stand_angle = 70;           // Angle [degrees]
has_hanging_hole = true;    // Include hanging hole
```

## Style Variants

The `nfc_sign_variants.scad` file includes:

1. **Default** - Full-featured sign with stand
2. **Minimalist** - Clean, simple design
3. **Badge** - ID badge style with clip slot
4. **Keychain** - Compact keyring version
5. **Table Tent** - A-frame style for tables
6. **Circular** - Round medallion design
7. **Frame** - Picture frame style

## Printing Guide

### Recommended Settings

| Setting | Value |
|---------|-------|
| Layer Height | 0.2mm |
| Infill | 20-30% |
| Walls | 3 perimeters |
| Top/Bottom | 4 layers |
| Supports | Not needed |

### Print Orientation

- **Best quality**: Print face-down (text side on build plate)
- **For embossed text**: Print face-up

### Multi-Color Printing

#### Option 1: Filament Swap
1. Slice the model
2. Add a pause at the text layer height
3. Swap filament color
4. Resume print

#### Option 2: Multi-Material Printer
- Print base in dark color (gray, black)
- Print text in white or accent color

#### Option 3: Paint Fill
1. Print with embossed/engraved text
2. Fill text with acrylic paint
3. Wipe excess before drying

### Material Recommendations

| Material | Pros | Cons |
|----------|------|------|
| PLA | Easy to print, good detail | Heat sensitive |
| PETG | Durable, heat resistant | Slightly harder to print |
| ASA/ABS | UV resistant, durable | Needs enclosure |

## NFC Tag Installation

### Compatible Tags

- **NTAG213** - 144 bytes (sufficient for URLs)
- **NTAG215** - 504 bytes
- **NTAG216** - 888 bytes

Common suppliers: Amazon, AliExpress, specialized NFC retailers

### Installation Steps

1. Program NFC tag with your guestbook URL (e.g., `https://yourdomain.com/g/your-guestbook-id`)
2. Clean the tag pocket
3. Peel the backing off the NFC sticker
4. Press firmly into the pocket
5. Optional: Seal with thin tape or drop of glue

### Programming Tools

- **Android**: NFC Tools, NXP TagWriter
- **iOS**: NFC Tools
- **Desktop**: ACR122U reader + software

## QR Code Integration

### Adding a Real QR Code

1. Generate QR code for your guestbook URL
2. Export as SVG
3. Import in OpenSCAD:

```scad
// Replace qr_code_placeholder with:
translate([0, qr_position_y, sign_thickness])
    linear_extrude(height = 0.4)
        import("your_qr_code.svg", center = true);
```

### Using qr_code Library

Install the [OpenSCAD QR Code library](https://github.com/xypwn/openscad-qr):

```scad
use <qr.scad>

// In your design:
translate([0, qr_position_y, sign_thickness])
    qr("https://your-url.com/g/guestbook-id", center=true);
```

## Assembly Options

### Desk Stand
The integrated stand tilts the sign at 70° for comfortable reading on tables and counters.

### Wall Mount
Use the hanging hole with:
- Command strips
- Small nail or screw
- Adhesive hook

### Event Displays
- Mount on easels
- Attach to table number holders
- Include in centerpieces

## Customization Examples

### Wedding Guestbook
```scad
title_text = "Hochzeit";
subtitle_text = "Anna & Max";
custom_text = "Hinterlasse uns eine Nachricht!";
accent_color = [0.95, 0.75, 0.8]; // Rose gold
```

### Birthday Party
```scad
title_text = "Happy Birthday!";
subtitle_text = "🎂 Lisa wird 30!";
custom_text = "Tippe & gratuliere!";
```

### Business Event
```scad
title_text = "Conference 2025";
subtitle_text = "Share Your Feedback";
custom_text = "Tap to respond";
has_stand = true;
show_qr_placeholder = true;
```

## Troubleshooting

### NFC Not Reading
- Check tag is programmed correctly
- Ensure pocket depth matches tag thickness
- Try thinning the front wall over the NFC area
- Test with phone before final installation

### Text Not Readable
- Increase `text_depth` for deeper engraving
- Use higher contrast colors
- Ensure `title_size` is at least 8mm

### Stand Too Wobbly
- Increase `stand_thickness`
- Add `stand_depth` for larger footprint
- Print stand separately with more infill

## License

MIT License - Feel free to modify and share!

## Links

- [Tap & Tell Project](https://github.com/your-repo/tap-and-tell)
- [OpenSCAD](https://openscad.org/)
- [OpenSCAD QR Library](https://github.com/xypwn/openscad-qr)
