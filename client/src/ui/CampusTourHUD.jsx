import React from 'react';
import { ArrowLeft, Eye, Footprints, Plane } from 'lucide-react';
import { useStore } from '../store/useStore';
import { VirtualJoystick } from './VirtualJoystick';

export function CampusTourHUD() {
  const setWorldScope = useStore((state) => state.setWorldScope);
  const cameraMode = useStore((state) => state.cameraMode);
  const setCameraMode = useStore((state) => state.setCameraMode);
  const viewPerspective = useStore((state) => state.viewPerspective);
  const toggleViewPerspective = useStore((state) => state.toggleViewPerspective);
  const walking = cameraMode === 'fps';
  const CameraIcon = walking ? Plane : Footprints;

  return <>
    <header className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-center gap-2 sm:inset-x-5 sm:top-5">
      <button className="glass-panel pointer-events-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white cursor-pointer"
        onClick={() => setWorldScope('island')}>
        <ArrowLeft size={16} /> Về toàn đảo
      </button>
      <div className="glass-panel rounded-xl px-3 py-2.5 text-sm font-bold text-white">Phân hiệu Vĩnh Trung</div>
      <div className="ml-auto flex items-center gap-2">
        {walking && (
          <button
            className="glass-panel pointer-events-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white cursor-pointer"
            onClick={toggleViewPerspective}
            title="Chuyển góc nhìn thứ 1 / thứ 3 (phím V)"
          >
            <Eye size={16} /> {viewPerspective === 'first' ? 'Góc nhìn 1' : 'Góc nhìn 3'}
          </button>
        )}
        <button className="glass-panel pointer-events-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white cursor-pointer"
          onClick={() => setCameraMode(walking ? 'orbit' : 'fps')}>
          <CameraIcon size={16} /> {walking ? 'Toàn cảnh' : 'Đi bộ'}
        </button>
      </div>
    </header>
    {walking && <>
      <p className="tour-desktop-tip glass-panel pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium text-white">
        WASD đi · Shift chạy · V đổi góc nhìn · E tương tác
      </p>
      <VirtualJoystick />
    </>}
  </>;
}
