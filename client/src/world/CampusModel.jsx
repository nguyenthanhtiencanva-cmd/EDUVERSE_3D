import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function CampusModel() {
  const { scene } = useGLTF('/models/school_campus.glb');

  // Optimize materials, high-anisotropy PBR textures & shadows on load
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          ['map', 'normalMap', 'bumpMap', 'roughnessMap'].forEach((texKey) => {
            const tex = child.material[texKey];
            if (tex) {
              tex.anisotropy = 16;
              tex.wrapS = THREE.RepeatWrapping;
              tex.wrapT = THREE.RepeatWrapping;
              tex.needsUpdate = true;
            }
          });
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <group name="Campus_Root">
      {/* 3D GLTF Campus Model */}
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/school_campus.glb');
