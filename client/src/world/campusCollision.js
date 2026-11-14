import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

// Va chạm trong trường dò thẳng trên lưới của mô hình, nên tự khớp khi mô hình thay đổi.
const HALF_EXTENT = 28; // Ranh giới khu vực đi bộ quanh sân trường (m)
const PLAYER_RADIUS = 0.4;
const STEP_HEIGHT = 0.4; // Bậc cao nhất nhân vật tự bước lên được (bậc thềm, bồn cỏ; ghế và bàn thì không)
const BODY_HEIGHTS = [0.45, 0.9, 1.4]; // Độ cao dò tường, tính từ bàn chân
const MAX_DROP = 50;
// Cờ dây, vạch sơn, đèn và mặt nước không cản đường.
const PASS_THROUGH = /^MAT_(Bunt_|Marking_|Light_Glow|Water_)/;

const DOWN = new THREE.Vector3(0, -1, 0);
const ray = new THREE.Ray();
let bvh = null;

// Gom mọi tam giác của trường vào một lưới duy nhất trong tọa độ thế giới.
// Tọa độ đỉnh trong GLB đã nén là số nguyên lượng tử hóa, nên phải đọc qua fromBufferAttribute
// để được giá trị thật trước khi áp ma trận của mesh.
export function buildCampusCollision(scene) {
  scene.updateMatrixWorld(true);
  const meshes = [];
  let vertexCount = 0;
  scene.traverse((child) => {
    if (!child.isMesh || PASS_THROUGH.test(child.material?.name || '')) return;
    meshes.push(child);
    vertexCount += (child.geometry.index || child.geometry.attributes.position).count;
  });
  const positions = new Float32Array(vertexCount * 3);
  const vertex = new THREE.Vector3();
  let offset = 0;
  for (const mesh of meshes) {
    const { index, attributes } = mesh.geometry;
    const count = (index || attributes.position).count;
    for (let i = 0; i < count; i++) {
      vertex.fromBufferAttribute(attributes.position, index ? index.getX(i) : i).applyMatrix4(mesh.matrixWorld);
      vertex.toArray(positions, offset);
      offset += 3;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  bvh = new MeshBVH(geometry);
  return () => {
    bvh = null;
    geometry.dispose();
  };
}

function firstHit(maxDistance) {
  const hit = bvh.raycastFirst(ray, THREE.DoubleSide);
  return hit && hit.distance <= maxDistance ? hit : null;
}

// Độ cao mặt đất dưới điểm (x, z), dò từ ngang tầm bước chân của nhân vật đang đứng ở độ cao feetY.
// Trả về null khi bên dưới không có gì.
export function campusGroundAt(x, feetY, z) {
  if (!bvh) return 0;
  ray.origin.set(x, feetY + STEP_HEIGHT, z);
  ray.direction.copy(DOWN);
  const hit = firstHit(STEP_HEIGHT + MAX_DROP);
  return hit ? hit.point.y : null;
}

export function campusCanWalk(from, toX, toZ) {
  if (Math.abs(toX) > HALF_EXTENT || Math.abs(toZ) > HALF_EXTENT) return false;
  if (!bvh) return true;
  const dx = toX - from.x;
  const dz = toZ - from.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 1e-6) return true;
  for (const height of BODY_HEIGHTS) {
    ray.origin.set(from.x, from.y + height, from.z);
    ray.direction.set(dx / distance, 0, dz / distance);
    if (firstHit(distance + PLAYER_RADIUS)) return false;
  }
  return campusGroundAt(toX, from.y, toZ) !== null;
}

// Khoảng cách camera lùi được từ `target` theo `direction` trước khi chạm tường hoặc mái.
export function campusCameraDistance(target, direction, maxDistance) {
  if (!bvh) return maxDistance;
  ray.origin.copy(target);
  ray.direction.copy(direction);
  const hit = firstHit(maxDistance);
  return hit ? Math.max(0.8, hit.distance - 0.25) : maxDistance;
}
