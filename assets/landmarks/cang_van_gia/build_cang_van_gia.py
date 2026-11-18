"""Dựng mô hình Cảng Vạn Gia (đảo Vĩnh Thực) bằng Blender, tỷ lệ 1 đơn vị = 1 m.

Chạy:  Blender --background --python build_cang_van_gia.py
Kết quả (cùng thư mục): cang_van_gia.blend, cang_van_gia.glb, preview_*.png

Bố cục theo ảnh vệ tinh và ảnh chụp từ biển do thầy cung cấp (11/2026): biển ở phía -Y, đất liền +Y.
Nhìn từ biển, trái sang phải: cầu cảng bê tông, trạm Vạn Gia, nhà hải quan, kè đá có hàng quán,
biệt thự vàng trên đồi, bậc lên xuống bến tàu khách với biển cổ động, cột viễn thông phía sau.
Kích thước lấy theo thước 20 m của ảnh vệ tinh; chi tiết công trình là ước lượng từ ảnh.
"""
import math
import os
import random

import bpy
from mathutils import Vector

OUT = os.path.dirname(os.path.abspath(__file__))
random.seed(7)
QUAY = 3.2  # Cao độ mặt bến so với mực nước (m)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- Vật liệu ----------
_materials = {}
def mat(name, color, roughness=0.8, emission=0.0, alpha=1.0):
    # Tiền tố MAT_: bản web gộp mesh theo vật liệu, code nhận biết các phần qua tên vật liệu.
    name = f"MAT_{name}"
    if name in _materials:
        return _materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Strength"].default_value = emission
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND" if hasattr(m, "blend_method") else m.blend_method
    _materials[name] = m
    return m

