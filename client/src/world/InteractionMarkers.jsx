import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { getInteractablesForScope } from '../player/interactions';
import { campusGroundAt } from './campusCollision';

function MarkerSpot({ item, isVisited, isNearby, worldScope }) {
  const groupRef = useRef(null);
  const beaconRef = useRef(null);
  const ringRef = useRef(null);
  const snappedRef = useRef(false);

  const isNpc = item.kind === 'npc';
  const accentColor = isVisited ? '#34d399' : isNpc ? '#38bdf8' : '#fbbf24';

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current && !snappedRef.current && (worldScope === 'vangia' || worldScope === 'campus')) {
      const ground = campusGroundAt(item.position[0], item.position[1] + 1.2, item.position[2]);
      if (ground !== null) {
        groupRef.current.position.y = ground;
        snappedRef.current = true;
      }
    }
    if (beaconRef.current) {
      const baseH = isNpc ? 2.15 : item.noStand ? 1.15 : 1.78;
      beaconRef.current.position.y = baseH + Math.sin(t * 2.6 + item.position[0]) * 0.10;
      beaconRef.current.rotation.y = t * 1.4;
    }
    if (ringRef.current) {
      const pulse = 1 + (isNearby ? 0.14 : 0.06) * Math.sin(t * (isNearby ? 5.0 : 2.5));
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group
      ref={groupRef}
      name={`Interact_${item.id}`}
      position={item.position}
      rotation-y={item.facing ?? 0}
    >
      {/* Vòng sáng mặt đất (đặt tên vật liệu MAT_Marking_ để không cản va chạm) */}
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.48, 0.64, 28]} />
        <meshBasicMaterial
          name="MAT_Marking_InteractRing"
          color={accentColor}
          transparent
          opacity={isNearby ? 0.92 : 0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Bảng thông tin 3D nhỏ gọn cho các điểm dạng bảng (trừ ban công hẹp) */}
      {!isNpc && !item.noStand && (
        <group>
          {/* Chân đế & cột bảng */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <boxGeometry args={[0.56, 0.08, 0.32]} />
            <meshStandardMaterial color="#334155" roughness={0.75} metalness={0.25} />
          </mesh>
          <mesh position={[-0.22, 0.62, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.028, 1.16, 10]} />
            <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0.22, 0.62, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.028, 1.16, 10]} />
            <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* Khung mặt bảng nghiêng nhẹ về phía người đọc */}
          <group position={[0, 1.12, 0.04]} rotation-x={-0.36}>
            <mesh castShadow>
              <boxGeometry args={[0.74, 0.46, 0.04]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.024]}>
              <planeGeometry args={[0.66, 0.38]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.85} />
            </mesh>
            {/* Dải tiêu đề trên mặt bảng */}
            <mesh position={[0, 0.125, 0.026]}>
              <planeGeometry args={[0.62, 0.08]} />
              <meshStandardMaterial color={isVisited ? '#059669' : '#d97706'} roughness={0.55} />
            </mesh>
            {/* Các vạch minh họa văn bản trên bảng */}
            <mesh position={[-0.08, 0.02, 0.026]}>
              <planeGeometry args={[0.42, 0.025]} />
              <meshStandardMaterial color="#64748b" roughness={0.9} />
            </mesh>
            <mesh position={[-0.04, -0.05, 0.026]}>
              <planeGeometry args={[0.50, 0.025]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.9} />
            </mesh>
            <mesh position={[-0.10, -0.12, 0.026]}>
              <planeGeometry args={[0.38, 0.025]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.9} />
            </mesh>
          </group>
        </group>
      )}

      {/* Mốc kim cương nổi nhẹ giúp du khách dễ nhận biết từ xa */}
      <mesh ref={beaconRef} position={[0, isNpc ? 2.15 : 1.78, 0]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          name="MAT_Light_Glow_Beacon"
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={isNearby ? 0.95 : 0.45}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

export function InteractionMarkers() {
  const worldScope = useStore((state) => state.worldScope);
  const lighthouseLevel = useStore((state) => state.lighthouseLevel);
  const visitedHotspots = useStore((state) => state.visitedHotspots);
  const vanGiaVisited = useStore((state) => state.vanGiaVisited);
  const campusVisited = useStore((state) => state.campusVisited);
  const playerPosition = useStore((state) => state.playerPosition);

  const items = useMemo(
    () => getInteractablesForScope(worldScope, lighthouseLevel),
    [worldScope, lighthouseLevel],
  );

  if (worldScope === 'island' || items.length === 0) return null;

  const visitedSet = new Set(
    worldScope === 'lighthouse'
      ? visitedHotspots
      : worldScope === 'vangia'
      ? vanGiaVisited
      : campusVisited,
  );

  return (
    <group name="World_Interaction_Markers">
      {items.map((item) => {
        const dx = playerPosition[0] - item.position[0];
        const dz = playerPosition[2] - item.position[2];
        const isNearby = Math.hypot(dx, dz) <= item.radius;
        return (
          <MarkerSpot
            key={item.id}
            item={item}
            worldScope={worldScope}
            isVisited={Boolean(item.stopId && visitedSet.has(item.stopId))}
            isNearby={isNearby}
          />
        );
      })}
    </group>
  );
}
