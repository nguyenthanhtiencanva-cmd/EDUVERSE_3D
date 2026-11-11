# -*- coding: utf-8 -*-
"""
EDUVERSE 3D - Calibrated 3D Diorama Generator for Dao Vinh Thuc (Mong Cai, Quang Ninh)
=======================================================================================
Calibrated 1:1 against Google Maps Satellite Image (media_1794291447743_492189aa.jpg):
  1. Exact geographic morphology:
     - Western half (Vinh Trung): slender, long sandy barrier beach (Bai Ben Hen),
       southwest curved sand spit, central valley corridor, western rocky reef (Fisherman's wharf).
     - Middle section: central waist corridor (Vinh Thuc town), Hoang Thom inlet bay.
     - North coast: Ben Tau Van Gia nestled in northern embayment facing mainland Mui Ngoc,
       accompanied by Don Bien Phong Cua khau Cang Van Gia.
     - Eastern half (Vinh Thuc): broad mountainous block, Mount Dau Tan ridges (>84m),
       crescent sandy beach (Bai Dau Dong with Truong Dieu & Xuan Men restaurants),
       and Hai Dang Vinh Thuc (1962) perched at the far northeast rocky promontory.
  2. Complete educational & sovereign landmarks:
     - Phan hieu Vinh Trung (Truong TH&THCS Vinh Thuc - 1:1 miniature replica)
     - Phan hieu Diem chinh (Thon Dau Dong - Truong TH&THCS Vinh Thuc)
     - Phan hieu 2 (Khu trung tam Vinh Thuc)
     - Don Bien phong Cua khau Cang Van Gia (Command HQ, watchtower, parade yard, patrol boat)
     - Ben Tau Van Gia (North coast harbor pier, terminal, high-speed passenger ferries)
     - Den tho Tuong quan Le Ba Duc (Mieu Ben Hen - Tam quan, curved-roof sanctuary, banyans)
     - Hai dang Vinh Thuc 1962 (Dinh Nui Dau Tan, cylindrical tower, glowing lantern)
     - Bai bien Dau Dong & Bai bien Ben Hen (crescent beaches, huts & fishing boats)
     - Fisherman's Wharf (Ben ca Mui Tay)
"""

import bpy
import math
import os
import random

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(SCRIPT_DIR, "textures")
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OUT_BLEND = os.path.join(SCRIPT_DIR, "vinh_thuc_island.blend")
OUT_GLB = os.path.join(SCRIPT_DIR, "vinh_thuc_island.glb")
CLIENT_GLB = os.path.join(PROJECT_ROOT, "client", "public", "models", "vinh_thuc_island.glb")


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def get_or_create_collection(name, parent=None):
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    col = bpy.data.collections.new(name)
    if parent is None:
        bpy.context.scene.collection.children.link(col)
    else:
        parent.children.link(col)
    return col


def link_to_collection(obj, col):
    for c in obj.users_collection:
        c.objects.unlink(obj)
    col.objects.link(obj)


def make_mat(name, rgba, roughness=0.65, metallic=0.0, emission=None, emission_strength=0.0, alpha=1.0, tex_file=None):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if alpha < 1.0:
            bsdf.inputs["Alpha"].default_value = alpha
            mat.blend_method = 'BLEND'
        if emission and emission_strength > 0:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission
                bsdf.inputs["Emission Strength"].default_value = emission_strength
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = emission
                bsdf.inputs["Emission Strength"].default_value = emission_strength
        if tex_file:
            tex_path = os.path.join(TEX_DIR, tex_file)
            if os.path.exists(tex_path):
                tex_node = nodes.new("ShaderNodeTexImage")
                tex_node.image = bpy.data.images.load(tex_path, check_existing=True)
                links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def create_materials():
    mats = {}
    mats["ocean_deep"] = make_mat("Mat_Ocean_Deep", (0.015, 0.22, 0.42, 1.0), roughness=0.16, metallic=0.05)
    mats["ocean_shallow"] = make_mat("Mat_Ocean_Shallow", (0.04, 0.52, 0.62, 1.0), roughness=0.20, metallic=0.05)
    mats["ocean_foam"] = make_mat("Mat_Ocean_Foam", (0.92, 0.98, 1.0, 1.0), roughness=0.35)
    mats["sand_beach"] = make_mat("Mat_Sand_Beach", (0.96, 0.89, 0.69, 1.0), roughness=0.75)
    mats["terrain_plain"] = make_mat("Mat_Terrain_Plain", (0.24, 0.54, 0.22, 1.0), roughness=0.80)
    mats["terrain_hill"] = make_mat("Mat_Terrain_Hill", (0.13, 0.38, 0.15, 1.0), roughness=0.84)
    mats["terrain_peak"] = make_mat("Mat_Terrain_Peak", (0.18, 0.32, 0.20, 1.0), roughness=0.86)
    mats["wetland"] = make_mat("Mat_Wetland", (0.20, 0.44, 0.32, 1.0), roughness=0.45)
    mats["lake_water"] = make_mat("Mat_Lake_Water", (0.06, 0.55, 0.72, 1.0), roughness=0.12)
    mats["road_asphalt"] = make_mat("Mat_Road_Asphalt", (0.22, 0.24, 0.27, 1.0), roughness=0.70)
    mats["road_line"] = make_mat("Mat_Road_Line", (0.98, 0.85, 0.22, 1.0), roughness=0.45)
    mats["wall_yellow"] = make_mat("Mat_Wall_Yellow", (0.96, 0.85, 0.50, 1.0), roughness=0.60)
    mats["wall_cream"] = make_mat("Mat_Wall_Cream", (0.96, 0.93, 0.84, 1.0), roughness=0.60)
    mats["wall_white"] = make_mat("Mat_Wall_White", (0.96, 0.97, 0.99, 1.0), roughness=0.50)
    mats["wall_brick"] = make_mat("Mat_Wall_Brick", (0.74, 0.25, 0.19, 1.0), roughness=0.72, tex_file="pbr_terracotta_steps.png")
    mats["roof_red"] = make_mat("Mat_Roof_Red", (0.82, 0.17, 0.13, 1.0), roughness=0.52, tex_file="pbr_roof_red_tile.png")
    mats["roof_temple"] = make_mat("Mat_Roof_Temple", (0.62, 0.12, 0.10, 1.0), roughness=0.58, tex_file="pbr_roof_red_tile.png")
    mats["roof_gym_dark"] = make_mat("Mat_Roof_Gym_Dark", (0.20, 0.24, 0.30, 1.0), roughness=0.48, metallic=0.3)
    mats["roof_blue"] = make_mat("Mat_Roof_Blue", (0.10, 0.44, 0.76, 1.0), roughness=0.48, metallic=0.2)
    mats["roof_green"] = make_mat("Mat_Roof_Green", (0.10, 0.50, 0.28, 1.0), roughness=0.52)
    mats["courtyard_grey"] = make_mat("Mat_Courtyard_Grey", (0.74, 0.76, 0.78, 1.0), roughness=0.72, tex_file="pbr_courtyard_concrete.png")
    mats["gold_accent"] = make_mat("Mat_Gold_Accent", (0.98, 0.78, 0.16, 1.0), roughness=0.32, metallic=0.45, emission=(0.98, 0.78, 0.16, 1.0), emission_strength=0.4)
    mats["red_flag"] = make_mat("Mat_Red_Flag", (0.90, 0.10, 0.10, 1.0), roughness=0.42, emission=(0.90, 0.10, 0.10, 1.0), emission_strength=0.3)
    mats["lighthouse_dark"] = make_mat("Mat_Lighthouse_Dark", (0.14, 0.16, 0.20, 1.0), roughness=0.48)
    mats["beacon_glow"] = make_mat("Mat_Beacon_Glow", (1.0, 0.94, 0.45, 1.0), roughness=0.12, emission=(1.0, 0.90, 0.32, 1.0), emission_strength=4.0)
    mats["tree_pine"] = make_mat("Mat_Tree_Pine", (0.10, 0.40, 0.16, 1.0), roughness=0.78)
    mats["tree_banyan"] = make_mat("Mat_Tree_Banyan", (0.14, 0.48, 0.18, 1.0), roughness=0.76)
    mats["tree_trunk"] = make_mat("Mat_Tree_Trunk", (0.36, 0.24, 0.14, 1.0), roughness=0.85)
    mats["boat_white"] = make_mat("Mat_Boat_White", (0.95, 0.97, 0.99, 1.0), roughness=0.38)
    mats["boat_Wood"] = make_mat("Mat_Boat_Wood", (0.48, 0.28, 0.14, 1.0), roughness=0.70)
    mats["border_blue"] = make_mat("Mat_Border_Blue", (0.08, 0.34, 0.72, 1.0), roughness=0.42)
    mats["stone_dark"] = make_mat("Mat_Stone_Dark", (0.38, 0.40, 0.42, 1.0), roughness=0.75)
    return mats