def rgb(hex_code):
    hex_code = hex_code.lstrip("#")
    return tuple(((int(hex_code[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4))

M = lambda name, code, **kw: mat(name, rgb(code), **kw)
STONE = M("Da_ke", "#7C7568", roughness=0.95)
CONCRETE = M("Be_tong", "#B9B4A6", roughness=0.9)
CONCRETE_DARK = M("Be_tong_cu", "#8F8A7C", roughness=0.95)
ROAD = M("Mat_duong", "#6F6E6A", roughness=0.95)
WHITE = M("Son_trang", "#F2F0E8")
CREAM = M("Tuong_kem", "#EFE3BF")
YELLOW_WALL = M("Tuong_vang", "#E9C24F")
PINK_BAND = M("Mang_hong", "#D9705F")
ROOF_RED = M("Mai_ngoi_do", "#C24A2E", roughness=0.7)
ROOF_GREEN = M("Mai_ton_xanh", "#2F7F6B", roughness=0.6)
ROOF_DARK = M("Mai_bat", "#2B3A4A", roughness=0.8)
GLASS = M("Kinh", "#27405C", roughness=0.2)
GRASS = M("Co_doi", "#3F7A35", roughness=1.0)
LEAF = M("La_cay", "#2E6B2C", roughness=1.0)
LEAF_LIGHT = M("La_cay_nhat", "#4C8F3A", roughness=1.0)
TRUNK = M("Than_cay", "#5E4630", roughness=1.0)
SEA = M("Nuoc_bien", "#2E7F86", roughness=0.12)  # Web: không cản đường, không có mặt đất để đứng
BENCH_STONE = M("Ghe_da", "#D8D2C2", roughness=0.9)
BOLLARD = M("Coc_neo", "#2F3236", roughness=0.6)
BIN_GREEN = M("Thung_rac", "#2F8F4E", roughness=0.6)
LAMP_GLOW = M("Den_sang", "#FFF1B8", roughness=0.4, emission=1.5)
ROAD_LINE = M("Vach_son", "#F4F1E6", roughness=0.8)
POT = M("Chau_cay", "#A8553A", roughness=0.9)
WOOD = M("Go", "#8A5A35", roughness=0.85)
SHUTTER = M("Cua_chop", "#3E7D5A", roughness=0.7)
FLAG_RED = M("Co_do", "#DA251D", roughness=0.8)
FLAG_STAR = M("Sao_vang", "#FFDE00", roughness=0.8)
BOAT_BLUE = M("Thuyen_xanh", "#2443B8", roughness=0.5)
BOAT_RED = M("Thuyen_do", "#C5322A", roughness=0.5)
BOAT_YELLOW = M("Thuyen_vang", "#F0B81E", roughness=0.5)
BOAT_WHITE = M("Thuyen_trang", "#F5F5F0", roughness=0.4)
ENGINE = M("May_thuyen", "#3A3F47", roughness=0.5)
ORANGE = M("Ao_phao", "#F26A1B")
BUOY = M("Phao_vang", "#F4C21A", roughness=0.5)
BLACK = M("Lop_xe", "#1B1B1B", roughness=0.9)
BILLBOARD_RED = M("Bien_do", "#D21F1B", roughness=0.6)
BILLBOARD_GOLD = M("Chu_vang", "#FFD54A", roughness=0.6, emission=0.15)
SIGN_BLUE = M("Bien_xanh", "#1F5FBF", roughness=0.6)
SIGN_TEAL = M("Bien_P", "#27A3A0", roughness=0.6)
STEEL = M("Thep", "#B8BCC2", roughness=0.4)
MAST_RED = M("Cot_do", "#D3382C", roughness=0.6)
VAN_WHITE = M("Xe_trang", "#F4F4F2", roughness=0.4)
AWNING = M("Bat_quan", "#2B3A55", roughness=0.9)
SOLAR = M("Pin_mat_troi", "#1E2B4A", roughness=0.25)

# ---------- Hàm dựng hình ----------
def box(name, x0, x1, y0, y1, z0, z1, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    obj = bpy.context.object
    obj.name = name
    obj.scale = (abs(x1 - x0), abs(y1 - y0), abs(z1 - z0))
    obj.data.materials.append(material)
    return obj

def cyl(name, x, y, z0, z1, radius, material, vertices=12, radius_top=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius if radius_top is None else radius_top,
                                    depth=z1 - z0, location=(x, y, (z0 + z1) / 2))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj

def hip_roof(name, x0, x1, y0, y1, z, height, material, overhang=0.5):
    """Mái dốc bốn phía: chóp 4 cạnh xoay 45° rồi kéo theo kích thước nhà."""
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=math.sqrt(0.5), radius2=0.18, depth=1,
                                    location=((x0 + x1) / 2, (y0 + y1) / 2, z + height / 2), rotation=(0, 0, math.pi / 4))
    obj = bpy.context.object
    obj.name = name
    obj.scale = (x1 - x0 + 2 * overhang, y1 - y0 + 2 * overhang, height)
    obj.data.materials.append(material)
    return obj

def join(name, objects):
    objects = [o for o in objects if o]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if len(objects) > 1:
        bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    return obj

def railing(name, x0, x1, y, z, post_gap=2.0, height=1.0, along="x", material=WHITE):
    parts = []
    length = x1 - x0
    count = max(1, round(length / post_gap))
    for i in range(count + 1):
        p = x0 + length * i / count
        if along == "x":
            parts.append(box("post", p - 0.07, p + 0.07, y - 0.07, y + 0.07, z, z + height, material))
        else:
            parts.append(box("post", y - 0.07, y + 0.07, p - 0.07, p + 0.07, z, z + height, material))
    for level in (0.45, 0.95):
        if along == "x":
            parts.append(box("rail", x0, x1, y - 0.05, y + 0.05, z + height * level - 0.04, z + height * level + 0.04, material))
        else:
            parts.append(box("rail", y - 0.05, y + 0.05, x0, x1, z + height * level - 0.04, z + height * level + 0.04, material))
    return join(name, parts)

def hill_height(x, y):
    """Cao độ mặt đất phía sau bến. Khu bến tàu khách (x từ 35 đến 80) gần như bằng phẳng."""
    if y <= 14:
        return QUAY
    flat = 1 / (1 + math.exp(-(x - 34) / 5)) * (1 / (1 + math.exp((x - 84) / 5)))
    slope = 0.5 * (1 - 0.82 * flat)
    wave = 1 + 0.18 * math.sin(x * 0.07) + 0.12 * math.sin(x * 0.19 + y * 0.11)
    return QUAY + min(42, (y - 14) * slope * wave)

def window(x0, x1, y, z0, z1, facing, shutters=None):
    """Cửa sổ có khung trắng, kính lùi vào, bậu cửa và (tùy chọn) hai cánh chớp.
    facing: 'front' (mặt -Y), 'left' (mặt -X), 'right' (mặt +X). (x0, x1) là khoảng theo chiều ngang của mặt tường."""
    parts = []
    def rect(a0, a1, d0, d1, b0, b1, material):
        # a: theo chiều ngang của mặt tường, d: chiều sâu ra khỏi tường (dương = ra ngoài), b: cao độ
        if facing == "front":
            return box("w", a0, a1, y - d1, y - d0, b0, b1, material)
        if facing == "left":
            return box("w", y - d1, y - d0, a0, a1, b0, b1, material)
        return box("w", y + d0, y + d1, a0, a1, b0, b1, material)
    parts.append(rect(x0 - 0.12, x1 + 0.12, -0.02, 0.06, z0 - 0.12, z1 + 0.12, WHITE))  # khung
    parts.append(rect(x0, x1, 0.06, 0.08, z0, z1, GLASS))  # kính (nhô nhẹ khỏi khung để thấy rõ)
    parts.append(rect(x0 - 0.2, x1 + 0.2, -0.02, 0.18, z0 - 0.22, z0 - 0.1, WHITE))  # bậu cửa
    parts.append(rect(x0 - 0.15, x1 + 0.15, -0.02, 0.22, z1 + 0.12, z1 + 0.26, WHITE))  # gờ chắn mưa
    if shutters:
        leaf = (x1 - x0) / 2
        parts.append(rect(x0 - 0.12 - leaf, x0 - 0.14, 0.0, 0.07, z0, z1, shutters))
        parts.append(rect(x1 + 0.14, x1 + 0.12 + leaf, 0.0, 0.07, z0, z1, shutters))
    return parts

def building(name, x0, x1, y0, y1, floors, wall, roof, base=None, floor_height=3.3, roof_height=2.2, band=None, flat=False,
             shutters=None, balcony=False, tank=False, door=True, porch=False):
    """Nhà phố ven biển: bệ móng, cửa sổ khung trắng ở mặt trước và hai hông, cửa ra vào có mái đón,
    ban công lan can ở các tầng trên (balcony), sảnh cột (porch), bồn nước inox trên mái bằng (tank)."""
    z0 = hill_height((x0 + x1) / 2, y0) if base is None else base
    z1 = z0 + floors * floor_height
    parts = [box("wall", x0, x1, y0, y1, z0 - 1.5, z1, wall),
             box("plinth", x0 - 0.12, x1 + 0.12, y0 - 0.12, y1 + 0.12, z0 - 1.5, z0 + 0.45, CONCRETE_DARK)]
    width, depth = x1 - x0, y1 - y0
    columns = max(2, int(width // 2.8))
    side_columns = max(1, int(depth // 3.2))
    door_column = columns // 2 if door else -1
    for floor in range(floors):
        zw = z0 + floor * floor_height + 1.0
        for c in range(columns):
            cx = x0 + width * (c + 0.5) / columns
            if floor == 0 and c == door_column:
                # Cửa ra vào: cánh cửa kính khung gỗ, bậc thềm và mái đón nhỏ
                parts += [box("door_frame", cx - 0.85, cx + 0.85, y0 - 0.06, y0 + 0.02, z0, z0 + 2.55, WOOD),
                          box("door_glass", cx - 0.7, cx + 0.7, y0 - 0.09, y0 - 0.05, z0 + 0.1, z0 + 2.4, GLASS),
                          box("step", cx - 1.3, cx + 1.3, y0 - 0.9, y0, z0 - 0.3, z0 + 0.12, CONCRETE),
                          box("canopy", cx - 1.4, cx + 1.4, y0 - 1.2, y0, z0 + 2.75, z0 + 2.9, roof if not flat else WHITE)]
                continue
            parts += window(cx - 0.6, cx + 0.6, y0, zw, zw + 1.45, "front", shutters)
        for c in range(side_columns):
            cy = y0 + depth * (c + 0.5) / side_columns
            parts += window(cy - 0.5, cy + 0.5, x0, zw, zw + 1.45, "left", shutters)
            parts += window(cy - 0.5, cy + 0.5, x1, zw, zw + 1.45, "right", shutters)
        if band and floor > 0:
            parts.append(box("band", x0 - 0.15, x1 + 0.15, y0 - 0.5, y0 + 0.1, z0 + floor * floor_height - 0.25, z0 + floor * floor_height + 0.1, band))
        if balcony and floor > 0:
            # Ban công giữa mặt tiền: sàn đua ra 1,2 m, lan can trắng
            bx0, bx1 = x0 + width * 0.25, x1 - width * 0.25
            zb = z0 + floor * floor_height
            parts += [box("balcony", bx0, bx1, y0 - 1.25, y0, zb - 0.18, zb, WHITE)]
            parts.append(railing("balcony_rail", bx0, bx1, y0 - 1.18, zb, post_gap=0.9, height=0.95))
            parts.append(railing("balcony_rail_l", y0 - 1.18, y0, bx0 + 0.06, zb, post_gap=0.9, height=0.95, along="y"))
            parts.append(railing("balcony_rail_r", y0 - 1.18, y0, bx1 - 0.06, zb, post_gap=0.9, height=0.95, along="y"))
    if porch:
        # Sảnh có 4 cột tròn và mái bằng đỡ phía trên lối vào
        px0, px1 = x0 + width * 0.3, x1 - width * 0.3
        parts.append(box("porch_roof", px0 - 0.4, px1 + 0.4, y0 - 2.6, y0, z0 + 3.0, z0 + 3.35, WHITE))
        for px in (px0, px0 + (px1 - px0) / 3, px0 + 2 * (px1 - px0) / 3, px1):
            parts.append(cyl("column", px, y0 - 2.2, z0, z0 + 3.0, 0.2, WHITE, vertices=10))
    if flat:
        parts.append(box("parapet", x0 - 0.2, x1 + 0.2, y0 - 0.2, y1 + 0.2, z1, z1 + 0.6, wall))
        parts.append(box("parapet_cap", x0 - 0.25, x1 + 0.25, y0 - 0.25, y1 + 0.25, z1 + 0.6, z1 + 0.7, WHITE))
        if tank:
            # Bồn nước inox nằm ngang trên chân đỡ, rất quen thuộc ở nhà dân ven biển
            tx, ty = x1 - 2.0, y1 - 2.0
            parts.append(box("tank_stand", tx - 1.0, tx + 1.0, ty - 0.6, ty + 0.6, z1, z1 + 0.6, STEEL))
            bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=0.55, depth=2.0, location=(tx, ty, z1 + 1.15), rotation=(0, math.pi / 2, 0))
            bpy.context.object.data.materials.append(STEEL)
            parts.append(bpy.context.object)
    else:
        parts.append(hip_roof("roof", x0, x1, y0, y1, z1, roof_height, roof))
        # Diềm mái: viền mỏng dưới mép mái cho mái có độ dày
        parts.append(box("eave", x0 - 0.5, x1 + 0.5, y0 - 0.5, y1 + 0.5, z1 - 0.12, z1 + 0.02, WHITE))
    return join(name, parts)

def tree(x, y, size=1.0, pine=False):
    z = hill_height(x, y)
    parts = [cyl("trunk", x, y, z - 0.5, z + 2.6 * size, 0.22 * size, TRUNK, vertices=6)]
    if pine:
        for i, (radius, zz) in enumerate(((2.2, 2.0), (1.7, 3.6), (1.1, 5.0))):
            parts.append(cyl("leaf", x, y, z + zz * size, z + (zz + 2.4) * size, radius * size, LEAF, vertices=7, radius_top=0.05))
    else:
        for dx, dy, dz, r in ((0, 0, 4.2, 2.6), (1.4, 0.5, 3.6, 1.9), (-1.2, -0.6, 3.8, 2.0), (0.2, 1.1, 5.2, 1.7)):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=r * size, location=(x + dx * size, y + dy * size, z + dz * size))
            leaf = bpy.context.object
            leaf.data.materials.append(LEAF_LIGHT if random.random() < 0.4 else LEAF)
            parts.append(leaf)
    return parts

def hull_mesh(name, length, width, height, material, bottom=None):
    """Thân thuyền mũi nhọn: mũi ở +X."""
    l, w, h = length / 2, width / 2, height
    top = [(-l, -w), (l * 0.45, -w), (l, 0), (l * 0.45, w), (-l, w)]
    low = [(-l * 0.92, -w * 0.6), (l * 0.4, -w * 0.6), (l * 0.82, 0), (l * 0.4, w * 0.6), (-l * 0.92, w * 0.6)]
    verts = [(x, y, h) for x, y in top] + [(x, y, 0) for x, y in low]
    n = len(top)
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, n + i, n + j, j))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj

def place(obj, x, y, z, heading):
    obj.location = (x, y, z)
    obj.rotation_euler = (0, 0, math.radians(heading))
    return obj

def open_boat(name, x, y, heading, length=7.5):
    """Xuồng xanh mở, máy ngoài phía đuôi, như trong ảnh."""
    parts = [hull_mesh("hull", length, 2.1, 0.85, BOAT_BLUE)]
    parts.append(box("keel", -length * 0.46, length * 0.2, -0.62, 0.62, -0.12, 0.02, BOAT_RED))
    parts.append(box("deck", -length * 0.44, length * 0.38, -0.85, 0.85, 0.5, 0.56, CONCRETE_DARK))
    parts.append(box("engine", -length * 0.5 - 0.55, -length * 0.5 + 0.05, -0.28, 0.28, 0.55, 1.35, ENGINE))
    parts.append(box("engine_leg", -length * 0.5 - 0.35, -length * 0.5 - 0.15, -0.1, 0.1, -0.4, 0.6, ENGINE))
    parts.append(box("vest", -0.5, 0.2, -0.5, 0.1, 0.56, 0.86, ORANGE))
    return place(join(name, parts), x, y, 0.0, heading)

def passenger_boat(name, x, y, heading, color, label, length=13.0):
    """Tàu khách cao tốc có cabin kín (vàng 'VĨNH THỰC', đỏ trắng)."""
    parts = [hull_mesh("hull", length, 3.2, 1.3, color)]
    parts.append(box("stripe", -length * 0.46, length * 0.36, -1.63, 1.63, 0.95, 1.2, BOAT_WHITE))
    parts.append(box("cabin", -length * 0.36, length * 0.22, -1.35, 1.35, 1.3, 2.75, BOAT_WHITE))
    parts.append(box("windows", -length * 0.33, length * 0.19, -1.38, 1.38, 1.85, 2.45, GLASS))
    parts.append(box("roof", -length * 0.38, length * 0.25, -1.45, 1.45, 2.75, 2.93, color))
    parts.append(box("engine", -length * 0.5 - 0.6, -length * 0.5 + 0.1, -0.9, 0.9, 0.7, 1.6, ENGINE))
    texts = []
    for side in (-1, 1):
        bpy.ops.object.text_add(location=(-length * 0.2, side * 1.64, 0.98))
        text = bpy.context.object
        text.data.body = label
        text.data.size = 0.42
        text.data.extrude = 0.01
        text.data.font = FONT
        text.rotation_euler = (math.pi / 2, 0, 0 if side < 0 else math.pi)
        if side > 0:
            text.location.x = length * 0.12
        text.data.materials.append(BLACK)
        bpy.ops.object.convert(target="MESH")
        texts.append(text)
    # Chữ gộp vào thân tàu, để cả chiếc tàu dập dềnh cùng nhau trên web. Gốc tọa độ ở giữa thân tàu.
    boat = join(name, parts + texts)
    return place(boat, x, y, 0.0, heading)

FONT = bpy.data.fonts.load("/System/Library/Fonts/Supplemental/Arial Bold.ttf")

def sign_text(name, body, x, y, z, size, material, align="CENTER"):
    bpy.ops.object.text_add(location=(x, y, z))
    text = bpy.context.object
    text.name = name
    text.data.body = body
    text.data.size = size
    text.data.extrude = 0.02
    text.data.align_x = align
    text.data.font = FONT
    text.rotation_euler = (math.pi / 2, 0, 0)
    text.data.materials.append(material)
    bpy.ops.object.convert(target="MESH")
    return text

# ---------- Biển và nền đất ----------
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -150, 0))
sea = bpy.context.object
sea.name = "Mat_bien"
sea.scale = (700, 420, 1)
sea.data.materials.append(SEA)

# Đồi phía sau bến
xs = [x for x in range(-110, 121, 5)]
ys = [y for y in range(14, 131, 4)]
verts = [(x, y, hill_height(x, y)) for y in ys for x in xs]
faces = []
for j in range(len(ys) - 1):
    for i in range(len(xs) - 1):
        a = j * len(xs) + i
        faces.append((a, a + 1, a + 1 + len(xs), a + len(xs)))
hill = bpy.data.meshes.new("Doi")
hill.from_pydata(verts, [], faces)
hill.update()
hill_obj = bpy.data.objects.new("Doi_sau_ben", hill)
scene.collection.objects.link(hill_obj)
hill_obj.data.materials.append(GRASS)
for polygon in hill.polygons:
    polygon.use_smooth = True

# Mặt bến, đường ven bờ và kè đá
box("Nen_ben", -110, 120, 0.6, 14.5, -2.5, QUAY - 0.05, CONCRETE_DARK)
box("Mat_ben", -110, 120, 0.0, 6.0, QUAY - 0.15, QUAY, CONCRETE)
box("Duong_ven_bo", -110, 120, 6.0, 12.5, QUAY - 0.15, QUAY + 0.02, ROAD)
box("Ke_da_trai", -110, 46.5, -0.6, 0.6, -2.5, QUAY, STONE)
box("Ke_da_phai", 53.5, 120, -0.6, 0.6, -2.5, QUAY, STONE)
# Bãi đá chân kè, lộ khi nước ròng
box("Bai_da_chan_ke", -40, 44, -4.5, -0.6, -2.5, 0.25, CONCRETE_DARK)
for i in range(40):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.35, 0.9),
                                          location=(random.uniform(-40, 44), random.uniform(-4.4, -0.9), 0.25))
    bpy.context.object.scale.z = 0.5
    bpy.context.object.data.materials.append(STONE)
    bpy.context.object.name = f"Da_{i:02d}"
