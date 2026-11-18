import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MODEL_URLS } from '../models';
import { campusGroundAt } from '../campusCollision';
import { useStore } from '../../store/useStore';
import { VAN_GIA_OFFSET } from './layout';

// Cảng Vạn Gia "sống": thuyền và phao dập dềnh, cờ bay, tàu khách ra vào cập cầu dẫn,
// mòng biển lượn và người đi lại trên bến. Vật thể động nằm trong cang_van_gia_dong.glb
// (sinh bởi assets/landmarks/cang_van_gia/build_cang_van_gia.py).

const FERRY = 'Tau_Vinh_Thuc_06';
const deg = (value) => (value * Math.PI) / 180;
const FERRY_HEADING0 = deg(172); // Hướng của tàu 06 trong Blender (mũi tàu theo +X, quay quanh trục đứng)
const DOCK_HEADING = deg(90); // Mũi tàu hướng vào bờ khi cập cầu dẫn

// Tuyến tàu khách, tọa độ (x, z) trong hệ của mô hình Blender sau khi xuất glTF: (x Blender, -y Blender).
const ROUTE_IN = [[-8, 60], [28, 72], [55.6, 56], [55.6, 33]]; // ngoài khơi -> cập mạn đông cầu dẫn
const ROUTE_BACK = [[55.6, 33], [55.6, 45]]; // lùi ra khỏi cầu dẫn, mũi vẫn hướng vào bờ
const ROUTE_OUT = [[55.6, 45], [30, 74], [-8, 60]]; // quay đầu ra khơi
// Lịch một vòng (giây): chờ ngoài khơi, chạy vào, đậu đón khách, lùi ra, chạy ra khơi.
const FERRY_PLAN = [
  { until: 6, mode: 'wait', at: ROUTE_IN[0], heading: FERRY_HEADING0 },
  { until: 34, mode: 'travel', path: ROUTE_IN },
  { until: 56, mode: 'wait', at: ROUTE_IN[3], heading: DOCK_HEADING },
  { until: 62, mode: 'reverse', path: ROUTE_BACK, heading: DOCK_HEADING },
  { until: 88, mode: 'travel', path: ROUTE_OUT },
  { until: 94, mode: 'wait', at: ROUTE_IN[0], heading: FERRY_HEADING0 },
];
const FERRY_CYCLE = FERRY_PLAN[FERRY_PLAN.length - 1].until;

function pathLength(path) {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return total;
}

function samplePath(path, fraction) {
  let remaining = Math.min(Math.max(fraction, 0), 1) * pathLength(path);
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1];
    const [bx, bz] = path[i];
    const length = Math.hypot(bx - ax, bz - az);
    if (remaining <= length || i === path.length - 1) {
      const t = length > 0 ? Math.min(remaining / length, 1) : 0;
      return [ax + (bx - ax) * t, az + (bz - az) * t];
    }
    remaining -= length;
  }
  return path[path.length - 1];
}

const smooth = (t) => t * t * (3 - 2 * t);
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

// Vị trí và hướng mong muốn của tàu khách tại thời điểm `time` trong vòng.
function ferryTarget(time) {
  let start = 0;
  for (const step of FERRY_PLAN) {
    if (time < step.until) {
      const fraction = smooth((time - start) / (step.until - start));
      if (step.mode === 'wait') return { position: step.at, heading: step.heading };
      const position = samplePath(step.path, fraction);
      if (step.mode === 'reverse') return { position, heading: step.heading };
      const ahead = samplePath(step.path, Math.min(fraction + 0.02, 1));
      const dx = ahead[0] - position[0];
      const dz = ahead[1] - position[1];
      return { position, heading: Math.hypot(dx, dz) > 1e-3 ? Math.atan2(-dz, dx) : null };
    }
    start = step.until;
  }
  return { position: ROUTE_IN[0], heading: FERRY_HEADING0 };
}

// Số giả ngẫu nhiên ổn định theo tên, để mỗi thuyền dập dềnh lệch nhịp nhau.
function phaseOf(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return (hash / 9973) * Math.PI * 2;
}

const flagTime = { value: 0 };

