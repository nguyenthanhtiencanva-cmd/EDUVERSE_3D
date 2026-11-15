import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import ROADS from '../education/island-roads.json';
import { METERS_PER_UNIT, VERTICAL_EXAGGERATION, lonLatToWorld } from './geo';

// Đường nằm cao hơn mặt địa hình một chút để không bị lưới địa hình (đã nén, sai số vài mét) che mất.
const LIFT = 0.1;

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

// Đường chính và tuyến phà của đảo, lấy từ OpenStreetMap (xem scripts/build-island-roads.mjs).
// Toàn bộ đường chính là một lệnh vẽ, tuyến phà là một lệnh vẽ.
export function GeoRoads() {
  const roads = useMemo(() => toSegments(ROADS.roads), []);
  const ferries = useMemo(() => toSegments(ROADS.ferries), []);
  return (
    <group name="GeoRoads">
      <Line points={roads} segments color="#FFF4C2" lineWidth={2.2} transparent opacity={0.95} />
      <Line points={ferries} segments color="#FFFFFF" lineWidth={2} dashed dashSize={2.4} gapSize={1.8} transparent opacity={0.9} />
    </group>
  );
}
