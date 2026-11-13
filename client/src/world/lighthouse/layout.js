/**
 * Bố cục 1:1 (1 đơn vị = 1 mét) của Trạm Hải đăng Vĩnh Thực để tham quan đi bộ.
 * Trục: +X = Đông, +Z = Nam (mặt tiền công trình nhìn về phía Nam, ra cầu thang).
 * Dùng chung cho dựng hình (LighthouseScene) và va chạm / độ cao mặt đất (CharacterController).
 *
 * Số liệu thực tế: tháp cao 18 m (từ chân móng tới đỉnh), tâm sáng cao 84,5 m so với mực nước biển,
 * tầm hiệu lực ~21 hải lý; xây dựng năm 1962, xây mới / trùng tu các năm 1986 và 2017.
 */

export const SEA_LEVEL = -66; // đỉnh đồi cao ~66 m so với mặt biển

// ---------------- Kích thước chính ----------------
export const TOWER = {
  x: -11, z: 0,
  rotundaRadius: 5.0, // vòng trụ hiên vòm
  rotundaFloor: 0.35,
  rotundaHeight: 5.0,
  coreBottom: 2.3, coreTop: 1.75, coreHeight: 15,
  balconyY: 15.2, balconyRadius: 2.75,
  drumRadius: 1.35,
  lanternBase: 16.2, lanternTop: 18.0, lanternRadius: 1.2,
  lampY: 17.1,
};

export const HOUSE = {
  x0: -4, x1: 14, z0: -8.5, z1: -1, // tường ngoài
  wallH: 4.2, wallT: 0.3, floor: 0.45,
  doorX: 5, doorW: 2.4, doorH: 2.9,
};

export const PORCH = { x0: -3.6, x1: 13.6, z0: -1, z1: 1.4, floor: 0.3, columnsZ: 1.1,
  columnsX: [-3.2, 0, 3.4, 6.6, 10, 13.2] };

export const YARD = { x0: -17.5, x1: 15.5, z0: -10, z1: 8.5 };
export const STAIRS = { x0: 0.8, x1: 3.4, z0: 8.5, z1: 24, drop: 3.9 };
export const VIEWPOINT = { x0: -2.5, x1: 6.5, z0: 24, z1: 29.5, y: -3.9 };
export const FLAG = { x: 9, z: 5 };
export const PALMS = [[-2.4, 3.6], [4.9, 3.4], [12.6, 3.0], [-6.2, -8.8], [14.4, 6.8]];
export const BENCHES = [[-3.6, 7.3, 0], [8.2, 7.5, 0], [4.0, 28.6, 0]];
export const LAMPS = [[-16.8, 7.8], [-4.5, 7.8], [6.0, 7.8], [14.8, 7.8], [-16.8, -9.3], [14.8, -9.3], [0.3, 16], [3.9, 16], [-2, 24.5], [6, 24.5]];
export const BINOCULARS = [2.0, 28.7];

const PLAYER_R = 0.42;

// ---------------- Lan can (balustrade) — dùng cho cả dựng hình và va chạm ----------------
// Mỗi đoạn: [ax, ay, az, bx, by, bz]
function rect(x0, z0, x1, z1, y, gaps = []) {
  // 4 cạnh, có thể chừa khe trên cạnh phía Nam (z1): gaps = [[xa, xb], ...]
  const segs = [[x0, y, z0, x1, y, z0], [x1, y, z0, x1, y, z1], [x0, y, z1, x0, y, z0]];
  let cursor = x0;
  for (const [ga, gb] of gaps) {
    if (ga > cursor) segs.push([cursor, y, z1, ga, y, z1]);
    cursor = gb;
  }
  if (cursor < x1) segs.push([cursor, y, z1, x1, y, z1]);
  return segs;
}

