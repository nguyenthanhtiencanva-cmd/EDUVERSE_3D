import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Hải đăng Vĩnh Thực (1962) — mô hình chi tiết tạo bằng Meshy AI Image-to-3D
 * từ ảnh flycam thực tế (tháp đèn kiểu Pháp + nhà quản lý mái ngói đỏ + sân gạch).
 * Tự động chuẩn hoá kích thước và đặt đúng lên bệ ở mũi cực Đông Bắc đảo.
 */
const LIGHTHOUSE_URL = '/models/hai_dang_vinh_thuc.glb';
const BASE_POSITION = [62.6, 2.474, -22.82]; // mặt bệ được dựng trong vinh_thuc_island_v3.glb
const TARGET_WIDTH = 8.4; // bề ngang cả quần thể (tháp + nhà quản lý), vừa với bệ bán kính 4.7
const ROTATION_Y = 0.17; // trục dài song song mũi đảo Đông Bắc, mặt tiền nhìn về phía Nam

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
      <pointLight position={[-0.5, height * 0.92, 0]} color="#fff2a0" intensity={2} distance={40} />
    </group>
  );
}

useGLTF.preload(LIGHTHOUSE_URL);
