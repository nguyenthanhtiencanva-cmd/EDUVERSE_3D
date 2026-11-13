import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

const BUILDINGS = [
  [9, 22, 0, 14], [-14, 16, -26, -16], [-27, -15, -8, 16],
  [12, 26, 18, 28], [-10, 6, 26, 29],
];
const CAMERA_BOXES = BUILDINGS.map(([left, right, near, far]) =>
  new THREE.Box3(new THREE.Vector3(left, 0, near), new THREE.Vector3(right, 10, far)));
const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'Space',
]);

function canWalk(x, z) {
  const radius = 0.45;
  return Math.abs(x) <= 28 && Math.abs(z) <= 28 && !BUILDINGS.some(([left, right, near, far]) =>
    x + radius > left && x - radius < right && z + radius > near && z - radius < far);
}

export function CharacterController({ tourist = true }) {
  const group = useRef(null);
  const { camera, gl } = useThree();
  const { scene, animations } = useGLTF(tourist ? '/models/tourist_meshy.glb' : '/models/student_character.glb');
  const { actions } = useAnimations(animations, group);
  const walking = useStore((state) => state.cameraMode === 'fps');
  const player = useRef({
    position: new THREE.Vector3(1.5, 0, 6), facing: Math.PI,
    yaw: tourist ? Math.PI : 0, pitch: 0.28, distance: 4.2,
    keys: new Set(), pointer: null, jumpPressed: false, jumpHeld: false,
    lift: 0, clip: '', snap: true, positionTimer: 0,
  }).current;
  const scratch = useMemo(() => ({
    target: new THREE.Vector3(), eye: new THREE.Vector3(), direction: new THREE.Vector3(),
    intersection: new THREE.Vector3(), ray: new THREE.Ray(),
  }), []);

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [scene]);

  useEffect(() => () => {
    Object.values(actions).forEach((action) => action?.stop());
    player.clip = '';
  }, [actions, player]);

  useEffect(() => {
    if (!walking) return;
    const canvas = gl.domElement;
    player.snap = true;
    const previousTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';
    const reset = () => {
      player.keys.clear();
      player.jumpPressed = false;
      player.jumpHeld = false;
      const pointer = player.pointer;
      player.pointer = null;
      if (pointer && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
    };
    const keyDown = (event) => {
      if (!MOVE_KEYS.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest('button, input, select, textarea, [contenteditable]')) return;
      if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();
      player.keys.add(event.code);
      if (event.code === 'Space' && !event.repeat) player.jumpPressed = true;
    };
    const keyUp = (event) => player.keys.delete(event.code);
    const pointerDown = (event) => {
      if (player.pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
      player.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event) => {
      const pointer = player.pointer;
      if (pointer?.id !== event.pointerId) return;
      player.yaw -= (event.clientX - pointer.x) * 0.006;
      player.pitch = THREE.MathUtils.clamp(player.pitch + (event.clientY - pointer.y) * 0.005, 0.05, 1.2);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const pointerEnd = (event) => {
      if (player.pointer?.id === event.pointerId) player.pointer = null;
    };
    const zoom = (event) => {
      player.distance = THREE.MathUtils.clamp(player.distance + event.deltaY * 0.005, 1.8, 8);
    };
    const events = [
      [window, 'keydown', keyDown], [window, 'keyup', keyUp], [window, 'blur', reset],
      [canvas, 'pointerdown', pointerDown], [canvas, 'pointermove', pointerMove],
      [canvas, 'pointerup', pointerEnd], [canvas, 'pointercancel', pointerEnd],
      [canvas, 'lostpointercapture', pointerEnd], [canvas, 'wheel', zoom],
    ];
    events.forEach(([target, name, handler]) => target.addEventListener(name, handler));
    return () => {
      events.forEach(([target, name, handler]) => target.removeEventListener(name, handler));
      canvas.style.touchAction = previousTouchAction;
      reset();
    };
  }, [walking, gl, player]);

  useFrame((_, elapsed) => {
    if (!group.current) return;
    const dt = Math.min(elapsed, 0.05);
    const { position, keys } = player;
    let clip = 'Idle';

    if (walking) {
      const { joystickInput, setPlayerPosition } = useStore.getState();
      const axis = (positive, alternate, negative, other) =>
        Number(keys.has(positive) || keys.has(alternate)) - Number(keys.has(negative) || keys.has(other));
      const forward = axis('KeyW', 'ArrowUp', 'KeyS', 'ArrowDown') + joystickInput.moveY;
      const right = axis('KeyD', 'ArrowRight', 'KeyA', 'ArrowLeft') + joystickInput.moveX;
      const magnitude = Math.hypot(forward, right);

      if (magnitude > 0.12) {
        const yaw = player.yaw + Math.atan2(-right, forward);
        const running = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(joystickInput.moveX, joystickInput.moveY) > 0.92;
        const speed = tourist ? (running ? 5.2 : 2.6) : (running ? 7.2 : 3.8);
        const distance = speed * Math.min(magnitude, 1) * dt;
        const x = position.x + Math.sin(yaw) * distance;
        const z = position.z + Math.cos(yaw) * distance;
        const moved = (canWalk(x, position.z) && x !== position.x) || (canWalk(position.x, z) && z !== position.z);
        if (canWalk(x, position.z)) position.x = x;
        if (canWalk(position.x, z)) position.z = z;
        if (moved) clip = running ? 'Run' : 'Walk';
        const targetFacing = tourist ? yaw : yaw + Math.PI;
        const rotation = targetFacing - player.facing;
        player.facing += Math.atan2(Math.sin(rotation), Math.cos(rotation)) * (1 - Math.exp(-14 * dt));
      }

      const touchJump = joystickInput.isJumping && !player.jumpHeld;
      if ((player.jumpPressed || touchJump) && position.y === 0) player.lift = 5.5;
      player.jumpPressed = false;
      player.jumpHeld = joystickInput.isJumping;
      if (player.lift || position.y > 0) {
        position.y = Math.max(0, position.y + player.lift * dt);
        player.lift = position.y > 0 ? player.lift - 18 * dt : 0;
      }

      const { target, eye, direction, ray, intersection } = scratch;
      target.copy(position);
      target.y += 1.25;
      direction.set(
        -Math.sin(player.yaw) * Math.cos(player.pitch),
        Math.sin(player.pitch),
        -Math.cos(player.yaw) * Math.cos(player.pitch),
      );
      ray.set(target, direction);
      let distance = player.distance;
      for (const box of CAMERA_BOXES) {
        if (!box.containsPoint(target) && ray.intersectBox(box, intersection)) {
          distance = Math.min(distance, Math.max(0.8, target.distanceTo(intersection) - 0.25));
        }
      }
      eye.copy(target).addScaledVector(direction, distance);
      if (player.snap || distance < player.distance) camera.position.copy(eye);
      else camera.position.lerp(eye, 1 - Math.exp(-10 * dt));
      player.snap = false;
      camera.lookAt(target);

      player.positionTimer += dt;
      if (player.positionTimer >= 0.08) {
        player.positionTimer = 0;
        const previous = useStore.getState().playerPosition;
        if (previous[0] !== position.x || previous[1] !== position.y + 1.4 || previous[2] !== position.z) {
          setPlayerPosition([position.x, position.y + 1.4, position.z]);
        }
      }
    }

    if (clip !== player.clip && actions[clip]) {
      actions[player.clip]?.fadeOut(0.18);
      actions[clip].reset().fadeIn(0.18).play();
      player.clip = clip;
    }
    group.current.position.copy(position);
    group.current.rotation.y = player.facing;
  });

  return <group ref={group} name={tourist ? 'Vinh_Thuc_Tourist' : 'Student_Character'}>
    <primitive object={scene} />
  </group>;
}
