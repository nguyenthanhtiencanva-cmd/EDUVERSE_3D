import { readFile, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fromUrl } from 'geotiff';

const directory = new URL('../public/terrain/', import.meta.url);
const grid = JSON.parse(await readFile(new URL('vinh-thuc.json', directory), 'utf8'));
const { width, height, west, south, east, north } = grid;
const elevation = await readFile(new URL('vinh-thuc.f32', directory));
if (elevation.byteLength !== width * height * 4) throw new Error('Incomplete terrain grid');
const heights = new Float32Array(elevation.buffer, elevation.byteOffset, width * height);
const water = new Uint8Array(width * height);
const coastlineSources = grid.sources.map((source) => {
  const url = new URL(source);
  const [folder, filename] = url.pathname.slice(1).split('/');
  url.pathname = `/${folder}/AUXFILES/${filename.replace('_DEM.tif', '_WBM.tif')}`;
  return url.href;
});

for (const url of coastlineSources) {
  const image = await (await fromUrl(url)).getImage();
  const [originX, originY] = image.getOrigin();
  const [dx, dy] = image.getResolution();
  const offset = image.getGeoKeys().GTRasterTypeGeoKey === 2 ? 0 : 0.5;
  const x0 = originX + offset * dx;
  const y0 = originY + offset * dy;
  const tileWest = Number(url.match(/_E(\d+)_00_WBM\.tif$/)[1]);
  const left = Math.max(0, Math.floor((Math.max(west, tileWest) - x0) / dx) - 1);
  const right = Math.min(image.getWidth(), Math.ceil((Math.min(east, tileWest + 1) - x0) / dx) + 2);
  const top = Math.max(0, Math.floor((north - y0) / dy) - 1);
  const bottom = Math.min(image.getHeight(), Math.ceil((south - y0) / dy) + 2);
  const samples = await image.readRasters({ window: [left, top, right, bottom], samples: [0], interleave: true });
  for (let row = 0; row < height; row++) {
    const latitude = north - (north - south) * row / (height - 1);
    const sampleRow = Math.round((latitude - y0) / dy) - top;
    for (let column = 0; column < width; column++) {
      const longitude = west + (east - west) * column / (width - 1);
      if (longitude < tileWest || longitude >= tileWest + 1) continue;
      const sampleColumn = Math.round((longitude - x0) / dx) - left;
      const value = samples[sampleRow * (right - left) + sampleColumn];
      if (value === undefined || value > 3) throw new Error(`Invalid WBM sample at ${longitude}, ${latitude}`);
      water[row * width + column] = value;
    }
  }
}

// Approximate distance to the nearest land pixel for the illustrated coast colors.
const distance = Float32Array.from(water, (value) => value ? Infinity : 0);
const diagonal = Math.SQRT2;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (x > 0) distance[i] = Math.min(distance[i], distance[i - 1] + 1);
    if (y > 0) {
      distance[i] = Math.min(distance[i], distance[i - width] + 1);
      if (x > 0) distance[i] = Math.min(distance[i], distance[i - width - 1] + diagonal);
      if (x < width - 1) distance[i] = Math.min(distance[i], distance[i - width + 1] + diagonal);
    }
  }
}
for (let y = height - 1; y >= 0; y--) {
  for (let x = width - 1; x >= 0; x--) {
    const i = y * width + x;
    if (x < width - 1) distance[i] = Math.min(distance[i], distance[i + 1] + 1);
    if (y < height - 1) {
      distance[i] = Math.min(distance[i], distance[i + width] + 1);
      if (x > 0) distance[i] = Math.min(distance[i], distance[i + width - 1] + diagonal);
      if (x < width - 1) distance[i] = Math.min(distance[i], distance[i + width + 1] + diagonal);
    }
  }
}

const clamp = (value) => Math.min(1, Math.max(0, value));
const mix = (a, b, t) => a.map((channel, i) => channel + (b[i] - channel) * t);
const edgeColor = [182, 220, 226];
const rowBytes = width * 3 + 1;
const pixels = Buffer.alloc(rowBytes * height);
const smooth = heights.map((value, index) => {
  const x = index % width;
  const y = Math.floor(index / width);
  return (4 * value + heights[y * width + Math.max(x - 1, 0)]
    + heights[y * width + Math.min(x + 1, width - 1)]
    + heights[Math.max(y - 1, 0) * width + x]
    + heights[Math.min(y + 1, height - 1) * width + x]) / 8;
});
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const gradient = clamp(Math.sqrt(distance[i] / 105));
    const shade = (smooth[y * width + Math.min(x + 1, width - 1)]
      - smooth[y * width + Math.max(x - 1, 0)]
      + smooth[Math.max(y - 1, 0) * width + x] - smooth[Math.min(y + 1, height - 1) * width + x]) / 116;
    const land = mix([155, 174, 114], [52, 107, 69], clamp(heights[i] / 94))
      .map((channel) => channel * (0.98 + Math.max(-0.22, Math.min(0.27, shade))));
    const sea = mix([113, 220, 217], [40, 132, 177], gradient);
    const fade = clamp(Math.min(x, y, width - 1 - x, height - 1 - y) / 115);
    const rgb = mix(edgeColor, water[i] ? sea : land, fade);
    for (let channel = 0; channel < 3; channel++) {
      pixels[y * rowBytes + 1 + x * 3 + channel] = Math.round(clamp(rgb[channel] / 255) * 255);
    }
  }
}

const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value;
});
function chunk(type, data) {
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  output.write(type, 4, 'ascii');
  data.copy(output, 8);
  let crc = 0xffffffff;
  for (const byte of output.subarray(4, -4)) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  output.writeUInt32BE((crc ^ 0xffffffff) >>> 0, data.length + 8);
  return output;
}
const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0);
header.writeUInt32BE(height, 4);
header[8] = 8;
header[9] = 2;
await writeFile(new URL('vinh-thuc-style.png', directory), Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(pixels)),
  chunk('IEND', Buffer.alloc(0)),
]));
console.log(`Prepared ${width} × ${height} map image from the Copernicus DEM and water masks.`);
