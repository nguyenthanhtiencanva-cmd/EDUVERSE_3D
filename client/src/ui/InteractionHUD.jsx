import React from 'react';
import { ArrowUpDown, BookOpen, CheckCircle2, Info, MessageCircle, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { findNearbyInteraction } from '../player/interactions';

export function InteractionHUD() {
  const worldScope = useStore((state) => state.worldScope);
  const cameraMode = useStore((state) => state.cameraMode);
  const lighthouseLevel = useStore((state) => state.lighthouseLevel);
  const playerPosition = useStore((state) => state.playerPosition);
  const playerTeleport = useStore((state) => state.playerTeleport);
  const activeInteraction = useStore((state) => state.activeInteraction);
  const triggerInteraction = useStore((state) => state.triggerInteraction);
  const closeInteraction = useStore((state) => state.closeInteraction);
  const visitedHotspots = useStore((state) => state.visitedHotspots);
  const vanGiaVisited = useStore((state) => state.vanGiaVisited);
  const campusVisited = useStore((state) => state.campusVisited);

  if (worldScope === 'island') return null;

  const nearby = !activeInteraction
    ? findNearbyInteraction({ worldScope, cameraMode, lighthouseLevel, playerPosition, playerTeleport })
    : null;

  const visitedList =
    worldScope === 'lighthouse'
      ? visitedHotspots
      : worldScope === 'vangia'
      ? vanGiaVisited
      : campusVisited;

  const isVisited = Boolean(nearby?.stopId && visitedList.includes(nearby.stopId));

  const PromptIcon =
    nearby?.kind === 'stairs'
      ? ArrowUpDown
      : nearby?.kind === 'npc'
      ? MessageCircle
      : BookOpen;

  return (
    <>
      {/* Thanh gợi ý tương tác [E] nổi gọn khi nhân vật lại gần bảng / NPC / cửa cầu thang */}
      {nearby && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-30 flex justify-center px-3 sm:bottom-24">
          <button
            type="button"
            onClick={triggerInteraction}
            className="glass-panel pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-amber-400/60 bg-slate-950/85 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl transition hover:scale-[1.02] hover:border-amber-300 active:scale-95 cursor-pointer"
          >
            <kbd className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-amber-400 px-1.5 text-xs font-black text-slate-950 shadow">
              E
            </kbd>
            <PromptIcon className="h-4 w-4 text-amber-300 shrink-0" />
            <span>{nearby.actionLabel}</span>
            {isVisited && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Đã xem
              </span>
            )}
          </button>
        </div>
      )}

      {/* Bảng thông tin chi tiết / Hộp thoại NPC (Chữ + Hình ảnh) */}
      {activeInteraction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm pointer-events-auto"
          onClick={closeInteraction}
        >
          <article
            className="glass-panel w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ảnh minh họa */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-800 sm:h-52">
              <img
                src={activeInteraction.image || '/images/preview_island_overview.png'}
                alt={activeInteraction.title}
                className="h-full w-full object-cover object-center"
                onError={(e) => {
                  e.target.src = '/images/preview_island_overview.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
              <button
                type="button"
                onClick={closeInteraction}
                aria-label="Đóng bảng thông tin"
                className="absolute right-3.5 top-3.5 rounded-full bg-slate-900/80 p-2 text-white/85 transition hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    activeInteraction.kind === 'npc'
                      ? 'bg-sky-400 text-slate-950'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {activeInteraction.category}
                </span>
                {activeInteraction.speaker && (
                  <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-sky-200 border border-sky-400/30">
                    {activeInteraction.speaker}
                  </span>
                )}
              </div>
            </div>

            {/* Nội dung chữ & thông số */}
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
                  {activeInteraction.kind === 'npc' ? (
                    <MessageCircle className="h-5 w-5 shrink-0 text-sky-400" />
                  ) : (
                    <BookOpen className="h-5 w-5 shrink-0 text-amber-400" />
                  )}
                  <span>{activeInteraction.title}</span>
                </h3>
                <p
                  className={`mt-2.5 text-sm leading-relaxed ${
                    activeInteraction.kind === 'npc'
                      ? 'rounded-2xl border-l-4 border-sky-400 bg-sky-950/35 px-3.5 py-2.5 italic text-slate-100'
                      : 'text-slate-200'
                  }`}
                >
                  {activeInteraction.description}
                </p>
              </div>

              {activeInteraction.details?.length > 0 && (
                <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    <Info className="h-3.5 w-3.5" />
                    <span>Thông tin chi tiết</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs">
                    {activeInteraction.details.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-200">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <div>
                          <span className="font-semibold text-white">{item.label}: </span>
                          <span>{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={closeInteraction}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-300 cursor-pointer"
                >
                  <span>Tiếp tục khám phá</span>
                  <kbd className="rounded bg-slate-950/20 px-1.5 py-0.5 text-[11px] font-bold">E / Esc</kbd>
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
