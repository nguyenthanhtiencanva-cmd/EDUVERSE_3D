import React, { useEffect } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { ISLAND_POI_LIST } from '../education/poiData';
import { MapPin, School, Shield, Landmark, Compass } from 'lucide-react';

export function IslandModel() {
  const { scene } = useGLTF('/models/vinh_thuc_island.glb');
  const setActivePOI = useStore((state) => state.setActivePOI);
  const activePOI = useStore((state) => state.activePOI);
  const setWorldScope = useStore((state) => state.setWorldScope);

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

      {/* Floating Interactive 3D POI Badges across Vĩnh Thực Island */}
      {ISLAND_POI_LIST.map((poi) => {
        const isSelected = activePOI?.id === poi.id;
        const isSchool = poi.isSchoolCampus;
        const isMainDetailed = poi.hasDetailed3D;

        return (
          <group key={poi.id} position={poi.badgePosition}>
            <Html
              center
              distanceFactor={68}
              position={[0, 0, 0]}
              zIndexRange={[100, 0]}
            >
              <div className="flex flex-col items-center gap-1" style={{ pointerEvents: 'auto' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePOI(poi);
                  }}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xl transition-all transform cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-white scale-110 ring-4 ring-amber-400/60 font-bold'
                      : isMainDetailed
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-white hover:scale-110 ring-2 ring-amber-300/60 font-bold'
                      : isSchool
                      ? 'bg-amber-500/95 text-slate-950 border-amber-200 hover:bg-amber-400 hover:scale-105 font-semibold'
                      : 'bg-slate-900/90 text-white border-cyan-400/50 hover:bg-cyan-600 hover:border-white hover:scale-105 font-semibold'
                  }`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <span
                    className={`p-1 rounded-full ${
                      isSchool
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-cyan-400 text-slate-950'
                    }`}
                  >
                    {isSchool ? (
                      <School className="w-3.5 h-3.5" />
                    ) : poi.id.includes('bien-phong') ? (
                      <Shield className="w-3.5 h-3.5" />
                    ) : poi.id.includes('le-ba-duc') || poi.id.includes('hai-dang') ? (
                      <Landmark className="w-3.5 h-3.5" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="text-xs tracking-wide pr-1">
                    {poi.shortTitle || poi.title}
                  </span>
                </button>

                {/* Quick 1-click button to enter 1:1 School Model on Phân hiệu Vĩnh Trung */}
                {isMainDetailed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWorldScope('campus');
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold shadow-lg border border-white transition transform hover:scale-105 cursor-pointer flex items-center gap-1"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Compass className="w-3 h-3" />
                    <span>Vào sân trường 1:1</span>
                  </button>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

useGLTF.preload('/models/vinh_thuc_island.glb');
