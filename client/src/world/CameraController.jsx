import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

export const ISLAND_PRESET_VIEWS = {
  island_overview: {
    pos: new THREE.Vector3(0.0, 58.0, 92.0),
    target: new THREE.Vector3(2.0, 2.0, 0.0),
    name: '🌏 Toàn đảo Vĩnh Thực',
  },
  van_gia_north: {
    pos: new THREE.Vector3(17.0, 20.0, 15.0),
    target: new THREE.Vector3(17.0, 2.0, -12.5),
    name: '⚓ Bến Tàu Vạn Gia (Bờ Bắc)',
  },
  vinh_trung_campus: {
    pos: new THREE.Vector3(-26.0, 18.0, 22.0),
    target: new THREE.Vector3(-26.0, 2.5, -0.5),
    name: '🏫 Phân hiệu Vĩnh Trung (Thôn 3)',
  },
  dau_dong_main: {
    pos: new THREE.Vector3(28.0, 18.0, 20.0),
    target: new THREE.Vector3(28.0, 2.5, -1.5),
    name: '🏫 Điểm chính Đầu Đông & Bãi biển',
  },
  lighthouse_peak: {
    pos: new THREE.Vector3(54.0, 26.0, 10.0),
    target: new THREE.Vector3(65.0, 12.0, -13.5),
    name: '🗼 Hải đăng Vĩnh Thực (1962)',
  },
  fishermans_wharf: {
    pos: new THREE.Vector3(-64.0, 16.0, 20.0),
    target: new THREE.Vector3(-64.0, 1.5, -1.5),
    name: '⚓ Bến cá Mũi Tây',
  },
};

export const PRESET_VIEWS = {
  aerial: {
    pos: new THREE.Vector3(-3.0, 34.0, 56.0),
    target: new THREE.Vector3(-1.0, 2.0, -2.0),
    name: 'Toàn cảnh Phân hiệu',
  },
  assembly: {
    pos: new THREE.Vector3(1.0, 3.2, 16.0),
    target: new THREE.Vector3(1.4, 2.2, -16.0),
    name: 'Chào cờ Sân trường',
  },
  stage: {
    pos: new THREE.Vector3(1.4, 3.0, -5.5),
    target: new THREE.Vector3(1.4, 2.5, -22.5),
    name: 'Lễ đài Sân khấu',
  },
  gate: {
    pos: new THREE.Vector3(7.5, 4.2, 26.0),
    target: new THREE.Vector3(8.4, 2.2, 40.0),
    name: 'Cổng trường',
  },
  buildingA: {
    pos: new THREE.Vector3(2.0, 6.0, 16.0),
    target: new THREE.Vector3(15.5, 4.0, 5.5),
    name: 'Tòa nhà A (Lớp học)',
  },
  gym: {
    pos: new THREE.Vector3(-22.0, 8.5, 28.0),
    target: new THREE.Vector3(-32.0, 4.0, 5.0),
    name: 'Nhà Đa Năng & Tòa C2',
  },
};

