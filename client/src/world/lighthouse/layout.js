/**
 * Bố cục 1:1 (1 đơn vị = 1 mét) cho Mô hình 1 Hải đăng Vĩnh Thực (Meshy Multi-Image 3D đã duyệt).
 * Hỗ trợ Hành trình leo cầu thang 2 chặng:
 *  - Chặng 1: 36 bậc cầu thang sườn đồi có lan can con tiện trắng - vàng từ Bến đón ven biển (Y = -2.8m) lên Sân gạch đỏ (Y = +0.55m).
 *  - Chặng 2: 72 bậc cầu thang xoắn ốc (3 vòng xoắn) bên trong lòng Tháp đèn 18m từ chân tháp (Y = +0.55m) lên Ban công đỉnh tháp (Y = +14.8m).
 */

export const SEA_LEVEL = -3.4;
export const MESHY_SCALE = 18.4;
export const MESHY_Y_OFFSET = 0.445 * MESHY_SCALE; // +8.188 để mặt sân gạch đỏ ở khoảng Y = 0.55m

export const TOWER = {
  x: -8.55,
  z: 0.0,
  rotundaRadius: 4.4,
  rotundaFloor: 0.55,
  rotundaHeight: 5.2,
  coreBottom: 2.1,
  coreTop: 1.65,
  coreHeight: 15.0,
  balconyY: 14.8,
  balconyRadius: 2.55,
  drumRadius: 1.05,
  lanternBase: 15.8,
  lanternTop: 17.8,
  lanternRadius: 1.1,
  lampY: 16.45,
  spiralTurns: 3.0,
  spiralSteps: 72,
  spiralStartAngle: Math.PI * 0.28, // Cửa vào cầu thang xoắn ốc hướng về phía Đông Nam (sân gạch đỏ)
};

/**
 * Tính tọa độ 3D và góc hướng mặt trên Cầu thang xoắn ốc 72 bậc trong lòng tháp (t từ 0.0 -> 1.0)
 */
export function getSpiralPose(t) {
  const clamped = Math.max(0, Math.min(1, t));
  const angle = TOWER.spiralStartAngle + clamped * TOWER.spiralTurns * Math.PI * 2;
  const radius = 1.48 - 0.18 * clamped;
  const x = TOWER.x + Math.cos(angle) * radius;
  const z = TOWER.z + Math.sin(angle) * radius;
  const y = TOWER.rotundaFloor + clamped * (TOWER.balconyY - TOWER.rotundaFloor);
  // Tiếp tuyến hướng đi lên theo chiều tăng của angle: dx = -sin(angle), dz = cos(angle)
  const yawUp = Math.atan2(-Math.sin(angle), Math.cos(angle));
  return { x, y, z, angle, radius, yawUp };
}

export const HOUSE = {
  x0: -4.8,
  x1: 12.2,
  z0: -8.5,
  z1: 0.2,
  wallH: 5.5,
  wallT: 0.3,
  floor: 0.55,
  doorX: 4.0,
  doorW: 2.4,
  doorH: 2.9,
};

export const YARD = { x0: -14.2, x1: 12.2, z0: -4.5, z1: 8.5 };
export const STAIRS = {
  x0: 2.7,
  x1: 5.1,
  z0: 8.0,
  z1: 22.0,
  yTop: 0.55,
  yBottom: -2.8,
  drop: 3.35,
  steps: 36,
};
export const VIEWPOINT = { x0: -0.5, x1: 8.3, z0: 22.0, z1: 26.8, y: -2.8 };
export const FLAG = { x: 4.8, z: 1.2 };

