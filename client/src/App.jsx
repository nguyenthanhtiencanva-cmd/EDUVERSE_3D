import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CampusModel } from './world/CampusModel';
import { IslandModel } from './world/IslandModel';
import { SceneLighting } from './world/SceneLighting';
import { CameraController } from './world/CameraController';
import { HUDOverlay } from './ui/HUDOverlay';
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-2xl text-2xl animate-pulse">
        VT
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-white">
          EDUVERSE 3D • ĐẢO VĨNH THỰC
        </h2>
        <p className="text-xs text-amber-400 font-medium">
          Đang tải Sa bàn 3D Đảo Vĩnh Thực & Trường TH&THCS Vĩnh Thực...
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        <span>Khởi tạo đồ họa WebGL PWA...</span>
      </div>
    </div>
  );
}

export default function App() {
  const worldScope = useStore((state) => state.worldScope);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          shadows
          camera={{
            position: [0.0, 52.0, 88.0],
            fov: 46,
            near: 0.2,
            far: 900,
          }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <SceneLighting />
          {worldScope === 'island' ? <IslandModel /> : <CampusModel />}
          <CameraController />
        </Canvas>
      </Suspense>

      {/* 2D HTML/Tailwind HUD UI Overlay */}
      <HUDOverlay />
    </div>
  );
}
