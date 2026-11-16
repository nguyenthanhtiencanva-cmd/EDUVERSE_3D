import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Gauge, Map as MapIcon, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { rideInput, useRideStore } from '../store/useRideStore';
import PLACES from '../education/island-places.json';

const hold = (key) => ({
  onPointerDown: (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    rideInput[key] = true;
  },
  onPointerUp: () => { rideInput[key] = false; },
  onPointerCancel: () => { rideInput[key] = false; },
  onLostPointerCapture: () => { rideInput[key] = false; },
  onContextMenu: (event) => event.preventDefault(),
});

const ROUND = 'pointer-events-auto glass-panel grid place-items-center rounded-full border border-white/20 text-white shadow-xl select-none touch-none cursor-pointer';

// Bảng điều khiển khi lái xe máy trên bản đồ đảo: ga, phanh, chọn hướng ở ngã rẽ, quay đầu.
export function RideHUD() {
  const steer = useRideStore((state) => state.steer);
  const setSteer = useRideStore((state) => state.setSteer);
  const junction = useRideStore((state) => state.junction);
  const speedKmh = useRideStore((state) => state.speedKmh);
  const visited = useRideStore((state) => state.visited);
  const stopRide = useRideStore((state) => state.stopRide);
  const cardOpen = useStore((state) => !!state.activePOI);

  const exit = () => {
    stopRide();
    useStore.getState().setActiveView('island_overview');
  };

  const turnButton = (direction, available, Icon, label) => (
    <button
      onClick={() => setSteer(direction)}
      disabled={!available}
      aria-pressed={steer === direction}
      aria-label={label}
      className={`${ROUND} h-14 w-14 ${steer === direction ? '!border-emerald-400 bg-emerald-500/80' : ''} ${available ? '' : 'opacity-35'}`}
    >
      <Icon className="h-6 w-6" />
    </button>
  );

  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-24 z-20 flex -translate-x-1/2 flex-col items-center gap-2 sm:top-20">
        <div className="glass-panel flex items-center gap-3 rounded-full border border-white/15 px-4 py-1.5 text-sm font-bold text-white shadow-xl">
          <span className="flex items-center gap-1.5"><Gauge className="h-4 w-4 text-amber-400" />{speedKmh} km/h</span>
          <span className="text-slate-300">Đã thăm {visited.length}/{PLACES.length}</span>
        </div>
        {junction && !cardOpen && (
          <div className="glass-panel rounded-full border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-200 shadow-lg" role="status">
            {junction.deadEnd
              ? 'Sắp hết đường, hãy quay đầu'
              : steer === -1 ? 'Sẽ rẽ trái ở ngã tới' : steer === 1 ? 'Sẽ rẽ phải ở ngã tới' : 'Sắp tới ngã rẽ: chọn hướng, hoặc đi thẳng'}
          </div>
        )}
      </div>

      <button onClick={exit} className="pointer-events-auto glass-panel absolute right-3 top-24 z-20 flex items-center gap-2 rounded-2xl border border-white/15 px-3 py-2 text-sm font-semibold text-white shadow-xl transition hover:text-amber-300 cursor-pointer sm:top-20">
        <MapIcon className="h-4 w-4" /> Về bản đồ
      </button>

      {!cardOpen && (
        <>
          <div className="absolute bottom-6 left-4 z-20 flex items-end gap-3">
            {turnButton(-1, !!junction?.left, ArrowLeft, 'Rẽ trái ở ngã tới')}
            {turnButton(1, !!junction?.right, ArrowRight, 'Rẽ phải ở ngã tới')}
            <button onClick={() => { rideInput.uTurn = true; }} aria-label="Quay đầu xe" className={`${ROUND} h-12 w-12`}>
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-6 right-4 z-20 flex items-end gap-3">
            <button {...hold('brake')} aria-label="Phanh" className={`${ROUND} h-14 w-14 text-xs font-bold`}>Phanh</button>
            <button {...hold('throttle')} aria-label="Ga" className={`${ROUND} h-20 w-20 !border-amber-300/60 bg-amber-500/80 text-slate-950`}>
              <ArrowUp className="h-8 w-8" />
            </button>
          </div>
          <p className="pointer-events-none absolute bottom-1 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap text-[11px] text-white/80 sm:block" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            W hoặc ↑: ga · S hoặc ↓: phanh · A, D hoặc ←, →: chọn hướng rẽ · Phím cách: quay đầu
          </p>
        </>
      )}
    </>
  );
}