def add_box(name, cx, cy, cz, sx, sy, sz, mat, col, rot_z=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sy, sz)
    if rot_z != 0.0:
        obj.rotation_euler = (0.0, 0.0, rot_z)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if mat:
        obj.data.materials.append(mat)
    link_to_collection(obj, col)
    return obj


def add_cylinder(name, cx, cy, cz, r1, r2, h, verts, mat, col, rot_z=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=h, location=(cx, cy, cz))
    obj = bpy.context.active_object
    obj.name = name
    if rot_z != 0.0:
        obj.rotation_euler = (0.0, 0.0, rot_z)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if mat:
        obj.data.materials.append(mat)
    link_to_collection(obj, col)
    return obj


def add_hipped_building(name, cx, cy, z_base, w, d, h_wall, h_roof, mat_wall, mat_roof, col, rot_z=0.0):
    wall = add_box(f"{name}_Wall", cx, cy, z_base + h_wall * 0.5, w, d, h_wall, mat_wall, col, rot_z=rot_z)
    mesh = bpy.data.meshes.new(f"{name}_RoofMesh")
    rw = w * 0.5 + 0.25
    rd = d * 0.5 + 0.25
    ridge = max(0.2, rw - rd * 0.65)
    verts = [
        (-rw, -rd, 0.0),
        ( rw, -rd, 0.0),
        ( rw,  rd, 0.0),
        (-rw,  rd, 0.0),
        (-ridge, 0.0, h_roof),
        ( ridge, 0.0, h_roof),
    ]
    faces = [
        (0, 1, 2, 3),
        (0, 1, 5, 4),
        (2, 3, 4, 5),
        (1, 2, 5),
        (3, 0, 4),
    ]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    roof = bpy.data.objects.new(f"{name}_Roof", mesh)
    roof.location = (cx, cy, z_base + h_wall)
    if rot_z != 0.0:
        roof.rotation_euler = (0.0, 0.0, rot_z)
    if mat_roof:
        roof.data.materials.append(mat_roof)
    col.objects.link(roof)
    return wall, roof


# ==============================================================================
# CALIBRATED SPINE & ASYMMETRIC WIDTH PROFILE FROM SATELLITE IMAGE
# Coordinates in Blender:
#   X = West(-) / East(+)
#   Y = South(-) / North(+)  (North is positive Y, South is negative Y)
#   Z = Up(+)
# ==============================================================================
CALIBRATED_SPINE = [
    # 0: Fisherman's wharf (far West reef / rocky cape)
    (-66.0,  1.5,  1.8,  1.8, 0.6),
    # 1: West narrow neck
    (-58.0,  0.8,  3.2,  3.5, 1.4),
    # 2: Hook spit root (SW hook curves south to Y = -14)
    (-52.0, -1.0,  4.2, 11.5, 1.8),
    # 3: Western Vinh Trung (behind long sand spit)
    (-38.0,  0.0,  4.8,  8.5, 2.4),
    # 4: Thon 3 Vinh Trung & Phan hieu Vinh Trung valley
    (-26.0,  0.5,  4.5,  5.8, 2.2),
    # 5: Central waist constriction
    (-12.0,  0.5,  4.2,  4.5, 2.6),
    # 6: Vinh Thuc town center & Hoang Thom bay (South inlet)
    (  1.0,  1.0,  5.5,  5.2, 2.5),
    # 7: Van Gia northern embayment (reaches North coast at Y=+12.5!)
    ( 17.0,  3.5,  9.8,  9.2, 3.2),
    # 8: Thon Dau Dong & East mountain mass
    ( 32.0,  3.5, 10.8, 11.0, 4.6),
    # 9: Mount Dau Tan West Ridge
    ( 46.0,  7.5,  8.5,  7.5, 6.8),
    # 10: Mount Dau Tan Summit
    ( 58.0, 11.5,  5.5,  4.8, 9.8),
    # 11: Hai Dang promontory cape (station & tower)
    ( 65.0, 13.5,  3.2,  3.0, 7.5),
    # 12: Smooth rocky headland tapering gently into the sea
    ( 68.5, 14.0,  2.0,  2.0, 2.8),
    ( 71.0, 14.2,  1.0,  1.0, 0.4),
]


