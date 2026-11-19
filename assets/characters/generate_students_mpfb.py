"""
Dựng 4 mẫu nhân vật học sinh Việt Nam (Tiểu học Nam/Nữ có khăn quàng đỏ & THCS Nam/Nữ)
cho Phân hiệu Vĩnh Trung bằng Blender 5.3 + MPFB2 v2.0.18 (MakeHuman CC0):
  - Mặt, tai, cổ, mắt (low-poly.mhclo), cẳng tay, bàn tay 5 ngón & cẳng chân lấy trực tiếp
    từ lưới MPFB2 tỷ lệ người Châu Á theo đúng độ tuổi Tiểu học / THCS.
  - Áo sơ mi trắng cổ bâu cộc tay, khăn quàng đỏ, quần soóc/váy xếp ly/quần âu, dép quai hậu/giày,
    tóc 3D, lông mày & ba lô (tách object Student_Backpack để ẩn khi ngồi ghế lớp học).
  - Bộ xương 18 khớp chuẩn & 5 clip hoạt ảnh: Idle, Walk, Run, Sit, RaiseHand.

Chạy:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python assets/characters/generate_students_mpfb.py -- --preview
"""

import argparse
import importlib
import math
from math import cos, pi, radians, sin
from pathlib import Path
import shutil
import sys

import addon_utils
import bmesh
import bpy
from mathutils import Euler, Matrix, Vector


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
WEB_MODELS = ROOT / "assets" / "web-models"
CACHE_DIR = Path.home() / ".cache" / "eduverse_mpfb"
LOCAL_TEX_DIR = CACHE_DIR / "local_textures"
EYE_MHCLO = CACHE_DIR / "mh2" / "data" / "eyes" / "hm08" / "low-poly" / "low-poly.mhclo"
EXTENSION_ID = "bl_ext.user_default.mpfb"
PREVIEW_DIR = Path("/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/scratch")

# Thông số 4 mẫu học sinh chuẩn Phân hiệu Vĩnh Trung
STUDENT_SPECS = [
    {
        "id": "student_primary_boy",
        "label": "Tiểu học Nam",
        "gender": 1.0,
        "age": 0.24,
        "height": 0.48,
        "muscle": 0.36,
        "weight": 0.45,
        "target_h": 1.32,
        "skin_tint": "#F4DEC9",
        "hair_style": "boy_short",
        "hair_color": "#1E1917",
        "scarf": True,
        "bottom": "shorts",
        "bottom_color": "#1C294A",
        "shoes": "sandals",
        "shoe_color": "#262F40",
        "pack_color": "#2D64A8",
        "pack_trim": "#1E3F6E",
        "tie_color": "#C62828",
    },
    {
        "id": "student_primary_girl",
        "label": "Tiểu học Nữ",
        "gender": 0.0,
        "age": 0.23,
        "height": 0.45,
        "muscle": 0.30,
        "weight": 0.44,
        "target_h": 1.28,
        "skin_tint": "#F8E5D4",
        "hair_style": "girl_ponytail",
        "hair_color": "#1B1615",
        "scarf": True,
        "bottom": "pleated_skirt",
        "bottom_color": "#1C294A",
        "shoes": "sandals",
        "shoe_color": "#383044",
        "pack_color": "#D45D79",
        "pack_trim": "#96364E",
        "tie_color": "#D32F2F",
    },
    {
        "id": "student_mid_boy",
        "label": "THCS Nam",
        "gender": 1.0,
        "age": 0.38,
        "height": 0.52,
        "muscle": 0.46,
        "weight": 0.46,
        "target_h": 1.56,
        "skin_tint": "#F1D7C0",
        "hair_style": "boy_parted",
        "hair_color": "#1D1816",
        "scarf": False,
        "bottom": "trousers",
        "bottom_color": "#17223B",
        "shoes": "sneakers",
        "shoe_color": "#272E3B",
        "pack_color": "#384654",
        "pack_trim": "#212A34",
        "tie_color": "#1E3A8A",
    },
    {
        "id": "student_mid_girl",
        "label": "THCS Nữ",
        "gender": 0.0,
        "age": 0.37,
        "height": 0.50,
        "muscle": 0.34,
        "weight": 0.44,
        "target_h": 1.51,
        "skin_tint": "#F7E4D3",
        "hair_style": "girl_bob",
        "hair_color": "#1B1615",
        "scarf": False,
        "bottom": "trousers",
        "bottom_color": "#17223B",
        "shoes": "sneakers",
        "shoe_color": "#2F3640",
        "pack_color": "#2E7D78",
        "pack_trim": "#1E5653",
        "tie_color": "#C62828",
    },
]


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(hex_color):
    h = hex_color.lstrip("#")
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)


