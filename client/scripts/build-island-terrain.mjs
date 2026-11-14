#!/usr/bin/env node
/**
 * Dựng lưới địa hình đảo Vĩnh Thực và vùng lân cận từ lưới cao độ Copernicus GLO-30.
 *   npm run terrain:build      # ghi assets/web-models/vinh_thuc_terrain.glb
 *   npm run models:compress -- terrain
 *
 * Chỉ dựng các ô có đất; mặt biển là một mặt phẳng riêng trong cảnh.
 * Cao độ ghi theo tỷ lệ thật, độ phóng đại chiều đứng được áp lúc hiển thị.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GEO_EXTENT, METERS_PER_UNIT, lonLatToWorld } from '../src/world/geo.js';

const STEP = 2; // Lấy 1 trong 2 điểm của lưới 30 m, tức khoảng 60 m mỗi ô
const grid = JSON.parse(fs.readFileSync(new URL('../public/terrain/vinh-thuc.json', import.meta.url), 'utf8'));
const raw = fs.readFileSync(new URL('../public/terrain/vinh-thuc.f32', import.meta.url));
const heights = new Float32Array(raw.buffer, raw.byteOffset, grid.width * grid.height);

for (const key of ['west', 'south', 'east', 'north']) {
  if (Math.abs(grid[key] - GEO_EXTENT[key]) > 1e-9) throw new Error(`Phạm vi lưới cao độ khác GEO_EXTENT ở ${key}`);
}

const columns = Math.floor((grid.width - 1) / STEP) + 1;
const rows = Math.floor((grid.height - 1) / STEP) + 1;
const heightAt = (column, row) => Math.max(0, heights[row * STEP * grid.width + column * STEP]);

const vertexIndex = new Int32Array(columns * rows).fill(-1);
const positions = [];
const uvs = [];
const indices = [];

function vertex(column, row) {
  const key = row * columns + column;
  if (vertexIndex[key] >= 0) return vertexIndex[key];
  const u = (column * STEP) / (grid.width - 1);
  const v = (row * STEP) / (grid.height - 1); // 0 ở mép Bắc, khớp quy ước UV của glTF
  const longitude = grid.west + (grid.east - grid.west) * u;
  const latitude = grid.north - (grid.north - grid.south) * v;
  const [x, z] = lonLatToWorld(longitude, latitude);
  positions.push(x, heightAt(column, row) / METERS_PER_UNIT, z);
  uvs.push(u, v);
  vertexIndex[key] = positions.length / 3 - 1;
  return vertexIndex[key];
}

for (let row = 0; row < rows - 1; row++) {
  for (let column = 0; column < columns - 1; column++) {
    const isLand =
      heightAt(column, row) > 0 || heightAt(column + 1, row) > 0 ||
      heightAt(column, row + 1) > 0 || heightAt(column + 1, row + 1) > 0;
    if (!isLand) continue;
    const a = vertex(column, row);
    const b = vertex(column + 1, row);
    const c = vertex(column, row + 1);
    const d = vertex(column + 1, row + 1);
    indices.push(a, c, b, b, c, d);
  }
}

const positionData = new Float32Array(positions);
const uvData = new Float32Array(uvs);
const indexData = new Uint32Array(indices);
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < positionData.length; i++) {
  min[i % 3] = Math.min(min[i % 3], positionData[i]);
  max[i % 3] = Math.max(max[i % 3], positionData[i]);
}

const buffers = [positionData, uvData, indexData].map((data) => Buffer.from(data.buffer));
const offsets = [0, buffers[0].length, buffers[0].length + buffers[1].length];
const binary = Buffer.concat(buffers);
const gltf = {
  asset: { version: '2.0', generator: 'EDUVERSE build-island-terrain', copyright: grid.attribution || grid.source },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: 'VinhThuc_Terrain', mesh: 0 }],
  meshes: [{ name: 'VinhThuc_Terrain', primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, indices: 2, material: 0 }] }],
  materials: [{ name: 'Mat_Terrain_Satellite', pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 1 } }],
  buffers: [{ byteLength: binary.length }],
  bufferViews: [
    { buffer: 0, byteOffset: offsets[0], byteLength: buffers[0].length, target: 34962 },
    { buffer: 0, byteOffset: offsets[1], byteLength: buffers[1].length, target: 34962 },
    { buffer: 0, byteOffset: offsets[2], byteLength: buffers[2].length, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: positionData.length / 3, type: 'VEC3', min, max },
    { bufferView: 1, componentType: 5126, count: uvData.length / 2, type: 'VEC2' },
    { bufferView: 2, componentType: 5125, count: indexData.length, type: 'SCALAR' },
  ],
};

let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + binary.length, 8);
const chunk = (length, type) => {
  const head = Buffer.alloc(8);
  head.writeUInt32LE(length, 0);
  head.writeUInt32LE(type, 4);
  return head;
};
const output = fileURLToPath(new URL('../../assets/web-models/vinh_thuc_terrain.glb', import.meta.url));
fs.writeFileSync(output, Buffer.concat([header, chunk(json.length, 0x4e4f534a), json, chunk(binary.length, 0x004e4942), binary]));
console.log(`${positionData.length / 3} đỉnh, ${indexData.length / 3} tam giác, cao nhất ${(max[1] * METERS_PER_UNIT).toFixed(0)} m -> ${output}`);
