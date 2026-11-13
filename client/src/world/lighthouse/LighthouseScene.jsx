import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import {
  SEA_LEVEL,
  TOWER,
  HOUSE,
  PORCH,
  YARD,
  STAIRS,
  VIEWPOINT,
  FLAG,
  PALMS,
  BENCHES,
  LAMPS,
  BINOCULARS,
  BALUSTRADES,
  ROTUNDA_PILLAR_ANGLES,
  ROTUNDA_BAYS,
  ROTUNDA_BALUSTRADES,
  BALCONY_BALUSTRADES,
  MODEL_PEDESTAL,
  groundAt,
} from './layout';

// Tạo CanvasTexture 3D sắc nét cho biển tên & bảng trưng bày (không bị xuyên tường hay che màn hình)
function useSignTexture(bg, border, title, subtitle = '', width = 512, height = 160) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = border;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    ctx.fillStyle = '#FDE047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${subtitle ? 32 : 44}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(title, width / 2, subtitle ? height * 0.36 : height * 0.52);

    if (subtitle) {
      ctx.fillStyle = '#F1F5F9';
      ctx.font = '500 22px system-ui, -apple-system, sans-serif';
      const lines = subtitle.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, width / 2, height * 0.64 + i * 28);
      });
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [bg, border, title, subtitle, width, height]);
}

// Component dựng đoạn lan can con tiện trắng - tay vịn vàng kem
function BalustradeSegment({ seg, colorRail = '#E8C77A', colorPost = '#F4F1EA', height = 0.92 }) {
  const [ax, ay, az, bx, by, bz] = seg;
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const lenXZ = Math.hypot(dx, dz);
  const len3D = Math.hypot(dx, dy, dz);
  const angleY = Math.atan2(dx, dz);
  const pitch = -Math.atan2(dy, lenXZ);
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;
  const midZ = (az + bz) / 2;

  const numBalusters = Math.max(2, Math.floor(lenXZ / 0.45));
  const balusters = [];
  for (let i = 1; i < numBalusters; i++) {
    const t = i / numBalusters;
    balusters.push([ax + dx * t, ay + dy * t + height * 0.48, az + dz * t]);
  }

  return (
    <group>
      {/* Trụ đầu & cuối */}
      <mesh position={[ax, ay + height * 0.52, az]} castShadow receiveShadow>
        <boxGeometry args={[0.24, height * 1.04, 0.24]} />
        <meshStandardMaterial color={colorPost} roughness={0.65} />
      </mesh>
      <mesh position={[bx, by + height * 0.52, bz]} castShadow receiveShadow>
        <boxGeometry args={[0.24, height * 1.04, 0.24]} />
        <meshStandardMaterial color={colorPost} roughness={0.65} />
      </mesh>

      {/* Tay vịn trên & gờ dưới */}
      <group position={[midX, midY + height * 0.92, midZ]} rotation={[0, angleY, 0]}>
        <mesh rotation={[pitch, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.12, len3D]} />
          <meshStandardMaterial color={colorRail} roughness={0.55} />
        </mesh>
      </group>
      <group position={[midX, midY + 0.14, midZ]} rotation={[0, angleY, 0]}>
        <mesh rotation={[pitch, 0, 0]} receiveShadow>
          <boxGeometry args={[0.22, 0.16, len3D]} />
          <meshStandardMaterial color={colorRail} roughness={0.65} />
        </mesh>
      </group>

      {/* Các con tiện đứng */}
      {balusters.map((pos, idx) => (
        <mesh key={idx} position={pos} castShadow>
          <cylinderGeometry args={[0.045, 0.055, height * 0.72, 8]} />
          <meshStandardMaterial color={colorPost} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Cây cau / dừa cảnh trong khuôn viên
function PalmTree({ position }) {
  const [x, z] = position;
  const y = groundAt(x, z);
  const fronds = [0, 1, 2, 3, 4, 5, 6].map((i) => (i * Math.PI * 2) / 7);
  return (
    <group position={[x, y, z]}>
      {/* Bồn cây */}
      <mesh position={[0, 0.18, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.1, 0.36, 1.1]} />
        <meshStandardMaterial color="#F2EFE6" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.34, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.08, 0.9]} />
        <meshStandardMaterial color="#4A3728" roughness={0.9} />
      </mesh>
      {/* Thân cây */}
      <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.17, 4.0, 10]} />
        <meshStandardMaterial color="#6E533B" roughness={0.85} />
      </mesh>
      {/* Tán lá */}
      <group position={[0, 4.25, 0]}>
        {fronds.map((ang, idx) => (
          <group key={idx} rotation={[0.42, ang, 0]}>
            <mesh position={[0, 0.1, 0.85]} rotation={[0.3, 0, 0]} castShadow>
              <boxGeometry args={[0.36, 0.05, 1.75]} />
              <meshStandardMaterial color="#2D6A3E" roughness={0.65} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// Sa bàn thu nhỏ bên trong phòng truyền thống (dùng mô hình Meshy GLB)
function MiniatureLighthouseOnPedestal() {
  const { scene } = useGLTF('/models/hai_dang_vinh_thuc.glb');
  const mini = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = size.x > 0 ? 1.35 / size.x : 1;
    return { cloned, s, offset: [-center.x, -box.min.y, -center.z] };
  }, [scene]);

  return (
    <group position={[MODEL_PEDESTAL.x, HOUSE.floor, MODEL_PEDESTAL.z]}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.92, 1.02, 0.96, 24]} />
        <meshStandardMaterial color="#5C3A21" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.98, 0]} receiveShadow>
        <cylinderGeometry args={[0.98, 0.98, 0.06, 24]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.4} roughness={0.3} />
      </mesh>
      <group position={[0, 1.02, 0]} scale={mini.s}>
        <primitive object={mini.cloned} position={mini.offset} />
      </group>
    </group>
  );
}

