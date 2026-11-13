import React from 'react';
import { useStore } from '../store/useStore';
import { PRESET_VIEWS, ISLAND_PRESET_VIEWS } from '../world/CameraController';
import { MiniMap } from './MiniMap';
import { POIModal } from './POIModal';
import { VirtualJoystick } from './VirtualJoystick';
import {
  Sun,
  Sunset,
  Moon,
  Volume2,
  VolumeX,
  Footprints,
  Plane,
  HelpCircle,
  Globe,
  School,
} from 'lucide-react';

export function HUDOverlay() {
  const worldScope = useStore((state) => state.worldScope);
  const setWorldScope = useStore((state) => state.setWorldScope);
  const cameraMode = useStore((state) => state.cameraMode);
  const setCameraMode = useStore((state) => state.setCameraMode);
  const activeView = useStore((state) => state.activeView);
  const setActiveView = useStore((state) => state.setActiveView);
  const timeOfDay = useStore((state) => state.timeOfDay);
  const setTimeOfDay = useStore((state) => state.setTimeOfDay);
  const soundEnabled = useStore((state) => state.soundEnabled);
  const setSoundEnabled = useStore((state) => state.setSoundEnabled);

  const isIsland = worldScope === 'island';
  const currentPresets = isIsland ? ISLAND_PRESET_VIEWS : PRESET_VIEWS;

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
                  : 'Trường TH&THCS Vĩnh Thực (Phân Hiệu Vĩnh Trung)'}
              </h1>
            </div>
          </div>

          {/* Multi-Scale World Scope Switcher (Toàn đảo <-> Phân hiệu Vĩnh Trung 1:1) */}
          <div className="glass-panel p-1 rounded-2xl flex items-center gap-1 shadow-xl border border-amber-400/30">
            <button
              className="px-3 py-2 rounded-xl text-xs font-bold text-cyan-200 hover:bg-white/10"
              onClick={() => setWorldScope('geographic')}
            >
              Bản đồ địa lý
            </button>
            <button
              onClick={() => setWorldScope('island')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                !isIsland
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Vào mô hình 3D chi tiết tỷ lệ 1:1 Phân hiệu Vĩnh Trung"
            >
              <School className="w-4 h-4" />
              <span>Phân hiệu Vĩnh Trung (1:1)</span>
            </button>
          </div>
        </div>

        {/* Right Controls: Mode, Time, Sound & Minimap */}
        <div className="flex items-start gap-2.5 pointer-events-auto">
          {/* Exploration Mode Switcher (Flycam vs Walk in Campus mode) */}
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
                title="Chế độ đi bộ khám phá 1:1"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đi bộ</span>
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
              title="Đêm trăng lên đèn"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="glass-panel p-2 rounded-2xl text-slate-300 hover:text-amber-400 transition shadow-lg cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* MiniMap Radar */}
          <MiniMap />
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

        {/* Controls Instructions Banner */}
        <div className="glass-panel px-4 py-1.5 rounded-full text-xs text-slate-300 shadow-md flex items-center gap-2 border border-white/10">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          {cameraMode === 'fps' ? (
            <span>
              Phím <strong className="text-white">W, A, S, D</strong> / Mũi tên: Đi bộ |{' '}
              <strong className="text-white">Shift</strong>: Chạy nhanh |{' '}
              <strong className="text-white">Kéo chuột</strong>: Xoay 360° |{' '}
              <strong className="text-white">Cuộn chuột</strong>: Thu phóng |{' '}
              <strong className="text-white">Space</strong>: Nhảy bậc thềm
            </span>
          ) : isIsland ? (
            <span>
              Sa bàn 3D Đảo Vĩnh Thực: Nhấp vào các ghim địa danh hoặc bấm{' '}
              <strong className="text-amber-400">Vào sân trường 1:1</strong> tại Phân hiệu Vĩnh Trung để khám phá chi tiết
            </span>
          ) : (
            <span>
              Kéo chuột trái: Xoay 360° | Chuột phải / 2 ngón: Trượt góc nhìn | Cuộn chuột: Phóng to/thu nhỏ | Bấm vào ghim để xem chi tiết
            </span>
          )}
        </div>
      </footer>

      {/* Mobile Virtual Joystick */}
      <VirtualJoystick />

      {/* Point of Interest Information Modal */}
      <POIModal />
    </div>
  );
}
