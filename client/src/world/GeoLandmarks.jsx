import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Công trình thu nhỏ đánh dấu địa danh trên bản đồ đảo. Kích thước được phóng to nhiều lần so với thật
// (1 đơn vị = 100 m) để còn nhìn thấy khi xem toàn đảo, giống các biểu tượng trên bản đồ du lịch.
export const LANDMARK_HEIGHT = {
  lighthouse: 3.1,
  school: 1.5,
  kindergarten: 1.2,
  pier: 0.5,
  beach: 0.9,
  post: 1.6,
  temple: 1.3,
};

const WALL = '#F6E2A8';
const ROOF_RED = '#C8432F';

function Flag({ position = [0, 0, 0], height = 1.5 }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, height, 6]} />
        <meshStandardMaterial color="#E5E7EB" />
      </mesh>
      <mesh position={[0.2, height - 0.14, 0]}>
        <boxGeometry args={[0.4, 0.26, 0.02]} />
        <meshStandardMaterial color="#DA251D" />
      </mesh>
    </group>
  );
}

function Building({ size, wall = WALL, roof = ROOF_RED }) {
  const [width, height, depth] = size;
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={wall} roughness={0.8} />
      </mesh>
      {/* Mái dốc bốn phía: chóp bốn cạnh xoay 45° rồi kéo dãn theo chiều dài nhà */}
      <mesh position={[0, height + 0.2, 0]} rotation-y={Math.PI / 4} scale={[width * 0.78, 1, depth * 0.78]}>
        <coneGeometry args={[1, 0.4, 4]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Lighthouse() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.5, 0.56, 0.3, 16]} />
        <meshStandardMaterial color="#E7E0D0" />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.2, 0.32, 2.1, 16]} />
        <meshStandardMaterial color="#FFFDF5" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.44, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.08, 16]} />
        <meshStandardMaterial color="#F2C94C" />
      </mesh>
      <mesh position={[0, 2.64, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.32, 12]} />
        <meshStandardMaterial color="#FFF3A0" emissive="#FFE066" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 2.95, 0]}>
        <coneGeometry args={[0.28, 0.3, 12]} />
        <meshStandardMaterial color={ROOF_RED} />
      </mesh>
    </group>
  );
}

function Umbrella({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
        <meshStandardMaterial color="#F9FAFB" />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <coneGeometry args={[0.4, 0.24, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// `seaward` là góc quay quanh trục đứng để mặt trước công trình hướng ra phía thấp nhất (biển).
export function Landmark({ kind, seaward = 0 }) {
  switch (kind) {
    case 'lighthouse':
      return <Lighthouse />;
    case 'school':
      return (
        <group>
          <Building size={[1.7, 0.8, 0.6]} />
          <Flag position={[0, 0, 0.6]} height={1.3} />
        </group>
      );
    case 'kindergarten':
      return <Building size={[1.1, 0.6, 0.6]} wall="#FDE2E4" roof="#3B82C4" />;
    case 'temple':
      return <Building size={[0.8, 0.6, 0.8]} wall="#E8C77A" roof="#8E2B1F" />;
    case 'post':
      return (
        <group>
          <Building size={[1.0, 0.6, 0.7]} wall="#CBD5B1" roof="#5B7553" />
          <Flag position={[0.75, 0, 0]} height={1.6} />
        </group>
      );
    case 'pier':
      return (
        <group rotation-y={seaward}>
          <mesh position={[0, 0.16, 1.2]}>
            <boxGeometry args={[0.36, 0.1, 2.6]} />
            <meshStandardMaterial color="#D1D5DB" />
          </mesh>
          <mesh position={[0, 0.25, -0.3]}>
            <boxGeometry args={[0.8, 0.4, 0.5]} />
            <meshStandardMaterial color={WALL} />
          </mesh>
        </group>
      );
    case 'beach':
      return (
        <group rotation-y={seaward}>
          <Umbrella position={[-0.5, 0, 0.3]} color="#F97316" />
          <Umbrella position={[0.1, 0, 0.5]} color="#38BDF8" />
          <Umbrella position={[0.6, 0, 0.2]} color="#FACC15" />
        </group>
      );
    default:
      return null;
  }
}

function makePuffTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.96)');
  gradient.addColorStop(0.86, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Vị trí cố định (không ngẫu nhiên) để mỗi lần mở trang mây nằm cùng chỗ.
// Mây nằm trên vùng nước sẫm màu ở eo biển phía Bắc và biển phía Nam, nơi mây trắng nổi rõ;
// không có đám nào ngay trên đảo.
const CLOUDS = [
  [-150, 14, -50, 0.8], [70, 15, -58, 0.9], [185, 14, -35, 0.8], [10, 16, -125, 1.0],
  [-60, 13, 78, 0.8], [120, 14, 95, 1.0], [-215, 14, 40, 0.7],
];
const PUFFS = [[0, 0, 0, 1], [5, -0.8, 1, 0.8], [-5, -1, 0.5, 0.75], [1.5, 2, -1, 0.7], [9, -1.4, 0, 0.5]];
const DRIFT_SPEED = 0.9; // đơn vị mỗi giây, tức khoảng 90 m/s trên bản đồ: chậm vừa đủ để thấy mây trôi
const WRAP = 280;

export function GeoClouds() {
  const group = useRef(null);
  const texture = useMemo(makePuffTexture, []);
  const material = useMemo(
    () => new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1, depthWrite: false }),
    [texture],
  );

  useFrame((_, delta) => {
    for (const cloud of group.current.children) {
      cloud.position.x += DRIFT_SPEED * Math.min(delta, 0.1);
      if (cloud.position.x > WRAP) cloud.position.x = -WRAP;
    }
  });

  return (
    <group ref={group} name="GeoClouds">
      {CLOUDS.map(([x, y, z, size], index) => (
        <group key={index} position={[x, y, z]} scale={size}>
          {PUFFS.map(([px, py, pz, puff], puffIndex) => (
            <sprite key={puffIndex} material={material} position={[px, py, pz]} scale={[10 * puff, 6.5 * puff, 1]} />
          ))}
        </group>
      ))}
    </group>
  );
}