export const BALUSTRADES = (() => {
  const segs = [];
  // Lan can quanh sân (chừa lối xuống cầu thang)
  segs.push(...rect(YARD.x0, YARD.z0, YARD.x1, YARD.z1, 0, [[STAIRS.x0, STAIRS.x1]]));
  // Hai bên cầu thang (dốc)
  segs.push([STAIRS.x0, 0, STAIRS.z0, STAIRS.x0, -STAIRS.drop, STAIRS.z1]);
  segs.push([STAIRS.x1, 0, STAIRS.z0, STAIRS.x1, -STAIRS.drop, STAIRS.z1]);
  // Lan can điểm ngắm biển (chừa lối từ cầu thang)
  const vy = VIEWPOINT.y;
  segs.push([VIEWPOINT.x0, vy, VIEWPOINT.z0, STAIRS.x0, vy, VIEWPOINT.z0]);
  segs.push([STAIRS.x1, vy, VIEWPOINT.z0, VIEWPOINT.x1, vy, VIEWPOINT.z0]);
  segs.push([VIEWPOINT.x1, vy, VIEWPOINT.z0, VIEWPOINT.x1, vy, VIEWPOINT.z1]);
  segs.push([VIEWPOINT.x1, vy, VIEWPOINT.z1, VIEWPOINT.x0, vy, VIEWPOINT.z1]);
  segs.push([VIEWPOINT.x0, vy, VIEWPOINT.z1, VIEWPOINT.x0, vy, VIEWPOINT.z0]);
  return segs;
})();

// Lan can giữa các trụ hiên vòm tròn (chừa lối vào phía Nam và phía nhà quản lý)
export const ROTUNDA_PILLAR_ANGLES = Array.from({ length: 8 }, (_, k) => ((22.5 + 45 * k) * Math.PI) / 180);
export const ROTUNDA_OPEN_BAYS = new Set([0, 1]); // bay 0: hướng Đông (sang nhà), bay 1: hướng Nam (lối chính)
export const ROTUNDA_BAYS = ROTUNDA_PILLAR_ANGLES.map((a, k) => {
  const b = ROTUNDA_PILLAR_ANGLES[(k + 1) % 8] + (k === 7 ? Math.PI * 2 : 0);
  return { index: (k + 1) % 8, a0: a, a1: b, mid: (a + b) / 2 };
});
export const ROTUNDA_BALUSTRADES = ROTUNDA_BAYS.filter((bay) => !ROTUNDA_OPEN_BAYS.has(bay.index)).map((bay) => {
  const r = TOWER.rotundaRadius;
  const y = TOWER.rotundaFloor;
  return [TOWER.x + r * Math.cos(bay.a0), y, TOWER.z + r * Math.sin(bay.a0), TOWER.x + r * Math.cos(bay.a1), y, TOWER.z + r * Math.sin(bay.a1)];
});

// Lan can vòng ban công đỉnh tháp
export const BALCONY_BALUSTRADES = Array.from({ length: 24 }, (_, k) => {
  const r = TOWER.balconyRadius - 0.15;
  const a0 = (k / 24) * Math.PI * 2;
  const a1 = ((k + 1) / 24) * Math.PI * 2;
  return [TOWER.x + r * Math.cos(a0), TOWER.balconyY, TOWER.z + r * Math.sin(a0), TOWER.x + r * Math.cos(a1), TOWER.balconyY, TOWER.z + r * Math.sin(a1)];
});

// ---------------- Va chạm 2D (đoạn thẳng có bán kính) ----------------
// [ax, az, bx, bz, radius, height]  (height dùng để chặn camera)
const COLLIDERS = [];
const add = (ax, az, bx, bz, r, h = 1) => COLLIDERS.push([ax, az, bx, bz, r, h]);

