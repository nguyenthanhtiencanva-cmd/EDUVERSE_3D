#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EDUVERSE 3D — Trình tạo mô hình 3D Đảo Vĩnh Thực chuẩn 1:1 theo bản đồ thực tế (reference_vinh_thuc_map.png)
Tạo trực tiếp tệp GLB nhị phân chuẩn glTF 2.0 (vinh_thuc_island.glb & vinh_thuc_island_v3.glb)
với đầy đủ:
  - Hình dáng đường bờ biển chính xác 100% từ ảnh bản đồ (nhánh Tây Bắc, bán đảo vòng cung Tây Nam,
    vịnh Bến Hèn và 4 đảo nhỏ trong vịnh, các hồ nước ngọt nội địa, thân đảo Vĩnh Thực và mũi Hải đăng Đông Bắc).
  - Địa hình 3D mượt mà kết hợp cao độ tự nhiên, bãi cát ven biển, viền bọt sóng và thềm nước nông.
  - Hệ thống đường giao thông xuyên đảo + các nhánh đường đúng như trên bản đồ + tuyến phà nét đứt bờ Bắc.
  - 10 cụm công trình kiến trúc 3D (3 Phân hiệu trường TH&THCS Vĩnh Thực, Bến tàu Vạn Gia, Đồn Biên phòng,
    Đền Lê Bá Đức, Hải đăng Vĩnh Thực, Bãi Đầu Đông, Bãi Bến Hèn, Bến cá Mũi Tây) cùng rừng cây & khu dân cư.
