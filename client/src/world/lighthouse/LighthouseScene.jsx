import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import {
  SEA_LEVEL,
  MESHY_SCALE,
  MESHY_Y_OFFSET,
  TOWER,
  STAIRS,
  VIEWPOINT,
} from './layout';

const LIGHTHOUSE_GLB_URL = '/models/hai_dang_vinh_thuc_v2.glb';

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

    // Các gợn sóng sáng trên mặt biển
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
  const { scene } = useGLTF(LIGHTHOUSE_GLB_URL);
  const timeOfDay = useStore((state) => state.timeOfDay);
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
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      }
    });
    return cloned;
  }, [scene]);

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

  // Các bậc cầu thang nối từ chân mô hình Meshy xuống bến ngắm biển sát mép nước
  const stairSteps = useMemo(() => {
    const count = 14;
    const zStart = 11.8;
    const zEnd = STAIRS.z1;
    const yStart = -0.35;
    const yEnd = VIEWPOINT.y;
    const dz = (zEnd - zStart) / count;
    const dy = (yStart - yEnd) / count;
    const cx = (STAIRS.x0 + STAIRS.x1) / 2;
    const w = STAIRS.x1 - STAIRS.x0 - 0.6;
    return Array.from({ length: count }, (_, i) => ({
      pos: [cx, yStart - dy * (i + 0.5), zStart + dz * (i + 0.5)],
      size: [w, Math.abs(dy) + 0.08, dz + 0.04],
    }));
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
        position={[0, SEA_LEVEL + 0.06, 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[18.5, 22.0, 48]} />
        <meshBasicMaterial color="#E0F2FE" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      {/* Bệ đá gốc vừa khít dưới chân Mô hình 1 tiếp giáp mặt nước biển */}
      <mesh position={[0, SEA_LEVEL + 1.35, 1.0]} receiveShadow>
        <cylinderGeometry args={[16.8, 19.5, 2.8, 36]} />
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

      {/* 3. ĐÈN HẢI ĐĂNG QUAY 360° TRÊN ĐỈNH THÁP 18M */}
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

      {/* 4. CẦU THANG & SẢNH NGẮM BIỂN SÁT MÉP NƯỚC */}
      {stairSteps.map((st, i) => (
        <mesh key={i} position={st.pos} receiveShadow castShadow>
          <boxGeometry args={st.size} />
          <meshStandardMaterial color="#C8644B" roughness={0.75} />
        </mesh>
      ))}
      <mesh
        position={[1.2, VIEWPOINT.y - 0.7, (VIEWPOINT.z0 + VIEWPOINT.z1) / 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry
          args={[
            VIEWPOINT.x1 - VIEWPOINT.x0,
            1.4,
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
            VIEWPOINT.x1 - VIEWPOINT.x0 - 0.2,
            0.1,
            VIEWPOINT.z1 - VIEWPOINT.z0 - 0.2,
          ]}
        />
        <meshStandardMaterial color="#B5523A" roughness={0.68} />
      </mesh>
    </group>
  );
}

useGLTF.preload(LIGHTHOUSE_GLB_URL);