// Thân tháp
add(TOWER.x, TOWER.z, TOWER.x, TOWER.z, TOWER.coreBottom, 18);
// Trụ hiên vòm
ROTUNDA_PILLAR_ANGLES.forEach((a) => {
  const px = TOWER.x + TOWER.rotundaRadius * Math.cos(a);
  const pz = TOWER.z + TOWER.rotundaRadius * Math.sin(a);
  add(px, pz, px, pz, 0.4, TOWER.rotundaHeight);
});
ROTUNDA_BALUSTRADES.forEach(([ax, , az, bx, , bz]) => add(ax, az, bx, bz, 0.14, 1));
// Tường nhà quản lý (chừa cửa chính)
{
  const { x0, x1, z0, z1, doorX, doorW, wallH } = HOUSE;
  const t = HOUSE.wallT / 2;
  add(x0, z0, x1, z0, t, wallH);
  add(x0, z0, x0, z1, t, wallH);
  add(x1, z0, x1, z1, t, wallH);
  add(x0, z1, doorX - doorW / 2, z1, t, wallH);
  add(doorX + doorW / 2, z1, x1, z1, t, wallH);
}
// Bục sa bàn trong phòng truyền thống
export const MODEL_PEDESTAL = { x: 5, z: -4.9, r: 0.95 };
add(MODEL_PEDESTAL.x, MODEL_PEDESTAL.z, MODEL_PEDESTAL.x, MODEL_PEDESTAL.z, MODEL_PEDESTAL.r, 1.2);
// Cột hiên
PORCH.columnsX.forEach((cx) => add(cx, PORCH.columnsZ, cx, PORCH.columnsZ, 0.3, 4));
// Cột cờ, cây cau, ghế, đèn, ống nhòm
add(FLAG.x, FLAG.z, FLAG.x, FLAG.z, 0.6, 1);
PALMS.forEach(([x, z]) => add(x, z, x, z, 0.35, 1));
BENCHES.forEach(([x, z]) => add(x - 0.9, z, x + 0.9, z, 0.3, 0.6));
LAMPS.forEach(([x, z]) => add(x, z, x, z, 0.15, 1));
add(BINOCULARS[0], BINOCULARS[1], BINOCULARS[0], BINOCULARS[1], 0.3, 1.3);
// Lan can
BALUSTRADES.forEach(([ax, , az, bx, , bz]) => add(ax, az, bx, bz, 0.12, 1));

function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  let t = len2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

const inRect = (x, z, r, x0, z0, x1, z1, m = 0) => x >= x0 + m && x <= x1 - m && z >= z0 + m && z <= z1 - m;

const stairY = (z) => -Math.min(STAIRS.drop, Math.max(0, z - STAIRS.z0) * (STAIRS.drop / (STAIRS.z1 - STAIRS.z0)));

export function groundAt(x, z, level = 'ground') {
  if (level === 'balcony') return TOWER.balconyY;
  if (Math.hypot(x - TOWER.x, z - TOWER.z) < TOWER.rotundaRadius + 0.35) return TOWER.rotundaFloor;
  if (inRect(x, z, 0, HOUSE.x0, HOUSE.z0, HOUSE.x1, HOUSE.z1)) return HOUSE.floor;
  if (inRect(x, z, 0, PORCH.x0, PORCH.z0, PORCH.x1, PORCH.z1)) return PORCH.floor;
  if (z >= VIEWPOINT.z0) return VIEWPOINT.y;
  if (z > STAIRS.z0) return stairY(z);
  return 0;
}

export function canWalk(x, z, level = 'ground') {
  if (level === 'balcony') {
    const d = Math.hypot(x - TOWER.x, z - TOWER.z);
    return d >= TOWER.drumRadius + 0.3 && d <= TOWER.balconyRadius - 0.45;
  }
  const r = PLAYER_R;
  const inside =
    inRect(x, z, r, YARD.x0, YARD.z0, YARD.x1, YARD.z1, r) ||
    inRect(x, z, r, STAIRS.x0, STAIRS.z0 - 1, STAIRS.x1, STAIRS.z1 + 1, r) ||
    inRect(x, z, r, VIEWPOINT.x0, VIEWPOINT.z0, VIEWPOINT.x1, VIEWPOINT.z1, r);
  if (!inside) return false;
  for (const [ax, az, bx, bz, cr] of COLLIDERS) {
    if (segDist(x, z, ax, az, bx, bz) < cr + r) return false;
  }
  return true;
}

function insideHouse(x, z) {
  return inRect(x, z, 0, HOUSE.x0, HOUSE.z0, HOUSE.x1, HOUSE.z1);
}