def make_mat(name, hex_color, roughness=0.68, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    rgba = hex_rgba(hex_color)
    mat.diffuse_color = rgba
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def make_textured_mat(name, tex_path, tint=None, roughness=0.62, tex_max=512):
    mat = make_mat(name, tint or "#FFFFFF", roughness=roughness)
    if not Path(tex_path).exists():
        return mat
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    img = bpy.data.images.load(str(tex_path), check_existing=True)
    if max(img.size) > tex_max:
        ratio = tex_max / max(img.size)
        img.scale(max(64, round(img.size[0] * ratio)), max(64, round(img.size[1] * ratio)))
    img.pack()
    tex_node = mat.node_tree.nodes.new("ShaderNodeTexImage")
    tex_node.image = img
    color_out = tex_node.outputs["Color"]
    if tint:
        mix = mat.node_tree.nodes.new("ShaderNodeMixRGB")
        mix.blend_type = "MULTIPLY"
        mix.inputs[0].default_value = 1.0
        mix.inputs[2].default_value = hex_rgba(tint)
        mat.node_tree.links.new(color_out, mix.inputs[1])
        color_out = mix.outputs["Color"]
    mat.node_tree.links.new(color_out, bsdf.inputs["Base Color"])
    return mat


def ensure_local_textures():
    """Bảo đảm có sẵn ảnh CC0 MakeHuman tách từ tourist_mpfb.blend nếu chưa giải nén."""
    LOCAL_TEX_DIR.mkdir(parents=True, exist_ok=True)
    needed = ["brown_eye.png", "young_lightskinned_male_diffuse3.png"]
    if all((LOCAL_TEX_DIR / f).exists() for f in needed):
        return
    src_blend = HERE / "tourist_mpfb.blend"
    if not src_blend.exists():
        return
    with bpy.data.libraries.load(str(src_blend), link=False) as (data_from, data_to):
        data_to.images = [n for n in data_from.images if n in needed]
    for img in list(bpy.data.images):
        if img.name in needed and img.packed_file:
            p = LOCAL_TEX_DIR / img.name
            img.filepath_raw = str(p)
            img.file_format = "PNG"
            img.save()
        bpy.data.images.remove(img)


def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def smooth_shade(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True


def set_group(obj, weights):
    for gname, w in weights.items():
        vg = obj.vertex_groups.get(gname) or obj.vertex_groups.new(name=gname)
        vg.add(list(range(len(obj.data.vertices))), w, "REPLACE")


def create_mesh_obj(name, verts, faces, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    smooth_shade(obj)
    return obj


def direction_basis(direction, spread):
    axis = direction.normalized()
    across = (spread - axis * spread.dot(axis)).normalized()
    return Matrix((across, axis.cross(across), axis)).transposed()


def hand_basis(source_rig, suffix):
    hand = source_rig.data.bones[f"hand_{suffix}"]
    index = source_rig.data.bones[f"index_01_{suffix}"].head_local
    pinky = source_rig.data.bones[f"pinky_01_{suffix}"].head_local
    basis = direction_basis(hand.tail_local - hand.head_local, index - pinky)
    thumb = source_rig.data.bones[f"thumb_02_{suffix}"].head_local
    palm_sign = 1 if (thumb - hand.head_local).dot(basis.col[1]) > 0 else -1
    return hand.head_local, basis, palm_sign


def pose_mpfb_source_rig(source_rig):
    """Đưa phôi MPFB từ dáng A rộng về dáng đứng tự nhiên (tay khép nhẹ ~15°, ngón thả lỏng)."""
    # 1. Thả lỏng 5 ngón tay
    curves = {
        "index": (10, 18, 9), "middle": (12, 22, 12), "ring": (16, 24, 14),
        "pinky": (22, 27, 15), "thumb": (6, 12, 6),
    }
    for side in ("l", "r"):
        _, basis, palm_sign = hand_basis(source_rig, side)
        palm = basis.col[1] * palm_sign
        for digit, angles in curves.items():
            for joint, angle in enumerate(angles, start=1):
                pbone = source_rig.pose.bones[f"{digit}_{joint:02d}_{side}"]
                rest = pbone.bone
                direction = (rest.tail_local - rest.head_local).normalized()
                inward = (palm - direction * palm.dot(direction)).normalized()
                flex = radians(angle)
                bend = direction * cos(flex) + inward * sin(flex)
                if joint == 1:
                    bend = bend.lerp(basis.col[2], 0.35 if digit == "thumb" else 0.18).normalized()
                rot = direction.rotation_difference(bend)
                local_axes = rest.matrix_local.to_quaternion()
                pbone.rotation_mode = "QUATERNION"
                pbone.rotation_quaternion = local_axes.inverted() @ rot @ local_axes

    # 2. Khép nhẹ cánh tay (~26° vào thân) & chỉnh cẳng chân đứng thẳng tự nhiên
    for side, sign in (("l", 1), ("r", -1)):
        ua = source_rig.pose.bones[f"upperarm_{side}"]
        ua_dir = (ua.bone.tail_local - ua.bone.head_local).normalized()
        target_ua = Vector((sign * 0.22, 0.02, -0.975)).normalized()
        ua_rot = ua_dir.rotation_difference(target_ua)
        q_ua = ua.bone.matrix_local.to_quaternion()
        ua.rotation_mode = "QUATERNION"
        ua.rotation_quaternion = q_ua.inverted() @ ua_rot @ q_ua

        la = source_rig.pose.bones[f"lowerarm_{side}"]
        la_dir = (la.bone.tail_local - la.bone.head_local).normalized()
        target_la = Vector((sign * 0.06, -0.14, -0.988)).normalized()
        world_la_cur = ua_rot @ la_dir
        la_rot = world_la_cur.rotation_difference(target_la)
        q_la = (ua_rot @ la.bone.matrix_local.to_quaternion())
        la.rotation_mode = "QUATERNION"
        la.rotation_quaternion = q_la.inverted() @ la_rot @ q_la

        th = source_rig.pose.bones[f"thigh_{side}"]
        th_dir = (th.bone.tail_local - th.bone.head_local).normalized()
        target_th = Vector((0.0, 0.0, -1.0))
        th_rot = th_dir.rotation_difference(target_th)
        q_th = th.bone.matrix_local.to_quaternion()
        th.rotation_mode = "QUATERNION"
        th.rotation_quaternion = q_th.inverted() @ th_rot @ q_th

        cf = source_rig.pose.bones[f"calf_{side}"]
        cf_dir = (cf.bone.tail_local - cf.bone.head_local).normalized()
        world_cf_cur = th_rot @ cf_dir
        target_cf = Vector((0.0, 0.0, -1.0))
        cf_rot = world_cf_cur.rotation_difference(target_cf)
        q_cf = (th_rot @ cf.bone.matrix_local.to_quaternion())
        cf.rotation_mode = "QUATERNION"
        cf.rotation_quaternion = q_cf.inverted() @ cf_rot @ q_cf

    bpy.context.view_layer.update()


def copy_posed_bone_points(source_rig):
    """Đọc tọa độ khớp thật (trong không gian đã xoay +Y về phía trước & chuẩn hóa chân chạm Z=0)."""
    pts = {}
    for b in source_rig.pose.bones:
        # source_rig ở tư thế MPFB gốc (-Y forward) -> xoay 180° Z: (x, y, z) -> (-x, -y, z)
        h = source_rig.matrix_world @ b.head
        t = source_rig.matrix_world @ b.tail
        pts[b.name] = (Vector((-h.x, -h.y, h.z)), Vector((-t.x, -t.y, t.z)))
    return pts


def extract_clean_mpfb_student(spec):
    """Sinh người Châu Á bằng MPFB2 + mắt + skin thật, chỉnh dáng đứng +Y, chuẩn hóa chiều cao."""
    addon_utils.enable(EXTENSION_ID, default_set=True)
    human_mod = importlib.import_module(f"{EXTENSION_ID}.services.humanservice")
    target_mod = importlib.import_module(f"{EXTENSION_ID}.services.targetservice")
    loc_mod = importlib.import_module(f"{EXTENSION_ID}.services.locationservice")
    hs = human_mod.HumanService
    ts = target_mod.TargetService

    settings = ts.get_default_macro_info_dict()
    settings.update(
        gender=spec["gender"],
        age=spec["age"],
        muscle=spec["muscle"],
        weight=spec["weight"],
        height=spec["height"],
    )
    settings["race"] = {"asian": 1.0, "caucasian": 0.0, "african": 0.0}
    body = hs.create_human(macro_detail_dict=settings)

    smile = Path(loc_mod.LocationService.get_mpfb_data("targets")) / "expression/units/asian/mouth-corner-puller.target.gz"
    if smile.exists():
        ts.load_target(body, str(smile), weight=0.22)

    source_rig = hs.add_builtin_rig(body, "game_engine")

    eyes_obj = None
    if EYE_MHCLO.exists():
        eyes_obj = hs.add_mhclo_asset(str(EYE_MHCLO), body, asset_type="Eyes", subdiv_levels=0, set_up_rigging=False)

    activate(body)
    bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    for mod in tuple(body.modifiers):
        if mod.type == "MASK":
            bpy.ops.object.modifier_apply(modifier=mod.name)

    pose_mpfb_source_rig(source_rig)
    bone_pts = copy_posed_bone_points(source_rig)

    for obj_item in ([body, eyes_obj] if eyes_obj else [body]):
        activate(obj_item)
        for mod in tuple(obj_item.modifiers):
            if mod.type == "ARMATURE":
                bpy.ops.object.modifier_apply(modifier=mod.name)

    # Giữ duy nhất lưới cơ thể thật (xóa HelperGeometry / JointCubes / helper-* / genitals)
    if "body" in body.vertex_groups:
        body_vg = body.vertex_groups["body"].index
        helper_indices = set()
        for hname in ("HelperGeometry", "JointCubes", "helper-genital", "helper-hair",
                      "helper-skirt", "helper-tights", "helper-tongue", "helper-upper-teeth",
                      "helper-lower-teeth", "helper-l-eye", "helper-r-eye",
                      "helper-l-eyelashes-1", "helper-l-eyelashes-2",
                      "helper-r-eyelashes-1", "helper-r-eyelashes-2", "genitals"):
            if hname in body.vertex_groups:
                helper_indices.add(body.vertex_groups[hname].index)
        activate(body)
        bm = bmesh.new()
        bm.from_mesh(body.data)
        to_del = []
        for v in bm.verts:
            groups = {g.group for g in body.data.vertices[v.index].groups if g.weight > 0.01}
            if body_vg not in groups or (groups & helper_indices and "lips" not in [
                body.vertex_groups[g].name for g in groups if g < len(body.vertex_groups)
            ]):
                if body_vg not in groups:
                    to_del.append(v)
        if to_del:
            bmesh.ops.delete(bm, geom=to_del, context="VERTS")
            bm.to_mesh(body.data)
        bm.free()

    # Đọc giới hạn đầu, mắt, chân trước khi xoay & scale
    for ob in ([body, eyes_obj] if eyes_obj else [body]):
        ob.parent = None
        for mod in tuple(ob.modifiers):
            ob.modifiers.remove(mod)
        for v in ob.data.vertices:
            v.co = Vector((-v.co.x, -v.co.y, v.co.z))
        ob.data.update()

    # Chuẩn hóa chạm đất Z=0 và đúng target_h thực tế
    min_z = min(v.co.z for v in body.data.vertices)
    max_z = max(v.co.z for v in body.data.vertices)
    cur_h = max(0.5, max_z - min_z)
    scale_f = spec["target_h"] / cur_h

    def norm_pt(v):
        return Vector((v.x * scale_f, v.y * scale_f, (v.z - min_z) * scale_f))

    for ob in ([body, eyes_obj] if eyes_obj else [body]):
        for v in ob.data.vertices:
            v.co = norm_pt(v.co)
        ob.data.update()

    scaled_pts = {k: (norm_pt(h), norm_pt(t)) for k, (h, t) in bone_pts.items()}
    bpy.data.objects.remove(source_rig, do_unlink=True)

    # Gán chất liệu da & mắt thật
    skin_mat = make_textured_mat("MAT_Skin", LOCAL_TEX_DIR / "young_lightskinned_male_diffuse3.png", tint=spec["skin_tint"], roughness=0.66, tex_max=512)
    body.data.materials.clear()
    body.data.materials.append(skin_mat)
    smooth_shade(body)

    if eyes_obj:
        eye_mat = make_textured_mat("MAT_Eyes", LOCAL_TEX_DIR / "brown_eye.png", roughness=0.22, tex_max=256)
        eyes_obj.data.materials.clear()
        eyes_obj.data.materials.append(eye_mat)
        smooth_shade(eyes_obj)
        eyes_obj.name = f"{spec['id']}_Eyes"

    body.name = f"{spec['id']}_BodyRef"
    return body, eyes_obj, scaled_pts


def remap_mpfb_vgroups_to_student_rig(obj):
    """Ánh xạ vertex groups của MPFB game_engine (sau xoay 180° Z) sang 18 khớp Student_Rig."""
    # Lưu ý: sau khi xoay (-x, -y, z), cánh trái MPFB (_l ở +X cũ) thành bên PHẢI (-X mới, .R)
    # và cánh phải MPFB (_r ở -X cũ) thành bên TRÁI (+X mới, .L).
    mapping = {
        "pelvis": "hips",
        "spine_01": "spine",
        "spine_02": "spine",
        "spine_03": "chest",
        "clavicle_l": "chest",
        "clavicle_r": "chest",
        "neck_01": "neck",
        "head": "head",
        "upperarm_r": "upper_arm.L",
        "lowerarm_r": "forearm.L",
        "hand_r": "hand.L",
        "upperarm_l": "upper_arm.R",
        "lowerarm_l": "forearm.R",
        "hand_l": "hand.R",
        "thigh_r": "thigh.L",
        "calf_r": "shin.L",
        "foot_r": "foot.L",
        "ball_r": "foot.L",
        "thigh_l": "thigh.R",
        "calf_l": "shin.R",
        "foot_l": "foot.R",
        "ball_l": "foot.R",
    }
    for side, target_side in (("r", "L"), ("l", "R")):
        for digit in ("index", "middle", "ring", "pinky", "thumb"):
            for j in ("01", "02", "03"):
                mapping[f"{digit}_{j}_{side}"] = f"hand.{target_side}"

    per_vert = [{} for _ in range(len(obj.data.vertices))]
    vgroups = obj.vertex_groups
    for v in obj.data.vertices:
        acc = per_vert[v.index]
        for g in v.groups:
            if g.weight <= 1e-4:
                continue
            gname = vgroups[g.group].name
            tgt = mapping.get(gname)
            if tgt:
                acc[tgt] = acc.get(tgt, 0.0) + g.weight
        tot = sum(acc.values())
        if tot > 0:
            for k in acc:
                acc[k] /= tot
        else:
            acc["hips"] = 1.0

    obj.vertex_groups.clear()
    created = {}
    for vi, acc in enumerate(per_vert):
        for bname, w in acc.items():
            vg = created.get(bname)
            if vg is None:
                vg = obj.vertex_groups.new(name=bname)
                created[bname] = vg
            vg.add([vi], w, "REPLACE")


def clone_body_shell(body_ref, name, vert_mask_fn, push_fn, mat):
    """Tách áo/quần trực tiếp từ phôi giải phẫu MPFB2, lọc sạch mặt rìa lỏng để viền mịn."""
    mesh = body_ref.data.copy()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    keep_set = {v.index for v in bm.verts if vert_mask_fn(v.index, v.co)}
    to_del = [v for v in bm.verts if v.index not in keep_set]
    bmesh.ops.delete(bm, geom=to_del, context="VERTS")
    # Xóa các đỉnh rời hoặc mảnh tam giác lòi 1 cạnh làm răng cưa gấu quần/ống tay
    for _ in range(2):
        stray = [v for v in bm.verts if len(v.link_faces) <= 1]
        if not stray:
            break
        bmesh.ops.delete(bm, geom=stray, context="VERTS")
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * push_fn(v.co)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.0004)
    bm.to_mesh(obj.data)
    bm.free()

    obj.data.materials.clear()
    obj.data.materials.append(mat)
    smooth_shade(obj)
    return obj


def build_group_lookup(obj, prefixes):
    """Tập index các vertex có trọng số thuộc danh sách prefix xương MPFB."""
    vg_ids = {
        vg.index
        for vg in obj.vertex_groups
        if any(vg.name.startswith(p) for p in prefixes)
    }
    matched = set()
    for v in obj.data.vertices:
        if any(g.group in vg_ids and g.weight > 0.02 for g in v.groups):
            matched.add(v.index)
    return matched


def extract_visible_skin_only(body_ref, pants_cutoff_z, neck_min_z, arm_cut_dist, shoulder_pts, torso_max_x):
    """Loại bỏ phần da nằm hoàn toàn bên trong áo và quần để tối ưu & không lộ da qua áo."""
    bm = bmesh.new()
    bm.from_mesh(body_ref.data)
    bm.verts.ensure_lookup_table()
    to_del = []
    sh_l, dir_l = shoulder_pts["L"]
    sh_r, dir_r = shoulder_pts["R"]
    for v in bm.verts:
        co = v.co
        is_head_neck = co.z >= neck_min_z
        # Chồng lấn sâu hơn vào trong gấu quần/váy & ống tay áo để không hở khe rỗng ở mọi góc
        is_lower_leg = co.z <= pants_cutoff_z + 0.075
        along_l = (co - sh_l).dot(dir_l)
        along_r = (co - sh_r).dot(dir_r)
        is_forearm_hand = (co.x > torso_max_x and along_l >= arm_cut_dist - 0.035) or (
            co.x < -torso_max_x and along_r >= arm_cut_dist - 0.035
        )
        if not (is_head_neck or is_forearm_hand or is_lower_leg):
            to_del.append(v)
    if to_del:
        bmesh.ops.delete(bm, geom=to_del, context="VERTS")
        bm.to_mesh(body_ref.data)
    bm.free()

    activate(body_ref)
    dec = body_ref.modifiers.new("DecimateSkin", "DECIMATE")
    dec.ratio = 0.72
    bpy.ops.object.modifier_apply(modifier=dec.name)
    smooth_shade(body_ref)


def build_loft(name, rings, mat, gap=0.0, segments=22, weights=None):
    verts, faces = [], []
    for z, cx, cy, rx, ry in rings:
        for i in range(segments):
            ang = gap + (2 * pi - 2 * gap) * i / (segments - 1 if gap else segments)
            verts.append((cx + sin(ang) * rx, cy + cos(ang) * ry, z))
    for r in range(len(rings) - 1):
        for i in range(segments - bool(gap)):
            a = r * segments + i
            b = r * segments + (i + 1) % segments
            faces.append((a, a + segments, b + segments, b))
    if not gap:
        faces.append(tuple(range(segments)))
        faces.append(tuple(reversed(range(len(verts) - segments, len(verts)))))
    obj = create_mesh_obj(name, verts, faces, mat)
    if weights:
        set_group(obj, weights)
    return obj


def build_shirt_details(spec, bone_pts, shirt_obj, mat_shirt, mat_button, mat_scarf, mat_badge):
    """Dựng cổ áo sơ mi trắng bâu gập, hàng cúc, túi áo phù hiệu & khăn quàng đỏ."""
    parts = []
    neck_h = bone_pts["neck_01"][0]
    neck_t = bone_pts["neck_01"][1]
    chest_t = bone_pts["spine_03"][1]
    pelvis_h = bone_pts["pelvis"][0]

    # Tọa độ cổ & ngực lấy trực tiếp từ bề mặt thực tế của ShirtShell
    collar_z = neck_h.z + 0.012
    collar_y = (neck_h.y + neck_t.y) * 0.5
    s = spec["target_h"] / 1.32

    # Cổ áo sơ mi trắng bâu gập mềm tự nhiên đặt vừa chân cổ
    collar_rings = [
        (collar_z - 0.014 * s, 0.0, collar_y - 0.001, 0.056 * s, 0.054 * s),
        (collar_z + 0.014 * s, 0.0, collar_y - 0.002, 0.052 * s, 0.050 * s),
        (collar_z + 0.018 * s, 0.0, collar_y + 0.001, 0.068 * s, 0.064 * s),
        (collar_z - 0.018 * s, 0.0, collar_y + 0.006, 0.075 * s, 0.070 * s),
    ]
    parts.append(build_loft(f"{spec['id']}_Collar", collar_rings, mat_shirt, gap=0.28, segments=22, weights={"chest": 0.72, "neck": 0.28}))

    # Cạp quần/váy ôm gọn ngang hông che kín đường nối áo sơ vin & quần
    waist_verts = [v.co for v in shirt_obj.data.vertices if abs(v.co.z - (pelvis_h.z + 0.030 * s)) < 0.025 and abs(v.co.x) < bone_pts["upperarm_r"][0].x]
    wx = max((abs(v.x) for v in waist_verts), default=0.11 * s) + 0.008 * s
    wy_max = max((v.y for v in waist_verts), default=0.08 * s) + 0.008 * s
    wy_min = min((v.y for v in waist_verts), default=-0.08 * s) - 0.008 * s
    wcy = (wy_max + wy_min) * 0.5
    wry = (wy_max - wy_min) * 0.5
    belt_mat = make_mat(f"{spec['id']}_WaistbandMat", spec["bottom_color"], roughness=0.72)
    belt_rings = [
        (pelvis_h.z + 0.012 * s, 0.0, wcy, wx, wry),
        (pelvis_h.z + 0.044 * s, 0.0, wcy, wx * 0.98, wry * 0.98),
    ]
    parts.append(build_loft(f"{spec['id']}_Waistband", belt_rings, belt_mat, gap=0.0, segments=24, weights={"hips": 0.75, "spine": 0.25}))

    # Đường nẹp áo trước ngực + cúc áo
    chest_front_y = max(v.co.y for v in shirt_obj.data.vertices if abs(v.co.x) < 0.04 and chest_t.z - 0.06 < v.co.z < collar_z)
    placket_z0 = pelvis_h.z + 0.02 * s
    placket_z1 = collar_z - 0.02 * s
    n_h = placket_z1 - placket_z0
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, chest_front_y + 0.002, (placket_z0 + placket_z1) * 0.5))
    placket = bpy.context.object
    placket.name = f"{spec['id']}_Placket"
    placket.scale = (0.022 * s, 0.006 * s, n_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    placket.data.materials.append(mat_shirt)
    smooth_shade(placket)
    parts.append(placket)

    for b_i in range(4):
        bz = placket_z0 + (b_i + 0.6) * (n_h / 4.2)
        local_y = max((v.co.y for v in shirt_obj.data.vertices if abs(v.co.x) < 0.03 and abs(v.co.z - bz) < 0.025), default=chest_front_y)
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.0055 * s, depth=0.005, location=(0.0, local_y + 0.004, bz), rotation=(radians(90), 0, 0))
        btn = bpy.context.object
        btn.name = f"{spec['id']}_Btn_{b_i}"
        btn.data.materials.append(mat_button)
        smooth_shade(btn)
        parts.append(btn)

    # Túi ngực trái + phù hiệu đỏ/xanh nhỏ
    pocket_x = 0.058 * s
    pocket_z = collar_z - 0.105 * s
    pocket_y = max((v.co.y for v in shirt_obj.data.vertices if abs(v.co.x - pocket_x) < 0.03 and abs(v.co.z - pocket_z) < 0.03), default=chest_front_y - 0.01)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pocket_x, pocket_y + 0.003, pocket_z))
    pocket = bpy.context.object
    pocket.name = f"{spec['id']}_Pocket"
    pocket.scale = (0.048 * s, 0.005 * s, 0.056 * s)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    pocket.data.materials.append(mat_shirt)
    parts.append(pocket)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pocket_x, pocket_y + 0.006, pocket_z + 0.006 * s))
    badge = bpy.context.object
    badge.name = f"{spec['id']}_Badge"
    badge.scale = (0.024 * s, 0.004 * s, 0.016 * s)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    badge.data.materials.append(mat_badge)
    parts.append(badge)

    # Khăn quàng đỏ Đội viên (nằm dưới cổ áo trắng ở phía gáy và thắt nút gọn trước ngực)
    if spec["scarf"]:
        sc_rings = [
            (collar_z - 0.018 * s, 0.0, collar_y + 0.002, 0.080 * s, 0.076 * s),
            (collar_z + 0.006 * s, 0.0, collar_y + 0.001, 0.076 * s, 0.072 * s),
        ]
        parts.append(build_loft(f"{spec['id']}_ScarfNeck", sc_rings, mat_scarf, gap=0.22, segments=20, weights={"chest": 0.72, "neck": 0.28}))

        # Lá khăn tam giác phủ sau lưng
        back_y_top = min((v.co.y for v in shirt_obj.data.vertices if abs(v.co.x) < 0.05 and abs(v.co.z - (collar_z - 0.02 * s)) < 0.03), default=-0.075 * s)
        back_y_mid = min((v.co.y for v in shirt_obj.data.vertices if abs(v.co.x) < 0.05 and abs(v.co.z - (collar_z - 0.14 * s)) < 0.03), default=-0.088 * s)
        back_verts = [
            (-0.125 * s, back_y_top - 0.008, collar_z - 0.015 * s),
            (0.0, back_y_top - 0.012, collar_z - 0.010 * s),
            (0.125 * s, back_y_top - 0.008, collar_z - 0.015 * s),
            (0.0, back_y_mid - 0.014, collar_z - 0.175 * s),
        ]
        # Dày nhẹ thành mặt kép không bị nhìn xuyên từ góc thấp
        thick = [Vector((0, 0.004, 0))] * 4
        b_verts = back_verts + [Vector(p) + t for p, t in zip(back_verts, thick)]
        b_faces = [(0, 1, 3), (1, 2, 3), (4, 7, 5), (5, 7, 6), (0, 3, 7, 4), (2, 6, 7, 3)]
        parts.append(create_mesh_obj(f"{spec['id']}_ScarfBack", b_verts, b_faces, mat_scarf))

        # Nút thắt khăn trước ức & hai vạt khăn buông trước ngực
        knot_z = collar_z - 0.040 * s
        knot_y = max((v.co.y for v in shirt_obj.data.vertices if abs(v.co.x) < 0.03 and abs(v.co.z - knot_z) < 0.03), default=chest_front_y) + 0.012
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, location=(0.0, knot_y, knot_z))
        knot = bpy.context.object
        knot.name = f"{spec['id']}_ScarfKnot"
        knot.scale = (0.019 * s, 0.014 * s, 0.018 * s)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        knot.data.materials.append(mat_scarf)
        smooth_shade(knot)
        parts.append(knot)

        for side_s, sx in (("L", 1), ("R", -1)):
            tip_z = knot_z - 0.165 * s
            tip_y = max((v.co.y for v in shirt_obj.data.vertices if abs(v.co.x - sx * 0.025 * s) < 0.03 and abs(v.co.z - (knot_z - 0.10 * s)) < 0.04), default=chest_front_y) + 0.014
            tail_v = [
                (sx * 0.002 * s, knot_y + 0.006, knot_z - 0.005 * s),
                (sx * 0.018 * s, knot_y + 0.004, knot_z - 0.008 * s),
                (sx * 0.044 * s, tip_y + 0.005, tip_z),
                (sx * 0.015 * s, tip_y + 0.008, tip_z - 0.012 * s),
            ]
            t_verts = tail_v + [Vector(p) + Vector((0, -0.005, 0)) for p in tail_v]
            t_faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 3, 7, 4), (1, 5, 6, 2), (2, 6, 7, 3)]
            parts.append(create_mesh_obj(f"{spec['id']}_ScarfTail_{side_s}", t_verts, t_faces, mat_scarf))

    return parts


