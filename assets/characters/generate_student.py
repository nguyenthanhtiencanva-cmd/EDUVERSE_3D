"""
Blender 4.2 Script: Generate 3D Vietnamese Student Character with Rig and Animations
Character: 12yo Vietnamese Student (White shirt, Red scout scarf, Navy pants, Backpack)
Animations: Idle, Walk, Run
Output: client/public/models/student_character.glb
"""

import bpy
import math
import os
import shutil
from mathutils import Vector, Euler, Matrix, Quaternion

# Clean up scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# -------------------------------------------------------------
# 1. MATERIALS DEFINITION
# -------------------------------------------------------------
def create_pbr_material(name, base_color, roughness=0.5, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat

mat_skin = create_pbr_material("Mat_Skin", (0.96, 0.78, 0.68, 1.0), roughness=0.6)
mat_skin_blush = create_pbr_material("Mat_Blush", (0.95, 0.55, 0.55, 1.0), roughness=0.7)
mat_hair = create_pbr_material("Mat_Hair", (0.12, 0.08, 0.06, 1.0), roughness=0.4)
mat_eyes = create_pbr_material("Mat_Eyes", (0.08, 0.05, 0.04, 1.0), roughness=0.1)
mat_eye_white = create_pbr_material("Mat_EyeWhite", (0.98, 0.98, 0.98, 1.0), roughness=0.2)
mat_shirt = create_pbr_material("Mat_Shirt", (0.96, 0.96, 0.98, 1.0), roughness=0.7)
mat_scarf = create_pbr_material("Mat_RedScarf", (0.88, 0.12, 0.10, 1.0), roughness=0.5)
mat_scarf_ring = create_pbr_material("Mat_ScarfRing", (0.95, 0.80, 0.20, 1.0), roughness=0.3, metallic=0.5)
mat_pants = create_pbr_material("Mat_NavyPants", (0.10, 0.14, 0.28, 1.0), roughness=0.8)
mat_shoes = create_pbr_material("Mat_WhiteShoes", (0.92, 0.92, 0.94, 1.0), roughness=0.5)
mat_shoes_blue = create_pbr_material("Mat_ShoeStripe", (0.15, 0.35, 0.75, 1.0), roughness=0.5)
mat_backpack = create_pbr_material("Mat_Backpack", (0.15, 0.40, 0.70, 1.0), roughness=0.6)
mat_backpack_trim = create_pbr_material("Mat_BackpackTrim", (0.95, 0.65, 0.15, 1.0), roughness=0.5)

# -------------------------------------------------------------
# 2. ARMATURE RIG CREATION
# -------------------------------------------------------------
bpy.ops.object.add(type='ARMATURE', enter_editmode=True, location=(0, 0, 0))
armature_obj = bpy.context.active_object
armature_obj.name = "Armature_Student"
armature_data = armature_obj.data
armature_data.name = "Armature_Student_Data"

edit_bones = armature_data.edit_bones

# Define bones hierarchy & endpoints
# Root
b_root = edit_bones.new('root')
b_root.head = (0, 0, 0)
b_root.tail = (0, 0, 0.1)

# Hips (Pelvis center)
b_hips = edit_bones.new('hips')
b_hips.head = (0, 0, 0.75)
b_hips.tail = (0, 0, 0.85)
b_hips.parent = b_root

# Spine
b_spine = edit_bones.new('spine')
b_spine.head = (0, 0, 0.85)
b_spine.tail = (0, 0, 1.02)
b_spine.parent = b_hips

# Chest
b_chest = edit_bones.new('chest')
b_chest.head = (0, 0, 1.02)
b_chest.tail = (0, 0, 1.18)
b_chest.parent = b_spine

# Neck
b_neck = edit_bones.new('neck')
b_neck.head = (0, 0, 1.18)
b_neck.tail = (0, 0, 1.25)
b_neck.parent = b_chest

# Head
b_head = edit_bones.new('head')
b_head.head = (0, 0, 1.25)
b_head.tail = (0, 0, 1.55)
b_head.parent = b_neck

# Left Leg
b_thigh_l = edit_bones.new('thigh.L')
b_thigh_l.head = (0.10, 0, 0.74)
b_thigh_l.tail = (0.10, 0, 0.42)
b_thigh_l.parent = b_hips

b_shin_l = edit_bones.new('shin.L')
b_shin_l.head = (0.10, 0, 0.42)
b_shin_l.tail = (0.10, 0, 0.10)
b_shin_l.parent = b_thigh_l

b_foot_l = edit_bones.new('foot.L')
b_foot_l.head = (0.10, 0, 0.10)
b_foot_l.tail = (0.10, 0.15, 0.0)
b_foot_l.parent = b_shin_l

# Right Leg
b_thigh_r = edit_bones.new('thigh.R')
b_thigh_r.head = (-0.10, 0, 0.74)
b_thigh_r.tail = (-0.10, 0, 0.42)
b_thigh_r.parent = b_hips

b_shin_r = edit_bones.new('shin.R')
b_shin_r.head = (-0.10, 0, 0.42)
b_shin_r.tail = (-0.10, 0, 0.10)
b_shin_r.parent = b_thigh_r

b_foot_r = edit_bones.new('foot.R')
b_foot_r.head = (-0.10, 0, 0.10)
b_foot_r.tail = (-0.10, 0.15, 0.0)
b_foot_r.parent = b_shin_r

# Left Arm
b_upper_arm_l = edit_bones.new('upper_arm.L')
b_upper_arm_l.head = (0.20, 0, 1.15)
b_upper_arm_l.tail = (0.24, 0, 0.90)
b_upper_arm_l.parent = b_chest

b_forearm_l = edit_bones.new('forearm.L')
b_forearm_l.head = (0.24, 0, 0.90)
b_forearm_l.tail = (0.26, 0, 0.68)
b_forearm_l.parent = b_upper_arm_l

b_hand_l = edit_bones.new('hand.L')
b_hand_l.head = (0.26, 0, 0.68)
b_hand_l.tail = (0.27, 0, 0.58)
b_hand_l.parent = b_forearm_l

# Right Arm
b_upper_arm_r = edit_bones.new('upper_arm.R')
b_upper_arm_r.head = (-0.20, 0, 1.15)
b_upper_arm_r.tail = (-0.24, 0, 0.90)
b_upper_arm_r.parent = b_chest

b_forearm_r = edit_bones.new('forearm.R')
b_forearm_r.head = (-0.24, 0, 0.90)
b_forearm_r.tail = (-0.26, 0, 0.68)
b_forearm_r.parent = b_upper_arm_r

b_hand_r = edit_bones.new('hand.R')
b_hand_r.head = (-0.26, 0, 0.68)
b_hand_r.tail = (-0.27, 0, 0.58)
b_hand_r.parent = b_forearm_r

bpy.ops.object.mode_set(mode='OBJECT')

# -------------------------------------------------------------
# 3. MESH GEOMETRY CREATION (CHIBI/PIXAR STYLIZED)
# -------------------------------------------------------------
created_parts = []

def assign_bone_weight(obj, bone_name, weight=1.0):
    vg = obj.vertex_groups.new(name=bone_name)
    vg.add(list(range(len(obj.data.vertices))), weight, 'REPLACE')

def create_cube_part(name, location, scale, material, bone_name, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=location, scale=scale)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = rotation
    if material:
        obj.data.materials.append(material)
    assign_bone_weight(obj, bone_name)
    created_parts.append(obj)
    return obj

def create_uv_sphere_part(name, location, radius, scale, material, bone_name):
    bpy.ops.mesh.primitive_uv_sphere_add(location=location, radius=radius, segments=16, ring_count=12)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if material:
        obj.data.materials.append(material)
    assign_bone_weight(obj, bone_name)
    created_parts.append(obj)
    return obj

def create_cylinder_part(name, location, radius, depth, material, bone_name, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(location=location, radius=radius, depth=depth, vertices=12)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = rotation
    if material:
        obj.data.materials.append(material)
    assign_bone_weight(obj, bone_name)
    created_parts.append(obj)
    return obj

# A. Head & Face
head_obj = create_uv_sphere_part("Part_Head", (0, 0, 1.38), radius=0.17, scale=(1.05, 1.0, 1.1), material=mat_skin, bone_name="head")
create_uv_sphere_part("Part_Nose", (0, 0.17, 1.36), radius=0.025, scale=(1.0, 0.9, 0.9), material=mat_skin, bone_name="head")

# Eyes (Left & Right)
create_uv_sphere_part("Part_EyeWhite_L", (0.065, 0.145, 1.39), radius=0.035, scale=(0.9, 0.5, 1.2), material=mat_eye_white, bone_name="head")
create_uv_sphere_part("Part_EyePupil_L", (0.065, 0.160, 1.39), radius=0.024, scale=(0.8, 0.3, 1.1), material=mat_eyes, bone_name="head")
create_uv_sphere_part("Part_EyeWhite_R", (-0.065, 0.145, 1.39), radius=0.035, scale=(0.9, 0.5, 1.2), material=mat_eye_white, bone_name="head")
create_uv_sphere_part("Part_EyePupil_R", (-0.065, 0.160, 1.39), radius=0.024, scale=(0.8, 0.3, 1.1), material=mat_eyes, bone_name="head")

# Cheeks Blush
create_uv_sphere_part("Part_Blush_L", (0.11, 0.135, 1.34), radius=0.032, scale=(0.9, 0.4, 0.6), material=mat_skin_blush, bone_name="head")
create_uv_sphere_part("Part_Blush_R", (-0.11, 0.135, 1.34), radius=0.032, scale=(0.9, 0.4, 0.6), material=mat_skin_blush, bone_name="head")

# Ears
create_uv_sphere_part("Part_Ear_L", (0.17, 0, 1.38), radius=0.04, scale=(0.4, 0.8, 1.0), material=mat_skin, bone_name="head")
create_uv_sphere_part("Part_Ear_R", (-0.17, 0, 1.38), radius=0.04, scale=(0.4, 0.8, 1.0), material=mat_skin, bone_name="head")

# Hair (Chibi neat student haircut)
create_uv_sphere_part("Part_Hair_Main", (0, -0.02, 1.43), radius=0.185, scale=(1.08, 1.12, 1.05), material=mat_hair, bone_name="head")
# Bangs / Front hair tufts
create_cube_part("Part_Hair_Bangs", (0, 0.12, 1.49), scale=(0.14, 0.05, 0.05), material=mat_hair, bone_name="head", rotation=(0.15, 0, 0))

# B. Neck
create_cylinder_part("Part_Neck", (0, 0, 1.22), radius=0.06, depth=0.08, material=mat_skin, bone_name="neck")

# C. Torso (White collared shirt)
# Chest / Upper Torso
create_cube_part("Part_Shirt_Chest", (0, 0, 1.10), scale=(0.19, 0.12, 0.10), material=mat_shirt, bone_name="chest")
# Collar
create_cube_part("Part_Collar_L", (0.07, 0.10, 1.18), scale=(0.06, 0.04, 0.02), material=mat_shirt, bone_name="chest", rotation=(-0.3, 0.2, -0.3))
create_cube_part("Part_Collar_R", (-0.07, 0.10, 1.18), scale=(0.06, 0.04, 0.02), material=mat_shirt, bone_name="chest", rotation=(-0.3, -0.2, 0.3))

# Spine / Lower Torso
create_cube_part("Part_Shirt_Spine", (0, 0, 0.94), scale=(0.17, 0.11, 0.08), material=mat_shirt, bone_name="spine")

# D. Khăn Quàng Đỏ (Red Scout Scarf) - Authentic Vietnamese Student Scarf
# Scarf band around neck
create_cube_part("Part_Scarf_NeckBand", (0, 0.06, 1.18), scale=(0.12, 0.07, 0.025), material=mat_scarf, bone_name="chest", rotation=(0.2, 0, 0))
# Scarf knot
create_uv_sphere_part("Part_Scarf_Knot", (0, 0.13, 1.14), radius=0.035, scale=(1.1, 0.9, 0.9), material=mat_scarf, bone_name="chest")
create_cylinder_part("Part_Scarf_Ring", (0, 0.135, 1.14), radius=0.038, depth=0.015, material=mat_scarf_ring, bone_name="chest", rotation=(math.pi/2, 0, 0))
# Scarf tails hanging down
create_cube_part("Part_Scarf_Tail_L", (0.03, 0.13, 1.04), scale=(0.035, 0.015, 0.08), material=mat_scarf, bone_name="chest", rotation=(0.1, -0.15, 0.1))
create_cube_part("Part_Scarf_Tail_R", (-0.03, 0.13, 1.02), scale=(0.035, 0.015, 0.10), material=mat_scarf, bone_name="chest", rotation=(0.1, 0.15, -0.1))

# E. School Backpack
create_cube_part("Part_Backpack_Body", (0, -0.16, 1.05), scale=(0.15, 0.08, 0.16), material=mat_backpack, bone_name="chest")
create_cube_part("Part_Backpack_Pocket", (0, -0.22, 1.01), scale=(0.12, 0.03, 0.09), material=mat_backpack_trim, bone_name="chest")
# Straps over shoulders
create_cube_part("Part_Strap_L", (0.13, 0.02, 1.11), scale=(0.025, 0.10, 0.015), material=mat_backpack_trim, bone_name="chest", rotation=(0.1, 0.2, 0))
create_cube_part("Part_Strap_R", (-0.13, 0.02, 1.11), scale=(0.025, 0.10, 0.015), material=mat_backpack_trim, bone_name="chest", rotation=(0.1, -0.2, 0))

# F. Pelvis / Hips (Navy Pants upper)
create_cube_part("Part_Pants_Hips", (0, 0, 0.79), scale=(0.165, 0.105, 0.07), material=mat_pants, bone_name="hips")

# G. Arms
# Left Arm
create_cylinder_part("Part_Sleeve_L", (0.22, 0, 1.08), radius=0.065, depth=0.10, material=mat_shirt, bone_name="upper_arm.L")
create_cylinder_part("Part_UpperArm_L", (0.23, 0, 0.98), radius=0.045, depth=0.14, material=mat_skin, bone_name="upper_arm.L")
create_cylinder_part("Part_Forearm_L", (0.25, 0, 0.79), radius=0.042, depth=0.18, material=mat_skin, bone_name="forearm.L")
create_uv_sphere_part("Part_Hand_L", (0.26, 0, 0.63), radius=0.05, scale=(0.9, 0.8, 1.1), material=mat_skin, bone_name="hand.L")

# Right Arm
create_cylinder_part("Part_Sleeve_R", (-0.22, 0, 1.08), radius=0.065, depth=0.10, material=mat_shirt, bone_name="upper_arm.R")
create_cylinder_part("Part_UpperArm_R", (-0.23, 0, 0.98), radius=0.045, depth=0.14, material=mat_skin, bone_name="upper_arm.R")
create_cylinder_part("Part_Forearm_R", (-0.25, 0, 0.79), radius=0.042, depth=0.18, material=mat_skin, bone_name="forearm.R")
create_uv_sphere_part("Part_Hand_R", (-0.26, 0, 0.63), radius=0.05, scale=(0.9, 0.8, 1.1), material=mat_skin, bone_name="hand.R")

# H. Legs (Navy School Pants)
# Left Leg
create_cylinder_part("Part_Pants_Thigh_L", (0.10, 0, 0.58), radius=0.075, depth=0.28, material=mat_pants, bone_name="thigh.L")
create_cylinder_part("Part_Pants_Shin_L", (0.10, 0, 0.26), radius=0.068, depth=0.30, material=mat_pants, bone_name="shin.L")
create_cube_part("Part_Shoe_L", (0.10, 0.04, 0.05), scale=(0.065, 0.12, 0.045), material=mat_shoes, bone_name="foot.L")
create_cube_part("Part_ShoeStripe_L", (0.10, 0.03, 0.07), scale=(0.067, 0.04, 0.015), material=mat_shoes_blue, bone_name="foot.L")

# Right Leg
create_cylinder_part("Part_Pants_Thigh_R", (-0.10, 0, 0.58), radius=0.075, depth=0.28, material=mat_pants, bone_name="thigh.R")
create_cylinder_part("Part_Pants_Shin_R", (-0.10, 0, 0.26), radius=0.068, depth=0.30, material=mat_pants, bone_name="shin.R")
create_cube_part("Part_Shoe_R", (-0.10, 0.04, 0.05), scale=(0.065, 0.12, 0.045), material=mat_shoes, bone_name="foot.R")
create_cube_part("Part_ShoeStripe_R", (-0.10, 0.03, 0.07), scale=(0.067, 0.04, 0.015), material=mat_shoes_blue, bone_name="foot.R")

# Join all mesh parts into a single clean Character Mesh
bpy.ops.object.select_all(action='DESELECT')
for p in created_parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = created_parts[0]
bpy.ops.object.join()

char_mesh = bpy.context.active_object
char_mesh.name = "Student_Mesh"

# Parent Character Mesh to Armature with Armature Modifier
char_mesh.select_set(True)
armature_obj.select_set(True)
bpy.context.view_layer.objects.active = armature_obj
bpy.ops.object.parent_set(type='ARMATURE')

print(f"Character mesh joined with {len(char_mesh.data.vertices)} vertices.")

# -------------------------------------------------------------
# 4. KEYFRAME ANIMATIONS (IDLE, WALK, RUN)
# -------------------------------------------------------------
bpy.context.view_layer.objects.active = armature_obj
bpy.ops.object.mode_set(mode='POSE')
pose_bones = armature_obj.pose.bones

def reset_pose():
    for pb in pose_bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.rotation_mode = 'XYZ'

# 4.1 ANIMATION: IDLE (48 frames @ 24fps = 2.0s loop)
reset_pose()
action_idle = bpy.data.actions.new(name="Idle")
armature_obj.animation_data_create()
armature_obj.animation_data.action = action_idle

for f, factor in [(1, 0.0), (12, 1.0), (24, 0.0), (36, -0.5), (48, 0.0)]:
    bpy.context.scene.frame_set(f)
    
    # Hips gentle breathe up/down
    pose_bones['hips'].location = (0, 0, factor * 0.015)
    pose_bones['hips'].keyframe_insert(data_path="location", frame=f)
    
    # Chest subtle expansion
    pose_bones['chest'].rotation_euler = (factor * 0.02, 0, 0)
    pose_bones['chest'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    # Head slight natural tilt
    pose_bones['head'].rotation_euler = (-factor * 0.015, factor * 0.02, 0)
    pose_bones['head'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    # Arms relaxed natural swaying
    pose_bones['upper_arm.L'].rotation_euler = (factor * 0.03, 0, 0.04)
    pose_bones['upper_arm.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['upper_arm.R'].rotation_euler = (-factor * 0.03, 0, -0.04)
    pose_bones['upper_arm.R'].keyframe_insert(data_path="rotation_euler", frame=f)

# 4.2 ANIMATION: WALK (24 frames @ 24fps = 1.0s loop)
reset_pose()
action_walk = bpy.data.actions.new(name="Walk")
armature_obj.animation_data.action = action_walk

# Natural walking keyframes (F1, F6, F12, F18, F24)
walk_keyframes = [
    # (frame, hip_z, hip_rot_y, leg_L_rot_x, leg_R_rot_x, shin_L_gập, shin_R_gập, arm_L_rot_x, arm_R_rot_x)
    (1,   0.0,    0.0,    math.radians(26),   math.radians(-24),  math.radians(0),    math.radians(28),   math.radians(-22),  math.radians(22)),
    (6,   0.025,  0.03,   math.radians(8),    math.radians(-8),   math.radians(30),   math.radians(10),   math.radians(-5),   math.radians(5)),
    (12,  0.0,    0.0,    math.radians(-24),  math.radians(26),   math.radians(28),   math.radians(0),    math.radians(22),   math.radians(-22)),
    (18,  0.025,  -0.03,  math.radians(-8),   math.radians(8),    math.radians(10),   math.radians(30),   math.radians(5),    math.radians(-5)),
    (24,  0.0,    0.0,    math.radians(26),   math.radians(-24),  math.radians(0),    math.radians(28),   math.radians(-22),  math.radians(22))
]

for f, hip_z, hip_y, l_x, r_x, sl_x, sr_x, al_x, ar_x in walk_keyframes:
    bpy.context.scene.frame_set(f)
    
    # Hips bobbing & slight sway
    pose_bones['hips'].location = (0, 0, hip_z)
    pose_bones['hips'].rotation_euler = (0, hip_y, 0)
    pose_bones['hips'].keyframe_insert(data_path="location", frame=f)
    pose_bones['hips'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    # Legs
    pose_bones['thigh.L'].rotation_euler = (l_x, 0, 0)
    pose_bones['thigh.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['thigh.R'].rotation_euler = (r_x, 0, 0)
    pose_bones['thigh.R'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    pose_bones['shin.L'].rotation_euler = (sl_x, 0, 0)
    pose_bones['shin.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['shin.R'].rotation_euler = (sr_x, 0, 0)
    pose_bones['shin.R'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    # Arms
    pose_bones['upper_arm.L'].rotation_euler = (al_x, 0, 0.05)
    pose_bones['upper_arm.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['upper_arm.R'].rotation_euler = (ar_x, 0, -0.05)
    pose_bones['upper_arm.R'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    # Forearms slightly bent
    pose_bones['forearm.L'].rotation_euler = (math.radians(20), 0, 0)
    pose_bones['forearm.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['forearm.R'].rotation_euler = (math.radians(20), 0, 0)
    pose_bones['forearm.R'].keyframe_insert(data_path="rotation_euler", frame=f)

# 4.3 ANIMATION: RUN (16 frames @ 24fps = 0.67s loop)
reset_pose()
action_run = bpy.data.actions.new(name="Run")
armature_obj.animation_data.action = action_run

run_keyframes = [
    (1,   0.0,    math.radians(45),   math.radians(-42),  math.radians(5),    math.radians(50),   math.radians(-45),  math.radians(45)),
    (5,   0.045,  math.radians(12),   math.radians(-15),  math.radians(45),   math.radians(20),   math.radians(-10),  math.radians(10)),
    (9,   0.0,    math.radians(-42),  math.radians(45),   math.radians(50),   math.radians(5),    math.radians(45),   math.radians(-45)),
    (13,  0.045,  math.radians(-15),  math.radians(12),   math.radians(20),   math.radians(45),   math.radians(10),   math.radians(-10)),
    (16,  0.0,    math.radians(45),   math.radians(-42),  math.radians(5),    math.radians(50),   math.radians(-45),  math.radians(45))
]

for f, hip_z, l_x, r_x, sl_x, sr_x, al_x, ar_x in run_keyframes:
    bpy.context.scene.frame_set(f)
    
    # Hips bobbing & forward lean
    pose_bones['hips'].location = (0, 0, hip_z)
    pose_bones['hips'].keyframe_insert(data_path="location", frame=f)
    
    pose_bones['spine'].rotation_euler = (math.radians(12), 0, 0)
    pose_bones['spine'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    # Legs wide stride
    pose_bones['thigh.L'].rotation_euler = (l_x, 0, 0)
    pose_bones['thigh.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['thigh.R'].rotation_euler = (r_x, 0, 0)
    pose_bones['thigh.R'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    pose_bones['shin.L'].rotation_euler = (sl_x, 0, 0)
    pose_bones['shin.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['shin.R'].rotation_euler = (sr_x, 0, 0)
    pose_bones['shin.R'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    # Arms bent 85 degrees swinging dynamically
    pose_bones['upper_arm.L'].rotation_euler = (al_x, 0, 0.1)
    pose_bones['upper_arm.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['upper_arm.R'].rotation_euler = (ar_x, 0, -0.1)
    pose_bones['upper_arm.R'].keyframe_insert(data_path="rotation_euler", frame=f)
    
    pose_bones['forearm.L'].rotation_euler = (math.radians(85), 0, 0)
    pose_bones['forearm.L'].keyframe_insert(data_path="rotation_euler", frame=f)
    pose_bones['forearm.R'].rotation_euler = (math.radians(85), 0, 0)
    pose_bones['forearm.R'].keyframe_insert(data_path="rotation_euler", frame=f)

# Push all actions to NLA Tracks so Blender glTF Exporter includes all 3 animations!
armature_obj.animation_data.use_nla = True
for act in [action_idle, action_walk, action_run]:
    track = armature_obj.animation_data.nla_tracks.new()
    track.name = act.name
    track.strips.new(act.name, 1, act)

# Set Idle as active action
armature_obj.animation_data.action = action_idle
bpy.ops.object.mode_set(mode='OBJECT')

# -------------------------------------------------------------
# 5. EXPORT AS BLEND & GLB
# -------------------------------------------------------------
out_dir = r"d:\ANTIGRAVITY\EDUVERSE_3D\assets\characters"
blend_path = os.path.join(out_dir, "student_character.blend")
glb_path = os.path.join(out_dir, "student_character.glb")
client_glb_path = r"d:\ANTIGRAVITY\EDUVERSE_3D\client\public\models\student_character.glb"

# Save .blend
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Saved Blender file: {blend_path}")

# Export GLB with animations, armature, skins
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=False,
    export_apply=False,
    export_animations=True,
    export_anim_slide_to_zero=True,
    export_nla_strips=True,
    export_skins=True,
    export_morph=False
)
print(f"Exported GLB: {glb_path}")

# Copy to client/public/models/
shutil.copyfile(glb_path, client_glb_path)
print(f"Copied to Client: {client_glb_path}")
print("ALL DONE SUCCESSFULLY!")
