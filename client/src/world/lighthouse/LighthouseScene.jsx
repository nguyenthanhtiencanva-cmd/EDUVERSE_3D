import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { MODEL_URLS } from '../models';
import {
  SEA_LEVEL,
  MESHY_SCALE,
  MESHY_Y_OFFSET,
  TOWER,
  STAIRS,
  VIEWPOINT,
  HILL_STAIR_BALUSTRADES,
  getSpiralPose,
} from './layout';

// Tạo đoạn lan can con tiện trắng - tay vịn vàng kem dọc cầu thang sườn đồi & sảnh đón
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
      <mesh position={[ax, ay + height * 0.52, az]} castShadow receiveShadow>
        <boxGeometry args={[0.24, height * 1.04, 0.24]} />
        <meshStandardMaterial color={colorPost} roughness={0.65} />
      </mesh>
      <mesh position={[bx, by + height * 0.52, bz]} castShadow receiveShadow>
        <boxGeometry args={[0.24, height * 1.04, 0.24]} />
        <meshStandardMaterial color={colorPost} roughness={0.65} />
      </mesh>

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

      {balusters.map((pos, idx) => (
        <mesh key={idx} position={pos} castShadow>
          <cylinderGeometry args={[0.045, 0.055, height * 0.72, 8]} />
          <meshStandardMaterial color={colorPost} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Tạo texture sóng biển & bọt sóng tự nhiên bao quanh Hải đăng
function useOceanWaveTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0284C7');
    grad.addColorStop(0.5, '#0369A1');
    grad.addColorStop(1, '#0284C7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
    ctx.lineWidth = 3;
    for (let y = 16; y < 512; y += 32) {
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 32) {
        const wy = y + Math.sin((x / 512) * Math.PI * 4 + y) * 5;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(85, 85);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

export function LighthouseScene() {
  const { scene } = useGLTF(MODEL_URLS.lighthouse);
  const timeOfDay = useStore((state) => state.timeOfDay);
  const lighthouseLevel = useStore((state) => state.lighthouseLevel);
  const beaconRef = useRef();
  const foamRef = useRef();
  const oceanTex = useOceanWaveTexture();

  const meshyModel = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      }
    });
    return cloned;
  }, [scene]);

  // Chế độ mặt cắt X-Ray tự động khi nhân vật bước vào cầu thang xoắn ốc trong lòng tháp
  useEffect(() => {
    const inSpiral = lighthouseLevel === 'spiral';
    meshyModel.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = inSpiral;
        child.material.opacity = inSpiral ? 0.28 : 1.0;
        child.material.depthWrite = !inSpiral;
        child.material.needsUpdate = true;
      }
    });
  }, [meshyModel, lighthouseLevel]);

  useFrame(({ clock }, dt) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y += dt * (timeOfDay === 'night' ? 1.15 : 0.45);
    }
    if (oceanTex) {
      oceanTex.offset.x = (clock.getElapsedTime() * 0.04) % 1;
      oceanTex.offset.y = (clock.getElapsedTime() * 0.025) % 1;
    }
    if (foamRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 1.8) * 0.025;
      foamRef.current.scale.set(s, s, 1);
    }
  });

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  // CHẶNG 1: 36 bậc cầu thang sườn đồi từ Sảnh đón ven biển (Z=22.0, Y=-2.8) lên Cổng sân gạch đỏ (Z=8.2, Y=+0.55)
  const hillStairSteps = useMemo(() => {
    const count = STAIRS.steps;
    const dz = (STAIRS.z1 - STAIRS.z0) / count;
    const dy = (STAIRS.yTop - STAIRS.yBottom) / count;
    const cx = (STAIRS.x0 + STAIRS.x1) / 2;
    const w = STAIRS.x1 - STAIRS.x0 - 0.24;
    return Array.from({ length: count }, (_, i) => ({
      pos: [cx, STAIRS.yTop - dy * (i + 0.5), STAIRS.z0 + dz * (i + 0.5)],
      size: [w, Math.abs(dy) + 0.08, dz + 0.04],
    }));
  }, []);

  // CHẶNG 2: 72 bậc cầu thang xoắn ốc bên trong lòng Tháp đèn 18m (từ Y=0.55m lên Ban công Y=14.8m)
  const spiralSteps = useMemo(() => {
    const count = TOWER.spiralSteps;
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 0.5) / count;
      const pose = getSpiralPose(t);
      return {
        key: i,
        angle: pose.angle,
        y: pose.y,
        rMid: (0.42 + pose.radius + 0.25) / 2,
        wStep: pose.radius + 0.25 - 0.42,
        rPost: pose.radius + 0.22,
      };
    });
  }, []);

  return (
    <group name="Lighthouse_Meshy_1to1_World">
      {/* 1. ĐẠI DƯƠNG BAO QUANH 360° NGAY DƯỚI CHÂN HẢI ĐĂNG */}
      <mesh position={[0, SEA_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3200, 3200]} />
        <meshStandardMaterial
          map={isNight ? null : oceanTex}
          color={isNight ? '#07223B' : isSunset ? '#0369A1' : '#FFFFFF'}
          roughness={0.18}
          metalness={0.12}
        />
      </mesh>

      {/* Vòng bọt sóng trắng vỗ quanh chân mỏm đá Hải đăng */}
      <mesh
        ref={foamRef}
        position={[0, SEA_LEVEL + 0.06, 5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[21.5, 25.0, 48]} />
        <meshBasicMaterial color="#E0F2FE" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      {/* Bệ đá gốc dưới chân Mô hình 1 tiếp giáp mặt nước biển */}
      <mesh position={[0, SEA_LEVEL + 1.35, 1.0]} receiveShadow>
        <cylinderGeometry args={[16.8, 19.8, 2.8, 36]} />
        <meshStandardMaterial color="#3B4D3B" roughness={0.9} />
      </mesh>

      {/* Hòn đá ngoài khơi phía Tây Bắc tháp đèn (đúng như trong ảnh thực tế số 1) */}
      <group position={[-38, SEA_LEVEL, -24]}>
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <coneGeometry args={[6.5, 4.8, 7]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        <mesh position={[3.2, 1.1, 1.5]} castShadow receiveShadow>
          <coneGeometry args={[4.2, 3.0, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
        <mesh position={[1.0, 0.05, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.2, 8.2, 24]} />
          <meshBasicMaterial color="#E0F2FE" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 2. MÔ HÌNH 3D HẢI ĐĂNG VĨNH THỰC (PHƯƠNG ÁN 1 MESHY MULTI-IMAGE ĐÃ DUYỆT) */}
      <group
        name="Meshy_Approved_Model_1"
        position={[0, MESHY_Y_OFFSET, 0]}
        scale={MESHY_SCALE}
      >
        <primitive object={meshyModel} />
      </group>

      {/* 3. CHẶNG 2: CẦU THANG XOẮN ỐC 72 BẬC BÊN TRONG LÒNG THÁP ĐÈN 18M */}
      <group position={[TOWER.x, 0, TOWER.z]} name="Tower_Interior_Spiral_Stairs">
        {/* Trụ thép trung tâm của cầu thang xoắn ốc */}
        <mesh
          position={[0, (TOWER.rotundaFloor + TOWER.balconyY) / 2, 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.38, 0.44, TOWER.balconyY - TOWER.rotundaFloor + 0.4, 20]} />
          <meshStandardMaterial color="#475569" metalness={0.55} roughness={0.4} />
        </mesh>

        {/* Sàn tròn ban công trên đỉnh 14.8m kèm lan can bảo vệ */}
        <mesh position={[0, TOWER.balconyY - 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[TOWER.balconyRadius, TOWER.balconyRadius, 0.16, 32]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.65} />
        </mesh>

        {/* 72 Bậc thang xoắn ốc + trụ tay vịn ngoài */}
        {spiralSteps.map((st) => (
          <group key={st.key} position={[0, st.y, 0]} rotation={[0, -st.angle, 0]}>
            {/* Mặt bậc thang */}
            <mesh position={[st.rMid, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[st.wStep, 0.08, 0.36]} />
              <meshStandardMaterial color="#D97706" roughness={0.5} metalness={0.2} />
            </mesh>
            {/* Thanh đứng lan can xoắn ốc (cách 2 bậc đặt 1 trụ) */}
            {st.key % 2 === 0 && (
              <mesh position={[st.rPost, 0.45, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
                <meshStandardMaterial color="#F8FAFC" metalness={0.5} roughness={0.35} />
              </mesh>
            )}
          </group>
        ))}

        {/* Đèn chiếu sáng ấm áp bên trong lòng tháp */}
        <pointLight position={[0, 5.0, 0]} color="#FDE68A" intensity={3.5} distance={12} />
        <pointLight position={[0, 10.5, 0]} color="#FDE68A" intensity={3.5} distance={12} />
      </group>

      {/* 4. ĐÈN HẢI ĐĂNG QUAY 360° TRÊN ĐỈNH THÁP 18M */}
      <group position={[TOWER.x, TOWER.lampY, TOWER.z]} ref={beaconRef}>
        <mesh>
          <cylinderGeometry args={[0.45, 0.45, 0.75, 16]} />
          <meshStandardMaterial
            color="#FEF08A"
            emissive="#FACC15"
            emissiveIntensity={isNight ? 4.5 : isSunset ? 2.2 : 0.9}
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
                opacity={isNight ? 0.22 : 0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0, 0, -26]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[6.5, 52, 24, 1, true]} />
              <meshBasicMaterial
                color="#FEF08A"
                transparent
                opacity={isNight ? 0.22 : 0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </>
        )}
      </group>
      <pointLight
        position={[TOWER.x, TOWER.lampY, TOWER.z]}
        color="#FEF08A"
        intensity={isNight ? 12 : isSunset ? 5 : 2.0}
        distance={95}
      />

      {/* 5. CHẶNG 1: CẦU THANG SƯỜN ĐỒI 36 BẬC CÓ LAN CAN CON TIỆN & SẢNH ĐÓN VEN BIỂN */}
      {hillStairSteps.map((st, i) => (
        <mesh key={i} position={st.pos} receiveShadow castShadow>
          <boxGeometry args={st.size} />
          <meshStandardMaterial color={i % 2 === 0 ? '#C8644B' : '#B5523A'} roughness={0.7} />
        </mesh>
      ))}
      {/* Dầm đá đỡ dưới 36 bậc cầu thang */}
      <mesh
        position={[
          (STAIRS.x0 + STAIRS.x1) / 2,
          (STAIRS.yTop + STAIRS.yBottom) / 2 - 0.55,
          (STAIRS.z0 + STAIRS.z1) / 2,
        ]}
        rotation={[
          Math.atan2(STAIRS.yTop - STAIRS.yBottom, STAIRS.z1 - STAIRS.z0),
          0,
          0,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[
            STAIRS.x1 - STAIRS.x0 + 0.3,
            1.0,
            Math.hypot(STAIRS.z1 - STAIRS.z0, STAIRS.yTop - STAIRS.yBottom),
          ]}
        />
        <meshStandardMaterial color="#3A3F45" roughness={0.88} />
      </mesh>

      {/* Sảnh đón ven biển dưới chân cầu thang 36 bậc */}
      <mesh
        position={[1.2, VIEWPOINT.y - 0.6, (VIEWPOINT.z0 + VIEWPOINT.z1) / 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry
          args={[
            VIEWPOINT.x1 - VIEWPOINT.x0,
            1.2,
            VIEWPOINT.z1 - VIEWPOINT.z0,
          ]}
        />
        <meshStandardMaterial color="#3A3F45" roughness={0.88} />
      </mesh>
      <mesh
        position={[1.2, VIEWPOINT.y - 0.04, (VIEWPOINT.z0 + VIEWPOINT.z1) / 2]}
        receiveShadow
      >
        <boxGeometry
          args={[
            VIEWPOINT.x1 - VIEWPOINT.x0 - 0.16,
            0.1,
            VIEWPOINT.z1 - VIEWPOINT.z0 - 0.16,
          ]}
        />
        <meshStandardMaterial color="#B5523A" roughness={0.65} />
      </mesh>

      {/* Lan can con tiện trắng - tay vịn vàng kem hai bên cầu thang 36 bậc & sảnh đón */}
      {HILL_STAIR_BALUSTRADES.map((seg, idx) => (
        <BalustradeSegment key={`hs-bal-${idx}`} seg={seg} />
      ))}
    </group>
  );
}
