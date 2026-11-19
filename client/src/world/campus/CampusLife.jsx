import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useStore } from '../../store/useStore';
import { campusGroundAt } from '../campusCollision';
import { MODEL_URLS } from '../models';

const UP = new THREE.Vector3(0, 1, 0);

const BACKPACK_PALETTE = [
  ['#2E73BA', '#1E4D80'], // xanh dương
  ['#DB6D85', '#A9435A'], // hồng phấn
  ['#3E897E', '#245851'], // xanh ngọc
  ['#425D7B', '#283A4E'], // xanh than
  ['#C87A2E', '#8B4D18'], // cam đất
  ['#6D598E', '#483A63'], // tím trầm
];

const HAIR_SHADES = ['#1B1614', '#241B17', '#151211', '#2B201A'];

function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function routeHeading(route, fallbackFacing = 0) {
  if (!route || route.length < 2) return fallbackFacing;
  return Math.atan2(route[1][0] - route[0][0], route[1][1] - route[0][1]);
}

/**
 * Tính đúng tọa độ thế giới Three.js [x, y, z] và góc xoay Y cho học sinh ngồi ghế lớp học.
 * Phản ánh chính xác hàm build_classroom_interior trong assets/school/generate_blockout.py.
 */
function classroomSeat(cx, cy, zFloor, roomL, yawBl, colSign, rowIdx, seatSide, { model, clip = 'Sit', tier = 'high', variant = 0 }) {
  const firstRowY = roomL / 2.0 - 2.28;
  const rowPitch = roomL < 7.2 ? 1.26 : 1.38;
  const dy = firstRowY - rowIdx * rowPitch;
  const lx = colSign * 1.18 + seatSide * 0.30;
  // Dịch lùi 2 cm về phía lưng ghế (y hệt render_sit_check trong generate_students_mpfb.py)
  const ly = dy - 0.44 - 0.02;
  const cosY = Math.cos(yawBl);
  const sinY = Math.sin(yawBl);
  const bx = cx + lx * cosY - ly * sinY;
  const by = cy + lx * sinY + ly * cosY;
  // Hướng nhìn +Y local trong Blender quy sang góc Y của Three.js (cả 4 model nhìn +Z khi yaw = 0)
  const facing = Math.atan2(-sinY, -cosY);
  return {
    id: `sit_${Math.round(bx * 10)}_${Math.round(by * 10)}`,
    mode: 'sit',
    model,
    clip,
    tier,
    variant,
    position: [bx, zFloor, -by],
    facing,
  };
}

// Danh sách học sinh ngồi trong các phòng học Tầng 1 dễ quan sát từ cửa sổ & hành lang (không đeo ba lô).
const CLASSROOM_STUDENTS = [
  // Phòng A3 (BLD_A Tầng 1, ngay cạnh sảnh chính phía Đông courtyard)
  classroomSeat(19.585, 1.40, 0.30, 8.10, Math.PI, 1, 0, -1, { model: 'studentPrimaryGirl', clip: 'RaiseHand', tier: 'low', variant: 0 }),
  classroomSeat(19.585, 1.40, 0.30, 8.10, Math.PI, 1, 0, 1, { model: 'studentPrimaryBoy', clip: 'Sit', tier: 'low', variant: 1 }),
  classroomSeat(19.585, 1.40, 0.30, 8.10, Math.PI, -1, 1, -1, { model: 'studentPrimaryBoy', clip: 'RaiseHand', tier: 'low', variant: 2 }),
  classroomSeat(19.585, 1.40, 0.30, 8.10, Math.PI, -1, 1, 1, { model: 'studentPrimaryGirl', clip: 'Sit', tier: 'low', variant: 3 }),

  // Phòng A2 (BLD_A Tầng 1 phía Nam)
  classroomSeat(19.585, -16.25, 0.30, 8.80, Math.PI, 1, 0, -1, { model: 'studentPrimaryBoy', clip: 'Sit', tier: 'medium', variant: 4 }),
  classroomSeat(19.585, -16.25, 0.30, 8.80, Math.PI, 1, 1, 1, { model: 'studentPrimaryGirl', clip: 'RaiseHand', tier: 'medium', variant: 5 }),
  classroomSeat(19.585, -16.25, 0.30, 8.80, Math.PI, -1, 0, 1, { model: 'studentPrimaryGirl', clip: 'Sit', tier: 'high', variant: 1 }),
  classroomSeat(19.585, -16.25, 0.30, 8.80, Math.PI, -1, 2, -1, { model: 'studentPrimaryBoy', clip: 'Sit', tier: 'high', variant: 2 }),

  // Phòng A4 (BLD_A Tầng 1 phía Bắc — học sinh THCS)
  classroomSeat(19.585, 10.05, 0.30, 8.80, Math.PI, 1, 0, -1, { model: 'studentMidGirl', clip: 'Sit', tier: 'high', variant: 3 }),
  classroomSeat(19.585, 10.05, 0.30, 8.80, Math.PI, 1, 0, 1, { model: 'studentMidBoy', clip: 'RaiseHand', tier: 'high', variant: 4 }),
  classroomSeat(19.585, 10.05, 0.30, 8.80, Math.PI, -1, 1, 1, { model: 'studentMidGirl', clip: 'Sit', tier: 'high', variant: 0 }),

  // Phòng C2-1 (Tòa C2 Tầng 1 phía Tây — học sinh THCS)
  classroomSeat(-28.945, 7.14, 0.28, 9.50, 0.0, 1, 0, -1, { model: 'studentMidBoy', clip: 'Sit', tier: 'medium', variant: 2 }),
  classroomSeat(-28.945, 7.14, 0.28, 9.50, 0.0, 1, 1, 1, { model: 'studentMidGirl', clip: 'RaiseHand', tier: 'medium', variant: 1 }),
  classroomSeat(-28.945, 7.14, 0.28, 9.50, 0.0, -1, 0, 1, { model: 'studentMidGirl', clip: 'Sit', tier: 'high', variant: 5 }),
];