join("Da_chan_ke", [o for o in scene.objects if o.name.startswith("Da_")])

# Lốp chắn va treo trên kè
tyres = []
for x in list(range(20, 46, 3)) + list(range(55, 80, 4)):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.42, minor_radius=0.16, major_segments=12, minor_segments=6,
                                     location=(x, -0.72, 1.6), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(BLACK)
    tyres.append(bpy.context.object)
join("Lop_chan_va", tyres)

# Lan can trắng dọc mép bến (ngắt ở bậc lên xuống)
railing("Lan_can_trai", -52, 46.5, 0.35, QUAY)
railing("Lan_can_phai", 53.5, 110, 0.35, QUAY)

# ---------- Bến tàu khách: bậc lên xuống và cầu dẫn thấp ----------
# 11 bậc cao 0,25 m, sâu 0,6 m, từ mặt bến xuống đúng mặt cầu dẫn (0,45 m).
# Bậc dốc hơn (sâu dưới ~0,55 m) thì người đi bộ trên web bị bậc thứ hai phía trước chặn như tường.
JETTY_TOP = 0.45
STEP_COUNT = 11
STEP_RISE = (QUAY - JETTY_TOP) / STEP_COUNT
STEP_DEPTH = 0.6
steps = []
for i in range(STEP_COUNT):
    steps.append(box("step", 46.5, 53.5, -0.6 - (i + 1) * STEP_DEPTH, 0.6, -2.5, QUAY - (i + 1) * STEP_RISE, CONCRETE))