/** Khoảng cách camera góc nhìn thứ 3 (luôn giữ khoảng cách tối thiểu 2.4m phía sau nhân vật) */
export function cameraDistance(target, direction, maxDistance, level = 'ground') {
  const minThirdPersonDist = 2.4;
  const indoors = level === 'ground' && insideHouse(target.x, target.z);
  if (indoors) {
    return Math.min(maxDistance, 2.8);
  }
  if (level === 'balcony') {
    return Math.min(maxDistance, 3.2);
  }
  for (let d = minThirdPersonDist; d <= maxDistance; d += 0.2) {
    const x = target.x + direction.x * d;
    const y = target.y + direction.y * d;
    const z = target.z + direction.z * d;
    let blocked = false;
    for (const [ax, az, bx, bz, cr, h] of COLLIDERS) {
      if (h > 2.2 && y < h + 0.5 && segDist(x, z, ax, az, bx, bz) < cr + 0.15) {
        blocked = true;
        break;
      }
    }
    if (blocked) return Math.max(minThirdPersonDist, d - 0.2);
  }
  return maxDistance;
}

export const LIGHTHOUSE_WORLD = {
  id: 'lighthouse',
  spawn: { position: [1.5, 0, 6.2], yaw: Math.PI, level: 'ground' }, // xuất phát trên sân gạch đỏ, nhìn thẳng vào Tháp & Nhà quản lý
  groundAt,
  canWalk,
  cameraDistance,
};

// ---------------- Điểm tham quan (hotspot) ----------------
export const DOOR_POINT = [TOWER.x, TOWER.z + TOWER.coreBottom + 0.75];