def dist_to_segment_asymmetric(px, py, p1, p2):
    x1, y1, wn1, ws1, h1 = p1
    x2, y2, wn2, ws2, h2 = p2
    vx, vy = x2 - x1, y2 - y1
    wx, wy = px - x1, py - y1
    c1 = vx * wx + vy * wy
    c2 = vx * vx + vy * vy
    t = 0.0 if c2 <= 1e-6 else max(0.0, min(1.0, c1 / c2))
    proj_x = x1 + t * vx
    proj_y = y1 + t * vy
    dist = math.hypot(px - proj_x, py - proj_y)

    cross = vx * wy - vy * wx
    is_north = (cross > 0.0)

    wn = wn1 + t * (wn2 - wn1)
    ws = ws1 + t * (ws2 - ws1)
    w = wn if is_north else ws
    h = h1 + t * (h2 - h1)
    return dist, t, w, h


def island_norm_and_base(bx, by):
    best_norm = 999.0
    best_h = 0.0
    for i in range(len(CALIBRATED_SPINE) - 1):
        dist, t, w, h = dist_to_segment_asymmetric(bx, by, CALIBRATED_SPINE[i], CALIBRATED_SPINE[i + 1])
        coast_wave = 1.0 + 0.08 * math.sin(bx * 0.18 + by * 0.22) + 0.05 * math.cos(bx * 0.35 - by * 0.28)
        w_eff = w * coast_wave
        norm = dist / w_eff
        if norm < best_norm:
            best_norm = norm
            best_h = h
    return best_norm, best_h


def island_elevation(bx, by):
    best_norm, best_h = island_norm_and_base(bx, by)
    if best_norm >= 1.0:
        return 0.0

    # Smooth easing towards the shoreline edge so height gracefully lands on the beach
    edge_ease = math.pow(max(0.0, min(1.0, (1.0 - best_norm) / 0.35)), 0.85)
    land_factor = math.pow(max(0.0, 1.0 - best_norm * best_norm), 0.72)
    z = (0.22 + best_h * land_factor) * edge_ease

    # Calibrated mountain peaks & rugged ridges matching satellite folds:
    mountain_peaks = [
        (58.0, 11.5, 9.5, 8.5),   # Dinh Nui Dau Tan (Hai dang Vinh Thuc)
        (46.0,  8.0, 9.0, 4.8),   # Dau Tan West forest ridge
        (34.0,  5.0, 9.5, 4.2),   # Dau Dong central high ridge
        (18.0,  5.5, 8.5, 3.6),   # Ridge above Ben Tau Van Gia
        ( -8.0, 1.5, 7.5, 3.2),   # Central divide ridge
        (-32.0, 1.5, 8.0, 3.0),   # North Vinh Trung hill range
        (-48.0, 1.0, 6.5, 2.2),   # Far West hill
    ]
    for pk_x, pk_y, pk_r, pk_h in mountain_peaks:
        pd = math.hypot(bx - pk_x, by - pk_y)
        if pd < pk_r:
            z += pk_h * math.pow(math.cos((pd / pk_r) * (math.pi * 0.5)), 1.5) * edge_ease

    # Mountain ridge folds texture on Eastern mountain
    if bx > 20.0 and best_norm < 0.65:
        ridge_wave = math.sin((bx * 0.6 + by * 0.8) * 0.8) * 0.45
        z = max(0.4, z + ridge_wave * edge_ease)

    # Flattened compound plateaus for key human installations
    flats = [
        (-26.0,   0.5, 6.0, 1.85), # Phan hieu Vinh Trung (Thon 3)
        ( 28.0,   1.5, 6.5, 1.95), # Phan hieu Diem chinh (Thon Dau Dong)
        (  3.0,   0.5, 5.0, 1.85), # Phan hieu 2 (Vinh Thuc)
        ( 17.0,  12.5, 5.5, 1.10), # Ben Tau Van Gia (North coast harbor apron)
        ( 12.0,   9.5, 5.0, 1.75), # Don Bien phong Cua khau Cang Van Gia
        (-30.0,  -2.5, 4.5, 1.80), # Den tho Tuong quan Le Ba Duc (Mieu Ben Hen)
        ( 35.0,  -4.0, 7.5, 0.55), # Bai bien Dau Dong gentle sandy slope
        (-42.0,  -8.0, 8.0, 0.55), # Bai bien Ben Hen gentle sandy slope
        (-50.0,  -4.5, 5.0, 0.85), # Ben Hen inner wetland basin
    ]
    for fx, fy, fr, fz in flats:
        fd = math.hypot(bx - fx, by - fy)
        if fd < fr:
            blend = math.pow(math.cos((fd / fr) * (math.pi * 0.5)), 1.4)
            z = z * (1.0 - 0.78 * blend) + fz * (0.78 * blend)

    return z


def build_smooth_contour_layer(name, max_norm, z_func, mat, col, nx=195, ny=120):
    """Generates continuous boundary terrain layers with zero staircase artifacts."""
    x_min, x_max = -74.0, 75.0
    y_min, y_max = -24.0, 24.0
    dx = (x_max - x_min) / nx
    dy = (y_max - y_min) / ny

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    col.objects.link(obj)
    obj.data.materials.append(mat)

    verts = []
    norms = []
    for j in range(ny + 1):
        by = y_min + j * dy
        for i in range(nx + 1):
            bx = x_min + i * dx
            n_val, _ = island_norm_and_base(bx, by)
            norms.append(n_val)
            verts.append([bx, by, z_func(bx, by, n_val)])

    for j in range(1, ny):
        for i in range(1, nx):
            idx = j * (nx + 1) + i
            n0 = norms[idx]
            if abs(n0 - max_norm) < 0.14:
                gx = (norms[idx + 1] - norms[idx - 1]) / (2.0 * dx)
                gy = (norms[idx + (nx + 1)] - norms[idx - (nx + 1)]) / (2.0 * dy)
                g2 = gx * gx + gy * gy
                if g2 > 1e-6:
                    step = (max_norm - n0) / g2
                    step = max(-0.85 * dx, min(0.85 * dx, step))
                    nx_pos = verts[idx][0] + step * gx
                    ny_pos = verts[idx][1] + step * gy
                    n_new, _ = island_norm_and_base(nx_pos, ny_pos)
                    verts[idx][0] = nx_pos
                    verts[idx][1] = ny_pos
                    verts[idx][2] = z_func(nx_pos, ny_pos, n_new)

    faces = []
    for j in range(ny):
        for i in range(nx):
            v0 = j * (nx + 1) + i
            v1 = v0 + 1
            v2 = v0 + (nx + 1) + 1
            v3 = v0 + (nx + 1)
            if (norms[v0] <= max_norm + 0.05 and
                norms[v1] <= max_norm + 0.05 and
                norms[v2] <= max_norm + 0.05 and
                norms[v3] <= max_norm + 0.05):
                faces.append((v0, v1, v2, v3))

    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    for poly in mesh.polygons:
        poly.use_smooth = True
    mesh.update()
    return obj


