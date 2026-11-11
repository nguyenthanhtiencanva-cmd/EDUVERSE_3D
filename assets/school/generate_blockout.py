"""
================================================================================
EDUVERSE 3D - Google Maps 1:1 Calibrated School Campus Generator (v7)
School: Trường Tiểu học & THCS Vĩnh Thực (Xã Vĩnh Thực, TP. Móng Cái, Quảng Ninh)
GPS Coordinates: 21.3712629° N, 107.9043412° E (Campus Azimuth: 25.33° NNE)
Art Style: Style C (Stylized Realistic / Clean Architectural Low-to-Mid Poly)
Engine: Blender 4.2 LTS / WebGL Three.js PWA Target (< 35k Tris)

Key Upgrades in v7 (Calibrated 1:1 against Google Maps Satellite + Drone Video):
1. Embedded 1:1 Google Maps Satellite Reference Plane (REF_GoogleMaps_Blueprint):
   - Exact scale (0.1126 m/px -> 81.30m x 92.56m) & 25.33° azimuth alignment.
2. Exact Photogrammetric Footprints & Orientations:
   - Building A (East Wing, 3F): 52.0m x 8.6m, central entrance canopy with banners,
     corridor classrooms, stone benches, recycling bins, NE corner walkway to Bld B.
   - Building B (North Wing, 2F): 31.6m x 8.2m at Y=29.35m (behind Bld A north end),
     ceremony stage at X=1.4m, school clock, Uncle Ho pano, flags, podium, PA & VIP area.
   - Building C2 (West Annex, 2F): 26.0m x 8.2m at X=-28.0m, rear terrace & brick wall
     collinear with Bld B rear boundary (Y=33.45m), plus west lean-to shed & blue canopy.
   - Building C1 (Gymnasium): Correctly oriented EAST-WEST (25.0m x 14.2m), crimson
     East-West gabled roof inside white parapet coping, 4-bay South facade with
     clerestory windows & 2-pillar entrance portico, fenced front yard & green bike shed C3
     with parked student bicycles.
   - Building D (Admin 3F): Correctly oriented facing SOUTH (17.5m x 10.0m) with red
     banners, 1F east auxiliary hall, rear Bld A annex, and large East Formal Lawn Garden
     with concentric circular walkway.
   - Courtyard Layout: 2 N-S white-curbed shrub planters along left lane, 2 large E-W
     horizontal grass plots (11.5m x 4.6m & 10.8m x 9.6m), small white utility hut,
     badminton court markings, LED courtyard streetlights (no students / no big trees).
   - Main Gate, Red-Roofed Guardhouse, SW Funnel Perimeter Wall, Main Road & Winding Stream.
================================================================================
"""

import bpy
import bmesh
import math
import os


# ------------------------------------------------------------------------------
# 1. SCENE SETUP & COLOR MANAGEMENT
# ------------------------------------------------------------------------------
def setup_scene():
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = 'METERS'

    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)

    root_col = bpy.data.collections.new("EDUVERSE_Campus")
    scene.collection.children.link(root_col)

    world = scene.world or bpy.data.worlds.new("EDUVERSE_World")
    scene.world = world
    world.use_nodes = True
    w_nodes = world.node_tree.nodes
    w_links = world.node_tree.links
    w_nodes.clear()

    node_out = w_nodes.new(type="ShaderNodeOutputWorld")
    node_bg = w_nodes.new(type="ShaderNodeBackground")
    node_bg.inputs["Strength"].default_value = 0.85

    # Procedural Realistic Daytime Sky with Soft Cumulus Clouds
    node_tc = w_nodes.new(type="ShaderNodeTexCoord")
    node_sep = w_nodes.new(type="ShaderNodeSeparateXYZ")
    node_sky_ramp = w_nodes.new(type="ShaderNodeValToRGB")
    node_sky_ramp.color_ramp.elements[0].position = 0.0
    node_sky_ramp.color_ramp.elements[0].color = (0.78, 0.86, 0.96, 1.0)  # Horizon mist blue
    node_sky_ramp.color_ramp.elements[1].position = 0.35
    node_sky_ramp.color_ramp.elements[1].color = (0.28, 0.54, 0.88, 1.0)  # Zenith sky blue

    node_noise = w_nodes.new(type="ShaderNodeTexNoise")
    node_noise.inputs["Scale"].default_value = 4.2
    node_noise.inputs["Detail"].default_value = 6.0
    node_noise.inputs["Roughness"].default_value = 0.62

    node_cloud_ramp = w_nodes.new(type="ShaderNodeValToRGB")
    node_cloud_ramp.color_ramp.elements[0].position = 0.46
    node_cloud_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    node_cloud_ramp.color_ramp.elements[1].position = 0.72
    node_cloud_ramp.color_ramp.elements[1].color = (0.92, 0.94, 0.98, 1.0)

    node_mix = w_nodes.new(type="ShaderNodeMixRGB")
    node_mix.inputs["Color2"].default_value = (0.96, 0.97, 0.99, 1.0)

    w_links.new(node_tc.outputs["Generated"], node_sep.inputs["Vector"])
    w_links.new(node_sep.outputs["Z"], node_sky_ramp.inputs["Fac"])
    w_links.new(node_tc.outputs["Generated"], node_noise.inputs["Vector"])
    w_links.new(node_noise.outputs["Fac"], node_cloud_ramp.inputs["Fac"])
    w_links.new(node_cloud_ramp.outputs["Color"], node_mix.inputs["Fac"])
    w_links.new(node_sky_ramp.outputs["Color"], node_mix.inputs["Color1"])
    w_links.new(node_mix.outputs["Color"], node_bg.inputs["Color"])
    w_links.new(node_bg.outputs["Background"], node_out.inputs["Surface"])

    scene.render.engine = (
        'BLENDER_EEVEE_NEXT'
        if hasattr(bpy.types, 'RenderSettings')
        and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
        else 'BLENDER_EEVEE'
    )
    if hasattr(scene, "eevee"):
        for attr, val in [("use_gtao", True), ("gtao_distance", 0.8), ("use_raytracing", True), ("use_shadows", True)]:
            if hasattr(scene.eevee, attr):
                try:
                    setattr(scene.eevee, attr, val)
                except Exception:
                    pass
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100

    try:
        scene.view_settings.view_transform = 'AgX'
        scene.view_settings.look = 'Medium High Contrast'
    except Exception:
        pass

    return root_col


def sub_col(name, parent):
    col = bpy.data.collections.new(name)
    parent.children.link(col)
    return col


# ------------------------------------------------------------------------------
# 2. COLOR PALETTE & PBR TEXTURED MATERIAL LIBRARY (NHÓM 1 HYPER-DETAIL)
# ------------------------------------------------------------------------------
TEX_DIR = "d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures"


def create_mat(name, color_rgba, roughness=0.6, metallic=0.0, emission=None, alpha=1.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color_rgba
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if alpha < 1.0 and "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha
            if hasattr(mat, "blend_method"):
                mat.blend_method = 'BLEND'
        if emission:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission[0]
                bsdf.inputs["Emission Strength"].default_value = emission[1]
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = emission[0]
    return mat


def create_textured_mat(name, tex_filename, fallback_rgba=(0.8, 0.8, 0.8, 1.0), bump_filename=None, roughness=0.55, metallic=0.0, bump_strength=0.22):
    mat = create_mat(name, fallback_rgba, roughness=roughness, metallic=metallic)
    tex_path = os.path.join(TEX_DIR, tex_filename).replace("\\", "/")
    if not os.path.exists(tex_path):
        return mat

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return mat

    tex_node = nodes.new("ShaderNodeTexImage")
    tex_node.image = bpy.data.images.load(tex_path, check_existing=True)
    links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])

    if bump_filename:
        bump_path = os.path.join(TEX_DIR, bump_filename).replace("\\", "/")
        if os.path.exists(bump_path):
            bump_img_node = nodes.new("ShaderNodeTexImage")
            bump_img_node.image = bpy.data.images.load(bump_path, check_existing=True)
            if hasattr(bump_img_node.image, "colorspace_settings"):
                bump_img_node.image.colorspace_settings.name = 'Non-Color'
            bump_node = nodes.new("ShaderNodeBump")
            bump_node.inputs["Strength"].default_value = bump_strength
            bump_node.inputs["Distance"].default_value = 0.04
            links.new(bump_img_node.outputs["Color"], bump_node.inputs["Height"])
            links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def build_materials():
    mats = {
        # Facades & Walls
        "Wall_Yellow": create_mat("MAT_Wall_Yellow", (0.95, 0.86, 0.58, 1.0), roughness=0.65),
        "Wall_Inner": create_mat("MAT_Wall_Inner", (0.92, 0.88, 0.76, 1.0), roughness=0.75),
        "Wall_White": create_mat("MAT_Wall_White", (0.96, 0.96, 0.96, 1.0), roughness=0.55),
        "Wall_Brick": create_mat("MAT_Wall_Brick", (0.52, 0.28, 0.22, 1.0), roughness=0.85),
        "Wall_GreyFence": create_mat("MAT_Wall_GreyFence", (0.62, 0.63, 0.65, 1.0), roughness=0.80),
        "Trim_White": create_mat("MAT_Trim_White", (0.97, 0.97, 0.97, 1.0), roughness=0.45),
        "Baluster_White": create_mat("MAT_Baluster_White", (0.95, 0.95, 0.95, 1.0), roughness=0.45),
        "Accent_Apricot": create_mat("MAT_Accent_Apricot", (0.88, 0.52, 0.22, 1.0), roughness=0.55),
        "Wall_OchreBase": create_mat("MAT_Wall_OchreBase", (0.86, 0.68, 0.30, 1.0), roughness=0.65),
        "Granite_PinkRed": create_textured_mat("MAT_Granite_PinkRed", "pbr_granite_pinkred.png", (0.64, 0.26, 0.24, 1.0), roughness=0.30, metallic=0.10),
        "Granite_Beige": create_textured_mat("MAT_Granite_Beige", "pbr_granite_beige.png", (0.68, 0.58, 0.44, 1.0), roughness=0.32, metallic=0.15),
        "Stage_Terracotta": create_textured_mat("MAT_Stage_Terracotta", "pbr_terracotta_steps.png", (0.72, 0.22, 0.18, 1.0), roughness=0.42),
        "Pot_BlueOrnate": create_textured_mat("MAT_Pot_BlueOrnate", "tex_planter_blue_ornate.png", (0.12, 0.34, 0.62, 1.0), roughness=0.32),
        "Pano_Yellow": create_mat("MAT_Pano_Yellow", (0.94, 0.84, 0.32, 1.0), roughness=0.50),
        "Gate_GreenFold": create_mat("MAT_Gate_GreenFold", (0.16, 0.38, 0.28, 1.0), roughness=0.45, metallic=0.50),
        "Play_Blue": create_mat("MAT_Play_Blue", (0.08, 0.38, 0.82, 1.0), roughness=0.35, metallic=0.25),
        "Play_Yellow": create_mat("MAT_Play_Yellow", (0.98, 0.82, 0.08, 1.0), roughness=0.35, metallic=0.20),
        "Play_Red": create_mat("MAT_Play_Red", (0.88, 0.14, 0.14, 1.0), roughness=0.35, metallic=0.20),

        # High-Resolution Vietnamese Signage & Uncle Ho Pano Materials
        "Sign_Stage": create_textured_mat("MAT_Sign_Stage", "tex_slogan_stage.png", (0.85, 0.10, 0.10, 1.0), roughness=0.38),
        "Sign_Tree_L": create_textured_mat("MAT_Sign_Tree_L", "tex_slogan_tree_left.png", (0.12, 0.52, 0.88, 1.0), roughness=0.40),
        "Sign_Tree_R": create_textured_mat("MAT_Sign_Tree_R", "tex_slogan_tree_right.png", (0.12, 0.52, 0.88, 1.0), roughness=0.40),
        "Sign_Bld_C2": create_textured_mat("MAT_Sign_Bld_C2", "tex_slogan_bld_c2.png", (0.85, 0.10, 0.10, 1.0), roughness=0.38),
        "Sign_Bld_A_Main": create_textured_mat("MAT_Sign_Bld_A_Main", "tex_slogan_bld_a_main.png", (0.85, 0.10, 0.10, 1.0), roughness=0.38),
        "Sign_Bld_A_Sub": create_textured_mat("MAT_Sign_Bld_A_Sub", "tex_slogan_bld_a_sub.png", (0.85, 0.10, 0.10, 1.0), roughness=0.38),
        "Sign_Gate": create_textured_mat("MAT_Sign_Gate", "tex_gate_sign.png", (0.85, 0.10, 0.10, 1.0), roughness=0.38),
        "Sign_UncleHo_Pano": create_textured_mat("MAT_Sign_UncleHo_Pano", "tex_uncle_ho_pano.png", (0.88, 0.78, 0.35, 1.0), roughness=0.35),

        # Roofs (with corrugated terracotta tile PBR texture + bump)
        "Roof_RedTile": create_textured_mat("MAT_Roof_RedTile", "pbr_roof_red_tile.png", (0.76, 0.23, 0.10, 1.0), bump_filename="pbr_roof_red_tile_bump.png", roughness=0.58, bump_strength=0.32),
        "Roof_RidgeTile": create_mat("MAT_Roof_RidgeTile", (0.58, 0.14, 0.07, 1.0), roughness=0.68),
        "Roof_CrimsonGym": create_mat("MAT_Roof_CrimsonGym", (0.52, 0.06, 0.14, 1.0), roughness=0.40, metallic=0.18),
        "Roof_GreenCanopy": create_mat("MAT_Roof_GreenCanopy", (0.10, 0.44, 0.30, 1.0), roughness=0.48),
        "Roof_BlueCanopy": create_mat("MAT_Roof_BlueCanopy", (0.08, 0.48, 0.82, 1.0), roughness=0.42),
        "Roof_LightMint": create_mat("MAT_Roof_LightMint", (0.62, 0.76, 0.72, 1.0), roughness=0.55),
        "Roof_SlateGrey": create_mat("MAT_Roof_SlateGrey", (0.38, 0.44, 0.48, 1.0), roughness=0.55, metallic=0.2),

        # Pavements & Terrain (with weathered courtyard concrete PBR texture + bump)
        "Yard_Concrete": create_textured_mat("MAT_Yard_Concrete", "pbr_courtyard_concrete.png", (0.82, 0.81, 0.78, 1.0), bump_filename="pbr_courtyard_concrete_bump.png", roughness=0.82, bump_strength=0.18),
        "Road_Asphalt": create_mat("MAT_Road_Asphalt", (0.52, 0.50, 0.47, 1.0), roughness=0.88),
        "Marking_White": create_mat("MAT_Marking_White", (0.98, 0.98, 0.98, 1.0), roughness=0.35),
        "Marking_Yellow": create_mat("MAT_Marking_Yellow", (0.98, 0.85, 0.15, 1.0), roughness=0.35),
        "Water_River": create_mat("MAT_Water_River", (0.32, 0.50, 0.46, 1.0), roughness=0.15, metallic=0.35),
        "Terrain_Earth": create_mat("MAT_Terrain_Earth", (0.46, 0.39, 0.28, 1.0), roughness=0.90),
        "Terrain_Grass": create_textured_mat("MAT_Terrain_Grass", "pbr_grass_lawn.png", (0.24, 0.48, 0.20, 1.0), roughness=0.85),

        # Openings & Hardware (Semi-transparent architectural glass)
        "Window_Dark": create_mat("MAT_Window_Dark", (0.14, 0.16, 0.18, 1.0), roughness=0.25),
        "Glass_Blue": create_mat("MAT_Glass_Blue", (0.20, 0.36, 0.52, 1.0), roughness=0.06, metallic=0.35, alpha=0.62),
        "Door_Wood": create_mat("MAT_Door_Wood", (0.40, 0.26, 0.16, 1.0), roughness=0.65),
        "Railing_Silver": create_mat("MAT_Railing_Silver", (0.85, 0.85, 0.88, 1.0), roughness=0.20, metallic=0.90),
        "Gate_Iron_Blue": create_mat("MAT_Gate_Iron_Blue", (0.20, 0.40, 0.65, 1.0), roughness=0.35, metallic=0.60),
        "Metal_Pipe_White": create_mat("MAT_Metal_Pipe_White", (0.92, 0.92, 0.92, 1.0), roughness=0.40),

        # Ceremony & Banners
        "Banner_Red": create_mat("MAT_Banner_Red", (0.88, 0.08, 0.10, 1.0), roughness=0.45),
        "Banner_Blue": create_mat("MAT_Banner_Blue", (0.06, 0.26, 0.68, 1.0), roughness=0.45),
        "Stage_Carpet": create_mat("MAT_Stage_Carpet", (0.82, 0.08, 0.12, 1.0), roughness=0.85),
        "Flag_GoldStar": create_mat("MAT_Flag_GoldStar", (0.98, 0.88, 0.10, 1.0), roughness=0.35, metallic=0.25),
        "Speaker_Black": create_mat("MAT_Speaker_Black", (0.08, 0.08, 0.09, 1.0), roughness=0.35),

        # Classroom Interiors & Props
        "Blackboard_Green": create_mat("MAT_Blackboard_Green", (0.10, 0.24, 0.14, 1.0), roughness=0.80),
        "Desk_Wood": create_mat("MAT_Desk_Wood", (0.82, 0.62, 0.38, 1.0), roughness=0.60),
        "Chair_Blue": create_mat("MAT_Chair_Blue", (0.16, 0.44, 0.78, 1.0), roughness=0.55),
        "Light_Glow": create_mat("MAT_Light_Glow", (1.0, 1.0, 0.94, 1.0), roughness=0.30, emission=((1.0, 1.0, 0.95, 1.0), 3.0)),
        "AC_White": create_mat("MAT_AC_White", (0.90, 0.90, 0.92, 1.0), roughness=0.40),
        "Bench_Red": create_mat("MAT_Bench_Red", (0.68, 0.30, 0.25, 1.0), roughness=0.60),
        "Bin_Orange": create_mat("MAT_Bin_Orange", (0.95, 0.48, 0.10, 1.0), roughness=0.50),
        "Bin_Green": create_mat("MAT_Bin_Green", (0.12, 0.62, 0.24, 1.0), roughness=0.50),

        # Vegetation
        "Bark_Wood": create_mat("MAT_Bark_Wood", (0.34, 0.24, 0.16, 1.0), roughness=0.85),
        "Plant_Green": create_textured_mat("MAT_Plant_Green", "pbr_grass_lawn.png", (0.26, 0.54, 0.20, 1.0), roughness=0.78),
        "Plant_DarkGreen": create_mat("MAT_Plant_DarkGreen", (0.15, 0.40, 0.17, 1.0), roughness=0.75),
        "Flower_Phoenix": create_mat("MAT_Flower_Phoenix", (0.95, 0.20, 0.08, 1.0), roughness=0.60),
        "Flower_Yellow": create_mat("MAT_Flower_Yellow", (0.98, 0.86, 0.14, 1.0), roughness=0.55),
        "Pot_Ceramic": create_mat("MAT_Pot_Ceramic", (0.92, 0.92, 0.94, 1.0), roughness=0.40),

        # Bunting & Telecom Mast
        "Bunt_Pink": create_mat("MAT_Bunt_Pink", (0.95, 0.20, 0.55, 1.0), roughness=0.50),
        "Bunt_Cyan": create_mat("MAT_Bunt_Cyan", (0.12, 0.75, 0.88, 1.0), roughness=0.50),
        "Bunt_Yellow": create_mat("MAT_Bunt_Yellow", (0.98, 0.88, 0.12, 1.0), roughness=0.50),
        "Bunt_Green": create_mat("MAT_Bunt_Green", (0.18, 0.82, 0.25, 1.0), roughness=0.50),
        "Bunt_Purple": create_mat("MAT_Bunt_Purple", (0.65, 0.22, 0.85, 1.0), roughness=0.50),
        "Mast_RedWhite": create_mat("MAT_Mast_RedWhite", (0.88, 0.16, 0.14, 1.0), roughness=0.35, metallic=0.70),
    }
    return mats


