import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { POI_LIST } from '../education/poiData';

// Campus boundary collision limits (Phân hiệu Vĩnh Trung)
const BOUNDS = {
  minX: -28.0,
  maxX: 28.0,
  minZ: -28.0,
  maxZ: 28.0,
};

// Simplified building collision boxes to prevent walking through walls
const BUILDING_COLLIDERS = [
  // Tòa Nhà A (Dãy lớp học 2 tầng phía Đông)
  { minX: 9.0, maxX: 22.0, minZ: 0.0, maxZ: 14.0 },
  // Tòa Nhà B & Lễ đài Chào Cờ (Phía Bắc)
  { minX: -14.0, maxX: 16.0, minZ: -26.0, maxZ: -16.0 },
  // Nhà Đa Năng C1 & C2 (Phía Tây)
  { minX: -27.0, maxX: -15.0, minZ: -8.0, maxZ: 16.0 },
  // Tòa Hiệu Bộ & Khu phụ trợ (Phía Nam cạnh cổng)
  { minX: 12.0, maxX: 26.0, minZ: 18.0, maxZ: 28.0 },
  // Tường rào cổng chính
  { minX: -10.0, maxX: 6.0, minZ: 26.0, maxZ: 29.0 },
];

export function CharacterController() {
  const group = useRef();
  const { camera, gl } = useThree();
  const { scene, animations } = useGLTF('/models/student_character.glb');
  const { actions } = useAnimations(animations, group);

  const cameraMode = useStore((state) => state.cameraMode);
  const setPlayerPosition = useStore((state) => state.setPlayerPosition);
  const joystickInput = useStore((state) => state.joystickInput);
  const setActivePOI = useStore((state) => state.setActivePOI);

  // Character movement states
  // Initial position: center courtyard in front of flag ceremony stage
  const pos = useRef(new THREE.Vector3(1.5, 0.0, 6.0));
  const velocity = useRef(new THREE.Vector3());
  const rotationY = useRef(0);
  const targetRotationY = useRef(0);
  const isJumping = useRef(false);
  const verticalVelocity = useRef(0);
  const currentAction = useRef('Idle');

  // Camera Orbit / Chase parameters in TPS mode
  const camDistance = useRef(4.2);
  const camYaw = useRef(0);
  const camPitch = useRef(0.28); // gentle downward angle
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  // Keyboard input tracking
  const keys = useRef({});

  useEffect(() => {
    // Optimize shadow casting for character mesh
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = Math.min(child.material.roughness || 0.6, 0.7);
          }
        }
      });
    }
  }, [scene]);

  // Set default animation to Idle
  useEffect(() => {
    if (actions && actions['Idle']) {
      actions['Idle'].reset().fadeIn(0.2).play();
      currentAction.current = 'Idle';
    }
    return () => {
      if (actions) {
        Object.values(actions).forEach((act) => act?.stop());
      }
    };
  }, [actions]);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e) => {
      keys.current[e.code] = true;
      if (e.code === 'Space' && !isJumping.current && cameraMode === 'fps') {
        isJumping.current = true;
        verticalVelocity.current = 5.5;
      }
    };
    const onKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [cameraMode]);

  // Mouse drag camera orbit in walking/TPS mode
  useEffect(() => {
    if (cameraMode !== 'fps') return;

    const canvas = gl.domElement;
    const onMouseDown = (e) => {
      // Allow dragging camera with left/right mouse or touch
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      prevMouse.current = { x: e.clientX, y: e.clientY };

      camYaw.current -= dx * 0.006;
      camPitch.current = Math.max(0.05, Math.min(Math.PI / 2.6, camPitch.current + dy * 0.005));
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e) => {
      camDistance.current = Math.max(1.8, Math.min(8.0, camDistance.current + e.deltaY * 0.005));
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [cameraMode, gl]);

  // Check collision with buildings
  const checkCollision = (newX, newZ) => {
    // Check boundary
    if (newX < BOUNDS.minX || newX > BOUNDS.maxX || newZ < BOUNDS.minZ || newZ > BOUNDS.maxZ) {
      return true;
    }
    // Check building boxes
    const charRadius = 0.45;
    for (const b of BUILDING_COLLIDERS) {
      if (
        newX + charRadius > b.minX &&
        newX - charRadius < b.maxX &&
        newZ + charRadius > b.minZ &&
        newZ - charRadius < b.maxZ
      ) {
        return true;
      }
    }
    return false;
  };

  useFrame((state, delta) => {
    if (!group.current) return;

    // Movement calculation when in Walking (fps) mode
    if (cameraMode === 'fps') {
      const isShift = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
      const walkSpeed = 3.8;
      const runSpeed = 7.2;

      let inputForward = 0;
      let inputRight = 0;

      if (keys.current['KeyW'] || keys.current['ArrowUp']) inputForward += 1;
      if (keys.current['KeyS'] || keys.current['ArrowDown']) inputForward -= 1;
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) inputRight -= 1;
      if (keys.current['KeyD'] || keys.current['ArrowRight']) inputRight += 1;

      // Mobile Joystick input
      inputForward += joystickInput.moveY;
      inputRight += joystickInput.moveX;

      // Touch camera look
      if (Math.abs(joystickInput.lookX) > 0.05) camYaw.current -= joystickInput.lookX * 0.04;
      if (Math.abs(joystickInput.lookY) > 0.05) {
        camPitch.current = Math.max(0.05, Math.min(Math.PI / 2.6, camPitch.current + joystickInput.lookY * 0.03));
      }

      // Check jumping from joystick
      if (joystickInput.isJumping && !isJumping.current) {
        isJumping.current = true;
        verticalVelocity.current = 5.5;
      }

      const inputLen = Math.sqrt(inputForward * inputForward + inputRight * inputRight);
      const isMoving = inputLen > 0.1;
      const isRunning = isShift || inputLen > 0.85;
      const currentSpeed = isRunning ? runSpeed : walkSpeed;

      if (isMoving) {
        // Move relative to current camera yaw
        const moveAngle = Math.atan2(inputRight, inputForward);
        const finalAngle = camYaw.current + moveAngle;

        const moveDir = new THREE.Vector3(
          Math.sin(finalAngle),
          0,
          Math.cos(finalAngle)
        ).normalize();

        const deltaMove = moveDir.clone().multiplyScalar(currentSpeed * delta);

        // Test collision for X and Z independently (sliding along walls)
        const nextX = pos.current.x + deltaMove.x;
        const nextZ = pos.current.z + deltaMove.z;

        if (!checkCollision(nextX, pos.current.z)) {
          pos.current.x = nextX;
        }
        if (!checkCollision(pos.current.x, nextZ)) {
          pos.current.z = nextZ;
        }

        targetRotationY.current = finalAngle + Math.PI; // Face moving direction
      }

      // Handle Jump & Gravity
      if (isJumping.current) {
        pos.current.y += verticalVelocity.current * delta;
        verticalVelocity.current -= 18.0 * delta;
        if (pos.current.y <= 0.0) {
          pos.current.y = 0.0;
          isJumping.current = false;
          verticalVelocity.current = 0;
        }
      }

      // Smooth rotation toward movement direction
      const diff = targetRotationY.current - rotationY.current;
      // Normalize angle difference to [-PI, PI]
      const normDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
      rotationY.current += normDiff * 14.0 * delta;

      // Handle Animation Transitions
      let nextAction = 'Idle';
      if (isMoving) {
        nextAction = isRunning ? 'Run' : 'Walk';
      }

      if (nextAction !== currentAction.current && actions) {
        const prev = actions[currentAction.current];
        const next = actions[nextAction];
        if (next) {
          next.reset().fadeIn(0.2).play();
          if (prev) prev.fadeOut(0.2);
          currentAction.current = nextAction;
        }
      }

      // Update Third-Person Camera (TPS) position & lookAt
      const targetLookPos = new THREE.Vector3(pos.current.x, pos.current.y + 1.25, pos.current.z);
      const camOffset = new THREE.Vector3(
        -Math.sin(camYaw.current) * Math.cos(camPitch.current) * camDistance.current,
        Math.sin(camPitch.current) * camDistance.current,
        -Math.cos(camYaw.current) * Math.cos(camPitch.current) * camDistance.current
      );

      const targetCamPos = targetLookPos.clone().add(camOffset);
      // Smooth lerp camera
      camera.position.lerp(targetCamPos, 0.12);
      camera.lookAt(targetLookPos);

      // Report player position to Store for Radar / MiniMap
      setPlayerPosition([pos.current.x, pos.current.y + 1.4, pos.current.z]);
    } else {
      // In Flycam/Orbit mode, character stands naturally in courtyard with Idle animation
      if (currentAction.current !== 'Idle' && actions) {
        const prev = actions[currentAction.current];
        const next = actions['Idle'];
        if (next) {
          next.reset().fadeIn(0.3).play();
          if (prev) prev.fadeOut(0.3);
          currentAction.current = 'Idle';
        }
      }
    }

    // Apply position & rotation to character 3D mesh
    group.current.position.copy(pos.current);
    group.current.rotation.y = rotationY.current;
  });

  return (
    <group ref={group} name="Student_Character_Controller">
      {/* 3D Student Character Model (Rigged & Animated) */}
      <primitive object={scene} />

      {/* Subtle soft contact shadow underneath character */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial
          color="#0b1320"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/student_character.glb');
