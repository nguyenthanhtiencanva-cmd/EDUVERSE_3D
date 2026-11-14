/**
 * Bố cục 1:1 (1 đơn vị = 1 mét) cho Mô hình 1 Hải đăng Vĩnh Thực (Meshy Multi-Image 3D đã duyệt).
 * Khi phóng theo tỷ lệ thực tế (SCALE = 18.4, chiều rộng toàn quần thể ~35 m, đỉnh tháp cao 18,0 m):
 * - Tháp đèn nằm tại (X = -12.24, Z = -2.50), ban công đỉnh tháp ở Y = 14.8 m, tâm đèn Y = 16.85 m.
 * - Nhà quản lý mái ngói đỏ nằm tại X từ -5.5 đến +13.0, Z từ -6.5 đến +2.6.
 * - Sân gạch đỏ phía trước: X từ -11.5 đến +12.5, Z từ +3.2 đến +8.2 (cao độ mặt sân Y ≈ 0.55 m).
 * - Cầu thang sườn đồi phía trước: X từ -0.2 đến +2.6, Z từ +8.2 xuống +24.0.
 */

export const SEA_LEVEL = -66;
export const MESHY_SCALE = 18.4;
export const MESHY_Y_OFFSET = 0.445 * MESHY_SCALE; // +8.188 để mặt sân gạch đỏ ở khoảng Y = 0.55m

export const TOWER = {
  x: -12.24,
  z: -2.5,
  rotundaRadius: 4.2,
  rotundaFloor: 0.55,
  rotundaHeight: 5.2,
  coreBottom: 2.1,
  coreTop: 1.65,
  coreHeight: 15.0,
  balconyY: 14.8,
  balconyRadius: 2.4,
  drumRadius: 1.15,
  lanternBase: 15.8,
  lanternTop: 17.8,
  lanternRadius: 1.1,
  lampY: 16.85,
};

export const HOUSE = {
  x0: -5.5,
  x1: 13.0,
  z0: -6.5,
  z1: 2.6,
  wallH: 5.5,
  wallT: 0.3,
  floor: 0.55,
  doorX: 4.0,
  doorW: 2.4,
  doorH: 2.9,
};

export const YARD = { x0: -13.5, x1: 13.5, z0: -8.5, z1: 8.5 };
export const STAIRS = { x0: -0.4, x1: 2.8, z0: 8.2, z1: 22.0, drop: 3.8 };
export const VIEWPOINT = { x0: -3.5, x1: 6.0, z0: 22.0, z1: 28.0, y: -3.25 };
export const FLAG = { x: 1.8, z: 5.2 };

// Các khối cản va chạm khi đi bộ quanh Mô hình 1 (thân tháp & khối nhà quản lý)
const OBSTACLE_BOXES = [
  [-5.2, 12.8, -6.2, 2.5], // Khối nhà quản lý
];

export function groundAt(x, z, level = 'ground') {
  if (level === 'balcony') return TOWER.balconyY;
  if (z >= VIEWPOINT.z0) return VIEWPOINT.y;
  if (z > STAIRS.z0) {
    const t = Math.min(1, Math.max(0, (z - STAIRS.z0) / (STAIRS.z1 - STAIRS.z0)));
    return 0.55 * (1 - t) + VIEWPOINT.y * t;
  }
  return 0.55;
}

export function canWalk(x, z, level = 'ground') {
  if (level === 'balcony') {
    const d = Math.hypot(x - TOWER.x, z - TOWER.z);
    return d >= TOWER.drumRadius + 0.25 && d <= TOWER.balconyRadius - 0.2;
  }
  const r = 0.4;
  const inYard = x >= YARD.x0 && x <= YARD.x1 && z >= YARD.z0 && z <= YARD.z1;
  const inStairs = x >= STAIRS.x0 && x <= STAIRS.x1 && z >= STAIRS.z0 - 0.5 && z <= STAIRS.z1 + 0.5;
  const inView = x >= VIEWPOINT.x0 && x <= VIEWPOINT.x1 && z >= VIEWPOINT.z0 - 0.5 && z <= VIEWPOINT.z1;
  if (!inYard && !inStairs && !inView) return false;

  // Tránh đi xuyên vào lõi tháp đèn
  if (Math.hypot(x - TOWER.x, z - TOWER.z) < TOWER.coreBottom + r) return false;

  // Tránh đi xuyên vào khối nhà đặt đặc của Meshy
  for (const [x0, x1, z0, z1] of OBSTACLE_BOXES) {
    if (x + r > x0 && x - r < x1 && z + r > z0 && z - r < z1) return false;
  }
  return true;
}

/** Luôn giữ khoảng cách camera góc nhìn thứ 3 ổn định phía sau lưng nhân vật */
export function cameraDistance(target, direction, maxDistance, level = 'ground') {
  if (level === 'balcony') {
    return Math.min(maxDistance, 3.2);
  }
  return Math.max(2.6, maxDistance);
}

export const LIGHTHOUSE_WORLD = {
  id: 'lighthouse',
  spawn: { position: [1.2, 0.55, 6.2], yaw: Math.PI, level: 'ground' },
  groundAt,
  canWalk,
  cameraDistance,
};

export const HOTSPOTS = [];
export const TOUR_SPOTS = [];
export function teleportFor() {
  return LIGHTHOUSE_WORLD.spawn;
}