# ------------------------------------------------------------------------------
# 3. MESH PRIMITIVES & ARCHITECTURAL HELPERS (WITH AUTOMATIC UV MAPPING)
# ------------------------------------------------------------------------------
def create_box(name, size, loc, mat, col, rot_z=0.0, uv_fit=False, uv_tile=2.4):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx = max(0.001, size[0])
    sy = max(0.001, size[1])
    sz = max(0.001, size[2])
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    bm.normal_update()

    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        n = face.normal
        for loop in face.loops:
            co = loop.vert.co
            if uv_fit:
                if abs(n.y) > 0.5:
                    u = (co.x / sx) + 0.5
                    if n.y > 0:
                        u = 1.0 - u
                    v_uv = (co.z / sz) + 0.5
                elif abs(n.x) > 0.5:
                    u = (co.y / sy) + 0.5
                    if n.x < 0:
                        u = 1.0 - u
                    v_uv = (co.z / sz) + 0.5
                else:
                    u = (co.x / sx) + 0.5
                    v_uv = (co.y / sy) + 0.5
            else:
                if abs(n.z) > 0.5:
                    u = (co.x + loc[0]) / uv_tile
                    v_uv = (co.y + loc[1]) / uv_tile
                elif abs(n.y) > 0.5:
                    u = (co.x + loc[0]) / uv_tile
                    v_uv = (co.z + loc[2]) / uv_tile
                else:
                    u = (co.y + loc[1]) / uv_tile
                    v_uv = (co.z + loc[2]) / uv_tile
            loop[uv_layer].uv = (u, v_uv)

    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    if rot_z != 0.0:
        obj.rotation_euler.z = rot_z
    if mat:
        obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def create_wall_segment(name, p1, p2, thickness, height, z_base, mat, col):
    """Tạo đoạn tường thẳng nối chính xác giữa 2 điểm (x1, y1) -> (x2, y2)"""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    length = math.hypot(dx, dy)
    angle = math.atan2(dy, dx)
    cx = (p1[0] + p2[0]) / 2.0
    cy = (p1[1] + p2[1]) / 2.0
    return create_box(name, (length, thickness, height), (cx, cy, z_base + height / 2.0), mat, col, rot_z=angle)


def create_cylinder(name, radius, depth, loc, mat, col, segs=14, rot_euler=None):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=radius, radius2=radius, depth=depth)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    if rot_euler:
        obj.rotation_euler = rot_euler
    if mat:
        obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def create_ring(name, inner_r, outer_r, height, loc, mat, col, segs=28):
    """Tạo đường dạo bộ / bó vỉa hình vành khăn tròn"""
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    verts_bot_in, verts_bot_out = [], []
    verts_top_in, verts_top_out = [], []
    for i in range(segs):
        ang = (2.0 * math.pi * i) / segs
        ca, sa = math.cos(ang), math.sin(ang)
        verts_bot_in.append(bm.verts.new((inner_r * ca, inner_r * sa, 0.0)))
        verts_bot_out.append(bm.verts.new((outer_r * ca, outer_r * sa, 0.0)))
        verts_top_in.append(bm.verts.new((inner_r * ca, inner_r * sa, height)))
        verts_top_out.append(bm.verts.new((outer_r * ca, outer_r * sa, height)))
    for i in range(segs):
        ni = (i + 1) % segs
        bm.faces.new((verts_top_in[i], verts_top_out[i], verts_top_out[ni], verts_top_in[ni]))
        bm.faces.new((verts_bot_out[i], verts_bot_out[ni], verts_top_out[ni], verts_top_out[i]))
        bm.faces.new((verts_bot_in[ni], verts_bot_in[i], verts_top_in[i], verts_top_in[ni]))
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    if mat:
        obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def create_cone(name, radius, depth, loc, mat, col, segs=12):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=radius, radius2=0.0, depth=depth)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    if mat:
        obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def create_sphere(name, radius, loc, mat, col, segs=12, rings=8, scale_z=1.0):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=radius)
    if scale_z != 1.0:
        for v in bm.verts:
            v.co.z *= scale_z
    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    if mat:
        obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def create_hipped_roof_with_ridges(name, base_w, base_l, roof_h, overhang, loc, mats, col, roof_mat_key="Roof_RedTile"):
    """Mái dốc 4 phía chuẩn kiến trúc trường học Việt Nam có gờ nóc & diềm mái trắng"""
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    bx = (base_w / 2.0) + overhang
    by = (base_l / 2.0) + overhang

    v0 = bm.verts.new((-bx, -by, 0.0))
    v1 = bm.verts.new((bx, -by, 0.0))
    v2 = bm.verts.new((bx, by, 0.0))
    v3 = bm.verts.new((-bx, by, 0.0))

    if by >= bx:
        ridge_inset = bx * 0.72
        ry = max(0.2, by - ridge_inset)
        v4 = bm.verts.new((0.0, -ry, roof_h))
        v5 = bm.verts.new((0.0, ry, roof_h))
        bm.faces.new((v0, v1, v5, v4))
        bm.faces.new((v1, v2, v5))
        bm.faces.new((v2, v3, v4, v5))
        bm.faces.new((v3, v0, v4))
        bm.faces.new((v3, v2, v1, v0))
        if roof_mat_key == "Roof_RedTile":
            create_box(f"{name}_RidgeTile", (0.35, ry * 2.0 + 0.35, 0.20), (loc[0], loc[1], loc[2] + roof_h + 0.06), mats["Roof_RidgeTile"], col)
    else:
        ridge_inset = by * 0.72
        rx = max(0.2, bx - ridge_inset)
        v4 = bm.verts.new((-rx, 0.0, roof_h))
        v5 = bm.verts.new((rx, 0.0, roof_h))
        bm.faces.new((v0, v1, v5, v4))
        bm.faces.new((v1, v2, v5))
        bm.faces.new((v2, v3, v4, v5))
        bm.faces.new((v3, v0, v4))
        bm.faces.new((v3, v2, v1, v0))
        if roof_mat_key == "Roof_RedTile":
            create_box(f"{name}_RidgeTile", (rx * 2.0 + 0.35, 0.35, 0.20), (loc[0], loc[1], loc[2] + roof_h + 0.06), mats["Roof_RidgeTile"], col)

    bm.normal_update()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop in face.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (co.x / 1.8, co.y / 1.8)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    obj.data.materials.append(mats[roof_mat_key])
    col.objects.link(obj)

    create_box(f"{name}_Fascia", (base_w + overhang * 2.0, base_l + overhang * 2.0, 0.16), (loc[0], loc[1], loc[2] + 0.06), mats["Trim_White"], col)
    return obj


def create_gabled_roof_east_west(name, width_x, length_y, roof_h, overhang, loc, mats, col):
    """Mái tôn 2 dốc màu đỏ đô của Nhà Đa Năng (nóc mái chạy ngang Đông-Tây chuẩn Frame 025)"""
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    bx = (width_x / 2.0) + overhang
    by = (length_y / 2.0) + overhang

    v0 = bm.verts.new((-bx, -by, 0.0))
    v1 = bm.verts.new((bx, -by, 0.0))
    v2 = bm.verts.new((bx, by, 0.0))
    v3 = bm.verts.new((-bx, by, 0.0))
    v4 = bm.verts.new((-bx, 0.0, roof_h))
    v5 = bm.verts.new((bx, 0.0, roof_h))

    # South slope, East gable, North slope, West gable, underside
    bm.faces.new((v0, v1, v5, v4))
    bm.faces.new((v1, v2, v5))
    bm.faces.new((v2, v3, v4, v5))
    bm.faces.new((v3, v0, v4))
    bm.faces.new((v3, v2, v1, v0))

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    obj.data.materials.append(mats["Roof_CrimsonGym"])
    col.objects.link(obj)

    # Ridge cap running East-West & perimeter white parapet coping (sê-nô viền mái trắng)
    create_box(f"{name}_MetalRidge", (bx * 2.0 + 0.2, 0.45, 0.16), (loc[0], loc[1], loc[2] + roof_h + 0.05), mats["Roof_CrimsonGym"], col)
    coping_w = width_x + overhang * 2.0 + 0.5
    coping_l = length_y + overhang * 2.0 + 0.5
    create_box(f"{name}_Parapet_N", (coping_w, 0.35, 0.55), (loc[0], loc[1] + coping_l / 2.0, loc[2] + 0.22), mats["Trim_White"], col)
    create_box(f"{name}_Parapet_S", (coping_w, 0.35, 0.55), (loc[0], loc[1] - coping_l / 2.0, loc[2] + 0.22), mats["Trim_White"], col)
    create_box(f"{name}_Parapet_E", (0.35, coping_l, 0.55), (loc[0] + coping_w / 2.0, loc[1], loc[2] + 0.22), mats["Trim_White"], col)
    create_box(f"{name}_Parapet_W", (0.35, coping_l, 0.55), (loc[0] - coping_w / 2.0, loc[1], loc[2] + 0.22), mats["Trim_White"], col)
    return obj


# ------------------------------------------------------------------------------
# 4. GOOGLE MAPS 1:1 CALIBRATED SATELLITE BLUEPRINT PLANE (.BLEND ONLY)
# ------------------------------------------------------------------------------
def build_google_maps_blueprint(scene):
    """Lót trực tiếp ảnh vệ tinh Google Maps tỉ lệ 1:1 dưới chân công trình trong Blender"""
    sat_paths = [
        "d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/reference_google_maps_satellite.jpg",
        "d:/ANTIGRAVITY/EDUVERSE_3D/docs/reference_google_maps_satellite.jpg",
    ]
    img_path = next((p for p in sat_paths if os.path.exists(p)), None)
    if not img_path:
        return

    ref_col = bpy.data.collections.new("REF_GoogleMaps_Blueprint")
    scene.collection.children.link(ref_col)

    # 722 x 822 px @ 0.1126 m/px -> 81.30m x 92.56m, rotated +25.33° CCW
    plane_w = 722 * 0.1126
    plane_h = 822 * 0.1126

    mesh = bpy.data.meshes.new("REF_GoogleMaps_Satellite_Mesh")
    obj = bpy.data.objects.new("REF_GoogleMaps_Satellite_1to1", mesh)
    bm = bmesh.new()
    v0 = bm.verts.new((-plane_w / 2.0, -plane_h / 2.0, 0.0))
    v1 = bm.verts.new((plane_w / 2.0, -plane_h / 2.0, 0.0))
    v2 = bm.verts.new((plane_w / 2.0, plane_h / 2.0, 0.0))
    v3 = bm.verts.new((-plane_w / 2.0, plane_h / 2.0, 0.0))
    face = bm.faces.new((v0, v1, v2, v3))

    uv_layer = bm.loops.layers.uv.new("UVMap")
    uvs = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    for loop, uv in zip(face.loops, uvs):
        loop[uv_layer].uv = uv

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    obj.location = (-5.37, -4.08, -0.24)
    obj.rotation_euler = (0.0, 0.0, math.radians(25.33))
    obj.hide_render = True  # Giữ ảnh render 3D sạch đẹp, bật sẵn trong Blender Viewport

    mat = bpy.data.materials.new(name="MAT_GoogleMaps_Satellite")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    tex_node = nodes.new("ShaderNodeTexImage")
    tex_node.image = bpy.data.images.load(img_path)
    if bsdf:
        bsdf.inputs["Roughness"].default_value = 1.0
        links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
    obj.data.materials.append(mat)
    ref_col.objects.link(obj)


# ------------------------------------------------------------------------------
# 5. ARCHITECTURAL & COURTYARD HIGH-DETAIL PROPS
# ------------------------------------------------------------------------------
def create_detailed_window_ew(name, loc, mats, col):
    """Cửa sổ 4 cánh trên tường chạy dọc Bắc-Nam (nhìn sang Đông/Tây)"""
    create_box(f"{name}_Sill", (0.36, 2.25, 0.12), (loc[0], loc[1], loc[2] - 0.80), mats["Trim_White"], col)
    create_box(f"{name}_Frame", (0.28, 2.15, 1.55), loc, mats["Trim_White"], col)
    create_box(f"{name}_Glass", (0.30, 1.95, 1.35), loc, mats["Glass_Blue"], col)
    for m_off in [-0.48, 0.0, 0.48]:
        create_box(f"{name}_Muntin_{m_off}", (0.32, 0.05, 1.35), (loc[0], loc[1] + m_off, loc[2]), mats["Trim_White"], col)
    create_box(f"{name}_Transom", (0.32, 1.95, 0.05), (loc[0], loc[1], loc[2] + 0.34), mats["Trim_White"], col)


