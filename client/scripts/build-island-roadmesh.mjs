#!/usr/bin/env node
/**
 * Dựng mặt đường 3D của đảo Vĩnh Thực từ client/src/education/island-roads.json,
 * trải theo mặt đất đã làm êm nền đường (scripts/lib/island-ground.mjs).
 *   npm run roadmesh:build     # ghi assets/web-models/vinh_thuc_roads.glb
 *   npm run models:compress -- roads
 *
 * Thứ tự khi cập nhật đường: roads:build -> terrain:build -> roadmesh:build -> trees:build -> models:compress.
 * Mặt đường rộng hơn thật (khoảng 3 lần) để còn nhìn thấy trên bản đồ toàn đảo.
 */
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { METERS_PER_UNIT } from '../src/world/geo.js';
import { groundAt, roadNetwork, toLonLat, toMeters, writeGlb } from './lib/island-ground.mjs';

const roads = JSON.parse(fs.readFileSync(new URL('../src/education/island-roads.json', import.meta.url), 'utf8'));
const SAMPLE = 10; // Chia đường thành đoạn 10 m để bám theo mặt đất
const FLOOR = 1.8; // Khớp ROAD_FLOOR: mặt đường đi qua đầm, bãi được đắp lên tối thiểu 1,8 m
const CLASSES = {
  main: { name: 'Road_Main', material: 'Mat_Road_Asphalt', width: 20, lift: 2.0, floor: FLOOR },
  minor: { name: 'Road_Minor', material: 'Mat_Road_Concrete', width: 16, lift: 1.8, floor: FLOOR },
  track: { name: 'Road_Track', material: 'Mat_Road_Dirt', width: 10, lift: 1.6, floor: 0.8 },
};
const MARK = { width: 0.9, dash: 6, gap: 6, lift: 2.6 };

function builder(name, material) {
  return { name, material, positions: [], indices: [] };
}
function vertex(mesh, x, z, height) {
  mesh.positions.push(x / 100, height / METERS_PER_UNIT, z / 100);
  return mesh.positions.length / 3 - 1;
}
const groundAtMeters = (x, z) => groundAt(...toLonLat(x, z));

// Chia lại đường gấp khúc thành các điểm cách nhau khoảng SAMPLE mét.
function resample(line) {
  const points = line.map(([lon, lat]) => toMeters(lon, lat));
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [x0, z0] = points[i - 1];
    const [x1, z1] = points[i];
    const pieces = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / SAMPLE));
    for (let k = 1; k <= pieces; k++) out.push([x0 + ((x1 - x0) * k) / pieces, z0 + ((z1 - z0) * k) / pieces]);
  }
  return out;
}

// Pháp tuyến (sang trái) tại từng điểm, lấy trung bình hai đoạn kề, có giới hạn độ dài góc gấp.
function normals(points) {
  return points.map((_, i) => {
    const [ax, az] = points[Math.max(0, i - 1)];
    const [bx, bz] = points[Math.min(points.length - 1, i + 1)];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    return [-(bz - az) / length, (bx - ax) / length];
  });
}

const meshes = Object.fromEntries(Object.entries(CLASSES).map(([key, c]) => [key, builder(c.name, c.material)]));
const marks = builder('Road_Marking', 'Mat_Road_Marking');
const embankment = builder('Road_Embankment', 'Mat_Road_Embankment');

