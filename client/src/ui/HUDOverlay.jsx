import React from 'react';
import { useStore } from '../store/useStore';
import {
  PRESET_VIEWS,
  ACTIVE_ISLAND_VIEWS,
  LIGHTHOUSE_PRESET_VIEWS,
} from '../world/CameraController';
import { POIModal } from './POIModal';
import { VirtualJoystick } from './VirtualJoystick';
import {
  Sun,
  Sunset,
  Moon,
  Gauge,
  Plane,
  Footprints,
  HelpCircle,
  Globe,
  School,
  Landmark,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { preloadScene } from '../world/models';

const QUALITY_LABELS = { low: 'Thấp', medium: 'Vừa', high: 'Cao' };
const NEXT_QUALITY = { low: 'medium', medium: 'high', high: 'low' };

export function HUDOverlay() {
  const worldScope = useStore((state) => state.worldScope);
  const setWorldScope = useStore((state) => state.setWorldScope);
  const cameraMode = useStore((state) => state.cameraMode);
  const setCameraMode = useStore((state) => state.setCameraMode);
  const activeView = useStore((state) => state.activeView);
  const setActiveView = useStore((state) => state.setActiveView);
  const timeOfDay = useStore((state) => state.timeOfDay);
  const quality = useStore((state) => state.quality);
  const setQuality = useStore((state) => state.setQuality);
  const setTimeOfDay = useStore((state) => state.setTimeOfDay);

  const lighthouseLevel = useStore((state) => state.lighthouseLevel);
  const spiralProgress = useStore((state) => state.spiralProgress);
  const climbLighthouse = useStore((state) => state.climbLighthouse);

  const isIsland = worldScope === 'island';
  const isLighthouse = worldScope === 'lighthouse';
  const currentPresets = isIsland
    ? ACTIVE_ISLAND_VIEWS
    : isLighthouse
    ? LIGHTHOUSE_PRESET_VIEWS
    : PRESET_VIEWS;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* TOP BAR */}
      <header className="flex flex-wrap items-start justify-between gap-3 w-full">
        {/* Left: Branding + Multi-Scale Scope Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 pointer-events-auto">
          {/* School Branding Badge */}
          <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl border border-white/15">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg text-lg">
              VT
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-400 tracking-wider">
                  EDUVERSE 3D • QUẢNG NINH
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {isIsland
                  ? 'Sa Bàn Số Đảo Vĩnh Thực & 3 Phân Hiệu'
                  : isLighthouse
                  ? 'Trạm Hải Đăng Vĩnh Thực (1962) • Không Gian 1:1'
                  : 'Trường TH&THCS Vĩnh Thực (Phân Hiệu Vĩnh Trung)'}
              </h1>
            </div>
          </div>

          {/* Multi-Scale World Scope Switcher */}
          <div className="glass-panel p-1 rounded-2xl flex flex-wrap items-center gap-1 shadow-xl border border-amber-400/30">
            <button
              onClick={() => setWorldScope('island')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isIsland
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Xem Sa bàn 3D tổng quan toàn bộ Đảo Vĩnh Thực"
            >
              <Globe className="w-4 h-4" />
              <span>Toàn đảo Vĩnh Thực</span>
            </button>
            <button
              onClick={() => setWorldScope('campus')}
              onPointerEnter={() => preloadScene('campus')}
              onFocus={() => preloadScene('campus')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                worldScope === 'campus'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Vào mô hình 3D chi tiết tỷ lệ 1:1 Phân hiệu Vĩnh Trung"
            >
              <School className="w-4 h-4" />
              <span>Phân hiệu Vĩnh Trung (1:1)</span>
            </button>
            <button
              onClick={() => setWorldScope('lighthouse')}
              onPointerEnter={() => preloadScene('lighthouse')}
              onFocus={() => preloadScene('lighthouse')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isLighthouse
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Tham quan trải nghiệm 1:1 Trạm Hải đăng Vĩnh Thực (1962)"
            >
              <Landmark className="w-4 h-4" />
              <span>Hải đăng Vĩnh Thực (1:1)</span>
            </button>
          </div>
        </div>

        {/* Right Controls: Climb Tower, Mode, Time, Sound */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Quick button to climb up/down the 72-step Spiral Staircase of the 18m Lighthouse Tower */}
          {isLighthouse && (
            <button
              onClick={() =>
                climbLighthouse(lighthouseLevel === 'balcony' ? 'ground' : 'balcony')
              }
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-xl border border-white/40 flex items-center gap-1.5 transition transform hover:scale-105 cursor-pointer"
            >
              {lighthouseLevel === 'spiral' ? (
                <>
                  <ArrowUpCircle className="w-4 h-4 animate-spin" />
                  <span>
                    Thang xoắn ốc: Bậc {Math.max(1, Math.round(spiralProgress * 72))}/72
                  </span>
                </>
              ) : lighthouseLevel === 'balcony' ? (
                <>
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Đi cầu thang xuống sân</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Leo cầu thang lên đỉnh tháp (72 bậc)</span>
                </>
              )}
            </button>
          )}

          {/* Exploration Mode Switcher (Flycam vs Walk in 1:1 modes) */}
          {!isIsland && (
            <div className="glass-panel p-1 rounded-2xl flex items-center gap-1 shadow-lg">
              <button
                onClick={() => setCameraMode('orbit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  cameraMode === 'orbit'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Chế độ Flycam quan sát toàn cảnh"
              >
                <Plane className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flycam</span>
              </button>
              <button
                onClick={() => setCameraMode('fps')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  cameraMode === 'fps'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Camera bám theo góc nhìn thứ 3 phía sau nhân vật"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Góc nhìn thứ 3</span>
              </button>
            </div>
          )}

          {/* Time of Day Cycle */}
          <div className="glass-panel p-1 rounded-2xl flex items-center gap-1 shadow-lg">
            <button
              onClick={() => setTimeOfDay('day')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                timeOfDay === 'day'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ban ngày nắng ấm"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTimeOfDay('sunset')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                timeOfDay === 'sunset'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hoàng hôn vàng rực"
            >
              <Sunset className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTimeOfDay('night')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                timeOfDay === 'night'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Đêm trăng lên đèn (Xem hải đăng quét sáng)"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Mức chất lượng hình ảnh: bấm để chuyển Thấp -> Vừa -> Cao */}
          <button
            onClick={() => setQuality(NEXT_QUALITY[quality])}
            className="glass-panel flex items-center gap-1.5 px-2.5 py-2 rounded-2xl text-xs font-semibold text-slate-200 hover:text-amber-400 transition shadow-lg cursor-pointer"
            title="Chất lượng hình ảnh. Chọn Thấp nếu máy chạy giật."
          >
            <Gauge className="w-4 h-4" />
            <span>{QUALITY_LABELS[quality]}</span>
          </button>
        </div>
      </header>

      {/* BOTTOM SECTION */}
      <footer className="flex flex-col items-center gap-2.5 w-full">
        {/* Preset Viewpoints Dock (Visible in Flycam mode) */}
        {cameraMode === 'orbit' && (
          <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xl pointer-events-auto max-w-full overflow-x-auto scrollbar-none border border-white/15">
            {Object.entries(currentPresets).map(([key, view]) => {
              const isActive = activeView === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveView(key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition transform cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {view.name}
                </button>
              );
            })}
          </div>
        )}
      </footer>

      {/* Mobile Virtual Joystick */}
      <VirtualJoystick />

      {/* Point of Interest Information Modal */}
      <POIModal />
    </div>
  );
}
