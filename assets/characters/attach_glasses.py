import math
import os
import bpy
import bmesh
from mathutils import Matrix, Vector

INPUT_GLB = os.getenv('GLASSES_INPUT_GLB', 'assets/characters/tourist_tshirt_packed.glb')
OUTPUT_GLB = os.getenv('GLASSES_OUTPUT_GLB', 'assets/web-models/tourist_tshirt_glasses.glb')
PREVIEW_PREFIX = os.getenv(
    'GLASSES_PREVIEW_PREFIX',
    '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_tshirt_glasses',
)
EYE_Z_OVERRIDE = os.getenv('GLASSES_EYE_Z')

PREVIEW_CLOSEUP = f'{PREVIEW_PREFIX}_closeup.png'
PREVIEW_SIDE = f'{PREVIEW_PREFIX}_side.png'
PREVIEW_FULL = f'{PREVIEW_PREFIX}_full.png'
PREVIEW_BACK = f'{PREVIEW_PREFIX}_back.png'


def measure_face_landmarks(mesh_obj):
    """Measure exact REST-pose nose bridge, eye Z, skull side clearance, and ear position."""
    mw = mesh_obj.matrix_world
    head_pts = [mw @ v.co for v in mesh_obj.data.vertices if (mw @ v.co).z > 1.48]

    bridge_pts = [p for p in head_pts if abs(p.x) < 0.012 and 1.56 <= p.z <= 1.59]
    bridge_y = min(p.y for p in bridge_pts) if bridge_pts else -0.180

    # Eye socket centers around |x| in [0.026, 0.042]
    eye_pts = [p for p in head_pts if 0.026 <= abs(p.x) <= 0.042 and 1.55 <= p.z <= 1.585]
    eye_y = min(p.y for p in eye_pts) if eye_pts else bridge_y + 0.008

    # Ear upper attachment around extreme |x| > 0.076, excluding spiky hair above z=1.60
    ear_pts = [p for p in head_pts if abs(p.x) > 0.076 and 1.53 <= p.z <= 1.595]
    if ear_pts:
        ear_y = sum(p.y for p in ear_pts) / len(ear_pts)
        ear_x = sorted(abs(p.x) for p in ear_pts)[int(len(ear_pts) * 0.72)]
    else:
        ear_y, ear_x = bridge_y + 0.125, 0.082

    # Default eye_z: either explicit override or 10mm below measured ear max Z / eye crease
    eye_z = float(EYE_Z_OVERRIDE) if EYE_Z_OVERRIDE else 1.5655

    def max_skull_x_near_y(y_val):
        sl = [abs(p.x) for p in head_pts if abs(p.y - y_val) < 0.012 and (eye_z - 0.015) <= p.z <= (eye_z + 0.025)]
        return max(sl) if sl else 0.070

    return {
        'bridge_y': bridge_y,
        'eye_y': eye_y,
        'eye_z': eye_z,
        'ear_y': ear_y,
        'ear_x': ear_x,
        'max_skull_x_near_y': max_skull_x_near_y,
    }


def build_rounded_rect_loop(cx, cz, hw, hh, radius, n_per_corner=6):
    pts = []
    r = min(radius, hw * 0.85, hh * 0.85)
    corners = [
        (cx + hw - r, cz + hh - r, 0.0, math.pi * 0.5),
        (cx - hw + r, cz + hh - r, math.pi * 0.5, math.pi),
        (cx - hw + r, cz - hh + r, math.pi, math.pi * 1.5),
        (cx + hw - r, cz - hh + r, math.pi * 1.5, math.pi * 2.0),
    ]
    for acx, acz, a0, a1 in corners:
        for i in range(n_per_corner):
            ang = a0 + (a1 - a0) * (i / n_per_corner)
            pts.append((acx + math.cos(ang) * r, acz + math.sin(ang) * r))
    return pts


