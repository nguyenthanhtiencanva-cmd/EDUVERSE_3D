import * as THREE from 'three';
import STOP_DATA from '../../education/van-gia-stops.json';

// Mô hình dựng trong Blender với 1 đơn vị = 1 m, gốc tọa độ ở giữa kè, mặt bến cao 3,2 m.
// Dời cả cảnh để đầu bậc lên xuống tàu khách nằm ở gốc (0, 0, 0): bóng đổ và camera xoay quanh khu đông khách nhất.
// Đổi tọa độ Blender (x, y, z) sang cảnh: (x - 50, z - 3.2, 2 - y).
export const VAN_GIA_OFFSET = new THREE.Vector3(-50, -3.2, 2);

// Khu vực đi bộ: toàn bộ bến, cầu cảng, cầu dẫn và chân đồi phía sau.
export const VAN_GIA_BOUNDS = { minX: -155, maxX: 68, minZ: -30, maxZ: 44 };

// Mặt nước không cản đường và không có mặt đất để đứng: đi ra mép bến không có lan can thì dừng lại.
export const VAN_GIA_PASS_THROUGH = /^MAT_(Nuoc_bien|Den_sang|Vach_son)/;

// Xuống tàu ở đầu cầu dẫn, quay mặt vào bờ (hướng -Z).
export const VAN_GIA_SPAWN = { position: [0, -2.75, 38], yaw: Math.PI, level: 'ground' };

export const VAN_GIA_STOPS = STOP_DATA.stops;
const STOP_RADIUS = 7;

export function nearbyVanGiaStop([x, , z]) {
  return VAN_GIA_STOPS.find((stop) => Math.hypot(stop.position[0] - x, stop.position[1] - z) < STOP_RADIUS) || null;
}

const PROGRESS_KEY = 'eduverse-van-gia-stops';

export function readVanGiaProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((id) => VAN_GIA_STOPS.some((stop) => stop.id === id)) : [];
  } catch {
    return [];
  }
}

export function saveVanGiaProgress(ids) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids));
  } catch {
    // Không lưu được (chế độ ẩn danh) thì vẫn giữ trong phiên này.
  }
}