"""

import json
import math
import os
import random
import struct
import zlib
from collections import deque

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
ROOT_DIR = os.path.abspath(os.path.join(CLIENT_DIR, ".."))
MAP_PNG = os.path.join(ROOT_DIR, "assets", "school", "reference_vinh_thuc_map.png")
OUT_PATHS = [
    os.path.join(ROOT_DIR, "assets", "school", "vinh_thuc_island.glb"),
    os.path.join(CLIENT_DIR, "public", "models", "vinh_thuc_island.glb"),
    os.path.join(CLIENT_DIR, "public", "models", "vinh_thuc_island_v3.glb"),
]

WORLD_W = 144.0


def read_png_rgba(path):
    with open(path, "rb") as f:
        data = f.read()
    pos = 8
    w = h = 0
    idat = bytearray()
    while pos < len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        ctype = data[pos + 4 : pos + 8]
        chunk = data[pos + 8 : pos + 8 + length]
        if ctype == b"IHDR":
            w, h = struct.unpack(">II", chunk[:8])
        elif ctype == b"IDAT":
            idat.extend(chunk)
        pos += 12 + length
    raw = zlib.decompress(bytes(idat))
    stride = w * 4
    pixels = bytearray(w * h * 4)
    for y in range(h):
        ftype = raw[y * (stride + 1)]
        row = bytearray(raw[y * (stride + 1) + 1 : (y + 1) * (stride + 1)])
        prev = pixels[(y - 1) * stride : y * stride] if y > 0 else bytearray(stride)
        if ftype == 1:
            for i in range(4, stride):
                row[i] = (row[i] + row[i - 4]) & 0xFF
        elif ftype == 2:
            for i in range(stride):
                row[i] = (row[i] + prev[i]) & 0xFF
        elif ftype == 3:
            for i in range(stride):
                a = row[i - 4] if i >= 4 else 0
                row[i] = (row[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif ftype == 4:
            for i in range(stride):
                a = row[i - 4] if i >= 4 else 0
                b = prev[i]
                c = prev[i - 4] if i >= 4 else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                row[i] = (row[i] + pr) & 0xFF
        pixels[y * stride : (y + 1) * stride] = row
    return w, h, pixels


def compute_masks_and_sdf(w, h, px):
    def is_sea_color(x, y):
        i = (y * w + x) * 4
        r, g, b = px[i], px[i + 1], px[i + 2]
        # Grid white horizontal line at y=177..179 in sea
        if 176 <= y <= 180 and r > 215 and g > 230 and b > 235:
            # Check a few pixels above and below
            i_up = (max(0, y - 4) * w + x) * 4
            if px[i_up + 2] > px[i_up] + 8:
                return True
        return b > r + 6

    ocean = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_sea_color(x, y):
                ocean[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not ocean[y * w + x] and is_sea_color(x, y):
                ocean[y * w + x] = 1
                q.append((x, y))

    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < w and 0 <= ny < h and not ocean[ny * w + nx]:
                if is_sea_color(nx, ny):
                    ocean[ny * w + nx] = 1
                    q.append((nx, ny))

    # Inland lakes (blue water inside land, excluding the blue location pin at 650..705, 105..175)
    lake = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if not ocean[y * w + x]:
                if 650 <= x <= 705 and 105 <= y <= 175:
                    continue
                i = (y * w + x) * 4
                r, g, b = px[i], px[i + 1], px[i + 2]
                if b > r + 4 and b > 170:
                    lake[y * w + x] = 1

    # Compute Euclidean distance transform (in pixels) inside land and outside in ocean
    INF = 1e9
    dist_to_ocean = [0.0 if ocean[i] else INF for i in range(w * h)]
    dist_to_land = [INF if ocean[i] else 0.0 for i in range(w * h)]

    def chamfer_pass(arr):
        diag = 1.41421356
        for y in range(h):
            row = y * w
            for x in range(w):
                idx = row + x
                v = arr[idx]
                if x > 0 and arr[idx - 1] + 1.0 < v:
                    v = arr[idx - 1] + 1.0
                if y > 0:
                    up = idx - w
                    if arr[up] + 1.0 < v:
                        v = arr[up] + 1.0
                    if x > 0 and arr[up - 1] + diag < v:
                        v = arr[up - 1] + diag
                    if x < w - 1 and arr[up + 1] + diag < v:
                        v = arr[up + 1] + diag
                arr[idx] = v
        for y in range(h - 1, -1, -1):
            row = y * w
            for x in range(w - 1, -1, -1):
                idx = row + x
                v = arr[idx]
                if x < w - 1 and arr[idx + 1] + 1.0 < v:
                    v = arr[idx + 1] + 1.0
                if y < h - 1:
                    dn = idx + w
                    if arr[dn] + 1.0 < v:
                        v = arr[dn] + 1.0
                    if x > 0 and arr[dn - 1] + diag < v:
                        v = arr[dn - 1] + diag
                    if x < w - 1 and arr[dn + 1] + diag < v:
                        v = arr[dn + 1] + diag
                arr[idx] = v

    chamfer_pass(dist_to_ocean)
    chamfer_pass(dist_to_land)

    # Signed distance in pixels: positive inside land, negative in ocean
    sdf = [dist_to_ocean[i] if not ocean[i] else -dist_to_land[i] for i in range(w * h)]

    # Smooth SDF slightly with 2 passes of 3x3 box filter for organic 3D contours
    for _ in range(2):
        new_sdf = list(sdf)
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                s = (
                    sdf[(y - 1) * w + (x - 1)] + sdf[(y - 1) * w + x] * 2 + sdf[(y - 1) * w + (x + 1)]
                    + sdf[y * w + (x - 1)] * 2 + sdf[y * w + x] * 4 + sdf[y * w + (x + 1)] * 2
                    + sdf[(y + 1) * w + (x - 1)] + sdf[(y + 1) * w + x] * 2 + sdf[(y + 1) * w + (x + 1)]
                ) / 16.0
                new_sdf[y * w + x] = s
        sdf = new_sdf

    return ocean, lake, sdf


class SceneBuilder:
    def __init__(self):
        self.materials = []
        self.mat_map = {}
        self.buckets = {}  # mat_idx -> {"pos": [], "norm": [], "idx": []}

    def add_material(self, name, rgba, roughness=0.65, metallic=0.0, emissive=None):
        if name in self.mat_map:
            return self.mat_map[name]
        idx = len(self.materials)
        m = {
            "name": name,
            "doubleSided": True,
            "pbrMetallicRoughness": {
                "baseColorFactor": list(rgba),
                "roughnessFactor": roughness,
                "metallicFactor": metallic,
            },
        }
        if emissive:
            m["emissiveFactor"] = list(emissive)
        self.materials.append(m)
        self.mat_map[name] = idx
        self.buckets[idx] = {"pos": [], "norm": [], "idx": []}
        return idx

    def add_mesh_data(self, mat_idx, positions, normals, triangles):
        b = self.buckets[mat_idx]
        base = len(b["pos"]) // 3
        b["pos"].extend(positions)
        b["norm"].extend(normals)
        for i0, i1, i2 in triangles:
            b["idx"].extend((base + i0, base + i1, base + i2))

    def add_quad(self, mat_idx, p0, p1, p2, p3):
        ux, uy, uz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        vx, vy, vz = p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]
        nx = uy * vz - uz * vy
        ny = uz * vx - ux * vz
        nz = ux * vy - uy * vx
        length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        nx, ny, nz = nx / length, ny / length, nz / length
        pos = [*p0, *p1, *p2, *p3]
        norm = [nx, ny, nz] * 4
        self.add_mesh_data(mat_idx, pos, norm, [(0, 1, 2), (0, 2, 3)])

    def add_box(self, mat_idx, cx, cy, cz, sx, sy, sz, rot_y=0.0):
        hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
        cs, sn = math.cos(rot_y), math.sin(rot_y)

        def tf(lx, ly, lz):
            rx = lx * cs + lz * sn
            rz = -lx * sn + lz * cs
            return (cx + rx, cy + ly, cz + rz)

        corners = [
            tf(-hx, -hy, -hz),
            tf(hx, -hy, -hz),
            tf(hx, hy, -hz),
            tf(-hx, hy, -hz),
            tf(-hx, -hy, hz),
            tf(hx, -hy, hz),
            tf(hx, hy, hz),
            tf(-hx, hy, hz),
        ]
        faces = [
            (4, 5, 6, 7),  # +Z
            (1, 0, 3, 2),  # -Z
            (5, 1, 2, 6),  # +X
            (0, 4, 7, 3),  # -X
            (3, 7, 6, 2),  # +Y (top)
            (0, 1, 5, 4),  # -Y (bottom)
        ]
        for a, b, c, d in faces:
            self.add_quad(mat_idx, corners[a], corners[b], corners[c], corners[d])

    def add_cylinder(self, mat_idx, cx, cy, cz, r_bottom, r_top, height, segs=16):
        hy = height * 0.5
        y0, y1 = cy - hy, cy + hy
        ring0 = []
        ring1 = []
        for s in range(segs):
            ang = (s / segs) * math.pi * 2.0
            cs, sn = math.cos(ang), math.sin(ang)
            ring0.append((cx + cs * r_bottom, y0, cz + sn * r_bottom))
            ring1.append((cx + cs * r_top, y1, cz + sn * r_top))
        for s in range(segs):
            ns = (s + 1) % segs
            self.add_quad(mat_idx, ring0[s], ring0[ns], ring1[ns], ring1[s])
        if r_top > 0.01:
            b = self.buckets[mat_idx]
            center_idx = len(b["pos"]) // 3
            b["pos"].extend((cx, y1, cz))
            b["norm"].extend((0.0, 1.0, 0.0))
            for x, y, z in ring1:
                b["pos"].extend((x, y, z))
                b["norm"].extend((0.0, 1.0, 0.0))
            for s in range(segs):
                ns = (s + 1) % segs
                b["idx"].extend((center_idx, center_idx + 1 + ns, center_idx + 1 + s))

    def add_hipped_building(self, cx, y_base, cz, w, d, h_wall, h_roof, mat_wall, mat_roof, rot_y=0.0):
        self.add_box(mat_wall, cx, y_base + h_wall * 0.5, cz, w, h_wall, d, rot_y=rot_y)
        rw = w * 0.5 + 0.22
        rd = d * 0.5 + 0.22
        ridge = max(0.18, rw - rd * 0.65)
        cs, sn = math.cos(rot_y), math.sin(rot_y)

        def tf(lx, ly, lz):
            rx = lx * cs + lz * sn
            rz = -lx * sn + lz * cs
            return (cx + rx, y_base + h_wall + ly, cz + rz)

        p0 = tf(-rw, 0.0, -rd)
        p1 = tf(rw, 0.0, -rd)
        p2 = tf(rw, 0.0, rd)
        p3 = tf(-rw, 0.0, rd)
        p4 = tf(-ridge, h_roof, 0.0)
        p5 = tf(ridge, h_roof, 0.0)
        self.add_quad(mat_roof, p0, p1, p5, p4)
        self.add_quad(mat_roof, p2, p3, p4, p5)
        self.add_quad(mat_roof, p1, p2, p5, p5)
        self.add_quad(mat_roof, p3, p0, p4, p4)

    def add_ribbon(self, mat_idx, pts_xz, half_w, y_func, y_offset=0.14):
        dense = []
        for i in range(len(pts_xz) - 1):
            x1, z1 = pts_xz[i]
            x2, z2 = pts_xz[i + 1]
            steps = max(6, int(math.hypot(x2 - x1, z2 - z1) / 0.7))
            for s in range(steps):
                if i > 0 and s == 0:
                    continue
                t = s / steps
                dense.append((x1 + t * (x2 - x1), z1 + t * (z2 - z1)))
        dense.append(pts_xz[-1])

        left_top, right_top = [], []
        for k, (px, pz) in enumerate(dense):
            if k == 0:
                tx, tz = dense[1][0] - px, dense[1][1] - pz
            elif k == len(dense) - 1:
                tx, tz = px - dense[k - 1][0], pz - dense[k - 1][1]
            else:
                tx, tz = dense[k + 1][0] - dense[k - 1][0], dense[k + 1][1] - dense[k - 1][1]
            tl = max(1e-6, math.hypot(tx, tz))
            nx, nz = -tz / tl, tx / tl
            py = y_func(px, pz) + y_offset
            left_top.append((px + nx * half_w, py, pz + nz * half_w))
            right_top.append((px - nx * half_w, py, pz - nz * half_w))

        for k in range(len(dense) - 1):
            self.add_quad(mat_idx, left_top[k], right_top[k], right_top[k + 1], left_top[k + 1])

    def export_glb(self, out_paths):
        buffer_views = []
        accessors = []
        primitives = []
        bin_parts = []
        offset = 0

        def append_bytes(raw_bytes, target=None):
            nonlocal offset
            pad = (4 - (len(raw_bytes) % 4)) % 4
            padded = raw_bytes + (b"\x00" * pad)
            bv_idx = len(buffer_views)
            bv = {"buffer": 0, "byteOffset": offset, "byteLength": len(raw_bytes)}
            if target:
                bv["target"] = target
            buffer_views.append(bv)
            bin_parts.append(padded)
            offset += len(padded)
            return bv_idx

        for mat_idx, b in self.buckets.items():
            if not b["idx"]:
                continue
            pos = b["pos"]
            norm = b["norm"]
            idx = b["idx"]
            v_count = len(pos) // 3

            xs = pos[0::3]
            ys = pos[1::3]
            zs = pos[2::3]
            pos_min = [min(xs), min(ys), min(zs)]
            pos_max = [max(xs), max(ys), max(zs)]

            pos_bytes = struct.pack(f"<{len(pos)}f", *pos)
            norm_bytes = struct.pack(f"<{len(norm)}f", *norm)
            idx_bytes = struct.pack(f"<{len(idx)}I", *idx)

            pos_bv = append_bytes(pos_bytes, 34962)
            norm_bv = append_bytes(norm_bytes, 34962)
            idx_bv = append_bytes(idx_bytes, 34963)

            pos_acc = len(accessors)
            accessors.append(
                {
                    "bufferView": pos_bv,
                    "componentType": 5126,
                    "count": v_count,
                    "type": "VEC3",
                    "min": pos_min,
                    "max": pos_max,
                }
            )
            norm_acc = len(accessors)
            accessors.append(
                {
                    "bufferView": norm_bv,
                    "componentType": 5126,
                    "count": v_count,
                    "type": "VEC3",
                }
            )
            idx_acc = len(accessors)
            accessors.append(
                {
                    "bufferView": idx_bv,
                    "componentType": 5125,
                    "count": len(idx),
                    "type": "SCALAR",
                }
            )

            primitives.append(
                {
                    "attributes": {"POSITION": pos_acc, "NORMAL": norm_acc},
                    "indices": idx_acc,
                    "material": mat_idx,
                }
            )

        bin_chunk = b"".join(bin_parts)
        gltf = {
            "asset": {"version": "2.0", "generator": "EDUVERSE 3D Map-Calibrated Island Builder"},
            "scene": 0,
            "scenes": [{"name": "VinhThuc_Island_Scene", "nodes": [0]}],
            "nodes": [{"name": "VinhThuc_Island_3D", "mesh": 0}],
            "meshes": [{"name": "VinhThuc_Island_Mesh", "primitives": primitives}],
            "materials": self.materials,
            "bufferViews": buffer_views,
            "accessors": accessors,
            "buffers": [{"byteLength": len(bin_chunk)}],
        }

        json_raw = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
        json_pad = (4 - (len(json_raw) % 4)) % 4
        json_chunk = json_raw + (b" " * json_pad)

        total_len = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
        glb = b"".join(
            [
                struct.pack("<III", 0x46546C67, 2, total_len),
                struct.pack("<II", len(json_chunk), 0x4E4F534A),
                json_chunk,
                struct.pack("<II", len(bin_chunk), 0x004E4942),
                bin_chunk,
            ]
        )

        for p in out_paths:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, "wb") as f:
                f.write(glb)
            print(f"✅ Đã xuất GLB Đảo Vĩnh Thực: {p} ({len(glb) / 1024 / 1024:.2f} MB)")


def main():
    w, h, px = read_png_rgba(MAP_PNG)
    WORLD_D = WORLD_W * (h / w)  # 54.84375
    ocean, lake, sdf = compute_masks_and_sdf(w, h, px)

    def px_to_world(x_px, y_px):
        wx = (x_px / w - 0.5) * WORLD_W
        wz = (y_px / h - 0.5) * WORLD_D
        return wx, wz

    def world_to_px(wx, wz):
        x_px = (wx / WORLD_W + 0.5) * w
        y_px = (wz / WORLD_D + 0.5) * h
        return x_px, y_px

    def sample_sdf(wx, wz):
        x_px, y_px = world_to_px(wx, wz)
        if x_px < 0 or x_px >= w - 1 or y_px < 0 or y_px >= h - 1:
            return -50.0
        x0, y0 = int(x_px), int(y_px)
        fx, fy = x_px - x0, y_px - y0
        v00 = sdf[y0 * w + x0]
        v10 = sdf[y0 * w + (x0 + 1)]
        v01 = sdf[(y0 + 1) * w + x0]
        v11 = sdf[(y0 + 1) * w + (x0 + 1)]
        return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy

    def is_lake_at(wx, wz):
        x_px, y_px = world_to_px(wx, wz)
        ix, iy = int(round(x_px)), int(round(y_px))
        if 0 <= ix < w and 0 <= iy < h:
            return lake[iy * w + ix] == 1
        return False

    # Hàm tính cao độ 3D tự nhiên của Đảo Vĩnh Thực từ SDF + các dãy đồi thực tế
    def island_height(wx, wz):
        d = sample_sdf(wx, wz)
        if d <= -1.2:
            return 0.0
        # Tỷ lệ độ sâu vào đất liền (0 tại mép nước -> 1 ở sâu trong đảo)
        t_coast = max(0.0, min(1.0, (d + 0.8) / 16.0))
        base_y = 0.18 + 1.45 * math.pow(t_coast, 0.78)

        # Các dãy đồi tự nhiên dọc đảo (vừa phải, hài hòa, không nhọn hoắt)
        hills = [
            (46.0, -16.5, 14.0, 2.8),  # Dãy đồi Đầu Tán Đông Bắc
            (32.0, -9.5, 15.0, 2.4),   # Đồi trung tâm Vĩnh Thực
            (16.0, -7.0, 12.0, 1.8),   # Đồi phía Tây Vĩnh Thực
            (-7.0, -3.5, 11.0, 1.4),   # Đồi giữa đảo
            (-28.0, -3.0, 11.0, 1.3),  # Đồi Bắc Vĩnh Trung
            (58.5, -21.0, 8.5, 2.2),   # Đồi Mũi Hải Đăng
        ]
        hill_y = 0.0
        for hx, hz, hr, hh in hills:
            dist = math.hypot(wx - hx, wz - hz)
            if dist < hr:
                hill_y += hh * math.pow(math.cos((dist / hr) * math.pi * 0.5), 1.6) * t_coast

        y = base_y + hill_y

        # Làm phẳng nền tại các khu vực đặt công trình điểm nhấn
        plateaus = [
            (-19.27, -1.83, 5.2, 1.55),  # Phân hiệu Vĩnh Trung
            (23.20, -4.22, 5.2, 1.75),   # Phân hiệu Điểm chính (Vĩnh Thực)
            (3.23, -2.11, 4.5, 1.45),    # Phân hiệu 2 (Xã Vĩnh Thực)
            (18.14, -18.56, 4.2, 0.85),  # Bến tàu Vạn Gia
            (17.16, -13.92, 4.2, 1.40),  # Đồn Biên phòng
            (-26.30, 2.81, 4.0, 1.35),   # Đền Lê Bá Đức
            (62.60, -22.82, 5.6, 2.35),  # Mũi Hải đăng Vĩnh Thực
        ]
        for px_f, pz_f, r_f, y_f in plateaus:
            fd = math.hypot(wx - px_f, wz - pz_f)
            if fd < r_f and d > 0.5:
                blend = math.pow(math.cos((fd / r_f) * math.pi * 0.5), 1.4)
                y = y * (1.0 - 0.82 * blend) + y_f * (0.82 * blend)

        if is_lake_at(wx, wz):
            return 0.42
        return y

    sb = SceneBuilder()
    m_ocean_deep = sb.add_material("Mat_Ocean_Deep", (0.04, 0.32, 0.52, 1.0), roughness=0.22)
    m_ocean_shallow = sb.add_material("Mat_Ocean_Shallow", (0.14, 0.62, 0.72, 1.0), roughness=0.25)
    m_ocean_foam = sb.add_material("Mat_Ocean_Foam", (0.93, 0.98, 1.0, 1.0), roughness=0.40)
    m_sand = sb.add_material("Mat_Sand_Beach", (0.95, 0.87, 0.68, 1.0), roughness=0.75)
    m_border_coral = sb.add_material("Mat_Coast_Accent", (0.86, 0.42, 0.36, 1.0), roughness=0.65)
    m_plain = sb.add_material("Mat_Terrain_Plain", (0.28, 0.60, 0.27, 1.0), roughness=0.80)
    m_hill = sb.add_material("Mat_Terrain_Hill", (0.16, 0.44, 0.19, 1.0), roughness=0.84)
    m_lake = sb.add_material("Mat_Lake_Water", (0.12, 0.60, 0.78, 1.0), roughness=0.16)
    m_road = sb.add_material("Mat_Road_Asphalt", (0.26, 0.28, 0.32, 1.0), roughness=0.68)
    m_road_line = sb.add_material("Mat_Road_Line", (0.98, 0.86, 0.28, 1.0), roughness=0.45)
    m_ferry_dash = sb.add_material("Mat_Ferry_Dash", (0.38, 0.68, 0.96, 1.0), roughness=0.35, emissive=(0.15, 0.35, 0.65))
    m_wall_yellow = sb.add_material("Mat_Wall_Yellow", (0.96, 0.85, 0.50, 1.0), roughness=0.60)
    m_wall_cream = sb.add_material("Mat_Wall_Cream", (0.96, 0.93, 0.85, 1.0), roughness=0.58)
    m_wall_white = sb.add_material("Mat_Wall_White", (0.96, 0.97, 0.99, 1.0), roughness=0.48)
    m_wall_brick = sb.add_material("Mat_Wall_Brick", (0.76, 0.28, 0.21, 1.0), roughness=0.70)
    m_roof_red = sb.add_material("Mat_Roof_Red", (0.84, 0.19, 0.15, 1.0), roughness=0.52)
    m_roof_temple = sb.add_material("Mat_Roof_Temple", (0.64, 0.14, 0.12, 1.0), roughness=0.56)
    m_roof_gym = sb.add_material("Mat_Roof_Gym", (0.22, 0.26, 0.32, 1.0), roughness=0.45, metallic=0.25)
    m_roof_blue = sb.add_material("Mat_Roof_Blue", (0.12, 0.46, 0.78, 1.0), roughness=0.46)
    m_roof_green = sb.add_material("Mat_Roof_Green", (0.12, 0.52, 0.30, 1.0), roughness=0.50)
    m_yard = sb.add_material("Mat_Courtyard_Grey", (0.76, 0.78, 0.80, 1.0), roughness=0.70)
    m_gold = sb.add_material("Mat_Gold_Accent", (0.98, 0.78, 0.18, 1.0), roughness=0.32, metallic=0.4, emissive=(0.35, 0.25, 0.02))
    m_flag = sb.add_material("Mat_Red_Flag", (0.92, 0.12, 0.12, 1.0), roughness=0.40, emissive=(0.3, 0.02, 0.02))
    m_dark = sb.add_material("Mat_Stone_Dark", (0.36, 0.38, 0.42, 1.0), roughness=0.72)
    m_beacon = sb.add_material("Mat_Beacon_Glow", (1.0, 0.95, 0.45, 1.0), roughness=0.15, emissive=(0.95, 0.85, 0.25))
    m_tree_pine = sb.add_material("Mat_Tree_Pine", (0.13, 0.44, 0.18, 1.0), roughness=0.78)
    m_tree_trunk = sb.add_material("Mat_Tree_Trunk", (0.38, 0.25, 0.15, 1.0), roughness=0.85)
    m_boat_wood = sb.add_material("Mat_Boat_Wood", (0.50, 0.30, 0.15, 1.0), roughness=0.70)

    # 1. Mặt biển sâu nền rộng
    sb.add_box(m_ocean_deep, 0.0, -0.22, 0.0, 230.0, 0.36, 130.0)

    # 2. Lưới địa hình 3D độ phân giải cao (320 x 124) bám sát 100% đường biên bản đồ
    NX, NZ = 320, 124
    x_min, x_max = -72.0, 72.0
    z_min, z_max = -WORLD_D * 0.5, WORLD_D * 0.5
    dx = (x_max - x_min) / NX
    dz = (z_max - z_min) / NZ

    def build_grid_layer(mat_idx, sdf_min, sdf_max, y_eval):
        grid_pos = []
        grid_sdf = []
        for j in range(NZ + 1):
            wz = z_min + j * dz
            for i in range(NX + 1):
                wx = x_min + i * dx
                d = sample_sdf(wx, wz)
                grid_sdf.append(d)
                grid_pos.append([wx, y_eval(wx, wz, d), wz])

        # Dịch nhẹ các đỉnh gần đường biên về đúng ngưỡng sdf_min để đường bờ biển mượt không răng cưa
        for j in range(1, NZ):
            for i in range(1, NX):
                idx = j * (NX + 1) + i
                d0 = grid_sdf[idx]
                if abs(d0 - sdf_min) < 1.35:
                    gx = (grid_sdf[idx + 1] - grid_sdf[idx - 1]) / (2.0 * dx)
                    gz = (grid_sdf[idx + (NX + 1)] - grid_sdf[idx - (NX + 1)]) / (2.0 * dz)
                    g2 = gx * gx + gz * gz
                    if g2 > 1e-5:
                        step = max(-0.75 * dx, min(0.75 * dx, (sdf_min - d0) / g2))
                        nx_w = grid_pos[idx][0] + step * gx
                        nz_w = grid_pos[idx][2] + step * gz
                        nd = sample_sdf(nx_w, nz_w)
                        grid_pos[idx][0] = nx_w
                        grid_pos[idx][2] = nz_w
                        grid_pos[idx][1] = y_eval(nx_w, nz_w, nd)

        # Tính pháp tuyến mượt cho từng đỉnh
        normals = [[0.0, 1.0, 0.0] for _ in range((NX + 1) * (NZ + 1))]
        for j in range(1, NZ):
            for i in range(1, NX):
                idx = j * (NX + 1) + i
                dy_dx = (grid_pos[idx + 1][1] - grid_pos[idx - 1][1]) / (2.0 * dx)
                dy_dz = (grid_pos[idx + (NX + 1)][1] - grid_pos[idx - (NX + 1)][1]) / (2.0 * dz)
                nx_n, ny_n, nz_n = -dy_dx, 1.0, -dy_dz
                l_n = math.sqrt(nx_n * nx_n + ny_n * ny_n + nz_n * nz_n) or 1.0
                normals[idx] = [nx_n / l_n, ny_n / l_n, nz_n / l_n]

        vert_map = {}
        flat_pos = []
        flat_norm = []
        tris = []

        def get_v(grid_idx):
            if grid_idx not in vert_map:
                vert_map[grid_idx] = len(flat_pos) // 3
                flat_pos.extend(grid_pos[grid_idx])
                flat_norm.extend(normals[grid_idx])
            return vert_map[grid_idx]

        for j in range(NZ):
            for i in range(NX):
                v0 = j * (NX + 1) + i
                v1 = v0 + 1
                v2 = v0 + (NX + 1) + 1
                v3 = v0 + (NX + 1)
                d_max = max(grid_sdf[v0], grid_sdf[v1], grid_sdf[v2], grid_sdf[v3])
                d_min = min(grid_sdf[v0], grid_sdf[v1], grid_sdf[v2], grid_sdf[v3])
                if d_max >= sdf_min and d_min <= sdf_max:
                    i0, i1, i2, i3 = get_v(v0), get_v(v1), get_v(v2), get_v(v3)
                    tris.append((i0, i3, i2))
                    tris.append((i0, i2, i1))

        if tris:
            sb.add_mesh_data(mat_idx, flat_pos, flat_norm, tris)

    # A. Thềm nước nông xanh ngọc quanh đảo & trong vịnh Bến Hèn
    build_grid_layer(
        m_ocean_shallow,
        -16.0,
        2.0,
        lambda x, z, d: 0.02 if d >= -16.0 else -0.12,
    )
    # B. Viền sóng trắng sát bờ biển
    build_grid_layer(
        m_ocean_foam,
        -2.8,
        1.5,
        lambda x, z, d: 0.06 if d >= -2.8 else -0.08,
    )
    # C. Bãi cát vàng ven đảo & bán đảo Tây Nam
    build_grid_layer(
        m_sand,
        -0.6,
        999.0,
        lambda x, z, d: max(0.12, island_height(x, z) * 0.72) if d >= -0.6 else -0.05,
    )
    # D. Nền đất đảo xanh tươi chính
    build_grid_layer(
        m_plain,
        1.6,
        999.0,
        lambda x, z, d: island_height(x, z) if d >= 1.6 else 0.04,
    )
    # E. Lớp đồi rừng xanh đậm ở vùng cao
    build_grid_layer(
        m_hill,
        6.5,
        999.0,
        lambda x, z, d: (island_height(x, z) + 0.05) if (d >= 6.5 and island_height(x, z) > 2.05) else (island_height(x, z) - 0.12),
    )

    # 3. Các hồ nước ngọt nội địa đúng vị trí trên bản đồ (Hồ nhánh Vĩnh Trung & các hồ Vĩnh Thực)
    for y_px in range(0, h, 2):
        for x_px in range(0, w, 2):
            if lake[y_px * w + x_px]:
                lx, lz = px_to_world(x_px, y_px)
                ly = island_height(lx, lz)
                sb.add_box(m_lake, lx, ly + 0.06, lz, 0.42, 0.08, 0.42)

    # 4. Hệ thống đường giao thông chuẩn theo ảnh bản đồ
    # 4.1. Trục đường chính xuyên đảo từ Mũi Tây Bắc -> Vĩnh Trung -> Xã Vĩnh Thực -> Vĩnh Thực -> Mũi Hải Đăng
    main_road_px = [
        (35, 200),
        (78, 172),
        (132, 168),
        (195, 162),
        (258, 146),
        (312, 152),
        (345, 175),
        (375, 182),   # Vĩnh Trung
        (430, 179),
        (485, 184),
        (535, 180),   # Xã Vĩnh Thực
        (595, 180),
        (640, 178),   # Ngã ba Vĩnh Thực
        (677, 165),   # Ghim Vĩnh Thực
        (718, 142),
        (750, 122),
        (795, 92),
        (845, 82),
        (905, 62),
        (957, 33),    # Hải đăng Vĩnh Thực
    ]
    main_road_xz = [px_to_world(px_i, py_i) for px_i, py_i in main_road_px]
    sb.add_ribbon(m_road, main_road_xz, 0.56, island_height, 0.14)
    sb.add_ribbon(m_road_line, main_road_xz, 0.10, island_height, 0.17)

    # 4.2. Nhánh đường từ Ngã ba Vĩnh Thực lên Bến tàu Vạn Gia (Bờ Bắc)
    north_road_px = [
        (640, 178),
        (639, 145),
        (634, 96),    # Đồn Biên phòng
        (641, 63),    # Bến tàu Vạn Gia
    ]
    north_road_xz = [px_to_world(px_i, py_i) for px_i, py_i in north_road_px]
    sb.add_ribbon(m_road, north_road_xz, 0.48, island_height, 0.14)

    # 4.3. Nhánh đường vòng phía Nam khu dân cư Vĩnh Thực (đúng trên bản đồ)
    south_loop_px = [
        (640, 178),
        (644, 212),
        (652, 232),
        (678, 240),
        (686, 205),
        (677, 165),
    ]
    sb.add_ribbon(m_road, [px_to_world(a, b) for a, b in south_loop_px], 0.42, island_height, 0.14)

    # 4.4. Nhánh đường phụ phía Đông Bắc
    ne_loop_px = [
        (750, 122),
        (752, 152),
        (768, 168),
    ]
    sb.add_ribbon(m_road, [px_to_world(a, b) for a, b in ne_loop_px], 0.38, island_height, 0.14)

    # 4.5. Tuyến phà biển nét đứt từ Bến tàu Vạn Gia (641, 63) hướng lên Đông Bắc (685, 4) đúng như bản đồ
    ferry_start = px_to_world(641, 58)
    ferry_end = px_to_world(688, 2)
    for step in range(8):
        t = (step + 0.5) / 8.0
        fx = ferry_start[0] + t * (ferry_end[0] - ferry_start[0])
        fz = ferry_start[1] + t * (ferry_end[1] - ferry_start[1])
        sb.add_box(m_ferry_dash, fx, 0.08, fz, 0.42, 0.08, 1.05, rot_y=-0.52)

    # Hàm dựng cột cờ Tổ quốc
    def add_flagpole(cx, y_base, cz, h_pole=2.0):
        sb.add_cylinder(m_wall_white, cx, y_base + h_pole * 0.5, cz, 0.07, 0.05, h_pole, 8)
        sb.add_box(m_flag, cx + 0.42, y_base + h_pole - 0.30, cz, 0.85, 0.52, 0.06)

    # ==========================================================================
    # 5. DỰNG 10 CỤM CÔNG TRÌNH ĐỊA DANH ĐÚNG VỊ TRÍ BẢN ĐỒ MỚI
    # ==========================================================================

    # 5.1. PHÂN HIỆU VĨNH TRUNG (Mô hình thu nhỏ 1:1 tại [-19.27, -1.83])
    vx, vz = -19.27, -1.83
    vy = island_height(vx, vz)
    sb.add_box(m_gold, vx, vy + 0.08, vz, 8.6, 0.20, 7.6)
    sb.add_box(m_yard, vx, vy + 0.20, vz, 7.8, 0.14, 6.8)
    sb.add_hipped_building(vx + 2.0, vy + 0.27, vz + 0.2, 0.9, 4.2, 1.25, 0.50, m_wall_yellow, m_roof_red)
    sb.add_hipped_building(vx + 0.2, vy + 0.27, vz - 2.1, 3.0, 0.85, 0.90, 0.42, m_wall_yellow, m_roof_red)
    sb.add_box(m_roof_red, vx + 0.2, vy + 0.50, vz - 1.45, 1.0, 0.45, 0.60)
    add_flagpole(vx + 0.2, vy + 0.27, vz - 0.95, 1.85)
    sb.add_hipped_building(vx - 2.1, vy + 0.27, vz - 1.0, 0.80, 2.4, 0.90, 0.40, m_wall_cream, m_roof_red)
    sb.add_hipped_building(vx - 2.3, vy + 0.27, vz + 1.0, 2.1, 1.25, 0.98, 0.42, m_wall_yellow, m_roof_gym)
    sb.add_hipped_building(vx + 3.1, vy + 0.27, vz - 2.0, 1.45, 0.82, 1.15, 0.45, m_wall_yellow, m_roof_red)

    # 5.2. PHÂN HIỆU ĐIỂM CHÍNH - THÔN ĐẦU ĐÔNG / VĨNH THỰC (tại ghim Vĩnh Thực [23.20, -4.22])
    dx_p, dz_p = 23.20, -4.22
    dy_p = island_height(dx_p, dz_p)
    sb.add_box(m_gold, dx_p, dy_p + 0.08, dz_p, 8.4, 0.20, 7.2)
    sb.add_box(m_yard, dx_p, dy_p + 0.20, dz_p, 7.6, 0.14, 6.4)
    sb.add_hipped_building(dx_p, dy_p + 0.27, dz_p - 1.9, 4.4, 1.0, 1.30, 0.52, m_wall_yellow, m_roof_red)
    sb.add_hipped_building(dx_p + 2.5, dy_p + 0.27, dz_p + 0.3, 0.9, 3.2, 1.00, 0.42, m_wall_yellow, m_roof_red)
    sb.add_hipped_building(dx_p - 2.5, dy_p + 0.27, dz_p + 0.3, 0.9, 3.2, 1.00, 0.42, m_wall_cream, m_roof_red)
    add_flagpole(dx_p, dy_p + 0.27, dz_p - 0.3, 1.95)

    # 5.3. PHÂN HIỆU 2 - TRUNG TÂM XÃ VĨNH THỰC (tại [3.23, -2.11])
    p2x, p2z = 3.23, -2.11
    p2y = island_height(p2x, p2z)
    sb.add_box(m_gold, p2x, p2y + 0.08, p2z, 6.4, 0.18, 5.4)
    sb.add_box(m_yard, p2x, p2y + 0.18, p2z, 5.8, 0.14, 4.8)
    sb.add_hipped_building(p2x, p2y + 0.25, p2z - 1.2, 3.5, 0.90, 1.05, 0.45, m_wall_yellow, m_roof_red)
    sb.add_hipped_building(p2x - 1.9, p2y + 0.25, p2z + 0.3, 0.80, 2.3, 0.85, 0.38, m_wall_cream, m_roof_red)
    add_flagpole(p2x + 0.3, p2y + 0.25, p2z, 1.75)

    # 5.4. BẾN TÀU VẠN GIA - BỜ BẮC (tại [18.14, -18.56])
    px_v, pz_v = 18.14, -18.56
    py_v = max(0.55, island_height(px_v, pz_v))
    sb.add_box(m_yard, px_v, py_v * 0.5 + 0.12, pz_v, 5.6, py_v, 4.4)
    sb.add_hipped_building(px_v - 0.5, py_v + 0.18, pz_v + 0.6, 3.0, 1.25, 0.95, 0.42, m_wall_white, m_roof_blue)
    sb.add_box(m_yard, px_v + 0.8, 0.42, pz_v - 3.6, 1.35, 0.38, 6.2)
    sb.add_box(m_wall_white, px_v + 2.3, 0.30, pz_v - 4.2, 1.05, 0.42, 2.8)
    sb.add_box(m_roof_blue, px_v + 2.3, 0.62, pz_v - 4.0, 0.82, 0.35, 1.4)

    # 5.5. ĐỒN BIÊN PHÒNG CỬA KHẨU CẢNG VẠN GIA (tại [17.16, -13.92])
    bx_d, bz_d = 17.16, -13.92
    by_d = island_height(bx_d, bz_d)
    sb.add_box(m_yard, bx_d, by_d + 0.12, bz_d, 6.8, 0.22, 5.6)
    sb.add_hipped_building(bx_d, by_d + 0.22, bz_d - 1.3, 4.0, 1.05, 1.25, 0.48, m_wall_yellow, m_roof_red)
    sb.add_box(m_roof_green, bx_d, by_d + 0.88, bz_d - 0.75, 4.05, 0.20, 0.12)
    sb.add_hipped_building(bx_d - 2.1, by_d + 0.22, bz_d + 0.4, 0.85, 2.4, 0.90, 0.38, m_wall_cream, m_roof_red)
    sb.add_box(m_wall_white, bx_d + 2.1, by_d + 1.15, bz_d + 1.0, 0.70, 1.9, 0.70)
    sb.add_box(m_roof_green, bx_d + 2.1, by_d + 2.25, bz_d + 1.0, 0.98, 0.50, 0.98)
    add_flagpole(bx_d, by_d + 0.22, bz_d + 0.3, 2.1)

    # 5.6. ĐỀN THỜ TƯỚNG QUÂN LÊ BÁ ĐỨC - MIẾU BẾN HÈN (tại [-26.30, 2.81])
    tx_t, tz_t = -26.30, 2.81
    ty_t = island_height(tx_t, tz_t)
    sb.add_box(m_dark, tx_t, ty_t + 0.14, tz_t, 6.2, 0.26, 5.4)
    sb.add_box(m_wall_brick, tx_t, ty_t + 0.28, tz_t, 5.6, 0.10, 4.8)
    sb.add_hipped_building(tx_t, ty_t + 0.32, tz_t - 0.9, 3.4, 1.5, 0.95, 0.48, m_wall_yellow, m_roof_temple)
    sb.add_hipped_building(tx_t, ty_t + 1.10, tz_t - 0.9, 2.4, 1.1, 0.42, 0.45, m_wall_brick, m_roof_temple)
    sb.add_hipped_building(tx_t - 2.0, ty_t + 0.32, tz_t + 0.2, 0.78, 1.9, 0.75, 0.35, m_wall_yellow, m_roof_temple)
    sb.add_hipped_building(tx_t + 2.0, ty_t + 0.32, tz_t + 0.2, 0.78, 1.9, 0.75, 0.35, m_wall_yellow, m_roof_temple)

    # 5.7. HẢI ĐĂNG VĨNH THỰC 1962 (tại [62.60, -22.82] - Mũi cực Đông Bắc)
    lx_l, lz_l = 62.60, -22.82
    ly_l = max(1.6, island_height(lx_l, lz_l))
    # Chỉ dựng nền đồi/bệ; công trình hải đăng chi tiết được nạp riêng từ
    # /models/hai_dang_vinh_thuc.glb (Meshy AI Image-to-3D) trong LighthouseModel.jsx
    sb.add_cylinder(m_dark, lx_l, ly_l + 0.10, lz_l, 4.7, 4.9, 0.30, 32)
    print(f"   🗼 Bệ Hải đăng tại X={lx_l}, Z={lz_l}, mặt bệ Y={ly_l + 0.25:.3f}")

    # 5.8. BÃI BIỂN ĐẦU ĐÔNG (tại [28.55, 0.42])
    sb.add_hipped_building(27.5, island_height(27.5, -0.5) + 0.1, -0.5, 2.1, 1.1, 0.75, 0.35, m_wall_cream, m_roof_red, rot_y=0.45)
    sb.add_hipped_building(30.5, island_height(30.5, -2.5) + 0.1, -2.5, 2.1, 1.1, 0.75, 0.35, m_wall_yellow, m_roof_red, rot_y=0.45)
    for k in range(3):
        hx_b = 26.5 + k * 2.4
        hz_b = 1.2 - k * 1.4
        hy_b = max(0.25, island_height(hx_b, hz_b))
        sb.add_cylinder(m_tree_trunk, hx_b, hy_b + 0.4, hz_b, 0.07, 0.07, 0.8, 8)
        sb.add_cylinder(m_sand, hx_b, hy_b + 0.9, hz_b, 0.75, 0.05, 0.45, 10)

    # 5.9. BÃI BIỂN BẾN HÈN & BÁN ĐẢO TÂY NAM (tại [-28.41, 7.73])
    for k in range(4):
        bx_b = -32.0 + k * 3.8
        bz_b = 9.5 - k * 0.6
        sb.add_box(m_boat_wood, bx_b, 0.16, bz_b, 1.45, 0.25, 0.45, rot_y=-0.25 + k * 0.12)

    # 5.10. BẾN CÁ MŨI TÂY (tại [-67.08, 0.70])
    sb.add_box(m_yard, -67.1, 0.38, 0.7, 3.2, 0.32, 1.1, rot_y=-0.35)
    sb.add_box(m_boat_wood, -68.4, 0.18, -0.4, 1.4, 0.28, 0.48, rot_y=0.25)

    # 6. Rừng cây xanh và nhà dân dọc đảo
    rng = random.Random(20261113)
    landmark_centers = [
        (-19.27, -1.83, 5.2),
        (23.20, -4.22, 5.2),
        (3.23, -2.11, 4.4),
        (18.14, -18.56, 4.5),
        (17.16, -13.92, 4.5),
        (-26.30, 2.81, 4.2),
        (62.60, -22.82, 5.6),
    ]

    # Nhà dân dọc các thôn
    village_zones = [
        (-19.0, -1.8, 8.0, 10),
        (3.2, -2.0, 7.5, 10),
        (21.0, -3.0, 9.0, 14),
        (-42.0, -2.5, 7.0, 6),
    ]
    h_idx = 0
    for vx_z, vz_z, vr_z, count in village_zones:
        for _ in range(count * 2):
            hx = vx_z + rng.uniform(-vr_z, vr_z)
            hz = vz_z + rng.uniform(-vr_z * 0.65, vr_z * 0.65)
            if sample_sdf(hx, hz) < 4.5 or is_lake_at(hx, hz):
                continue
            if any(math.hypot(hx - lx, hz - lz) < lr for lx, lz, lr in landmark_centers):
                continue
            hy = island_height(hx, hz)
            if 0.6 <= hy <= 2.6:
                h_idx += 1
                w_b = rng.uniform(0.8, 1.25)
                d_b = rng.uniform(0.65, 0.95)
                h_b = rng.uniform(0.55, 0.80)
                ang = rng.uniform(-0.5, 0.5)
                mat_w = m_wall_cream if (h_idx % 2 == 0) else m_wall_yellow
                sb.add_hipped_building(hx, hy, hz, w_b, d_b, h_b, 0.32, mat_w, m_roof_red, rot_y=ang)
                if h_idx >= 32:
                    break

    # Cây xanh phân bố tự nhiên trên toàn đảo (kể cả nhánh Tây Bắc & bán đảo Tây Nam)
    trees_placed = 0
    for _ in range(520):
        tx = rng.uniform(-68.0, 64.0)
        tz = rng.uniform(-24.0, 22.0)
        d = sample_sdf(tx, tz)
        if d < 2.5 or is_lake_at(tx, tz):
            continue
        if any(math.hypot(tx - lx, tz - lz) < lr for lx, lz, lr in landmark_centers):
            continue
        ty = island_height(tx, tz)
        if ty >= 0.45:
            scale = rng.uniform(0.75, 1.28)
            sb.add_cylinder(m_tree_trunk, tx, ty + 0.32 * scale, tz, 0.09 * scale, 0.07 * scale, 0.65 * scale, 6)
            sb.add_cylinder(m_tree_pine, tx, ty + 0.98 * scale, tz, 0.60 * scale, 0.04 * scale, 1.25 * scale, 7)
            trees_placed += 1
            if trees_placed >= 240:
                break

    sb.export_glb(OUT_PATHS)


if __name__ == "__main__":
    main()
