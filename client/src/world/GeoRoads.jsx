import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import ROADS from '../education/island-roads.json';
import { METERS_PER_UNIT, VERTICAL_EXAGGERATION, lonLatToWorld } from './geo';

// Đường nằm cao hơn mặt địa hình một chút để không bị lưới địa hình (đã nén, sai số vài mét) che mất.
const LIFT = 0.1;
// Đường phụ chỉ hiện khi camera hạ thấp hơn mức này (đơn vị cảnh, 1 đơn vị = 100 m).
// Ở góc nhìn toàn đảo (cao 150) chúng ẩn; góc nhìn nghiêng (cao 42) và lúc bay tới địa danh thì hiện.
const MINOR_ROAD_MAX_CAMERA_HEIGHT = 80;

function toSegments(lines) {
  const points = [];
  for (const line of lines) {
    const path = line.map(([longitude, latitude, height]) => {
      const [x, z] = lonLatToWorld(longitude, latitude);
      return [x, (height / METERS_PER_UNIT) * VERTICAL_EXAGGERATION + LIFT, z];
    });
    for (let index = 1; index < path.length; index++) points.push(path[index - 1], path[index]);
  }
  return points;
}

// Đường và tuyến phà của đảo, lấy từ OpenStreetMap (xem scripts/build-island-roads.mjs).
// Đường chính, đường phụ và tuyến phà mỗi loại là một lệnh vẽ.
export function GeoRoads() {
  const roads = useMemo(() => toSegments(ROADS.roads), []);
  const minorRoads = useMemo(() => toSegments(ROADS.minorRoads || []), []);
  const ferries = useMemo(() => toSegments(ROADS.ferries), []);
  const minorGroup = useRef(null);

  useFrame(({ camera }) => {
    if (!minorGroup.current) return;
    const visible = camera.position.y < MINOR_ROAD_MAX_CAMERA_HEIGHT;
    if (minorGroup.current.visible !== visible) minorGroup.current.visible = visible;
  });

  return (
    <group name="GeoRoads">
      <group ref={minorGroup} visible={false}>
        {minorRoads.length > 0 && (
          <Line points={minorRoads} segments color="#F3E7B8" lineWidth={1.1} transparent opacity={0.8} />
        )}
      </group>
      <Line points={roads} segments color="#FFF4C2" lineWidth={2.2} transparent opacity={0.95} />
      <Line points={ferries} segments color="#FFFFFF" lineWidth={2} dashed dashSize={2.4} gapSize={1.8} transparent opacity={0.9} />
    </group>
  );
}
