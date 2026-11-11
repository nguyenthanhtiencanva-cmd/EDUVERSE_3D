import React from 'react';
import { Canvas } from '@react-three/fiber';
import { CampusModel } from './world/CampusModel';
import { IslandModel } from './world/IslandModel';
import { CharacterController } from './world/CharacterController';
import { SceneLighting } from './world/SceneLighting';
import { CameraController } from './world/CameraController';
import { HUDOverlay } from './ui/HUDOverlay';
import { useStore } from './store/useStore';

export default function LegacyWorld() {
  const worldScope = useStore((state) => state.worldScope);
  return <>
    <Canvas shadows camera={{ position: [0, 52, 88], fov: 46, near: 0.2, far: 900 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <SceneLighting />
      {worldScope === 'island' ? (
        <IslandModel />
      ) : (
        <>
          <CampusModel />
          <CharacterController />
        </>
      )}
      <CameraController />
    </Canvas>
    <HUDOverlay />
  </>;
}