def build_terrain_and_ocean(mats, col):
    # 1. Deep Ocean Plane
    add_box("Ocean_Deep_Plane", 0.0, 0.0, -0.25, 215.0, 115.0, 0.4, mats["ocean_deep"], col)

    # 2. Smooth Concentric Ecological Layers matching Satellite Map
    # Layer A: Shallow Turquoise Lagoon Shelf (norm <= 1.18)
    build_smooth_contour_layer(
        "Island_Lagoon_Shelf",
        1.18,
        lambda x, y, n: 0.02 if n <= 1.18 else -0.15,
        mats["ocean_shallow"],
        col,
    )
    # Layer B: White Surf Foam Rim (norm <= 1.03)
    build_smooth_contour_layer(
        "Island_Shore_Foam",
        1.03,
        lambda x, y, n: 0.08 if n <= 1.03 else -0.10,
        mats["ocean_foam"],
        col,
    )
    # Layer C: Golden-White Sandy Beach Skirt (norm <= 0.99)
    build_smooth_contour_layer(
        "Island_Sandy_Beach",
        0.99,
        lambda x, y, n: max(0.14, min(1.35, island_elevation(x, y) * 0.75)) if n <= 0.99 else -0.05,
        mats["sand_beach"],
        col,
    )
    # Layer D: Main Green Plain & Settlements (norm <= 0.88)
    build_smooth_contour_layer(
        "Island_Green_Terrain",
        0.88,
        lambda x, y, n: island_elevation(x, y) if n <= 0.88 else 0.05,
        mats["terrain_plain"],
        col,
    )
    # Layer E: Forest Hills & Mount Dau Tan Peak (norm <= 0.60)
    build_smooth_contour_layer(
        "Island_Forest_Hills",
        0.60,
        lambda x, y, n: (island_elevation(x, y) + 0.06) if (n <= 0.60 and island_elevation(x, y) > 2.65) else (island_elevation(x, y) - 0.12),
        mats["terrain_hill"],
        col,
    )

    # 3. Inner Wetland Basin (Dam nuoi thuy san Thon 3 / Ben Hen)
    add_box("BenHen_Wetland_Basin", -48.0, -4.5, 0.22, 9.5, 4.2, 0.12, mats["wetland"], col, rot_z=0.15)
    add_cylinder("BenHen_Lagoon_Water", -48.0, -4.5, 0.28, 3.2, 3.2, 0.10, 24, mats["lake_water"], col)

    # 4. Central Freshwater Lake (Ho nuoc ngot trung tam Vinh Thuc)
    add_cylinder("Lake_VinhThuc_Water", 3.0, 1.2, 1.15, 3.8, 3.8, 0.15, 28, mats["lake_water"], col)

    # 5. Mainland Mui Ngoc Peninsula at NW corner facing North Coast Ben Tau Van Gia
    add_cylinder("Mainland_MuiNgoc_Lagoon", 14.0, 36.0, 0.03, 14.0, 13.5, 0.08, 32, mats["ocean_shallow"], col)
    add_cylinder("Mainland_MuiNgoc_Beach", 14.0, 36.0, 0.15, 12.2, 11.2, 0.3, 32, mats["sand_beach"], col)
    add_cylinder("Mainland_MuiNgoc_Hill", 14.0, 36.0, 0.85, 10.6, 8.2, 1.8, 32, mats["terrain_hill"], col)
    add_box("Mainland_MuiNgoc_Pier", 16.0, 26.0, 0.45, 1.4, 5.5, 0.4, mats["courtyard_grey"], col, rot_z=-0.15)

    # Dashed sea route markers from Ben Mui Ngoc (16, 24) across channel to Ben Tau Van Gia (17, 13)
    for step in range(6):
        t = (step + 1) / 7.0
        rx = 16.0 + t * 1.0
        ry = 23.5 + t * (-10.0)
        add_box(f"SeaRoute_Dash_{step}", rx, ry, 0.06, 0.48, 1.4, 0.08, mats["ocean_foam"], col)


