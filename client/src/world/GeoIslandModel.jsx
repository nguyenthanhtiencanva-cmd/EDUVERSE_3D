import React, { useEffect, useMemo } from 'react';
import { Html, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { GEO_EXTENT, VERTICAL_EXAGGERATION, lonLatToWorld } from './geo';
import { MODEL_URLS } from './models';
import satelliteUrl from '../assets/terrain/vinh-thuc-satellite.jpg?url';

const SEA_STYLE_URL = '/terrain/vinh-thuc-style.png';

// Bản thử: chỉ Phân hiệu Vĩnh Trung có tọa độ từ hồ sơ dự án. Các điểm còn lại ước lượng từ ảnh vệ tinh,
// chờ thầy cô đối chiếu thực địa trước khi dùng chính thức.
const PLACES = [
  { name: 'Phân hiệu Vĩnh Trung', longitude: 107.9043412, latitude: 21.3712629, scope: 'campus' },
  { name: 'Hải đăng Vĩnh Thực', longitude: 108.0015, latitude: 21.3975, scope: 'lighthouse' },
];
const BACKGROUND_LABELS = [
  { name: 'Đảo Vĩnh Thực', longitude: 107.955, latitude: 21.392, large: true },
  { name: 'Trà Cổ', longitude: 107.995, latitude: 21.452 },
  { name: 'Đảo Cái Chiên', longitude: 107.79, latitude: 21.335 },
  { name: 'Vịnh Bắc Bộ', longitude: 108.03, latitude: 21.32, sea: true },
];

const [WEST_X, NORTH_Z] = lonLatToWorld(GEO_EXTENT.west, GEO_EXTENT.north);
const [EAST_X, SOUTH_Z] = lonLatToWorld(GEO_EXTENT.east, GEO_EXTENT.south);
const SEA_SIZE = [EAST_X - WEST_X, SOUTH_Z - NORTH_Z];
const SEA_CENTER = [(WEST_X + EAST_X) / 2, (NORTH_Z + SOUTH_Z) / 2];

export function GeoIslandModel() {
  const { scene } = useGLTF(MODEL_URLS.terrain);
  const [satellite, seaStyle] = useTexture([satelliteUrl, SEA_STYLE_URL]);
  const setWorldScope = useStore((state) => state.setWorldScope);

  const terrain = useMemo(() => {
    const mesh = scene.getObjectByProperty('isMesh', true);
    mesh.geometry.computeVertexNormals();
    satellite.flipY = false; // UV của địa hình theo quy ước glTF: v = 0 ở mép Bắc
    satellite.colorSpace = THREE.SRGBColorSpace;
    satellite.anisotropy = 8;
    // Ảnh Sentinel-2 khá tối; nhân màu lên để đảo sáng và tươi như bản đồ minh họa.
    mesh.material = new THREE.MeshStandardMaterial({ map: satellite, color: new THREE.Color(1.9, 2.0, 1.7), roughness: 1 });
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }, [scene, satellite]);

  useEffect(() => {
    seaStyle.colorSpace = THREE.SRGBColorSpace;
    seaStyle.needsUpdate = true;
  }, [seaStyle]);

  // Độ cao của ghim lấy từ chính địa hình.
  const places = useMemo(() => {
    scene.scale.set(1, VERTICAL_EXAGGERATION, 1);
    scene.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    return PLACES.map((place) => {
      const [x, z] = lonLatToWorld(place.longitude, place.latitude);
      raycaster.set(new THREE.Vector3(x, 100, z), down);
      const hit = raycaster.intersectObject(terrain, false)[0];
      return { ...place, position: [x, (hit ? hit.point.y : 0) + 0.6, z] };
    });
  }, [scene, terrain]);

  return (
    <group name="VinhThuc_GeoIsland">
      <primitive object={scene} />

      {/* Mặt biển tô màu theo khoảng cách tới bờ, nằm ngay trên mực nước 0 m */}
      <mesh rotation-x={-Math.PI / 2} position={[SEA_CENTER[0], 0.012, SEA_CENTER[1]]}>
        <planeGeometry args={SEA_SIZE} />
        <meshBasicMaterial map={seaStyle} toneMapped={false} />
      </mesh>
      {/* Biển xa ngoài phạm vi dữ liệu */}
      <mesh rotation-x={-Math.PI / 2} position={[SEA_CENTER[0], -0.05, SEA_CENTER[1]]}>
        <planeGeometry args={[6000, 6000]} />
        <meshBasicMaterial color="#bfe3ea" toneMapped={false} />
      </mesh>

      {places.map((place) => (
        <Html key={place.name} position={place.position} center zIndexRange={[15, 0]}>
          <button
            onClick={() => setWorldScope(place.scope)}
            className="whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900 shadow-lg ring-2 ring-white/70 transition hover:bg-amber-300 cursor-pointer"
          >
            {place.name}
          </button>
        </Html>
      ))}
      {BACKGROUND_LABELS.map((label) => {
        const [x, z] = lonLatToWorld(label.longitude, label.latitude);
        return (
          <Html key={label.name} position={[x, label.sea ? 0.1 : 2, z]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <span
              className={`whitespace-nowrap font-semibold italic ${label.large ? 'text-base' : 'text-xs'} ${label.sea ? 'tracking-[0.2em] text-white/80' : 'text-white'}`}
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.75)' }}
            >
              {label.name}
            </span>
          </Html>
        );
      })}
    </group>
  );
}
