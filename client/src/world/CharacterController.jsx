import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { LIGHTHOUSE_WORLD, advanceLighthousePlayer, getSpiralPose } from './lighthouse/layout';
import { MODEL_URLS } from './models';
import { campusCameraDistance, campusCanWalk, campusGroundAt } from './campusCollision';

const MOVE_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'ShiftLeft',
  'ShiftRight',
  'Space',
  'KeyE',
]);

export function CharacterController({ tourist = true }) {
  const group = useRef(null);
  const { camera, gl } = useThree();
  const { scene, animations } = useGLTF(tourist ? MODEL_URLS.tourist : MODEL_URLS.student);
  const { actions } = useAnimations(animations, group);
  const walking = useStore((state) => state.cameraMode === 'fps');
  const playerTeleport = useStore((state) => state.playerTeleport);

  const initSpawn =
    useStore.getState().worldScope === 'lighthouse'
      ? LIGHTHOUSE_WORLD.spawn.position
      : [1.5, 0, 6];

  const player = useRef({
    position: new THREE.Vector3(...initSpawn),
    facing: Math.PI,
    yaw: tourist ? Math.PI : 0,
    pitch: 0.24,
    distance: 4.0,
    keys: new Set(),
    pointer: null,
    jumpPressed: false,
    jumpHeld: false,
    lift: 0,
    jumpHeight: 0,
    cameraRadius: 4.0,
    clip: '',
    snap: true,
    positionTimer: 0,
  }).current;

  const scratch = useMemo(
    () => ({
      target: new THREE.Vector3(),
      eye: new THREE.Vector3(),
      direction: new THREE.Vector3(),
    }),
    [],
  );

  // Handle teleport requests
  useEffect(() => {
    if (!playerTeleport) return;
    const [tx, ty, tz] = playerTeleport.position;
    player.position.set(tx, ty, tz);
    if (typeof playerTeleport.yaw === 'number') {
      player.yaw = playerTeleport.yaw;
      player.facing = tourist ? playerTeleport.yaw : playerTeleport.yaw + Math.PI;
    }
    player.lift = 0;
    player.jumpHeight = 0;
    player.snap = true;
    if (group.current) {
      group.current.position.copy(player.position);
      group.current.rotation.y = player.facing;
    }
    useStore.getState().setPlayerPosition([tx, ty + 1.4, tz], true);
  }, [playerTeleport, player, tourist]);

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [scene]);

  useEffect(
    () => () => {
      Object.values(actions).forEach((action) => action?.stop());
      player.clip = '';
    },
    [actions, player],
  );

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
      if (
        event.target instanceof HTMLElement &&
        (event.target.closest('input, select, textarea, [contenteditable]') ||
          (event.target.closest('button') &&
            (event.code === 'Space' || useStore.getState().worldScope !== 'lighthouse')))
      )
        return;
      if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();
      if (event.code === 'KeyE' && !event.repeat && useStore.getState().worldScope === 'lighthouse') {
        const st = useStore.getState();
        st.climbLighthouse(st.lighthouseLevel === 'balcony' ? 'ground' : 'balcony');
        return;
      }
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
      player.pitch = THREE.MathUtils.clamp(
        player.pitch + (event.clientY - pointer.y) * 0.005,
        -0.25,
        1.2,
      );
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
      [window, 'keydown', keyDown],
      [window, 'keyup', keyUp],
      [window, 'blur', reset],
      [canvas, 'pointerdown', pointerDown],
      [canvas, 'pointermove', pointerMove],
      [canvas, 'pointerup', pointerEnd],
      [canvas, 'pointercancel', pointerEnd],
      [canvas, 'lostpointercapture', pointerEnd],
      [canvas, 'wheel', zoom],
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

    const state = useStore.getState();
    const isLighthouse = state.worldScope === 'lighthouse';
    const level = state.lighthouseLevel || 'ground';
    const checkWalk = (x, z) => campusCanWalk(position, x, z);
    const getGroundY = (x, z) =>
      isLighthouse
        ? LIGHTHOUSE_WORLD.groundAt(x, z, level, state.spiralProgress)
        : campusGroundAt(x, position.y, z) ?? position.y;

    if (walking) {
      const { joystickInput, setPlayerPosition } = state;
      const axis = (positive, alternate, negative, other) =>
        Number(keys.has(positive) || keys.has(alternate)) -
        Number(keys.has(negative) || keys.has(other));
      const forward = axis('KeyW', 'ArrowUp', 'KeyS', 'ArrowDown') + joystickInput.moveY;
      const right = axis('KeyD', 'ArrowRight', 'KeyA', 'ArrowLeft') + joystickInput.moveX;
      const magnitude = Math.hypot(forward, right);
      const running =
        keys.has('ShiftLeft') ||
        keys.has('ShiftRight') ||
        (isLighthouse
          ? joystickInput.isRunning
          : Math.hypot(joystickInput.moveX, joystickInput.moveY) > 0.92);

      // Cầu thang xoắn trong tháp.
      if (isLighthouse && level === 'spiral') {
        let dir = 0;
        if (state.autoClimb === 'up') dir = 1;
        else if (state.autoClimb === 'down') dir = -1;
        else if (Math.abs(forward) > 0.12) dir = forward > 0 ? 1 : -1;

        if (dir !== 0) {
          const climbSpeed = state.autoClimb || running ? 0.21 : 0.14;
          const climbDelta = state.autoClimb ? Math.min(elapsed, 0.25) : dt;
          const nextT = state.spiralProgress + dir * climbSpeed * climbDelta;
          clip = running || state.autoClimb ? 'Run' : 'Walk';

          if (nextT >= 1.0) {
            state.finishSpiralClimb('balcony');
          } else if (nextT <= 0.0) {
            state.finishSpiralClimb('ground');
          } else {
            state.setSpiralState({ spiralProgress: nextT });
            const pose = getSpiralPose(nextT);
            position.set(pose.x, pose.y, pose.z);
            const moveYaw = dir > 0 ? pose.yawUp : pose.yawUp + Math.PI;
            player.facing = tourist ? moveYaw : moveYaw + Math.PI;
            if (!player.pointer) {
              const camDiff = moveYaw - player.yaw;
              player.yaw += Math.atan2(Math.sin(camDiff), Math.cos(camDiff)) * (1 - Math.exp(-8 * dt));
            }
          }
        }
      } else if (isLighthouse) {
        const walkDelta = Math.min(elapsed, 0.12);
        if (magnitude > 0.12) {
          const yaw = player.yaw + Math.atan2(-right, forward);
          const speed = level === 'balcony' ? 1.85 : running ? 4.8 : 2.8;
          const strength = (Math.min(magnitude, 1) - 0.12) / 0.88;
          const distance = speed * strength * walkDelta;
          const previousX = position.x;
          const previousZ = position.z;
          advanceLighthousePlayer(position, Math.sin(yaw) * distance, Math.cos(yaw) * distance, level);
          const movedX = position.x - previousX;
          const movedZ = position.z - previousZ;
          if (Math.hypot(movedX, movedZ) > 0.001) {
            clip = running && level !== 'balcony' ? 'Run' : 'Walk';
            const heading = Math.atan2(movedX, movedZ) + (tourist ? 0 : Math.PI) - player.facing;
            player.facing += Math.atan2(Math.sin(heading), Math.cos(heading)) * (1 - Math.exp(-16 * walkDelta));
          }
        }

        const groundY = getGroundY(position.x, position.z);
        const previousBase = position.y - player.jumpHeight;
        if ((player.jumpPressed || (joystickInput.isJumping && !player.jumpHeld)) && player.jumpHeight === 0) {
          player.lift = 5.5;
        }
        player.jumpHeld = joystickInput.isJumping;
        player.jumpPressed = false;
        if (player.lift !== 0 || player.jumpHeight > 0) {
          player.jumpHeight = Math.max(0, player.jumpHeight + player.lift * dt);
          player.lift = player.jumpHeight > 0 ? player.lift - 18 * dt : 0;
        }
        const base = THREE.MathUtils.lerp(previousBase, groundY, 1 - Math.exp(-23 * walkDelta));
        position.y = (Math.abs(base - groundY) < 0.002 ? groundY : base) + player.jumpHeight;
      } else {
        if (magnitude > 0.12) {
          // Nếu người dùng bắt đầu tự điều khiển phím khi đang autoClimb thì hủy autoClimb
          if (state.autoClimb) state.setSpiralState({ autoClimb: null });

          const yaw = player.yaw + Math.atan2(-right, forward);
          const speed = tourist ? (running ? 5.2 : 2.6) : running ? 7.2 : 3.8;
          const distance = speed * Math.min(magnitude, 1) * dt;
          const x = position.x + Math.sin(yaw) * distance;
          const z = position.z + Math.cos(yaw) * distance;
          const moved =
            (checkWalk(x, position.z) && x !== position.x) ||
            (checkWalk(position.x, z) && z !== position.z);
          if (checkWalk(x, position.z)) position.x = x;
          if (checkWalk(position.x, z)) position.z = z;
          if (moved) clip = running ? 'Run' : 'Walk';
          const targetFacing = tourist ? yaw : yaw + Math.PI;
          const rotation = targetFacing - player.facing;
          player.facing +=
            Math.atan2(Math.sin(rotation), Math.cos(rotation)) * (1 - Math.exp(-14 * dt));

          if (!player.pointer && Math.abs(right) > 0.1) {
            player.yaw -= right * 1.45 * dt;
          }

        }

        const groundY = getGroundY(position.x, position.z);
        const touchJump = joystickInput.isJumping && !player.jumpHeld;
        if ((player.jumpPressed || touchJump) && Math.abs(position.y - groundY) < 0.08) {
          player.lift = 5.5;
        }
        player.jumpPressed = false;
        player.jumpHeld = joystickInput.isJumping;
        if (player.lift > 0 || position.y > groundY + 0.05) {
          position.y = Math.max(groundY, position.y + player.lift * dt);
          player.lift = position.y > groundY ? player.lift - 18 * dt : 0;
        } else {
          // Bám mượt theo từng bậc cầu thang sườn đồi
          position.y = THREE.MathUtils.lerp(position.y, groundY, 1 - Math.exp(-22 * dt));
        }
      }

      const { target, eye, direction } = scratch;
      target.copy(position);
      target.y += 1.25;
      direction.set(
        -Math.sin(player.yaw) * Math.cos(player.pitch),
        Math.sin(player.pitch),
        -Math.cos(player.yaw) * Math.cos(player.pitch),
      );

      let distance = player.distance;
      if (isLighthouse) {
        const clearDistance = LIGHTHOUSE_WORLD.cameraDistance(target, direction, player.distance, level);
        if (player.snap || clearDistance < player.cameraRadius) player.cameraRadius = clearDistance;
        else player.cameraRadius = THREE.MathUtils.lerp(player.cameraRadius, clearDistance, 1 - Math.exp(-8 * dt));
        distance = player.cameraRadius;
      } else {
        distance = campusCameraDistance(target, direction, player.distance);
      }

      eye.copy(target).addScaledVector(direction, distance);
      const eyeGroundY = getGroundY(eye.x, eye.z);
      if (level !== 'spiral' && eye.y < eyeGroundY + 0.6) {
        eye.y = eyeGroundY + 0.6;
      }
      if (player.snap || distance < player.distance - 0.01) camera.position.copy(eye);
      else camera.position.lerp(eye, 1 - Math.exp(-10 * dt));
      player.snap = false;
      camera.lookAt(target);

      player.positionTimer += dt;
      if (player.positionTimer >= 0.08) {
        player.positionTimer = 0;
        const previous = state.playerPosition;
        if (
          previous[0] !== position.x ||
          previous[1] !== position.y + 1.4 ||
          previous[2] !== position.z
        ) {
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

  return (
    <group ref={group} name={tourist ? 'Vinh_Thuc_Tourist' : 'Student_Character'}>
      <primitive object={scene} />
    </group>
  );
}