join("Bac_len_xuong", steps)
STAIR_FOOT = -0.6 - STEP_COUNT * STEP_DEPTH
box("Cau_dan_thap", 48.2, 51.8, -42, STAIR_FOOT, -2.5, JETTY_TOP, CONCRETE)
jetty_tyres = []
for y in range(-40, int(STAIR_FOOT), 4):
    for x in (48.05, 51.95):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.14, major_segments=12, minor_segments=6,
                                         location=(x, y, 0.2), rotation=(0, math.pi / 2, 0))
        bpy.context.object.data.materials.append(BLACK)
        jetty_tyres.append(bpy.context.object)
join("Lop_cau_dan", jetty_tyres)

# Chốt kiểm soát, biển cổ động, biển xanh, nhà chờ mái tôn xanh, biển P
join("Chot_kiem_soat", [box("b", 40.5, 43.3, 3.0, 5.6, QUAY, QUAY + 2.7, CREAM),
                        box("g", 40.9, 42.9, 2.94, 3.0, QUAY + 1.1, QUAY + 2.1, GLASS),
                        hip_roof("r", 40.5, 43.3, 3.0, 5.6, QUAY + 2.7, 0.7, ROOF_DARK, overhang=0.3)])
join("Bien_co_dong", [box("board", 60, 69, 4.3, 4.55, QUAY + 2.2, QUAY + 6.6, BILLBOARD_RED),
                      box("picture", 60.5, 68.5, 4.24, 4.3, QUAY + 2.5, QUAY + 4.6, BILLBOARD_GOLD),
                      box("leg1", 61, 61.3, 4.3, 4.6, QUAY, QUAY + 2.2, STEEL), box("leg2", 67.7, 68, 4.3, 4.6, QUAY, QUAY + 2.2, STEEL)])