// Lá cờ uốn sóng trong shader. Lưới đã lượng tử hóa (KHR_mesh_quantization), nên biên độ tính theo
// khung bao của chính lưới và tỉ lệ của node, không phụ thuộc đơn vị lượng tử.
function makeFlagMaterial(mesh) {
  mesh.geometry.computeBoundingBox();
  const { min, max } = mesh.geometry.boundingBox;
  const scale = mesh.getWorldScale(new THREE.Vector3());
  const material = mesh.material.clone();
  const flag = new THREE.Vector4(min.x, Math.max(max.x - min.x, 1e-6), 0.22 / Math.max(Math.abs(scale.z), 1e-6), 0);
  material.side = THREE.DoubleSide;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = flagTime;
    shader.uniforms.uFlag = { value: flag };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform vec4 uFlag;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float flagT = clamp((position.x - uFlag.x) / uFlag.y, 0.0, 1.0);
        transformed.z += sin(flagT * 7.0 - uTime * 4.5) * uFlag.z * flagT;`,
      );
  };
  material.customProgramCacheKey = () => `van-gia-flag-${mesh.name}`;
  mesh.material = material;
}

function Harbor() {
  const { scene } = useGLTF(MODEL_URLS.vanGiaDong);

  // Bọc mỗi vật thể trong một trục quay đặt ở tâm của nó: sau khi lượng tử hóa, gốc của node không còn ở tâm,
  // quay quanh gốc sẽ làm thuyền lắc lệch. Chỉ bọc một lần, vì useGLTF dùng lại cùng một cảnh khi quay lại cảng.
  const items = useMemo(() => {
    if (scene.userData.vanGiaItems) return scene.userData.vanGiaItems;
    scene.position.copy(VAN_GIA_OFFSET);
    scene.updateMatrixWorld(true);
    const list = [];
    for (const node of [...scene.children]) {
      node.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      if (node.name.startsWith('Co_')) {
        node.traverse((child) => child.isMesh && makeFlagMaterial(child));
        continue;
      }
      const center = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
      const pivot = new THREE.Group();
      pivot.name = `pivot_${node.name}`;
      pivot.rotation.order = 'YXZ';
      pivot.position.copy(scene.worldToLocal(center));
      scene.add(pivot);
      pivot.updateMatrixWorld(true);
      pivot.attach(node);
      list.push({
        pivot,
        base: pivot.position.clone(),
        phase: phaseOf(node.name),
        kind: node.name === FERRY ? 'ferry' : node.name.startsWith('Phao_') ? 'buoy' : 'boat',
      });
    }
    scene.userData.vanGiaItems = list;
    return list;
  }, [scene]);

  const ferry = useRef({ heading: FERRY_HEADING0 });

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    flagTime.value = t;
    for (const item of items) {
      const { pivot, base, phase, kind } = item;
      const speed = kind === 'buoy' ? 1.7 : 1.1;
      const lift = Math.sin(t * speed + phase) * (kind === 'buoy' ? 0.12 : 0.07);
      pivot.rotation.x = Math.sin(t * speed * 0.8 + phase) * 0.022;
      pivot.rotation.z = Math.sin(t * speed * 0.6 + phase * 1.7) * 0.03;
      if (kind !== 'ferry') {
        pivot.position.y = base.y + lift;
        continue;
      }
      const target = ferryTarget(t % FERRY_CYCLE);
      pivot.position.set(target.position[0], base.y + lift * 0.6, target.position[1]);
      const state = ferry.current;
      if (target.heading !== null) {
        // Bẻ lái từ từ, tối đa khoảng 30° mỗi giây
        const turn = angleDelta(state.heading, target.heading);
        state.heading += Math.sign(turn) * Math.min(Math.abs(turn), 0.55 * Math.min(delta, 0.1));
        state.heading = Math.atan2(Math.sin(state.heading), Math.cos(state.heading)); // giữ trong (-π, π]
      }
      pivot.rotation.y = state.heading - FERRY_HEADING0;
    }
  });

  return <primitive object={scene} />;
}

// Mòng biển: một InstancedMesh hình chữ V, vỗ cánh bằng cách co giãn theo chiều đứng. Tọa độ cảnh (đã dời gốc).
const GULLS = [
  { center: [4, 18], radius: 14, height: 10, speed: 0.28, phase: 0 },
  { center: [4, 18], radius: 20, height: 13, speed: -0.2, phase: 2 },
  { center: [-12, 24], radius: 10, height: 8.5, speed: 0.34, phase: 4 },
  { center: [-112, 16], radius: 12, height: 10, speed: 0.3, phase: 1 },
  { center: [-112, 16], radius: 18, height: 13, speed: -0.22, phase: 3 },
  { center: [26, 8], radius: 16, height: 14, speed: 0.2, phase: 5 },
];

// Hình con mòng biển (đầu chim theo +Z, sải cánh 2 m, lớn hơn chim thật một chút để còn thấy từ xa):
// thân hình thoi, cánh vểnh chữ V rõ để nhìn ngang vẫn thấy dáng, đầu cánh xám đậm để tách khỏi nền trời.
function buildGullGeometry() {
  const WHITE = [0.97, 0.97, 0.97];
  const GREY = [0.62, 0.66, 0.7];
  const TIP = [0.18, 0.2, 0.24];
  const positions = [];
  const colors = [];
  const tri = (a, b, c, color) => {
    positions.push(...a, ...b, ...c);
    colors.push(...color, ...color, ...color);
  };
  for (const side of [1, -1]) {
    const rootLead = [0, 0.02, 0.26];
    const rootTrail = [0, 0.02, -0.2];
    const midLead = [side * 0.68, 0.34, 0.18];
    const midTrail = [side * 0.68, 0.34, -0.14];
    const tip = [side * 1.0, 0.5, -0.04];
    tri(rootLead, rootTrail, midTrail, GREY); // mặt cánh phía trong
    tri(rootLead, midTrail, midLead, GREY);
    tri(midLead, midTrail, tip, TIP); // đầu cánh
  }
  const head = [0, 0.02, 0.6];
  const tail = [0, 0.04, -0.5];
  const ring = [[0, 0.11, 0.1], [0.09, 0, 0.1], [0, -0.09, 0.1], [-0.09, 0, 0.1]];
  for (let i = 0; i < 4; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % 4];
    tri(head, a, b, WHITE);
    tri(tail, b, a, WHITE);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function Gulls() {
  const mesh = useRef();
  const geometry = useMemo(() => buildGullGeometry(), []);
  const temp = useMemo(() => ({ matrix: new THREE.Matrix4(), position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), euler: new THREE.Euler(0, 0, 0, 'YXZ'), scale: new THREE.Vector3() }), []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    GULLS.forEach((gull, i) => {
      const angle = t * gull.speed + gull.phase;
      temp.position.set(
        gull.center[0] + Math.cos(angle) * gull.radius,
        gull.height + Math.sin(t * 0.7 + gull.phase) * 1.2,
        gull.center[1] + Math.sin(angle) * gull.radius,
      );
      // Bay theo tiếp tuyến của vòng lượn (thân chim dọc trục Z), nghiêng cánh vào phía trong vòng
      const vx = -Math.sin(angle) * gull.speed;
      const vz = Math.cos(angle) * gull.speed;
      temp.euler.set(0, Math.atan2(vx, vz), -0.25 * Math.sign(gull.speed));
      temp.quaternion.setFromEuler(temp.euler);
      // Vỗ cánh: co giãn chiều đứng, có lúc âm để cánh đập xuống dưới thân; thỉnh thoảng lướt (cánh gần như yên)
      const glide = Math.sin(t * 0.5 + gull.phase) > 0.4 ? 0.25 : 1;
      const flap = Math.sin(t * 6 + gull.phase * 3) * glide;
      temp.scale.set(1, 0.45 + 0.85 * flap, 1);
      temp.matrix.compose(temp.position, temp.quaternion, temp.scale);
      mesh.current.setMatrixAt(i, temp.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, GULLS.length]} frustumCulled={false}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.9} />
    </instancedMesh>
  );
}

// Người dân Cảng Vạn Gia (mô hình Meshy, scripts/generate-port-people-meshy.mjs), tọa độ cảnh (đã dời gốc;
// mặt bến cao 0). Mỗi người đi qua lại giữa các điểm, dừng một lúc ở hai đầu; một điểm duy nhất = đứng yên.
// Mô hình Meshy nhìn về +Z khi chưa xoay, giống nhân vật khách du lịch của người chơi.
const PEOPLE = [
  // Khách vừa lên bờ: từ đầu bậc tàu khách qua vạch sang đường tới nhà chờ
  { model: 'portKhachDuLich', route: [[1, -1], [8, -5], [27, -8]], speed: 1.05, pause: 5 },
  // Nhân viên bến tàu đi lại trên cầu dẫn
  { model: 'portNhanVienBen', route: [[0, 11], [0, 36]], speed: 1.0, pause: 6 },
  // Ngư dân dạo ra cầu cảng bê tông
  { model: 'portNguDan', route: [[-114.5, 3], [-114.5, 26]], speed: 0.9, pause: 8 },
  // Chị bán hàng đứng sau quầy của quán đầu tiên ven kè, nhìn ra biển
  { model: 'portBanHang', route: [[-49, -4.1]], facing: 0 },
];

function Person({ person, source, animations }) {
  const group = useRef();
  const { scene, mixer, actions } = useMemo(() => {
    const clone = cloneSkinned(source);
    clone.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    const clipMixer = new THREE.AnimationMixer(clone);
    const byName = Object.fromEntries(animations.map((clip) => [clip.name, clipMixer.clipAction(clip)]));
    return { scene: clone, mixer: clipMixer, actions: byName };
  }, [source, animations]);

  // Lệch nhịp giữa các người (không đi đồng loạt)
  const state = useRef({ leg: 0, forward: true, waitUntil: Math.random() * 3, clip: '' });

  useEffect(() => () => mixer.stopAllAction(), [mixer]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const dt = Math.min(delta, 0.1);
    mixer.update(dt);
    const s = state.current;
    const position = group.current.position;
    const play = (name) => {
      if (s.clip === name || !actions[name]) return;
      actions[s.clip]?.fadeOut(0.3);
      actions[name].reset().fadeIn(0.3).play();
      s.clip = name;
    };
    const { route } = person;
    if (route.length === 1 || clock.elapsedTime < s.waitUntil) {
      play('Idle');
    } else {
      const next = route[s.forward ? s.leg + 1 : s.leg - 1];
      const dx = next[0] - position.x;
      const dz = next[1] - position.z;
      const distance = Math.hypot(dx, dz);
      const step = person.speed * dt;
      if (distance <= step) {
        position.x = next[0];
        position.z = next[1];
        s.leg += s.forward ? 1 : -1;
        if (s.leg === route.length - 1 || s.leg === 0) {
          s.forward = s.leg === 0;
          s.waitUntil = clock.elapsedTime + person.pause;
        }
      } else {
        position.x += (dx / distance) * step;
        position.z += (dz / distance) * step;
        const yaw = Math.atan2(dx, dz);
        group.current.rotation.y += angleDelta(group.current.rotation.y, yaw) * (1 - Math.exp(-10 * dt));
        play('Walk');
      }
    }
    const ground = campusGroundAt(position.x, position.y + 1, position.z);
    if (ground !== null) position.y = ground;
  });

  const [x, z] = person.route[0];
  return (
    <group ref={group} position={[x, 0, z]} rotation-y={person.facing ?? 0}>
      <primitive object={scene} />
    </group>
  );
}

function PersonFromModel({ person }) {
  const { scene, animations } = useGLTF(MODEL_URLS[person.model]);
  return <Person person={person} source={scene} animations={animations} />;
}

function People() {
  return PEOPLE.map((person) => <PersonFromModel key={person.model} person={person} />);
}

export function VanGiaLife() {
  const lowQuality = useStore((state) => state.quality === 'low');
  return (
    <>
      <Harbor />
      {!lowQuality && <Gulls />}
      {!lowQuality && <People />}
    </>
  );
}