def build_ribbon_mesh(name, pts_2d, half_w, z_offset, mat, col):
    dense_pts = []
    for i in range(len(pts_2d) - 1):
        x1, y1 = pts_2d[i]
        x2, y2 = pts_2d[i + 1]
        seg_steps = max(8, int(math.hypot(x2 - x1, y2 - y1) / 0.8))
        for s in range(seg_steps):
            if i > 0 and s == 0:
                continue
            t = s / seg_steps
            dense_pts.append((x1 + t * (x2 - x1), y1 + t * (y2 - y1)))

    verts = []
    faces = []
    n_pts = len(dense_pts)
    for k, (px, py) in enumerate(dense_pts):
        if k == 0:
            tx, ty = dense_pts[1][0] - px, dense_pts[1][1] - py
        elif k == n_pts - 1:
            tx, ty = px - dense_pts[k - 1][0], py - dense_pts[k - 1][1]
        else:
            tx, ty = dense_pts[k + 1][0] - dense_pts[k - 1][0], dense_pts[k + 1][1] - dense_pts[k - 1][1]
        t_len = max(1e-6, math.hypot(tx, ty))
        nx_perp, ny_perp = -ty / t_len, tx / t_len

        lx, ly = px + nx_perp * half_w, py + ny_perp * half_w
        rx, ry = px - nx_perp * half_w, py - ny_perp * half_w
        pz = max(0.35, island_elevation(px, py)) + z_offset

        verts.append((lx, ly, pz))
        verts.append((rx, ry, pz))
        verts.append((lx, ly, pz - 0.14))
        verts.append((rx, ry, pz - 0.14))

        if k > 0:
            b = (k - 1) * 4
            c = k * 4
            faces.append((b + 0, b + 1, c + 1, c + 0))
            faces.append((b + 2, b + 0, c + 0, c + 2))
            faces.append((b + 1, b + 3, c + 3, c + 1))

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    for poly in mesh.polygons:
        poly.use_smooth = True
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def build_trans_island_road(mats, col):
    main_road_pts = [
        (-64.0,  1.5),  # Fisherman's wharf (West tip)
        (-56.0,  0.8),
        (-46.0,  0.5),
        (-38.0,  0.5),
        (-30.0, -1.0),  # Branch near Den tho Le Ba Duc & Mieu Ben Hen
        (-26.0,  0.5),  # Phan hieu Vinh Trung (Thon 3)
        (-14.0,  0.5),
        (  1.0,  0.8),  # Phan hieu 2 & Vinh Thuc center
        ( 12.0,  2.8),  # Junction to Ben Tau Van Gia (North)
        ( 22.0,  3.2),
        ( 28.0,  1.5),  # Phan hieu Diem chinh (Thon Dau Dong)
        ( 38.0,  4.5),  # Climb up Nui Dau Tan
        ( 48.0,  8.2),
        ( 58.0, 11.5),
        ( 64.5, 13.5),  # Hai dang Vinh Thuc (NE Cape)
    ]
    build_ribbon_mesh("TransIsland_Highway_Asphalt", main_road_pts, 0.62, 0.18, mats["road_asphalt"], col)
    build_ribbon_mesh("TransIsland_Highway_CenterLine", main_road_pts, 0.10, 0.21, mats["road_line"], col)

    van_gia_branch = [
        (12.0,  2.8),
        (13.5,  6.5),
        (15.0,  9.5),  # Passes Don Bien phong
        (17.0, 12.5),  # Ben Tau Van Gia North Pier
    ]
    build_ribbon_mesh("VanGia_North_Branch_Road", van_gia_branch, 0.52, 0.18, mats["road_asphalt"], col)

    dau_dong_branch = [
        (28.0,  1.5),
        (32.0, -1.0),
        (36.0, -3.5),  # Xuan Men & Truong Dieu restaurants
        (42.0, -1.5),
    ]
    build_ribbon_mesh("DauDong_Beach_Road", dau_dong_branch, 0.48, 0.18, mats["road_asphalt"], col)


def build_flagpole(name, cx, cy, z_base, h, mats, col):
    add_cylinder(f"{name}_Pole", cx, cy, z_base + h * 0.5, 0.08, 0.05, h, 10, mats["wall_white"], col)
    add_box(f"{name}_Flag", cx + 0.45, cy, z_base + h - 0.35, 0.9, 0.06, 0.55, mats["red_flag"], col)


