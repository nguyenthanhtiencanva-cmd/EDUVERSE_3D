import React from 'react';
import { Canvas } from '@react-three/fiber';
import { CampusModel } from './world/CampusModel';
import { IslandModel } from './world/IslandModel';
import { LighthouseScene } from './world/lighthouse/LighthouseScene';
import { CharacterController } from './world/CharacterController';
import { SceneLighting } from './world/SceneLighting';
import { CameraController } from './world/CameraController';
import { HUDOverlay } from './ui/HUDOverlay';
import { CampusTourHUD } from './ui/CampusTourHUD';
import { useStore } from './store/useStore';

export default function LegacyWorld() {
  const worldScope = useStore((state) => state.worldScope);
  const campusTour = useStore((state) => state.campusTour);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 52, 88], fov: 46, near: 0.2, far: 900 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <SceneLighting />
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
        <CameraController />
      </Canvas>
      {campusTour ? <CampusTourHUD /> : <HUDOverlay />}
    </>
  );
}
