import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_URLS } from './models';
import { buildCampusCollision } from './campusCollision';

// Mặt phẳng nằm sát đất, kính, đèn và cờ dây không cần đổ bóng.
const NO_SHADOW_CAST = /^MAT_(Yard_|Marking_|Terrain_|Road_|Water_|Glass_|Light_Glow|Bunt_|Sign_)/;

export function CampusModel() {
  const { scene } = useGLTF(MODEL_URLS.campus);

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = !NO_SHADOW_CAST.test(child.material?.name || '');
      child.receiveShadow = true;
      ['map', 'normalMap', 'bumpMap', 'roughnessMap'].forEach((key) => {
        const texture = child.material?.[key];
        if (!texture) return;
        texture.anisotropy = 8;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
      });
    });
    return buildCampusCollision(scene);
  }, [scene]);

  return (
    <group name="Campus_Root">
      <primitive object={scene} />
    </group>
  );
}