def build_landmarks(mats, col):
    # ==========================================================================
    # 1. PHAN HIEU VINH TRUNG (X = -26.0, Y = +0.5 -> Three.js [-26.0, Y, -0.5])
    # Exact miniature replica of our 1:1 School Model in Thon 3 Vinh Trung!
    # ==========================================================================
    vx, vy = -26.0, 0.5
    vz = island_elevation(vx, vy)
    add_box("PH_VinhTrung_GlowPlinth", vx, vy, vz + 0.08, 9.2, 8.2, 0.22, mats["gold_accent"], col)
    add_box("PH_VinhTrung_Courtyard", vx, vy, vz + 0.22, 8.4, 7.4, 0.16, mats["courtyard_grey"], col)
    add_hipped_building("PH_VT_BldA", vx + 2.2, vy - 0.3, vz + 0.30, 0.95, 4.6, 1.35, 0.55, mats["wall_yellow"], mats["roof_red"], col)
    add_hipped_building("PH_VT_BldB", vx + 0.2, vy + 2.4, vz + 0.30, 3.2, 0.9, 0.95, 0.45, mats["wall_yellow"], mats["roof_red"], col)
    add_box("PH_VT_Stage", vx + 0.2, vy + 1.65, vz + 0.55, 1.1, 0.65, 0.5, mats["roof_red"], col)
    build_flagpole("PH_VT_Flag", vx + 0.2, vy + 1.15, vz + 0.30, 1.9, mats, col)
    add_hipped_building("PH_VT_BldC2", vx - 2.3, vy + 1.2, vz + 0.30, 0.85, 2.6, 0.95, 0.42, mats["wall_cream"], mats["roof_red"], col)
    add_hipped_building("PH_VT_GymC1", vx - 2.6, vy - 1.1, vz + 0.30, 2.3, 1.35, 1.05, 0.45, mats["wall_yellow"], mats["roof_gym_dark"], col)
    add_box("PH_VT_Grass1", vx - 0.6, vy - 0.2, vz + 0.32, 1.3, 0.55, 0.08, mats["terrain_plain"], col)
    add_box("PH_VT_Grass2", vx - 0.6, vy - 1.1, vz + 0.32, 1.3, 0.85, 0.08, mats["terrain_plain"], col)
    add_hipped_building("PH_VT_BldD", vx + 3.5, vy + 2.3, vz + 0.30, 1.6, 0.9, 1.25, 0.48, mats["wall_yellow"], mats["roof_red"], col)
    add_cylinder("PH_VT_CircleGarden", vx + 3.5, vy - 1.2, vz + 0.34, 0.85, 0.85, 0.08, 20, mats["terrain_plain"], col)
    add_box("PH_VT_MainGate", vx + 0.8, vy - 3.4, vz + 0.65, 1.2, 0.25, 0.85, mats["wall_cream"], col)
    add_box("PH_VT_MainGateRoof", vx + 0.8, vy - 3.4, vz + 1.12, 1.45, 0.4, 0.18, mats["roof_red"], col)

    # ==========================================================================
    # 2. PHAN HIEU DIEM CHINH - THON DAU DONG (X = +28.0, Y = +1.5 -> Three.js [28.0, Y, -1.5])
    # ==========================================================================
    dx, dy = 28.0, 1.5
    dz = island_elevation(dx, dy)
    add_box("PH_DauDong_GlowPlinth", dx, dy, dz + 0.08, 9.0, 7.6, 0.22, mats["gold_accent"], col)
    add_box("PH_DauDong_Courtyard", dx, dy, dz + 0.22, 8.2, 6.8, 0.16, mats["courtyard_grey"], col)
    add_hipped_building("PH_DD_MainBld", dx, dy + 2.1, dz + 0.30, 4.8, 1.05, 1.40, 0.55, mats["wall_yellow"], mats["roof_red"], col)
    add_hipped_building("PH_DD_EastWing", dx + 2.8, dy - 0.3, dz + 0.30, 0.95, 3.6, 1.05, 0.45, mats["wall_yellow"], mats["roof_red"], col)
    add_hipped_building("PH_DD_WestWing", dx - 2.8, dy - 0.3, dz + 0.30, 0.95, 3.6, 1.05, 0.45, mats["wall_cream"], mats["roof_red"], col)
    build_flagpole("PH_DD_Flag", dx, dy + 0.4, dz + 0.30, 2.1, mats, col)
    add_box("PH_DD_Gate", dx, dy - 3.1, dz + 0.65, 1.3, 0.25, 0.85, mats["wall_cream"], col)
    add_box("PH_DD_GateRoof", dx, dy - 3.1, dz + 1.12, 1.55, 0.4, 0.18, mats["roof_red"], col)

    # ==========================================================================
    # 3. PHAN HIEU 2 - KHU TRUNG TAM VINH THUC (X = +3.0, Y = +0.5)
    # ==========================================================================
    p2x, p2y = 3.0, 0.5
    p2z = island_elevation(p2x, p2y)
    add_box("PH_2_GlowPlinth", p2x, p2y, p2z + 0.08, 6.8, 5.8, 0.20, mats["gold_accent"], col)
    add_box("PH_2_Courtyard", p2x, p2y, p2z + 0.20, 6.2, 5.2, 0.15, mats["courtyard_grey"], col)
    add_hipped_building("PH_2_MainBld", p2x, p2y + 1.4, p2z + 0.28, 3.8, 0.95, 1.10, 0.48, mats["wall_yellow"], mats["roof_red"], col)
    add_hipped_building("PH_2_SideBld", p2x - 2.1, p2y - 0.4, p2z + 0.28, 0.85, 2.6, 0.90, 0.40, mats["wall_cream"], mats["roof_red"], col)
    build_flagpole("PH_2_Flag", p2x + 0.3, p2y, p2z + 0.28, 1.8, mats, col)

    # ==========================================================================
    # 4. BEN TAU VAN GIA (NORTH COAST! X = +17.0, Y = +12.5)
    # ==========================================================================
    px, py = 17.0, 12.5
    pz = max(0.65, island_elevation(px, py))
    add_box("Port_Apron", px, py, pz * 0.5 + 0.15, 6.2, 5.2, pz, mats["courtyard_grey"], col)
    add_hipped_building("Port_Terminal", px - 0.6, py - 0.8, pz + 0.2, 3.4, 1.4, 1.0, 0.45, mats["wall_white"], mats["roof_blue"], col)
    add_box("Port_MainPier", px + 1.2, py + 4.2, 0.55, 1.5, 7.5, 0.45, mats["courtyard_grey"], col, rot_z=0.1)
    for p_idx in range(5):
        t = p_idx / 4.0
        add_cylinder(f"Port_Piling_{p_idx}", px + 1.2, py + 1.2 + t * 6.0, 0.1, 0.18, 0.18, 1.2, 10, mats["stone_dark"], col)
    add_box("Port_Speedboat_1", px + 2.8, py + 4.5, 0.35, 1.2, 3.2, 0.5, mats["boat_white"], col, rot_z=-0.1)
    add_box("Port_Speedboat_Cabin_1", px + 2.8, py + 4.2, 0.72, 0.9, 1.6, 0.4, mats["roof_blue"], col, rot_z=-0.1)
    add_box("Port_Speedboat_2", px - 0.5, py + 5.5, 0.35, 1.1, 2.8, 0.45, mats["boat_white"], col, rot_z=0.2)

    # ==========================================================================
    # 5. DON BIEN PHONG CUA KHAU CANG VAN GIA (NORTH COAST! X = +12.0, Y = +9.5)
    # ==========================================================================
    bx, by = 12.0, 9.5
    bz = island_elevation(bx, by)
    add_box("DBP_Compound_Base", bx, by, bz + 0.12, 7.6, 6.4, 0.24, mats["courtyard_grey"], col)
    add_box("DBP_Wall_North", bx, by + 3.0, bz + 0.45, 7.4, 0.18, 0.55, mats["wall_white"], col)
    add_box("DBP_Wall_West", bx - 3.6, by, bz + 0.45, 0.18, 6.0, 0.55, mats["wall_white"], col)
    add_box("DBP_Wall_East", bx + 3.6, by, bz + 0.45, 0.18, 6.0, 0.55, mats["wall_white"], col)
    add_hipped_building("DBP_CommandHQ", bx, by + 1.5, bz + 0.24, 4.4, 1.15, 1.35, 0.55, mats["wall_yellow"], mats["roof_red"], col)
    add_box("DBP_Command_Trim", bx, by + 0.9, bz + 0.95, 4.45, 0.12, 0.22, mats["roof_green"], col)
    add_hipped_building("DBP_Barracks", bx - 2.3, by - 0.4, bz + 0.24, 0.95, 2.8, 1.0, 0.42, mats["wall_cream"], mats["roof_red"], col)
    add_box("DBP_Watchtower_Shaft", bx + 2.4, by - 1.2, bz + 1.25, 0.75, 0.75, 2.1, mats["wall_white"], col)
    add_box("DBP_Watchtower_Cabin", bx + 2.4, by - 1.2, bz + 2.45, 1.05, 1.05, 0.55, mats["roof_green"], col)
    add_cylinder("DBP_Watchtower_Roof", bx + 2.4, by - 1.2, bz + 2.95, 0.9, 0.05, 0.5, 4, mats["roof_red"], col, rot_z=math.pi * 0.25)
    build_flagpole("DBP_Flag", bx, by - 0.3, bz + 0.24, 2.3, mats, col)
    add_box("DBP_Gate", bx, by - 3.0, bz + 0.65, 1.6, 0.28, 0.9, mats["wall_white"], col)
    add_box("DBP_GateBanner", bx, by - 3.0, bz + 1.05, 1.8, 0.35, 0.24, mats["red_flag"], col)
    add_box("Patrol_Ship_Hull", bx + 2.5, by + 7.5, 0.35, 3.6, 0.95, 0.55, mats["boat_white"], col, rot_z=0.25)
    add_box("Patrol_Ship_Stripe", bx + 2.5, by + 7.5, 0.52, 3.65, 0.98, 0.16, mats["border_blue"], col, rot_z=0.25)
    add_box("Patrol_Ship_Bridge", bx + 2.8, by + 7.6, 0.85, 1.4, 0.72, 0.55, mats["wall_white"], col, rot_z=0.25)

    # ==========================================================================
    # 6. DEN THO TUONG QUAN LE BA DUC - MIEU BEN HEN (X = -30.0, Y = -2.5)
    # ==========================================================================
    tx, ty = -30.0, -2.5
    tz = island_elevation(tx, ty)
    add_box("Temple_StonePlinth", tx, ty, tz + 0.15, 7.2, 6.4, 0.32, mats["stone_dark"], col)
    add_box("Temple_BrickYard", tx, ty, tz + 0.33, 6.6, 5.8, 0.12, mats["wall_brick"], col)
    add_hipped_building("Temple_Sanctuary_Lower", tx, ty + 1.2, tz + 0.38, 3.8, 1.8, 1.05, 0.55, mats["wall_yellow"], mats["roof_temple"], col)
    add_hipped_building("Temple_Sanctuary_Upper", tx, ty + 1.2, tz + 1.25, 2.8, 1.3, 0.45, 0.52, mats["wall_brick"], mats["roof_temple"], col)
    for sx in (-1.95, 1.95):
        for sy in (0.25, 2.15):
            add_box(f"Temple_Eave_{sx}_{sy}", tx + sx, ty + sy, tz + 1.55, 0.35, 0.35, 0.25, mats["gold_accent"], col, rot_z=0.78)
    add_hipped_building("Temple_TaVu", tx - 2.3, ty - 0.1, tz + 0.38, 0.85, 2.2, 0.80, 0.38, mats["wall_yellow"], mats["roof_temple"], col)
    add_hipped_building("Temple_HuuVu", tx + 2.3, ty - 0.1, tz + 0.38, 0.85, 2.2, 0.80, 0.38, mats["wall_yellow"], mats["roof_temple"], col)
    add_box("Temple_IncenseAltar", tx, ty - 0.2, tz + 0.65, 0.65, 0.45, 0.55, mats["stone_dark"], col)
    add_box("Temple_BinhPhong", tx, ty - 1.2, tz + 0.68, 1.3, 0.20, 0.65, mats["wall_yellow"], col)
    for px_off, h_pil in [(-1.4, 1.45), (-0.55, 1.85), (0.55, 1.85), (1.4, 1.45)]:
        add_box(f"Temple_TamQuan_Pillar_{px_off}", tx + px_off, ty - 2.6, tz + 0.38 + h_pil * 0.5, 0.24, 0.24, h_pil, mats["stone_dark"], col)
        add_box(f"Temple_TamQuan_Top_{px_off}", tx + px_off, ty - 2.6, tz + 0.38 + h_pil + 0.15, 0.34, 0.34, 0.28, mats["gold_accent"], col)
    add_box("Temple_TamQuan_Roof", tx, ty - 2.6, tz + 1.55, 1.45, 0.45, 0.28, mats["roof_temple"], col)
    for bx_off in (-3.2, 3.2):
        add_cylinder(f"Temple_Banyan_Trunk_{bx_off}", tx + bx_off, ty + 1.8, tz + 0.9, 0.28, 0.20, 1.4, 8, mats["tree_trunk"], col)
        add_cylinder(f"Temple_Banyan_Crown_{bx_off}", tx + bx_off, ty + 1.8, tz + 1.9, 1.35, 0.4, 1.4, 12, mats["tree_banyan"], col)

    # ==========================================================================
    # 7. HAI DANG VINH THUC 1962 - DINH NUI DAU TAN (X = +65.0, Y = +13.5)
    # Perched atop the rocky promontory cape at the far NE point of the island!
    # ==========================================================================
    lx, ly = 65.0, 13.5
    lz = island_elevation(lx, ly)
    add_cylinder("Lighthouse_BasePlinth", lx, ly, lz + 0.2, 3.6, 3.2, 0.5, 24, mats["courtyard_grey"], col)
    add_hipped_building("Lighthouse_Station", lx - 1.4, ly - 0.8, lz + 0.45, 2.2, 1.2, 0.95, 0.42, mats["wall_yellow"], mats["roof_red"], col)
    add_cylinder("Lighthouse_Shaft_White", lx + 0.6, ly + 0.5, lz + 2.4, 0.82, 0.62, 3.9, 24, mats["wall_white"], col)
    add_cylinder("Lighthouse_Shaft_Black", lx + 0.6, ly + 0.5, lz + 4.8, 0.62, 0.56, 1.0, 24, mats["lighthouse_dark"], col)
    add_cylinder("Lighthouse_Gallery_Balcony", lx + 0.6, ly + 0.5, lz + 5.4, 0.88, 0.88, 0.20, 24, mats["wall_white"], col)
    add_cylinder("Lighthouse_Lantern_Glass", lx + 0.6, ly + 0.5, lz + 5.95, 0.48, 0.48, 0.95, 20, mats["beacon_glow"], col)
    add_cylinder("Lighthouse_Dome_Cap", lx + 0.6, ly + 0.5, lz + 6.65, 0.55, 0.05, 0.55, 20, mats["roof_red"], col)
    build_flagpole("Lighthouse_Flag", lx + 2.0, ly - 0.5, lz + 0.45, 2.2, mats, col)

    # ==========================================================================
    # 8. BAI BIEN DAU DONG (SE COAST) & NHA HANG XUAN MEN, TRUONG DIEU
    # ==========================================================================
    add_hipped_building("Restaurant_TruongDieu", 38.0, -1.0, island_elevation(38.0, -1.0) + 0.15, 2.4, 1.2, 0.8, 0.4, mats["wall_cream"], mats["roof_red"], col, rot_z=-0.35)
    add_hipped_building("Restaurant_XuanMen", 32.0, -5.2, island_elevation(32.0, -5.2) + 0.15, 2.6, 1.3, 0.8, 0.4, mats["wall_yellow"], mats["roof_red"], col, rot_z=-0.45)
    for k in range(3):
        px_b = 35.0 + k * 3.5
        py_b = -4.0 + k * 1.8
        pz_b = max(0.45, island_elevation(px_b, py_b))
        add_cylinder(f"DauDong_Hut_Pole_{k}", px_b, py_b, pz_b + 0.45, 0.08, 0.08, 0.9, 8, mats["tree_trunk"], col)
        add_cylinder(f"DauDong_Hut_Roof_{k}", px_b, py_b, pz_b + 1.05, 0.85, 0.05, 0.55, 12, mats["sand_beach"], col)

    # ==========================================================================
    # 9. BAI BIEN BEN HEN (SW COAST) & FISHING BOATS & NHA HANG HOANG THOM
    # ==========================================================================
    add_hipped_building("Restaurant_HoangThom", 2.0, -3.8, island_elevation(2.0, -3.8) + 0.15, 2.2, 1.1, 0.75, 0.38, mats["wall_cream"], mats["roof_red"], col, rot_z=0.1)
    for k in range(4):
        fx_b = -45.0 + k * 5.5
        fy_b = -9.0 + k * 1.8
        add_box(f"BenHen_Boat_{k}", fx_b, fy_b, 0.18, 1.6, 0.48, 0.28, mats["boat_Wood"], col, rot_z=0.35 + k * 0.15)

    # ==========================================================================
    # 10. FISHERMAN'S WHARF (FAR WEST REEF / CAPE)
    # ==========================================================================
    add_box("Fishermans_Wharf_Pier", -64.0, 1.5, 0.45, 1.2, 3.5, 0.4, mats["courtyard_grey"], col, rot_z=0.45)
    add_box("Fishermans_Wharf_Hut", -62.5, 1.0, island_elevation(-62.5, 1.0) + 0.1, 1.4, 1.0, 0.75, mats["wall_cream"], col)
    add_box("Fishermans_Wharf_Boat", -65.2, 2.8, 0.22, 1.4, 0.5, 0.3, mats["boat_Wood"], col, rot_z=-0.3)


