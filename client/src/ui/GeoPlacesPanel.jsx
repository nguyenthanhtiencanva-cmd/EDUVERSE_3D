import React, { useState } from 'react';
import { Compass, List, MapPin, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ISLAND_POI_LIST } from '../education/poiData';
import PLACES from '../education/island-places.json';

const CONFIDENCE_NOTES = {
  confirmed: 'Vị trí đã được xác nhận.',
  osm: 'Vị trí theo OpenStreetMap.',
  'osm-unnamed': 'Vị trí theo OpenStreetMap, chờ đối chiếu thực địa.',
  estimated: 'Vị trí ước lượng, chờ đối chiếu thực địa.',
};
// Các dòng thông số mô tả sa bàn vẽ tay cũ, không còn đúng với bản đồ này.
const OLD_DIORAMA_DETAIL = /bản đồ|3D/i;

const ORDERED_PLACES = [...PLACES].sort((a, b) => a.priority - b.priority);
const poiFor = (place) => ISLAND_POI_LIST.find((poi) => poi.id === place.poiId);

// Danh sách các chặng và thẻ thông tin gọn của bản đồ đảo dữ liệu thật.
// Thẻ nằm ở mép dưới để vẫn thấy camera bay tới địa danh.
export function GeoPlacesPanel() {
  const activePOI = useStore((state) => state.activePOI);
  const setActivePOI = useStore((state) => state.setActivePOI);
  const setWorldScope = useStore((state) => state.setWorldScope);
  const [listOpen, setListOpen] = useState(false);

  const place = activePOI && PLACES.find((item) => item.poiId === activePOI.id);
  const frame = 'pointer-events-auto glass-panel absolute bottom-20 left-3 right-3 z-30 rounded-2xl border border-white/15 shadow-2xl sm:right-auto sm:w-96';

  if (place) {
    const scope = activePOI.hasDetailed3D ? 'campus' : activePOI.hasLighthouse3D ? 'lighthouse' : null;
    const details = (activePOI.details || []).filter((detail) => !OLD_DIORAMA_DETAIL.test(detail.label));
    return (
      <section className={`${frame} max-h-[46vh] overflow-y-auto p-4`} aria-label={place.name}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              {activePOI.category.replace(/\s*\(.*\)$/, '')}
            </p>
            <h2 className="mt-0.5 text-base font-bold text-white">{place.name}</h2>
          </div>
          <button
            onClick={() => setActivePOI(null)}
            className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{activePOI.description}</p>
        {details.length > 0 && (
          <dl className="mt-3 space-y-1.5 text-xs">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className="inline font-semibold text-white">{detail.label}: </dt>
                <dd className="inline text-slate-300">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-400">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            {place.latitude.toFixed(5)}° B, {place.longitude.toFixed(5)}° Đ. {CONFIDENCE_NOTES[place.confidence]}
          </span>
        </p>
        {scope && (
          <button
            onClick={() => {
              setActivePOI(null);
              setWorldScope(scope);
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-300 cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            Vào tham quan 1:1
          </button>
        )}
      </section>
    );
  }

  if (listOpen) {
    return (
      <section className={`${frame} max-h-[46vh] overflow-y-auto p-2`} aria-label="Các chặng">
        <div className="flex items-center justify-between px-2 py-1">
          <h2 className="text-sm font-bold text-white">Các chặng trên đảo</h2>
          <button
            onClick={() => setListOpen(false)}
            className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Đóng danh sách"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul>
          {ORDERED_PLACES.map((item) => (
            <li key={item.poiId}>
              <button
                onClick={() => {
                  setListOpen(false);
                  setActivePOI(poiFor(item) || null);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-slate-100 transition hover:bg-white/10 cursor-pointer"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.priority === 1 ? 'bg-amber-400' : 'bg-slate-400'}`} />
                <span className="flex-1">{item.name}</span>
                {item.confidence === 'estimated' && <span className="text-[11px] text-slate-400">ước lượng</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <button
      onClick={() => setListOpen(true)}
      className="pointer-events-auto glass-panel absolute bottom-20 left-3 z-30 flex items-center gap-2 rounded-2xl border border-white/15 px-3 py-2 text-sm font-semibold text-white shadow-xl transition hover:text-amber-300 cursor-pointer"
    >
      <List className="h-4 w-4" />
      Các chặng
    </button>
  );
}
