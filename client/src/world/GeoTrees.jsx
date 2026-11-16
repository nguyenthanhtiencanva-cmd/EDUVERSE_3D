import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import TREES from '../education/island-trees.json';
import { useStore } from '../store/useStore';
import { VERTICAL_EXAGGERATION } from './geo';

// Cây minh họa trên đồi, đặt theo vùng thực vật của ảnh vệ tinh (scripts/build-island-trees.mjs).
// Tất cả cây là một InstancedMesh, tức một lệnh vẽ. Cây được phóng to (cao khoảng 45 m)
// cho tương xứng với chiều đứng đã phóng đại của địa hình.
const QUALITY_SHARE = { low: 3, medium: 2, high: 1 }; // Mức Thấp vẽ 1/3 số cây, mức Vừa 1/2

function part(geometry, color, y) {
  geometry.translate(0, y, 0);
  const shade = new THREE.Color(color);
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) shade.toArray(colors, i);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.deleteAttribute('uv');
  return geometry;
}

function makeTreeGeometry() {
  return mergeGeometries([
    // Bỏ các mặt đáy (không bao giờ nhìn thấy từ trên cao): mỗi cây còn 20 tam giác.
    part(new THREE.CylinderGeometry(0.025, 0.035, 0.12, 4, 1, true), '#6B4A2E', 0.06),
    part(new THREE.ConeGeometry(0.17, 0.3, 6, 1, true), '#2F7A3A', 0.25),
    part(new THREE.ConeGeometry(0.12, 0.22, 6, 1, true), '#3E9246', 0.4),
  ]);
}

export function GeoTrees() {
  const mesh = useRef(null);
  const quality = useStore((state) => state.quality);
  const geometry = useMemo(makeTreeGeometry, []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }), []);
  const trees = useMemo(() => TREES.trees.filter((_, index) => index % QUALITY_SHARE[quality] === 0), [quality]);

  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const tint = new THREE.Color();
    trees.forEach(([x, z, ground, size], index) => {
      position.set(x, ground * VERTICAL_EXAGGERATION - 0.02, z);
      rotation.setFromAxisAngle(up, (index * 2.399) % (Math.PI * 2));
      scale.set(size, size * (0.9 + ((index * 7) % 5) * 0.06), size);
      mesh.current.setMatrixAt(index, matrix.compose(position, rotation, scale));
      // Đổi sắc xanh nhẹ giữa các cây cho rừng bớt đều màu.
      mesh.current.setColorAt(index, tint.setHSL(0.27 + ((index * 13) % 10) * 0.008, 0.55, 0.42 + ((index * 17) % 10) * 0.018));
    });
    mesh.current.count = trees.length;
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [trees]);

  return <instancedMesh ref={mesh} args={[geometry, material, TREES.trees.length]} name="GeoTrees" frustumCulled={false} />;
}
