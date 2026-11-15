import * as THREE from 'three';

export const GEO_TERRAIN_NAME = 'GeoTerrainMesh';

const DISTANCE = 34; // Khoảng cách ngang từ camera tới địa danh (3,4 km)
const HEIGHTS = [22, 34, 50]; // Thử từ góc nhìn thấp, nâng dần nếu hướng tốt nhất vẫn bị che
// Góc phương vị tính từ hướng Nam (0° = camera đứng phía Nam nhìn lên Bắc).
const AZIMUTHS = [0, 45, -45, 90, -90, 135, -135, 180].map((degrees) => (degrees * Math.PI) / 180);
const PATH_SAMPLES = 6;
// Mỗi 45° lệch khỏi hướng Nam bị trừ điểm tương đương 0,4 đơn vị cao, để bản đồ ít bị xoay ngược khi không cần.
const TURN_PENALTY = 0.4 / (Math.PI / 4);

const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);
const origin = new THREE.Vector3();
const direction = new THREE.Vector3();

function groundAt(terrain, x, z) {
  raycaster.set(origin.set(x, 200, z), down);
  raycaster.far = Infinity;
  return raycaster.intersectObject(terrain, false)[0]?.point.y ?? 0;
}

// Chọn vị trí camera để nhìn địa danh tại (x, z) từ phía thoáng nhất.
// Điểm ven biển được nhìn từ phía biển: bến ở bờ Bắc nhìn từ phía Bắc, bãi ở bờ Nam nhìn từ phía Nam,
// nên sườn núi phía sau không quay lưng về camera. Trả về { position, target } trong tọa độ cảnh.
export function chooseGeoView(scene, x, z) {
  const terrain = scene.getObjectByName(GEO_TERRAIN_NAME);
  if (!terrain) {
    return { position: new THREE.Vector3(x, HEIGHTS[0], z + DISTANCE), target: new THREE.Vector3(x, 0.5, z) };
  }
  const groundY = groundAt(terrain, x, z);
  const target = new THREE.Vector3(x, groundY + 0.5, z);

  let best = AZIMUTHS[0];
  let bestScore = Infinity;
  for (const azimuth of AZIMUTHS) {
    let highest = 0;
    for (let step = 1; step <= PATH_SAMPLES; step++) {
      const reach = (DISTANCE * step) / PATH_SAMPLES;
      highest = Math.max(highest, groundAt(terrain, x + Math.sin(azimuth) * reach, z + Math.cos(azimuth) * reach));
    }
    const score = highest + Math.abs(azimuth) * TURN_PENALTY;
    if (score < bestScore - 1e-6) {
      bestScore = score;
      best = azimuth;
    }
  }

  const candidate = (height) =>
    new THREE.Vector3(x + Math.sin(best) * DISTANCE, groundY + height, z + Math.cos(best) * DISTANCE);
  for (const height of HEIGHTS) {
    const position = candidate(height);
    raycaster.set(position, direction.subVectors(target, position).normalize());
    raycaster.far = position.distanceTo(target) - 1.5; // Bỏ qua mặt đất ngay quanh địa danh
    if (raycaster.intersectObject(terrain, false).length === 0) return { position, target };
  }
  return { position: candidate(HEIGHTS[HEIGHTS.length - 1]), target };
}
