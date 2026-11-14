import React, { useEffect, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LighthouseModel } from './LighthouseModel';
import { MODEL_URLS } from './models';

export function IslandModel() {
  const { scene } = useGLTF(MODEL_URLS.island);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <group name="VinhThuc_Island_Root">
      <primitive object={scene} />

      {/* Hải đăng Vĩnh Thực chi tiết (Meshy AI Image-to-3D từ ảnh thực tế) */}
      <Suspense fallback={null}>
        <LighthouseModel />
      </Suspense>
    </group>
  );
}