// Các đoạn lan can con tiện trắng - tay vịn vàng kem cho Chặng 1 (Cầu thang sườn đồi & Sảnh đón ven biển)
export const HILL_STAIR_BALUSTRADES = [
  // Hai dải lan can dọc 36 bậc cầu thang sườn đồi
  [STAIRS.x0, STAIRS.yTop, STAIRS.z0, STAIRS.x0, STAIRS.yBottom, STAIRS.z1],
  [STAIRS.x1, STAIRS.yTop, STAIRS.z0, STAIRS.x1, STAIRS.yBottom, STAIRS.z1],
  // Lan can bao quanh Sảnh đón ven biển (chừa lối cầu thang ở giữa)
  [VIEWPOINT.x0, VIEWPOINT.y, VIEWPOINT.z0, STAIRS.x0, VIEWPOINT.y, VIEWPOINT.z0],
  [STAIRS.x1, VIEWPOINT.y, VIEWPOINT.z0, VIEWPOINT.x1, VIEWPOINT.y, VIEWPOINT.z0],
  [VIEWPOINT.x1, VIEWPOINT.y, VIEWPOINT.z0, VIEWPOINT.x1, VIEWPOINT.y, VIEWPOINT.z1],
  [VIEWPOINT.x1, VIEWPOINT.y, VIEWPOINT.z1, VIEWPOINT.x0, VIEWPOINT.y, VIEWPOINT.z1],
  [VIEWPOINT.x0, VIEWPOINT.y, VIEWPOINT.z1, VIEWPOINT.x0, VIEWPOINT.y, VIEWPOINT.z0],
];

// Khối cản va chạm khi đi bộ quanh Mô hình Hải đăng (khối nhà Pháp & trụ lõi giữa tháp)
const OBSTACLE_BOXES = [
  [-4.6, 12.0, -8.4, 0.1], // Khối nhà quản lý Pháp
];

export function groundAt(x, z, level = 'ground', spiralT = 0) {
  if (level === 'spiral') {
    return getSpiralPose(spiralT).y;
  }
  if (level === 'balcony') return TOWER.balconyY;
  if (z >= VIEWPOINT.z0) return VIEWPOINT.y;
  if (z > STAIRS.z0) {
    const t = Math.min(1, Math.max(0, (z - STAIRS.z0) / (STAIRS.z1 - STAIRS.z0)));
    return STAIRS.yTop * (1 - t) + STAIRS.yBottom * t;
  }
  return STAIRS.yTop;
}

export function canWalk(x, z, level = 'ground') {
  if (level === 'spiral') return true;
  if (level === 'balcony') {
    const d = Math.hypot(x - TOWER.x, z - TOWER.z);
    return d >= TOWER.drumRadius + 0.2 && d <= TOWER.balconyRadius - 0.15;
  }
  const r = 0.38;
  const inYard = x >= YARD.x0 && x <= YARD.x1 && z >= YARD.z0 && z <= YARD.z1;
  const inStairs =
    x >= STAIRS.x0 + 0.15 &&
    x <= STAIRS.x1 - 0.15 &&
    z >= STAIRS.z0 - 0.6 &&
    z <= STAIRS.z1 + 0.6;
  const inView =
    x >= VIEWPOINT.x0 + 0.25 &&
    x <= VIEWPOINT.x1 - 0.25 &&
    z >= VIEWPOINT.z0 - 0.5 &&
    z <= VIEWPOINT.z1 - 0.25;
  if (!inYard && !inStairs && !inView) return false;

  // Chỉ chặn trụ lõi trung tâm (bán kính 0.65m) để nhân vật đi vào hiên vòm & cửa cầu thang xoắn ốc
  if (Math.hypot(x - TOWER.x, z - TOWER.z) < 0.65 + r) return false;

  // Tránh đi xuyên vào khối nhà quản lý của Meshy
  for (const [x0, x1, z0, z1] of OBSTACLE_BOXES) {
    if (x + r > x0 && x - r < x1 && z + r > z0 && z - r < z1) return false;
  }
  return true;
}

/** Luôn giữ khoảng cách camera góc nhìn thứ 3 ổn định phía sau lưng nhân vật */
export function cameraDistance(target, direction, maxDistance, level = 'ground') {
  if (level === 'spiral') {
    return Math.min(maxDistance, 3.4);
  }
  if (level === 'balcony') {
    return Math.min(maxDistance, 3.2);
  }
  return Math.max(2.6, maxDistance);
}

export const LIGHTHOUSE_WORLD = {
  id: 'lighthouse',
  // Xuất phát tại Sảnh đón dưới chân cầu thang 36 bậc, nhìn thẳng lên ngọn Hải đăng 18m
  spawn: { position: [3.9, VIEWPOINT.y, 24.4], yaw: Math.PI, level: 'ground' },
  groundAt,
  canWalk,
  cameraDistance,
};

export const HOTSPOTS = [];
export const TOUR_SPOTS = [];
export function teleportFor() {
  return LIGHTHOUSE_WORLD.spawn;
}