sign_text("Chu_bien_co_dong_1", "NHIỆT LIỆT CHÀO MỪNG", 64.5, 4.22, QUAY + 5.75, 0.55, BILLBOARD_GOLD)
sign_text("Chu_bien_co_dong_2", "ĐẾN VỚI ĐẢO VĨNH THỰC", 64.5, 4.22, QUAY + 4.95, 0.55, BILLBOARD_GOLD)
join("Bien_xanh", [box("board", 55.5, 58.6, 4.3, 4.45, QUAY + 2.6, QUAY + 4.6, SIGN_BLUE),
                   box("leg", 56.9, 57.1, 4.3, 4.5, QUAY, QUAY + 2.6, STEEL)])
sign_text("Chu_bien_xanh_1", "CẢNG", 57.05, 4.26, QUAY + 3.8, 0.55, WHITE)
sign_text("Chu_bien_xanh_2", "VẠN GIA", 57.05, 4.26, QUAY + 3.05, 0.5, WHITE)
# Nhà chờ mái tôn xanh: mặt trước để trống cho khách đi vào ngồi; tường hậu và hai đầu hồi kín,
# góc phải có phòng vé nhỏ.
shelter = [box("back", 71, 92, 13.6, 14, QUAY, QUAY + 3.0, CONCRETE),
           box("side_l", 71, 71.4, 8.5, 14, QUAY, QUAY + 3.0, CONCRETE),
           box("side_r", 91.6, 92, 8.5, 14, QUAY, QUAY + 3.0, CONCRETE),
           box("floor", 71, 92, 7.5, 14, QUAY, QUAY + 0.12, CONCRETE),
           box("roof", 70.4, 92.6, 6.6, 14.6, QUAY + 3.0, QUAY + 3.35, ROOF_GREEN),
           box("fascia", 70.4, 92.6, 6.55, 6.7, QUAY + 2.55, QUAY + 3.0, ROOF_GREEN)]
for x in range(72, 92, 4):
    shelter.append(box("post", x - 0.09, x + 0.09, 7.0, 7.18, QUAY, QUAY + 3.0, STEEL))
for x0 in (73, 78.5, 84):
    shelter += [box("seat", x0, x0 + 4.2, 11.6, 12.4, QUAY + 0.42, QUAY + 0.5, STEEL),
                box("seat_back", x0, x0 + 4.2, 12.35, 12.45, QUAY + 0.5, QUAY + 0.95, STEEL),
                box("seat_leg", x0 + 0.2, x0 + 0.4, 11.8, 12.2, QUAY, QUAY + 0.42, STEEL),
                box("seat_leg", x0 + 3.8, x0 + 4.0, 11.8, 12.2, QUAY, QUAY + 0.42, STEEL)]
shelter += [box("ticket", 88.5, 91.6, 9.2, 13.6, QUAY, QUAY + 2.6, CREAM),
            box("ticket_glass", 89.0, 91.2, 9.14, 9.2, QUAY + 1.0, QUAY + 2.0, GLASS),
            box("ticket_desk", 88.8, 91.4, 8.9, 9.2, QUAY + 0.95, QUAY + 1.0, WHITE)]
join("Nha_cho_mai_ton", shelter)
sign_text("Chu_nha_cho", "NHÀ CHỜ TÀU KHÁCH", 79.5, 6.5, QUAY + 2.62, 0.34, WHITE)
sign_text("Chu_phong_ve", "PHÒNG VÉ", 90.05, 9.1, QUAY + 2.15, 0.22, SIGN_BLUE)
join("Bien_P", [box("p1", 93.5, 96.2, 5.0, 5.2, QUAY + 5.2, QUAY + 7.0, SIGN_TEAL), box("p2", 94.3, 96.2, 5.0, 5.2, QUAY + 3.2, QUAY + 5.0, SIGN_TEAL),
                box("pole", 94.9, 95.1, 5.05, 5.25, QUAY, QUAY + 5.2, STEEL)])
sign_text("Chu_P", "P", 94.85, 4.96, QUAY + 5.5, 1.3, WHITE)
# Xe khách đỗ chờ
for i, x in enumerate((44.5, 47.4, 54.5)):
    join(f"Xe_khach_{i + 1}", [box("body", x, x + 2.1, 6.6, 11.8, QUAY + 0.35, QUAY + 2.45, VAN_WHITE),
                               box("glass", x + 0.15, x + 1.95, 6.54, 6.6, QUAY + 1.35, QUAY + 2.2, GLASS),
                               box("wheel1", x - 0.05, x + 2.15, 7.4, 8.1, QUAY, QUAY + 0.7, BLACK), box("wheel2", x - 0.05, x + 2.15, 10.3, 11.0, QUAY, QUAY + 0.7, BLACK)])

# ---------- Kè có hàng quán và nhà trên đồi ----------
for i, x in enumerate(range(-6, 34, 10)):
    join(f"Hang_quan_{i + 1}", [box("awning", x, x + 8.5, 1.6, 5.8, QUAY + 2.6, QUAY + 2.8, AWNING if i % 2 == 0 else ROOF_GREEN),
                                box("p1", x + 0.2, x + 0.35, 1.8, 1.95, QUAY, QUAY + 2.6, STEEL), box("p2", x + 8.1, x + 8.25, 1.8, 1.95, QUAY, QUAY + 2.6, STEEL),
                                box("p3", x + 0.2, x + 0.35, 5.4, 5.55, QUAY, QUAY + 2.6, STEEL), box("p4", x + 8.1, x + 8.25, 5.4, 5.55, QUAY, QUAY + 2.6, STEEL),
                                box("table", x + 2.5, x + 6, 3.0, 4.2, QUAY + 0.7, QUAY + 0.8, WHITE),
                                box("table_leg", x + 4.1, x + 4.4, 3.45, 3.75, QUAY, QUAY + 0.7, STEEL),
                                # Ghế nhựa thấp kiểu quán ven biển
                                *[box("stool", sx - 0.22, sx + 0.22, sy - 0.22, sy + 0.22, QUAY, QUAY + 0.42, BOAT_BLUE if i % 2 else BOAT_RED)
                                  for sx in (x + 3.0, x + 4.3, x + 5.6) for sy in (2.55, 4.65)],
                                box("counter", x + 6.6, x + 8.0, 4.4, 5.5, QUAY, QUAY + 1.0, CREAM)])