def make_beveled_curve(name, points_3d, depth, resolution, mat, cyclic=False, bevel_res=3):
    curve_data = bpy.data.curves.new(name=name + '_Curve', type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.resolution_u = resolution
    curve_data.bevel_depth = depth
    curve_data.bevel_resolution = bevel_res
    curve_data.use_fill_caps = True

    spline = curve_data.splines.new('POLY')
    spline.points.add(len(points_3d) - 1)
    for i, (x, y, z) in enumerate(points_3d):
        spline.points[i].co = (x, y, z, 1.0)
    spline.use_cyclic_u = cyclic

    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    mesh_obj = bpy.context.active_object
    mesh_obj.select_set(False)
    return mesh_obj


def make_lens_mesh(name, rim_pts_3d, mat):
    mesh = bpy.data.meshes.new(name + '_Mesh')
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    verts = [bm.verts.new(p) for p in rim_pts_3d]
    cx = sum(p[0] for p in rim_pts_3d) / len(rim_pts_3d)
    cy = sum(p[1] for p in rim_pts_3d) / len(rim_pts_3d) - 0.0012
    cz = sum(p[2] for p in rim_pts_3d) / len(rim_pts_3d)
    c_vert = bm.verts.new((cx, cy, cz))
    for i in range(len(verts)):
        v0 = verts[i]
        v1 = verts[(i + 1) % len(verts)]
        bm.faces.new((c_vert, v0, v1))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj.data.materials.append(mat)
    return obj


def create_materials():
    mat_frame = bpy.data.materials.new('MAT_Glasses_Frame')
    mat_frame.use_nodes = True
    bsdf = mat_frame.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (0.02, 0.024, 0.032, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.22
    bsdf.inputs['Roughness'].default_value = 0.20

    mat_hinge = bpy.data.materials.new('MAT_Glasses_Metal')
    mat_hinge.use_nodes = True
    bsdf_m = mat_hinge.node_tree.nodes.get('Principled BSDF')
    bsdf_m.inputs['Base Color'].default_value = (0.78, 0.82, 0.88, 1.0)
    bsdf_m.inputs['Metallic'].default_value = 0.92
    bsdf_m.inputs['Roughness'].default_value = 0.18

    mat_lens = bpy.data.materials.new('MAT_Glasses_Lens')
    mat_lens.use_nodes = True
    bsdf_l = mat_lens.node_tree.nodes.get('Principled BSDF')
    bsdf_l.inputs['Base Color'].default_value = (0.88, 0.95, 1.0, 1.0)
    bsdf_l.inputs['Metallic'].default_value = 0.04
    bsdf_l.inputs['Roughness'].default_value = 0.03
    bsdf_l.inputs['Alpha'].default_value = 0.13
    if hasattr(mat_lens, 'blend_method'):
        mat_lens.blend_method = 'BLEND'

    return mat_frame, mat_hinge, mat_lens


def build_eyeglasses(arm, mesh_obj):
    lm = measure_face_landmarks(mesh_obj)
    bridge_y = lm['bridge_y']
    eye_z = lm['eye_z']
    ear_y = lm['ear_y']
    ear_x = max(0.078, min(0.085, lm['ear_x'] - 0.004))
    skull_x = lm['max_skull_x_near_y']

    print(
        f'📐 Calibrated landmarks: bridge_y={bridge_y:.4f}, eye_z={eye_z:.4f}, '
        f'ear_y={ear_y:.4f}, ear_x={ear_x:.4f}'
    )

    frame_front_y = bridge_y - 0.0050

    def frame_y_at_x(abs_x):
        t = max(0.0, (abs_x - 0.012) / 0.056)
        return frame_front_y + 0.0105 * (t ** 1.45)

    mat_frame, mat_hinge, mat_lens = create_materials()
    parts = []

    for sign in (-1.0, 1.0):
        cx = sign * 0.0355
        cz = eye_z
        loop_2d = build_rounded_rect_loop(cx, cz, hw=0.0220, hh=0.0138, radius=0.0052, n_per_corner=6)
        rim_3d = []
        for x, z in loop_2d:
            z_adj = z + (abs(x) - 0.0355) * 0.045
            y = frame_y_at_x(abs(x))
            rim_3d.append((x, y, z_adj))

        rim_obj = make_beveled_curve(f'Rim_{sign}', rim_3d, depth=0.0017, resolution=8, mat=mat_frame, cyclic=True)
        lens_obj = make_lens_mesh(f'Lens_{sign}', rim_3d, mat=mat_lens)
        parts.extend([rim_obj, lens_obj])

        outer_x = sign * 0.0575
        outer_y = frame_y_at_x(abs(outer_x))
        hinge_y = outer_y + 0.0045
        hinge_x = sign * max(0.0655, skull_x(hinge_y) + 0.005)
        arm_z = eye_z + 0.0070

        endpiece = make_beveled_curve(
            f'Endpiece_{sign}',
            [
                (outer_x, outer_y, arm_z),
                (sign * ((abs(outer_x) + abs(hinge_x)) * 0.5), outer_y + 0.001, arm_z),
                (hinge_x, hinge_y, arm_z),
            ],
            depth=0.0018,
            resolution=6,
            mat=mat_frame,
        )
        parts.append(endpiece)

        hinge_pin = make_beveled_curve(
            f'Hinge_{sign}',
            [(sign * (abs(hinge_x) - 0.0025), hinge_y - 0.0015, arm_z), (hinge_x, hinge_y + 0.0005, arm_z)],
            depth=0.0010,
            resolution=4,
            mat=mat_hinge,
        )
        parts.append(hinge_pin)

        # Sample smooth temple path cleanly clearing the skull down to ear crease!
        y_mid1 = hinge_y + (ear_y - hinge_y) * 0.30
        y_mid2 = hinge_y + (ear_y - hinge_y) * 0.62
        y_mid3 = hinge_y + (ear_y - hinge_y) * 0.86
        x1 = max(abs(hinge_x) + 0.004, skull_x(y_mid1) + 0.005)
        x2 = max(x1 + 0.003, skull_x(y_mid2) + 0.005)
        x3 = max(x2 + 0.002, min(ear_x, skull_x(y_mid3) + 0.004))

        temple_pts = [
            (hinge_x, hinge_y, arm_z),
            (sign * x1, y_mid1, arm_z + 0.0012),
            (sign * x2, y_mid2, arm_z + 0.0020),
            (sign * x3, y_mid3, arm_z + 0.0016),
            (sign * ear_x, ear_y - 0.004, arm_z - 0.0010),
            (sign * (ear_x - 0.001), ear_y + 0.007, arm_z - 0.0115),
            (sign * (ear_x - 0.002), ear_y + 0.014, arm_z - 0.0235),
        ]
        temple_obj = make_beveled_curve(f'Temple_{sign}', temple_pts, depth=0.0014, resolution=10, mat=mat_frame)
        parts.append(temple_obj)

        pad_pts = [
            (sign * 0.0135, frame_front_y + 0.001, eye_z + 0.0015),
            (sign * 0.0102, bridge_y + 0.0005, eye_z - 0.0015),
        ]
        pad_obj = make_beveled_curve(f'NosePad_{sign}', pad_pts, depth=0.0010, resolution=4, mat=mat_hinge)
        parts.append(pad_obj)

    bridge_pts = [
        (-0.0140, frame_y_at_x(0.0140), eye_z + 0.0065),
        (-0.0072, frame_front_y - 0.0010, eye_z + 0.0090),
        (0.0000, frame_front_y - 0.0015, eye_z + 0.0096),
        (0.0072, frame_front_y - 0.0010, eye_z + 0.0090),
        (0.0140, frame_y_at_x(0.0140), eye_z + 0.0065),
    ]
    bridge_obj = make_beveled_curve('Bridge', bridge_pts, depth=0.0018, resolution=10, mat=mat_frame)
    parts.append(bridge_obj)

    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    glasses_obj = bpy.context.active_object
    glasses_obj.name = 'Eyeglasses'
    glasses_obj.data.name = 'Eyeglasses_Mesh'

    for poly in glasses_obj.data.polygons:
        poly.use_smooth = True

    inv_arm = arm.matrix_world.inverted() @ glasses_obj.matrix_world
    for v in glasses_obj.data.vertices:
        v.co = inv_arm @ v.co
    glasses_obj.data.update()

    glasses_obj.parent = arm
    glasses_obj.matrix_parent_inverse = Matrix.Identity(4)
    glasses_obj.location = (0.0, 0.0, 0.0)
    glasses_obj.rotation_euler = (0.0, 0.0, 0.0)
    glasses_obj.scale = (1.0, 1.0, 1.0)

    vg = glasses_obj.vertex_groups.new(name='Head')
    vg.add([v.index for v in glasses_obj.data.vertices], 1.0, 'REPLACE')

    mod = glasses_obj.modifiers.new(name='Armature', type='ARMATURE')
    mod.object = arm
    return glasses_obj


def render_previews(arm):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900

    world = bpy.data.worlds.new('StudioWorld')
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs[0].default_value = (0.07, 0.10, 0.16, 1.0)
        bg.inputs[1].default_value = 0.85

    lights = []
    for lname, loc, rot, energy in [
        ('KeyLight', (1.2, -1.8, 2.2), (math.radians(58), 0, math.radians(32)), 140),
        ('FillLight', (-1.4, -1.6, 1.6), (math.radians(70), 0, math.radians(-38)), 70),
        ('RimLight', (0.0, 1.8, 2.0), (math.radians(-55), 0, math.radians(180)), 110),
    ]:
        ldata = bpy.data.lights.new(lname, type='AREA')
        ldata.energy = energy
        ldata.size = 1.6
        lobj = bpy.data.objects.new(lname, ldata)
        scene.collection.objects.link(lobj)
        lobj.location = loc
        lobj.rotation_euler = rot
        lights.append(lobj)

    arm.data.pose_position = 'POSE'
    scene.frame_set(1)
    bpy.context.view_layer.update()

    depsgraph = bpy.context.evaluated_depsgraph_get()
    glasses_eval = bpy.data.objects['Eyeglasses'].evaluated_get(depsgraph)
    g_mw = glasses_eval.matrix_world
    g_pts = [g_mw @ v.co for v in glasses_eval.data.vertices]
    face_target = Vector((
        sum(p.x for p in g_pts) / len(g_pts),
        sum(p.y for p in g_pts) / len(g_pts) - 0.02,
        sum(p.z for p in g_pts) / len(g_pts) - 0.01,
    ))
    char_eval = bpy.data.objects['char1'].evaluated_get(depsgraph)
    c_mw = char_eval.matrix_world
    c_pts = [c_mw @ v.co for v in char_eval.data.vertices]
    body_center = Vector((
        0.5 * (min(p.x for p in c_pts) + max(p.x for p in c_pts)),
        0.5 * (min(p.y for p in c_pts) + max(p.y for p in c_pts)),
        0.5 * (min(p.z for p in c_pts) + max(p.z for p in c_pts)),
    ))

    cam_data = bpy.data.cameras.new('PreviewCam')
    cam = bpy.data.objects.new('PreviewCam', cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    def aim_cam(loc, target, lens=55):
        cam_data.lens = lens
        cam.location = Vector(loc)
        direction = Vector(target) - Vector(loc)
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    aim_cam(face_target + Vector((0.06, -0.52, -0.04)), face_target, lens=78)
    scene.render.filepath = PREVIEW_CLOSEUP
    bpy.ops.render.render(write_still=True)

    aim_cam(face_target + Vector((0.40, -0.26, -0.02)), face_target + Vector((0.0, 0.03, 0.0)), lens=78)
    scene.render.filepath = PREVIEW_SIDE
    bpy.ops.render.render(write_still=True)

    aim_cam(body_center + Vector((0.75, -2.95, 0.25)), body_center, lens=45)
    scene.render.filepath = PREVIEW_FULL
    bpy.ops.render.render(write_still=True)

    aim_cam(body_center + Vector((-0.85, 2.85, 0.30)), body_center, lens=45)
    scene.render.filepath = PREVIEW_BACK
    bpy.ops.render.render(write_still=True)

    bpy.data.objects.remove(cam, do_unlink=True)
    for lobj in lights:
        bpy.data.objects.remove(lobj, do_unlink=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=INPUT_GLB)

    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    mesh_obj = [o for o in bpy.data.objects if o.type == 'MESH' and o.name == 'char1'][0]
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()

    build_eyeglasses(arm, mesh_obj)
    render_previews(arm)

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format='GLB',
        use_selection=False,
        use_visible=True,
        export_materials='EXPORT',
        export_animations=True,
        export_animation_mode='ACTIONS',
        export_skins=True,
        export_all_influences=True,
    )
    print('✅ Exported HQ character with auto-calibrated 3D Glasses:', OUTPUT_GLB)


if __name__ == '__main__':
    main()