def create_detailed_window_ns(name, loc, mats, col):
    """Cửa sổ 4 cánh khung trắng trên tường chạy ngang Đông-Tây (nhìn sang Nam/Bắc chuẩn Ảnh 2)"""
    create_box(f"{name}_Sill", (2.25, 0.36, 0.12), (loc[0], loc[1], loc[2] - 0.80), mats["Trim_White"], col)
    create_box(f"{name}_Frame", (2.15, 0.28, 1.55), loc, mats["Trim_White"], col)
    create_box(f"{name}_Glass", (1.95, 0.30, 1.35), loc, mats["Glass_Blue"], col)
    for m_off in [-0.48, 0.0, 0.48]:
        create_box(f"{name}_Muntin_{m_off}", (0.05, 0.32, 1.35), (loc[0] + m_off, loc[1], loc[2]), mats["Trim_White"], col)
    create_box(f"{name}_Transom", (1.95, 0.32, 0.05), (loc[0], loc[1], loc[2] + 0.34), mats["Trim_White"], col)


def create_detailed_door(name, loc, mats, col):
    """Cửa đi 2 cánh gỗ kính + biển tên lớp học"""
    create_box(f"{name}_Frame", (0.28, 1.15, 2.35), loc, mats["Window_Dark"], col)
    create_box(f"{name}_Leaf_L", (0.26, 0.52, 2.25), (loc[0], loc[1] - 0.27, loc[2]), mats["Door_Wood"], col)
    create_box(f"{name}_Leaf_R", (0.26, 0.52, 2.25), (loc[0], loc[1] + 0.27, loc[2]), mats["Door_Wood"], col)
    create_box(f"{name}_Glass_L", (0.28, 0.34, 0.80), (loc[0], loc[1] - 0.27, loc[2] + 0.35), mats["Glass_Blue"], col)
    create_box(f"{name}_Glass_R", (0.28, 0.34, 0.80), (loc[0], loc[1] + 0.27, loc[2] + 0.35), mats["Glass_Blue"], col)
    create_box(f"{name}_Signboard", (0.08, 0.48, 0.20), (loc[0] - 0.15, loc[1], loc[2] + 1.35), mats["Banner_Blue"], col)


def create_classroom_interior(name, room_center, mats, col):
    """Nội thất phòng học chuẩn: Bảng chống lóa xanh, bàn giáo viên, 6 bộ bàn ghế học sinh"""
    create_box(f"{name}_Blackboard", (0.05, 3.2, 1.2), (room_center[0] + 2.6, room_center[1] - 1.7, room_center[2] + 1.5), mats["Blackboard_Green"], col)
    create_box(f"{name}_TeacherDesk", (0.75, 1.3, 0.75), (room_center[0] + 1.7, room_center[1] - 1.1, room_center[2] + 0.375), mats["Desk_Wood"], col)
    for row_x in [0.4, -0.9, -2.1]:
        for col_y in [-0.75, 0.85]:
            create_box(f"{name}_Desk_{row_x}_{col_y}", (0.50, 1.15, 0.70), (room_center[0] + row_x, room_center[1] + col_y, room_center[2] + 0.35), mats["Desk_Wood"], col)
            create_box(f"{name}_Bench_{row_x}_{col_y}", (0.30, 1.15, 0.42), (room_center[0] + row_x - 0.42, room_center[1] + col_y, room_center[2] + 0.21), mats["Desk_Wood"], col)


def create_stone_bench(name, loc, mats, col, rot_z=0.0):
    """Ghế đá mài trường học có tựa lưng và 2 chân đúc"""
    create_box(f"{name}_Seat", (0.48, 1.65, 0.08), (loc[0], loc[1], loc[2] + 0.42), mats["Bench_Red"], col, rot_z=rot_z)
    create_box(f"{name}_Back", (0.08, 1.65, 0.42), (loc[0] + 0.20 * math.cos(rot_z), loc[1] + 0.20 * math.sin(rot_z), loc[2] + 0.65), mats["Bench_Red"], col, rot_z=rot_z)
    for off in [-0.62, 0.62]:
        lx = loc[0] - off * math.sin(rot_z)
        ly = loc[1] + off * math.cos(rot_z)
        create_box(f"{name}_Leg_{off}", (0.42, 0.12, 0.40), (lx, ly, loc[2] + 0.20), mats["Bench_Red"], col, rot_z=rot_z)


def create_courtyard_lamp(name, loc, arm_dir_x, mats, col):
    """Cột đèn cao áp LED chiếu sáng sân trường"""
    create_box(f"{name}_Base", (0.36, 0.36, 0.35), (loc[0], loc[1], 0.175), mats["Trim_White"], col)
    create_cylinder(f"{name}_Pole", radius=0.065, depth=5.6, loc=(loc[0], loc[1], 2.95), mat=mats["Railing_Silver"], col=col, segs=10)
    create_box(f"{name}_Arm", (0.95, 0.06, 0.06), (loc[0] + arm_dir_x * 0.45, loc[1], 5.72), mats["Railing_Silver"], col)
    create_box(f"{name}_LampHead", (0.42, 0.22, 0.09), (loc[0] + arm_dir_x * 0.88, loc[1], 5.68), mats["Light_Glow"], col)


def create_parked_bicycle(name, loc, mats, col):
    """Xe đạp học sinh xếp gọn trong nhà để xe C3"""
    for wy in [-0.48, 0.48]:
        create_cylinder(f"{name}_Wheel_{wy}", radius=0.30, depth=0.05, loc=(loc[0], loc[1] + wy, 0.30), mat=mats["Window_Dark"], col=col, segs=10, rot_euler=(0.0, math.radians(90), 0.0))
    create_box(f"{name}_Frame", (0.05, 0.92, 0.38), (loc[0], loc[1], 0.52), mats["Gate_Iron_Blue"], col)
    create_box(f"{name}_Handlebar", (0.48, 0.05, 0.05), (loc[0], loc[1] - 0.38, 0.88), mats["Railing_Silver"], col)


def create_ac_condenser(name, loc, mats, col):
    create_box(f"{name}_Body", (0.35, 0.75, 0.55), loc, mats["AC_White"], col)
    create_cylinder(f"{name}_Fan", radius=0.20, depth=0.05, loc=(loc[0] + 0.18, loc[1], loc[2]), mat=mats["Window_Dark"], col=col, segs=10, rot_euler=(0.0, math.radians(90), 0.0))


def create_downspout(name, loc, height, mats, col):
    create_cylinder(name, radius=0.055, depth=height, loc=(loc[0], loc[1], loc[2] + height / 2.0), mat=mats["Metal_Pipe_White"], col=col, segs=8)


def create_bulletin_board(name, loc, mats, col):
    create_box(f"{name}_Post_L", (0.08, 0.08, 2.2), (loc[0], loc[1] - 1.2, 1.1), mats["Railing_Silver"], col)
    create_box(f"{name}_Post_R", (0.08, 0.08, 2.2), (loc[0], loc[1] + 1.2, 1.1), mats["Railing_Silver"], col)
    create_box(f"{name}_Case", (0.16, 2.3, 1.15), (loc[0], loc[1], 1.45), mats["Banner_Blue"], col)
    create_box(f"{name}_Canopy", (0.50, 2.6, 0.10), (loc[0], loc[1], 2.12), mats["Roof_RedTile"], col)


def create_ornamental_conifer_potted(name, loc, mats, col):
    create_cylinder(f"{name}_Pot", radius=0.35, depth=0.45, loc=(loc[0], loc[1], loc[2] + 0.225), mat=mats["Pot_Ceramic"], col=col, segs=10)
    create_cone(f"{name}_Foliage", radius=0.48, depth=1.55, loc=(loc[0], loc[1], loc[2] + 1.20), mat=mats["Plant_DarkGreen"], col=col, segs=10)


def create_chrysanthemum_box(name, loc, mats, col):
    create_box(f"{name}_Box", (1.20, 0.35, 0.25), (loc[0], loc[1], loc[2] + 0.125), mats["Trim_White"], col)
    create_box(f"{name}_Flower", (1.22, 0.38, 0.18), (loc[0], loc[1], loc[2] + 0.34), mats["Flower_Yellow"], col)


def create_low_shrub_row(name, center_xy, length_y, count, mats, col):
    """Hàng cây cảnh bụi thấp cắt tỉa gọn trong bồn hoa (không che khuất tầm nhìn sân)"""
    step = length_y / max(1, count)
    start_y = center_xy[1] - (length_y / 2.0) + (step / 2.0)
    for i in range(count):
        sy = start_y + i * step
        create_sphere(f"{name}_Shrub_{i}", radius=0.38, loc=(center_xy[0], sy, 0.52), mat=mats["Plant_DarkGreen"], col=col, segs=8, rings=6)
        if i % 2 == 0:
            create_sphere(f"{name}_Bloom_{i}", radius=0.16, loc=(center_xy[0], sy, 0.85), mat=mats["Flower_Yellow"], col=col, segs=6, rings=4)


