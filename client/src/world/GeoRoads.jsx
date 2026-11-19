import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import ROADS from '../education/island-roads.json';
import LINES from '../education/island-road-lines.json';
import roadsUrl from '../assets/models/vinh_thuc_roads.glb?url';
import { METERS_PER_UNIT, VERTICAL_EXAGGERATION, lonLatToWorld } from './geo';

// Ngưỡng độ cao camera (đơn vị cảnh, 1 đơn vị = 100 m).
// Trên LINE_MIN_CAMERA_HEIGHT: mặt đường thật quá nhỏ trên màn hình, nên vẽ thêm nét mảnh theo tim đường
// (cả đường chính lẫn đường phụ). Dưới TRACK_MAX_CAMERA_HEIGHT: hiện đường mòn.
const LINE_MIN_CAMERA_HEIGHT = 35;
const TRACK_MAX_CAMERA_HEIGHT = 130;
const LINE_LIFT = 0.06;

// Màu theo vật liệu trong tệp mặt đường (scripts/build-island-roadmesh.mjs).
// polygonOffset đẩy mặt đường lên trước địa hình; lớp sau cao hơn lớp trước để vạch kẻ nằm trên mặt đường.
const STYLES = {
  Mat_Road_Dirt: { color: '#D2AE7E', offset: -1 },
  Mat_Road_Concrete: { color: '#F1EADA', offset: -2 },
  Mat_Road_Asphalt: { color: '#CBC6BC', offset: -3 },
  Mat_Road_Marking: { color: '#F2BE3C', offset: -4 },
  Mat_Road_Embankment: { color: '#857D70', offset: -1 },
};

function toSegments(lines, lift) {
  return lines.flatMap((line) => {
    const path = line.map(([lon, lat, height]) => {
      const [x, z] = lonLatToWorld(lon, lat);
      return [x, (height / METERS_PER_UNIT) * VERTICAL_EXAGGERATION + lift, z];
    });
    return path.slice(1).flatMap((point, i) => [path[i], point]);
  });
}

// Mặt đường 3D (trục chính, đường phụ bê tông, đường mòn đất, kè đá qua đầm) và tuyến phà.
// Dữ liệu đường: © OpenStreetMap contributors (ODbL).
export function GeoRoads() {
  const { scene } = useGLTF(roadsUrl);
  const tracks = useRef(null);
  const mainLines = useRef(null);
  const minorLines = useRef(null);

  const roads = useMemo(() => {
    const root = scene.clone(true);
    root.scale.set(1, VERTICAL_EXAGGERATION, 1);
    root.traverse((child) => {
      if (!child.isMesh) return;
      const style = STYLES[child.material?.name] || STYLES.Mat_Road_Concrete;
      child.geometry.computeVertexNormals();
      child.material = new THREE.MeshStandardMaterial({
        color: style.color,
        roughness: 0.95,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: style.offset,
        polygonOffsetUnits: style.offset * 2,
      });
      child.renderOrder = -style.offset;
      if (child.name === 'Road_Track') tracks.current = child;
    });
    return root;
  }, [scene]);

  const main = useMemo(() => toSegments(LINES.roads, LINE_LIFT), []);
  const minor = useMemo(() => toSegments(LINES.minorRoads, LINE_LIFT), []);
  const ferries = useMemo(() => toSegments(ROADS.ferries.map((line) => line.map(([lon, lat]) => [lon, lat, 0])), 0.12), []);

  useFrame(({ camera }) => {
    const height = camera.position.y;
    const show = (ref, visible) => {
      if (ref.current && ref.current.visible !== visible) ref.current.visible = visible;
    };
    show(tracks, height < TRACK_MAX_CAMERA_HEIGHT);
    show(mainLines, height > LINE_MIN_CAMERA_HEIGHT);
    show(minorLines, height > LINE_MIN_CAMERA_HEIGHT);
  });

  return (
    <group name="GeoRoads">
      <primitive object={roads} />
      <Line ref={mainLines} points={main} segments color="#FFF4C2" lineWidth={3} transparent opacity={0.95} />
      <Line ref={minorLines} points={minor} segments color="#FFF6DD" lineWidth={2.2} transparent opacity={0.95} />
      <Line points={ferries} segments color="#FFFFFF" lineWidth={2} dashed dashSize={2.4} gapSize={1.8} transparent opacity={0.9} />
    </group>
  );
}