def build_pleated_skirt(spec, body_ref, bone_pts, mat_skirt):
    """Dựng chân váy xếp ly xanh tím than vừa khít hông học sinh nữ Tiểu học (loại trừ vùng cánh tay)."""
    pelvis_z = bone_pts["pelvis"][0].z
    thigh_z = bone_pts["thigh_l"][0].z
    calf_z = bone_pts["calf_l"][0].z
    torso_max_x = bone_pts["upperarm_r"][0].x - 0.005
    skirt_top = pelvis_z + 0.042
    skirt_bot = thigh_z - (thigh_z - calf_z) * 0.56

    waist_verts = [v.co for v in body_ref.data.vertices if abs(v.co.z - skirt_top) < 0.028 and abs(v.co.x) < torso_max_x]
    rx_top = max((abs(v.x) for v in waist_verts), default=0.105) + 0.014
    ry_min = min((v.y for v in waist_verts), default=-0.075)
    ry_max = max((v.y for v in waist_verts), default=0.075)
    ry_top = (ry_max - ry_min) * 0.5 + 0.014
    cx = 0.0
    cy = (ry_min + ry_max) * 0.5

    n_pleats = 16
    segs = n_pleats * 2
    rows = 4
    verts, faces = [], []
    for r in range(rows):
        t = r / (rows - 1)
        z = skirt_top * (1 - t) + skirt_bot * t
        flare = 1.0 + 0.28 * (t ** 0.85)
        for i in range(segs):
            ang = 2 * pi * i / segs
            pleat_r = (0.007 * t) * (1 if i % 2 == 0 else -0.40)
            vx = cx + sin(ang) * (rx_top * flare + pleat_r)
            vy = cy + cos(ang) * (ry_top * flare + pleat_r)
            verts.append((vx, vy, z))
    for r in range(rows - 1):
        for i in range(segs):
            a = r * segs + i
            b = r * segs + (i + 1) % segs
            faces.append((a, b, b + segs, a + segs))
    skirt_obj = create_mesh_obj(f"{spec['id']}_Skirt", verts, faces, mat_skirt)
    activate(skirt_obj)
    sol = skirt_obj.modifiers.new("SkirtThick", "SOLIDIFY")
    sol.thickness = 0.005
    bpy.ops.object.modifier_apply(modifier=sol.name)
    smooth_shade(skirt_obj)
    return skirt_obj


