import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

export const ISLAND_PRESET_VIEWS = {
  island_overview: {
    pos: new THREE.Vector3(0.0, 62.0, 88.0),
    target: new THREE.Vector3(0.0, 1.5, 0.0),
    name: '🌏 Toàn đảo Vĩnh Thực',
  },
  van_gia_north: {
    pos: new THREE.Vector3(18.14, 18.0, 2.0),
    target: new THREE.Vector3(18.14, 1.5, -18.56),
    name: '⚓ Bến Tàu Vạn Gia (Bờ Bắc)',
  },
  vinh_trung_campus: {
    pos: new THREE.Vector3(-19.27, 16.0, 16.0),
    target: new THREE.Vector3(-19.27, 2.0, -1.83),
    name: '🏫 Phân hiệu Vĩnh Trung',
  },
  dau_dong_main: {
    pos: new THREE.Vector3(23.20, 16.0, 15.0),
    target: new THREE.Vector3(23.20, 2.2, -4.22),
    name: '🏫 Điểm chính Vĩnh Thực & Đầu Đông',
  },
  lighthouse_peak: {
    pos: new THREE.Vector3(52.0, 18.0, -4.0),
    target: new THREE.Vector3(62.60, 4.5, -22.82),
    name: '🗼 Hải đăng Vĩnh Thực (1962)',
  },
  fishermans_wharf: {
    pos: new THREE.Vector3(-62.0, 15.0, 18.0),
    target: new THREE.Vector3(-67.08, 1.2, 0.70),
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
  const { camera } = useThree();
  const orbitRef = useRef();

  const worldScope = useStore((state) => state.worldScope);
  const cameraMode = useStore((state) => state.cameraMode);
  const activeView = useStore((state) => state.activeView);
  const activePOI = useStore((state) => state.activePOI);

  const targetPos = useRef(new THREE.Vector3(0.0, 58.0, 92.0));
  const targetLook = useRef(new THREE.Vector3(2.0, 2.0, 0.0));


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

  useFrame(() => {
    if (cameraMode === 'orbit') {
      camera.position.lerp(targetPos.current, 0.055);
      if (orbitRef.current) {
        orbitRef.current.target.lerp(targetLook.current, 0.055);
        orbitRef.current.update();
      }
    }
    // When cameraMode is 'fps', CharacterController takes over camera follow & player movement
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