building("Biet_thu_vang", -2, 14, 22, 33, 3, YELLOW_WALL, ROOF_RED, band=WHITE, shutters=SHUTTER, balcony=True)
building("Nha_mai_trang", -16, -6, 16, 24, 1, WHITE, ROOF_DARK, roof_height=2.6, shutters=SHUTTER)
building("Nha_trang_nho", 20, 27, 20, 27, 2, WHITE, ROOF_RED, shutters=SHUTTER, balcony=True)
building("Nha_trang_hien_dai", 36, 46, 22, 31, 3, WHITE, ROOF_DARK, flat=True, balcony=True, tank=True)

# ---------- Trạm Vạn Gia và nhà hải quan (bên trái khi nhìn từ biển) ----------
building("Nha_hai_quan", -30, -17, 14.5, 25, 3, YELLOW_WALL, ROOF_RED, base=QUAY, band=PINK_BAND, flat=True, porch=True)
box("Mai_hien_hai_quan", -31, -16, 12.8, 14.6, QUAY + 6.5, QUAY + 6.9, ROOF_RED)
sign_text("Chu_hai_quan", "HẢI QUAN", -23.5, 14.38, QUAY + 3.55, 0.7, SIGN_BLUE)
tram = building("Tram_Van_Gia_vang", -47, -35, 15, 24, 2, YELLOW_WALL, ROOF_RED, base=QUAY, roof_height=3.0, shutters=SHUTTER)
box("Pin_mat_troi", -45, -38, 15.2, 18.6, QUAY + 8.15, QUAY + 8.25, SOLAR).rotation_euler = (math.radians(-24), 0, 0)
building("Tram_Van_Gia_kem", -60, -49, 15, 23, 2, CREAM, ROOF_RED, base=QUAY, shutters=SHUTTER)

# Cột cờ trước nhà hải quan và trạm. Lá cờ là vật thể động (bay trong gió trên web), xem DYNAMIC bên dưới.
def ball(x, y, z, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=radius, location=(x, y, z))
    obj = bpy.context.object
    obj.data.materials.append(material)
    return obj

def star_mesh(name, cx, y, cz, radius, material):
    """Ngôi sao năm cánh phẳng trong mặt phẳng XZ (đối diện trục Y)."""
    verts = [(cx, y, cz)]
    for k in range(10):
        r = radius if k % 2 == 0 else radius * 0.38
        a = math.pi / 2 + k * math.pi / 5
        verts.append((cx + r * math.cos(a), y, cz + r * math.sin(a)))
    faces = [(0, 1 + k, 1 + (k + 1) % 10) for k in range(10)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj

FLAGS = []
# Bãi bê tông giữa đường ven bờ (hết ở y = 12,5) và mặt nhà: cạnh nhà hải quan và giữa hai dãy nhà của trạm
for i, (fx, fy) in enumerate(((-32.0, 13.6), (-48.0, 13.6))):
    join(f"Cot_co_{i + 1}", [cyl("pole", fx, fy, QUAY, QUAY + 9.0, 0.07, STEEL, vertices=8),
                             box("base", fx - 0.5, fx + 0.5, fy - 0.5, fy + 0.5, QUAY, QUAY + 0.3, CONCRETE),
                             ball(fx, fy, QUAY + 9.05, 0.12, STEEL)])
    # Lá cờ: lưới chia ô để web uốn sóng; gốc tọa độ ở mép cán cờ, lá cờ kéo theo +X
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=12, y_subdivisions=6, size=1, location=(0, 0, 0))
    cloth = bpy.context.object
    cloth.name = f"Co_{i + 1}"
    cloth.scale = (2.4, 1.6, 1)
    cloth.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for v in cloth.data.vertices:
        v.co.x += 1.2  # mép trái của lá cờ nằm ở gốc (cán cờ)
    cloth.data.materials.append(FLAG_RED)
    stars = [star_mesh("star", 1.2, side * 0.02, 0.0, 0.48, FLAG_STAR) for side in (-1, 1)]
    cloth = join(f"Co_{i + 1}", [cloth] + stars)
    cloth.location = (fx + 0.07, fy, QUAY + 8.7 - 0.8)
    FLAGS.append(cloth)
# Lán của ngư dân phía ngoài cùng
for i, x in enumerate((-100, -90)):
    join(f"Lan_ngu_dan_{i + 1}", [box("wall", x, x + 8, 4, 10, QUAY, QUAY + 2.4, CONCRETE_DARK), box("roof", x - 0.4, x + 8.4, 3.5, 10.5, QUAY + 2.4, QUAY + 2.65, ROOF_GREEN)])

# ---------- Cầu cảng bê tông ----------
PIER_X0, PIER_X1 = -66.5, -62.5
deck = [box("walkway", PIER_X0, PIER_X1, -26, 0.6, QUAY - 0.5, QUAY, CONCRETE),
        box("head", -86, PIER_X1, -34, -26, QUAY - 0.6, QUAY, CONCRETE)]
for y in range(-24, 0, 6):
    for x in (PIER_X0 + 0.5, PIER_X1 - 0.5):
        deck.append(box("pile", x - 0.5, x + 0.5, y - 0.5, y + 0.5, -2.5, QUAY - 0.5, CONCRETE_DARK))
for x in range(-85, -62, 5):
    for y in (-33, -27):
        deck.append(box("pile", x - 0.7, x + 0.7, y - 0.7, y + 0.7, -2.5, QUAY - 0.6, CONCRETE_DARK))
    deck.append(box("beam", x - 0.7, x + 0.7, -33.7, -26.3, QUAY - 1.5, QUAY - 0.6, CONCRETE_DARK))
join("Cau_cang_be_tong", deck)
stripes = []
for i, x in enumerate(range(-86, -63, 1)):
    stripes.append(box("s", x, x + 1, -34.15, -34.0, QUAY - 0.45, QUAY, BUOY if i % 2 == 0 else BLACK))
join("Mep_vang_den", stripes)
railing("Lan_can_cau_1", -26, 0.3, PIER_X0 + 0.15, QUAY, along="y")
railing("Lan_can_cau_2", -26, 0.3, PIER_X1 - 0.15, QUAY, along="y")
railing("Lan_can_dau_cau", -86, -67.5, -26.2, QUAY)
pier_tyres = []
for x in range(-84, -63, 4):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.5, minor_radius=0.19, major_segments=12, minor_segments=6,
                                     location=(x, -34.3, 1.6), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(BLACK)
    pier_tyres.append(bpy.context.object)