// Học sinh đi bộ, chạy chơi & trò chuyện quanh sân trường (lối đi thông thoáng, tránh bồn cây, ghế đá & cột).
const ACTIVE_STUDENTS = [
  // Lối sân chính phía Đông courtyard (gần tầm mắt khi vừa vào trường)
  { id: 'east_mid_boy', mode: 'walk', model: 'studentMidBoy', route: [[6.2, 13.0], [6.2, -9.0], [8.8, -16.5]], speed: 1.25, pause: 3.5, tier: 'low', variant: 3, scale: 1.02 },
  { id: 'east_mid_girl', mode: 'walk', model: 'studentMidGirl', route: [[7.2, 12.6], [7.2, -9.2], [9.8, -16.0]], speed: 1.24, pause: 3.5, tier: 'low', variant: 2, scale: 0.99 },
  { id: 'east_pri_girl', mode: 'walk', model: 'studentPrimaryGirl', route: [[10.5, 22.0], [10.8, 7.5], [11.6, -2.5]], speed: 1.20, pause: 4.0, tier: 'low', variant: 1, scale: 0.98 },
  { id: 'east_porch_idle', mode: 'walk', model: 'studentMidGirl', route: [[11.6, -5.2]], facing: -2.15, tier: 'medium', variant: 0, scale: 1.01 },

  // Khu vui chơi Ô cỏ 1 (chạy nhảy & xem chơi dọc mép sân bê tông thông thoáng X=-10..-3, Z=+5..+9)
  { id: 'play_run_boy', mode: 'walk', model: 'studentPrimaryBoy', route: [[-3.6, 5.8], [-9.4, 5.8], [-9.4, 8.6], [-3.4, 8.2]], speed: 2.35, pause: 1.4, run: true, tier: 'low', variant: 0, scale: 0.96 },
  { id: 'play_run_girl', mode: 'walk', model: 'studentPrimaryGirl', route: [[-8.6, 8.4], [-3.4, 7.6], [-4.0, 5.6]], speed: 2.25, pause: 1.8, run: true, tier: 'low', variant: 5, scale: 1.01 },
  { id: 'play_watch_boy', mode: 'walk', model: 'studentPrimaryBoy', route: [[-5.8, 5.1]], facing: 0.35, tier: 'medium', variant: 4, scale: 0.99 },

  // Sân cầu lông phía Tây Bắc sân trường (X=-9..-3.3, Z=-18.5..-5.5)
  { id: 'badminton_n', mode: 'walk', model: 'studentMidBoy', route: [[-6.2, -16.4], [-4.8, -14.2], [-7.6, -15.4]], speed: 1.45, pause: 2.0, tier: 'medium', variant: 4, scale: 1.03 },
  { id: 'badminton_s', mode: 'walk', model: 'studentMidGirl', route: [[-6.2, -7.8], [-7.4, -9.8], [-4.8, -8.5]], speed: 1.40, pause: 2.2, tier: 'high', variant: 2, scale: 0.98 },

  // Hành lang Tầng 1 Tòa A (nền cao 0.30m, tâm hành lang X=15.4)
  { id: 'corr_a_girl', mode: 'walk', model: 'studentPrimaryGirl', route: [[15.4, 17.5], [15.4, -12.0]], speed: 1.10, pause: 4.0, baseY: 0.30, tier: 'medium', variant: 1, scale: 1.0 },
  { id: 'corr_a_boy', mode: 'walk', model: 'studentPrimaryBoy', route: [[15.4, -10.5], [15.4, 15.0]], speed: 1.08, pause: 4.5, baseY: 0.30, tier: 'high', variant: 2, scale: 0.97 },
  { id: 'corr_a4_idle', mode: 'walk', model: 'studentMidBoy', route: [[15.4, -8.5]], facing: -Math.PI / 2, baseY: 0.30, tier: 'high', variant: 3, scale: 1.02 },

  // Sân Tây cạnh Tòa C2 & hàng ghế đá (làn trống X=-21..-12)
  { id: 'west_pri_girl', mode: 'walk', model: 'studentPrimaryGirl', route: [[-12.2, -14.5], [-12.2, -3.5], [-12.2, 6.0]], speed: 1.12, pause: 4.0, tier: 'medium', variant: 3, scale: 0.97 },
  { id: 'west_c2_boy', mode: 'walk', model: 'studentMidBoy', route: [[-21.2, -11.5], [-16.0, -7.5], [-13.2, -10.5]], speed: 1.18, pause: 3.5, tier: 'high', variant: 0, scale: 1.0 },

  // Phía cổng trường tiến vào sân giữa
  { id: 'gate_pri_boy', mode: 'walk', model: 'studentPrimaryBoy', route: [[4.5, 28.0], [5.4, 17.5], [3.8, 10.5]], speed: 1.18, pause: 4.5, tier: 'high', variant: 5, scale: 1.02 },
  { id: 'gate_mid_girl', mode: 'walk', model: 'studentMidGirl', route: [[9.0, 26.5], [11.0, 14.0], [9.5, 5.0]], speed: 1.15, pause: 4.0, tier: 'high', variant: 1, scale: 0.96 },
];

