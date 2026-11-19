#!/usr/bin/env node
/**
 * Chọn vị trí cây trên đảo Vĩnh Thực từ ảnh vệ tinh Sentinel-2 và lưới cao độ Copernicus,
 * rồi ghi client/src/education/island-trees.json.
 *   npm run trees:build      (dùng lệnh `sips` có sẵn trên macOS để đọc ảnh JPEG)
 *
 * Cây được đặt ở nơi ảnh có màu xanh thực vật, trên đất liền, cách xa đường và địa danh.
 * Đây là cây minh họa theo vùng rừng, không phải vị trí từng cây thật.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GEO_EXTENT, METERS_PER_UNIT, lonLatToWorld } from '../src/world/geo.js';
import { groundAt, toLonLat, toMeters as toSceneMeters } from './lib/island-ground.mjs';

const SPACING_METERS = 55; // Khoảng cách lưới thử đặt cây
const MAX_TREES = 9000;
const ROAD_CLEARANCE_METERS = 25;
const PLACE_CLEARANCE_METERS = 160;
const ISLAND = { west: 107.82, east: 108.02, south: 21.33, north: 21.42 };

const read = (relative) => fs.readFileSync(new URL(relative, import.meta.url));
const roads = JSON.parse(read('../src/education/island-roads.json'));
const places = JSON.parse(read('../src/education/island-places.json'));

// Cao độ mặt đất lấy từ lưới địa hình đã làm êm nền đường, khớp đúng mặt đất hiển thị.
const terrainHeight = groundAt;

// Đọc ảnh vệ tinh qua `sips` (chuyển sang BMP 24 bit) để không phải cài thư viện giải mã JPEG.
function readSatellite() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'eduverse-trees-'));
  try {
    const bmp = path.join(temp, 'satellite.bmp');
    execFileSync('sips', ['-s', 'format', 'bmp', fileURLToPath(new URL('../src/assets/terrain/vinh-thuc-satellite.jpg', import.meta.url)), '--out', bmp], { stdio: 'ignore' });
    const data = fs.readFileSync(bmp);
    const offset = data.readUInt32LE(10);
    const width = data.readInt32LE(18);
    const rawHeight = data.readInt32LE(22);
    const bits = data.readUInt16LE(28);
    const bytes = bits / 8;
    const rowSize = Math.ceil((width * bits) / 32) * 4;
    const height = Math.abs(rawHeight);
    const bottomUp = rawHeight > 0;
    return {
      width,
      height,
      pixel(x, y) {
        const row = bottomUp ? height - 1 - y : y;
        const i = offset + row * rowSize + x * bytes;
        return [data[i + 2], data[i + 1], data[i]];
      },
    };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

const image = readSatellite();
// Trung bình màu một ô 3×3 điểm ảnh quanh vị trí, để bớt nhiễu.
function colorAt(longitude, latitude) {
  const x = Math.round(((longitude - GEO_EXTENT.west) / (GEO_EXTENT.east - GEO_EXTENT.west)) * (image.width - 1));
  const y = Math.round(((GEO_EXTENT.north - latitude) / (GEO_EXTENT.north - GEO_EXTENT.south)) * (image.height - 1));
  let sum = [0, 0, 0];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const [r, g, b] = image.pixel(Math.min(image.width - 1, Math.max(0, x + dx)), Math.min(image.height - 1, Math.max(0, y + dy)));
      sum = [sum[0] + r, sum[1] + g, sum[2] + b];
    }
  }
  return sum.map((value) => value / 9);
}

// Độ "xanh thực vật" 0..1: kênh lục trội hơn đỏ và lam, không quá sáng (mái nhà, cát) hay quá tối (bóng, nước).
function vegetation([r, g, b]) {
  const brightness = (r + g + b) / 3;
  if (brightness < 18 || brightness > 120) return 0;
  const excessGreen = (2 * g - r - b) / (r + g + b + 1);
  return Math.max(0, Math.min(1, (excessGreen - 0.04) / 0.16));
}

const KM_PER_DEGREE_LATITUDE = 110.574;
const KM_PER_DEGREE_LONGITUDE = 111.32 * Math.cos((21.385 * Math.PI) / 180);
const toMeters = (longitude, latitude) => [longitude * KM_PER_DEGREE_LONGITUDE * 1000, latitude * KM_PER_DEGREE_LATITUDE * 1000];

// Lưới thô để tra nhanh khoảng cách tới đường.
const roadCells = new Set();
const cellKey = (mx, my) => `${Math.floor(mx / ROAD_CLEARANCE_METERS)},${Math.floor(my / ROAD_CLEARANCE_METERS)}`;
for (const line of [...roads.roads, ...(roads.minorRoads || []), ...(roads.tracks || [])]) {
  for (const [longitude, latitude] of line) roadCells.add(cellKey(...toMeters(longitude, latitude)));
}
function nearRoad(longitude, latitude) {
  const [mx, my] = toMeters(longitude, latitude);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (roadCells.has(cellKey(mx + dx * ROAD_CLEARANCE_METERS, my + dy * ROAD_CLEARANCE_METERS))) return true;
    }
  }
  return false;
}
const placeMeters = places.map((place) => toMeters(place.longitude, place.latitude));
// Không trồng cây trong vòng 18 m quanh nhà (scripts/build-island-houses.mjs; xa hơn thì cây xen vườn nhà), nếu đã có tệp nhà.
const houseFile = new URL('../src/education/island-houses.json', import.meta.url);
const houseCells = new Map();
const houseList = fs.existsSync(houseFile) ? JSON.parse(fs.readFileSync(houseFile, 'utf8')).houses : [];
for (const [x, z] of houseList) {
  const k = `${Math.floor((x * 100) / 30)},${Math.floor((z * 100) / 30)}`;
  houseCells.set(k, [...(houseCells.get(k) || []), [x * 100, z * 100]]);
}
function nearHouse(longitude, latitude) {
  const [lx, lz] = lonLatToWorld(longitude, latitude).map((v) => v * 100);
  const gx = Math.floor(lx / 30);
  const gz = Math.floor(lz / 30);
  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) {
      for (const [hx, hz] of houseCells.get(`${gx + a},${gz + b}`) || []) if (Math.hypot(hx - lx, hz - lz) < 18) return true;
    }
  }
  return false;
}
const nearPlace = (longitude, latitude) => {
  const [mx, my] = toMeters(longitude, latitude);
  return placeMeters.some(([px, py]) => Math.hypot(px - mx, py - my) < PLACE_CLEARANCE_METERS);
};

// Bộ sinh số giả ngẫu nhiên cố định, để chạy lại cho cùng kết quả.
let seed = 20261116;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const stepLon = SPACING_METERS / (KM_PER_DEGREE_LONGITUDE * 1000);
const stepLat = SPACING_METERS / (KM_PER_DEGREE_LATITUDE * 1000);
const trees = [];
for (let latitude = ISLAND.south; latitude < ISLAND.north; latitude += stepLat) {
  for (let longitude = ISLAND.west; longitude < ISLAND.east; longitude += stepLon) {
    const lon = longitude + (random() - 0.5) * stepLon;
    const lat = latitude + (random() - 0.5) * stepLat;
    const ground = terrainHeight(lon, lat);
    if (ground < 3) continue; // Bờ biển, bãi cát, ruộng thấp
    const green = vegetation(colorAt(lon, lat));
    if (random() > green * 0.9) continue;
    if (nearRoad(lon, lat) || nearPlace(lon, lat) || nearHouse(lon, lat)) continue;
    const [x, z] = lonLatToWorld(lon, lat);
    trees.push([Number(x.toFixed(2)), Number(z.toFixed(2)), Number((ground / METERS_PER_UNIT).toFixed(3)), Number((0.75 + random() * 0.6).toFixed(2))]);
  }
}
// Cây vườn: mỗi nhà có một đến ba cây nhỏ ở hai bên và phía sau nhà (phía trước là đường),
// cho xóm xanh như ảnh vệ tinh đường ra Bến Hèn thầy gửi. Tọa độ ở đây là mét tính từ gốc cảnh.
const GARDEN_RING = [20, 36]; // Khoảng cách từ tâm nhà tới cây vườn (m)
const GARDEN_ROAD_CLEARANCE = 16; // Cây vườn cách tim đường ít nhất (m)
const roadSegments = [];
for (const line of [...roads.roads, ...(roads.minorRoads || []), ...(roads.tracks || [])]) {
  for (let i = 1; i < line.length; i++) roadSegments.push([...toSceneMeters(line[i - 1][0], line[i - 1][1]), ...toSceneMeters(line[i][0], line[i][1])]);
}
function roadDistance(x, z) {
  let best = Infinity;
  for (const [ax, az, bx, bz] of roadSegments) {
    if (Math.min(ax, bx) - x > 60 || x - Math.max(ax, bx) > 60 || Math.min(az, bz) - z > 60 || z - Math.max(az, bz) > 60) continue;
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}
const scenePlaces = places.map((place) => toSceneMeters(place.longitude, place.latitude));
const garden = [];
let gardenTrees = 0;
for (const [x, z, , facing] of houseList) {
  const [hx, hz] = [x * 100, z * 100];
  const count = 1 + Math.floor(random() * 3);
  for (let i = 0; i < count; i++) {
    // Mặt trước nhà quay về hướng (sin facing, cos facing); cây đặt trong nửa vòng phía sau, lệch sang hai bên.
    const angle = facing + Math.PI + (random() - 0.5) * Math.PI * 1.2;
    const distance = GARDEN_RING[0] + random() * (GARDEN_RING[1] - GARDEN_RING[0]);
    const gx = hx + Math.sin(angle) * distance;
    const gz = hz + Math.cos(angle) * distance;
    const [lon, lat] = toLonLat(gx, gz);
    const ground = terrainHeight(lon, lat);
    if (ground < 1.5 || nearHouse(lon, lat) || roadDistance(gx, gz) < GARDEN_ROAD_CLEARANCE) continue;
    if (scenePlaces.some(([px, pz]) => Math.hypot(px - gx, pz - gz) < 90)) continue; // tránh mô hình địa danh
    if (garden.some(([ox, oz]) => Math.hypot(ox - gx, oz - gz) < 14)) continue;
    garden.push([gx, gz]);
    trees.push([Number((gx / 100).toFixed(2)), Number((gz / 100).toFixed(2)), Number((ground / METERS_PER_UNIT).toFixed(3)), Number((0.55 + random() * 0.35).toFixed(2))]);
    gardenTrees++;
  }
}
console.log(`${gardenTrees} cây vườn quanh nhà`);

// Giữ tối đa MAX_TREES cây, bỏ đều nếu vượt.
const kept = trees.length > MAX_TREES ? trees.filter((_, index) => index % Math.ceil(trees.length / MAX_TREES) === 0) : trees;

const output = fileURLToPath(new URL('../src/education/island-trees.json', import.meta.url));
fs.writeFileSync(
  output,
  `${JSON.stringify({
    note: 'Cây minh họa theo vùng thực vật trên ảnh vệ tinh, sinh bởi npm run trees:build. Mỗi cây là [x, z, cao độ mặt đất (đơn vị cảnh, chưa phóng đại), tỷ lệ].',
    trees: kept,
  })}\n`,
);
console.log(`${trees.length} vị trí đạt, giữ ${kept.length} cây -> ${output}`);
