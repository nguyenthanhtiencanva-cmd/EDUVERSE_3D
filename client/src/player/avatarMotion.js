import { MathUtils, Quaternion, Vector3 } from 'three';

const UP = new Vector3(0, 1, 0);
const clamp = MathUtils.clamp;

// Rotate a bone in world space without changing bone lengths or the bind pose.
function aim(bone, child, target, scratch) {
  const { a, b, c, q, parentQ } = scratch;
  bone.getWorldPosition(a);
  child.getWorldPosition(b).sub(a).normalize();
  c.copy(target).sub(a).normalize();
  q.setFromUnitVectors(b, c);
  bone.getWorldQuaternion(parentQ);
  q.multiply(parentQ);
  bone.parent.getWorldQuaternion(parentQ).invert();
  bone.quaternion.copy(parentQ.multiply(q));
  bone.updateWorldMatrix(false, true);
}

export function solveLeg(leg, target, pole, scratch) {
  const { hip, knee, ankle, direction, bend, kneeTarget } = scratch;
  leg.thigh.getWorldPosition(hip);
  leg.knee.getWorldPosition(knee);
  leg.foot.getWorldPosition(ankle);
  const upper = hip.distanceTo(knee);
  const lower = knee.distanceTo(ankle);
  direction.copy(target).sub(hip);
  const distance = clamp(direction.length(), Math.abs(upper - lower) + 0.001, upper + lower - 0.002);
  direction.normalize();
  bend.copy(pole).addScaledVector(direction, -pole.dot(direction));
  if (bend.lengthSq() < 1e-6) bend.set(1, 0, 0).addScaledVector(direction, -direction.x);
  bend.normalize();
  const along = (upper * upper + distance * distance - lower * lower) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  kneeTarget.copy(hip).addScaledVector(direction, along).addScaledVector(bend, height);
  aim(leg.thigh, leg.knee, kneeTarget, scratch);
  // Clamp unreachable targets instead of stretching the mesh at a cliff/teleport.
  ankle.copy(hip).addScaledVector(direction, distance);
  aim(leg.knee, leg.foot, ankle, scratch);
}

function makeScratch() {
  return Object.fromEntries([
    ...['a', 'b', 'c', 'hip', 'knee', 'ankle', 'direction', 'bend', 'kneeTarget'].map(k => [k, new Vector3()]),
    ...['q', 'parentQ'].map(k => [k, new Quaternion()]),
  ]);
}

/** Layer over the GLB animations. Restore BEFORE the mixer, update AFTER movement.
 * Only calibration scans vertices; the frame loop samples a few sole points.
 * Stairs use alternating planted feet. Flat ground keeps the authored gait.
 */
