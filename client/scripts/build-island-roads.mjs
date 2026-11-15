#!/usr/bin/env node
/**
 * Lấy đường chính và tuyến phà của đảo Vĩnh Thực từ OpenStreetMap, gắn cao độ địa hình,
 * rồi ghi client/src/education/island-roads.json.
 *   npm run roads:build      (cần mạng)
 *
 * Dữ liệu © OpenStreetMap contributors, giấy phép ODbL: bản đồ phải ghi nguồn này.
 * Cao độ được nội suy trên đúng lưới tam giác của `terrain:build`, để đường bám sát mặt địa hình.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const STEP = 2; // Phải khớp STEP trong build-island-terrain.mjs
const SPACING_METERS = 30; // Chèn điểm để đường uốn theo địa hình
const MAIN_ROADS = new Set(['primary', 'secondary', 'tertiary', 'unclassified']);
const QUERY = `[out:json][timeout:40];
(way["highway"](21.33,107.82,21.42,108.02);way["route"="ferry"](21.33,107.82,21.50,108.02););
out geom tags;`;

const grid = JSON.parse(fs.readFileSync(new URL('../public/terrain/vinh-thuc.json', import.meta.url), 'utf8'));
const raw = fs.readFileSync(new URL('../public/terrain/vinh-thuc.f32', import.meta.url));
const heights = new Float32Array(raw.buffer, raw.byteOffset, grid.width * grid.height);
const columns = Math.floor((grid.width - 1) / STEP) + 1;
const rows = Math.floor((grid.height - 1) / STEP) + 1;
const heightAt = (column, row) =>
  Math.max(0, heights[Math.min(row, rows - 1) * STEP * grid.width + Math.min(column, columns - 1) * STEP]);

// Cao độ tại một điểm, nội suy trong tam giác của lưới địa hình (mỗi ô chia theo đường chéo b-c).
function terrainHeight(longitude, latitude) {
  const u = ((longitude - grid.west) / (grid.east - grid.west)) * (grid.width - 1) / STEP;
  const v = ((grid.north - latitude) / (grid.north - grid.south)) * (grid.height - 1) / STEP;
  const column = Math.max(0, Math.min(columns - 2, Math.floor(u)));
  const row = Math.max(0, Math.min(rows - 2, Math.floor(v)));
  const fx = u - column;
  const fy = v - row;
  const a = heightAt(column, row);
  const b = heightAt(column + 1, row);
  const c = heightAt(column, row + 1);
  const d = heightAt(column + 1, row + 1);
  return fx + fy <= 1 ? a + (b - a) * fx + (c - a) * fy : d + (c - d) * (1 - fx) + (b - d) * (1 - fy);
}

const KM_PER_DEGREE_LATITUDE = 110.574;
const KM_PER_DEGREE_LONGITUDE = 111.32 * Math.cos((21.385 * Math.PI) / 180);
const meters = (a, b) =>
  1000 * Math.hypot((b.lon - a.lon) * KM_PER_DEGREE_LONGITUDE, (b.lat - a.lat) * KM_PER_DEGREE_LATITUDE);

function toLine(geometry, onSea) {
  const line = [];
  const push = (lon, lat) =>
    line.push([Number(lon.toFixed(5)), Number(lat.toFixed(5)), onSea ? 0 : Number(terrainHeight(lon, lat).toFixed(1))]);
  geometry.forEach((point, index) => {
    if (index > 0) {
      const previous = geometry[index - 1];
      const pieces = Math.ceil(meters(previous, point) / (onSea ? 400 : SPACING_METERS));
      for (let piece = 1; piece < pieces; piece++) {
        const t = piece / pieces;
        push(previous.lon + (point.lon - previous.lon) * t, previous.lat + (point.lat - previous.lat) * t);
      }
    }
    push(point.lon, point.lat);
  });
  return line;
}

const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'User-Agent': 'eduverse-map-build/1.0' },
  body: new URLSearchParams({ data: QUERY }),
});
if (!response.ok) throw new Error(`Overpass trả về ${response.status}`);
const { elements } = await response.json();

const roads = [];
const ferries = [];
let roadKm = 0;
let ferryKm = 0;
for (const element of elements) {
  const tags = element.tags || {};
  const length = element.geometry.slice(1).reduce((sum, point, index) => sum + meters(element.geometry[index], point), 0) / 1000;
  if (tags.route === 'ferry') {
    ferries.push(toLine(element.geometry, true));
    ferryKm += length;
  } else if (MAIN_ROADS.has(tags.highway)) {
    roads.push(toLine(element.geometry, false));
    roadKm += length;
  }
}

const output = fileURLToPath(new URL('../src/education/island-roads.json', import.meta.url));
fs.writeFileSync(
  output,
  `${JSON.stringify({
    attribution: '© OpenStreetMap contributors (ODbL)',
    fetched: new Date().toISOString().slice(0, 10),
    note: 'Mỗi điểm là [kinh độ, vĩ độ, cao độ mét]. Sinh bởi npm run roads:build, không sửa tay.',
    roads,
    ferries,
  })}\n`,
);
console.log(`${roads.length} đoạn đường chính (${roadKm.toFixed(1)} km), ${ferries.length} tuyến phà (${ferryKm.toFixed(1)} km) -> ${output}`);
console.log('Đầu tuyến phà:', ferries.map((line) => `${line[0].slice(0, 2)} -> ${line[line.length - 1].slice(0, 2)}`).join(' | '));
