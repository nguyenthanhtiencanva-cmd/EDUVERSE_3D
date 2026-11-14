import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { CampusModel } from './world/CampusModel';
import { IslandModel } from './world/IslandModel';
import { LighthouseScene } from './world/lighthouse/LighthouseScene';
import { CharacterController } from './world/CharacterController';
import { SceneLighting } from './world/SceneLighting';
import { CameraController } from './world/CameraController';
import { HUDOverlay } from './ui/HUDOverlay';
import { CampusTourHUD } from './ui/CampusTourHUD';
import { SceneLoader } from './ui/SceneLoader';
import { PerfProbe, STATS_ENABLED } from './world/PerfProbe';
import { useStore } from './store/useStore';

// Được gắn làm fallback của Suspense, nên chỉ tồn tại trong lúc cảnh hiện tại còn tải mô hình.
function LoadingFlag({ onChange }) {
  useEffect(() => {
    onChange(true);
    return () => onChange(false);
  }, [onChange]);
  return null;
}

const MAX_DPR = { low: 1, medium: 1.5, high: 2 };

export default function LegacyWorld() {
  const worldScope = useStore((state) => state.worldScope);
  const campusTour = useStore((state) => state.campusTour);
  const [loading, setLoading] = useState(false);
  const quality = useStore((state) => state.quality);
  const qualityAuto = useStore((state) => state.qualityAuto);
  const lowerQuality = useStore((state) => state.lowerQuality);
  // Khử răng cưa chỉ chọn được lúc tạo canvas, nên lấy theo mức chất lượng lúc mở cảnh.
  const [antialias] = useState(() => quality !== 'low');

  return (
    <>
      <Canvas
        shadows={quality !== 'low'}
        dpr={[1, MAX_DPR[quality]]}
        camera={{ position: [0, 52, 88], fov: 46, near: 0.2, far: 900 }}
        gl={{ antialias, powerPreference: 'high-performance' }}
      >
        <SceneLighting />
        {qualityAuto && !loading && <PerformanceMonitor onDecline={lowerQuality} />}
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
        {STATS_ENABLED && <PerfProbe />}
      </Canvas>
      {campusTour ? <CampusTourHUD /> : <HUDOverlay />}
      {loading && <SceneLoader />}
      {STATS_ENABLED && (
        <div id="perf-overlay" className="pointer-events-none absolute bottom-1 left-1 z-30 rounded bg-black/70 px-2 py-1 font-mono text-[11px] text-emerald-300" />
      )}
    </>
  );
}
