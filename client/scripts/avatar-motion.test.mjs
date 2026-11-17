import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationMixer, Vector3, Quaternion, Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { createAvatarMotion } from '../src/player/avatarMotion.js';
import { groundAt, footGroundAt, getSpiralPose, STAIRS, TOWER } from '../src/world/lighthouse/layout.js';

// Decode the actual shipped geometry and animation. Texture rendering is a browser check.
globalThis.ProgressEvent ??= class { constructor(type, options) { Object.assign(this, { type }, options); } };
const bytes = readFileSync(new URL('../src/assets/models/tourist.glb', import.meta.url));
const jsonLength = bytes.readUInt32LE(12);
const doc = JSON.parse(bytes.subarray(20, 20 + jsonLength));
doc.buffers[0].uri = `data:application/octet-stream;base64,${bytes.subarray(28 + jsonLength).toString('base64')}`;
for (const mesh of doc.meshes) for (const primitive of mesh.primitives) delete primitive.material;
delete doc.materials; delete doc.images; delete doc.textures;
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(JSON.stringify(doc), '');

function fixture(clip = 'Walk') {
  const scene = clone(gltf.scene);
  const root = new Group(); root.add(scene);
  const motion = createAvatarMotion(scene);
  assert.ok(motion, 'The actual web avatar must have a supported skeleton and soles');
  const mixer = new AnimationMixer(scene);
  mixer.clipAction(gltf.animations.find(a => a.name === clip)).play();
  return { scene, root, motion, mixer };
}

function frame(f, options = {}) {
  const dt = options.dt ?? 1 / 60;
  f.motion.restore();
  f.mixer.update(dt);
  f.root.updateMatrixWorld(true);
  const lengths = f.motion.legs.map(l => [l.knee.position.length(), l.foot.position.length()]);
  f.motion.update({ dt, groundAt: () => 0, ...options });
  f.root.updateMatrixWorld(true);
  return lengths;
}

function soleHeight(leg, sample = () => 0) {
  const position = leg.foot.getWorldPosition(new Vector3());
  const rotation = leg.foot.getWorldQuaternion(new Quaternion());
  return Math.min(...leg.points.map(p => {
    const point = p.clone().applyQuaternion(rotation).add(position);
    return point.y - sample(point.x, point.z);
  }));
}

test('animation correction is reversible and airborne legs keep the authored pose', () => {
  const f = fixture();
  f.mixer.update(0.2);
  const original = [];
  f.scene.traverse(b => { if (b.isBone) original.push([b, b.position.clone(), b.quaternion.clone()]); });
  f.motion.update({ dt: 1/60, groundAt: () => 0.2, stairStride: 0.85 });
  f.motion.restore();
  for (const [bone, position, rotation] of original) {
    assert.ok(bone.position.distanceTo(position) < 1e-8);
    assert.deepEqual(bone.quaternion.toArray(), rotation.toArray());
  }
  f.motion.update({ dt: 1/60, groundAt: () => -10, airborne: true });
  for (const [bone, position, rotation] of original) {
    assert.ok(bone.position.distanceTo(position) < 1e-8);
    assert.deepEqual(bone.quaternion.toArray(), rotation.toArray());
  }
});

test('Idle, Walk and Run keep soles above the flat floor without changing bone lengths', () => {
  for (const clip of ['Idle', 'Walk', 'Run']) {
    const f = fixture(clip);
    let bottom = Infinity;
    for (let i = 0; i < 240; i++) {
      const lengths = frame(f, { moving: clip !== 'Idle', runWeight: clip === 'Run' ? 1 : 0 });
      for (const [j, leg] of f.motion.legs.entries()) {
        bottom = Math.min(bottom, soleHeight(leg));
        assert.ok(Math.abs(leg.knee.position.length() - lengths[j][0]) < 1e-5);
        assert.ok(Math.abs(leg.foot.position.length() - lengths[j][1]) < 1e-5);
        assert.ok(Number.isFinite(leg.foot.matrixWorld.determinant()));
      }
    }
    assert.ok(bottom > -0.015, `${clip}: sole reached ${bottom.toFixed(3)} m`);
  }
});