export function createAvatarMotion(scene) {
  scene.updateWorldMatrix(true, true);
  const hips = scene.getObjectByName('Hips');
  const sides = ['Left', 'Right'];
  const legs = sides.map((side) => ({
    thigh: scene.getObjectByName(`${side}UpLeg`),
    knee: scene.getObjectByName(`${side}Leg`),
    foot: scene.getObjectByName(`${side}Foot`),
    toe: scene.getObjectByName(`${side}ToeBase`),
    points: [],
    target: new Vector3(),
    animated: new Vector3(),
    anchor: new Vector3(),
    start: new Vector3(),
    end: new Vector3(),
    rotation: new Quaternion(),
    restRotation: new Quaternion(),
    restToe: new Quaternion(),
    offset: new Vector3(),
    phase: 1,
  }));
  if (!hips || legs.some(l => !l.thigh || !l.knee || !l.foot || !l.toe)) return null;
  const rootQ = scene.getWorldQuaternion(new Quaternion());
  const point = new Vector3();
  // Pick sole vertices from the real, skinned model (including quantized GLBs).
  for (const [index, leg] of legs.entries()) {
    const candidates = [];
    leg.foot.getWorldQuaternion(leg.restRotation).premultiply(rootQ.clone().invert());
    leg.restToe.copy(leg.toe.quaternion);
    leg.foot.getWorldPosition(point);
    leg.offset.copy(scene.worldToLocal(point.clone()));
    leg.offset.x = clamp(leg.offset.x, index === 0 ? 0.07 : -0.18, index === 0 ? 0.18 : -0.07);
    leg.offset.y = 0;
    scene.traverse((mesh) => {
      if (!mesh.isSkinnedMesh) return;
      mesh.skeleton.update();
      const footIndex = mesh.skeleton.bones.indexOf(leg.foot);
      const toeIndex = mesh.skeleton.bones.indexOf(leg.toe);
      if (footIndex < 0) return;
      const { skinIndex, skinWeight, position } = mesh.geometry.attributes;
      for (let v = 0; v < position.count; v++) {
        let weight = 0;
        for (let j = 0; j < 4; j++) {
          const joint = skinIndex.getComponent(v, j);
          if (joint === footIndex || joint === toeIndex) weight += skinWeight.getComponent(v, j);
        }
        if (weight < 0.5) continue;
        mesh.getVertexPosition(v, point).applyMatrix4(mesh.matrixWorld);
        candidates.push(point.clone());
      }
    });
    if (!candidates.length) return null;
    const bottom = Math.min(...candidates.map(p => p.y));
    const sole = candidates.filter(p => p.y < bottom + 0.012);
    // Four extremities cover toe, heel and both edges, without per-frame mesh scans.
    for (const axis of ['x', 'z']) {
      sole.sort((a, b) => a[axis] - b[axis]);
      const scale = leg.foot.getWorldScale(new Vector3());
      leg.points.push(leg.foot.worldToLocal(sole[0].clone()).multiply(scale));
      leg.points.push(leg.foot.worldToLocal(sole.at(-1).clone()).multiply(scale));
    }
  }
  const arms = sides.map(s => [scene.getObjectByName(`${s}Arm`), scene.getObjectByName(`${s}ForeArm`)]);
  const modified = [hips, ...legs.flatMap(l => [l.thigh, l.knee, l.foot, l.toe]), ...arms.map(a => a[0])].filter(Boolean);
  const saved = modified.map(bone => ({ bone, position: new Vector3(), quaternion: new Quaternion() }));
  const scratch = makeScratch();
  const root = new Vector3();
  const previous = new Vector3();
  const velocity = new Vector3();
  const forward = new Vector3();
  const nominal = new Vector3();
  const worldPoint = new Vector3();
  const inverseQ = new Quaternion();
  const pelvisHorizontal = new Vector3();
  let applied = false;
  let initialized = false;
  let onStairs = false;
  let pelvisOffset = 0;

  function restore() {
    if (!applied) return;
    saved.forEach(({ bone, position, quaternion }) => {
      bone.position.copy(position);
      bone.quaternion.copy(quaternion);
    });
    applied = false;
  }

  // Height of an ankle whose entire sole clears the sampled treads.
  function ankleHeight(leg, position, rotation, groundAt) {
    let height = -Infinity;
    for (const p of leg.points) {
      worldPoint.copy(p).applyQuaternion(rotation);
      const ground = groundAt(position.x + worldPoint.x, position.z + worldPoint.z);
      if (Number.isFinite(ground)) height = Math.max(height, ground - worldPoint.y);
    }
    return Number.isFinite(height) ? height + 0.004 : null;
  }

  return {
    legs,
    restore,
    reset() { restore(); initialized = false; onStairs = false; pelvisOffset = 0; pelvisHorizontal.set(0, 0, 0); },
    update({ dt, groundAt, stairStride = null, airborne = false, moving = false, runWeight = 0 }) {
      restore();
      scene.updateWorldMatrix(true, true);
      scene.getWorldPosition(root);
      scene.getWorldQuaternion(rootQ);
      inverseQ.copy(rootQ).invert();
      const teleported = !initialized || previous.distanceTo(root) > 1.5;
      velocity.copy(root).sub(previous); velocity.y = 0;
      if (teleported) velocity.set(0, 0, 0);
      previous.copy(root); initialized = true;
      const speed = velocity.length() / Math.max(dt, 0.001);
      forward.set(0, 0, 1).applyQuaternion(rootQ);
      if (velocity.lengthSq() > 1e-8) velocity.normalize(); else velocity.copy(forward);
      saved.forEach(({ bone, position, quaternion }) => {
        position.copy(bone.position); quaternion.copy(bone.quaternion);
      });
      applied = true;

      // Bring the running elbows closer to the torso, preserving the arm swing.
      if (runWeight > 0.001) for (const [arm, elbow] of arms) {
        if (!arm || !elbow) continue;
        arm.getWorldPosition(scratch.hip);
        elbow.getWorldPosition(scratch.ankle);
        scratch.direction.copy(scratch.ankle).sub(scratch.hip).applyQuaternion(inverseQ);
        const length = scratch.direction.length();
        scratch.direction.x *= 0.5;
        scratch.direction.y = Math.min(scratch.direction.y, -length * 0.45);
        scratch.direction.normalize().multiplyScalar(length).applyQuaternion(rootQ).add(scratch.hip);
        scratch.direction.lerp(scratch.ankle, 1 - clamp(runWeight, 0, 1));
        aim(arm, elbow, scratch.direction, scratch);
      }
      if (airborne) { onStairs = false; pelvisOffset = 0; pelvisHorizontal.set(0, 0, 0); return; }

      const stairs = Number.isFinite(stairStride) && stairStride > 0;
      let swinging = stairs && onStairs && !teleported && legs.some(l => l.phase < 1);
      for (const leg of legs) {
        leg.foot.getWorldPosition(leg.animated);
        leg.foot.getWorldQuaternion(leg.rotation);
        let soleY = Infinity;
        for (const p of leg.points) soleY = Math.min(soleY, worldPoint.copy(p).applyQuaternion(leg.rotation).add(leg.animated).y);
        const clearance = Math.max(0, soleY - root.y - 0.02);
        const flat = scratch.q.copy(rootQ).multiply(leg.restRotation);
        leg.rotation.slerp(flat, stairs ? 1 : 1 - clamp(clearance / 0.1, 0, 1));
        leg.toe.quaternion.slerp(leg.restToe, stairs ? 1 : 1 - clamp(clearance / 0.1, 0, 1));
        leg.target.copy(leg.animated);

        if (stairs) {
          nominal.copy(leg.offset).applyQuaternion(rootQ).add(root);
          if (!onStairs || teleported) {
            leg.anchor.copy(nominal);
            leg.anchor.y = ankleHeight(leg, leg.anchor, leg.rotation, groundAt) ?? leg.animated.y;
            leg.phase = 1;
          }
          const distance = Math.hypot(nominal.x - leg.anchor.x, nominal.z - leg.anchor.z);
          if (leg.phase === 1 && !swinging && distance > (moving ? stairStride * 0.28 : 0.22)) {
            leg.start.copy(leg.anchor);
            leg.end.copy(nominal).addScaledVector(velocity, stairStride * 0.45);
            leg.end.y = ankleHeight(leg, leg.end, leg.rotation, groundAt) ?? leg.start.y;
            leg.duration = clamp(stairStride * 0.48 / Math.max(speed, 0.5), 0.2, 0.42);
            leg.phase = 0;
            swinging = true;
          }
          if (leg.phase < 1) {
            leg.phase = Math.min(1, leg.phase + dt / leg.duration);
            const t = leg.phase;
            const eased = t * t * (3 - 2 * t);
            leg.anchor.lerpVectors(leg.start, leg.end, eased);
            // Clear the riser early; descend onto the tread at the end of the step.
            const rise = Math.max(0, leg.end.y - leg.start.y);
            const lift = 0.10 + rise * 0.65;
            leg.anchor.y += Math.sin(Math.PI * t) * lift;
          }
          leg.target.copy(leg.anchor);
          const floor = ankleHeight(leg, leg.target, leg.rotation, groundAt);
          if (floor !== null) leg.target.y = Math.max(leg.target.y, floor);
        } else {
          const floor = ankleHeight(leg, leg.target, leg.rotation, groundAt);
          if (floor !== null) leg.target.y = floor + clearance;
        }
      }
      onStairs = stairs;
      // Centre the hips between the supporting feet while the body crosses a
      // high riser; otherwise the trailing leg is pulled beyond its reach.
      hips.getWorldPosition(point);
      nominal.copy(legs[0].target).add(legs[1].target).multiplyScalar(0.5).sub(point);
      nominal.y = 0;
      if (!stairs) nominal.set(0, 0, 0);
      nominal.clampLength(0, 0.3);
      pelvisHorizontal.lerp(nominal, teleported ? 1 : 1 - Math.exp(-18 * dt));
      point.add(pelvisHorizontal);
      hips.position.copy(hips.parent.worldToLocal(point));
      scene.updateWorldMatrix(true, true);
      // Keep both planted targets within reach, including the unusually tall hill
      // treads. A root-height transition must not pull a shoe through the riser.
      let reachLimit = Infinity;
      for (const leg of legs) {
        leg.thigh.getWorldPosition(scratch.hip);
        leg.knee.getWorldPosition(scratch.knee);
        leg.foot.getWorldPosition(scratch.ankle);
        const reach = scratch.hip.distanceTo(scratch.knee) + scratch.knee.distanceTo(scratch.ankle) - 0.012;
        const horizontal = Math.hypot(leg.target.x - scratch.hip.x, leg.target.z - scratch.hip.z);
        const vertical = Math.sqrt(Math.max(0, reach * reach - horizontal * horizontal));
        reachLimit = Math.min(reachLimit, leg.target.y + vertical - scratch.hip.y);
      }
      const desiredPelvis = clamp(Math.min(reachLimit, ...legs.map(l => l.target.y - l.animated.y)), -0.6, 0.22);
      pelvisOffset = MathUtils.lerp(pelvisOffset, desiredPelvis, teleported ? 1 : 1 - Math.exp(-16 * dt));
      pelvisOffset = Math.min(pelvisOffset, Math.max(-0.6, reachLimit));
      hips.getWorldPosition(point).addScaledVector(UP, pelvisOffset);
      hips.position.copy(hips.parent.worldToLocal(point));
      scene.updateWorldMatrix(true, true);
      for (const leg of legs) {
        solveLeg(leg, leg.target, forward, scratch);
        leg.foot.parent.getWorldQuaternion(scratch.parentQ).invert();
        leg.foot.quaternion.copy(scratch.parentQ.multiply(leg.rotation));
        leg.foot.updateWorldMatrix(false, true);
      }
    },
  };
}