def build_footwear(spec, body_ref, bone_pts, mat_shoe, mat_sole):
    """Dựng dép quai hậu (Tiểu học) hoặc giày thể thao gọn (THCS) khớp chính xác chân MPFB2."""
    parts = []
    s = spec["target_h"] / 1.32
    for side in ("L", "R"):
        sign = 1 if side == "L" else -1
        # Đo hộp bao chân thực tế phía trái (+X) hoặc phải (-X)
        foot_vs = [v.co for v in body_ref.data.vertices if v.co.z < 0.085 * s and v.co.x * sign > 0.01]
        fx = sum(v.x for v in foot_vs) / max(1, len(foot_vs))
        min_y = min((v.y for v in foot_vs), default=-0.055 * s)
        max_y = max((v.y for v in foot_vs), default=0.145 * s)
        min_x = min((v.x for v in foot_vs), default=fx - 0.036 * s)
        max_x = max((v.x for v in foot_vs), default=fx + 0.036 * s)
        fw = (max_x - min_x) * 0.50 + 0.004
        fl = (max_y - min_y) * 0.51 + 0.005
        fcy = (min_y + max_y) * 0.5

        # Đế thuôn oval gọn theo phom bàn chân (không bị thành bảng chữ nhật vuông góc)
        sole_h = 0.013 * s if spec["shoes"] == "sandals" else 0.016 * s
        sole = build_loft(
            f"{spec['id']}_Sole_{side}",
            [
                (0.0, fx, fcy, fw * 0.94, fl * 0.96),
                (sole_h * 0.5, fx, fcy, fw * 1.01, fl * 1.01),
                (sole_h, fx, fcy, fw * 0.96, fl * 0.98),
            ],
            mat_sole, gap=0.0, segments=18, weights={f"foot.{side}": 1.0},
        )
        parts.append(sole)

        if spec["shoes"] == "sandals":
            # 2 quai dép mảnh thanh thoát ôm gọn mu bàn chân + 1 quai hậu sau gót
            for strap_y, strap_h, strap_w in [
                (fcy + fl * 0.36, 0.036 * s, 0.014 * s),
                (fcy - fl * 0.04, 0.044 * s, 0.013 * s),
            ]:
                arch = build_loft(
                    f"{spec['id']}_Strap_{side}_{strap_y:.2f}",
                    [
                        (sole_h - 0.002 * s, fx, strap_y, fw * 0.95, strap_w),
                        (strap_h, fx, strap_y, fw * 0.88, strap_w * 0.92),
                    ],
                    mat_shoe, gap=0.0, segments=16, weights={f"foot.{side}": 1.0},
                )
                parts.append(arch)
            heel_strap = build_loft(
                f"{spec['id']}_HeelStrap_{side}",
                [
                    (0.034 * s, fx, min_y + 0.022 * s, fw * 0.94, 0.022 * s),
                    (0.049 * s, fx, min_y + 0.024 * s, fw * 0.90, 0.020 * s),
                ],
                mat_shoe, gap=0.0, segments=16, weights={f"foot.{side}": 1.0},
            )
            parts.append(heel_strap)
        else:
            # Giày thể thao học sinh thuôn gọn ôm kín từ mũi chân đến cổ chân
            upper = build_loft(
                f"{spec['id']}_ShoeUpper_{side}",
                [
                    (sole_h - 0.002 * s, fx, fcy, fw * 0.98, fl * 0.99),
                    (0.036 * s, fx, fcy - fl * 0.06, fw * 0.94, fl * 0.88),
                    (0.058 * s, fx, min_y + fl * 0.42, fw * 0.82, fl * 0.42),
                    (0.070 * s, fx, min_y + fl * 0.36, fw * 0.72, fl * 0.30),
                ],
                mat_shoe, gap=0.0, segments=18, weights={f"foot.{side}": 1.0},
            )
            parts.append(upper)
    return parts


