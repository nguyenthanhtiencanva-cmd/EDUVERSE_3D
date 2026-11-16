import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import vehicleUrl from '../assets/models/xe_may.glb?url';

// Xe máy và người lái, tạo bằng Meshy (nguồn: assets/web-models/xe_may_du_khach.glb).
// Mô hình gốc nằm dọc trục X; ở đây xoay cho đầu xe hướng về +Z, đặt bánh chạm đất
// và phóng to (dài khoảng 260 m trên bản đồ) để còn nhìn thấy từ camera bám theo.
const LENGTH = 2.6;
const FRONT_ROTATION = -Math.PI / 2;

export function RideVehicle() {
  const { scene } = useGLTF(vehicleUrl);
  const { model, scale, lift } = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const factor = LENGTH / Math.max(size.x, size.z);
    return { model: cloned, scale: factor, lift: -box.min.y * factor };
  }, [scene]);

  return (
    <group position={[0, lift, 0]} rotation-y={FRONT_ROTATION} scale={scale}>
      <primitive object={model} />
    </group>
  );
}
