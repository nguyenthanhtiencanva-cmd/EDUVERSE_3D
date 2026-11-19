/**
 * Mặt đất dùng chung cho các script dựng bản đồ đảo (terrain:build, roadmesh:build, trees:build).
 *
 * Lưới địa hình lấy 1 trong 2 điểm của lưới cao độ Copernicus 30 m (khoảng 60 m mỗi ô), rồi
 * "làm êm nền đường": tính một mặt cắt dọc êm cho mạng đường chính và đường phụ (giới hạn độ dốc),
 * sau đó kéo các đỉnh lưới gần đường về cao độ của mặt cắt đó. Nhờ dùng chung module này,
 * địa hình, mặt đường và cây cùng đứng trên một mặt đất.
 */
import fs from 'node:fs';
import { GEO_EXTENT, GEO_ORIGIN } from '../../src/world/geo.js';

export const STEP = 2;
const MAX_GRADE = 0.1; // Độ dốc dọc tối đa của đường: 10%
const ROAD_FLOOR = 1.8; // Mặt đường không thấp hơn 1,8 m so với mực nước (đắp đê qua đầm, bãi)
const CARVE_FULL = 15; // Trong 15 m quanh tim đường: nền theo hẳn cao độ đường
const CARVE_RADIUS = 45; // Từ 15 m đến 45 m: chuyển dần về địa hình gốc

const read = (relative) => fs.readFileSync(new URL(relative, import.meta.url));
export const grid = JSON.parse(read('../../public/terrain/vinh-thuc.json'));
const raw = read('../../public/terrain/vinh-thuc.f32');
const fine = new Float32Array(raw.buffer, raw.byteOffset, grid.width * grid.height);

for (const key of ['west', 'south', 'east', 'north']) {
  if (Math.abs(grid[key] - GEO_EXTENT[key]) > 1e-9) throw new Error(`Phạm vi lưới cao độ khác GEO_EXTENT ở ${key}`);
}

export const columns = Math.floor((grid.width - 1) / STEP) + 1;
export const rows = Math.floor((grid.height - 1) / STEP) + 1;

// Cao độ gốc (m) của lưới thô, trước khi làm êm nền đường.
export const rawHeights = new Float32Array(columns * rows);
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < columns; c++) rawHeights[r * columns + c] = Math.max(0, fine[r * STEP * grid.width + c * STEP]);
}

// Đổi kinh độ, vĩ độ sang mét quanh gốc tọa độ của cảnh (x Đông, z Nam), khớp lonLatToWorld.
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320 * Math.cos((GEO_ORIGIN.latitude * Math.PI) / 180);
export const toMeters = (lon, lat) => [(lon - GEO_ORIGIN.longitude) * M_PER_DEG_LON, -(lat - GEO_ORIGIN.latitude) * M_PER_DEG_LAT];
export const toLonLat = (x, z) => [GEO_ORIGIN.longitude + x / M_PER_DEG_LON, GEO_ORIGIN.latitude - z / M_PER_DEG_LAT];

const gridU = (lon) => ((lon - grid.west) / (grid.east - grid.west)) * ((grid.width - 1) / STEP);
const gridV = (lat) => ((grid.north - lat) / (grid.north - grid.south)) * ((grid.height - 1) / STEP);
export const vertexLonLat = (c, r) => [
  grid.west + ((grid.east - grid.west) * c * STEP) / (grid.width - 1),
  grid.north - ((grid.north - grid.south) * r * STEP) / (grid.height - 1),
];

// Nội suy trên đúng các tam giác của lưới địa hình (mỗi ô chia theo đường chéo b–c).
export function sample(heights, lon, lat) {
  const u = gridU(lon);
  const v = gridV(lat);
  const c = Math.max(0, Math.min(columns - 2, Math.floor(u)));
  const r = Math.max(0, Math.min(rows - 2, Math.floor(v)));
  const fx = u - c;
  const fy = v - r;
  const a = heights[r * columns + c];
  const b = heights[r * columns + c + 1];
  const cc = heights[(r + 1) * columns + c];
  const d = heights[(r + 1) * columns + c + 1];
  return fx + fy <= 1 ? a + (b - a) * fx + (cc - a) * fy : d + (cc - d) * (1 - fx) + (b - d) * (1 - fy);
}