def build_hair_and_brows(spec, body_ref, bone_pts, mat_hair, mat_tie):
    """Dựng mái tóc 3D tự nhiên ôm sát sọ tới gáy + đôi lông mày khớp hốc mắt MPFB2."""
    parts = []
    # Đo toàn bộ phần sọ (tính từ giữa cổ/cằm tới đỉnh đầu chứ không chỉ từ khớp head_01)
    neck_base_z = bone_pts["neck_01"][0].z
    head_joint_z = bone_pts["head"][0].z
    head_base_z = neck_base_z + (head_joint_z - neck_base_z) * 0.42
    head_vs = [v.co for v in body_ref.data.vertices if v.co.z >= head_base_z]
    min_x = min(v.x for v in head_vs)
    max_x = max(v.x for v in head_vs)
    min_y = min(v.y for v in head_vs)
    max_y = max(v.y for v in head_vs)
    max_z = max(v.z for v in head_vs)
    skull_h = max(0.18, max_z - head_base_z)
    rx = (max_x - min_x) * 0.495
    cy = (min_y + max_y) * 0.47
    ry = (max_y - min_y) * 0.48
    cz = head_base_z + skull_h * 0.54
    rz = skull_h * 0.46

    s = spec["target_h"] / 1.32
    brow_z = head_base_z + skull_h * 0.55
    for side_s, sx in (("L", 1), ("R", -1)):
        surf_vs = [v.co for v in body_ref.data.vertices if v.co.y > 0.04 and abs(v.co.x - sx * 0.026 * s) < 0.015 * s and abs(v.co.z - brow_z) < 0.016 * s]
        by_surf = max((v.y for v in surf_vs), default=max_y - 0.018 * s)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx * 0.026 * s, by_surf - 0.001, brow_z))
        bw = bpy.context.object
        bw.name = f"{spec['id']}_Brow_{side_s}"
        bw.scale = (0.024 * s, 0.007 * s, 0.0036 * s)
        bw.rotation_euler = (radians(12), radians(-sx * 8), radians(sx * 16))
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        bw.data.materials.append(mat_hair)
        smooth_shade(bw)
        parts.append(bw)

    # Mũ tóc chính ôm kín sát sọ & đường chân tóc uốn cong mượt theo trán, không có góc nhọn thái dương
    segs, rows = 40, 18
    verts, faces = [], []
    is_girl = spec["hair_style"].startswith("girl")
    for r in range(rows):
        t_r = r / (rows - 1)
        for c in range(segs):
            az = c * 2 * pi / segs
            front_w = max(0.0, cos(az))
            back_w = max(0.0, -cos(az))
            side_w = max(0.0, 1.0 - abs(cos(az)))
            if is_girl:
                # Nữ: mái ôm trán cong tròn mềm mại (polar 1.18 ở trán trên), gáy sâu xuống 2.40
                polar_max = 1.68 - 0.50 * (front_w ** 1.1) + 0.72 * back_w - 0.10 * side_w
                if spec["hair_style"] == "girl_bob":
                    polar_max += 0.12 * sin(az + 0.35) * front_w
            else:
                # Nam: trán thoáng rẽ ngôi nhẹ tự nhiên, ôm gáy gọn gàng
                polar_max = 1.66 - 0.62 * (front_w ** 1.1) + 0.66 * back_w - 0.14 * side_w
                if spec["hair_style"] == "boy_parted" and front_w > 0.15:
                    polar_max += 0.14 * max(0.0, sin(az + 0.40)) * front_w
            polar = 0.03 + (polar_max - 0.03) * t_r
            # Độ dày tóc phồng mượt trên đỉnh & thu mỏng sát da đầu ở mép rìa chân tóc (t_r -> 1)
            taper = max(0.15, 1.0 - (t_r ** 3) * 0.85)
            off = 0.002 + (0.011 if is_girl else 0.013) * taper * (0.4 + 0.6 * (front_w + back_w * 0.7))
            vx = (rx + off) * sin(az) * sin(polar)
            vy = cy + (ry + off) * cos(az) * sin(polar)
            vz = cz + (rz + off) * cos(polar)
            verts.append((vx, vy, vz))
    for r in range(rows - 1):
        for c in range(segs):
            a = r * segs + c
            b = r * segs + (c + 1) % segs
            faces.append((a, b, b + segs, a + segs))
    faces.append(tuple(range(segs)))
    cap = create_mesh_obj(f"{spec['id']}_HairCap", verts, faces, mat_hair)
    parts.append(cap)

    if spec["hair_style"] == "girl_ponytail":
        band_y = min_y - 0.004
        band_z = cz - 0.005 * s
        bpy.ops.mesh.primitive_torus_add(major_radius=0.020 * s, minor_radius=0.006 * s, location=(0.0, band_y, band_z), rotation=(radians(72), 0, 0))
        tie = bpy.context.object
        tie.name = f"{spec['id']}_HairTie"
        tie.data.materials.append(mat_tie)
        smooth_shade(tie)
        parts.append(tie)

        pony_rings = [
            (band_z - 0.004 * s, 0.0, band_y - 0.006 * s, 0.017 * s, 0.017 * s),
            (band_z - 0.060 * s, 0.0, band_y - 0.034 * s, 0.028 * s, 0.024 * s),
            (band_z - 0.135 * s, 0.0, band_y - 0.042 * s, 0.024 * s, 0.020 * s),
            (band_z - 0.195 * s, 0.0, band_y - 0.036 * s, 0.009 * s, 0.009 * s),
        ]
        parts.append(build_loft(f"{spec['id']}_Ponytail", pony_rings, mat_hair, gap=0.0, segments=16, weights={"head": 1.0}))
    elif spec["hair_style"] == "girl_bob":
        # Màn tóc ngang vai uốn mềm ôm nhẹ gáy & 2 bên hàm (thu nhỏ dần về phía cằm để không vuông khối)
        c_segs, c_rows = 24, 5
        b_verts, b_faces = [], []
        z_levels = [cz + 0.010 * s, head_joint_z - 0.015 * s, head_base_z - 0.032 * s, head_base_z - 0.072 * s, head_base_z - 0.095 * s]
        r_mults = [0.99, 1.02, 1.03, 0.99, 0.90]
        for r_i, (zz, rm) in enumerate(zip(z_levels, r_mults)):
            for c_i in range(c_segs):
                u = c_i / (c_segs - 1)
                az = radians(84.0) + u * radians(192.0)  # +84° qua sau gáy 180° tới 276°
                arch = sin(u * pi) ** 0.55
                local_rm = 0.88 + (rm - 0.88) * arch
                off_c = 0.002 + 0.006 * arch
                vx = (rx * local_rm + off_c) * sin(az)
                vy = cy + (ry * local_rm + off_c) * cos(az) - 0.014 * s * (r_i / (c_rows - 1))
                b_verts.append((vx, vy, zz))
        for r_i in range(c_rows - 1):
            for c_i in range(c_segs - 1):
                a = r_i * c_segs + c_i
                b_faces.append((a, a + c_segs, a + c_segs + 1, a + 1))
        bob = create_mesh_obj(f"{spec['id']}_BobCurtain", b_verts, b_faces, mat_hair)
        activate(bob)
        sol = bob.modifiers.new("BobThick", "SOLIDIFY")
        sol.thickness = 0.004 * s
        bpy.ops.object.modifier_apply(modifier=sol.name)
        smooth_shade(bob)
        set_group(bob, {"head": 0.88, "neck": 0.12})
        parts.append(bob)

    for ob in parts:
        if len(ob.vertex_groups) == 0:
            set_group(ob, {"head": 1.0})
    return parts


def build_backpack(spec, shirt_obj, bone_pts, mat_pack, mat_trim):
    """Ba lô học sinh tách riêng object Student_Backpack (ẩn được khi ngồi tựa lưng ghế)."""
    s = spec["target_h"] / 1.32
    chest_h = bone_pts["spine_03"][0].z
    neck_h = bone_pts["neck_01"][0].z
    back_y = min((v.co.y for v in shirt_obj.data.vertices if abs(v.co.x) < 0.06 and chest_h - 0.05 < v.co.z < neck_h), default=-0.085 * s)
    bag_cy = back_y - 0.058 * s
    bag_cz = (chest_h + neck_h) * 0.49

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, bag_cy, bag_cz))
    body = bpy.context.object
    body.name = "Student_Backpack"
    body.scale = (0.21 * s, 0.11 * s, 0.27 * s)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bev = body.modifiers.new("Bev", "BEVEL")
    bev.width = 0.030 * s
    bev.segments = 3
    bpy.ops.object.modifier_apply(modifier=bev.name)
    body.data.materials.append(mat_pack)

    # Túi hộp nhỏ phía sau ba lô + 2 quai đeo ôm vai
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, bag_cy - 0.056 * s, bag_cz - 0.04 * s))
    pkt = bpy.context.object
    pkt.scale = (0.155 * s, 0.032 * s, 0.125 * s)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bev2 = pkt.modifiers.new("Bev2", "BEVEL")
    bev2.width = 0.012 * s
    bev2.segments = 2
    bpy.ops.object.modifier_apply(modifier=bev2.name)
    pkt.data.materials.append(mat_trim)

    strap_objs = [body, pkt]
    for side_s, sx in (("L", 1), ("R", -1)):
        front_chest_y = max((v.co.y for v in shirt_obj.data.vertices if abs(v.co.x - sx * 0.068 * s) < 0.03 and chest_h < v.co.z < neck_h), default=0.065 * s)
        # Xoay 90° quanh trục Y để quai ba lô ôm dọc từ vai trước vòng qua sau lưng (nằm trong mặt phẳng YZ)
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.086 * s, minor_radius=0.010 * s,
            location=(sx * 0.062 * s, (bag_cy + front_chest_y) * 0.46, bag_cz + 0.012 * s),
            rotation=(0.0, radians(90), radians(sx * 4)),
        )
        strap = bpy.context.object
        strap.scale = (1.0, 0.85, 1.38)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        strap.data.materials.append(mat_trim)
        strap_objs.append(strap)

    bpy.ops.object.select_all(action="DESELECT")
    for o in strap_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    smooth_shade(body)
    set_group(body, {"chest": 1.0})
    return body


def create_student_rig(name, bone_pts):
    """Tạo bộ xương 18 khớp chuẩn (trục +X của khớp hướng sang Trái +X, +Z của khớp chi hướng Trước +Y)."""
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    rig = bpy.context.active_object
    rig.name = f"{name}_Rig"
    rig.data.name = f"{name}_Skeleton"
    eb = rig.data.edit_bones
    for b in list(eb):
        eb.remove(b)

    def add_bone(bname, head, tail, parent=None, connect=False, align_vec=Vector((0, -1, 0))):
        b = eb.new(bname)
        b.head = Vector(head)
        b.tail = Vector(tail)
        if parent:
            b.parent = parent
            b.use_connect = connect
        b.align_roll(align_vec)
        return b

    # Lưu ý bone_pts vẫn đang đặt tên _r cho phía +X (sau xoay 180°) và _l cho phía -X
    pelvis_h, pelvis_t = bone_pts["pelvis"]
    sp1_h, _ = bone_pts["spine_01"]
    sp3_h, sp3_t = bone_pts["spine_03"]
    neck_h, neck_t = bone_pts["neck_01"]
    head_h, head_t = bone_pts["head"]

    b_root = add_bone("root", (0, 0, 0), (0, 0, 0.10))
    b_hips = add_bone("hips", (0, pelvis_h.y, pelvis_h.z), (0, pelvis_t.y, sp1_h.z), b_root)
    b_spine = add_bone("spine", (0, pelvis_t.y, sp1_h.z), (0, sp3_h.y, sp3_h.z), b_hips, True)
    b_chest = add_bone("chest", (0, sp3_h.y, sp3_h.z), (0, neck_h.y, neck_h.z), b_spine, True)
    b_neck = add_bone("neck", (0, neck_h.y, neck_h.z), (0, neck_t.y, neck_t.z), b_chest, True)
    add_bone("head", (0, neck_t.y, neck_t.z), (0, head_t.y, head_t.z + 0.05), b_neck, True)

    for side, mp_side in (("L", "r"), ("R", "l")):
        ua_h, ua_t = bone_pts[f"upperarm_{mp_side}"]
        la_h, la_t = bone_pts[f"lowerarm_{mp_side}"]
        hd_h, hd_t = bone_pts[f"hand_{mp_side}"]
        b_ua = add_bone(f"upper_arm.{side}", ua_h, ua_t, b_chest, False, Vector((0, 1, 0)))
        b_la = add_bone(f"forearm.{side}", ua_t, la_t, b_ua, True, Vector((0, 1, 0)))
        add_bone(f"hand.{side}", la_t, hd_t + (hd_t - la_t) * 1.4, b_la, True, Vector((0, 1, 0)))

        th_h, th_t = bone_pts[f"thigh_{mp_side}"]
        cf_h, cf_t = bone_pts[f"calf_{mp_side}"]
        ft_h, ft_t = bone_pts[f"foot_{mp_side}"]
        b_th = add_bone(f"thigh.{side}", th_h, cf_h, b_hips, False, Vector((0, 1, 0)))
        b_sh = add_bone(f"shin.{side}", cf_h, ft_h, b_th, True, Vector((0, 1, 0)))
        add_bone(f"foot.{side}", ft_h, (ft_h.x, ft_h.y + 0.12, 0.005), b_sh, True, Vector((0, 0, 1)))

    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def assign_skirt_weights(skirt_obj, pelvis_z):
    """Gán trọng số váy xếp ly trực tiếp theo hông & 2 đùi để KHÔNG BAO GIỜ dính xương cánh tay khi giơ tay."""
    skirt_obj.vertex_groups.clear()
    vg_hips = skirt_obj.vertex_groups.new(name="hips")
    vg_tl = skirt_obj.vertex_groups.new(name="thigh.L")
    vg_tr = skirt_obj.vertex_groups.new(name="thigh.R")
    zs = [v.co.z for v in skirt_obj.data.vertices]
    z_top, z_bot = max(zs, default=pelvis_z), min(zs, default=pelvis_z - 0.25)
    span = max(0.05, z_top - z_bot)
    for v in skirt_obj.data.vertices:
        t = max(0.0, min(1.0, (z_top - v.co.z) / span))
        hips_w = max(0.25, 1.0 - 0.65 * t)
        side_l = max(0.0, min(1.0, (v.co.x + 0.04) / 0.08))
        thigh_w = 1.0 - hips_w
        if thigh_w * side_l > 0.001:
            vg_tl.add([v.index], thigh_w * side_l, "REPLACE")
        if thigh_w * (1.0 - side_l) > 0.001:
            vg_tr.add([v.index], thigh_w * (1.0 - side_l), "REPLACE")
        vg_hips.add([v.index], hips_w, "REPLACE")