def build_forests_and_villages(mats, col):
    rng = random.Random(20261110)

    village_zones = [
        (-26.0,   1.2, 5.5, 8),
        (  1.0,   1.5, 5.5, 8),
        ( 28.0,   2.5, 6.0, 10),
        ( 16.0,  10.5, 4.5, 6),
    ]
    h_idx = 0
    for vx, vy, vr, count in village_zones:
        for _ in range(count):
            hx = vx + rng.uniform(-vr, vr)
            hy = vy + rng.uniform(-vr * 0.6, vr * 0.6)
            if math.hypot(hx - (-26.0), hy - 0.5) < 5.8:
                continue
            if math.hypot(hx - 28.0, hy - 1.5) < 5.8:
                continue
            if math.hypot(hx - 3.0, hy - 0.5) < 4.5:
                continue
            if math.hypot(hx - 17.0, hy - 12.5) < 4.5:
                continue
            if math.hypot(hx - 12.0, hy - 9.5) < 4.5:
                continue
            n_val, _ = island_norm_and_base(hx, hy)
            hz = island_elevation(hx, hy)
            if n_val < 0.72 and 1.2 <= hz <= 4.0:
                h_idx += 1
                w = rng.uniform(0.85, 1.35)
                d = rng.uniform(0.65, 0.95)
                h = rng.uniform(0.55, 0.85)
                ang = rng.uniform(-0.4, 0.4)
                w_mat = mats["wall_cream"] if (h_idx % 2 == 0) else mats["wall_yellow"]
                add_hipped_building(f"Village_House_{h_idx}", hx, hy, hz, w, d, h, 0.35, w_mat, mats["roof_red"], col, rot_z=ang)

    t_idx = 0
    for _ in range(240):
        tx = rng.uniform(-62.0, 64.0)
        ty = rng.uniform(-16.0, 16.0)
        clear = True
        for lx, ly, lr in [
            (-26.0,  0.5, 5.2),
            ( 28.0,  1.5, 5.2),
            (  3.0,  0.5, 4.2),
            ( 17.0, 12.5, 4.5),
            ( 12.0,  9.5, 4.5),
            (-30.0, -2.5, 4.5),
            ( 65.0, 13.5, 3.8),
            (  3.0,  1.2, 4.2),
        ]:
            if math.hypot(tx - lx, ty - ly) < lr:
                clear = False
                break
        if not clear:
            continue
        n_val, _ = island_norm_and_base(tx, ty)
        tz = island_elevation(tx, ty)
        if n_val < 0.82 and 1.1 <= tz <= 9.6:
            t_idx += 1
            scale = rng.uniform(0.75, 1.35)
            add_cylinder(f"Island_Tree_Trunk_{t_idx}", tx, ty, tz + 0.35 * scale, 0.10 * scale, 0.07 * scale, 0.7 * scale, 6, mats["tree_trunk"], col)
            add_cylinder(f"Island_Tree_Crown_{t_idx}", tx, ty, tz + 1.05 * scale, 0.65 * scale, 0.05 * scale, 1.35 * scale, 8, mats["tree_pine"], col)


