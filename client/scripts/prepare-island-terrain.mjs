import { mkdir, writeFile } from 'node:fs/promises';
import { fromUrl } from 'geotiff';

// WGS84 grid, north-to-south rows. Keep the source spacing (~30 m).
const bounds = { west: 107.76, south: 21.26, east: 108.12, north: 21.48 };
const step = 1 / 3600;
const width = Math.round((bounds.east - bounds.west) / step) + 1;
const height = Math.round((bounds.north - bounds.south) / step) + 1;
const heights = new Float32Array(width * height);
const sources = [];

for (const longitude of [107, 108]) {
  const tile = `Copernicus_DSM_COG_10_N21_00_E${longitude}_00_DEM`;
  const url = `https://copernicus-dem-30m.s3.amazonaws.com/${tile}/${tile}.tif`;
  const tiff = await fromUrl(url);
  const image = await tiff.getImage();
  const [originX, originY] = image.getOrigin();
  const [dx, dy] = image.getResolution();
  const pixelOffset = image.getGeoKeys().GTRasterTypeGeoKey === 2 ? 0 : 0.5;
  const firstX = originX + pixelOffset * dx;
  const firstY = originY + pixelOffset * dy;
  const left = Math.max(0, Math.floor((Math.max(bounds.west, longitude) - firstX) / dx) - 1);
  const top = Math.max(0, Math.floor((bounds.north - firstY) / dy) - 1);
  const right = Math.min(image.getWidth(), Math.ceil((Math.min(bounds.east, longitude + 1) - firstX) / dx) + 2);
  const bottom = Math.min(image.getHeight(), Math.ceil((bounds.south - firstY) / dy) + 2);
  const raster = await image.readRasters({ window: [left, top, right, bottom], samples: [0], interleave: true });
  const noData = image.getGDALNoData();
  for (let row = 0; row < height; row++) {
    const latitude = bounds.north - row * step;
    const sourceRow = Math.round((latitude - firstY) / dy) - top;
    for (let column = 0; column < width; column++) {
      const lon = bounds.west + column * step;
      if (lon < longitude || lon >= longitude + 1) continue;
      const sourceColumn = Math.round((lon - firstX) / dx) - left;
      const value = raster[sourceRow * (right - left) + sourceColumn];
      if (!Number.isFinite(value) || value === noData) throw new Error(`Missing elevation at ${lon}, ${latitude}`);
      heights[row * width + column] = value;
    }
  }
  sources.push(url);
  console.log(`Read ${tile}`);
}

const output = new URL('../public/terrain/', import.meta.url);
await mkdir(output, { recursive: true });
const bytes = Buffer.alloc(heights.length * 4);
heights.forEach((value, index) => bytes.writeFloatLE(value, index * 4));
const metadata = {
  ...bounds, width, height, format: 'float32-little-endian', rowOrder: 'north-to-south',
  horizontalDatum: 'WGS84', verticalDatum: 'EGM2008', spacingArcSeconds: 1,
  source: 'Copernicus DEM GLO-30, AWS 2021 release', sources,
  attribution: '© DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018. Produced using Copernicus WorldDEM-30.',
  license: 'https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM',
  minimum: heights.reduce((a, b) => Math.min(a, b), Infinity),
  maximum: heights.reduce((a, b) => Math.max(a, b), -Infinity),
};
await writeFile(new URL('vinh-thuc.f32', output), bytes);
await writeFile(new URL('vinh-thuc.json', output), JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify({ width, height, bytes: bytes.length, minimum: metadata.minimum, maximum: metadata.maximum }));