const TIER_ALLOW = {
  low: new Set(['low']),
  medium: new Set(['low', 'medium']),
  high: new Set(['low', 'medium', 'high']),
};

function cloneMaterialWithTint(child, paletteIdx) {
  if (!child.material) return;
  const [packHex, trimHex] = BACKPACK_PALETTE[paletteIdx % BACKPACK_PALETTE.length];
  const hairHex = HAIR_SHADES[paletteIdx % HAIR_SHADES.length];
  const applyOne = (mat) => {
    if (!mat) return mat;
    if (mat.name === 'MAT_Backpack') {
      const m = mat.clone();
      m.color.set(packHex);
      return m;
    }
    if (mat.name === 'MAT_BackpackTrim') {
      const m = mat.clone();
      m.color.set(trimHex);
      return m;
    }
    if (mat.name === 'MAT_Hair') {
      const m = mat.clone();
      m.color.set(hairHex);
      return m;
    }
    return mat;
  };
  child.material = Array.isArray(child.material) ? child.material.map(applyOne) : applyOne(child.material);
}

function StudentActor({ student, source, animations }) {
  const group = useRef();
  const isSit = student.mode === 'sit';

  const { scene, mixer, actions } = useMemo(() => {
    const clone = cloneSkinned(source);
    clone.traverse((child) => {
      if (child.name === 'Student_Backpack' && isSit) {
        child.visible = false;
      }
      if (child.isMesh) {
        child.castShadow = !isSit;
        child.receiveShadow = true;
        cloneMaterialWithTint(child, student.variant ?? 0);
      }
    });
    const clipMixer = new THREE.AnimationMixer(clone);
    const byName = Object.fromEntries(animations.map((clip) => [clip.name, clipMixer.clipAction(clip)]));
    return { scene: clone, mixer: clipMixer, actions: byName };
  }, [source, animations, isSit, student.variant]);

  const initFacing = isSit ? (student.facing ?? 0) : routeHeading(student.route, student.facing ?? 0);

  const state = useRef({
    leg: 0,
    forward: true,
    waitUntil: (student.variant ?? 0) * 0.7,
    clip: '',
    facing: initFacing,
  });

  useEffect(() => {
    if (!isSit) return undefined;
    const act = actions[student.clip] || actions.Sit;
    if (act) {
      act.reset();
      const dur = act.getClip()?.duration || 2;
      act.time = ((student.variant ?? 0) * 0.67) % dur;
      act.play();
      mixer.update(0);
    }
    return () => mixer.stopAllAction();
  }, [actions, mixer, isSit, student.clip, student.variant]);

  useEffect(() => {
    if (isSit) return undefined;
    return () => mixer.stopAllAction();
  }, [mixer, isSit]);

  useFrame(({ camera, clock }, delta) => {
    if (!group.current) return;
    const dt = Math.min(delta, 0.1);
    const pos = group.current.position;
    const distSq = camera.position.distanceToSquared(pos);

    if (isSit) {
      if (distSq <= 1600) mixer.update(dt);
      return;
    }

    const s = state.current;
    const play = (name) => {
      if (s.clip === name || !actions[name]) return;
      actions[s.clip]?.fadeOut(0.28);
      actions[name].reset().fadeIn(0.28).play();
      s.clip = name;
    };

    const { route } = student;
    const playerPos = useStore.getState().playerPosition;
    const blockedByPlayer = route.length > 1
      && (pos.x - playerPos[0]) ** 2 + (pos.z - playerPos[2]) ** 2 < 2.56;

    if (route.length === 1 || clock.elapsedTime < s.waitUntil || blockedByPlayer) {
      play('Idle');
    } else {
      const next = route[s.forward ? s.leg + 1 : s.leg - 1];
      const dx = next[0] - pos.x;
      const dz = next[1] - pos.z;
      const distance = Math.hypot(dx, dz);
      const step = (student.speed || 1.15) * dt;
      if (distance <= step) {
        pos.x = next[0];
        pos.z = next[1];
        s.leg += s.forward ? 1 : -1;
        if (s.leg === route.length - 1 || s.leg === 0) {
          s.forward = s.leg === 0;
          s.waitUntil = clock.elapsedTime + (student.pause ?? 3);
        }
      } else {
        const yaw = Math.atan2(dx, dz);
        const turn = angleDelta(s.facing, yaw);
        s.facing += turn * (1 - Math.exp(-10 * dt));
        group.current.quaternion.setFromAxisAngle(UP, s.facing);
        // Xoay xong mới bước thẳng để học sinh không trượt ngang hoặc giật lùi khi quay đầu
        const moveScale = Math.max(0, Math.cos(turn));
        if (moveScale > 0.25) {
          const move = Math.min(distance, step * moveScale);
          pos.x += (dx / distance) * move;
          pos.z += (dz / distance) * move;
        }
        play(student.run ? 'Run' : 'Walk');
      }
    }

    const ground = campusGroundAt(pos.x, pos.y + 0.6, pos.z);
    if (ground !== null && Math.abs(ground - pos.y) < 0.85) {
      pos.y = ground;
    }

    if (distSq <= 2600) {
      mixer.update(dt);
    }
  });

  const initPos = isSit ? student.position : [student.route[0][0], student.baseY ?? 0, student.route[0][1]];
  const scale = isSit ? 1 : (student.scale ?? 1);
  return (
    <group ref={group} name={student.id} position={initPos} rotation-y={initFacing} scale={scale}>
      {/* Phôi MPFB2 dựng nhìn +Y trong Blender (tương ứng -Z trong glTF), xoay 180° sang +Z để khớp hướng di chuyển & ghế ngồi */}
      <group rotation-y={Math.PI}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function StudentFromModel({ student }) {
  const { scene, animations } = useGLTF(MODEL_URLS[student.model]);
  return <StudentActor student={student} source={scene} animations={animations} />;
}

export function CampusLife() {
  const quality = useStore((state) => state.quality);
  const allowed = TIER_ALLOW[quality] || TIER_ALLOW.medium;
  const active = useMemo(
    () => [...CLASSROOM_STUDENTS, ...ACTIVE_STUDENTS].filter((s) => allowed.has(s.tier)),
    [allowed],
  );
  return active.map((student) => <StudentFromModel key={student.id} student={student} />);
}