join("Lop_cau_cang", pier_tyres)
# Cột đèn pha cao ở gốc cầu và cột đèn thấp
join("Cot_den_pha", [cyl("pole", -58, 2.5, QUAY, QUAY + 17, 0.16, STEEL, radius_top=0.09), box("lamp", -59, -57, 2.2, 2.8, QUAY + 17, QUAY + 17.4, STEEL)])
join("Cot_den_thap", [cyl("pole", -33, 2.5, QUAY, QUAY + 9, 0.1, STEEL), box("lamp", -33.6, -32.4, 2.3, 2.7, QUAY + 9, QUAY + 9.2, STEEL)])

# ---------- Cột viễn thông sau bến ----------
mast = []
MX, MY = 62, 34
mz = hill_height(MX, MY)
for i in range(15):
    z0 = mz + i * 3
    w = 1.6 - i * 0.085
    colour = MAST_RED if i % 2 == 0 else WHITE
    for dx, dy in ((-1, -1), (1, -1), (0, 1)):
        mast.append(box("leg", MX + dx * w / 2 - 0.07, MX + dx * w / 2 + 0.07, MY + dy * w / 2 - 0.07, MY + dy * w / 2 + 0.07, z0, z0 + 3, colour))
    mast.append(box("brace", MX - w / 2, MX + w / 2, MY - w / 2 - 0.04, MY - w / 2 + 0.04, z0 + 2.9, z0 + 3.0, colour))
mast.append(box("antenna", MX - 0.25, MX + 0.25, MY - 0.25, MY + 0.25, mz + 41, mz + 44, WHITE))
join("Cot_vien_thong", mast)

# ---------- Đồ vật trên bến, ở tầm mắt người đi bộ ----------
# Cọc neo đen dọc mép bến khu tàu khách
bollards = []
for x in list(range(-48, 46, 8)) + list(range(57, 110, 8)):
    bollards.append(cyl("bollard", x, 1.0, QUAY, QUAY + 0.55, 0.22, BOLLARD, vertices=10))
    bollards.append(cyl("bollard_cap", x, 1.0, QUAY + 0.55, QUAY + 0.68, 0.3, BOLLARD, vertices=10))
join("Coc_neo", bollards)

# Ghế đá quay ra biển (bỏ khoảng có hàng quán và bậc lên xuống tàu)
benches = []
for x in (-44, -36, -26, -16, 36, 58, 70, 84, 98):
    benches += [box("seat", x, x + 2.0, 4.6, 5.1, QUAY + 0.38, QUAY + 0.48, BENCH_STONE),
                box("leg", x + 0.15, x + 0.45, 4.65, 5.05, QUAY, QUAY + 0.38, BENCH_STONE),
                box("leg", x + 1.55, x + 1.85, 4.65, 5.05, QUAY, QUAY + 0.38, BENCH_STONE)]
join("Ghe_da", benches)

# Cột đèn đường dọc bến, có bóng sáng để dùng cho cảnh ban đêm
poles, lamps = [], []
for x in range(-54, 112, 14):
    if 44 < x < 56:
        continue
    poles.append(cyl("pole", x, 5.7, QUAY, QUAY + 5.2, 0.07, STEEL, vertices=8))
    poles.append(box("arm", x - 0.05, x + 0.05, 5.0, 5.75, QUAY + 5.1, QUAY + 5.2, STEEL))
    lamps.append(box("lamp", x - 0.22, x + 0.22, 4.75, 5.15, QUAY + 4.95, QUAY + 5.1, LAMP_GLOW))
join("Cot_den_ben", poles)
join("Bong_den_ben", lamps)

# Thùng rác và chậu cây
bins = []
for x in (-40, -12, 34, 56.5, 74, 96):
    bins.append(cyl("bin", x, 5.3, QUAY, QUAY + 0.9, 0.3, BIN_GREEN, vertices=10))
join("Thung_rac", bins)
pots = []
for x in (44.0, 55.8, 70.0, 92.6):
    pots.append(cyl("pot", x, 5.6, QUAY, QUAY + 0.6, 0.45, POT, vertices=10))
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.6, location=(x, 5.6, QUAY + 1.05))
    bpy.context.object.data.materials.append(LEAF_LIGHT)
    pots.append(bpy.context.object)
join("Chau_cay", pots)

# Phao cứu sinh treo cạnh bậc xuống tàu
for i, x in enumerate((45.6, 54.4)):
    join(f"Gia_phao_{i + 1}", [box("post", x - 0.06, x + 0.06, 0.9, 1.02, QUAY, QUAY + 1.6, WOOD)])
    bpy.ops.mesh.primitive_torus_add(major_radius=0.34, minor_radius=0.09, major_segments=14, minor_segments=6,
                                     location=(x, 0.84, QUAY + 1.25), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(ORANGE)
    bpy.context.object.name = f"Phao_cuu_sinh_{i + 1}"

# Vạch giữa đường ven bờ và vạch qua đường từ bậc tàu sang nhà chờ
lines = [box("dash", x, x + 3, 9.17, 9.33, QUAY + 0.02, QUAY + 0.04, ROAD_LINE) for x in range(-108, 118, 6) if not 46 < x < 56]
lines += [box("zebra", x, x + 0.5, 6.1, 12.4, QUAY + 0.02, QUAY + 0.04, ROAD_LINE) for x in (47.0, 48.0, 49.0, 50.0, 51.0, 52.0)]
join("Vach_duong", lines)

# ---------- Cây ----------
tree_parts = []
for _ in range(190):
    x = random.uniform(-108, 118)
    y = random.uniform(16, 126)
    near_building = any(ax - 4 < x < bx + 4 and ay - 4 < y < by + 6 for ax, bx, ay, by in
                        ((-2, 14, 22, 33), (-16, -6, 16, 24), (20, 27, 20, 27), (36, 46, 22, 31), (-30, -17, 14, 25), (-47, -35, 15, 24), (-60, -49, 15, 23), (71, 92, 7, 14)))
    if near_building or (36 < x < 100 and y < 22):
        continue
    tree_parts += tree(x, y, size=random.uniform(0.9, 1.5), pine=random.random() < 0.4)
# Hàng cây che bóng dọc mép bến
for x in (-10, 2, 15, 27, 36, 58, 66, 100, 108):
    tree_parts += tree(x, 13.2, size=1.25)
join("Cay_coi", tree_parts)

# ---------- Thuyền ----------
# Thuyền, phao và lá cờ là vật thể động: xuất riêng ra cang_van_gia_dong.glb để web cho dập dềnh, bay phấp phới.
DYNAMIC = list(FLAGS)
DYNAMIC.append(passenger_boat("Tau_Vinh_Thuc_08", 22, -19, 4, BOAT_YELLOW, "VĨNH THỰC 08"))
# Tàu 06 là tàu khách ra vào: web cho chạy từ ngoài khơi vào cập cầu dẫn rồi rời bến.
DYNAMIC.append(passenger_boat("Tau_Vinh_Thuc_06", -8, -60, 172, BOAT_YELLOW, "VĨNH THỰC 06"))
DYNAMIC.append(passenger_boat("Tau_Khanh_Hai", 66, -9, 3, BOAT_RED, "KHÁNH HẢI", length=11))
for i, (x, y, heading) in enumerate(((45.2, -12, 75), (45.0, -18, 80), (44.8, -24, 78), (44.9, -30, 82), (54.8, -14, 105), (55.0, -21, 100),
                                     (38, -8, 8), (30, -46, 30), (84, -30, 200))):
    DYNAMIC.append(open_boat(f"Xuong_xanh_{i + 1:02d}", x, y, heading))
# Tàu công tác vỏ xanh cập cầu cảng
tug = [hull_mesh("hull", 16, 4.6, 2.0, BOAT_BLUE)]
tug.append(box("deck", -7.2, 5.5, -2.1, 2.1, 1.9, 2.05, CONCRETE_DARK))
tug.append(box("cabin", -1.5, 4.0, -1.6, 1.6, 2.05, 4.6, BOAT_WHITE))
tug.append(box("glass", -1.55, 4.05, -1.62, 1.62, 3.4, 4.1, GLASS))
tug.append(box("mast", 1.1, 1.3, -0.1, 0.1, 4.6, 7.2, STEEL))
tug.append(box("cargo", -6.5, -3, -1.2, 1.2, 2.05, 2.8, BOAT_BLUE))
DYNAMIC.append(place(join("Tau_cong_tac", tug), -74, -37.4, -0.2, 180))
# Phao neo: mỗi phao là một vật thể riêng, gốc ở tâm phao
for i, (x, y) in enumerate(((8, -30), (10.2, -30.6), (35, -38), (-25, -48), (70, -40), (95, -22))):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.75, location=(x, y, 0.15))
    buoy = bpy.context.object
    buoy.name = f"Phao_neo_{i + 1}"
    buoy.scale.x = 1.25
    buoy.data.materials.append(BUOY)
    DYNAMIC.append(buoy)