export function CameraController() {
  const { camera, gl } = useThree();
  const orbitRef = useRef();

  const worldScope = useStore((state) => state.worldScope);
  const cameraMode = useStore((state) => state.cameraMode);
  const activeView = useStore((state) => state.activeView);
  const activePOI = useStore((state) => state.activePOI);
  const setPlayerPosition = useStore((state) => state.setPlayerPosition);
  const joystickInput = useStore((state) => state.joystickInput);

  const targetPos = useRef(new THREE.Vector3(0.0, 58.0, 92.0));
  const targetLook = useRef(new THREE.Vector3(2.0, 2.0, 0.0));

  const playerPos = useRef(new THREE.Vector3(4.0, 1.7, 8.0));
  const playerYaw = useRef(0);
  const playerPitch = useRef(0);
  const keysDown = useRef({});
  const isJumping = useRef(false);
  const verticalVelocity = useRef(0);

  useEffect(() => {
    if (activePOI) {
      targetPos.current.set(...activePOI.cameraPosition);
      targetLook.current.set(...activePOI.cameraTarget);
    } else if (worldScope === 'island' && ISLAND_PRESET_VIEWS[activeView]) {
      targetPos.current.copy(ISLAND_PRESET_VIEWS[activeView].pos);
      targetLook.current.copy(ISLAND_PRESET_VIEWS[activeView].target);
    } else if (worldScope === 'campus' && PRESET_VIEWS[activeView]) {
      targetPos.current.copy(PRESET_VIEWS[activeView].pos);
      targetLook.current.copy(PRESET_VIEWS[activeView].target);
    }
  }, [worldScope, activeView, activePOI]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysDown.current[e.code] = true;
      if (e.code === 'Space' && !isJumping.current) {
        isJumping.current = true;
        verticalVelocity.current = 6.0;
      }
    };
    const handleKeyUp = (e) => {
      keysDown.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (cameraMode !== 'fps') return;

    const handleMouseMove = (e) => {
      if (document.pointerLockElement === gl.domElement) {
        playerYaw.current -= e.movementX * 0.0025;
        playerPitch.current -= e.movementY * 0.0025;
        playerPitch.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, playerPitch.current));
      }
    };

    const handleClick = () => {
      if (cameraMode === 'fps' && document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock?.();
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cameraMode, gl]);

  useFrame((state, delta) => {
    if (cameraMode === 'orbit') {
      camera.position.lerp(targetPos.current, 0.055);
      if (orbitRef.current) {
        orbitRef.current.target.lerp(targetLook.current, 0.055);
        orbitRef.current.update();
      }
    } else {
      const speed = 7.5;
      let moveForward = 0;
      let moveRight = 0;

      if (keysDown.current['KeyW'] || keysDown.current['ArrowUp']) moveForward += 1;
      if (keysDown.current['KeyS'] || keysDown.current['ArrowDown']) moveForward -= 1;
      if (keysDown.current['KeyA'] || keysDown.current['ArrowLeft']) moveRight -= 1;
      if (keysDown.current['KeyD'] || keysDown.current['ArrowRight']) moveRight += 1;

      moveForward += joystickInput.moveY;
      moveRight += joystickInput.moveX;

      playerYaw.current -= joystickInput.lookX * 0.035;
      playerPitch.current -= joystickInput.lookY * 0.035;
      playerPitch.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, playerPitch.current));

      const forwardDir = new THREE.Vector3(
        -Math.sin(playerYaw.current),
        0,
        -Math.cos(playerYaw.current)
      ).normalize();

      const rightDir = new THREE.Vector3(
        Math.cos(playerYaw.current),
        0,
        -Math.sin(playerYaw.current)
      ).normalize();

      const moveDir = new THREE.Vector3()
        .addScaledVector(forwardDir, moveForward)
        .addScaledVector(rightDir, moveRight);

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        playerPos.current.addScaledVector(moveDir, speed * delta);
      }

      if (isJumping.current) {
        playerPos.current.y += verticalVelocity.current * delta;
        verticalVelocity.current -= 18.0 * delta;
        if (playerPos.current.y <= 1.7) {
          playerPos.current.y = 1.7;
          isJumping.current = false;
          verticalVelocity.current = 0;
        }
      }

      playerPos.current.x = Math.max(-28.0, Math.min(30.0, playerPos.current.x));
      playerPos.current.z = Math.max(-30.0, Math.min(26.0, playerPos.current.z));

      camera.position.copy(playerPos.current);

      const lookTarget = new THREE.Vector3(
        playerPos.current.x - Math.sin(playerYaw.current) * Math.cos(playerPitch.current),
        playerPos.current.y + Math.sin(playerPitch.current),
        playerPos.current.z - Math.cos(playerYaw.current) * Math.cos(playerPitch.current)
      );
      camera.lookAt(lookTarget);

      setPlayerPosition([playerPos.current.x, playerPos.current.y, playerPos.current.z]);
    }
  });

  return (
    <>
      {cameraMode === 'orbit' && (
        <OrbitControls
          ref={orbitRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={worldScope === 'island' ? 12 : 5}
          maxDistance={worldScope === 'island' ? 180 : 120}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      )}
    </>
  );
}
