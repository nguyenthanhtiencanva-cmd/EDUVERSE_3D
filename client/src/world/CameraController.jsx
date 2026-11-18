import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { GEO_MAP_ENABLED, lonLatToWorld } from './geo';
import ISLAND_PLACES from '../education/island-places.json';
import { chooseGeoView } from './geoCamera';

export const ISLAND_PRESET_VIEWS = {
  island_overview: {
    pos: new THREE.Vector3(0.0, 62.0, 88.0),
    target: new THREE.Vector3(0.0, 1.5, 0.0),
    name: '🌏 Toàn đảo Vĩnh Thực',
  },
  van_gia_north: {
    pos: new THREE.Vector3(18.14, 18.0, 2.0),
    target: new THREE.Vector3(18.14, 1.5, -18.56),
    name: '⚓ Cảng Vạn Gia (Bờ Bắc)',
  },
  vinh_trung_campus: {
    pos: new THREE.Vector3(-19.27, 16.0, 16.0),
    target: new THREE.Vector3(-19.27, 2.0, -1.83),
    name: '🏫 Phân hiệu Vĩnh Trung',
  },
  truong_vinh_thuc: {
    pos: new THREE.Vector3(23.20, 16.0, 15.0),
    target: new THREE.Vector3(23.20, 2.2, -4.22),
    name: '🏫 Trường TH&THCS Vĩnh Thực',
  },
  lighthouse_peak: {
    pos: new THREE.Vector3(52.0, 18.0, -4.0),
    target: new THREE.Vector3(62.60, 4.5, -22.82),
    name: '🗼 Hải đăng Vĩnh Thực (1962)',
  },
};

// Góc nhìn của bản đồ đảo dựng từ dữ liệu thật (bản thử ?map=new).
export const GEO_ISLAND_PRESET_VIEWS = {
  island_overview: {
    pos: new THREE.Vector3(10, 150, 165),
    target: new THREE.Vector3(8, 0, 8),
    name: '🌏 Toàn đảo Vĩnh Thực',
  },
  geo_tilt: {
    pos: new THREE.Vector3(-70, 42, 120),
    target: new THREE.Vector3(5, 0, -5),
    name: '⛰️ Nhìn nghiêng từ phía Nam',
  },
  geo_top: {
    pos: new THREE.Vector3(8, 300, 12),
    target: new THREE.Vector3(8, 0, 8),
    name: '🧭 Từ trên xuống, Bắc ở trên',
  },
};