def transfer_weights(source_obj, target_obj):
    """Truyền trọng số xương mịn từ thân MPFB2 sang áo/quần bằng Data Transfer."""
    activate(target_obj)
    target_obj.vertex_groups.clear()
    for vg in source_obj.vertex_groups:
        target_obj.vertex_groups.new(name=vg.name)
    mod = target_obj.modifiers.new("WeightTransfer", "DATA_TRANSFER")
    mod.object = source_obj
    mod.use_vert_data = True
    mod.data_types_verts = {"VGROUP_WEIGHTS"}
    mod.vert_mapping = "POLYINTERP_NEAREST"
    bpy.ops.object.modifier_apply(modifier=mod.name)


def purge_arm_weights(obj, fallback_bone="hips"):
    """Xóa trọng số tay khỏi quần/váy/dép và gán mọi đỉnh thiếu trọng số về fallback_bone để không bị kẹt tư thế đứng."""
    for vg in list(obj.vertex_groups):
        if any(vg.name.startswith(p) for p in ("upper_arm", "forearm", "hand")):
            obj.vertex_groups.remove(vg)
    fb = obj.vertex_groups.get(fallback_bone) or obj.vertex_groups.new(name=fallback_bone)
    for v in obj.data.vertices:
        total = sum(g.weight for g in v.groups)
        if total < 0.05:
            fb.add([v.index], 1.0, "REPLACE")
        elif abs(total - 1.0) > 0.02:
            inv = 1.0 / total
            for g in v.groups:
                obj.vertex_groups[g.group].add([v.index], g.weight * inv, "REPLACE")


def make_keyframe_clip(rig, name, f_end, keyframes_by_bone, frame_feet_ground=None, ref_mesh=None):
    """Tạo Animation Action chuẩn Blender 5.3 + đặt chân chạm mặt đất nếu là Walk/Run."""
    act = bpy.data.actions.new(name=name)
    rig.animation_data.action = act
    for b in rig.pose.bones:
        b.rotation_mode = "XYZ"
        b.location = (0, 0, 0)
        b.rotation_euler = (0, 0, 0)

    all_frames = sorted({1, f_end, *keyframes_by_bone.keys()})
    for fr in all_frames:
        bpy.context.scene.frame_set(fr)
        pose_spec = keyframes_by_bone.get(fr, {})
        for b in rig.pose.bones:
            b.location = pose_spec.get(b.name, {}).get("loc", (0, 0, 0))
            rot_deg = pose_spec.get(b.name, {}).get("rot", (0, 0, 0))
            b.rotation_euler = tuple(radians(a) for a in rot_deg)
            b.keyframe_insert(data_path="location", frame=fr)
            b.keyframe_insert(data_path="rotation_euler", frame=fr)

    if frame_feet_ground and ref_mesh is not None:
        dg = bpy.context.evaluated_depsgraph_get
        foot_vgs = {ref_mesh.vertex_groups[f"foot.{s}"].index for s in ("L", "R") if f"foot.{s}" in ref_mesh.vertex_groups}
        f_verts = [v.index for v in ref_mesh.data.vertices if any(g.group in foot_vgs for g in v.groups)]
        hips = rig.pose.bones["hips"]
        for fr in range(1, f_end + 1):
            bpy.context.scene.frame_set(fr)
            hips.location = (0, 0, 0)
            bpy.context.view_layer.update()
            ev = ref_mesh.evaluated_get(dg())
            low_z = min((ev.data.vertices[idx].co.z for idx in f_verts), default=0.0)
            lift = frame_feet_ground.get(fr, 0.0)
            # hips.bone local Y là +Z world -> hips.location.y dịch theo phương đứng!
            hips.location.y = lift - low_z
            hips.keyframe_insert(data_path="location", index=1, frame=fr)

    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, act)


def build_student_animations(rig, body_mesh, spec, bone_pts):
    """Tạo đủ 5 clip: Idle, Walk, Run, Sit (ngồi ghế lớp học), RaiseHand (giơ tay phát biểu)."""
    if not rig.animation_data:
        rig.animation_data_create()
    rig.animation_data.use_nla = False

    # Tính độ hạ hông chính xác để ngồi khít lên mặt ghế lớp học (Seat_top = 0.434m) và tay đặt LÊN TRÊN mặt bàn (0.705m)
    pelvis_z = bone_pts["pelvis"][0].z
    seat_target_z = 0.456
    sit_drop = seat_target_z - pelvis_z

    # Idle: thở nhẹ & đổi trụ thư giãn (48 frames = 2.0s)
    make_keyframe_clip(rig, "Idle", 48, {
        1:  {"chest": {"rot": (0, 0, 0)}, "head": {"rot": (0, 0, 0)}},
        24: {"chest": {"rot": (-2.0, 0, 0)}, "head": {"rot": (1.5, 0, 2.5)}, "upper_arm.L": {"rot": (2, 0, 0)}, "upper_arm.R": {"rot": (2, 0, 0)}},
        48: {"chest": {"rot": (0, 0, 0)}, "head": {"rot": (0, 0, 0)}},
    })

    # Walk: bước đều tự nhiên 24 frames = 1.0s (đùi vung +X ra trước, cẳng chân -X gập gối ra sau)
    walk_keys = {
        1:  {"thigh.L": {"rot": (26, 0, 0)}, "shin.L": {"rot": (-4, 0, 0)}, "thigh.R": {"rot": (-22, 0, 0)}, "shin.R": {"rot": (-26, 0, 0)},
             "upper_arm.L": {"rot": (-20, 0, 0)}, "forearm.L": {"rot": (12, 0, 0)}, "upper_arm.R": {"rot": (22, 0, 0)}, "forearm.R": {"rot": (18, 0, 0)},
             "spine": {"rot": (-3, 0, -3)}, "chest": {"rot": (0, 0, 5)}},
        7:  {"thigh.L": {"rot": (6, 0, 0)}, "shin.L": {"rot": (-8, 0, 0)}, "thigh.R": {"rot": (12, 0, 0)}, "shin.R": {"rot": (-42, 0, 0)},
             "upper_arm.L": {"rot": (0, 0, 0)}, "forearm.L": {"rot": (14, 0, 0)}, "upper_arm.R": {"rot": (0, 0, 0)}, "forearm.R": {"rot": (14, 0, 0)}},
        13: {"thigh.L": {"rot": (-22, 0, 0)}, "shin.L": {"rot": (-26, 0, 0)}, "thigh.R": {"rot": (26, 0, 0)}, "shin.R": {"rot": (-4, 0, 0)},
             "upper_arm.L": {"rot": (22, 0, 0)}, "forearm.L": {"rot": (18, 0, 0)}, "upper_arm.R": {"rot": (-20, 0, 0)}, "forearm.R": {"rot": (12, 0, 0)},
             "spine": {"rot": (-3, 0, 3)}, "chest": {"rot": (0, 0, -5)}},
        19: {"thigh.L": {"rot": (12, 0, 0)}, "shin.L": {"rot": (-42, 0, 0)}, "thigh.R": {"rot": (6, 0, 0)}, "shin.R": (-8, 0, 0)},
        24: {"thigh.L": {"rot": (26, 0, 0)}, "shin.L": {"rot": (-4, 0, 0)}, "thigh.R": {"rot": (-22, 0, 0)}, "shin.R": {"rot": (-26, 0, 0)},
             "upper_arm.L": {"rot": (-20, 0, 0)}, "forearm.L": {"rot": (12, 0, 0)}, "upper_arm.R": {"rot": (22, 0, 0)}, "forearm.R": {"rot": (18, 0, 0)},
             "spine": {"rot": (-3, 0, -3)}, "chest": {"rot": (0, 0, 5)}},
    }
    walk_keys[19]["shin.R"] = {"rot": (-8, 0, 0)}
    walk_keys[19].update({"upper_arm.L": {"rot": (0, 0, 0)}, "forearm.L": {"rot": (14, 0, 0)}, "upper_arm.R": {"rot": (0, 0, 0)}, "forearm.R": {"rot": (14, 0, 0)}})
    make_keyframe_clip(rig, "Walk", 24, walk_keys, frame_feet_ground={f: 0.0 for f in range(1, 25)}, ref_mesh=body_mesh)

    # Run: chạy vui chơi 16 frames = 0.67s
    run_lift = {f: max(0.0, 0.045 * sin((f - 1) / 8 * pi)) for f in range(1, 17)}
    make_keyframe_clip(rig, "Run", 16, {
        1:  {"thigh.L": {"rot": (42, 0, 0)}, "shin.L": {"rot": (-18, 0, 0)}, "thigh.R": {"rot": (-34, 0, 0)}, "shin.R": {"rot": (-58, 0, 0)},
             "upper_arm.L": {"rot": (-38, 0, 0)}, "forearm.L": {"rot": (58, 0, 0)}, "upper_arm.R": {"rot": (44, 0, 0)}, "forearm.R": {"rot": (62, 0, 0)},
             "spine": {"rot": (-10, 0, -5)}, "chest": {"rot": (-4, 0, 8)}},
        5:  {"thigh.L": {"rot": (12, 0, 0)}, "shin.L": {"rot": (-22, 0, 0)}, "thigh.R": {"rot": (24, 0, 0)}, "shin.R": {"rot": (-74, 0, 0)},
             "upper_arm.L": {"rot": (0, 0, 0)}, "forearm.L": {"rot": (55, 0, 0)}, "upper_arm.R": {"rot": (0, 0, 0)}, "forearm.R": {"rot": (55, 0, 0)},
             "spine": {"rot": (-10, 0, 0)}},
        9:  {"thigh.L": {"rot": (-34, 0, 0)}, "shin.L": {"rot": (-58, 0, 0)}, "thigh.R": {"rot": (42, 0, 0)}, "shin.R": {"rot": (-18, 0, 0)},
             "upper_arm.L": {"rot": (44, 0, 0)}, "forearm.L": {"rot": (62, 0, 0)}, "upper_arm.R": {"rot": (-38, 0, 0)}, "forearm.R": {"rot": (58, 0, 0)},
             "spine": {"rot": (-10, 0, 5)}, "chest": {"rot": (-4, 0, -8)}},
        13: {"thigh.L": {"rot": (24, 0, 0)}, "shin.L": {"rot": (-74, 0, 0)}, "thigh.R": {"rot": (12, 0, 0)}, "shin.R": {"rot": (-22, 0, 0)},
             "upper_arm.L": {"rot": (0, 0, 0)}, "forearm.L": {"rot": (55, 0, 0)}, "upper_arm.R": {"rot": (0, 0, 0)}, "forearm.R": {"rot": (55, 0, 0)},
             "spine": {"rot": (-10, 0, 0)}},
        16: {"thigh.L": {"rot": (42, 0, 0)}, "shin.L": {"rot": (-18, 0, 0)}, "thigh.R": {"rot": (-34, 0, 0)}, "shin.R": {"rot": (-58, 0, 0)},
             "upper_arm.L": {"rot": (-38, 0, 0)}, "forearm.L": {"rot": (58, 0, 0)}, "upper_arm.R": {"rot": (44, 0, 0)}, "forearm.R": {"rot": (62, 0, 0)},
             "spine": {"rot": (-10, 0, -5)}, "chest": {"rot": (-4, 0, 8)}},
    }, frame_feet_ground=run_lift, ref_mesh=body_mesh)

    # Sit: ngồi ghế học bài (hai khuỷu & cẳng tay đặt LÊN MẶT BÀN 0.705m, đùi 85°, cẳng chân -85°)
    sit_base = {
        "hips": {"loc": (0, sit_drop, -0.015)},
        "thigh.L": {"rot": (85, 0, 0)}, "shin.L": {"rot": (-85, 0, 0)}, "foot.L": {"rot": (0, 0, 0)},
        "thigh.R": {"rot": (85, 0, 0)}, "shin.R": {"rot": (-85, 0, 0)}, "foot.R": {"rot": (0, 0, 0)},
        "spine": {"rot": (-8, 0, 0)}, "chest": {"rot": (-4, 0, 0)},
        "upper_arm.L": {"rot": (70, 0, 12)}, "forearm.L": {"rot": (28, 0, -14)},
        "upper_arm.R": {"rot": (70, 0, -12)}, "forearm.R": {"rot": (28, 0, 14)},
        "head": {"rot": (4, 0, 0)},
    }
    sit_look = {
        **sit_base,
        "head": {"rot": (-4, 0, 6)},
        "chest": {"rot": (-2, 0, 0)},
    }
    make_keyframe_clip(rig, "Sit", 48, {1: sit_base, 24: sit_look, 48: sit_base})

    # RaiseHand: ngồi ngay ngắn đặt tay trái trên bàn & giơ cao tay phải phát biểu (72 frames = 3.0s)
    raise_pose = {
        **sit_base,
        "head": {"rot": (-6, 0, 0)},
        "upper_arm.R": {"rot": (148, -14, -10)},
        "forearm.R": {"rot": (14, 0, 0)},
    }
    make_keyframe_clip(rig, "RaiseHand", 72, {1: sit_base, 16: raise_pose, 52: raise_pose, 68: sit_base, 72: sit_base})

    rig.animation_data.use_nla = True
    rig.animation_data.action = None


