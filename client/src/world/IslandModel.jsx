import React, { useEffect, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { LighthouseModel } from './LighthouseModel';
import { MODEL_URLS } from './models';

// Mặt nước, bãi cát, đường và nền sân nằm phẳng nên không cần đổ bóng.
const NO_SHADOW_CAST = /^Mat_(Ocean_|Lake_|Sand_|Coast_|Road_|Ferry_|Courtyard_|Beacon_)/;

export function IslandModel() {
  const { scene } = useGLTF(MODEL_URLS.island);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = !NO_SHADOW_CAST.test(child.material?.name || '');
        child.receiveShadow = true;
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