# ------------------------------------------------------------------------------
# 6. EAST WING (TÒA NHÀ A - 3 TẦNG PHÒNG HỌC CHÍNH, CHUẨN GOOGLE MAPS 52.0M)
# ------------------------------------------------------------------------------
def build_east_wing_3f(mats, parent_col):
    col = sub_col("BLD_A_EastWing_3F", parent_col)

    pos_x = 18.55
    pos_y = -6.20
    total_len = 52.0
    bld_depth = 8.6
    corridor_w = 2.25

    f1_h, f2_h, f3_h = 3.8, 3.5, 3.5
    total_h = f1_h + f2_h + f3_h  # 10.8m
    floor_elevations = [0.0, f1_h, f1_h + f2_h]
    floor_heights = [f1_h, f2_h, f3_h]

    front_col_x = pos_x - (bld_depth / 2.0)   # 14.25m
    rear_wall_x = pos_x + (bld_depth / 2.0)   # 22.85m
    inner_wall_x = front_col_x + corridor_w   # 16.50m
    portal_y = -5.50  # Vị trí sảnh chính khớp bóng bậc tam cấp trên Google Maps & Frame 020

    for fl_idx, el_z in enumerate(floor_elevations):
        create_box(f"BLD_A_Slab_F{fl_idx+1}", (bld_depth + 0.3, total_len + 0.3, 0.30), (pos_x - 0.15, pos_y, el_z + 0.15), mats["Trim_White"], col)
        for ly in [-24.0, -15.0, -5.5, 4.0, 13.0]:
            create_box(f"BLD_A_Light_F{fl_idx+1}_Y{int(ly)}", (0.20, 1.20, 0.08), (inner_wall_x - 1.1, ly, el_z + floor_heights[fl_idx] - 0.04), mats["Light_Glow"], col)

    create_box("BLD_A_Roof_Eave_Slab", (bld_depth + 0.8, total_len + 0.6, 0.35), (pos_x - 0.2, pos_y, total_h + 0.175), mats["Trim_White"], col)

    # Exterior Walls
    create_box("BLD_A_RearWall", (0.30, total_len, total_h), (rear_wall_x - 0.15, pos_y, total_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_A_EndWall_North", (bld_depth, 0.30, total_h), (pos_x, pos_y + total_len / 2.0 - 0.15, total_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_A_EndWall_South", (bld_depth, 0.30, total_h), (pos_x, pos_y - total_len / 2.0 + 0.15, total_h / 2.0), mats["Wall_Yellow"], col)

    # Small stairwell windows on North Gable wall (matching Frame 005 top-right!)
    for fl_z in [2.2, 5.7, 9.2]:
        for wx in [15.5, 17.5]:
            create_box(f"BLD_A_NorthGableWin_{wx}_{fl_z}", (0.85, 0.35, 0.85), (wx, pos_y + total_len / 2.0 - 0.12, fl_z), mats["Window_Dark"], col)

    # Outdoor A/C Condensers & PVC Downspouts
    for ac_y in [-24.0, -15.0, -5.0, 5.0, 14.0]:
        for ac_z in [2.4, 5.9, 9.4]:
            create_ac_condenser(f"BLD_A_AC_Y{int(ac_y)}_Z{int(ac_z)}", (rear_wall_x + 0.20, ac_y, ac_z), mats, col)

    create_downspout("BLD_A_Downspout_SW", (front_col_x - 0.10, pos_y - total_len / 2.0 + 0.25, 0.0), total_h, mats, col)
    create_downspout("BLD_A_Downspout_NW", (front_col_x - 0.10, pos_y + total_len / 2.0 - 0.25, 0.0), total_h, mats, col)

    # 10 Classroom Bays + Corridor Columns & Inox Railings
    bay_y_centers = [-27.5, -23.0, -18.5, -14.0, -9.8, -1.2, 3.3, 7.8, 12.3, 16.8]
    col_y_coords = [-32.0, -29.75, -25.25, -20.75, -16.25, -11.75, -8.25, -2.75, 1.0, 5.55, 10.05, 14.55, 19.6]

    for fl_idx, el_z in enumerate(floor_elevations):
        fl_h = floor_heights[fl_idx]
        for by in bay_y_centers:
            create_box(f"BLD_A_Wall_F{fl_idx+1}_Y{int(by)}", (0.25, 4.25, fl_h - 0.30), (inner_wall_x, by, el_z + 0.30 + (fl_h - 0.30) / 2.0), mats["Wall_Inner"], col)
            create_detailed_window_ew(f"BLD_A_Win_F{fl_idx+1}_Y{int(by)}", (inner_wall_x, by - 0.45, el_z + 1.95), mats, col)
            create_detailed_door(f"BLD_A_Door_F{fl_idx+1}_Y{int(by)}", (inner_wall_x, by + 1.30, el_z + 1.45), mats, col)
            if fl_idx == 0:
                create_classroom_interior(f"ROOM_A_F1_Y{int(by)}", (inner_wall_x + 3.0, by, el_z + 0.30), mats, col)

        for cy in col_y_coords:
            create_box(f"BLD_A_Col_F{fl_idx+1}_Y{int(cy)}", (0.45, 0.45, fl_h - 0.30), (front_col_x + 0.225, cy, el_z + 0.30 + (fl_h - 0.30) / 2.0), mats["Wall_Yellow"], col)

        for i in range(len(col_y_coords) - 1):
            y1, y2 = col_y_coords[i], col_y_coords[i + 1]
            # Mở lối đi sảnh chính ở tầng 1
            if fl_idx == 0 and (abs((y1 + y2) / 2.0 - portal_y) < 3.2):
                continue
            seg_len = abs(y2 - y1) - 0.45
            if seg_len <= 0.3:
                continue
            seg_mid = (y1 + y2) / 2.0
            create_box(f"BLD_A_RailTop_F{fl_idx+1}_{i}", (0.06, seg_len, 0.06), (front_col_x + 0.12, seg_mid, el_z + 1.32), mats["Railing_Silver"], col)
            create_box(f"BLD_A_RailBot_F{fl_idx+1}_{i}", (0.05, seg_len, 0.05), (front_col_x + 0.12, seg_mid, el_z + 0.45), mats["Railing_Silver"], col)
            num_sp = max(2, int(seg_len / 0.40))
            for sp in range(num_sp):
                sp_y = (seg_mid - seg_len / 2.0) + (sp + 0.5) * (seg_len / num_sp)
                create_cylinder(f"BLD_A_Spindle_F{fl_idx+1}_{i}_{sp}", radius=0.015, depth=0.85, loc=(front_col_x + 0.12, sp_y, el_z + 0.88), mat=mats["Railing_Silver"], col=col, segs=6)

    # Central Entrance Canopy & Slogan Banners (Matching Frame 020)
    portal_w = 9.2
    portal_ext = 2.2
    canopy_front_x = front_col_x - portal_ext
    for py_off in [-portal_w / 2.0 + 0.4, portal_w / 2.0 - 0.4]:
        create_box(f"BLD_A_EntranceCol_{py_off}", (0.55, 0.55, f1_h), (canopy_front_x + 0.3, portal_y + py_off, f1_h / 2.0), mats["Accent_Apricot"], col)
        create_box(f"BLD_A_VertBanner_{py_off}", (0.06, 0.58, 2.8), (canopy_front_x - 0.02, portal_y + py_off, 2.1), mats["Banner_Red"], col)

    create_box("BLD_A_Entrance_Canopy", (portal_ext + 0.6, portal_w + 0.8, 0.32), (front_col_x - portal_ext / 2.0, portal_y, f1_h + 0.05), mats["Trim_White"], col)
    create_box("BLD_A_Entrance_Slogan", (0.10, portal_w + 0.5, 0.72), (canopy_front_x - 0.32, portal_y, f1_h + 0.38), mats["Sign_Bld_A_Main"], col, uv_fit=True)
    create_box("BLD_A_Upper_Slogan", (0.10, 14.5, 0.68), (front_col_x - 0.06, portal_y, f1_h + f2_h + 0.25), mats["Sign_Bld_A_Sub"], col, uv_fit=True)

    for s in range(5):
        st_w = portal_w + 0.8 + s * 0.25
        st_d = (5 - s) * 0.34
        create_box(f"BLD_A_Step_{s+1}", (st_d, st_w, 0.15), (canopy_front_x - st_d / 2.0, portal_y, s * 0.15 + 0.075), mats["Trim_White"], col)

    # North-East Corner Connector linking Bld A North End (Y=19.8) to Bld B (Y=25.25) (Frame 005 top-right)
    conn_y_mid = (19.8 + 25.25) / 2.0
    conn_len = 25.25 - 19.8
    create_box("BLD_AB_Corner_Body", (4.4, conn_len, 7.3), (16.45, conn_y_mid, 3.65), mats["Wall_Yellow"], col)
    create_box("BLD_AB_Corner_Slab2", (4.6, conn_len + 0.2, 0.28), (16.45, conn_y_mid, 3.85), mats["Trim_White"], col)
    create_box("BLD_AB_Corner_Roof", (4.8, conn_len + 0.4, 0.35), (16.45, conn_y_mid, 7.35), mats["Roof_RedTile"], col)
    for s in range(4):
        st_d = (4 - s) * 0.32
        create_box(f"BLD_AB_CornerStep_{s}", (st_d, 3.4, 0.15), (14.25 - st_d / 2.0, 21.8, s * 0.15 + 0.075), mats["Trim_White"], col)

    # Hipped Roof
    create_hipped_roof_with_ridges("BLD_A_Roof", base_w=bld_depth, base_l=total_len, roof_h=2.85, overhang=0.85, loc=(pos_x, pos_y, total_h), mats=mats, col=col)

    # Foot Planters (2 segments flanking entrance), Stone Benches, Recycling Bins & Bulletin Board
    planter_x = front_col_x - 0.85
    # South planter segment
    create_box("BLD_A_Planter_South_Curb", (1.35, 20.5, 0.32), (planter_x, -21.2, 0.16), mats["Trim_White"], col)
    create_box("BLD_A_Planter_South_Green", (1.10, 20.2, 0.34), (planter_x, -21.2, 0.17), mats["Plant_Green"], col)
    create_low_shrub_row("BLD_A_Shrub_S", (planter_x, -21.2), 19.0, 10, mats, col)

    # North planter segment
    create_box("BLD_A_Planter_North_Curb", (1.35, 19.5, 0.32), (planter_x, 9.8, 0.16), mats["Trim_White"], col)
    create_box("BLD_A_Planter_North_Green", (1.10, 19.2, 0.34), (planter_x, 9.8, 0.17), mats["Plant_Green"], col)
    create_low_shrub_row("BLD_A_Shrub_N", (planter_x, 9.8), 18.0, 9, mats, col)

    for b_idx, by in enumerate([-28.0, -23.0, -18.0, -13.5, 2.5, 7.5, 12.5, 17.0]):
        create_stone_bench(f"PROP_Bench_A_{b_idx+1}", (planter_x - 1.05, by, 0.0), mats, col)

    # Dual recycling bins seen next to corner steps in Frame 005
    create_box("PROP_RecycleBin_1", (0.42, 0.42, 0.72), (12.8, 19.5, 0.36), mats["Bin_Orange"], col)
    create_box("PROP_RecycleBin_2", (0.42, 0.42, 0.72), (12.8, 18.9, 0.36), mats["Bin_Green"], col)
    create_bulletin_board("PROP_BulletinBoard", (planter_x - 0.85, -11.5, 0.0), mats, col)

    # 1-Story Light-Mint Roofed Rear Annex attached behind Building A (Google Maps & Frame 025)
    create_box("BLD_A_RearAnnex_Body", (6.2, 15.5, 3.8), (26.0, -2.0, 1.9), mats["Wall_White"], col)
    create_hipped_roof_with_ridges("BLD_A_RearAnnex_Roof", base_w=6.2, base_l=15.5, roof_h=1.4, overhang=0.55, loc=(26.0, -2.0, 3.8), mats=mats, col=col, roof_mat_key="Roof_LightMint")


# ------------------------------------------------------------------------------
# 7. NORTH WING (TÒA NHÀ B - 2 TẦNG & SÂN KHẤU LỄ ĐÀI CHUẨN ẢNH THỰC TẾ SỐ 2)
# ------------------------------------------------------------------------------
def build_north_wing_2f(mats, parent_col):
    col = sub_col("BLD_B_NorthWing_2F", parent_col)

    pos_x = 2.40
    pos_y = 29.35
    total_len = 31.6
    bld_depth = 8.2
    corridor_w = 2.2

    f1_h, f2_h = 3.8, 3.5
    total_h = f1_h + f2_h  # 7.3m
    floor_elevations = [0.0, f1_h]
    floor_heights = [f1_h, f2_h]

    front_col_y = pos_y - (bld_depth / 2.0)  # 25.25m
    rear_wall_y = pos_y + (bld_depth / 2.0)  # 33.45m
    inner_wall_y = front_col_y + corridor_w  # 27.45m

    create_box("BLD_B_Slab_F1", (total_len + 0.3, bld_depth + 0.3, 0.30), (pos_x, pos_y - 0.15, 0.15), mats["Trim_White"], col)
    create_box("BLD_B_Slab_F2", (total_len + 0.3, bld_depth + 0.3, 0.30), (pos_x, pos_y - 0.15, f1_h + 0.15), mats["Trim_White"], col)
    create_box("BLD_B_Roof_Eave_Slab", (total_len + 0.6, bld_depth + 0.6, 0.35), (pos_x, pos_y - 0.15, total_h + 0.175), mats["Trim_White"], col)

    create_box("BLD_B_RearWall", (total_len, 0.30, total_h), (pos_x, rear_wall_y - 0.15, total_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_B_Gable_West", (0.30, bld_depth, total_h), (pos_x - total_len / 2.0 + 0.15, pos_y, total_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_B_Gable_East", (0.30, bld_depth, total_h), (pos_x + total_len / 2.0 - 0.15, pos_y, total_h / 2.0), mats["Wall_Yellow"], col)

    col_x_coords = [-13.2, -9.0, -4.8, 7.6, 11.8, 16.0]
    for fl_idx, el_z in enumerate(floor_elevations):
        fl_h = floor_heights[fl_idx]
        for cx in [-11.1, -6.9, 9.7, 13.9]:
            create_box(f"BLD_B_Wall_F{fl_idx+1}_X{int(cx)}", (4.0, 0.25, fl_h - 0.30), (cx, inner_wall_y, el_z + 0.30 + (fl_h - 0.30) / 2.0), mats["Wall_Inner"], col)
            create_detailed_window_ns(f"BLD_B_Win_F{fl_idx+1}_X{int(cx)}", (cx, inner_wall_y, el_z + 1.95), mats, col)

        for cx in col_x_coords:
            create_box(f"BLD_B_Col_F{fl_idx+1}_X{int(cx)}", (0.45, 0.45, fl_h - 0.30), (cx, front_col_y + 0.225, el_z + 0.30 + (fl_h - 0.30) / 2.0), mats["Wall_Yellow"], col)
            # Phào chỉ đầu cột chữ T màu trắng đặc trưng trong Ảnh 2
            create_box(f"BLD_B_ColCapH_F{fl_idx+1}_X{int(cx)}", (0.95, 0.50, 0.12), (cx, front_col_y + 0.225, el_z + fl_h - 0.22), mats["Trim_White"], col)
            create_box(f"BLD_B_ColCapV_F{fl_idx+1}_X{int(cx)}", (0.14, 0.52, 0.55), (cx, front_col_y + 0.225, el_z + fl_h - 0.45), mats["Trim_White"], col)

        for i in range(len(col_x_coords) - 1):
            x1, x2 = col_x_coords[i], col_x_coords[i + 1]
            if x1 < 1.4 and x2 > 1.4:
                continue
            seg_len = abs(x2 - x1) - 0.45
            seg_mid = (x1 + x2) / 2.0
            if fl_idx == 0:
                # Lan can con tiện bê tông trắng tầng 1 (Ảnh 2)
                create_box(f"BLD_B_RailTop_F1_{i}", (seg_len, 0.18, 0.08), (seg_mid, front_col_y + 0.12, el_z + 1.15), mats["Trim_White"], col)
                create_box(f"BLD_B_RailBot_F1_{i}", (seg_len, 0.18, 0.08), (seg_mid, front_col_y + 0.12, el_z + 0.35), mats["Trim_White"], col)
                num_bal = int(seg_len / 0.30)
                for bl in range(num_bal):
                    bl_x = (seg_mid - seg_len / 2.0) + (bl + 0.5) * (seg_len / num_bal)
                    create_cylinder(f"BLD_B_Bal_{i}_{bl}", radius=0.055, depth=0.72, loc=(bl_x, front_col_y + 0.12, el_z + 0.75), mat=mats["Baluster_White"], col=col, segs=8)
            else:
                # Lan can song sắt dọc tầng 2 (Ảnh 2)
                create_box(f"BLD_B_RailTop_F2_{i}", (seg_len, 0.08, 0.06), (seg_mid, front_col_y + 0.12, el_z + 1.25), mats["Bench_Red"], col)
                create_box(f"BLD_B_RailBot_F2_{i}", (seg_len, 0.08, 0.06), (seg_mid, front_col_y + 0.12, el_z + 0.40), mats["Bench_Red"], col)
                num_sp = int(seg_len / 0.28)
                for sp in range(num_sp):
                    sp_x = (seg_mid - seg_len / 2.0) + (sp + 0.5) * (seg_len / num_sp)
                    create_cylinder(f"BLD_B_Spindle_F2_{i}_{sp}", radius=0.015, depth=0.82, loc=(sp_x, front_col_y + 0.12, el_z + 0.82), mat=mats["Railing_Silver"], col=col, segs=6)

    # SÂN KHẤU LỄ ĐÀI CHÍNH DIỆN (Chuẩn 100% Ảnh 2: Bậc tam cấp 7 bậc gạch đỏ 3 phía)
    stage_x = 1.40
    stage_w = 8.8
    stage_d = 4.8
    stage_h = 0.84  # 7 bậc x 0.12m
    stage_y = front_col_y - (stage_d / 2.0)  # 22.85m

    create_box("BLD_B_Stage_Platform", (stage_w, stage_d, stage_h), (stage_x, stage_y, stage_h / 2.0), mats["Stage_Terracotta"], col)
    create_box("BLD_B_Stage_TileTop", (stage_w - 0.1, stage_d - 0.1, 0.03), (stage_x, stage_y, stage_h + 0.015), mats["Wall_White"], col)

    # 7 Bậc tam cấp gạch đỏ có mạch vữa mở rộng ra cả 3 mặt (Trước + Trái + Phải) chuẩn Ảnh 2
    num_steps = 7
    step_d = 0.28
    step_h = stage_h / num_steps
    for s in range(num_steps):
        out_n = num_steps - s
        cur_w = stage_w + 2.0 * out_n * step_d
        cur_d = stage_d + out_n * step_d
        cur_y = front_col_y - cur_d / 2.0
        cur_z = (s + 0.5) * step_h
        create_box(f"BLD_B_StageStep_{s+1}", (cur_w, cur_d, step_h), (stage_x, cur_y, cur_z), mats["Stage_Terracotta"], col, uv_tile=1.4)

    # 2 Chậu cảnh chữ nhật cổ màu xanh lam hoa văn vàng đặt ở 2 góc chân bậc tam cấp (Ảnh 2)
    step_front_y = front_col_y - stage_d - num_steps * step_d
    for side_sign, px_off in [("L", -stage_w / 2.0 - 2.2), ("R", stage_w / 2.0 + 2.2)]:
        cx_p = stage_x + px_off
        cy_p = step_front_y + 0.45
        create_box(f"PROP_OrnateBluePlanter_{side_sign}", (1.15, 0.72, 0.62), (cx_p, cy_p, 0.31), mats["Pot_BlueOrnate"], col, uv_fit=True)
        create_box(f"PROP_OrnatePlanterGoldRim_{side_sign}", (1.20, 0.76, 0.06), (cx_p, cy_p, 0.60), mats["Flag_GoldStar"], col)
        # Bonsai nhiều tán nghệ thuật trong chậu gốm xanh
        create_cylinder(f"PROP_OrnateBonsaiTrunk_{side_sign}", radius=0.06, depth=0.45, loc=(cx_p, cy_p, 0.78), mat=mats["Bark_Wood"], col=col, segs=8)
        for pad_i, (ox, oy, oz, rad) in enumerate([(-0.22, 0.0, 0.98, 0.34), (0.22, 0.05, 1.05, 0.32), (0.0, -0.05, 1.24, 0.36)]):
            create_sphere(f"PROP_OrnateBonsaiPad_{side_sign}_{pad_i}", radius=rad, loc=(cx_p + ox, cy_p + oy, oz), mat=mats["Plant_DarkGreen"], col=col, segs=12, rings=8, scale_z=0.55)

    # Hàng cây tùng bách tán 4 tầng tán lá chi tiết hai bên hành lang sân khấu (Ảnh 2)
    for tx in [-7.8, -5.8, 8.6, 10.6]:
        create_cylinder(f"PROP_AraucariaTrunk_{tx}", radius=0.08, depth=2.5, loc=(stage_x + tx, front_col_y - 0.95, 1.25), mat=mats["Bark_Wood"], col=col, segs=8)
        for tier_i, (t_z, t_r, t_h) in enumerate([(0.95, 0.72, 0.85), (1.45, 0.58, 0.80), (1.92, 0.44, 0.75), (2.35, 0.30, 0.68)]):
            create_cone(f"PROP_Araucaria_{tx}_T{tier_i}", radius=t_r, depth=t_h, loc=(stage_x + tx, front_col_y - 0.95, t_z), mat=mats["Plant_DarkGreen"], col=col, segs=14)

    # 2 Cột tròn vàng kem có chân đế vuông & cổ cột đỡ mái bằng lễ đài (Ảnh 2)
    canopy_d = stage_d + 0.5
    col_y = front_col_y - canopy_d + 0.55
    for side_s, cx_off in [("L", -stage_w / 2.0 + 0.55), ("R", stage_w / 2.0 - 0.55)]:
        col_x = stage_x + cx_off
        create_box(f"BLD_B_StageColBase_{side_s}", (0.58, 0.58, 0.42), (col_x, col_y, stage_h + 0.21), mats["Wall_Yellow"], col)
        create_box(f"BLD_B_StageColBaseTrim_{side_s}", (0.64, 0.64, 0.08), (col_x, col_y, stage_h + 0.44), mats["Trim_White"], col)
        create_cylinder(f"BLD_B_StageColShaft_{side_s}", radius=0.22, depth=f1_h - stage_h - 0.45, loc=(col_x, col_y, (f1_h + stage_h + 0.42) / 2.0), mat=mats["Wall_Yellow"], col=col, segs=16)
        create_cylinder(f"BLD_B_StageColCap_{side_s}", radius=0.30, depth=0.14, loc=(col_x, col_y, f1_h - 0.12), mat=mats["Accent_Apricot"], col=col, segs=16)

    # Mái che lễ đài phẳng + 2 đèn ốp trần tròn + Bảng chữ thật "QUẢN LÝ TỐT - DẠY TỐT - HỌC TỐT"
    canopy_w = stage_w + 1.2
    create_box("BLD_B_Stage_Canopy_Slab", (canopy_w, canopy_d, 0.36), (stage_x, front_col_y - canopy_d / 2.0 + 0.15, f1_h + 0.05), mats["Trim_White"], col)
    create_box("BLD_B_Stage_Slogan_Red", (canopy_w + 0.08, 0.12, 0.54), (stage_x, front_col_y - canopy_d + 0.11, f1_h + 0.08), mats["Sign_Stage"], col, uv_fit=True)
    for lx_off in [-2.2, 2.2]:
        create_cylinder(f"BLD_B_CanopyLight_{lx_off}", radius=0.18, depth=0.06, loc=(stage_x + lx_off, front_col_y - canopy_d / 2.0, f1_h - 0.14), mat=mats["Light_Glow"], col=col, segs=12)

    # Cột cờ Tổ quốc chính giữa + 6 Cờ hồng kỳ cắm nghiêng trên mái che (Ảnh 2)
    flagpole_h = 4.4
    canopy_front_y = front_col_y - canopy_d + 0.20
    create_cylinder("BLD_B_Flagpole", radius=0.04, depth=flagpole_h, loc=(stage_x, canopy_front_y, f1_h + flagpole_h / 2.0), mat=mats["Railing_Silver"], col=col, segs=8)
    create_box("BLD_B_Flag_Red", (1.35, 0.02, 0.90), (stage_x + 0.68, canopy_front_y, f1_h + flagpole_h - 0.5), mats["Banner_Red"], col)
    create_box("BLD_B_Flag_Star", (0.34, 0.04, 0.34), (stage_x + 0.68, canopy_front_y, f1_h + flagpole_h - 0.5), mats["Flag_GoldStar"], col)

    for flag_i, flag_x in enumerate([-4.2, -2.6, -1.2, 1.2, 2.6, 4.2]):
        create_cylinder(f"BLD_B_CanopyFlagPole_{flag_i}", radius=0.02, depth=1.35, loc=(stage_x + flag_x, canopy_front_y - 0.1, f1_h + 0.65), mat=mats["Railing_Silver"], col=col, segs=6, rot_euler=(math.radians(18), 0.0, 0.0))
        create_box(f"BLD_B_CanopyFlag_{flag_i}", (0.38, 0.02, 0.62), (stage_x + flag_x + 0.18, canopy_front_y - 0.22, f1_h + 0.95), mats["Banner_Red"], col)

    # 2 Loa phóng thanh hình phễu tròn màu trắng gắn trên cột tầng 2 (Ảnh 2)
    for spk_s, sx_off in [("L", -3.8), ("R", 3.8)]:
        create_cone(f"PROP_HornSpeaker_{spk_s}", radius=0.22, depth=0.32, loc=(stage_x + sx_off, front_col_y - 0.15, f1_h + 2.55), mat=mats["Trim_White"], col=col, segs=12)

    # Tầng 1 phía sau sân khấu: Cầu thang có cửa xếp sắt xanh (Trái) & Cửa phòng 2 cánh trắng (Phải) (Ảnh 2)
    create_box("BLD_B_CenterRearWall_F1", (stage_w + 2.0, 0.25, f1_h - 0.30), (stage_x, inner_wall_y, 0.30 + (f1_h - 0.30) / 2.0), mats["Wall_Inner"], col)
    # Ô cầu thang bên trái + cửa xếp sắt xanh
    create_box("BLD_B_StairOpening_Dark", (2.6, 0.28, 2.7), (stage_x - 1.6, inner_wall_y - 0.02, 1.65), mats["Window_Dark"], col)
    create_box("BLD_B_FoldingGate_Green", (1.25, 0.30, 2.55), (stage_x - 2.25, inner_wall_y - 0.04, 1.58), mats["Gate_GreenFold"], col)
    # Cửa đi 2 cánh trắng bên phải + bảng nội quy
    create_box("BLD_B_CenterDoor_Frame", (1.35, 0.28, 2.45), (stage_x + 1.85, inner_wall_y - 0.02, 1.52), mats["Trim_White"], col)
    create_box("BLD_B_CenterDoor_Glass", (1.10, 0.30, 1.05), (stage_x + 1.85, inner_wall_y - 0.02, 1.85), mats["Glass_Blue"], col)
    create_box("BLD_B_NoticeBoard_1", (0.55, 0.05, 0.72), (stage_x + 0.55, inner_wall_y - 0.14, 1.85), mats["Pano_Yellow"], col)
    create_box("BLD_B_NoticeBoard_2", (0.78, 0.05, 0.55), (stage_x + 3.05, inner_wall_y - 0.14, 1.85), mats["Trim_White"], col)

    # Tầng 2 phía trên lễ đài: Pano đôi ảnh thật Bác Hồ với thiếu nhi + Thư Bác Hồ nền vàng (Ảnh 2)
    pano_z = f1_h + 1.65
    create_box("BLD_B_Pano_GoldFrame", (4.5, 0.14, 2.15), (stage_x, front_col_y + 0.06, pano_z), mats["Sign_UncleHo_Pano"], col, uv_fit=True)

    # 2 Bảng khẩu hiệu nền xanh da trời chữ đỏ viền trắng trên diềm mái tầng 2 (Ảnh 2)
    create_box("BLD_B_Slogan_Blue_L", (8.2, 0.14, 0.48), (stage_x - 8.6, front_col_y - 0.04, total_h - 0.28), mats["Sign_Tree_L"], col, uv_fit=True)
    create_box("BLD_B_Slogan_Blue_R", (8.2, 0.14, 0.48), (stage_x + 8.6, front_col_y - 0.04, total_h - 0.28), mats["Sign_Tree_R"], col, uv_fit=True)

    create_hipped_roof_with_ridges("BLD_B_Roof", base_w=total_len, base_l=bld_depth, roof_h=2.55, overhang=0.85, loc=(pos_x, pos_y, total_h), mats=mats, col=col)


# ------------------------------------------------------------------------------
# 8. WEST WING (TÒA C2 CHUẨN ẢNH 1 & NHÀ ĐA NĂNG C1 CHUẨN ẢNH 3 + FRAME 025)
# ------------------------------------------------------------------------------
def build_west_wing_gym_and_annex(mats, parent_col):
    col = sub_col("BLD_C_WestWing_Gym", parent_col)

    # 8A. TÒA C2 (2 TẦNG, 8 NHỊP CỘT, BẬC ĐÁ ĐỎ & KHẨU HIỆU ĐỎ CHUẨN ẢNH THỰC TẾ SỐ 1!)
    annex_w = 8.2
    annex_l = 26.4
    f1_h, f2_h = 3.5, 3.3
    annex_h = f1_h + f2_h  # 6.8m
    annex_x = -28.00
    annex_y = 15.20
    front_x = annex_x + annex_w / 2.0       # -23.90m (Mặt tiền hành lang hướng Đông)
    inner_x = front_x - 2.05                # -25.95m (Tường trong hành lang)
    rear_x = annex_x - annex_w / 2.0        # -32.10m

    # Sàn tầng 1, tầng 2 & Mái bằng sê-nô vươn rộng như Ảnh 1
    create_box("BLD_C2_Slab_F1", (annex_w + 0.3, annex_l + 0.3, 0.28), (annex_x, annex_y, 0.14), mats["Trim_White"], col)
    create_box("BLD_C2_Slab_F2", (annex_w + 0.35, annex_l + 0.35, 0.32), (annex_x, annex_y, f1_h), mats["Wall_Yellow"], col)
    create_box("BLD_C2_RoofEave_Slab", (annex_w + 1.1, annex_l + 0.8, 0.32), (annex_x + 0.2, annex_y, annex_h + 0.12), mats["Trim_White"], col)

    # Tường hậu, tường hồi & tường trong hành lang
    create_box("BLD_C2_RearWall", (0.28, annex_l, annex_h), (rear_x + 0.14, annex_y, annex_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_C2_EndWall_N", (annex_w, 0.28, annex_h), (annex_x, annex_y + annex_l / 2.0 - 0.14, annex_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_C2_EndWall_S", (annex_w, 0.28, annex_h), (annex_x, annex_y - annex_l / 2.0 + 0.14, annex_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_C2_InnerWall", (0.25, annex_l - 0.4, annex_h), (inner_x, annex_y, annex_h / 2.0), mats["Wall_Yellow"], col)

    # 9 Cột vuông thông 2 tầng chia 8 nhịp chuẩn Ảnh 1
    bay_len = 3.20
    col_y_list = [annex_y + (i - 4) * bay_len for i in range(9)]
    for idx, cy in enumerate(col_y_list):
        create_box(f"BLD_C2_Col_{idx}", (0.42, 0.42, annex_h), (front_x - 0.21, cy, annex_h / 2.0), mats["Wall_Yellow"], col)

    # Cửa chính 4 cánh khung trắng ở nhịp giữa & các ô cửa sổ 4 cánh khung trắng (Ảnh 1)
    for b_idx in range(8):
        by = (col_y_list[b_idx] + col_y_list[b_idx + 1]) / 2.0
        # Lan can hành lang tầng 2 (tường lửng vàng + ống inox trên)
        create_box(f"BLD_C2_Parapet_F2_{b_idx}", (0.18, bay_len - 0.42, 0.72), (front_x - 0.15, by, f1_h + 0.48), mats["Wall_Yellow"], col)
        create_box(f"BLD_C2_RailInox_F2_{b_idx}", (0.05, bay_len - 0.42, 0.05), (front_x - 0.15, by, f1_h + 1.02), mats["Railing_Silver"], col)

        # Cửa sổ tầng 2 khung trắng 4 cánh
        if b_idx not in [6]:  # Nhịp 6 là ô cầu thang lên tầng 2
            create_box(f"BLD_C2_WinF2_Frame_{b_idx}", (0.28, 2.05, 1.45), (inner_x + 0.02, by, f1_h + 1.85), mats["Trim_White"], col)
            create_box(f"BLD_C2_WinF2_Glass_{b_idx}", (0.30, 1.85, 1.25), (inner_x + 0.02, by, f1_h + 1.85), mats["Glass_Blue"], col)
            for m_off in [-0.46, 0.0, 0.46]:
                create_box(f"BLD_C2_WinF2_Muntin_{b_idx}_{m_off}", (0.32, 0.05, 1.25), (inner_x + 0.02, by + m_off, f1_h + 1.85), mats["Trim_White"], col)
            create_box(f"BLD_C2_WinF2_Transom_{b_idx}", (0.32, 1.85, 0.05), (inner_x + 0.02, by, f1_h + 2.18), mats["Trim_White"], col)

        # Tầng 1: Nhịp giữa (b_idx == 3, 4) mở sảnh tam cấp, nhịp 3 là cửa chính 4 cánh khung trắng
        if b_idx == 3:
            create_box("BLD_C2_MainDoor_Frame", (0.28, 2.15, 2.45), (inner_x + 0.02, by, 1.50), mats["Trim_White"], col)
            create_box("BLD_C2_MainDoor_Glass", (0.30, 1.90, 2.20), (inner_x + 0.02, by, 1.50), mats["Glass_Blue"], col)
            create_box("BLD_C2_MainDoor_LowerPanel", (0.32, 1.90, 0.75), (inner_x + 0.02, by, 0.72), mats["Trim_White"], col)
            for m_off in [-0.48, 0.0, 0.48]:
                create_box(f"BLD_C2_MainDoor_Mullion_{m_off}", (0.33, 0.06, 2.20), (inner_x + 0.02, by + m_off, 1.50), mats["Trim_White"], col)
        elif b_idx == 6:
            # Cầu thang bộ ở nhịp thứ 2 từ phải sang (Ảnh 1)
            create_box("BLD_C2_StairWell_Dark", (0.30, 2.2, 2.6), (inner_x + 0.02, by, 1.55), mats["Window_Dark"], col)
        else:
            create_box(f"BLD_C2_WinF1_Frame_{b_idx}", (0.28, 2.05, 1.55), (inner_x + 0.02, by, 1.80), mats["Trim_White"], col)
            create_box(f"BLD_C2_WinF1_Glass_{b_idx}", (0.30, 1.85, 1.35), (inner_x + 0.02, by, 1.80), mats["Glass_Blue"], col)
            for m_off in [-0.46, 0.0, 0.46]:
                create_box(f"BLD_C2_WinF1_Muntin_{b_idx}_{m_off}", (0.32, 0.05, 1.35), (inner_x + 0.02, by + m_off, 1.80), mats["Trim_White"], col)
            create_box(f"BLD_C2_WinF1_Transom_{b_idx}", (0.32, 1.85, 0.05), (inner_x + 0.02, by, 2.15), mats["Trim_White"], col)
            create_classroom_interior(f"ROOM_C2_F1_{b_idx}", (inner_x - 3.0, by, 0.30), mats, col)

        # Lan can inox thấp tầng 1 (trừ 2 nhịp giữa mở bậc tam cấp)
        if b_idx not in [3, 4]:
            create_box(f"BLD_C2_RailF1_{b_idx}", (0.05, bay_len - 0.42, 0.05), (front_x - 0.15, by, 0.85), mats["Railing_Silver"], col)

    # Băng rôn đỏ chữ vàng thật giữa tầng 2 (Ảnh 1): "DÙ KHÓ KHĂN ĐẾN ĐÂU CŨNG PHẢI THI ĐUA DẠY TỐT, HỌC TỐT"
    create_box("BLD_C2_SloganBanner_Red", (0.12, 9.8, 0.58), (front_x + 0.06, annex_y - 0.8, f1_h + 0.25), mats["Sign_Bld_C2"], col, uv_fit=True)

    # Bậc tam cấp 5 bậc lát đá hoa cương đỏ hồng chính giữa Tòa C2 (Ảnh 1)
    for s in range(5):
        st_d = (5 - s) * 0.34
        st_w = 6.6 + s * 0.28
        create_box(f"BLD_C2_GraniteStep_{s+1}", (st_d, st_w, 0.14), (front_x + st_d / 2.0, annex_y - 0.8, s * 0.14 + 0.07), mats["Granite_PinkRed"], col)

    # Bồn hoa xây gạch thấp trồng cây cảnh chạy dọc hai bên tam cấp Tòa C2 (Ảnh 1)
    for seg_y, seg_l in [(annex_y - 8.4, 7.6), (annex_y + 6.8, 7.6)]:
        create_box(f"BLD_C2_FootPlanter_Curb_{seg_y}", (0.85, seg_l, 0.32), (front_x + 0.45, seg_y, 0.16), mats["Wall_Yellow"], col)
        create_box(f"BLD_C2_FootPlanter_Green_{seg_y}", (0.68, seg_l - 0.2, 0.35), (front_x + 0.45, seg_y, 0.18), mats["Plant_DarkGreen"], col)
        create_low_shrub_row(f"BLD_C2_Shrub_{seg_y}", (front_x + 0.45, seg_y), seg_l - 0.6, 6, mats, col)

    # Bồn nước Inox nằm ngang trên mái góc Bắc Tòa C2 (Ảnh 1 góc trên phải)
    create_cylinder("PROP_C2_WaterTank_Inox", radius=0.58, depth=2.1, loc=(front_x - 1.2, annex_y + annex_l / 2.0 - 2.2, annex_h + 0.85), mat=mats["Railing_Silver"], col=col, segs=14, rot_euler=(math.radians(90), 0.0, 0.0))

    create_hipped_roof_with_ridges("BLD_C2_Annex_Roof", base_w=annex_w, base_l=annex_l, roof_h=2.35, overhang=0.85, loc=(annex_x, annex_y, annex_h + 0.20), mats=mats, col=col)

    # Sân phụ sau Tòa C2 & Tường gạch phía Bắc nối thẳng hàng với lưng Tòa B (Y = 33.45m)
    create_box("BLD_C2_RearTerrace", (12.0, 5.5, 0.16), (-26.0, 30.8, -0.02), mats["Yard_Concrete"], col)
    create_wall_segment("ENV_North_BrickWall_Gap", (-32.1, 33.45), (-13.4, 33.45), 0.30, 2.1, 0.0, mats["Wall_Brick"], col)

    # Mái tôn phụ bên sườn Tây Tòa C2 & Mái vòm xanh dương nhỏ giữa C2 và Nhà Đa Năng (Frame 025)
    create_box("BLD_C2_WestShed_Roof", (3.8, 15.0, 0.16), (-34.1, 13.0, 3.1), mats["Roof_SlateGrey"], col)
    create_box("BLD_C_BlueCanopy", (4.2, 4.0, 0.16), (-21.5, 3.2, 3.0), mats["Roof_BlueCanopy"], col)

    # 8B. NHÀ ĐA NĂNG MỚI (BLD_C1_GYMNASIUM - XOAY NGANG ĐÔNG-TÂY CHUẨN FRAME 025 & MẶT ĐÔNG CHUẨN ẢNH 3!)
    gym_w = 25.0   # Chiều dài Đông-Tây
    gym_l = 14.2   # Chiều rộng Bắc-Nam
    gym_h = 7.4
    gym_x = -32.0  # Từ X = -44.5m đến X = -19.5m
    gym_y = -5.0   # Từ Y = -12.1m đến Y = +2.1m
    gym_south_y = gym_y - gym_l / 2.0  # -12.1m
    gym_east_x = gym_x + gym_w / 2.0   # -19.5m

    create_box("BLD_C1_Gym_MainBody", (gym_w, gym_l, gym_h), (gym_x, gym_y, gym_h / 2.0), mats["Wall_Yellow"], col)
    # Chân tường sơn vàng đậm (Ochre Base) chuẩn Ảnh 3!
    create_box("BLD_C1_Gym_BaseTrim", (gym_w + 0.25, gym_l + 0.25, 0.72), (gym_x, gym_y, 0.36), mats["Wall_OchreBase"], col)
    create_box("BLD_C1_Gym_MidBand", (gym_w + 0.32, gym_l + 0.32, 0.25), (gym_x, gym_y, 4.6), mats["Trim_White"], col)

    # Mặt Nam (South Facade): 5 Pilasters -> 4 Bays + 4 Clerestory Windows + Sảnh Nam 2 trụ
    for px_off in [-12.2, -6.1, 0.0, 6.1, 12.2]:
        create_box(f"BLD_C1_South_Pilaster_{px_off}", (0.55, 0.35, gym_h), (gym_x + px_off, gym_south_y - 0.08, gym_h / 2.0), mats["Trim_White"], col)

    for bx_off in [-9.15, -3.05, 3.05, 9.15]:
        create_box(f"BLD_C1_Clerestory_S_{bx_off}", (2.8, 0.28, 1.05), (gym_x + bx_off, gym_south_y - 0.06, 5.85), mats["Window_Dark"], col)
        create_box(f"BLD_C1_ClerestoryGlass_S_{bx_off}", (2.6, 0.30, 0.85), (gym_x + bx_off, gym_south_y - 0.06, 5.85), mats["Glass_Blue"], col)

    for bx_off in [-9.15, 9.15]:
        create_box(f"BLD_C1_LowWin_S_{bx_off}", (2.4, 0.28, 1.8), (gym_x + bx_off, gym_south_y - 0.06, 2.3), mats["Window_Dark"], col)
        create_box(f"BLD_C1_LowGlass_S_{bx_off}", (2.2, 0.30, 1.6), (gym_x + bx_off, gym_south_y - 0.06, 2.3), mats["Glass_Blue"], col)

    portico_w, portico_d = 9.2, 2.2
    for px_off in [-portico_w / 2.0 + 0.4, portico_w / 2.0 - 0.4]:
        create_box(f"BLD_C1_PorticoCol_{px_off}", (0.65, 0.65, 4.2), (gym_x + px_off, gym_south_y - portico_d + 0.35, 2.1), mats["Trim_White"], col)
    create_box("BLD_C1_PorticoSlab", (portico_w + 0.6, portico_d + 0.3, 0.38), (gym_x, gym_south_y - portico_d / 2.0, 4.35), mats["Trim_White"], col)
    for dx_off in [-2.6, 0.0, 2.6]:
        create_box(f"BLD_C1_SouthDoor_{dx_off}", (1.7, 0.28, 2.5), (gym_x + dx_off, gym_south_y - 0.05, 1.45), mats["Glass_Blue"], col)
    for s in range(3):
        st_d = (3 - s) * 0.35
        create_box(f"BLD_C1_PorticoStep_{s}", (portico_w + 0.4, st_d, 0.15), (gym_x, gym_south_y - portico_d - st_d / 2.0, s * 0.15 + 0.075), mats["Trim_White"], col)

    # MẶT ĐÔNG NHÀ ĐA NĂNG (QUAY RA KHU VUI CHƠI & SÂN TRƯỜNG - CHUẨN 100% ẢNH THỰC TẾ SỐ 3!)
    # 4 Pilaster trắng chia mặt Đông thành 3 nhịp
    for py_off in [-6.8, -2.5, 2.5, 6.8]:
        create_box(f"BLD_C1_East_Pilaster_{py_off}", (0.32, 0.48, gym_h), (gym_east_x + 0.06, gym_y + py_off, gym_h / 2.0), mats["Trim_White"], col)

    # Sảnh đón mặt Đông ốp đá Granite nâu vàng (2 cột vuông lớn + dầm ngang + tam cấp đá xám chuẩn Ảnh 3!)
    e_port_w = 4.8
    e_port_d = 1.65
    for py_off in [-e_port_w / 2.0 + 0.38, e_port_w / 2.0 - 0.38]:
        create_box(f"BLD_C1_EastPortico_Col_{py_off}", (0.62, 0.62, 3.8), (gym_east_x + e_port_d - 0.31, gym_y + py_off, 1.9), mats["Granite_Beige"], col)
    create_box("BLD_C1_EastPortico_Beam", (e_port_d + 0.15, e_port_w + 0.2, 0.68), (gym_east_x + e_port_d / 2.0, gym_y, 3.95), mats["Granite_Beige"], col)
    create_box("BLD_C1_EastPortico_Cap", (e_port_d + 0.30, e_port_w + 0.4, 0.14), (gym_east_x + e_port_d / 2.0, gym_y, 4.35), mats["Trim_White"], col)
    for s in range(3):
        st_d = (3 - s) * 0.32
        create_box(f"BLD_C1_EastStep_{s}", (st_d, e_port_w - 0.4, 0.14), (gym_east_x + e_port_d + st_d / 2.0, gym_y, s * 0.14 + 0.07), mats["Wall_GreyFence"], col)

    # Cửa đi mặt Đông + 2 cửa sổ ngang phía trên sảnh + Cửa sổ 3 cánh lớn ở 2 nhịp bên (Ảnh 3)
    create_box("BLD_C1_EastMainDoor", (0.28, 1.85, 2.65), (gym_east_x + 0.04, gym_y, 1.55), mats["Window_Dark"], col)
    for py_c in [-1.2, 1.2]:
        create_box(f"BLD_C1_EastMidHighWin_{py_c}", (0.28, 1.45, 0.82), (gym_east_x + 0.04, gym_y + py_c, 5.55), mats["Window_Dark"], col)

    for py_side in [-4.65, 4.65]:
        # Cửa sổ 3 cánh lớn dưới thấp có viền trắng bao quanh (Ảnh 3)
        create_box(f"BLD_C1_EastBigWinTrim_{py_side}", (0.26, 2.35, 2.25), (gym_east_x + 0.04, gym_y + py_side, 2.35), mats["Trim_White"], col)
        create_box(f"BLD_C1_EastBigWinDark_{py_side}", (0.30, 2.10, 2.00), (gym_east_x + 0.05, gym_y + py_side, 2.35), mats["Window_Dark"], col)
        # Cửa sổ chớp ngang trên cao sát diềm mái (Ảnh 3)
        create_box(f"BLD_C1_EastTopWin_{py_side}", (0.28, 2.15, 0.92), (gym_east_x + 0.04, gym_y + py_side, 5.85), mats["Window_Dark"], col)

    # Ghế đá & Ống thoát nước mưa PVC ở mặt Đông Nhà Đa Năng (Ảnh 3 góc phải)
    create_stone_bench("PROP_GymEast_Bench", (gym_east_x + 0.85, gym_y - 4.65, 0.0), mats, col, rot_z=math.radians(180))
    create_downspout("BLD_C1_East_Downspout", (gym_east_x + 0.18, gym_y - 6.95, 0.0), gym_h, mats, col)

    # East-West Crimson Gabled Roof with White Parapet Coping
    create_gabled_roof_east_west("BLD_C1_Gym_Roof", width_x=gym_w, length_y=gym_l, roof_h=2.9, overhang=0.65, loc=(gym_x, gym_y, gym_h), mats=mats, col=col)

    # 8C. SÂN TRƯỚC NHÀ ĐA NĂNG & NHÀ ĐỂ XE MÁI TÔN XANH (BLD_C3) KÈM XE ĐẠP HỌC SINH
    create_box("BLD_C1_FrontYard", (26.5, 9.8, 0.16), (-32.2, -17.0, -0.02), mats["Yard_Concrete"], col)
    create_wall_segment("ENV_GymFence_W", (-45.2, -12.1), (-45.2, -21.8), 0.25, 1.9, 0.0, mats["Wall_GreyFence"], col)
    create_wall_segment("ENV_GymFence_S", (-45.2, -21.8), (-19.2, -21.8), 0.25, 1.9, 0.0, mats["Wall_GreyFence"], col)

    shed_x, shed_y = -28.5, -18.6
    shed_w, shed_l = 15.5, 5.2
    create_box("BLD_C3_BikeShed_Roof", (shed_w, shed_l, 0.16), (shed_x, shed_y, 2.75), mats["Roof_GreenCanopy"], col)
    for px in [-6.8, 0.0, 6.8]:
        for py in [-2.1, 2.1]:
            create_cylinder(f"BLD_C3_Post_{px}_{py}", radius=0.07, depth=2.7, loc=(shed_x + px, shed_y + py, 1.35), mat=mats["Railing_Silver"], col=col, segs=8)

    for bx_i in range(8):
        create_parked_bicycle(f"PROP_Bicycle_{bx_i}", (shed_x - 5.6 + bx_i * 1.6, shed_y, 0.0), mats, col)


# ------------------------------------------------------------------------------
# 9. ADMIN BUILDING 3F (QUAY HƯỚNG NAM CHUẨN FRAME 025) & EAST FORMAL GARDEN
# ------------------------------------------------------------------------------
def build_admin_and_east_garden(mats, parent_col):
    col = sub_col("BLD_D_Admin_And_EastGarden", parent_col)

    # 9A. Tòa Hiệu Bộ 3 Tầng quay mặt tiền về hướng Nam (Frame 025 & 020 top-right)
    adm_w = 17.5   # Đông-Tây
    adm_l = 10.0   # Bắc-Nam
    adm_h = 10.2
    adm_x = 35.5
    adm_y = 25.5
    adm_south_y = adm_y - adm_l / 2.0  # 20.5m

    create_box("BLD_D_Body", (adm_w, adm_l, adm_h), (adm_x, adm_y, adm_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_D_FloorTrim_F2", (adm_w + 0.35, adm_l + 0.35, 0.25), (adm_x, adm_y, 3.5), mats["Trim_White"], col)
    create_box("BLD_D_FloorTrim_F3", (adm_w + 0.35, adm_l + 0.35, 0.25), (adm_x, adm_y, 6.9), mats["Trim_White"], col)
    create_box("BLD_D_EaveTrim", (adm_w + 0.50, adm_l + 0.50, 0.30), (adm_x, adm_y, adm_h), mats["Trim_White"], col)

    # South Entrance Canopy + Steps + 2 Large Red Wall Slogan Boards (Frame 025)
    create_box("BLD_D_PortalCanopy", (5.4, 2.2, 0.30), (adm_x, adm_south_y - 1.0, 3.6), mats["Trim_White"], col)
    create_box("BLD_D_PortalBanner", (5.2, 0.12, 0.62), (adm_x, adm_south_y - 2.1, 3.85), mats["Banner_Red"], col)
    for px_off in [-2.3, 2.3]:
        create_box(f"BLD_D_PortalCol_{px_off}", (0.45, 0.45, 3.5), (adm_x + px_off, adm_south_y - 1.8, 1.75), mats["Wall_Yellow"], col)
    for s in range(4):
        st_d = (4 - s) * 0.35
        create_box(f"BLD_D_Step_{s}", (5.6, st_d, 0.15), (adm_x, adm_south_y - 2.1 - st_d / 2.0, s * 0.15 + 0.075), mats["Trim_White"], col)

    # Two prominent red slogan boards flanking Floor 2 South Facade
    create_box("BLD_D_RedBoard_L", (3.2, 0.12, 1.9), (adm_x - 5.6, adm_south_y - 0.06, 5.2), mats["Banner_Red"], col)
    create_box("BLD_D_RedBoard_R", (3.2, 0.12, 1.9), (adm_x + 5.6, adm_south_y - 0.06, 5.2), mats["Banner_Red"], col)

    for wx in [-5.8, -2.0, 2.0, 5.8]:
        for wz in [1.9, 5.2, 8.6]:
            if wz == 5.2 and abs(wx) > 4.0:
                continue
            create_box(f"BLD_D_Win_{wx}_{wz}", (1.8, 0.28, 1.4), (adm_x + wx, adm_south_y - 0.05, wz), mats["Glass_Blue"], col)

    create_hipped_roof_with_ridges("BLD_D_Roof", base_w=adm_w, base_l=adm_l, roof_h=2.5, overhang=0.85, loc=(adm_x, adm_y, adm_h), mats=mats, col=col)

    # Auxiliary 1-Story Hall East of Admin Building (Frame 025 top-right)
    create_box("BLD_D2_AuxHall_Body", (13.5, 6.2, 3.8), (52.0, 22.5, 1.9), mats["Wall_Yellow"], col)
    create_hipped_roof_with_ridges("BLD_D2_AuxHall_Roof", base_w=13.5, base_l=6.2, roof_h=1.5, overhang=0.55, loc=(52.0, 22.5, 3.8), mats=mats, col=col, roof_mat_key="Roof_LightMint")
    create_box("BLD_D_SecondaryYard", (36.0, 22.0, 0.14), (44.0, 9.0, -0.05), mats["Yard_Concrete"], col)

    # 9B. Khu Vườn Cỏ Cảnh Quan Hình Tròn Đồng Tâm Bên Phải Tòa A (Khớp 100% Google Maps góc Đông-Nam!)
    g_x, g_y = 35.8, -18.5
    g_w, g_l = 19.5, 27.5
    create_box("ENV_EastGarden_Curb", (g_w + 0.5, g_l + 0.5, 0.24), (g_x, g_y, 0.12), mats["Trim_White"], col)
    create_box("ENV_EastGarden_Lawn", (g_w, g_l, 0.25), (g_x, g_y, 0.125), mats["Terrain_Grass"], col)

    # Concentric circular promenade & cross walkways visible in Google Maps & Frame 025
    ring_y = g_y - 2.5
    create_ring("ENV_EastGarden_OuterPath", inner_r=3.4, outer_r=4.4, height=0.28, loc=(g_x, ring_y, 0.0), mat=mats["Yard_Concrete"], col=col)
    create_cylinder("ENV_EastGarden_CenterBed", radius=2.2, depth=0.32, loc=(g_x, ring_y, 0.16), mat=mats["Plant_DarkGreen"], col=col, segs=20)
    create_box("ENV_EastGarden_Walk_NS", (1.2, g_l - 1.0, 0.27), (g_x, g_y, 0.135), mats["Yard_Concrete"], col)
    create_box("ENV_EastGarden_Walk_EW", (g_w - 1.0, 1.2, 0.27), (g_x, ring_y, 0.135), mats["Yard_Concrete"], col)


# ------------------------------------------------------------------------------
# 10. COURTYARD PAVEMENT, GOOGLE MAPS PLANTERS, HORIZONTAL GRASS PLOTS & LIGHTS
# ------------------------------------------------------------------------------
def build_courtyard_life(mats, parent_col):
    col = sub_col("ENV_Courtyard_Life", parent_col)

    # Exact Polygon Concrete Courtyard Slab hugging the SW Funnel Fence & Main Gate (Zero spillover!)
    yard_pts = [
        (4.6, -40.5),
        (14.8, -39.5),
        (18.8, -32.5),
        (18.8, 33.45),
        (-32.1, 33.45),
        (-32.1, 2.0),
        (-19.5, 2.0),
        (-19.5, -21.8),
        (-14.5, -24.0),
        (-1.8, -24.6),
    ]
    yard_mesh = bpy.data.meshes.new("ENV_Courtyard_Ground_Mesh")
    yard_obj = bpy.data.objects.new("ENV_Courtyard_Ground", yard_mesh)
    bm = bmesh.new()
    top_verts = [bm.verts.new((px, py, 0.0)) for (px, py) in yard_pts]
    top_face = bm.faces.new(top_verts)
    ret = bmesh.ops.extrude_face_region(bm, geom=[top_face])
    for ele in ret["geom"]:
        if isinstance(ele, bmesh.types.BMVert):
            ele.co.z -= 0.20
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.normal_update()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop in face.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (co.x / 4.2, co.y / 4.2)
    bm.to_mesh(yard_mesh)
    bm.free()
    yard_obj.data.materials.append(mats["Yard_Concrete"])
    col.objects.link(yard_obj)

    # 10A. HAI BỒN CÂY HẸP CHẠY DỌC BÊN TRÁI SÂN (Chuẩn tọa độ Google Maps: X = -15.75m)
    for idx, (px, py, pl) in enumerate([(-15.85, 20.0, 7.6), (-15.65, 7.0, 9.6)]):
        create_box(f"ENV_WestPlanter_{idx+1}_Curb", (2.4, pl + 0.4, 0.34), (px, py, 0.17), mats["Trim_White"], col)
        create_box(f"ENV_WestPlanter_{idx+1}_Soil", (2.0, pl, 0.35), (px, py, 0.175), mats["Plant_Green"], col)
        create_low_shrub_row(f"ENV_WestPlanter_{idx+1}", (px, py), pl - 1.0, 6, mats, col)

    # 10B. HAI Ô CỎ LỚN NẰM NGANG ĐÔNG-TÂY — KHU VUI CHƠI VẬN ĐỘNG NGOÀI TRỜI (Chuẩn Ảnh 3 & Google Maps!)
    # Ô cỏ ngang số 1 (Phía Bắc): 11.5m (Đông-Tây) x 4.6m (Bắc-Nam) tại (-7.2, -2.0)
    g1_x, g1_y, g1_w, g1_l = -7.2, -2.0, 11.5, 4.6
    create_box("ENV_GrassPlot_1_Curb", (g1_w + 0.5, g1_l + 0.5, 0.28), (g1_x, g1_y, 0.14), mats["Wall_Yellow"], col)
    create_box("ENV_GrassPlot_1_CurbTop", (g1_w + 0.54, g1_l + 0.54, 0.04), (g1_x, g1_y, 0.29), mats["Trim_White"], col)
    create_box("ENV_GrassPlot_1_Green", (g1_w, g1_l, 0.33), (g1_x, g1_y, 0.165), mats["Plant_Green"], col)

    # Viền cây bụi thấp quanh mép Ô cỏ 1 (Chuẩn Ảnh 3)
    for sx in [-12.0, -9.6, -7.2, -4.8, -2.4]:
        create_sphere(f"ENV_GrassPlot_1_ShrubN_{sx}", radius=0.38, loc=(sx, g1_y + g1_l / 2.0 - 0.35, 0.42), mat=mats["Plant_DarkGreen"], col=col, scale_z=0.65)
        create_sphere(f"ENV_GrassPlot_1_ShrubS_{sx}", radius=0.38, loc=(sx, g1_y - g1_l / 2.0 + 0.35, 0.42), mat=mats["Plant_DarkGreen"], col=col, scale_z=0.65)

    # Ô cỏ ngang số 2 (Phía Nam): 10.8m (Đông-Tây) x 9.6m (Bắc-Nam) tại (-7.3, -14.2)
    g2_x, g2_y, g2_w, g2_l = -7.3, -14.2, 10.8, 9.6
    create_box("ENV_GrassPlot_2_Curb", (g2_w + 0.5, g2_l + 0.5, 0.28), (g2_x, g2_y, 0.14), mats["Wall_Yellow"], col)
    create_box("ENV_GrassPlot_2_CurbTop", (g2_w + 0.54, g2_l + 0.54, 0.04), (g2_x, g2_y, 0.29), mats["Trim_White"], col)
    create_box("ENV_GrassPlot_2_Green", (g2_w, g2_l, 0.33), (g2_x, g2_y, 0.165), mats["Plant_Green"], col)

    # Viền cây bụi thấp quanh mép Ô cỏ 2 (Chuẩn Ảnh 3)
    for sx in [-11.8, -9.5, -7.3, -5.1, -2.8]:
        create_sphere(f"ENV_GrassPlot_2_ShrubN_{sx}", radius=0.40, loc=(sx, g2_y + g2_l / 2.0 - 0.40, 0.42), mat=mats["Plant_DarkGreen"], col=col, scale_z=0.65)
        create_sphere(f"ENV_GrassPlot_2_ShrubS_{sx}", radius=0.40, loc=(sx, g2_y - g2_l / 2.0 + 0.40, 0.42), mat=mats["Plant_DarkGreen"], col=col, scale_z=0.65)

    # --- THIẾT BỊ VUI CHƠI VẬN ĐỘNG NGOÀI TRỜI TRÊN 2 Ô CỎ (Chuẩn Ảnh 3: ref_photo_playground_gym.jpg) ---
    # 1. Khung leo vận động lập phương đa sắc (Xanh - Vàng - Đỏ) ở trung tâm Ô cỏ 1 & 2
    cube_cx, cube_cy = -6.8, -2.0
    cube_w, cube_l, cube_h = 2.4, 2.2, 2.1
    play_mats = [mats["Play_Blue"], mats["Play_Yellow"], mats["Play_Red"]]
    for ix, dx in enumerate([-cube_w / 2.0, 0.0, cube_w / 2.0]):
        for iy, dy in enumerate([-cube_l / 2.0, 0.0, cube_l / 2.0]):
            pmat = play_mats[(ix + iy) % 3]
            create_cylinder(f"PLAY_CubePost_{ix}_{iy}", radius=0.045, depth=cube_h, loc=(cube_cx + dx, cube_cy + dy, 0.30 + cube_h / 2.0), mat=pmat, col=col, segs=8)
    for iz, hz in enumerate([0.95, 1.65, 2.30]):
        pmat = play_mats[iz % 3]
        for dy in [-cube_l / 2.0, 0.0, cube_l / 2.0]:
            create_box(f"PLAY_CubeBarX_{iz}_{dy}", (cube_w, 0.05, 0.05), (cube_cx, cube_cy + dy, hz), pmat, col)
        for dx in [-cube_w / 2.0, 0.0, cube_w / 2.0]:
            create_box(f"PLAY_CubeBarY_{iz}_{dx}", (0.05, cube_l, 0.05), (cube_cx + dx, cube_cy, hz), pmat, col)

    # 2. Thang leo cầu vồng bán nguyệt (Vàng - Xanh dương) bên trái Ô cỏ 1 (nhìn từ Bắc xuống Nam là bên trái)
    arch_cx, arch_cy = -3.6, -2.0
    arch_span = 2.6
    for side_y in [-0.45, 0.45]:
        for seg_i in range(7):
            ang = math.pi * (seg_i + 0.5) / 7.0
            ax = arch_cx + math.cos(ang) * (arch_span / 2.0)
            az = 0.30 + math.sin(ang) * 1.35
            create_sphere(f"PLAY_ArchNode_{side_y}_{seg_i}", radius=0.06, loc=(ax, arch_cy + side_y, az), mat=mats["Play_Yellow"], col=col)
            if side_y < 0:
                create_box(f"PLAY_ArchRung_{seg_i}", (0.06, 0.90, 0.06), (ax, arch_cy, az), mats["Play_Blue"], col)

    # 3. Thú nhún lò xo & Bập bênh xanh-vàng bên phải Ô cỏ 1 (sát phía Nhà Đa Năng C1)
    for r_idx, (rx, ry, rmat) in enumerate([(-9.8, -1.5, mats["Play_Blue"]), (-10.8, -2.3, mats["Play_Yellow"]), (-9.2, -2.6, mats["Play_Red"])]):
        create_cylinder(f"PLAY_SpringBase_{r_idx}", radius=0.14, depth=0.35, loc=(rx, ry, 0.45), mat=mats["Railing_Silver"], col=col, segs=8)
        create_box(f"PLAY_SpringBody_{r_idx}", (0.75, 0.28, 0.42), (rx, ry, 0.82), rmat, col)
        create_sphere(f"PLAY_SpringHead_{r_idx}", radius=0.20, loc=(rx - 0.25, ry, 1.12), mat=rmat, col=col)

    # 4. Nhà cầu trượt liên hoàn chóp nón vàng trên Ô cỏ 2 (Phía Nam)
    sl_cx, sl_cy = -7.8, -12.8
    for px_off in [-0.7, 0.7]:
        for py_off in [-0.7, 0.7]:
            create_cylinder(f"PLAY_SlidePost_{px_off}_{py_off}", radius=0.06, depth=2.3, loc=(sl_cx + px_off, sl_cy + py_off, 1.45), mat=mats["Play_Blue"], col=col, segs=8)
    create_box("PLAY_SlidePlatform", (1.6, 1.6, 0.12), (sl_cx, sl_cy, 1.45), mats["Play_Red"], col)
    # Mái chóp nón vàng đặc trưng trong Ảnh 3
    cone_mesh = bpy.data.meshes.new("PLAY_SlideRoofCone_Mesh")
    cone_obj = bpy.data.objects.new("PLAY_SlideRoofCone", cone_mesh)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=12, radius1=1.25, radius2=0.05, depth=0.95)
    bm.to_mesh(cone_mesh)
    bm.free()
    cone_obj.location = (sl_cx, sl_cy, 2.95)
    cone_obj.data.materials.append(mats["Play_Yellow"])
    col.objects.link(cone_obj)
    # Máng trượt đỏ & vàng vươn ra phía Đông và Nam
    chute1 = create_box("PLAY_SlideChute_Red", (2.2, 0.55, 0.10), (sl_cx + 1.5, sl_cy, 0.88), mats["Play_Red"], col)
    chute1.rotation_euler.y = math.radians(28)
    chute2 = create_box("PLAY_SlideChute_Yellow", (0.55, 2.1, 0.10), (sl_cx, sl_cy - 1.45, 0.88), mats["Play_Yellow"], col)
    chute2.rotation_euler.x = math.radians(-28)

    # Khung xà đu & leo dây phụ trên Ô cỏ 2
    sw_cx, sw_cy = -4.2, -14.8
    create_cylinder("PLAY_SwingPost_L", radius=0.05, depth=2.2, loc=(sw_cx - 1.4, sw_cy, 1.4), mat=mats["Play_Red"], col=col, segs=8)
    create_cylinder("PLAY_SwingPost_R", radius=0.05, depth=2.2, loc=(sw_cx + 1.4, sw_cy, 1.4), mat=mats["Play_Red"], col=col, segs=8)
    create_box("PLAY_SwingTopBar", (3.0, 0.08, 0.08), (sw_cx, sw_cy, 2.45), mats["Play_Yellow"], col)

    # 5. Hai cây bàng Đài Loan non (tán 3 tầng phân nhánh chi tiết, có 3 cọc gỗ chống) ở góc Ô cỏ (Chuẩn Ảnh 3!)
    for sap_idx, (tx, ty) in enumerate([(-4.5, -0.3), (-12.2, -3.5)]):
        create_cylinder(f"TREE_Sapling_{sap_idx}_Trunk", radius=0.055, depth=3.5, loc=(tx, ty, 1.90), mat=mats["Bark_Wood"], col=col, segs=10)
        for tier_z, tier_r in [(2.45, 0.92), (3.02, 0.72), (3.52, 0.46)]:
            create_sphere(f"TREE_Sapling_{sap_idx}_Center_{tier_z}", radius=tier_r * 0.65, loc=(tx, ty, tier_z), mat=mats["Plant_DarkGreen"], col=col, segs=12, rings=8, scale_z=0.26)
            for b_ang_i in range(4):
                b_ang = b_ang_i * (math.pi / 2.0) + (tier_z * 0.5)
                bx = tx + math.cos(b_ang) * (tier_r * 0.58)
                by = ty + math.sin(b_ang) * (tier_r * 0.58)
                create_sphere(f"TREE_Sapling_{sap_idx}_Leaf_{tier_z}_{b_ang_i}", radius=tier_r * 0.48, loc=(bx, by, tier_z + 0.03), mat=mats["Plant_DarkGreen"], col=col, segs=10, rings=6, scale_z=0.25)
        # 3 cọc gỗ chống cây non
        for st_i in range(3):
            ang = st_i * (2.0 * math.pi / 3.0)
            sx = tx + math.cos(ang) * 0.35
            sy = ty + math.sin(ang) * 0.35
            stake = create_cylinder(f"TREE_Sapling_{sap_idx}_Stake_{st_i}", radius=0.025, depth=1.35, loc=(sx, sy, 0.75), mat=mats["Bark_Wood"], col=col, segs=6)
            stake.rotation_euler = (-math.sin(ang) * 0.28, math.cos(ang) * 0.28, 0.0)

    # Nhà trạm kỹ thuật nhỏ màu trắng mái bằng sát dưới Ô cỏ 2 (Google Maps & Frame 020)
    create_box("PROP_UtilityHut_Body", (3.2, 2.8, 2.4), (-10.8, -21.6, 1.2), mats["Wall_White"], col)
    create_box("PROP_UtilityHut_Roof", (3.5, 3.1, 0.18), (-10.8, -21.6, 2.49), mats["Trim_White"], col)
    create_box("PROP_UtilityHut_Door", (0.85, 0.10, 1.85), (-10.8, -20.18, 0.95), mats["Window_Dark"], col)

    # 10C. VẠCH KẺ SÂN CẦU LÔNG TRÊN SÂN BÊ TÔNG (Bên trái thảm đỏ chuẩn Frame 005 & Google Maps)
    bc_x, bc_y = -6.2, 12.0
    bc_w, bc_l = 6.1, 13.4
    create_box("ENV_Badminton_N", (bc_w, 0.07, 0.01), (bc_x, bc_y + bc_l / 2.0, 0.01), mats["Marking_Yellow"], col)
    create_box("ENV_Badminton_S", (bc_w, 0.07, 0.01), (bc_x, bc_y - bc_l / 2.0, 0.01), mats["Marking_Yellow"], col)
    create_box("ENV_Badminton_W", (0.07, bc_l, 0.01), (bc_x - bc_w / 2.0, bc_y, 0.01), mats["Marking_Yellow"], col)
    create_box("ENV_Badminton_E", (0.07, bc_l, 0.01), (bc_x + bc_w / 2.0, bc_y, 0.01), mats["Marking_Yellow"], col)
    create_box("ENV_Badminton_Mid", (bc_w, 0.07, 0.01), (bc_x, bc_y, 0.01), mats["Marking_White"], col)
    create_box("ENV_Badminton_CenterNS", (0.06, bc_l, 0.01), (bc_x, bc_y, 0.01), mats["Marking_White"], col)

    # 10D. GHẾ ĐÁ BÊN TRÁI SÂN TRƯỜNG (Đã bỏ toàn bộ cột đèn sân trường theo yêu cầu của thầy)
    INCLUDE_COURTYARD_LAMPS = False
    if INCLUDE_COURTYARD_LAMPS:
        lamp_coords = [(-14.4, 23.5), (-14.4, 13.5), (-14.4, 1.5), (-13.5, -10.0), (-1.4, -24.0), (3.6, -36.0)]
        for idx, (lx, ly) in enumerate(lamp_coords):
            create_courtyard_lamp(f"PROP_CourtyardLamp_{idx+1}", (lx, ly, 0.0), 1.0, mats, col)

    create_stone_bench("PROP_Bench_West_1", (-14.2, 13.5, 0.0), mats, col, rot_z=math.radians(180))
    create_stone_bench("PROP_Bench_West_2", (-14.2, 2.2, 0.0), mats, col, rot_z=math.radians(180))

    # 10E. DÂY CỜ ĐUÔI NHEO LỄ HỘI CHĂNG CAO TRÊN SÂN TRƯỜNG
    bunt_mats = [mats["Bunt_Pink"], mats["Bunt_Cyan"], mats["Bunt_Yellow"], mats["Bunt_Green"], mats["Bunt_Purple"], mats["Banner_Red"]]
    bunt_span = 27.0
    bunt_cx = 0.5
    for line_idx, wire_y in enumerate([16.0, 6.0, -4.0, -14.0]):
        create_cylinder(f"PROP_BuntingWire_{line_idx}", radius=0.01, depth=bunt_span, loc=(bunt_cx, wire_y, 5.8), mat=mats["Railing_Silver"], col=col, segs=6, rot_euler=(0.0, math.radians(90), 0.0))
        for flag_idx in range(18):
            fx = (bunt_cx - bunt_span / 2.0) + (flag_idx + 0.5) * (bunt_span / 18.0)
            create_box(f"PROP_BuntFlag_{line_idx}_{flag_idx}", (0.32, 0.02, 0.42), (fx, wire_y, 5.55), bunt_mats[flag_idx % len(bunt_mats)], col)

    # Giữ nguyên yêu cầu của thầy: Không đặt học sinh & Không trồng cây to che sân trường
    INCLUDE_STUDENTS = False
    INCLUDE_COURTYARD_TREES = False
    _ = (INCLUDE_STUDENTS, INCLUDE_COURTYARD_TREES)


# ------------------------------------------------------------------------------
# 11. MAIN GATE, GUARDHOUSE, SW FUNNEL WALL & MAIN ROAD (CHUẨN GOOGLE MAPS)
# ------------------------------------------------------------------------------
def build_main_gate_and_road(mats, parent_col):
    col = sub_col("BLD_MainGate_And_Road", parent_col)

    # Cổng trường chính đúng tọa độ Google Maps: (8.4, -40.0)
    gate_x = 8.40
    gate_y = -40.00
    pillar_w = 1.05
    pillar_h = 4.5
    opening_w = 6.2

    left_pillar_x = gate_x - opening_w / 2.0 - pillar_w / 2.0   # 4.775m
    right_pillar_x = gate_x + opening_w / 2.0 + pillar_w / 2.0  # 12.025m

    create_box("BLD_Gate_Pillar_L", (pillar_w, pillar_w, pillar_h), (left_pillar_x, gate_y, pillar_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_Gate_Pillar_R", (pillar_w, pillar_w, pillar_h), (right_pillar_x, gate_y, pillar_h / 2.0), mats["Wall_Yellow"], col)
    create_box("BLD_Gate_PillarBase_L", (pillar_w + 0.25, pillar_w + 0.25, 0.45), (left_pillar_x, gate_y, 0.225), mats["Trim_White"], col)
    create_box("BLD_Gate_PillarBase_R", (pillar_w + 0.25, pillar_w + 0.25, 0.45), (right_pillar_x, gate_y, 0.225), mats["Trim_White"], col)

    create_sphere("BLD_Gate_Lantern_L", radius=0.24, loc=(left_pillar_x, gate_y, pillar_h + 0.28), mat=mats["Light_Glow"], col=col)
    create_sphere("BLD_Gate_Lantern_R", radius=0.24, loc=(right_pillar_x, gate_y, pillar_h + 0.28), mat=mats["Light_Glow"], col=col)

    beam_len = opening_w + pillar_w * 2.0 + 0.5
    create_box("BLD_Gate_Beam", (beam_len, 1.25, 0.95), (gate_x, gate_y, pillar_h - 0.45), mats["Accent_Apricot"], col)
    create_box("BLD_Gate_Sign_Front", (beam_len * 0.88, 0.12, 0.62), (gate_x, gate_y - 0.62, pillar_h - 0.45), mats["Sign_Gate"], col, uv_fit=True)
    create_box("BLD_Gate_Sign_Back", (beam_len * 0.88, 0.12, 0.62), (gate_x, gate_y + 0.62, pillar_h - 0.45), mats["Sign_Gate"], col, uv_fit=True)
    create_hipped_roof_with_ridges("BLD_Gate_Roof", base_w=beam_len + 0.8, base_l=1.9, roof_h=1.25, overhang=0.45, loc=(gate_x, gate_y, pillar_h), mats=mats, col=col)

    # Cánh cổng sắt xanh mở đón vào trường
    create_box("BLD_Gate_Leaf_L", (0.10, 2.8, 2.2), (left_pillar_x + 0.6, gate_y + 1.5, 1.1), mats["Gate_Iron_Blue"], col)
    create_box("BLD_Gate_Leaf_R", (0.10, 2.8, 2.2), (right_pillar_x - 0.6, gate_y + 1.5, 1.1), mats["Gate_Iron_Blue"], col)

    # Nhà Bảo Vệ mái ngói đỏ vuông đặt đúng giữa Cổng chính & đầu Nam Tòa A (Google Maps: 13.2, -36.1)
    guard_x, guard_y = 13.2, -36.1
    create_box("BLD_GuardHouse_Body", (3.6, 3.6, 3.2), (guard_x, guard_y, 1.6), mats["Wall_Yellow"], col)
    create_box("BLD_GuardHouse_Win_W", (0.12, 1.5, 1.2), (guard_x - 1.82, guard_y, 1.65), mats["Glass_Blue"], col)
    create_box("BLD_GuardHouse_Win_S", (1.5, 0.12, 1.2), (guard_x, guard_y - 1.82, 1.65), mats["Glass_Blue"], col)
    create_hipped_roof_with_ridges("BLD_GuardHouse_Roof", base_w=3.6, base_l=3.6, roof_h=1.25, overhang=0.45, loc=(guard_x, guard_y, 3.2), mats=mats, col=col)

    # Tường rào gấp khúc hình phễu góc Tây-Nam (Chuẩn 100% ranh giới Google Maps!)
    create_wall_segment("ENV_SW_Fence_1", (-19.2, -21.8), (-14.5, -24.0), 0.30, 2.1, 0.0, mats["Wall_Yellow"], col)
    create_wall_segment("ENV_SW_Fence_2", (-14.5, -24.0), (-1.8, -24.6), 0.30, 2.1, 0.0, mats["Wall_Yellow"], col)
    create_wall_segment("ENV_SW_Fence_3", (-1.8, -24.6), (left_pillar_x - 0.5, gate_y), 0.30, 2.1, 0.0, mats["Wall_Yellow"], col)

    # Tường rào phía Đông-Nam nối sang khu vườn tròn
    create_wall_segment("ENV_SE_Fence", (right_pillar_x + 0.5, gate_y), (46.0, -34.0), 0.30, 2.1, 0.0, mats["Wall_Yellow"], col)

    # Con đường giao thông liên thôn xã Vĩnh Thực chạy trước cổng trường (Google Maps bottom road)
    create_wall_segment("ENV_MainRoad_Surface", (-52.0, -49.5), (56.0, -41.5), 8.5, 0.16, -0.14, mats["Road_Asphalt"], col)
    create_box("ENV_Gate_DrivewayApron", (12.0, 8.0, 0.17), (gate_x, gate_y - 2.5, -0.09), mats["Yard_Concrete"], col)


# ------------------------------------------------------------------------------
# 12. SURROUNDING GEOGRAPHY: WINDING STREAM, HILLS & TELECOM MAST
# ------------------------------------------------------------------------------
def build_terrain_and_mast(mats, parent_col):
    col = sub_col("ENV_Terrain_Surroundings", parent_col)

    # Base Grass/Earth Ground Plane around the entire island school site
    create_box("ENV_OuterGround_Base", (220.0, 220.0, 0.20), (0.0, 20.0, -0.35), mats["Terrain_Earth"], col)

    # Winding Stream curving naturally right behind Bld B & Bld C2 (Google Maps & Frame 025)
    river_mesh = bpy.data.meshes.new("ENV_WindingStream_Mesh")
    river_obj = bpy.data.objects.new("ENV_WindingStream", river_mesh)
    bm = bmesh.new()
    segs_x = 32
    for i in range(segs_x + 1):
        rx = -75.0 + (155.0 * i / segs_x)
        center_y = 44.0 + math.sin(rx * 0.045) * 6.5
        half_w = 7.5 + math.cos(rx * 0.03) * 2.2
        bm.verts.new((rx, center_y - half_w, -0.18))
        bm.verts.new((rx, center_y + half_w, -0.18))
    bm.verts.ensure_lookup_table()
    for i in range(segs_x):
        v0 = bm.verts[i * 2]
        v1 = bm.verts[i * 2 + 1]
        v2 = bm.verts[(i + 1) * 2 + 1]
        v3 = bm.verts[(i + 1) * 2]
        bm.faces.new((v0, v3, v2, v1))
    bm.normal_update()
    bm.to_mesh(river_mesh)
    bm.free()
    river_obj.data.materials.append(mats["Water_River"])
    col.objects.link(river_obj)

    # Rolling Green Island Hills behind the stream (Y >= 56m)
    hill_mesh = bpy.data.meshes.new("ENV_Hill_Mesh")
    hill_obj = bpy.data.objects.new("ENV_BackgroundHill", hill_mesh)
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=20, y_segments=12, size=75.0)
    for v in bm.verts:
        dist_y = v.co.y + 75.0
        dist_x = abs(v.co.x)
        v.co.z = max(0.0, (dist_y * 0.36) - (dist_x * 0.06) + (math.sin(v.co.x * 0.10) * 2.8))
    bm.normal_update()
    bm.to_mesh(hill_mesh)
    bm.free()
    hill_obj.location = (2.0, 132.0, -0.2)
    hill_obj.data.materials.append(mats["Terrain_Grass"])
    col.objects.link(hill_obj)

    # Low green hillside along far West behind Gymnasium & Annex C2
    west_hill = create_box("ENV_WestFoliageSlope", (24.0, 75.0, 3.2), (-60.0, 12.0, 1.2), mats["Terrain_Grass"], col)
    west_hill.rotation_euler.y = math.radians(8)

    # Tall Red-and-White Telecom Mast on North-East Hill (Frame 020 & 025)
    mast_x, mast_y, mast_z = 26.0, 112.0, 26.0
    create_box("PROP_Telecom_Mast_Body", (1.5, 1.5, 36.0), (mast_x, mast_y, mast_z + 18.0), mats["Mast_RedWhite"], col)
    create_cylinder("PROP_Telecom_Dish", radius=0.9, depth=0.25, loc=(mast_x + 0.8, mast_y, mast_z + 26.0), mat=mats["Trim_White"], col=col, segs=12)
    create_cylinder("PROP_Telecom_Spire", radius=0.05, depth=5.0, loc=(mast_x, mast_y, mast_z + 38.5), mat=mats["Railing_Silver"], col=col, segs=8)


# ------------------------------------------------------------------------------
# 13. DAYLIGHT LIGHTING & MULTI-CAMERA RIG
# ------------------------------------------------------------------------------
def setup_lighting_and_cameras(parent_col):
    col = sub_col("ENV_Lighting_Cameras", parent_col)

    sun = bpy.data.lights.new(name="Sun_SchoolDay", type='SUN')
    sun.energy = 6.2
    sun.color = (1.0, 0.98, 0.92)
    if hasattr(sun, "angle"):
        sun.angle = math.radians(1.5)
    sun_obj = bpy.data.objects.new("Sun_SchoolDay", sun)
    sun_obj.location = (45.0, -35.0, 55.0)
    sun_obj.rotation_euler = (math.radians(52), math.radians(12), math.radians(-32))
    col.objects.link(sun_obj)

    # CAMERA 1: AERIAL FLYCAM OVERVIEW (Matching Drone Frame 025 & Full Google Maps Campus)
    cam1 = bpy.data.cameras.new(name="Cam_Aerial_Overview")
    cam1.lens = 22
    cam1.clip_start = 0.5
    cam1.clip_end = 900.0
    cam1_obj = bpy.data.objects.new("Cam_Aerial_Overview", cam1)
    cam1_obj.location = (-3.0, -56.0, 34.0)
    cam1_obj.rotation_euler = (math.radians(60), 0.0, 0.0)
    col.objects.link(cam1_obj)
    bpy.context.scene.camera = cam1_obj

    # CAMERA 2: GROUND CEREMONY PERSPECTIVE
    cam2 = bpy.data.cameras.new(name="Cam_Ground_Ceremony")
    cam2.lens = 24
    cam2.clip_start = 0.2
    cam2.clip_end = 500.0
    cam2_obj = bpy.data.objects.new("Cam_Ground_Ceremony", cam2)
    cam2_obj.location = (-3.5, -16.0, 2.4)
    cam2_obj.rotation_euler = (math.radians(82), 0.0, math.radians(-18))
    col.objects.link(cam2_obj)

    # CAMERA 3: CEREMONY STAGE FRONT
    cam3 = bpy.data.cameras.new(name="Cam_Stage_Front")
    cam3.lens = 28
    cam3.clip_start = 0.2
    cam3.clip_end = 500.0
    cam3_obj = bpy.data.objects.new("Cam_Stage_Front", cam3)
    cam3_obj.location = (1.4, 4.5, 2.3)
    cam3_obj.rotation_euler = (math.radians(84), 0.0, 0.0)
    col.objects.link(cam3_obj)

    # CAMERA 4: PHOTO 1 MATCH — TÒA C2 (DÃY NHÀ 2 TẦNG CÁNH TÂY)
    cam4 = bpy.data.cameras.new(name="Cam_Photo1_BldC2")
    cam4.lens = 18
    cam4.clip_start = 0.2
    cam4.clip_end = 500.0
    cam4_obj = bpy.data.objects.new("Cam_Photo1_BldC2", cam4)
    cam4_obj.location = (-13.6, 15.2, 1.75)
    cam4_obj.rotation_euler = (math.radians(88), 0.0, math.radians(90))
    col.objects.link(cam4_obj)

    # CAMERA 5: PHOTO 2 MATCH — TÒA B & LỄ ĐÀI CHÀO CỜ CẬN CẢNH
    cam5 = bpy.data.cameras.new(name="Cam_Photo2_StageClose")
    cam5.lens = 24
    cam5.clip_start = 0.2
    cam5.clip_end = 500.0
    cam5_obj = bpy.data.objects.new("Cam_Photo2_StageClose", cam5)
    cam5_obj.location = (1.4, 7.2, 1.8)
    cam5_obj.rotation_euler = (math.radians(86), 0.0, 0.0)
    col.objects.link(cam5_obj)

    # CAMERA 6: PHOTO 3 MATCH — KHU VUI CHƠI 2 Ô CỎ & MẶT ĐÔNG NHÀ ĐA NĂNG C1
    cam6 = bpy.data.cameras.new(name="Cam_Photo3_PlaygroundGym")
    cam6.lens = 20
    cam6.clip_start = 0.2
    cam6.clip_end = 500.0
    cam6_obj = bpy.data.objects.new("Cam_Photo3_PlaygroundGym", cam6)
    cam6_obj.location = (-5.5, 6.2, 1.85)
    cam6_obj.rotation_euler = (math.radians(86), 0.0, math.radians(164))
    col.objects.link(cam6_obj)


# ------------------------------------------------------------------------------
# 14. MAIN PIPELINE EXECUTION & EXPORT
# ------------------------------------------------------------------------------
def select_collection_hierarchy(col):
    for obj in col.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
    for child in col.children:
        select_collection_hierarchy(child)


def run():
    print("======================================================================")
    print("EDUVERSE 3D: Generating Google-Maps-Calibrated Campus (v7)...")
    print("======================================================================")

    root_col = setup_scene()
    mats = build_materials()

    # Embed 1:1 Google Maps Satellite Blueprint into .blend
    build_google_maps_blueprint(bpy.context.scene)

    # Build 1:1 Calibrated Campus
    build_courtyard_life(mats, root_col)
    build_east_wing_3f(mats, root_col)
    build_north_wing_2f(mats, root_col)
    build_west_wing_gym_and_annex(mats, root_col)
    build_admin_and_east_garden(mats, root_col)
    build_main_gate_and_road(mats, root_col)
    build_terrain_and_mast(mats, root_col)
    setup_lighting_and_cameras(root_col)

    blend_path = "d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/school_campus_blockout.blend"
    glb_path = "d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/school_campus_blockout.glb"

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[OK] Saved Calibrated Blender Project: {blend_path}")

    # Export only EDUVERSE_Campus meshes (excluding debug blueprint plane)
    bpy.ops.object.select_all(action='DESELECT')
    select_collection_hierarchy(root_col)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"[OK] Exported WebGL GLB: {glb_path}")


if __name__ == "__main__":
    run()