def render_preview(characters):
    """Render ảnh kiểm tra mặt trước (hàng trên) & mặt sau (hàng dưới) 4 mẫu học sinh MPFB2."""
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    scene = bpy.data.scenes.new("StudentsPreview")
    bpy.context.window.scene = scene

    bpy.ops.mesh.primitive_plane_add(size=24)
    floor = bpy.context.object
    floor.data.materials.append(make_mat("StudioFloor", "#D8DCE2", 0.85))

    for col_ref, x_pos, angle in zip(characters, [-1.50, -0.50, 0.50, 1.50], [0.16, -0.14, 0.14, -0.16]):
        # Hàng trước: nhìn trực diện mặt trước (+Y hướng về camera ở Y=+5)
        inst_f = bpy.data.objects.new(f"Front_{col_ref.name}", None)
        inst_f.instance_type = "COLLECTION"
        inst_f.instance_collection = col_ref
        inst_f.location = (x_pos, 0.15, 0.0)
        inst_f.rotation_euler.z = angle
        scene.collection.objects.link(inst_f)

        # Hàng sau lệch nhẹ: kiểm tra ba lô, tóc sau gáy & khăn quàng lưng
        inst_b = bpy.data.objects.new(f"Back_{col_ref.name}", None)
        inst_b.instance_type = "COLLECTION"
        inst_b.instance_collection = col_ref
        inst_b.location = (x_pos, -0.85, 0.0)
        inst_b.rotation_euler.z = pi + angle
        scene.collection.objects.link(inst_b)

    scene.world = bpy.data.worlds.new("StudioWorld")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.76, 0.82, 0.90, 1.0)
    bg.inputs[1].default_value = 0.50

    for name, loc, energy, size in [
        ("Key", (-2.5, 4.8, 4.2), 420, 4.5),
        ("Fill", (2.8, 3.2, 2.8), 260, 4.0),
        ("Rim", (0.0, -4.0, 3.8), 300, 4.0),
    ]:
        bpy.ops.object.light_add(type="AREA", location=loc)
        lt = bpy.context.object
        lt.name = name
        lt.data.energy = energy
        lt.data.size = size
        lt.rotation_euler = (Vector((0, 0, 0.78)) - lt.location).to_track_quat("-Z", "Y").to_euler()

    bpy.ops.object.camera_add(location=(0.0, 4.8, 1.05))
    cam = bpy.context.object
    scene.camera = cam
    cam.data.lens = 42
    cam.rotation_euler = (Vector((0, -0.2, 0.75)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.filepath = str(PREVIEW_DIR / "students_mpfb_lineup.png")
    bpy.ops.render.render(write_still=True)

    # Render riêng 1 cảnh quay mặt sau ở giữa + 1 cảnh test dáng ngồi ghế lớp học thực tế
    for ob in list(scene.collection.objects):
        if ob.name.startswith("Front_"):
            ob.hide_render = True
        elif ob.name.startswith("Back_"):
            ob.location.y = 0.0
    scene.render.filepath = str(PREVIEW_DIR / "students_mpfb_back.png")
    bpy.ops.render.render(write_still=True)


def render_sit_check(glb_boy, glb_girl):
    """Kiểm tra trực tiếp 2 học sinh ngồi ghế bàn học chuẩn kích thước trường Vĩnh Trung (Seat=0.42m, Desk=0.705m)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    scene = bpy.context.scene
    mat_floor = make_mat("F", "#D5D9E0", 0.8)
    mat_wood = make_mat("W", "#D19E61", 0.55)
    mat_metal = make_mat("M", "#3D4754", 0.4)

    bpy.ops.mesh.primitive_plane_add(size=6)
    bpy.context.object.data.materials.append(mat_floor)

    def add_box(name, sx, sy, sz, lx, ly, lz, m):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly, lz))
        ob = bpy.context.object
        ob.name = name
        ob.scale = (sx, sy, sz)
        ob.data.materials.append(m)

    # Bàn đôi học sinh & 2 ghế chuẩn y hệt generate_blockout.py
    add_box("DeskTop", 1.20, 0.46, 0.032, 0.0, 0.44, 0.705, mat_wood)
    add_box("DeskShelf", 1.12, 0.34, 0.024, 0.0, 0.46, 0.56, mat_wood)
    for cx in (-0.30, 0.30):
        add_box(f"Seat_{cx}", 0.38, 0.34, 0.028, cx, 0.0, 0.42, mat_wood)
        add_box(f"Back_{cx}", 0.38, 0.028, 0.21, cx, -0.16, 0.665, mat_wood)
        for lx in (-0.16, 0.16):
            add_box(f"FL_{cx}_{lx}", 0.028, 0.028, 0.41, cx + lx, 0.14, 0.205, mat_metal)
            add_box(f"RL_{cx}_{lx}", 0.028, 0.028, 0.76, cx + lx, -0.16, 0.38, mat_metal)

    for glb, px, action_name in [(glb_boy, -0.30, "Sit"), (glb_girl, 0.30, "RaiseHand")]:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(glb))
        rig = None
        for ob in set(bpy.data.objects) - before:
            if ob.name.startswith("Icosphere") or ob.name == "Cube" or ob.name == "Student_Backpack":
                bpy.data.objects.remove(ob, do_unlink=True)
                continue
            if ob.type == "ARMATURE":
                rig = ob
        if rig:
            rig.location = (px, -0.02, 0.0)
            rig.animation_data.action = None
            rig.animation_data.use_nla = True
            for tr in rig.animation_data.nla_tracks:
                tr.mute = (tr.name != action_name)
                if tr.name == action_name and tr.strips:
                    tr.strips[0].extrapolation = "HOLD"
            scene.frame_set(30)
            bpy.context.view_layer.update()

    scene.world = bpy.data.worlds.new("W")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.85, 0.88, 0.92, 1.0)
    bpy.ops.object.light_add(type="AREA", location=(-2.0, 2.5, 3.0))
    lt = bpy.context.object
    lt.data.energy = 320
    lt.data.size = 3.0
    lt.rotation_euler = (Vector((0, 0.2, 0.6)) - lt.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=(1.85, 1.55, 1.35))
    cam = bpy.context.object
    scene.camera = cam
    cam.data.lens = 34
    cam.rotation_euler = (Vector((0.0, 0.18, 0.72)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 800
    scene.render.filepath = str(PREVIEW_DIR / "students_mpfb_classroom_sit.png")
    bpy.ops.render.render(write_still=True)


def build_one_student(spec):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    ensure_local_textures()

    body_ref, eyes_obj, bone_pts = extract_clean_mpfb_student(spec)
    s = spec["target_h"] / 1.32

    mat_shirt = make_mat("MAT_ShirtWhite", "#F4F6FA", roughness=0.78)
    mat_btn = make_mat("MAT_Button", "#E6EAF2", roughness=0.35)
    mat_scarf = make_mat("MAT_RedScarf", "#D32121", roughness=0.58)
    mat_badge = make_mat("MAT_Badge", "#D42A2A", roughness=0.45)
    mat_bottom = make_mat("MAT_BottomUniform", spec["bottom_color"], roughness=0.76)
    mat_shoe = make_mat("MAT_Shoe", spec["shoe_color"], roughness=0.60)
    mat_sole = make_mat("MAT_ShoeSole", "#E5E7EB", roughness=0.75)
    mat_hair = make_mat("MAT_Hair", spec["hair_color"], roughness=0.78)
    mat_tie = make_mat("MAT_HairTie", spec["tie_color"], roughness=0.50)
    mat_pack = make_mat("MAT_Backpack", spec["pack_color"], roughness=0.65)
    mat_pack_trim = make_mat("MAT_BackpackTrim", spec["pack_trim"], roughness=0.68)

    pelvis_z = bone_pts["pelvis"][0].z
    thigh_h_z = bone_pts["thigh_r"][0].z
    calf_z = bone_pts["calf_r"][0].z
    foot_z = bone_pts["foot_r"][0].z
    neck_z = bone_pts["neck_01"][0].z
    torso_max_x = bone_pts["upperarm_r"][0].x
    sh_l = bone_pts["upperarm_r"][0]
    dir_l = (bone_pts["lowerarm_r"][0] - sh_l).normalized()
    sh_r = bone_pts["upperarm_l"][0]
    dir_r = (bone_pts["lowerarm_l"][0] - sh_r).normalized()
    arm_len = (bone_pts["lowerarm_r"][0] - sh_l).length
    arm_cut_dist = arm_len * 0.54

    # Lập danh sách đỉnh thuộc cánh tay/bàn tay và chân/hông từ vertex groups thật của MPFB2 để quần KHÔNG dính sang tay!
    arm_hand_verts = build_group_lookup(body_ref, ("upperarm_", "lowerarm_", "hand_", "index_", "middle_", "ring_", "pinky_", "thumb_"))
    forearm_hand_verts = build_group_lookup(body_ref, ("lowerarm_", "hand_", "index_", "middle_", "ring_", "pinky_", "thumb_"))

    # 1. Áo sơ mi trắng cộc tay (gấu áo sơ vin nằm gọn BÊN TRONG cạp quần/váy để không lòi viền trắng)
    shirt_bot_z = pelvis_z + 0.024 * s
    shirt_top_z = neck_z + 0.012 * s
    def keep_shirt(v_idx, co):
        if v_idx in forearm_hand_verts or not (shirt_bot_z <= co.z <= shirt_top_z):
            return False
        if co.x > torso_max_x:
            return (co - sh_l).dot(dir_l) <= arm_cut_dist
        if co.x < -torso_max_x:
            return (co - sh_r).dot(dir_r) <= arm_cut_dist
        return True

    def push_shirt(co):
        if abs(co.x) > torso_max_x * 0.92:
            return 0.012 * s
        # Phần gấu sơ vin trong cạp thu gọn vào sát thân để Waistband bọc ngoài kín khít
        if co.z < pelvis_z + 0.052 * s:
            return 0.002 * s
        if spec["gender"] == 0.0 and co.y > 0.03 and (pelvis_z + 0.14 * s) < co.z < (neck_z - 0.05 * s):
            return 0.014 * s
        return 0.0105 * s

    shirt_obj = clone_body_shell(
        body_ref, f"{spec['id']}_Shirt",
        vert_mask_fn=keep_shirt,
        push_fn=push_shirt,
        mat=mat_shirt,
    )
    activate(shirt_obj)
    sh_smooth = shirt_obj.modifiers.new("FabricSmooth", "SMOOTH")
    sh_smooth.factor = 0.55
    sh_smooth.iterations = 3
    bpy.ops.object.modifier_apply(modifier=sh_smooth.name)

    # 2. Quần / Váy (loại bỏ hoàn toàn cánh tay & bàn tay khỏi vùng quần!)
    if spec["bottom"] == "shorts":
        pants_cutoff_z = calf_z + (thigh_h_z - calf_z) * 0.22
    elif spec["bottom"] == "pleated_skirt":
        # Quần bảo hộ nằm cao hơn mép váy để không lòi dưới chân váy
        pants_cutoff_z = thigh_h_z - (thigh_h_z - calf_z) * 0.34
    else:
        pants_cutoff_z = foot_z + 0.045 * s

    bottom_parts = []
    pants_shell = clone_body_shell(
        body_ref, f"{spec['id']}_PantsBase",
        vert_mask_fn=lambda v_idx, co: (v_idx not in arm_hand_verts) and (pants_cutoff_z <= co.z <= pelvis_z + 0.045 * s),
        push_fn=lambda co: 0.012 * s if co.z > pelvis_z - 0.04 else 0.015 * s,
        mat=mat_bottom,
    )
    activate(pants_shell)
    p_smooth = pants_shell.modifiers.new("PantsSmooth", "SMOOTH")
    p_smooth.factor = 0.45
    p_smooth.iterations = 2
    bpy.ops.object.modifier_apply(modifier=p_smooth.name)
    bottom_parts.append(pants_shell)
    if spec["bottom"] == "pleated_skirt":
        skirt_obj = build_pleated_skirt(spec, body_ref, bone_pts, mat_bottom)
        bottom_parts.append(skirt_obj)

    # 3. Chi tiết cổ áo, cúc, phù hiệu, khăn quàng đỏ
    shirt_detail_parts = build_shirt_details(spec, bone_pts, shirt_obj, mat_shirt, mat_btn, mat_scarf, mat_badge)

    # 4. Giày/dép, tóc/lông mày & ba lô
    footwear_parts = build_footwear(spec, body_ref, bone_pts, mat_shoe, mat_sole)
    hair_parts = build_hair_and_brows(spec, body_ref, bone_pts, mat_hair, mat_tie)
    backpack_obj = build_backpack(spec, shirt_obj, bone_pts, mat_pack, mat_pack_trim)

    # 5. Truyền trọng số xương mịn khi body_ref còn nguyên thân, sau đó cắt bỏ phần da ẩn dưới áo & quần
    remap_mpfb_vgroups_to_student_rig(body_ref)
    transfer_weights(body_ref, shirt_obj)
    for bpart in bottom_parts:
        if "_Skirt" in bpart.name:
            assign_skirt_weights(bpart, pelvis_z)
        else:
            transfer_weights(body_ref, bpart)
            purge_arm_weights(bpart)
    for spart in shirt_detail_parts:
        if len(spart.vertex_groups) == 0:
            transfer_weights(body_ref, spart)
    for fw in footwear_parts:
        if len(fw.vertex_groups) == 0:
            transfer_weights(body_ref, fw)
            purge_arm_weights(fw, "foot.L" if "_L" in fw.name else "foot.R")

    # Giữ đủ phần da đùi bên trong chân váy xếp ly để tuyệt đối không bao giờ lòi khe hở nền dưới váy
    extract_visible_skin_only(
        body_ref,
        pants_cutoff_z=thigh_h_z + 0.02 * s if spec["bottom"] == "pleated_skirt" else pants_cutoff_z,
        neck_min_z=neck_z - 0.01,
        arm_cut_dist=arm_cut_dist,
        shoulder_pts={"L": (sh_l, dir_l), "R": (sh_r, dir_r)},
        torso_max_x=torso_max_x,
    )

    # Gộp tất cả lưới (trừ Student_Backpack giữ tách riêng để bật/tắt khi ngồi lớp học)
    main_meshes = [body_ref, shirt_obj, *bottom_parts, *shirt_detail_parts, *footwear_parts, *hair_parts]
    if eyes_obj:
        set_group(eyes_obj, {"head": 1.0})
        main_meshes.append(eyes_obj)

    bpy.ops.object.select_all(action="DESELECT")
    for m in main_meshes:
        m.select_set(True)
    bpy.context.view_layer.objects.active = body_ref
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = f"{spec['id']}_Mesh"

    rig = create_student_rig(spec["id"], bone_pts)
    for mesh_ob in (joined, backpack_obj):
        mesh_ob.parent = rig
        mod = mesh_ob.modifiers.new("Armature", "ARMATURE")
        mod.object = rig

    # Xóa sạch mọi object rác/widget (Cube, Icosphere của MPFB2) trước khi export GLB
    keep_objs = {rig, joined, backpack_obj}
    for stray in list(bpy.data.objects):
        if stray not in keep_objs:
            bpy.data.objects.remove(stray, do_unlink=True)

    build_student_animations(rig, joined, spec, bone_pts)

    WEB_MODELS.mkdir(parents=True, exist_ok=True)
    glb_out = WEB_MODELS / f"{spec['id']}.glb"
    rig.animation_data.action = None
    bpy.ops.object.select_all(action="DESELECT")
    for o in (rig, joined, backpack_obj):
        o.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=str(glb_out),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_skins=True,
        export_animation_mode="NLA_TRACKS",
        export_anim_slide_to_zero=True,
    )
    tris = sum(len(o.data.polygons) for o in (joined, backpack_obj))
    print(f"[OK] Exported {glb_out.name}: tris={tris}, size={glb_out.stat().st_size // 1024} KB")
    return glb_out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--only", help="Build only one spec id")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)

    specs = [s for s in STUDENT_SPECS if not args.only or s["id"] == args.only]
    exported = [build_one_student(spec) for spec in specs]

    if args.preview:
        # Nạp lại 4 GLB vào cảnh trắng để render lineup so sánh trực quan
        bpy.ops.wm.read_factory_settings(use_empty=True)
        for o in list(bpy.data.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        collections = []
        for idx, glb in enumerate(exported):
            col = bpy.data.collections.new(glb.stem)
            bpy.context.scene.collection.children.link(col)
            before = set(bpy.data.objects)
            bpy.ops.import_scene.gltf(filepath=str(glb))
            for obj in set(bpy.data.objects) - before:
                if obj.name.startswith("Icosphere") or obj.name.startswith("Cube"):
                    bpy.data.objects.remove(obj, do_unlink=True)
                    continue
                for c in list(obj.users_collection):
                    c.objects.unlink(obj)
                col.objects.link(obj)
            collections.append(col)
        render_preview(collections)
        print(f"[OK] Rendered lineup preview: {PREVIEW_DIR / 'students_mpfb_lineup.png'}")
        if len(exported) >= 2:
            render_sit_check(exported[0], exported[1])
            print(f"[OK] Rendered classroom sit preview: {PREVIEW_DIR / 'students_mpfb_classroom_sit.png'}")


if __name__ == "__main__":
    main()
