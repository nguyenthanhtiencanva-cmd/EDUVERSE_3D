import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Hải đăng Vĩnh Thực (1962) — Mô hình 1 (Meshy AI Multi-Image-to-3D từ 4 góc ảnh thực tế)
 * đã được Thầy phê duyệt. Đặt tại mũi cực Đông Bắc đảo Vĩnh Thực.
 */
const LIGHTHOUSE_URL = '/models/hai_dang_vinh_thuc_v2.glb';
const BASE_POSITION = [62.6, 2.474, -22.82];
const TARGET_WIDTH = 8.6;
const ROTATION_Y = 0.17;

export function LighthouseModel() {
  const { scene } = useGLTF(LIGHTHOUSE_URL);

  const { model, scale, height, offset } = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = size.x > 0 ? TARGET_WIDTH / size.x : 1;
    return { model: cloned, scale: s, height: size.y, offset: [-center.x, -box.min.y, -center.z] };
  }, [scene]);

  return (
    <group name="HaiDang_VinhThuc" position={BASE_POSITION} rotation={[0, ROTATION_Y, 0]} scale={scale}>
      <primitive object={model} position={offset} />
      {/* Ánh đèn hải đăng phát sáng ở đỉnh tháp */}
      <pointLight position={[-0.66, height * 0.94, -0.14]} color="#fff2a0" intensity={2.5} distance={45} />
    </group>
  );
}

useGLTF.preload(LIGHTHOUSE_URL);
