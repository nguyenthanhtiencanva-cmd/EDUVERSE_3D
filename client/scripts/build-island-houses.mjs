#!/usr/bin/env node
/**
 * Đặt nhà minh họa trên đảo Vĩnh Thực theo hiện trạng: nhà xếp hai bên đường chính và đường phụ đang có,
 * chỉ trong vùng dân cư (vùng đất ở trên bản đồ quy hoạch hoặc khu dân cư OpenStreetMap), dày nhất quanh
 * trung tâm xã, Cảng Vạn Gia và Phân hiệu Vĩnh Trung; thêm xóm dọc đường thầy chỉ ra (lib/village-lanes.mjs). Đây là nhà minh họa, không phải vị trí từng căn thật.
 *   npm run houses:build      # ghi client/src/education/island-houses.json
 * Chạy sau roadmesh:build và trước trees:build (cây tránh chỗ có nhà).
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { METERS_PER_UNIT } from '../src/world/geo.js';
import { grid, groundAt, toLonLat, toMeters } from './lib/island-ground.mjs';
import { VILLAGE_LANES } from './lib/village-lanes.mjs';

const read = (relative) => JSON.parse(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'));
const roads = read('../src/education/island-roads.json');
const places = read('../src/education/island-places.json');
const zones = read('./data/settlement-zones.json');

const ROAD_HALF = { main: 10, minor: 8 }; // Nửa bề rộng mặt đường hiển thị (m), khớp roadmesh:build
const SETBACK = [10, 32]; // Khoảng lùi từ mép đường tới tâm nhà (m)
const STEP = [24, 36]; // Khoảng cách giữa hai nhà liền kề dọc đường (m)
const MIN_GAP = 26; // Hai nhà không gần nhau hơn (m)
const ZONE_REACH = 130; // Chấp nhận nhà cách vùng dân cư tới 130 m (bù sai số nắn bản đồ)
const PLACE_CLEAR = 70; // Không đặt nhà quá gần công trình địa danh
const MAX_HOUSES = 700;
const CENTERS = [
  { id: 'island-truong-vinh-thuc', radius: 900 },
  { id: 'island-cang-van-gia', radius: 600 },
  { id: 'island-campus-vinh-trung', radius: 800 },
];
// Kiểu nhà. "nha_vuon": nhà cấp 4 mái ngói có chái bếp vuông góc phía sau, kiểu nhà vườn thường gặp ở các xóm
// (thầy gửi ảnh đường ra Bến Hèn ngày 19/11/2026). "quan" (quán, nhà dịch vụ) chỉ đặt gần cảng và bãi biển.
const TYPES = ['cap4', 'nha_vuon', 'mai_ton', 'nha_ong', 'mai_thai', 'quan'];
// Tỉ lệ các kiểu (trừ quán): ở trung tâm xã có nhà ống, nhà mái Thái; ở xóm chủ yếu nhà mái ngói một tầng.
const WEIGHTS_CENTER = [0.26, 0.14, 0.2, 0.25, 0.15];
const WEIGHTS_VILLAGE = [0.4, 0.38, 0.14, 0, 0.08];
const CENTER_CORE = 0.55; // density() lớn hơn mức này thì coi là trung tâm (trong khoảng 350–550 m quanh trường, phân hiệu, cảng)
const FACING_JITTER = 0.22; // Nhà lệch hướng ngẫu nhiên tới khoảng 13°, cho xóm bớt thẳng hàng

let seed = 20261119;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const between = ([a, b]) => a + (b - a) * random();

// Ô lưới cao độ 1 giây cung của một điểm.
const cellOf = (lon, lat) => [
  Math.round(((lon - grid.west) / (grid.east - grid.west)) * (grid.width - 1)),
  Math.round(((grid.north - lat) / (grid.north - grid.south)) * (grid.height - 1)),
];
const key = ([c, r]) => c * 100000 + r;
const exclude = new Set(zones.exclude.map(key));
// Mở rộng vùng quy hoạch thêm ZONE_REACH để bù sai số (ô khoảng 29 x 31 m).
const reach = Math.ceil(ZONE_REACH / 30);
const planning = new Set();
for (const [c, r] of zones.planning) {
  for (let a = -reach; a <= reach; a++) {
    for (let b = -reach; b <= reach; b++) if (a * a + b * b <= reach * reach) planning.add(key([c + a, r + b]));
  }
}
function insidePolygon(lon, lat, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const inSettlement = (lon, lat, nearPort) =>
  !exclude.has(key(cellOf(lon, lat))) &&
  (nearPort || planning.has(key(cellOf(lon, lat))) || zones.osmResidential.some((poly) => insidePolygon(lon, lat, poly)));

// Đoạn đường (m) để kiểm tra nhà không đè lên đường nào, kể cả đường mòn.
const segments = [];
for (const [lines, half] of [[roads.roads, ROAD_HALF.main], [roads.minorRoads || [], ROAD_HALF.minor], [roads.tracks || [], 5]]) {
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) segments.push([...toMeters(line[i - 1][0], line[i - 1][1]), ...toMeters(line[i][0], line[i][1]), half]);
  }
}
function clearOfRoads(x, z, size) {
  for (const [ax, az, bx, bz, half] of segments) {
    if (Math.abs(x - ax) > 80 && Math.abs(x - bx) > 80) continue;
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < half + size * 0.6 + 2) return false;
  }
  return true;
}

const placeMeters = places.map((p) => ({ id: p.poiId, kind: p.kind, xz: toMeters(p.longitude, p.latitude) }));
const centers = CENTERS.map((c) => ({ ...c, xz: placeMeters.find((p) => p.id === c.id)?.xz })).filter((c) => c.xz);
const nearShopSpot = (x, z) => placeMeters.some((p) => (p.kind === 'pier' || p.kind === 'beach') && Math.hypot(p.xz[0] - x, p.xz[1] - z) < 600);
// Xóm có thật mà bản đồ quy hoạch không tô hồng: xóm bến dọc đường xuống Cảng Vạn Gia,
// và các xóm dọc đường thầy chỉ ra (scripts/lib/village-lanes.mjs), như đường ra Bến Hèn.
const port = placeMeters.find((p) => p.id === 'island-cang-van-gia')?.xz;
const VILLAGES = [
  ...(port ? [{ xz: port, radius: 550 }] : []),
  ...VILLAGE_LANES.map((lane) => ({ xz: toMeters(...lane.village.center), radius: lane.village.radius })),
];
const nearVillage = (x, z) => VILLAGES.some((v) => Math.hypot(v.xz[0] - x, v.xz[1] - z) < v.radius);
const density = (x, z) => Math.max(0.55, ...centers.map((c) => Math.exp(-Math.hypot(c.xz[0] - x, c.xz[1] - z) / c.radius)));

const houses = [];
const taken = new Map(); // lưới thô 30 m để kiểm tra khoảng cách
const gridKey = (x, z) => `${Math.floor(x / 30)},${Math.floor(z / 30)}`;
function farFromOthers(x, z) {
  const gx = Math.floor(x / 30);
  const gz = Math.floor(z / 30);
  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) {
      for (const [hx, hz] of taken.get(`${gx + a},${gz + b}`) || []) if (Math.hypot(hx - x, hz - z) < MIN_GAP) return false;
    }
  }
  return true;
}

let candidates = 0;
for (const [lines, half] of [[roads.roads, ROAD_HALF.main], [roads.minorRoads || [], ROAD_HALF.minor]]) {
  for (const line of lines) {
    const points = line.map(([lon, lat]) => toMeters(lon, lat));
    let travelled = between(STEP) / 2;
    let along = 0;
    for (let i = 1; i < points.length; i++) {
      const [ax, az] = points[i - 1];
      const [bx, bz] = points[i];
      const length = Math.hypot(bx - ax, bz - az);
      while (travelled <= along + length) {
        const t = (travelled - along) / (length || 1);
        const x = ax + (bx - ax) * t;
        const z = az + (bz - az) * t;
        const [nx, nz] = [-(bz - az) / (length || 1), (bx - ax) / (length || 1)];
        for (const side of [1, -1]) {
          candidates++;
          const typeRoll = random();
          const size = between([18, 26]);
          const offset = half + between(SETBACK);
          const hx = x + nx * side * offset;
          const hz = z + nz * side * offset;
          const [lon, lat] = toLonLat(hx, hz);
          const byVillage = nearVillage(hx, hz);
          if (random() > (byVillage ? Math.max(0.8, density(hx, hz)) : density(hx, hz))) continue;
          if (!inSettlement(lon, lat, byVillage)) continue;
          const ground = groundAt(lon, lat);
          if (ground < 1.5) continue; // nước, bãi cát sát mép nước
          const slope = Math.max(
            Math.abs(groundAt(...toLonLat(hx + 15, hz)) - ground),
            Math.abs(groundAt(...toLonLat(hx, hz + 15)) - ground),
          );
          if (slope > (byVillage ? 6 : 4)) continue; // sườn dốc (xóm được san nền nhiều hơn)
          if (placeMeters.some((p) => Math.hypot(p.xz[0] - hx, p.xz[1] - hz) < PLACE_CLEAR)) continue;
          if (!clearOfRoads(hx, hz, size) || !farFromOthers(hx, hz)) continue;
          let type = TYPES.indexOf('quan');
          if (!nearShopSpot(hx, hz) || typeRoll >= 0.3) {
            const weights = density(hx, hz) > CENTER_CORE ? WEIGHTS_CENTER : WEIGHTS_VILLAGE;
            let acc = 0;
            const roll = random();
            type = Math.max(0, weights.findIndex((w) => (acc += w) >= roll));
          }
          // Nhà quay mặt ra đường (hướng từ nhà về phía đường), lệch nhẹ ngẫu nhiên.
          const facing = Math.atan2(-nx * side, -nz * side) + (random() - 0.5) * 2 * FACING_JITTER;
          houses.push([
            Number((hx / 100).toFixed(3)),
            Number((hz / 100).toFixed(3)),
            Number((ground / METERS_PER_UNIT).toFixed(4)),
            Number(facing.toFixed(3)),
            type,
            Number((size / 100).toFixed(3)),
            Math.floor(random() * 6),
          ]);
          const k = gridKey(hx, hz);
          taken.set(k, [...(taken.get(k) || []), [hx, hz]]);
        }
        travelled += between(STEP);
      }
      along += length;
    }
  }
}

// Giữ tối đa MAX_HOUSES nhà, bỏ đều nếu vượt.
const kept = houses.length > MAX_HOUSES ? houses.filter((_, i) => i % Math.ceil(houses.length / MAX_HOUSES) === 0) : houses;
const counts = TYPES.map((name, i) => `${name}: ${kept.filter((h) => h[4] === i).length}`).join(', ');
fs.writeFileSync(
  fileURLToPath(new URL('../src/education/island-houses.json', import.meta.url)),
  `${JSON.stringify({
    note: 'Nhà minh họa theo hiện trạng, sinh bởi npm run houses:build. Mỗi nhà: [x, z, cao độ mặt đất (đơn vị cảnh, chưa phóng đại), hướng (rad), kiểu, cỡ (đơn vị cảnh), màu tường].',
    types: TYPES,
    houses: kept,
  })}\n`,
);
console.log(`${candidates} vị trí thử, ${houses.length} đạt, giữ ${kept.length} nhà (${counts})`);
