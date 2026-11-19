import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  INTERACTABLES,
  findNearbyInteraction,
  getInteractablesForScope,
} from '../src/player/interactions.js';
import { firstPersonHeading, stepSpeed } from '../src/player/thirdPersonMovement.js';
import { LIGHTHOUSE_WORLD, TOWER, getSpiralPose } from '../src/world/lighthouse/layout.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

test('firstPersonHeading steers directly relative to camera view', () => {
  assert.equal(firstPersonHeading(0, 0, 0), null);
  assert.ok(Math.abs(firstPersonHeading(1.2, 1, 0) - 1.2) < 1e-6);
  assert.ok(Math.abs(Math.abs(firstPersonHeading(0, -1, 0)) - Math.PI) < 1e-6);
  assert.ok(Math.abs(firstPersonHeading(0, 0, 1) - -Math.PI / 2) < 1e-6);
  assert.ok(Math.abs(firstPersonHeading(0, 0, -1) - Math.PI / 2) < 1e-6);
});

test('stepSpeed smoothly accelerates and decelerates without overshooting', () => {
  const accel = stepSpeed(0, 5.2, 0.016);
  assert.ok(accel > 0 && accel < 5.2);
  const decel = stepSpeed(5.2, 0, 0.016);
  assert.ok(decel < 5.2 && decel > 0);
  assert.equal(stepSpeed(2.59, 2.6, 0.016), 2.6);
});

test('lighthouse spawn immediately finds the hill-stairs intro board and ignores orbit mode', () => {
  const [x, y, z] = LIGHTHOUSE_WORLD.spawn.position;
  const near = findNearbyInteraction({
    worldScope: 'lighthouse',
    cameraMode: 'fps',
    lighthouseLevel: 'ground',
    playerPosition: [x, y + 1.4, z],
  });
  assert.equal(near?.id, 'lh-board-stairs');
  assert.equal(near?.kind, 'board');

  const orbitNear = findNearbyInteraction({
    worldScope: 'lighthouse',
    cameraMode: 'orbit',
    lighthouseLevel: 'ground',
    playerPosition: [x, y + 1.4, z],
  });
  assert.equal(orbitNear, null);
});

test('lighthouse spiral door prioritizes stairs interaction on ground and balcony', () => {
  const groundDoor = getSpiralPose(0);
  const up = findNearbyInteraction({
    worldScope: 'lighthouse',
    cameraMode: 'fps',
    lighthouseLevel: 'ground',
    playerPosition: [groundDoor.x, groundDoor.y + 1.4, groundDoor.z],
  });
  assert.equal(up?.kind, 'stairs');

  const balconyDoor = getSpiralPose(1);
  const down = findNearbyInteraction({
    worldScope: 'lighthouse',
    cameraMode: 'fps',
    lighthouseLevel: 'balcony',
    playerPosition: [balconyDoor.x, balconyDoor.y + 1.4, balconyDoor.z],
  });
  assert.equal(down?.kind, 'stairs');

  // Standing at balcony viewpoint away from spiral door finds balcony board
  const viewSpot = findNearbyInteraction({
    worldScope: 'lighthouse',
    cameraMode: 'fps',
    lighthouseLevel: 'balcony',
    playerPosition: [TOWER.x, TOWER.balconyY + 1.4, TOWER.z + 1.55],
  });
  assert.equal(viewSpot?.id, 'lh-board-balcony');
});

test('vangia and campus interactables match NPCs/boards and reference real public images', () => {
  const vgVendor = findNearbyInteraction({
    worldScope: 'vangia',
    cameraMode: 'fps',
    playerPosition: [-49.0, 1.4, -4.1],
  });
  assert.equal(vgVendor?.id, 'vg-npc-vendor');
  assert.equal(vgVendor?.kind, 'npc');

  const cpPlay = findNearbyInteraction({
    worldScope: 'campus',
    cameraMode: 'fps',
    playerPosition: [-1.0, 1.4, 5.2],
  });
  assert.equal(cpPlay?.id, 'cp-board-playground');
  assert.equal(cpPlay?.kind, 'board');

  // Verify every scene has interactables and every referenced image file exists on disk
  for (const scope of ['lighthouse', 'vangia', 'campus']) {
    const items = INTERACTABLES[scope];
    assert.ok(items.length >= 4, `${scope} should have at least 4 interactables`);
    for (const item of items) {
      assert.ok(item.image?.startsWith('/images/'), `${item.id} must have a /images/ path`);
      const diskPath = path.join(ROOT, 'public', item.image);
      assert.ok(fs.existsSync(diskPath), `Missing image asset for ${item.id}: ${diskPath}`);
    }
  }
  assert.ok(getInteractablesForScope('lighthouse', 'balcony').every((i) => i.level === 'balcony'));
});
