import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { GEO_EXTENT, VERTICAL_EXAGGERATION, lonLatToWorld } from './geo';
import { MODEL_URLS } from './models';
import { GEO_TERRAIN_NAME, groundAt } from './geoCamera';
import { GeoClouds, Landmark, LANDMARK_HEIGHT } from './GeoLandmarks';
import { ISLAND_POI_LIST } from '../education/poiData';
import PLACES from '../education/island-places.json';
import { GeoPin } from '../ui/GeoPin';
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
const FAR_SEA_COLOR = '#bfe3ea';
const FAR_SEA_LINEAR = new THREE.Color(FAR_SEA_COLOR);

// Hòa mép ảnh biển vào màu biển xa, để không còn đường thẳng ở rìa vùng dữ liệu.
function fadeSeaEdges(shader) {
  shader.uniforms.farSeaColor = { value: FAR_SEA_LINEAR };
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform vec3 farSeaColor;')
    .replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      float geoEdge = min(min(vMapUv.x, 1.0 - vMapUv.x), min(vMapUv.y, 1.0 - vMapUv.y));
      diffuseColor.rgb = mix(farSeaColor, diffuseColor.rgb, smoothstep(0.0, 0.12, geoEdge));`,
    );
}
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
  const quality = useStore((state) => state.quality);
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
    // Tăng độ tươi và nâng vùng tối, cho rừng xanh và bãi cát rõ như bản đồ minh họa.
    mesh.material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float geoLuma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        diffuseColor.rgb = mix(vec3(geoLuma), diffuseColor.rgb, 1.5);
        diffuseColor.rgb = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(0.85));`,
      );
    };
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.name = GEO_TERRAIN_NAME; // Bộ điều khiển camera tìm địa hình theo tên này
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
    return PLACES.map((place) => {
      const [x, z] = lonLatToWorld(place.longitude, place.latitude);
      const ground = groundAt(terrain, x, z);
      // Hướng ra biển: phía có mặt đất thấp nhất cách địa danh 250 m.
      let seaward = 0;
      let lowest = Infinity;
      for (let step = 0; step < 8; step++) {
        const angle = (step / 8) * Math.PI * 2;
        const height = groundAt(terrain, x + Math.sin(angle) * 2.5, z + Math.cos(angle) * 2.5);
        if (height < lowest) {
          lowest = height;
          seaward = angle;
        }
      }
      return {
        ...place,
        seaward,
        base: [x, ground, z],
        // Mũi ghim chạm ngay trên nóc công trình thu nhỏ.
        position: [x, ground + (LANDMARK_HEIGHT[place.kind] || 0) + 0.15, z],
      };
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

      {places.map((place) => (
        <group key={place.poiId} position={place.base}>
          <Landmark kind={place.kind} seaward={place.seaward} />
        </group>
      ))}
      {quality !== 'low' && <GeoClouds />}

      {/* Mặt biển tô màu theo khoảng cách tới bờ, nằm ngay trên mực nước 0 m */}
      <mesh rotation-x={-Math.PI / 2} position={[SEA_CENTER[0], 0.02, SEA_CENTER[1]]}>
        <planeGeometry args={SEA_SIZE} />
        <meshBasicMaterial map={seaStyle} toneMapped={false} onBeforeCompile={fadeSeaEdges} />
      </mesh>
      {/* Biển xa ngoài phạm vi dữ liệu */}
      <mesh rotation-x={-Math.PI / 2} position={[SEA_CENTER[0], -1.5, SEA_CENTER[1]]}>
        <planeGeometry args={[6000, 6000]} />
        <meshBasicMaterial color={FAR_SEA_COLOR} toneMapped={false} />
      </mesh>

      {places.filter((place) => visibleIds.includes(place.poiId) || activePOI?.id === place.poiId).map((place) => (
        <Html key={place.poiId} position={place.position} zIndexRange={place.priority === 1 ? [15, 11] : [10, 6]}>
          <GeoPin
            place={place}
            active={activePOI?.id === place.poiId}
            onSelect={() => setActivePOI(ISLAND_POI_LIST.find((poi) => poi.id === place.poiId) || null)}
          />
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
