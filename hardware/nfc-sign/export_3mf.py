#!/usr/bin/env python3
"""
Export OpenSCAD parts to multi-color 3MF file.

Usage:
1. Export each part from OpenSCAD as STL:
   - sign_plate.stl (white)
   - sign_elements.stl (black)
   - stand.stl (black)
   - frame.stl (black)

2. Run this script:
   python export_3mf.py

3. Open output.3mf in your slicer - colors are pre-assigned!

Requirements:
   pip install lib3mf numpy numpy-stl
"""

import os
import sys

try:
    from stl import mesh
    import zipfile
    import xml.etree.ElementTree as ET
    from xml.dom import minidom
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install numpy numpy-stl")
    sys.exit(1)


def stl_to_vertices_triangles(stl_file):
    """Convert STL to vertices and triangle indices."""
    stl_mesh = mesh.Mesh.from_file(stl_file)

    vertices = []
    triangles = []
    vertex_map = {}

    for triangle in stl_mesh.vectors:
        tri_indices = []
        for vertex in triangle:
            v_tuple = tuple(vertex)
            if v_tuple not in vertex_map:
                vertex_map[v_tuple] = len(vertices)
                vertices.append(v_tuple)
            tri_indices.append(vertex_map[v_tuple])
        triangles.append(tri_indices)

    return vertices, triangles


def create_3mf(parts, output_file="nfc_sign_multicolor.3mf"):
    """
    Create a 3MF file with multiple colored parts.

    parts: list of dicts with 'file', 'color' (hex), 'name'
    """

    # XML namespaces
    ns_3mf = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
    ns_material = "http://schemas.microsoft.com/3dmanufacturing/material/2015/02"

    # Create root model element
    model = ET.Element("model")
    model.set("unit", "millimeter")
    model.set("xmlns", ns_3mf)
    model.set("xmlns:m", ns_material)

    # Resources element
    resources = ET.SubElement(model, "resources")

    # Create base materials (colors)
    basematerials = ET.SubElement(resources, "{%s}basematerials" % ns_material)
    basematerials.set("id", "1")

    color_map = {}
    color_id = 0
    for part in parts:
        color = part.get('color', '#808080')
        if color not in color_map:
            base = ET.SubElement(basematerials, "{%s}base" % ns_material)
            base.set("name", part.get('name', f'Color_{color_id}'))
            base.set("displaycolor", color)
            color_map[color] = color_id
            color_id += 1

    # Create mesh objects
    object_id = 2
    build_items = []

    for part in parts:
        stl_file = part['file']
        if not os.path.exists(stl_file):
            print(f"Warning: {stl_file} not found, skipping...")
            continue

        vertices, triangles = stl_to_vertices_triangles(stl_file)
        color_idx = color_map.get(part.get('color', '#808080'), 0)

        # Create object
        obj = ET.SubElement(resources, "object")
        obj.set("id", str(object_id))
        obj.set("type", "model")
        obj.set("name", part.get('name', os.path.basename(stl_file)))
        obj.set("pid", "1")  # Reference to basematerials
        obj.set("pindex", str(color_idx))

        # Create mesh
        mesh_elem = ET.SubElement(obj, "mesh")

        # Vertices
        vertices_elem = ET.SubElement(mesh_elem, "vertices")
        for v in vertices:
            vertex = ET.SubElement(vertices_elem, "vertex")
            vertex.set("x", f"{v[0]:.6f}")
            vertex.set("y", f"{v[1]:.6f}")
            vertex.set("z", f"{v[2]:.6f}")

        # Triangles
        triangles_elem = ET.SubElement(mesh_elem, "triangles")
        for t in triangles:
            triangle = ET.SubElement(triangles_elem, "triangle")
            triangle.set("v1", str(t[0]))
            triangle.set("v2", str(t[1]))
            triangle.set("v3", str(t[2]))

        build_items.append(object_id)
        object_id += 1

    # Build element
    build = ET.SubElement(model, "build")
    for item_id in build_items:
        item = ET.SubElement(build, "item")
        item.set("objectid", str(item_id))

    # Create 3MF (ZIP) file
    xml_str = ET.tostring(model, encoding='unicode')
    # Pretty print
    xml_str = minidom.parseString(xml_str).toprettyxml(indent="  ")
    # Remove extra xml declaration from minidom
    xml_str = '\n'.join(xml_str.split('\n')[1:])
    xml_str = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_str

    with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Content types
        content_types = '''<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>'''
        zf.writestr('[Content_Types].xml', content_types)

        # Relationships
        rels = '''<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>'''
        zf.writestr('_rels/.rels', rels)

        # 3D model
        zf.writestr('3D/3dmodel.model', xml_str)

    print(f"Created: {output_file}")
    return output_file


if __name__ == "__main__":
    # Define parts with their STL files and colors
    parts = [
        {
            "file": "sign_plate.stl",
            "color": "#F5F5F0",  # Off-white
            "name": "Sign Base"
        },
        {
            "file": "sign_elements.stl",
            "color": "#1A1A1A",  # Black
            "name": "Sign Text"
        },
        {
            "file": "stand.stl",
            "color": "#1A1A1A",  # Black
            "name": "Stand"
        },
        {
            "file": "frame.stl",
            "color": "#1A1A1A",  # Black
            "name": "Frame"
        },
    ]

    # Check which files exist
    existing_parts = [p for p in parts if os.path.exists(p['file'])]

    if not existing_parts:
        print("No STL files found!")
        print("\nFirst export from OpenSCAD:")
        print("  1. Uncomment 'sign_plate();' → F6 → Export as sign_plate.stl")
        print("  2. Uncomment 'sign_elements();' → F6 → Export as sign_elements.stl")
        print("  3. Uncomment 'stand_part();' → F6 → Export as stand.stl")
        print("  4. Uncomment 'frame_part();' → F6 → Export as frame.stl")
        print("\nThen run this script again.")
        sys.exit(1)

    print(f"Found {len(existing_parts)} STL files:")
    for p in existing_parts:
        print(f"  - {p['file']} ({p['name']})")

    create_3mf(existing_parts)
    print("\nDone! Open nfc_sign_multicolor.3mf in your slicer.")
