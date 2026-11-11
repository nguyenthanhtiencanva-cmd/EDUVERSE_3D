import React, { useEffect, useMemo } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { POI_LIST } from '../education/poiData';
import { MapPin } from 'lucide-react';

export function CampusModel() {
  const { scene } = useGLTF('/models/school_campus.glb');
  const setActivePOI = useStore((state) => state.setActivePOI);
  const activePOI = useStore((state) => state.activePOI);
  const cameraMode = useStore((state) => state.cameraMode);

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

      {/* Floating Interactive 3D POI Badges (Visible in Orbit / Flycam mode) */}
      {cameraMode === 'orbit' &&
        POI_LIST.map((poi) => {
          const isSelected = activePOI?.id === poi.id;
          return (
            <group key={poi.id} position={poi.badgePosition}>
              <Html
                center
                distanceFactor={35}
                position={[0, 0, 0]}
                zIndexRange={[100, 0]}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePOI(poi);
                  }}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg transition-all transform cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-900 border-white scale-110 ring-4 ring-amber-400/50'
                      : 'bg-slate-900/90 text-white border-amber-400/40 hover:bg-amber-600 hover:border-white hover:scale-105'
                  }`}
                  style={{ pointerEvents: 'auto', whiteSpace: 'nowrap' }}
                >
                  <span className="p-1 rounded-full bg-amber-400 text-slate-950">
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-semibold tracking-wide pr-1">
                    {poi.title.split('-')[0].trim()}
                  </span>
                </button>
              </Html>
            </group>
          );
        })}
    </group>
  );
}

useGLTF.preload('/models/school_campus.glb');