export function LighthouseScene() {
  const timeOfDay = useStore((state) => state.timeOfDay);

  const beaconRef = useRef();
  const flagRef = useRef();

  const mainSignTex = useSignTexture('#B91C1C', '#FDE047', 'HẢI ĐĂNG VĨNH THỰC', '', 640, 128);
  const board1Tex = useSignTexture(
    '#0F172A',
    '#F59E0B',
    'LỊCH SỬ TRẠM ĐÈN (1962)',
    'Cột mốc hàng hải biên giới Đông Bắc\nXây dựng 1962 • Nâng cấp 1986, 2017',
    640,
    340,
  );
  const board2Tex = useSignTexture(
    '#0F172A',
    '#F59E0B',
    'THÔNG SỐ KỸ THUẬT',
    'Chiều cao tháp: 18,0 m • Tâm sáng: 84,5 m\nTầm hiệu lực ánh sáng: 21 hải lý',
    640,
    340,
  );
  const board3Tex = useSignTexture(
    '#0F172A',
    '#F59E0B',
    'NGƯỜI GIỮ LỬA BIỂN ĐÔNG BẮC',
    'Trực gác 24/7 đảm bảo an toàn hàng hải\nvà khẳng định chủ quyền biển đảo',
    640,
    340,
  );

  useFrame(({ clock }, dt) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y += dt * (timeOfDay === 'night' ? 1.15 : 0.45);
    }
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 3.2) * 0.12;
    }
  });

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  // Các bậc cầu thang từ sân (z=8.5, y=0) xuống điểm ngắm biển (z=24, y=-3.9)
  const stairSteps = useMemo(() => {
    const count = 26;
    const dz = (STAIRS.z1 - STAIRS.z0) / count;
    const dy = STAIRS.drop / count;
    const w = STAIRS.x1 - STAIRS.x0 - 0.35;
    const cx = (STAIRS.x0 + STAIRS.x1) / 2;
    return Array.from({ length: count }, (_, i) => ({
      pos: [cx, -dy * (i + 0.5), STAIRS.z0 + dz * (i + 0.5)],
      size: [w, dy + 0.08, dz + 0.04],
    }));
  }, []);

  return (
    <group name="Lighthouse_1to1_World">
      {/* 1. BIỂN ĐÔNG BẮC & SƯỜN ĐỒI MŨI ĐẦU TÁN */}
      <mesh position={[0, SEA_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial color={isNight ? '#082038' : '#0E6B8A'} roughness={0.25} metalness={0.15} />
      </mesh>

      {/* Khối đồi núi xanh bao quanh dưới chân trạm hải đăng */}
      <mesh position={[-2, -33.2, 6]} receiveShadow>
        <cylinderGeometry args={[28, 95, 65.8, 36]} />
        <meshStandardMaterial color="#2D5A36" roughness={0.9} />
      </mesh>
      {/* Vách đất đỏ taluy phía Đông Nam */}
      <mesh position={[22, -6.5, 16]} rotation={[0.15, -0.35, -0.25]} receiveShadow>
        <boxGeometry args={[18, 9, 26]} />
        <meshStandardMaterial color="#7C3F2C" roughness={0.92} />
      </mesh>

      {/* Mũi đảo và bãi biển Đầu Đông nhìn thấy ở phía xa */}
      <mesh position={[125, SEA_LEVEL + 18, -140]} receiveShadow>
        <coneGeometry args={[75, 42, 24]} />
        <meshStandardMaterial color="#2E5E3A" roughness={0.9} />
      </mesh>
      <mesh position={[65, SEA_LEVEL + 0.6, -95]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <ringGeometry args={[32, 48, 28, 1, 0, Math.PI * 0.85]} />
        <meshStandardMaterial color="#E6C994" roughness={0.85} />
      </mesh>

      {/* 2. SÂN GẠCH ĐỎ, BỜ KÈ ĐÁ HỘC & CẦU THANG */}
      <mesh position={[-1.0, -1.35, -0.75]} receiveShadow castShadow>
        <boxGeometry args={[YARD.x1 - YARD.x0 + 0.4, 2.7, YARD.z1 - YARD.z0 + 0.4]} />
        <meshStandardMaterial color="#3A3F45" roughness={0.88} />
      </mesh>
      <mesh position={[-1.0, -0.06, -0.75]} receiveShadow>
        <boxGeometry args={[YARD.x1 - YARD.x0, 0.14, YARD.z1 - YARD.z0]} />
        <meshStandardMaterial color="#B5523A" roughness={0.65} />
      </mesh>

      {/* Cầu thang dẫn xuống sườn đồi */}
      {stairSteps.map((st, i) => (
        <mesh key={i} position={st.pos} receiveShadow castShadow>
          <boxGeometry args={st.size} />
          <meshStandardMaterial color="#C8644B" roughness={0.7} />
        </mesh>
      ))}
      <mesh
        position={[2.1, -STAIRS.drop / 2 - 0.6, (STAIRS.z0 + STAIRS.z1) / 2]}
        rotation={[Math.atan2(STAIRS.drop, STAIRS.z1 - STAIRS.z0), 0, 0]}
        receiveShadow
      >
        <boxGeometry args={[STAIRS.x1 - STAIRS.x0 + 0.2, 1.1, Math.hypot(STAIRS.z1 - STAIRS.z0, STAIRS.drop)]} />
        <meshStandardMaterial color="#3A3F45" roughness={0.88} />
      </mesh>

      {/* Điểm ngắm biển (Viewpoint Terrace) ở chân cầu thang */}
      <mesh position={[2.0, VIEWPOINT.y - 0.9, (VIEWPOINT.z0 + VIEWPOINT.z1) / 2]} receiveShadow castShadow>
        <boxGeometry args={[VIEWPOINT.x1 - VIEWPOINT.x0, 1.8, VIEWPOINT.z1 - VIEWPOINT.z0]} />
        <meshStandardMaterial color="#3A3F45" roughness={0.88} />
      </mesh>
      <mesh position={[2.0, VIEWPOINT.y - 0.04, (VIEWPOINT.z0 + VIEWPOINT.z1) / 2]} receiveShadow>
        <boxGeometry args={[VIEWPOINT.x1 - VIEWPOINT.x0, 0.1, VIEWPOINT.z1 - VIEWPOINT.z0]} />
        <meshStandardMaterial color="#B5523A" roughness={0.65} />
      </mesh>

      {/* Ống nhòm ngắm biển tại Viewpoint */}
      <group position={[BINOCULARS[0], VIEWPOINT.y, BINOCULARS[1]]}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.12, 1.3, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.35, 0.08]} rotation={[Math.PI / 2 - 0.1, 0, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.11, 0.48, 16]} />
          <meshStandardMaterial color="#D97706" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Hệ thống lan can con tiện quanh sân, cầu thang và điểm ngắm biển */}
      {BALUSTRADES.map((seg, i) => (
        <BalustradeSegment key={`bal-${i}`} seg={seg} />
      ))}

      {/* 3. THÁP HẢI ĐĂNG VĨNH THỰC (CAO 18 MÉT - KIẾN TRÚC PHÁP) */}
      <group position={[TOWER.x, 0, TOWER.z]}>
        {/* Bệ đá tròn dưới chân hiên vòm */}
        <mesh position={[0, 0.175, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[TOWER.rotundaRadius + 0.55, TOWER.rotundaRadius + 0.75, TOWER.rotundaFloor, 32]} />
          <meshStandardMaterial color="#3E4247" roughness={0.85} />
        </mesh>
        {/* Sàn hiên vòm */}
        <mesh position={[0, TOWER.rotundaFloor + 0.03, 0]} receiveShadow>
          <cylinderGeometry args={[TOWER.rotundaRadius + 0.35, TOWER.rotundaRadius + 0.35, 0.08, 32]} />
          <meshStandardMaterial color="#C96A50" roughness={0.65} />
        </mesh>

        {/* 8 Trụ trắng & Vòm cuốn của Hiên tròn (Rotunda) */}
        {ROTUNDA_PILLAR_ANGLES.map((ang, idx) => {
          const px = TOWER.rotundaRadius * Math.cos(ang);
          const pz = TOWER.rotundaRadius * Math.sin(ang);
          return (
            <group key={`pil-${idx}`} position={[px, TOWER.rotundaFloor, pz]} rotation={[0, -ang + Math.PI / 2, 0]}>
              <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.68, 0.9, 0.68]} />
                <meshStandardMaterial color="#F4F1EA" roughness={0.6} />
              </mesh>
              <mesh position={[0, 2.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.54, 3.8, 0.54]} />
                <meshStandardMaterial color="#F4F1EA" roughness={0.6} />
              </mesh>
              <mesh position={[0, 4.3, 0]} castShadow>
                <boxGeometry args={[0.66, 0.22, 0.66]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
              </mesh>
            </group>
          );
        })}

        {/* Vòm cuốn & diềm vàng giữa 8 trụ */}
        {ROTUNDA_BAYS.map((bay) => {
          const r = TOWER.rotundaRadius;
          const mx = r * Math.cos(bay.mid);
          const mz = r * Math.sin(bay.mid);
          const span = 2 * r * Math.sin((bay.a1 - bay.a0) / 2);
          return (
            <group key={`arch-${bay.index}`} position={[mx, TOWER.rotundaFloor, mz]} rotation={[0, -bay.mid + Math.PI / 2, 0]}>
              <mesh position={[0, 4.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[span, 0.55, 0.48]} />
                <meshStandardMaterial color="#E8C77A" roughness={0.65} />
              </mesh>
              <mesh position={[0, 3.72, 0]} castShadow>
                <boxGeometry args={[span - 0.45, 0.18, 0.54]} />
                <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
              </mesh>
              <mesh position={[0, 3.82, 0]} castShadow>
                <boxGeometry args={[0.28, 0.38, 0.58]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
              </mesh>
              <mesh position={[0, 4.38, 0]}>
                <boxGeometry args={[span, 0.16, 0.52]} />
                <meshStandardMaterial color="#9E472A" roughness={0.7} />
              </mesh>
            </group>
          );
        })}

        {/* Mái bằng của hiên tròn (tầng 1) & gờ phào trắng */}
        <mesh position={[0, TOWER.rotundaFloor + 4.65, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[TOWER.rotundaRadius + 0.55, TOWER.rotundaRadius + 0.45, 0.38, 36]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.6} />
        </mesh>
        <mesh position={[0, TOWER.rotundaFloor + 4.86, 0]} receiveShadow>
          <cylinderGeometry args={[TOWER.rotundaRadius + 0.35, TOWER.rotundaRadius + 0.35, 0.06, 36]} />
          <meshStandardMaterial color="#646A70" roughness={0.85} />
        </mesh>

        {/* Thân tháp trụ tròn vàng kem thon dần lên trên */}
        <mesh position={[0, TOWER.coreHeight / 2 + TOWER.rotundaFloor, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[TOWER.coreTop, TOWER.coreBottom, TOWER.coreHeight, 32]} />
          <meshStandardMaterial color="#E8C77A" roughness={0.62} />
        </mesh>

        {/* 4 Gân trụ trắng chạy dọc thân tháp */}
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, i) => {
          const rMid = (TOWER.coreBottom + TOWER.coreTop) / 2;
          const tilt = Math.atan2(TOWER.coreBottom - TOWER.coreTop, TOWER.coreHeight);
          return (
            <group key={`rib-${i}`} rotation={[0, ang, 0]}>
              <mesh position={[0, TOWER.coreHeight / 2 + TOWER.rotundaFloor, rMid]} rotation={[-tilt, 0, 0]} castShadow>
                <boxGeometry args={[0.38, TOWER.coreHeight, 0.18]} />
                <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
              </mesh>
            </group>
          );
        })}

        {/* 2 Gờ đai trắng ngang thân tháp */}
        <mesh position={[0, 6.8, 0]} castShadow>
          <cylinderGeometry args={[2.12, 2.15, 0.32, 32]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
        </mesh>
        <mesh position={[0, 11.4, 0]} castShadow>
          <cylinderGeometry args={[1.92, 1.95, 0.32, 32]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
        </mesh>

        {/* Cửa vào chân tháp & cửa sổ lấy sáng */}
        <group position={[0, TOWER.rotundaFloor + 1.15, TOWER.coreBottom - 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[1.1, 2.2, 0.18]} />
            <meshStandardMaterial color="#F4F1EA" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.82, 1.95, 0.1]} />
            <meshStandardMaterial color="#2C353D" roughness={0.4} />
          </mesh>
        </group>
        <group position={[0, 6.1, TOWER.coreBottom - 0.22]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 1.35, 0.18]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.62, 1.12, 0.1]} />
            <meshStandardMaterial color="#1E293B" roughness={0.25} />
          </mesh>
        </group>

        {/* Sàn Ban công đỉnh tháp (cao độ 15.2m) */}
        <mesh position={[0, TOWER.balconyY - 0.12, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[TOWER.balconyRadius, TOWER.coreTop + 0.2, 0.32, 32]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
        </mesh>
        <mesh position={[0, TOWER.balconyY + 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[TOWER.balconyRadius - 0.05, TOWER.balconyRadius - 0.05, 0.06, 32]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.75} />
        </mesh>

        {/* Cổ tháp trắng trên ban công & Lồng đèn kính */}
        <mesh position={[0, TOWER.balconyY + 0.55, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[TOWER.drumRadius, TOWER.drumRadius + 0.06, 1.1, 24]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
        </mesh>
        <mesh position={[0, (TOWER.lanternBase + TOWER.lanternTop) / 2, 0]}>
          <cylinderGeometry args={[TOWER.lanternRadius, TOWER.lanternRadius, TOWER.lanternTop - TOWER.lanternBase, 20]} />
          <meshStandardMaterial color="#E0F2FE" transparent opacity={0.45} roughness={0.1} metalness={0.2} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i * Math.PI) / 4;
          return (
            <mesh
              key={`bar-${i}`}
              position={[
                Math.cos(a) * TOWER.lanternRadius,
                (TOWER.lanternBase + TOWER.lanternTop) / 2,
                Math.sin(a) * TOWER.lanternRadius,
              ]}
            >
              <cylinderGeometry args={[0.025, 0.025, TOWER.lanternTop - TOWER.lanternBase, 6]} />
              <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.4} />
            </mesh>
          );
        })}

        {/* Thấu kính Fresnel & Chùm tia sáng hải đăng quay 360 độ */}
        <group position={[0, TOWER.lampY, 0]} ref={beaconRef}>
          <mesh>
            <cylinderGeometry args={[0.52, 0.52, 0.85, 16]} />
            <meshStandardMaterial
              color="#FEF08A"
              emissive="#FACC15"
              emissiveIntensity={isNight ? 4.5 : isSunset ? 2.2 : 0.8}
              roughness={0.15}
            />
          </mesh>
          {(isNight || isSunset) && (
            <>
              <mesh position={[0, 0, 26]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[6.5, 52, 24, 1, true]} />
                <meshBasicMaterial
                  color="#FEF08A"
                  transparent
                  opacity={isNight ? 0.22 : 0.09}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
              <mesh position={[0, 0, -26]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[6.5, 52, 24, 1, true]} />
                <meshBasicMaterial
                  color="#FEF08A"
                  transparent
                  opacity={isNight ? 0.22 : 0.09}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            </>
          )}
        </group>
        <pointLight
          position={[0, TOWER.lampY, 0]}
          color="#FEF08A"
          intensity={isNight ? 12 : isSunset ? 5 : 1.5}
          distance={90}
        />

        {/* Mái vòm đồng & Cột thu lôi trên đỉnh 18m */}
        <mesh position={[0, TOWER.lanternTop + 0.08, 0]} castShadow>
          <cylinderGeometry args={[TOWER.lanternRadius + 0.16, TOWER.lanternRadius + 0.16, 0.16, 24]} />
          <meshStandardMaterial color="#786B59" metalness={0.5} roughness={0.45} />
        </mesh>
        <mesh position={[0, TOWER.lanternTop + 0.15, 0]} castShadow>
          <sphereGeometry args={[TOWER.lanternRadius + 0.05, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#8A7A66" metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[0, TOWER.lanternTop + 1.45, 0]}>
          <cylinderGeometry args={[0.04, 0.08, 0.5, 12]} />
          <meshStandardMaterial color="#786B59" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, TOWER.lanternTop + 2.4, 0]}>
          <cylinderGeometry args={[0.015, 0.025, 1.6, 8]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Lan can hiên vòm tròn & lan can ban công đỉnh tháp */}
      {ROTUNDA_BALUSTRADES.map((seg, i) => (
        <BalustradeSegment key={`rot-bal-${i}`} seg={seg} colorRail="#F4F1EA" height={0.88} />
      ))}
      {BALCONY_BALUSTRADES.map((seg, i) => (
        <BalustradeSegment key={`top-bal-${i}`} seg={seg} colorRail="#F4F1EA" height={0.95} />
      ))}

      {/* 4. NHÀ QUẢN LÝ 1 TẦNG (MÁI NGÓI ĐỎ MANSARD + PHÒNG TRUYỀN THỐNG BÊN TRONG) */}
      <group name="Managers_House">
        <mesh position={[5, HOUSE.floor / 2, -4.75]} receiveShadow castShadow>
          <boxGeometry args={[HOUSE.x1 - HOUSE.x0 + 0.2, HOUSE.floor, HOUSE.z1 - HOUSE.z0 + 0.2]} />
          <meshStandardMaterial color="#3A3F45" roughness={0.85} />
        </mesh>
        <mesh position={[5, HOUSE.floor + 0.02, -4.75]} receiveShadow>
          <boxGeometry args={[HOUSE.x1 - HOUSE.x0 - 0.2, 0.05, HOUSE.z1 - HOUSE.z0 - 0.2]} />
          <meshStandardMaterial color="#D97757" roughness={0.5} />
        </mesh>

        {/* Nền hiên trước & bậc tam cấp */}
        <mesh position={[5, PORCH.floor / 2, 0.2]} receiveShadow castShadow>
          <boxGeometry args={[PORCH.x1 - PORCH.x0, PORCH.floor, PORCH.z1 - PORCH.z0]} />
          <meshStandardMaterial color="#3A3F45" roughness={0.85} />
        </mesh>
        <mesh position={[5, PORCH.floor + 0.02, 0.2]} receiveShadow>
          <boxGeometry args={[PORCH.x1 - PORCH.x0 - 0.1, 0.05, PORCH.z1 - PORCH.z0 - 0.1]} />
          <meshStandardMaterial color="#C8644B" roughness={0.6} />
        </mesh>
        <mesh position={[5, 0.12, 1.65]} receiveShadow castShadow>
          <boxGeometry args={[3.4, 0.24, 0.55]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.7} />
        </mesh>

        {/* Tường sau, trái, phải */}
        <mesh position={[5, HOUSE.floor + HOUSE.wallH / 2, HOUSE.z0]} castShadow receiveShadow>
          <boxGeometry args={[HOUSE.x1 - HOUSE.x0, HOUSE.wallH, HOUSE.wallT]} />
          <meshStandardMaterial color="#E8C77A" roughness={0.65} />
        </mesh>
        <mesh position={[HOUSE.x0, HOUSE.floor + HOUSE.wallH / 2, -4.75]} castShadow receiveShadow>
          <boxGeometry args={[HOUSE.wallT, HOUSE.wallH, HOUSE.z1 - HOUSE.z0]} />
          <meshStandardMaterial color="#E8C77A" roughness={0.65} />
        </mesh>
        <mesh position={[HOUSE.x1, HOUSE.floor + HOUSE.wallH / 2, -4.75]} castShadow receiveShadow>
          <boxGeometry args={[HOUSE.wallT, HOUSE.wallH, HOUSE.z1 - HOUSE.z0]} />
          <meshStandardMaterial color="#E8C77A" roughness={0.65} />
        </mesh>

        {/* Tường mặt tiền chừa cửa chính */}
        <mesh position={[-0.1, HOUSE.floor + HOUSE.wallH / 2, HOUSE.z1]} castShadow receiveShadow>
          <boxGeometry args={[7.8, HOUSE.wallH, HOUSE.wallT]} />
          <meshStandardMaterial color="#E8C77A" roughness={0.65} />
        </mesh>
        <mesh position={[10.1, HOUSE.floor + HOUSE.wallH / 2, HOUSE.z1]} castShadow receiveShadow>
          <boxGeometry args={[7.8, HOUSE.wallH, HOUSE.wallT]} />
          <meshStandardMaterial color="#E8C77A" roughness={0.65} />
        </mesh>
        <mesh position={[5, HOUSE.floor + 3.55, HOUSE.z1]} castShadow receiveShadow>
          <boxGeometry args={[HOUSE.doorW, 1.3, HOUSE.wallT]} />
          <meshStandardMaterial color="#E8C77A" roughness={0.65} />
        </mesh>

        {/* Cửa sổ vòm kiểu Pháp hai bên mặt tiền */}
        {[-0.2, 10.2].map((wx, idx) => (
          <group key={`win-${idx}`} position={[wx, HOUSE.floor + 2.0, HOUSE.z1 + 0.05]}>
            <mesh castShadow>
              <boxGeometry args={[1.65, 2.1, 0.24]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
              <boxGeometry args={[1.32, 1.8, 0.14]} />
              <meshStandardMaterial color="#1E293B" roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Hàng cột trắng hiên trước & Biển tên 3D "HẢI ĐĂNG VĨNH THỰC" */}
        {PORCH.columnsX.map((cx, i) => (
          <mesh key={`pcol-${i}`} position={[cx, PORCH.floor + 2.1, PORCH.columnsZ]} castShadow receiveShadow>
            <boxGeometry args={[0.44, 4.2, 0.44]} />
            <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
          </mesh>
        ))}
        <mesh position={[5, HOUSE.floor + 3.9, PORCH.columnsZ]} castShadow receiveShadow>
          <boxGeometry args={[PORCH.x1 - PORCH.x0 + 0.4, 0.65, 0.52]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
        </mesh>

        {/* Biển tên HẢI ĐĂNG VĨNH THỰC bằng 3D texture thật (không nổi đè lên màn hình) */}
        <group position={[5, HOUSE.floor + 3.52, PORCH.columnsZ + 0.28]}>
          <mesh castShadow>
            <boxGeometry args={[4.2, 0.72, 0.08]} />
            <meshStandardMaterial color="#FDFBF7" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[4.0, 0.58]} />
            <meshBasicMaterial map={mainSignTex} />
          </mesh>
        </group>

        {/* Mái ngói đỏ kiểu Mansard + 3 cửa sổ mái */}
        <mesh position={[5, HOUSE.floor + HOUSE.wallH + 0.15, -3.55]} castShadow receiveShadow>
          <boxGeometry args={[HOUSE.x1 - HOUSE.x0 + 2.2, 0.32, 11.2]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
        </mesh>
        <mesh
          position={[5, HOUSE.floor + HOUSE.wallH + 1.15, -3.55]}
          rotation={[0, Math.PI / 4, 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[6.8, 9.6, 1.75, 4]} />
          <meshStandardMaterial color="#B8452E" roughness={0.65} />
        </mesh>
        <mesh position={[5, HOUSE.floor + HOUSE.wallH + 1.98, -3.55]} receiveShadow>
          <boxGeometry args={[13.6, 0.16, 6.6]} />
          <meshStandardMaterial color="#64748B" roughness={0.85} />
        </mesh>
        {[0.5, 5.0, 9.5].map((dx, i) => (
          <group key={`dormer-${i}`} position={[dx, HOUSE.floor + HOUSE.wallH + 1.05, 0.35]}>
            <mesh castShadow>
              <boxGeometry args={[1.15, 1.05, 1.1]} />
              <meshStandardMaterial color="#F4F1EA" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.05, 0.56]}>
              <boxGeometry args={[0.65, 0.65, 0.05]} />
              <meshStandardMaterial color="#1E293B" roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* BÊN TRONG PHÒNG TRUYỀN THỐNG: 3 Bảng gắn tường bằng 3D Texture (chỉ nhìn thấy khi bước vào phòng) */}
        {[
          { x: 0.5, tex: board1Tex },
          { x: 5.0, tex: board2Tex },
          { x: 9.5, tex: board3Tex },
        ].map((board, i) => (
          <group key={`board-${i}`} position={[board.x, HOUSE.floor + 2.2, HOUSE.z0 + 0.2]}>
            <mesh castShadow>
              <boxGeometry args={[3.4, 1.85, 0.06]} />
              <meshStandardMaterial color="#1E293B" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
              <planeGeometry args={[3.25, 1.72]} />
              <meshBasicMaterial map={board.tex} />
            </mesh>
          </group>
        ))}

        <pointLight position={[5, HOUSE.floor + 3.6, -4.75]} color="#FFFBEB" intensity={2.2} distance={16} />
        <MiniatureLighthouseOnPedestal />
      </group>

      {/* 5. CỘT CỜ TỔ QUỐC, CÂY CAU, GHẾ ĐÁ & ĐÈN SÂN VƯỜN */}
      <group position={[FLAG.x, 0, FLAG.z]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.5, 1.2]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.09, 8.5, 12]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.7} roughness={0.25} />
        </mesh>
        <group position={[0, 8.1, 0]} ref={flagRef}>
          <mesh position={[0.95, 0, 0]} castShadow>
            <boxGeometry args={[1.9, 1.25, 0.04]} />
            <meshStandardMaterial color="#DC2626" roughness={0.5} />
          </mesh>
          <mesh position={[0.95, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.06, 5]} />
            <meshStandardMaterial color="#FACC15" emissive="#FACC15" emissiveIntensity={0.3} />
          </mesh>
        </group>
      </group>

      {PALMS.map((pos, idx) => (
        <PalmTree key={`palm-${idx}`} position={pos} />
      ))}

      {BENCHES.map(([bx, bz, rot], idx) => {
        const by = groundAt(bx, bz);
        return (
          <group key={`bench-${idx}`} position={[bx, by, bz]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.7, 0.1, 0.55]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.52, -0.22]} castShadow>
              <boxGeometry args={[1.7, 0.45, 0.08]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
            </mesh>
          </group>
        );
      })}

      {LAMPS.map(([lx, lz], idx) => {
        const ly = groundAt(lx, lz);
        return (
          <group key={`lamp-${idx}`} position={[lx, ly, lz]}>
            <mesh position={[0, 1.35, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.06, 2.7, 8]} />
              <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.75, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial
                color="#FEF3C7"
                emissive="#FBBF24"
                emissiveIntensity={isNight ? 3.0 : 0.4}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
