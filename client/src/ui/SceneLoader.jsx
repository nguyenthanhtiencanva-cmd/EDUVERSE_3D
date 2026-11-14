import React from 'react';
import { useProgress } from '@react-three/drei';

export function SceneLoader() {
  const progress = useProgress((state) => state.progress);
  const percent = Math.round(progress);
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center" role="status">
      <div className="glass-panel w-64 rounded-2xl p-4 text-center shadow-2xl">
        <p className="text-sm font-semibold text-white">Đang tải mô hình 3D… {percent}%</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-amber-400 transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}
