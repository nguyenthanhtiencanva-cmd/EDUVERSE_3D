import React, { useEffect, useRef } from 'react';
import { BookOpen, CheckCircle2, Compass, ExternalLink, MapPin, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { LIGHTHOUSE_REFERENCE, LIGHTHOUSE_STOPS, nearbyLighthouseStop } from '../world/lighthouse/tour';

function StopCard({ stop, onClose }) {
  const dialog = useRef(null);
  const closeButton = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    closeButton.current.focus();
    return () => {
      element.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="lighthouse-stop-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-slate-900 p-5 text-white shadow-2xl backdrop:bg-slate-950/65 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-amber-300">
            Điểm {LIGHTHOUSE_STOPS.indexOf(stop) + 1}/{LIGHTHOUSE_STOPS.length}
          </p>
          <h2 id="lighthouse-stop-title" className="mt-1 text-lg font-bold">{stop.title}</h2>
        </div>
        <button
          type="button"
          ref={closeButton}
          aria-label="Đóng thẻ kiến thức"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
        >
          <X size={19} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-200">{stop.description}</p>
      <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3">
        <p className="text-xs font-semibold text-amber-200">Câu hỏi quan sát</p>
        <p className="mt-1 text-sm leading-relaxed">{stop.question}</p>
      </div>
      <a
        href={LIGHTHOUSE_REFERENCE}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-200 underline underline-offset-4"
      >
        Xem ảnh thực địa <ExternalLink size={14} aria-hidden="true" />
      </a>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-200"
      >
        Tiếp tục tham quan
      </button>
    </dialog>
  );
}

export function LighthouseTour() {
  const walking = useStore((state) => state.cameraMode === 'fps');
  const climbing = useStore((state) => state.lighthouseLevel === 'spiral');
  const visited = useStore((state) => state.visitedHotspots);
  const nearby = useStore(nearbyLighthouseStop);
  const activeStop = useStore((state) => state.activeHotspot);
  const open = useStore((state) => state.openLighthouseStop);
  const close = useStore((state) => state.closeLighthouseStop);
  const next = LIGHTHOUSE_STOPS.find((stop) => !visited.includes(stop.id));

  return (
    <div className="w-full">
      <section aria-label="Tuyến tham quan hải đăng" className="glass-panel pointer-events-auto w-fit max-w-full rounded-xl border border-white/15 px-3 py-2 text-xs text-white">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 font-bold">
            <Compass size={15} className="text-amber-300" aria-hidden="true" />
            Đã khám phá {visited.length}/{LIGHTHOUSE_STOPS.length}
          </span>
          {nearby && (
            <button
              type="button"
              onClick={open}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-300 px-3 font-bold text-slate-950 hover:bg-amber-200"
            >
              <BookOpen size={15} aria-hidden="true" />
              {visited.includes(nearby.id) ? 'Xem lại' : 'Xem chi tiết'} · {nearby.title}
            </button>
          )}
        </div>
        <p className="mt-1 text-slate-200" aria-live="polite">
          {!next ? 'Đã hoàn thành tuyến tham quan.'
            : !walking ? 'Chuyển sang chế độ đi bộ để khám phá.'
            : climbing ? 'Tiếp tục di chuyển trên cầu thang trong tháp.'
            : nearby?.id === next.id ? 'Em đã đến điểm khám phá. Mở thẻ để xem.'
            : next.directions}
        </p>
        <details className="mt-1">
          <summary className="w-fit cursor-pointer py-1 text-slate-200">Các điểm tham quan</summary>
          <ol className="mt-1 space-y-1.5">
            {LIGHTHOUSE_STOPS.map(({ id, title }) => (
              <li key={id} className="flex items-center gap-1.5">
                {visited.includes(id)
                  ? <CheckCircle2 size={14} className="text-emerald-300" aria-label="Đã khám phá" />
                  : <MapPin size={14} className="text-amber-300" aria-label="Chưa khám phá" />}
                {title}
              </li>
            ))}
          </ol>
        </details>
      </section>
      {activeStop && <StopCard stop={activeStop} onClose={close} />}
    </div>
  );
}