// Mạng đường cần làm êm: đường chính và đường phụ (đường mòn chỉ trải theo địa hình).
export function roadNetwork(roads) {
  const nodes = new Map();
  const node = ([lon, lat]) => {
    const key = `${lon},${lat}`;
    if (!nodes.has(key)) {
      const [x, z] = toMeters(lon, lat);
      nodes.set(key, { key, lon, lat, x, z, base: sample(rawHeights, lon, lat), neighbors: new Map(), main: false });
    }
    return nodes.get(key);
  };
  const segments = [];
  for (const [lines, main] of [[roads.roads, true], [roads.minorRoads || [], false]]) {
    for (const line of lines) {
      for (let i = 1; i < line.length; i++) {
        const a = node(line[i - 1]);
        const b = node(line[i]);
        if (a === b) continue;
        const length = Math.hypot(b.x - a.x, b.z - a.z);
        a.neighbors.set(b, length);
        b.neighbors.set(a, length);
        if (main) a.main = b.main = true;
        segments.push({ a, b, main });
      }
    }
  }
  // Mặt cắt dọc êm: làm mượt kiểu Laplace có neo về cao độ gốc, đặt sàn chống ngập, rồi giới hạn độ dốc.
  const list = [...nodes.values()];
  for (const n of list) n.height = n.base;
  for (let pass = 0; pass < 60; pass++) {
    const next = list.map((n) => {
      let sum = 0;
      for (const neighbor of n.neighbors.keys()) sum += neighbor.height;
      return 0.85 * (sum / n.neighbors.size) + 0.15 * n.base;
    });
    list.forEach((n, i) => { n.height = next[i]; });
  }
  for (const n of list) n.height = Math.max(ROAD_FLOOR, n.height);
  for (let pass = 0; pass < 60; pass++) {
    let changed = false;
    for (const { a, b } of segments) {
      const length = a.neighbors.get(b);
      const excess = Math.abs(a.height - b.height) - MAX_GRADE * length;
      if (excess > 0.01) {
        const [high, low] = a.height > b.height ? [a, b] : [b, a];
        high.height -= excess / 2;
        low.height = Math.max(ROAD_FLOOR, low.height + excess / 2);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { nodes: list, segments };
}

const smoothstep = (t) => t * t * (3 - 2 * t);

// Lưới cao độ sau khi làm êm nền đường. Chỉ sửa đỉnh trên đất liền, để không đắp đất ra biển.
export function carvedHeights(roads) {
  const { segments } = roadNetwork(roads);
  const best = new Float32Array(columns * rows).fill(Infinity);
  const target = new Float32Array(columns * rows);
  const metersPerColumn = (STEP * (grid.east - grid.west) * M_PER_DEG_LON) / (grid.width - 1);
  const metersPerRow = (STEP * (grid.north - grid.south) * M_PER_DEG_LAT) / (grid.height - 1);
  for (const { a, b } of segments) {
    const c0 = Math.max(0, Math.floor(Math.min(gridU(a.lon), gridU(b.lon)) - CARVE_RADIUS / metersPerColumn));
    const c1 = Math.min(columns - 1, Math.ceil(Math.max(gridU(a.lon), gridU(b.lon)) + CARVE_RADIUS / metersPerColumn));
    const r0 = Math.max(0, Math.floor(Math.min(gridV(a.lat), gridV(b.lat)) - CARVE_RADIUS / metersPerRow));
    const r1 = Math.min(rows - 1, Math.ceil(Math.max(gridV(a.lat), gridV(b.lat)) + CARVE_RADIUS / metersPerRow));
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length2 = dx * dx + dz * dz || 1;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const [x, z] = toMeters(...vertexLonLat(c, r));
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / length2));
        const distance = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
        const index = r * columns + c;
        if (distance < best[index]) {
          best[index] = distance;
          target[index] = a.height + (b.height - a.height) * t;
        }
      }
    }
  }
  const heights = Float32Array.from(rawHeights);
  for (let i = 0; i < heights.length; i++) {
    if (best[i] >= CARVE_RADIUS || rawHeights[i] <= 0) continue;
    const weight = best[i] <= CARVE_FULL ? 1 : smoothstep(1 - (best[i] - CARVE_FULL) / (CARVE_RADIUS - CARVE_FULL));
    heights[i] = rawHeights[i] + weight * (target[i] - rawHeights[i]);
  }
  return heights;
}

let cache = null;
// Lưới cao độ đã làm êm, tính từ client/src/education/island-roads.json.
export function groundHeights() {
  if (!cache) cache = carvedHeights(JSON.parse(read('../../src/education/island-roads.json')));
  return cache;
}
export const groundAt = (lon, lat) => sample(groundHeights(), lon, lat);

// Ghi một tệp GLB gồm nhiều mesh (vị trí theo đơn vị cảnh, chưa phóng đại chiều đứng).
export function writeGlb(path, meshes, generator) {
  const views = [];
  const accessors = [];
  const chunks = [];
  let offset = 0;
  const addView = (array, target) => {
    const buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    views.push({ buffer: 0, byteOffset: offset, byteLength: buffer.length, target });
    chunks.push(buffer);
    offset += buffer.length;
    const pad = (4 - (offset % 4)) % 4;
    if (pad) {
      chunks.push(Buffer.alloc(pad));
      offset += pad;
    }
    return views.length - 1;
  };
  const gltfMeshes = meshes.map((mesh, i) => {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    mesh.positions.forEach((value, j) => {
      min[j % 3] = Math.min(min[j % 3], value);
      max[j % 3] = Math.max(max[j % 3], value);
    });
    accessors.push({ bufferView: addView(mesh.positions, 34962), componentType: 5126, count: mesh.positions.length / 3, type: 'VEC3', min, max });
    const attributes = { POSITION: accessors.length - 1 };
    if (mesh.uvs) {
      accessors.push({ bufferView: addView(mesh.uvs, 34962), componentType: 5126, count: mesh.uvs.length / 2, type: 'VEC2' });
      attributes.TEXCOORD_0 = accessors.length - 1;
    }
    accessors.push({ bufferView: addView(mesh.indices, 34963), componentType: 5125, count: mesh.indices.length, type: 'SCALAR' });
    return { name: mesh.name, primitives: [{ attributes, indices: accessors.length - 1, material: i }] };
  });
  const binary = Buffer.concat(chunks);
  const gltf = {
    asset: { version: '2.0', generator },
    scene: 0,
    scenes: [{ nodes: meshes.map((_, i) => i) }],
    nodes: meshes.map((mesh, i) => ({ name: mesh.name, mesh: i })),
    meshes: gltfMeshes,
    materials: meshes.map((mesh) => ({ name: mesh.material, pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 1 } })),
    buffers: [{ byteLength: binary.length }],
    bufferViews: views,
    accessors,
  };
  let json = Buffer.from(JSON.stringify(gltf));
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const head = (length, type) => {
    const b = Buffer.alloc(8);
    b.writeUInt32LE(length, 0);
    b.writeUInt32LE(type, 4);
    return b;
  };
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + binary.length, 8);
  fs.writeFileSync(path, Buffer.concat([header, head(json.length, 0x4e4f534a), json, head(binary.length, 0x004e4942), binary]));
}