def setup_world_and_render_preview():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900

    light_data = bpy.data.lights.new(name="Island_Sun", type='SUN')
    light_data.energy = 3.6
    light_data.color = (1.0, 0.98, 0.92)
    light_obj = bpy.data.objects.new(name="Island_Sun", object_data=light_data)
    bpy.context.scene.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(48), math.radians(15), math.radians(-35))

    world = bpy.data.worlds.new("Island_World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.56, 0.78, 0.95, 1.0)
        bg.inputs["Strength"].default_value = 1.1

    cam_data = bpy.data.cameras.new("Island_Overview_Cam")
    cam_data.lens = 28
    cam_data.clip_end = 500.0
    cam_obj = bpy.data.objects.new("Island_Overview_Cam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location = (0.0, -88.0, 58.0)
    cam_obj.rotation_euler = (math.radians(58.0), 0.0, 0.0)
    scene.camera = cam_obj

    preview_path = os.path.join(PROJECT_ROOT, "docs", "preview_island_overview.png")
    scene.render.filepath = preview_path
    bpy.ops.render.render(write_still=True)
    print(f"[OK] Rendered island overview preview: {preview_path}")

    bpy.data.objects.remove(cam_obj, do_unlink=True)
    bpy.data.objects.remove(light_obj, do_unlink=True)


def main():
    clear_scene()
    col_island = get_or_create_collection("VinhThuc_Island_3D")
    mats = create_materials()

    build_terrain_and_ocean(mats, col_island)
    build_trans_island_road(mats, col_island)
    build_landmarks(mats, col_island)
    build_forests_and_villages(mats, col_island)

    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    print(f"[OK] Saved Blender file: {OUT_BLEND}")

    setup_world_and_render_preview()

    os.makedirs(os.path.dirname(CLIENT_GLB), exist_ok=True)
    for out_path in (OUT_GLB, CLIENT_GLB):
        bpy.ops.export_scene.gltf(
            filepath=out_path,
            export_format='GLB',
            use_selection=False,
            export_apply=True,
        )
        print(f"[OK] Exported GLB: {out_path}")


if __name__ == "__main__":
    main()