export const LIGHTHOUSE_PRESET_VIEWS = {
  lh_overview: {
    pos: new THREE.Vector3(-55, 48, 95),
    target: new THREE.Vector3(0, 1, 10),
    name: '🗼 Toàn cảnh Trạm Hải đăng',
  },
  lh_rotunda: {
    pos: new THREE.Vector3(-18, 6, 14),
    target: new THREE.Vector3(-10, 3, 0),
    name: '🏛️ Hiên vòm tròn & Chân tháp',
  },
  lh_lantern: {
    pos: new THREE.Vector3(-3, 23, 10),
    target: new THREE.Vector3(-10, 21, 0),
    name: '💡 Lồng đèn & Ban công',
  },
  lh_house: {
    pos: new THREE.Vector3(4.0, 5.5, 12.5),
    target: new THREE.Vector3(3.5, 3.0, -2.0),
    name: '🏠 Nhà quản lý & Sân gạch đỏ',
  },
  lh_viewpoint: {
    pos: new THREE.Vector3(12, -8, 57),
    target: new THREE.Vector3(0, 8, 0),
    name: '🔭 Điểm ngắm biển & Cầu thang',
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

export const ACTIVE_ISLAND_VIEWS = GEO_MAP_ENABLED ? GEO_ISLAND_PRESET_VIEWS : ISLAND_PRESET_VIEWS;

// Cảng Vạn Gia 1:1. Gốc tọa độ ở đầu bậc tàu khách, biển ở phía +Z, đồi ở phía -Z.
export const VAN_GIA_PRESET_VIEWS = {
  vg_overview: {
    pos: new THREE.Vector3(-30, 38, 120),
    target: new THREE.Vector3(-35, 2, -6),
    name: '⚓ Toàn cảng từ biển',
  },
  vg_terminal: {
    pos: new THREE.Vector3(16, 7, 52),
    target: new THREE.Vector3(5, 2, -4),
    name: '🚤 Bến tàu khách',
  },
  vg_shelter: {
    pos: new THREE.Vector3(12, 9, 20),
    target: new THREE.Vector3(30, 1.5, -8),
    name: '🎫 Nhà chờ & phòng vé',
  },
  vg_shops: {
    pos: new THREE.Vector3(-30, 6, 40),
    target: new THREE.Vector3(-38, 2, -4),
    name: '☕ Kè & hàng quán',
  },
  vg_pier: {
    pos: new THREE.Vector3(-150, 16, 66),
    target: new THREE.Vector3(-108, 1, 6),
    name: '🏗️ Cầu cảng & Trạm Vạn Gia',
  },
};

export function CameraController() {
  const { camera, scene } = useThree();
  const orbitRef = useRef();

  const worldScope = useStore((state) => state.worldScope);
  const cameraMode = useStore((state) => state.cameraMode);
  const activeView = useStore((state) => state.activeView);
  const activePOI = useStore((state) => state.activePOI);
  const viewNonce = useStore((state) => state.viewNonce);

  const targetPos = useRef(new THREE.Vector3(0.0, 58.0, 92.0));
  const targetLook = useRef(new THREE.Vector3(2.0, 2.0, 0.0));

  const lastGeoPlace = useRef(null);

  useEffect(() => {
    const geoPlace =
      GEO_MAP_ENABLED && worldScope === 'island' && activePOI
        ? ISLAND_PLACES.find((place) => place.poiId === activePOI.id)
        : null;
    if (geoPlace) {
      // Bay tới địa danh trên bản đồ dữ liệu thật, từ hướng không bị địa hình che.
      const [x, z] = lonLatToWorld(geoPlace.longitude, geoPlace.latitude);
      const view = chooseGeoView(scene, x, z);
      targetPos.current.copy(view.position);
      targetLook.current.copy(view.target);
      lastGeoPlace.current = `${worldScope}:${activeView}:${viewNonce}`;
    } else if (lastGeoPlace.current === `${worldScope}:${activeView}:${viewNonce}`) {
      // Vừa đóng thẻ địa danh mà chưa đổi góc nhìn: giữ camera tại chỗ.
      lastGeoPlace.current = null;
    } else if (activePOI) {
      targetPos.current.set(...activePOI.cameraPosition);
      targetLook.current.set(...activePOI.cameraTarget);
    } else if (worldScope === 'island' && ACTIVE_ISLAND_VIEWS[activeView]) {
      targetPos.current.copy(ACTIVE_ISLAND_VIEWS[activeView].pos);
      targetLook.current.copy(ACTIVE_ISLAND_VIEWS[activeView].target);
    } else if (worldScope === 'lighthouse' && LIGHTHOUSE_PRESET_VIEWS[activeView]) {
      targetPos.current.copy(LIGHTHOUSE_PRESET_VIEWS[activeView].pos);
      targetLook.current.copy(LIGHTHOUSE_PRESET_VIEWS[activeView].target);
    } else if (worldScope === 'vangia' && VAN_GIA_PRESET_VIEWS[activeView]) {
      targetPos.current.copy(VAN_GIA_PRESET_VIEWS[activeView].pos);
      targetLook.current.copy(VAN_GIA_PRESET_VIEWS[activeView].target);
    } else if (worldScope === 'campus' && PRESET_VIEWS[activeView]) {
      targetPos.current.copy(PRESET_VIEWS[activeView].pos);
      targetLook.current.copy(PRESET_VIEWS[activeView].target);
    }
  }, [worldScope, activeView, activePOI, viewNonce]);

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
          minDistance={worldScope === 'island' ? 12 : 2.5}
          maxDistance={worldScope === 'island' ? (GEO_MAP_ENABLED ? 600 : 180) : worldScope === 'lighthouse' || worldScope === 'vangia' ? 260 : 120}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      )}
    </>
  );
}