function ribbon(line, cls) {
  const mesh = meshes[cls];
  const { width, lift, floor } = CLASSES[cls];
  const points = resample(line);
  const sides = normals(points);
  let previous = null;
  points.forEach(([x, z], i) => {
    const [nx, nz] = sides[i];
    const half = width / 2;
    const left = [x + nx * half, z + nz * half];
    const right = [x - nx * half, z - nz * half];
    const surface = Math.max(floor, groundAtMeters(x, z));
    const edge = ([ex, ez]) => Math.max(surface - 0.6, Math.max(floor, groundAtMeters(ex, ez)));
    const row = [vertex(mesh, left[0], left[1], edge(left) + lift), vertex(mesh, x, z, surface + lift), vertex(mesh, right[0], right[1], edge(right) + lift)];
    if (previous) {
      for (let k = 0; k < 2; k++) mesh.indices.push(previous[k], row[k], previous[k + 1], previous[k + 1], row[k], row[k + 1]);
    }
    // Đoạn đắp qua đầm, bãi trũng: kè đá hai bên, từ mép đường xuống dưới mặt nước.
    const groundHere = groundAtMeters(x, z);
    if (cls !== 'track' && groundHere < floor - 0.4 && i > 0) {
      const [px, pz] = points[i - 1];
      const [pnx, pnz] = sides[i - 1];
      const top = surface + lift - 0.2;
      for (const s of [1, -1]) {
        const a = vertex(embankment, px + s * pnx * (half + 1), pz + s * pnz * (half + 1), top);
        const b = vertex(embankment, x + s * nx * (half + 1), z + s * nz * (half + 1), top);
        const c = vertex(embankment, px + s * pnx * (half + 7), pz + s * pnz * (half + 7), -1.5);
        const d = vertex(embankment, x + s * nx * (half + 7), z + s * nz * (half + 7), -1.5);
        embankment.indices.push(a, c, b, b, c, d, a, b, c, b, d, c);
      }
    }
    previous = row;
  });
  // Vạch giữa nét đứt trên trục chính.
  if (cls === 'main') {
    let travelled = 0;
    for (let i = 1; i < points.length; i++) {
      const [x0, z0] = points[i - 1];
      const [x1, z1] = points[i];
      const length = Math.hypot(x1 - x0, z1 - z0);
      const phase = travelled % (MARK.dash + MARK.gap);
      travelled += length;
      if (phase > MARK.dash) continue;
      const [nx, nz] = sides[i];
      const w = MARK.width / 2;
      const h0 = Math.max(FLOOR, groundAtMeters(x0, z0)) + MARK.lift;
      const h1 = Math.max(FLOOR, groundAtMeters(x1, z1)) + MARK.lift;
      const a = vertex(marks, x0 + nx * w, z0 + nz * w, h0);
      const b = vertex(marks, x0 - nx * w, z0 - nz * w, h0);
      const c = vertex(marks, x1 + nx * w, z1 + nz * w, h1);
      const d = vertex(marks, x1 - nx * w, z1 - nz * w, h1);
      marks.indices.push(a, c, b, b, c, d);
    }
  }
}

for (const line of roads.roads) ribbon(line, 'main');
for (const line of roads.minorRoads || []) ribbon(line, 'minor');
for (const line of roads.tracks || []) ribbon(line, 'track');

// Bo tròn ngã ba, ngã tư: một đĩa tròn trải theo mặt đất tại mỗi nút có từ 3 nhánh.
const { nodes } = roadNetwork(roads);
let junctions = 0;
for (const node of nodes) {
  if (node.neighbors.size < 3) continue;
  const cls = node.main ? 'main' : 'minor';
  const { width, lift, floor } = CLASSES[cls];
  const mesh = meshes[cls];
  const radius = width * 0.62;
  const surface = Math.max(floor, groundAtMeters(node.x, node.z));
  const center = vertex(mesh, node.x, node.z, surface + lift + 0.05);
  const ring = [];
  for (let k = 0; k < 12; k++) {
    const angle = (k / 12) * Math.PI * 2;
    const x = node.x + Math.cos(angle) * radius;
    const z = node.z + Math.sin(angle) * radius;
    ring.push(vertex(mesh, x, z, Math.max(surface - 0.6, Math.max(floor, groundAtMeters(x, z))) + lift + 0.05));
  }
  for (let k = 0; k < 12; k++) mesh.indices.push(center, ring[(k + 1) % 12], ring[k]);
  junctions++;
}

const output = fileURLToPath(new URL('../../assets/web-models/vinh_thuc_roads.glb', import.meta.url));
const all = [...Object.values(meshes), marks, embankment].filter((m) => m.indices.length);
writeGlb(
  output,
  all.map((m) => ({ name: m.name, material: m.material, positions: new Float32Array(m.positions), indices: new Uint32Array(m.indices) })),
  'EDUVERSE build-island-roadmesh (đường: © OpenStreetMap contributors, ODbL)',
);
// Tim đường theo cao độ mặt đường (m), để vẽ nét mảnh khi nhìn từ xa (mặt đường thật khi đó quá nhỏ).
const centerline = (line, floor) => line.map(([lon, lat]) => [lon, lat, Number(Math.max(floor, groundAt(lon, lat)).toFixed(1))]);
fs.writeFileSync(
  fileURLToPath(new URL('../src/education/island-road-lines.json', import.meta.url)),
  `${JSON.stringify({
    note: 'Sinh bởi npm run roadmesh:build. Mỗi điểm là [kinh độ, vĩ độ, cao độ mặt đường mét]. Đường: © OpenStreetMap contributors (ODbL).',
    roads: roads.roads.map((line) => centerline(line, FLOOR)),
    minorRoads: (roads.minorRoads || []).map((line) => centerline(line, FLOOR)),
  })}\n`,
);
const triangles = all.reduce((sum, m) => sum + m.indices.length / 3, 0);
console.log(`${all.map((m) => `${m.name}: ${m.indices.length / 3}`).join(', ')} | ${junctions} ngã ba | tổng ${triangles} tam giác -> ${output}`);
