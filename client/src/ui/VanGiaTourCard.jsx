import React from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { VAN_GIA_STOPS, nearbyVanGiaStop } from '../world/vangia/layout';

// Thẻ tham quan Cảng Vạn Gia: đứng gần một điểm thì hiện giới thiệu điểm đó,
// còn lại chỉ đường tới điểm chưa đến tiếp theo.
export function VanGiaTourCard() {
  const visited = useStore((state) => state.vanGiaVisited);
  const here = useStore((state) => nearbyVanGiaStop(state.playerPosition));
  const walking = useStore((state) => state.cameraMode === 'fps');
  if (!walking) return null;

  const next = VAN_GIA_STOPS.find((stop) => !visited.includes(stop.id));
  const done = visited.length === VAN_GIA_STOPS.length;

  return (
    <section
      className="glass-panel pointer-events-auto w-full max-w-md rounded-2xl border border-white/15 px-4 py-3 text-slate-100 shadow-xl"
      aria-live="polite"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Đã đến {visited.length}/{VAN_GIA_STOPS.length} điểm ở Cảng Vạn Gia
      </p>
      {here ? (
        <>
          <h2 className="mt-1 text-sm font-bold text-white">{here.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">{here.description}</p>
        </>
      ) : done ? (
        <p className="mt-1 text-xs text-slate-200">Bạn đã tham quan hết cảng. Bấm "Toàn đảo" để đi tiếp.</p>
      ) : (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-200">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span>
            <span className="font-semibold text-white">{next.title}:</span> {next.huongDan}
          </span>
        </p>
      )}
    </section>
  );
}
