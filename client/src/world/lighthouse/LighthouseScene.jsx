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

export function LighthouseScene() {
  const { scene } = useGLTF(LIGHTHOUSE_GLB_URL);
  const timeOfDay = useStore((state) => state.timeOfDay);
  const beaconRef = useRef();

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

  useFrame((_, dt) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y += dt * (timeOfDay === 'night' ? 1.15 : 0.45);
    }
  });

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  // Các bậc cầu thang nối tiếp từ chân mô hình Meshy xuống Điểm ngắm biển
  const stairSteps = useMemo(() => {
    const count = 22;
    const zStart = 12.2;
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
      {/* 1. BIỂN ĐÔNG BẮC & ĐỒI NÚI MŨI ĐẦU TÁN */}
      <mesh position={[0, SEA_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial
          color={isNight ? '#082038' : '#0E6B8A'}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      {/* Đồi cây xanh dưới chân trạm hải đăng */}
      <mesh position={[0, -34.2, 4]} receiveShadow>
        <cylinderGeometry args={[24, 92, 66.5, 36]} />
        <meshStandardMaterial color="#3A5F38" roughness={0.92} />
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

      {/* 4. CẦU THANG NỐI TIẾP XUỐNG SƯỜN ĐỒI & ĐIỂM NGẮM BIỂN */}
      {stairSteps.map((st, i) => (
        <mesh key={i} position={st.pos} receiveShadow castShadow>
          <boxGeometry args={st.size} />
          <meshStandardMaterial color="#C8644B" roughness={0.75} />
        </mesh>
      ))}
      <mesh
        position={[1.2, VIEWPOINT.y - 0.8, (VIEWPOINT.z0 + VIEWPOINT.z1) / 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry
          args={[
            VIEWPOINT.x1 - VIEWPOINT.x0,
            1.6,
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
