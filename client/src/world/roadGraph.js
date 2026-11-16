import ROADS from '../education/island-roads.json';
import { METERS_PER_UNIT, VERTICAL_EXAGGERATION, lonLatToWorld } from './geo';

// Mạng đường để lái xe: mỗi điểm của dữ liệu đường là một nút, hai điểm liền nhau là một cạnh.
// Các đoạn đường của OpenStreetMap dùng chung tọa độ tại ngã rẽ, nên chúng tự nối vào nhau.
// Nút có từ 3 cạnh trở lên là ngã rẽ; nút có 1 cạnh là đường cụt.
const LIFT = 0.1;

function build() {
  const index = new Map();
  const nodes = [];
  const nodeFor = ([longitude, latitude, height]) => {
    const key = `${longitude},${latitude}`;
    let id = index.get(key);
    if (id === undefined) {
      const [x, z] = lonLatToWorld(longitude, latitude);
      id = nodes.length;
      nodes.push({ x, y: (height / METERS_PER_UNIT) * VERTICAL_EXAGGERATION + LIFT, z, neighbors: [] });
      index.set(key, id);
    }
    return id;
  };
  for (const line of [...ROADS.roads, ...(ROADS.minorRoads || [])]) {
    for (let i = 1; i < line.length; i++) {
      const a = nodeFor(line[i - 1]);
      const b = nodeFor(line[i]);
      if (a === b) continue;
      if (!nodes[a].neighbors.includes(b)) nodes[a].neighbors.push(b);
      if (!nodes[b].neighbors.includes(a)) nodes[b].neighbors.push(a);
    }
  }
  return nodes;
}

export const ROAD_NODES = build();

export function nearestRoadNode(x, z) {
  let best = 0;
  let bestDistance = Infinity;
  for (let id = 0; id < ROAD_NODES.length; id++) {
    const node = ROAD_NODES[id];
    const distance = (node.x - x) ** 2 + (node.z - z) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = id;
    }
  }
  return best;
}

export function edgeLength(a, b) {
  const p = ROAD_NODES[a];
  const q = ROAD_NODES[b];
  return Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z);
}

// Góc rẽ (radian) khi đi from -> via -> to. Âm là rẽ trái, dương là rẽ phải, 0 là đi thẳng.
export function turnAngle(from, via, to) {
  const a = ROAD_NODES[from];
  const b = ROAD_NODES[via];
  const c = ROAD_NODES[to];
  const hx = b.x - a.x;
  const hz = b.z - a.z;
  const vx = c.x - b.x;
  const vz = c.z - b.z;
  return Math.atan2(hx * vz - hz * vx, hx * vx + hz * vz);
}

// Chọn nhánh đi tiếp tại nút `via` khi tới từ `from`. `steer`: -1 rẽ trái, 0 đi thẳng, 1 rẽ phải.
// Trả về null nếu là đường cụt.
export function chooseNext(from, via, steer) {
  const options = ROAD_NODES[via].neighbors.filter((id) => id !== from);
  if (options.length === 0) return null;
  const target = (steer * Math.PI) / 2;
  let best = options[0];
  let bestScore = Infinity;
  for (const id of options) {
    const score = Math.abs(turnAngle(from, via, id) - target);
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

const SIDE_ANGLE = Math.PI / 5; // Lệch quá 36° thì coi là rẽ

// Tìm ngã rẽ kế tiếp khi đang đi from -> to. Trả về { distance, left, straight, right } hoặc null.
export function nextJunction(from, to, alreadyTravelled, maxDistance) {
  let previous = from;
  let current = to;
  let distance = edgeLength(from, to) - alreadyTravelled;
  while (distance <= maxDistance) {
    const options = ROAD_NODES[current].neighbors.filter((id) => id !== previous);
    if (options.length === 0) return { distance, deadEnd: true };
    if (options.length > 1) {
      const result = { distance, left: false, straight: false, right: false };
      for (const id of options) {
        const angle = turnAngle(previous, current, id);
        if (angle < -SIDE_ANGLE) result.left = true;
        else if (angle > SIDE_ANGLE) result.right = true;
        else result.straight = true;
      }
      return result;
    }
    distance += edgeLength(current, options[0]);
    previous = current;
    current = options[0];
  }
  return null;
}
