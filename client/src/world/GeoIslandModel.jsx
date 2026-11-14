import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { GEO_EXTENT, VERTICAL_EXAGGERATION, lonLatToWorld } from './geo';
import { MODEL_URLS } from './models';
import { ISLAND_POI_LIST } from '../education/poiData';
import PLACES from '../education/island-places.json';
import satelliteUrl from '../assets/terrain/vinh-thuc-satellite.jpg?url';

const SEA_STYLE_URL = '/terrain/vinh-thuc-style.png';

// Tọa độ địa danh nằm trong island-places.json. Trường `confidence` cho biết độ tin cậy:
// confirmed (đã xác nhận), osm (có tên trên OpenStreetMap), osm-unnamed (đối tượng OSM chưa đặt tên),
// estimated (quy đổi từ sa bàn cũ, chờ thầy cô đối chiếu thực địa).
const BACKGROUND_LABELS = [
  { name: 'Đảo Vĩnh Thực', longitude: 107.955, latitude: 21.392, large: true },
  { name: 'Trà Cổ', longitude: 107.995, latitude: 21.452 },
  { name: 'Đảo Cái Chiên', longitude: 107.79, latitude: 21.335 },
  { name: 'Vịnh Bắc Bộ', longitude: 108.03, latitude: 21.32, sea: true },
];

const SECONDARY_PIN_RANGE = 130;
const scratch = new THREE.Vector3();

const [WEST_X, NORTH_Z] = lonLatToWorld(GEO_EXTENT.west, GEO_EXTENT.north);
const [EAST_X, SOUTH_Z] = lonLatToWorld(GEO_EXTENT.east, GEO_EXTENT.south);
const SEA_SIZE = [EAST_X - WEST_X, SOUTH_Z - NORTH_Z];
const SEA_CENTER = [(WEST_X + EAST_X) / 2, (NORTH_Z + SOUTH_Z) / 2];

export function GeoIslandModel() {
  const { scene } = useGLTF(MODEL_URLS.terrain);
  const [satellite, seaStyle] = useTexture([satelliteUrl, SEA_STYLE_URL]);
  const setActivePOI = useStore((state) => state.setActivePOI);
  const activePOI = useStore((state) => state.activePOI);
  const [nearby, setNearby] = useState('');
  const timer = useRef(0);

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

  // Địa danh phụ chỉ hiện khi camera đủ gần, để nhãn không chồng nhau ở góc nhìn toàn đảo.
  useFrame(({ camera }, delta) => {
    timer.current += delta;
    if (timer.current < 0.25) return;
    timer.current = 0;
    const visible = places
      .filter((place) => place.priority === 1 || camera.position.distanceTo(scratch.set(...place.position)) < SECONDARY_PIN_RANGE)
      .map((place) => place.poiId)
      .join(',');
    if (visible !== nearby) setNearby(visible);
  });
  const visibleIds = nearby.split(',');

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

      {places.filter((place) => visibleIds.includes(place.poiId) || activePOI?.id === place.poiId).map((place) => (
        <Html key={place.poiId} position={place.position} center zIndexRange={place.priority === 1 ? [15, 11] : [10, 6]}>
          <button
            onClick={() => setActivePOI(ISLAND_POI_LIST.find((poi) => poi.id === place.poiId) || null)}
            title={place.confidence === 'estimated' ? 'Vị trí ước lượng, chờ đối chiếu thực địa' : place.name}
            className={
              activePOI?.id === place.poiId
                ? 'whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-lg ring-2 ring-sky-400 cursor-pointer'
                : place.priority === 1
                ? 'whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900 shadow-lg ring-2 ring-white/70 transition hover:bg-amber-300 cursor-pointer'
                : 'whitespace-nowrap rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-white shadow ring-1 ring-white/50 transition hover:bg-slate-700 cursor-pointer'
            }
          >
            {place.name}
            {place.confidence === 'estimated' ? ' ?' : ''}
          </button>
        </Html>
      ))}
      {BACKGROUND_LABELS.map((label) => {
        const [x, z] = lonLatToWorld(label.longitude, label.latitude);
        return (
          <Html key={label.name} position={[x, label.sea ? 0.1 : 2, z]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
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