test('both feet alternate on human-scale hill stairs in both directions', () => {
  for (const fps of [20, 30, 60]) {
  for (const direction of [-1, 1]) {
    const f = fixture(); f.root.rotation.y = direction < 0 ? Math.PI : 0;
    f.root.position.set(4, groundAt(4, 25), 25);
    const starts = [0, 0]; let worst = 0; let previous = [1, 1]; let diagnostic;
    for (let i = 0; i < 8 * fps; i++) {
      f.root.position.z += direction * STAIRS.speed / fps;
      const y = groundAt(4, f.root.position.z);
      f.root.position.y += (y - f.root.position.y) * (1 - Math.exp(-23 / fps));
      frame(f, { dt: 1/fps, groundAt: footGroundAt, stairStride: STAIRS.stride, moving: true });
      for (const [j, leg] of f.motion.legs.entries()) {
        if (leg.phase < previous[j]) starts[j]++;
        previous[j] = leg.phase;
        const clearance = soleHeight(leg, footGroundAt);
        if (clearance < worst) {
          worst = clearance;
          diagnostic = { i, direction, leg: j, phase: leg.phase, root: f.root.position.toArray(), hip: leg.thigh.getWorldPosition(new Vector3()).toArray(), ankle: leg.foot.getWorldPosition(new Vector3()).toArray(), targets: f.motion.legs.map(l => ({target:l.target.toArray(),phase:l.phase,offset:l.offset.toArray()})) };
        }
      }
    }
    assert.ok(starts.every(n => n > 3), `Both feet must step: ${starts}`);
    assert.ok(worst > -0.035, `${fps} FPS: sole penetrated ${worst.toFixed(3)} m: ${JSON.stringify(diagnostic)}`);
  }
  }
});

test('running brings elbows inward while preserving head and glasses animation', () => {
  const f = fixture('Run'); let before = 0; let after = 0;
  const elbowWidth = () => ['Left','Right'].reduce((sum,side) => {
    const arm = f.scene.getObjectByName(`${side}Arm`).getWorldPosition(new Vector3());
    const elbow = f.scene.getObjectByName(`${side}ForeArm`).getWorldPosition(new Vector3());
    return sum + Math.abs(elbow.x - arm.x);
  }, 0);
  for (let i=0;i<40;i++) {
    f.motion.restore(); f.mixer.update(1/60); f.root.updateMatrixWorld(true);
    before += elbowWidth();
    const head = f.scene.getObjectByName('Head'); const rotation = head.quaternion.toArray();
    f.motion.update({ dt:1/60, groundAt:()=>0, runWeight:1 });
    after += elbowWidth();
    assert.deepEqual(head.quaternion.toArray(), rotation);
  }
  assert.ok(after < before * 0.8, `Elbow spread ${before} -> ${after}`);
});

test('foot probes use visible stair tops including overlaps and the seven entrance steps', () => {
  const edge=STAIRS.z0+(STAIRS.going+STAIRS.overlap)/2;
  assert.ok(Math.abs(footGroundAt(4,edge-.003)-STAIRS.yTop)<1e-8,'The higher tread owns the overlap');
  assert.ok(Math.abs(footGroundAt(4,edge+.003)-(STAIRS.yTop-STAIRS.rise))<1e-8);
  for (let i=0;i<7;i++) assert.ok(Math.abs(footGroundAt(4.25,5.55-i*.24)-(i+1)*.15)<1e-8);
});

test('spiral foot samples stay on the correct turn and match each rendered tread', () => {
  for (let i = 0; i < TOWER.spiralSteps; i++) {
    const t = (i + 0.5) / TOWER.spiralSteps;
    const p = getSpiralPose(t);
    assert.ok(Math.abs(footGroundAt(p.x, p.z, 'spiral', t) - p.y) < 1e-8);
  }
  const f = fixture();
  let worst = 0;
  for (let i = 0; i < 240; i++) {
    const t = 0.4 + i * 0.03 / 60; const p = getSpiralPose(t);
    f.root.position.set(p.x, p.y, p.z); f.root.rotation.y = p.yawUp;
    const sample = (x,z) => footGroundAt(x,z,'spiral',t);
    frame(f, { groundAt: sample, stairStride: 0.32, moving: true });
    for (const leg of f.motion.legs) worst = Math.min(worst, soleHeight(leg, sample));
  }
  assert.ok(worst > -0.035, `Spiral sole penetrated ${worst.toFixed(3)} m`);
});

test('teleport resets planted feet instead of dragging them from the old location', () => {
  const f = fixture();
  frame(f, { stairStride: 0.85 });
  f.root.position.set(20, 5, 20);
  frame(f, { stairStride: 0.85, groundAt: () => 5 });
  for (const leg of f.motion.legs) {
    assert.ok(leg.target.distanceTo(f.root.position) < 0.5);
    assert.ok(soleHeight(leg, () => 5) > -0.02);
  }
});
