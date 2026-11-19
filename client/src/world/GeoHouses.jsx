import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import HOUSES from '../education/island-houses.json';
import { useStore } from '../store/useStore';
import { VERTICAL_EXAGGERATION } from './geo';

// Nhà minh họa theo hiện trạng (scripts/build-island-houses.mjs): xếp dọc đường trong vùng dân cư.
// Mỗi kiểu nhà gồm hai InstancedMesh (tường, mái), tổng 12 lệnh vẽ. Hình nhà ở đơn vị "1 = bề ngang nhà",
// mặt trước quay về +Z (phía đường); cỡ trên bản đồ 18–26 m, tức phóng to khoảng 2 lần.
// Màu theo ảnh vệ tinh xóm đường ra Bến Hèn thầy gửi: phần lớn mái ngói cam đỏ, tường vôi trắng, kem.
const WALLS = ['#F4F1EA', '#F1E3C0', '#F2D27A', '#F6EEDD', '#F2C7BD', '#E9EDE4'];
const ROOFS = {
  cap4: ['#C8603A', '#D2713F', '#B9502F', '#C4583A'],
  nha_vuon: ['#CC673C', '#D57A47', '#BC5634', '#A9503A'],
  mai_ton: ['#5C7E94', '#8A8F96', '#9AA3A8'],
  nha_ong: ['#B9B5AA', '#A9A59B'],
  mai_thai: ['#B9442B', '#C65236'],
  quan: ['#D2713F', '#C8603A', '#5C7E94'],
};

// Mái hai dốc: nóc chạy theo trục X.
function gable(width, depth, base, rise, overhang = 0.08) {
  const w = width / 2 + overhang;
  const d = depth / 2 + overhang;
  const v = [
    -w, base, -d, w, base, -d, w, base + rise, 0, -w, base + rise, 0,
    -w, base, d, w, base, d, w, base + rise, 0, -w, base + rise, 0,
    -w, base, -d, -w, base + rise, 0, -w, base, d,
    w, base, -d, w, base, d, w, base + rise, 0,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.setIndex([0, 3, 1, 1, 3, 2, 4, 5, 7, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  geometry.computeVertexNormals();
  return geometry;
}
function hip(width, depth, base, rise) {
  const geometry = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1, true);
  geometry.rotateY(Math.PI / 4);
  geometry.scale(width + 0.16, rise, depth + 0.16);
  geometry.translate(0, base + rise / 2, 0);
  return geometry;
}
const box = (w, h, d, y = h / 2, z = 0) => new THREE.BoxGeometry(w, h, d).translate(0, y, z);
const clean = (g) => {
  g.deleteAttribute('uv');
  return g.index ? g.toNonIndexed() : g;
};
const merge = (parts) => mergeGeometries(parts.map(clean));

// [tường, mái] cho từng kiểu, theo thứ tự HOUSES.types.
const SHAPES = {
  cap4: () => [box(1, 0.5, 0.7), gable(1, 0.7, 0.5, 0.32)],
  // Nhà chính mái ngói, chái bếp thấp hơn vuông góc phía sau bên phải (hình chữ L nhìn từ trên xuống).
  nha_vuon: () => [
    merge([box(1, 0.46, 0.6, 0.23, 0.12), box(0.38, 0.36, 0.56, 0.18, -0.46).translate(0.31, 0, 0)]),
    merge([
      gable(1, 0.6, 0.46, 0.28).translate(0, 0, 0.12),
      gable(0.56, 0.38, 0.36, 0.2, 0.06).rotateY(Math.PI / 2).translate(0.31, 0, -0.46),
    ]),
  ],
  mai_ton: () => [box(1, 0.46, 0.8), gable(1, 0.8, 0.46, 0.16, 0.12)],
  nha_ong: () => [merge([box(0.62, 1.3, 1), box(0.66, 0.12, 1.04, 1.36)]), box(0.6, 0.04, 0.98, 1.3)],
  mai_thai: () => [box(0.9, 0.95, 0.9), hip(0.9, 0.9, 0.95, 0.42)],
  quan: () => [box(1, 0.42, 0.6), merge([box(1.04, 0.05, 0.64, 0.44), box(1, 0.04, 0.4, 0.34, 0.5)])],
};

function HouseType({ type, houses }) {
  const walls = useRef(null);
  const roofs = useRef(null);
  const [wallGeometry, roofGeometry] = useMemo(() => SHAPES[type](), [type]);
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.85 }), []);
  const roofMaterial = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide }), []);

  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    const roofPalette = ROOFS[type];
    houses.forEach(([x, z, ground, facing, , size, wall], i) => {
      position.set(x, ground * VERTICAL_EXAGGERATION - 0.01, z);
      rotation.setFromAxisAngle(up, facing);
      scale.set(size, size, size);
      matrix.compose(position, rotation, scale);
      walls.current.setMatrixAt(i, matrix);
      roofs.current.setMatrixAt(i, matrix);
      walls.current.setColorAt(i, color.set(WALLS[wall % WALLS.length]));
      roofs.current.setColorAt(i, color.set(roofPalette[(i * 7 + wall) % roofPalette.length]));
    });
    for (const mesh of [walls.current, roofs.current]) {
      mesh.count = houses.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [houses, type]);

  if (!houses.length) return null;
  return (
    <>
      <instancedMesh ref={walls} args={[wallGeometry, wallMaterial, houses.length]} frustumCulled={false} />
      <instancedMesh ref={roofs} args={[roofGeometry, roofMaterial, houses.length]} frustumCulled={false} />
    </>
  );
}

export function GeoHouses() {
  const quality = useStore((state) => state.quality);
  const byType = useMemo(() => {
    const visible = quality === 'low' ? HOUSES.houses.filter((_, i) => i % 2 === 0) : HOUSES.houses;
    return HOUSES.types.map((type, index) => [type, visible.filter((house) => house[4] === index)]);
  }, [quality]);
  return (
    <group name="GeoHouses">
      {byType.map(([type, houses]) => (
        <HouseType key={`${type}-${houses.length}`} type={type} houses={houses} />
      ))}
    </group>
  );
}