export const HOTSPOTS = [
  {
    id: 'viewpoint', level: 'ground', pos: [2.0, 27.4], radius: 3.2, icon: '🔭',
    title: 'Điểm ngắm biển Đông Bắc',
    body: [
      'Từ độ cao khoảng 60 m so với mặt biển, du khách phóng tầm mắt ra vùng biển Móng Cái – vịnh Bắc Bộ, nơi tàu thuyền ra vào luồng Vạn Gia.',
      'Hải đăng nằm ở mũi cực Đông Bắc đảo Vĩnh Thực, sát tuyến biên giới biển Việt Nam – Trung Quốc.',
      'Hãy đi theo cầu thang lên sân hải đăng để khám phá tiếp nhé!',
    ],
  },
  {
    id: 'gate', level: 'ground', pos: [2.1, 7.2], radius: 2.2, icon: '👋',
    title: 'Chào mừng tới Trạm Hải đăng Vĩnh Thực',
    body: [
      'Trạm hải đăng gồm tháp đèn kiến trúc kiểu Pháp và nhà quản lý một tầng mái ngói đỏ, đứng trên đỉnh đồi ở mũi Đông Bắc đảo.',
      'Mẹo: đi tới các vòng sáng màu vàng trên mặt đất để xem thông tin. Nhấn E (hoặc chạm nút) để tương tác.',
    ],
  },
  {
    id: 'sign', level: 'ground', pos: [5, 2.3], radius: 2.0, icon: '🏛️',
    title: 'Nhà quản lý – Biển tên Hải đăng Vĩnh Thực',
    body: [
      'Nhà quản lý một tầng, tường vàng, trụ và lan can trắng, mái ngói đỏ có ba cửa sổ mái hình vòm – mang dáng dấp kiến trúc Pháp đầu thế kỷ XX.',
      'Bên trong là phòng truyền thống giới thiệu lịch sử trạm đèn và công việc của những người gác đèn. Mời bạn bước vào!',
    ],
  },
  {
    id: 'tower', level: 'ground', pos: [TOWER.x, TOWER.z + 6.0], radius: 2.0, icon: '🗼',
    title: 'Tháp đèn cao 18 mét',
    body: [
      'Tháp đèn hình trụ tròn thon dần lên trên, tường vàng kem với bốn gân trụ trắng, cao 18 m tính từ chân móng tới đỉnh.',
      'Chân tháp được bao bởi hiên vòm tròn gồm 8 trụ, vòm cuốn và lan can con tiện – nét đặc trưng hiếm thấy ở các hải đăng Việt Nam.',
      'Đi vào trong hiên vòm, tới cửa tháp để leo lên đỉnh.',
    ],
  },
  {
    id: 'door', level: 'ground', pos: DOOR_POINT, radius: 1.5, icon: '🪜', action: 'up',
    title: 'Cửa tháp – Cầu thang xoắn ốc',
    body: [
      'Bên trong thân tháp là cầu thang xoắn ốc dẫn lên ban công và lồng đèn ở độ cao khoảng 15 m.',
    ],
  },
  {
    id: 'lantern', level: 'balcony', pos: [TOWER.x, TOWER.z], radius: 4, icon: '💡',
    title: 'Ban công & Lồng đèn – "Mắt thần" vùng biển Đông Bắc',
    body: [
      'Tâm sáng của đèn cao khoảng 84,5 m so với mực nước biển, tầm hiệu lực ánh sáng khoảng 21 hải lý (gần 39 km).',
      'Ban đêm, đèn quay quét sáng theo chu kỳ để tàu thuyền nhận biết vị trí, định hướng an toàn khi vào luồng Vạn Gia – Móng Cái.',
      'Thử đổi sang chế độ "Đêm" để ngắm chùm sáng hải đăng quét trên mặt biển!',
    ],
  },
  {
    id: 'museum-history', level: 'ground', pos: [0.5, -7.2], radius: 2.0, icon: '📜',
    title: 'Phòng truyền thống – Lịch sử trạm đèn',
    body: [
      '1962: Hải đăng Vĩnh Thực được xây dựng và đưa vào hoạt động.',
      '1986: Trạm đèn được xây dựng lại, nâng cấp.',
      '2017: Công trình được trùng tu, cải tạo khang trang như ngày nay, trở thành điểm tham quan du lịch của đảo.',
    ],
  },
  {
    id: 'museum-tech', level: 'ground', pos: [5, -7.2], radius: 2.0, icon: '📐',
    title: 'Thông số kỹ thuật',
    body: [
      'Chiều cao công trình: 18 m (từ chân móng đến đỉnh tháp).',
      'Chiều cao tâm sáng: khoảng 84,5 m so với mực nước biển (đỉnh đồi cao hơn 60 m).',
      'Tầm hiệu lực ánh sáng: khoảng 21 hải lý (1 hải lý = 1.852 m).',
    ],
  },
  {
    id: 'museum-keeper', level: 'ground', pos: [9.5, -7.2], radius: 2.0, icon: '👨‍✈️',
    title: 'Những người giữ lửa hải đăng',
    body: [
      'Nhân viên trạm thay phiên trực đèn suốt ngày đêm, bảo dưỡng thiết bị, ghi nhật ký thời tiết và quan sát tàu thuyền.',
      'Công việc thầm lặng của họ góp phần bảo đảm an toàn hàng hải và khẳng định chủ quyền biển đảo của Tổ quốc.',
    ],
  },
  {
    id: 'model', level: 'ground', pos: [MODEL_PEDESTAL.x, MODEL_PEDESTAL.z + 1.7], radius: 1.6, icon: '🧩',
    title: 'Sa bàn mô hình trạm hải đăng',
    body: ['Mô hình thu nhỏ toàn bộ trạm hải đăng: tháp đèn, hiên vòm tròn, nhà quản lý và sân gạch đỏ trên đỉnh đồi.'],
  },
  {
    id: 'flag', level: 'ground', pos: [FLAG.x, FLAG.z + 1.3], radius: 1.8, icon: '🇻🇳',
    title: 'Cột cờ – Chủ quyền biển đảo',
    body: [
      'Lá cờ đỏ sao vàng tung bay nơi địa đầu Đông Bắc, khẳng định chủ quyền thiêng liêng của Việt Nam trên vùng biển, đảo Quảng Ninh.',
      'Hải đăng không chỉ dẫn đường cho tàu thuyền mà còn là cột mốc chủ quyền trên biển.',
    ],
  },
];

export const TOUR_SPOTS = HOTSPOTS.filter((h) => h.id !== 'door');

/** Vị trí dịch chuyển nhanh tới từng điểm (đứng cách hotspot một chút) */
export function teleportFor(hotspot) {
  if (hotspot.level === 'balcony') {
    return { position: [TOWER.x, TOWER.balconyY, TOWER.z + 2.0], yaw: Math.PI, level: 'balcony' };
  }
  const [x, z] = hotspot.pos;
  const pz = z + 1.2;
  return { position: [x, groundAt(x, pz), pz], yaw: 0, level: 'ground' };
}