# ---------- Ánh sáng, nền trời ----------
world = bpy.data.worlds.new("Troi")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.74, 0.95, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.1
sun_data = bpy.data.lights.new("Mat_troi", "SUN")
sun_data.energy = 4.0
sun_data.angle = math.radians(2)
sun = bpy.data.objects.new("Mat_troi", sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(52), 0, math.radians(-150))

# ---------- Lưu, xuất và dựng ảnh xem trước ----------
# Vật thể động: đổ màu vật liệu vào màu đỉnh rồi dùng chung một vật liệu, để mỗi chiếc thuyền chỉ tốn
# một lệnh vẽ trên web (bản động không được gộp mesh như bản tĩnh, vì web cần từng vật thể riêng để cử động).
DYNAMIC_MAT = bpy.data.materials.new("MAT_Dong")
DYNAMIC_MAT.use_nodes = True
_nodes = DYNAMIC_MAT.node_tree.nodes
_attr = _nodes.new("ShaderNodeVertexColor")
_attr.layer_name = "Col"
DYNAMIC_MAT.node_tree.links.new(_attr.outputs["Color"], _nodes["Principled BSDF"].inputs["Base Color"])
_nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.6

def bake_vertex_colors(obj):
    mesh = obj.data
    colors = mesh.color_attributes.new(name="Col", type="BYTE_COLOR", domain="CORNER")
    for polygon in mesh.polygons:
        source = mesh.materials[polygon.material_index]
        color = source.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value
        for loop in polygon.loop_indices:
            colors.data[loop].color = color
    mesh.color_attributes.active_color = colors
    mesh.materials.clear()
    mesh.materials.append(DYNAMIC_MAT)

for obj in DYNAMIC:
    bake_vertex_colors(obj)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "cang_van_gia.blend"))

def export(filename, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    options = dict(filepath=os.path.join(OUT, filename), export_format="GLB", export_apply=True, export_lights=False,
                   export_cameras=False, use_selection=True)
    try:
        bpy.ops.export_scene.gltf(**options, export_vertex_color="ACTIVE")
    except TypeError:
        bpy.ops.export_scene.gltf(**options)

dynamic_names = {obj.name for obj in DYNAMIC}
export("cang_van_gia.glb", [o for o in scene.objects if o.type == "MESH" and o.name not in dynamic_names])
export("cang_van_gia_dong.glb", DYNAMIC)

camera_data = bpy.data.cameras.new("May_anh")
camera = bpy.data.objects.new("May_anh", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.clip_end = 2000
engines = [item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 1600, 900
scene.view_settings.view_transform = "Standard"

VIEWS = {
    "1_toan_canh_tu_bien": ((5, -150, 26), (5, 10, 8), 35),
    "2_tren_cao": ((40, -120, 110), (0, 5, 0), 30),
    "3_ben_tau_khach": ((66, -52, 9), (55, 6, 6), 32),
    "4_cau_cang_va_tram": ((-112, -78, 15), (-62, -6, 5), 32),
    "5_ke_va_biet_thu": ((16, -62, 7), (8, 18, 10), 35),
    # Tầm mắt người đi bộ (1,6 m) ở đầu bậc tàu khách, nhìn về nhà chờ và phòng vé
    "6_tam_mat_dau_bac": ((47, 2.5, QUAY + 1.6), (72, 9, QUAY + 1.5), 24),
    "7_tam_mat_hang_quan": ((-2, 3.4, QUAY + 1.6), (30, 4, QUAY + 1.4), 22),
    # Kiến trúc: dãy nhà hải quan và trạm, biệt thự vàng có ban công
    "8_hai_quan_va_tram": ((-30, -14, QUAY + 4), (-38, 18, QUAY + 5), 28),
    "9_biet_thu_ban_cong": ((10, -6, QUAY + 5), (6, 26, QUAY + 9), 30),
}
for name, (position, target, lens) in VIEWS.items():
    camera.location = position
    camera_data.lens = lens
    camera.rotation_euler = (Vector(target) - Vector(position)).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = os.path.join(OUT, f"preview_{name}.png")
    bpy.ops.render.render(write_still=True)

triangles = sum(len(p.vertices) - 2 for o in scene.objects if o.type == "MESH" for p in o.data.polygons)
print(f"CANG_VAN_GIA_OK objects={len([o for o in scene.objects if o.type == 'MESH'])} triangles={triangles} engine={scene.render.engine}")
