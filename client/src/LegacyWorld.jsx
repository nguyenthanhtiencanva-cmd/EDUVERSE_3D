import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { CampusModel } from './world/CampusModel';
import { IslandModel } from './world/IslandModel';
import { LighthouseScene } from './world/lighthouse/LighthouseScene';
import { CharacterController } from './world/CharacterController';
import { SceneLighting } from './world/SceneLighting';
import { CameraController } from './world/CameraController';
import { HUDOverlay } from './ui/HUDOverlay';
import { CampusTourHUD } from './ui/CampusTourHUD';
import { SceneLoader } from './ui/SceneLoader';
import { useStore } from './store/useStore';

// Được gắn làm fallback của Suspense, nên chỉ tồn tại trong lúc cảnh hiện tại còn tải mô hình.
function LoadingFlag({ onChange }) {
  useEffect(() => {
    onChange(true);
    return () => onChange(false);
  }, [onChange]);
  return null;
}

export default function LegacyWorld() {
  const worldScope = useStore((state) => state.worldScope);
  const campusTour = useStore((state) => state.campusTour);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 52, 88], fov: 46, near: 0.2, far: 900 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <SceneLighting />
        <Suspense fallback={<LoadingFlag onChange={setLoading} />}>
          {worldScope === 'island' ? (
            <IslandModel />
          ) : worldScope === 'lighthouse' ? (
            <>
              <LighthouseScene />
              <CharacterController key="tourist-lighthouse" tourist />
            </>
          ) : (
            <>
              <CampusModel />
              <CharacterController key="tourist-meshy" tourist />
            </>
          )}
        </Suspense>
        <CameraController />
      </Canvas>
      {campusTour ? <CampusTourHUD /> : <HUDOverlay />}
      {loading && <SceneLoader />}
    </>
  );
}
