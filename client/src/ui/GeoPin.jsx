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
export function GeoPin({ place, active, onSelect }) {
  const estimated = place.confidence === 'estimated';
  const title = estimated ? `${place.name} (vị trí ước lượng, chờ đối chiếu thực địa)` : place.name;
  const text = `${place.name}${estimated ? ' ?' : ''}`;
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
  // Nhãn mặc định nằm bên phải ghim; `labelSide` trong dữ liệu đổi sang trái hoặc xuống dưới
  // cho các điểm nằm sát nhau, để nhãn không đè lên ghim bên cạnh.
  const LABEL_SIDES = {
    left: 'top-[3px] right-full mr-1.5',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    right: 'top-[3px] left-full ml-1.5',
  };
  return (
    <button
      onClick={onSelect}
      title={title}
      className="group relative block h-11 w-[34px] cursor-pointer"
      style={{ transform: 'translate(-50%, -100%)' }}
    >
      {/* Vòng sáng dưới mũi ghim */}
      <span className="absolute bottom-0 left-1/2 h-3 w-8 -translate-x-1/2 translate-y-1/2 rounded-[50%] border border-amber-300/70 bg-amber-300/25" />
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
      <span className={`absolute ${LABEL_SIDES[place.labelSide] || LABEL_SIDES.right} ${labelClass}`}>{text}</span>
    </button>
  );
}
