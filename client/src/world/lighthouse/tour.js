import { groundAt, LIGHTHOUSE_WORLD, TOWER } from './layout.js';

export const TOUR_PROGRESS_KEY = 'eduverse-lighthouse-tour-v1';

export const LIGHTHOUSE_STOPS = [
  {
    id: 'hill-stairs',
    title: 'Chân cầu thang sườn đồi',
    position: LIGHTHOUSE_WORLD.spawn.position,
    level: 'ground',
    radius: 2.1,
    directions: 'Bắt đầu ở chiếu nghỉ dưới chân dốc.',
  },
  {
    id: 'rotunda',
    title: 'Sân và vòm chân tháp',
    position: [-8.85, groundAt(-8.85, 2.77), 2.77],
    level: 'ground',
    radius: 2.4,
    directions: 'Leo hết cầu thang đồi, theo lối lát sáng qua sân và lên bảy bậc vào vòm chân tháp.',
  },
  {
    id: 'sea-view',
    title: 'Ban công nhìn ra biển',
    position: [TOWER.x, TOWER.balconyY, TOWER.z + 1.55],
    level: 'balcony',
    radius: 2.2,
    directions: 'Đi tới cửa tháp, nhấn E hoặc Vào cầu thang; giữ phím/cần để tự leo lên ban công.',
  },
];

export function nearbyLighthouseStop({ worldScope, cameraMode, lighthouseLevel, playerPosition, playerTeleport }) {
  if (worldScope !== 'lighthouse' || cameraMode !== 'fps' || playerTeleport) return null;
  let closest = null;
  let closestDistance = Infinity;
  for (const stop of LIGHTHOUSE_STOPS) {
    if (stop.level !== lighthouseLevel) continue;
    if (Math.abs(playerPosition[1] - 1.4 - stop.position[1]) > 0.9) continue;
    const distance = Math.hypot(playerPosition[0] - stop.position[0], playerPosition[2] - stop.position[2]);
    if (distance <= stop.radius && distance < closestDistance) {
      closest = stop;
      closestDistance = distance;
    }
  }
  return closest;
}

export function readTourProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(TOUR_PROGRESS_KEY));
    return Array.isArray(saved) ? LIGHTHOUSE_STOPS.filter(({ id }) => saved.includes(id)).map(({ id }) => id) : [];
  } catch {
    return [];
  }
}

export function saveTourProgress(visited) {
  try {
    localStorage.setItem(TOUR_PROGRESS_KEY, JSON.stringify(visited));
  } catch {
    // The current tour still works when browser storage is unavailable.
  }
}
