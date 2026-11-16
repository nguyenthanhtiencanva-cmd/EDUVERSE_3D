import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { CampusModel } from './world/CampusModel';
import { IslandModel } from './world/IslandModel';
import { GeoIslandModel } from './world/GeoIslandModel';
import { GEO_MAP_ENABLED } from './world/geo';
import { LighthouseScene } from './world/lighthouse/LighthouseScene';
import { VanGiaModel } from './world/vangia/VanGiaModel';
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
// Bản đồ đảo nhìn từ rất xa. Mặt gần 0,2 làm bộ đệm độ sâu không đủ mịn ở khoảng cách đó,
// khiến mặt biển và bờ đất tranh nhau từng điểm ảnh (nhấp nháy). Camera không bao giờ tới gần hơn 12.
const GEO_CAMERA_RANGE = { near: 3, far: 3000 };

// Trình duyệt làm chậm hoặc dừng hẳn việc vẽ khi trang bị ẩn (chuyển tab, thu nhỏ cửa sổ).
// Số đo tốc độ trong lúc đó và vài giây sau khi quay lại không phản ánh sức máy,
// nên bộ tự hạ chất lượng chỉ chạy khi trang đã hiện ổn định.
const STEADY_DELAY_MS = 4000;

function usePageSteady() {
  const [steady, setSteady] = useState(() => !document.hidden);
  useEffect(() => {
    let timer;
    const update = () => {
      clearTimeout(timer);
      if (document.hidden) setSteady(false);
      else timer = setTimeout(() => setSteady(true), STEADY_DELAY_MS);
    };
    document.addEventListener('visibilitychange', update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return steady;
}

export default function LegacyWorld() {
  const worldScope = useStore((state) => state.worldScope);
  const campusTour = useStore((state) => state.campusTour);
  const [loading, setLoading] = useState(false);
  const pageSteady = usePageSteady();
  const geoIsland = GEO_MAP_ENABLED && worldScope === 'island';
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
        camera={{ position: [0, 52, 88], fov: 46, ...(geoIsland ? GEO_CAMERA_RANGE : { near: 0.2, far: 900 }) }}
        gl={{ antialias, powerPreference: 'high-performance' }}
      >
        <SceneLighting />
        {qualityAuto && !loading && pageSteady && <PerformanceMonitor onDecline={lowerQuality} />}
        <Suspense fallback={<LoadingFlag onChange={setLoading} />}>
          {worldScope === 'island' ? (
            GEO_MAP_ENABLED ? <GeoIslandModel /> : <IslandModel />
          ) : worldScope === 'lighthouse' ? (
            <>
              <LighthouseScene />
              <CharacterController key="tourist-lighthouse" tourist />
            </>
          ) : worldScope === 'vangia' ? (
            <>
              <VanGiaModel />
              <CharacterController key="tourist-vangia" tourist />
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
      {GEO_MAP_ENABLED && worldScope === 'island' && (
        <p
          className="pointer-events-none absolute right-2 top-1 z-10 max-w-[60%] text-right text-[9px] leading-tight text-white/75 sm:bottom-1 sm:top-auto sm:max-w-none sm:text-[10px]"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          title="Sentinel-2 cloudless, s2maps.eu, EOX IT Services GmbH (dữ liệu Copernicus Sentinel 2016 đã chỉnh sửa). Cao độ: Copernicus DEM GLO-30. Đường và tuyến phà: © OpenStreetMap contributors (ODbL)."
        >
          Ảnh: Sentinel-2 cloudless © EOX (Copernicus Sentinel 2016) · Cao độ: Copernicus DEM · Đường: © OpenStreetMap
        </p>
      )}
      {STATS_ENABLED && (
        <div id="perf-overlay" className="pointer-events-none absolute bottom-1 left-1 z-30 rounded bg-black/70 px-2 py-1 font-mono text-[11px] text-emerald-300" />
      )}
    </>
  );
}
