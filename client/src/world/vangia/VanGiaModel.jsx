import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { MODEL_URLS } from '../models';
import { buildCampusCollision } from '../campusCollision';
import { useStore } from '../../store/useStore';
import { VAN_GIA_BOUNDS, VAN_GIA_OFFSET, VAN_GIA_PASS_THROUGH } from './layout';

// Mặt nước, đồi, mặt bến, vạch sơn và đèn không cần đổ bóng (chỉ nhận bóng).
const NO_SHADOW_CAST = /^MAT_(Nuoc_bien|Co_doi|Be_tong$|Mat_duong|Vach_son|Den_sang|Chu_)/;

export function VanGiaModel() {
  const { scene } = useGLTF(MODEL_URLS.vanGia);
  const night = useStore((state) => state.timeOfDay === 'night');

  useEffect(() => {
    scene.position.copy(VAN_GIA_OFFSET);
    scene.traverse((child) => {
      if (!child.isMesh) return;
      const name = child.material?.name || '';
      child.castShadow = !NO_SHADOW_CAST.test(name);
      child.receiveShadow = !/^MAT_Nuoc_bien/.test(name);
    });
    return buildCampusCollision(scene, { walkBounds: VAN_GIA_BOUNDS, passThrough: VAN_GIA_PASS_THROUGH });
  }, [scene]);

  // Đèn đường sáng rõ hơn vào ban đêm.
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material?.name === 'MAT_Den_sang') child.material.emissiveIntensity = night ? 4 : 0.6;
    });
  }, [scene, night]);

  return <primitive object={scene} />;
}
