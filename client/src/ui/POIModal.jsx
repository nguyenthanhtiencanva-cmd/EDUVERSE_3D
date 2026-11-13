import React from 'react';
import { useStore } from '../store/useStore';
import { X, Navigation, Building2, Info, CheckCircle2, Compass, Eye } from 'lucide-react';

export function POIModal() {
  const activePOI = useStore((state) => state.activePOI);
  const setActivePOI = useStore((state) => state.setActivePOI);
  const setCameraMode = useStore((state) => state.setCameraMode);
  const worldScope = useStore((state) => state.worldScope);
  const setWorldScope = useStore((state) => state.setWorldScope);

  if (!activePOI) return null;

  const isIsland = worldScope === 'island';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div
        className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/20 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-800">
          <img
            src={activePOI.image}
            alt={activePOI.title}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.src = '/images/preview_aerial_overview.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={() => setActivePOI(null)}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-slate-900/80 text-white/80 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category Pill */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-slate-950">
              {activePOI.category}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{activePOI.title}</span>
            </h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              {activePOI.description}
            </p>
          </div>

          {/* Architectural Details */}
          {activePOI.details && (
            <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>Thông Số & Giá Trị Lịch Sử - Kiến Trúc</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {activePOI.details.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">{item.label}: </span>
                      <span>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {isIsland && activePOI.hasDetailed3D ? (
              <button
                onClick={() => {
                  setActivePOI(null);
                  setWorldScope('campus');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Vào khuôn viên Phân hiệu Vĩnh Trung (1:1)</span>
              </button>
            ) : isIsland && activePOI.hasLighthouse3D ? (
              <button
                onClick={() => {
                  setActivePOI(null);
                  setWorldScope('lighthouse');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition shadow-lg cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Vào tham quan Trạm Hải đăng Vĩnh Thực (1:1)</span>
              </button>
            ) : isIsland ? (
              <button
                onClick={() => {
                  setActivePOI(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Ngắm cận cảnh 3D tại địa danh này</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setActivePOI(null);
                  setCameraMode('fps');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Đi bộ khám phá tại đây</span>
              </button>
            )}
            <button
              onClick={() => setActivePOI(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition border border-white/10 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
