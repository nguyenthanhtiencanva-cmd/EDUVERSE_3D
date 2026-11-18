import React from 'react';
import { Anchor, Baby, Landmark, MapPin, School, Shield, TreePalm } from 'lucide-react';

// Biểu tượng hải đăng vẽ tay, vì bộ biểu tượng đang dùng không có sẵn.
function LighthouseIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 21 11 9h2l1.5 12Z" />
      <path d="M10 9V6h4v3" />
      <path d="M12 6V3.5" />
      <path d="M6 21h12" />
      <path d="M4 5.5 7.5 7M20 5.5 16.5 7" />
    </svg>
  );
}

const ICONS = {
  lighthouse: LighthouseIcon,
  school: School,
  kindergarten: Baby,
  pier: Anchor,
  beach: TreePalm,
  post: Shield,
  temple: Landmark,
};

const LABEL = 'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold text-white shadow-lg transition';
const LABEL_IDLE = 'border-white/15 bg-[#1B2B50]/95 group-hover:bg-[#263A6B]';
const LABEL_ACTIVE = 'border-emerald-400 bg-[#1B2B50] ring-2 ring-emerald-400/70';

// Ghim địa danh trên bản đồ đảo.
// - Chặng ưu tiên: ghim giọt nước màu vàng có biểu tượng, mũi ghim chạm đúng vị trí, nhãn nằm bên cạnh.
// - Địa danh phụ: nhãn có chấm vàng, đặt ngay trên vị trí.
// - Điểm đang chọn: nhãn viền xanh lá.
export function GeoPin({ place, active, onSelect, side, offset = 0, short = false, compact = false, callout = null }) {
  const estimated = place.confidence === 'estimated';
  const title = estimated ? `${place.name} (vị trí ước lượng, chờ đối chiếu thực địa)` : place.name;
  // Tên ngắn (shortName trong island-places.json) dùng khi tên đầy đủ không còn chỗ trên màn hình.
  const text = `${short && place.shortName ? place.shortName : place.name}${estimated ? ' ?' : ''}`;
  const labelClass = `${LABEL} ${active ? LABEL_ACTIVE : LABEL_IDLE}`;

  if (place.priority !== 1) {
    return (
      <button onClick={onSelect} title={title} className="group cursor-pointer" style={{ transform: 'translate(-50%, -100%)' }}>
        <span className={`${labelClass} flex items-center gap-1.5 !px-2.5 !py-1 !text-[11px]`}>
          <span className="grid h-3 w-3 place-items-center rounded-full bg-amber-400">
            <span className="h-1 w-1 rounded-full bg-[#1B2B50]" />
          </span>
          {text}
        </span>
      </button>
    );
  }

  const Icon = ICONS[place.kind] || MapPin;
  const gradient = `geo-pin-${place.poiId}`;
  // Phía của nhãn do bộ xếp nhãn (world/labelLayout.js) chọn theo góc nhìn, để nhãn không đè lên nhau.
  // Không còn chỗ trống thì nhãn ẩn, rê chuột hoặc chọn ghim mới hiện. `labelSide` trong dữ liệu là phía ưu tiên.
  const LABEL_SIDES = {
    left: 'top-[3px] right-full mr-1.5',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    top: 'bottom-full mb-1.5 left-1/2 -translate-x-1/2',
    right: 'top-[3px] left-full ml-1.5',
    'bottom-right': 'top-full mt-2 left-1/2',
    'bottom-left': 'top-full mt-2 right-1/2',
    'top-right': 'bottom-full mb-1.5 left-1/2',
    'top-left': 'bottom-full mb-1.5 right-1/2',
    'bottom-far': 'top-full mt-[42px] left-1/2 -translate-x-1/2',
    // Nhãn ẩn không nhận chuột, để không chặn cú bấm vào ghim bên cạnh.
    hidden: 'pointer-events-none top-[3px] left-full ml-1.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
  };
  const labelSide = active && side === 'hidden' ? 'right' : side || place.labelSide || 'right';
  return (
    <button
      onClick={onSelect}
      title={title}
      className="group relative block h-11 w-[34px] cursor-pointer"
      style={{ transform: `translate(calc(-50% + ${offset}px), -100%)`, transition: 'transform 200ms ease-out' }}
    >
      {offset === 0 ? (
        /* Vòng sáng dưới mũi ghim */
        <span className="absolute bottom-0 left-1/2 h-3 w-8 -translate-x-1/2 translate-y-1/2 rounded-[50%] border border-amber-300/70 bg-amber-300/25" />
      ) : (
        /* Ghim bị dời sang bên để không chồng ghim khác: đường dẫn và chấm chỉ về vị trí thật */
        <>
          <span
            className="absolute bottom-0 h-0.5 rounded-full bg-amber-300/90 shadow"
            style={{ left: Math.min(17, 17 - offset), width: Math.abs(offset) }}
          />
          <span
            className="absolute bottom-0 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full border border-white bg-amber-400 shadow"
            style={{ left: 17 - offset }}
          />
        </>
      )}
      <svg width="34" height="44" viewBox="0 0 34 44" className="absolute inset-0 drop-shadow-md transition-transform group-hover:-translate-y-0.5" aria-hidden="true">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FCD34D" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <path d="M17 43C17 43 3 27.5 3 16a14 14 0 1 1 28 0c0 11.5-14 27-14 27Z" fill={`url(#${gradient})`} stroke="#B45309" strokeWidth="1" />
        <circle cx="17" cy="16" r="10.5" fill={active ? '#ECFDF5' : '#FFFFFF'} stroke={active ? '#34D399' : 'none'} strokeWidth="2" />
      </svg>
      <span className="absolute left-1/2 top-[9px] -translate-x-1/2 text-teal-700 transition-transform group-hover:-translate-y-0.5">
        <Icon size={14} strokeWidth={2.2} />
      </span>
      {labelSide === 'bottom-far' && (
        /* Nhãn nằm thấp một hàng: vạch dọc nối mũi ghim với nhãn */
        <span className="absolute left-1/2 top-full h-[42px] w-0.5 -translate-x-1/2 rounded-full bg-amber-300/90 shadow" />
      )}
      {/* Cỡ gọn khi màn hình chật (khớp LABEL_SIZES.compact trong labelLayout.js) */}
      {callout ? (
        /* Chú thích: nhãn đặt xa, có đường nối từ đầu ghim (tâm ở x 17, y 16) */
        <>
          <svg className="pointer-events-none absolute left-0 top-0 -z-10 overflow-visible" width="34" height="44" aria-hidden="true">
            <line x1="17" y1="16" x2={17 + callout.ox} y2={16 + callout.oy} stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          </svg>
          <span
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${labelClass} ${compact ? '!px-2 !py-1 !text-[10px]' : ''}`}
            style={{ left: 17 + callout.ox, top: 16 + callout.oy }}
          >
            {text}
          </span>
        </>
      ) : (
        <span className={`absolute ${LABEL_SIDES[labelSide] || LABEL_SIDES.right} ${labelClass} ${compact ? '!px-2 !py-1 !text-[10px]' : ''}`}>{text}</span>
      )}
    </button>
  );
}
