import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareCampusMaterials, sampleElevation, SCHOOL_ANCHOR } from '../src/world/geography.js';

test('campus UV repair preserves textured buildings and shared materials', () => {
  const material = { normalTexture: { index: 1 }, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, baseColorFactor: [1, 0, 0, 1] } };
  const gltf = { nodes: [{ name: 'ENV_BackgroundHill', mesh: 0 }, { name: 'School', mesh: 0 }], materials: [material], meshes: [{ primitives: [
    { attributes: { POSITION: 0 }, material: 0 },
    { attributes: { POSITION: 1, TEXCOORD_0: 2 }, material: 0 },
  ] }] };
  prepareCampusMaterials(gltf);
  assert.equal(gltf.nodes[0].mesh, undefined);
  assert.equal(gltf.nodes[1].mesh, 0);
  assert.equal(gltf.meshes[0].primitives[1].material, 0);
  assert.equal(gltf.materials[0], material);
  const ground = gltf.materials[gltf.meshes[0].primitives[0].material];
  assert.equal(ground.normalTexture, undefined);
  assert.equal(ground.pbrMetallicRoughness.baseColorTexture, undefined);
  assert.deepEqual(ground.pbrMetallicRoughness.baseColorFactor, [1, 0, 0, 1]);
});

test('height grid follows west/east and north/south, including all edges', () => {
  const grid = { west: 107, east: 108, south: 21, north: 22, width: 2, height: 2 };
  const heights = new Float32Array([10, 20, 30, 40]);
  assert.equal(sampleElevation(grid, heights, 107, 22), 10);
  assert.equal(sampleElevation(grid, heights, 108, 22), 20);
  assert.equal(sampleElevation(grid, heights, 107, 21), 30);
  assert.equal(sampleElevation(grid, heights, 108, 21), 40);
  assert.equal(sampleElevation(grid, heights, 107.5, 21.5), 25);
  assert.equal(sampleElevation(grid, heights, 106, 21.5), 0);
});

test('bundled terrain is complete, finite and covers the school anchor', async () => {
  const grid = JSON.parse(await readFile(new URL('../public/terrain/vinh-thuc.json', import.meta.url), 'utf8'));
  const bytes = await readFile(new URL('../public/terrain/vinh-thuc.f32', import.meta.url));
  assert.equal(bytes.length, grid.width * grid.height * 4);
  const heights = Float32Array.from({ length: grid.width * grid.height }, (_, i) => bytes.readFloatLE(i * 4));
  assert.ok(heights.every(Number.isFinite));
  assert.ok(heights.some((height) => height > 50));
  assert.ok(SCHOOL_ANCHOR.longitude > grid.west && SCHOOL_ANCHOR.longitude < grid.east);
  assert.ok(SCHOOL_ANCHOR.latitude > grid.south && SCHOOL_ANCHOR.latitude < grid.north);
  assert.ok(sampleElevation(grid, heights, SCHOOL_ANCHOR.longitude, SCHOOL_ANCHOR.latitude) > 0);
  // Across the source-tile boundary the interpolated surface must remain continuous.
  const west = sampleElevation(grid, heights, 108 - 1e-9, 21.36);
  const east = sampleElevation(grid, heights, 108 + 1e-9, 21.36);
  assert.ok(Math.abs(west - east) < 0.01);
});
