import React, { useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { MODEL_URLS } from '../models';
import { SEA_LEVEL, TOWER, VIEWPOINT, getSpiralPose } from './layout';
import { LIGHTHOUSE_STOPS } from './tour';

function TourMarkers() {
 const visited = useStore(state => state.visitedHotspots);
 const level = useStore(state => state.lighthouseLevel);
 const walking = useStore(state => state.cameraMode === 'fps');
 if (!walking) return null;
 return LIGHTHOUSE_STOPS.filter(stop => stop.level === level).map(stop => {
  const discovered = visited.includes(stop.id);
  const color = discovered ? '#8aebba' : '#ffd063';
  return (
   <group key={stop.id} position={stop.position}>
    <mesh rotation-x={-Math.PI / 2} position-y={0.035}>
     <ringGeometry args={[0.41, 0.54, 32]} />
     <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
    {!discovered && (
     <mesh position-y={0.85}>
      <cylinderGeometry args={[0.17, 0.28, 1.7, 16, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0.24} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
     </mesh>
    )}
   </group>
  );
 });
}

function SpiralSteps({ visible }) {
  const steps = useRef(null);
  const posts = useRef(null);
  const railSegments = useRef(null);

  useLayoutEffect(() => {
    const transform = new THREE.Object3D();
    const count = TOWER.spiralSteps;
    for (let i = 0; i < count; i++) {
      const pose = getSpiralPose((i + 0.5) / count);
      // Bậc thang gỗ xoắn ốc
      transform.position.set(pose.x, pose.y - 0.06, pose.z);
      transform.rotation.set(0, -pose.angle, 0);
      transform.scale.set(1, 1, 1);
      transform.updateMatrix();
      steps.current.setMatrixAt(i, transform.matrix);

      // Trụ đứng lan can mép ngoài cao ngang lan can (0.84m)
      if (posts.current) {
        const outerX = TOWER.x + Math.cos(pose.angle) * 1.62;
        const outerZ = TOWER.z + Math.sin(pose.angle) * 1.62;
        transform.position.set(outerX, pose.y + 0.36, outerZ);
        transform.rotation.set(0, 0, 0);
        transform.updateMatrix();
        posts.current.setMatrixAt(i, transform.matrix);
      }

      // Thanh tay vịn nối các trụ ở độ cao ngang bằng lan can (0.84m)
      if (railSegments.current) {
        const nextPose = getSpiralPose(Math.min(1, (i + 1.5) / count));
        const currX = TOWER.x + Math.cos(pose.angle) * 1.62;
        const currZ = TOWER.z + Math.sin(pose.angle) * 1.62;
        const nextX = TOWER.x + Math.cos(nextPose.angle) * 1.62;
        const nextZ = TOWER.z + Math.sin(nextPose.angle) * 1.62;
        const midX = (currX + nextX) / 2;
        const midY = (pose.y + nextPose.y) / 2 + 0.84;
        const midZ = (currZ + nextZ) / 2;
        const yaw = Math.atan2(nextX - currX, nextZ - currZ);
        const pitch = -Math.atan2(nextPose.y - pose.y, Math.hypot(nextX - currX, nextZ - currZ));
        transform.position.set(midX, midY, midZ);
        transform.rotation.set(pitch, yaw, 0, 'YXZ');
        transform.updateMatrix();
        railSegments.current.setMatrixAt(i, transform.matrix);
      }
    }
    steps.current.instanceMatrix.needsUpdate = true;
    steps.current.computeBoundingSphere();
    if (posts.current) {
      posts.current.instanceMatrix.needsUpdate = true;
      posts.current.computeBoundingSphere();
    }
    if (railSegments.current) {
      railSegments.current.instanceMatrix.needsUpdate = true;
      railSegments.current.computeBoundingSphere();
    }
  }, []);

  return (
    <group visible={visible}>
      {/* 112 Bậc thang xoắn ốc */}
      <instancedMesh ref={steps} args={[null, null, TOWER.spiralSteps]}>
        <boxGeometry args={[0.8, 0.12, 0.3]} />
        <meshStandardMaterial color="#bc8542" roughness={0.6} />
      </instancedMesh>
      {/* Trụ lan can inox trắng cao ngang lan can (0.84m) */}
      <instancedMesh ref={posts} args={[null, null, TOWER.spiralSteps]}>
        <cylinderGeometry args={[0.02, 0.02, 0.84, 8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      {/* Tay vịn liên tục ở đỉnh trụ cao ngang bằng chiều cao lan can (0.84m) */}
      <instancedMesh ref={railSegments} args={[null, null, TOWER.spiralSteps]}>
        <boxGeometry args={[0.07, 0.05, 0.38]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.35} />
      </instancedMesh>
    </group>
  );
}

export function LighthouseScene() {
  const { scene } = useGLTF(MODEL_URLS.lighthouseLandscape);
  const level = useStore((s) => s.lighthouseLevel);
  const time = useStore((s) => s.timeOfDay);
  const quality = useStore((s) => s.quality);
  const beacon = useRef();
  const model = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if (o.isMesh) {
        o.receiveShadow = true;
        o.material = Array.isArray(o.material)
          ? o.material.map((m) => m.clone())
          : o.material.clone();
        // Stairs and rails now have their final dimensions in the Blender source.
      }
    });
    return c;
  }, [scene]);
 useEffect(() => {
  model.traverse(mesh => {
   if (!mesh.isMesh) return;
   const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
   const landscape = materials.every(mat => /coastal foliage|tree bark|hill grass/i.test(mat.name));
   mesh.castShadow = quality !== 'low' && (quality === 'high' || !landscape);
   for (const material of materials) {
    const fade = level === 'spiral' && /plaster|trim|plinth/i.test(material.name);
    if (material.transparent === fade) continue;
    material.transparent = fade;
    material.opacity = fade ? 0.22 : 1;
    material.depthWrite = !fade;
    material.needsUpdate = true;
   }
  });
 }, [model, level, quality]);
 useFrame((_,dt)=>{if(beacon.current)beacon.current.rotation.y+=dt*.5;});
 return <group name="Lighthouse_Video_Reconstruction">
  {/* Blender exports metres and Y-up: no legacy Meshy scale or offset. */}
  <primitive object={model}/>
  <TourMarkers />
  <mesh rotation-x={-Math.PI/2} position={[0,SEA_LEVEL,0]}><planeGeometry args={[3200,3200]}/><meshStandardMaterial color={time==='night'?'#082736':time==='sunset'?'#426775':'#398b9c'} roughness={.3} metalness={.15}/></mesh>
  <mesh position={[4,VIEWPOINT.y-.15,(VIEWPOINT.z0+VIEWPOINT.z1)/2]} receiveShadow><boxGeometry args={[3.2,.3,VIEWPOINT.z1-VIEWPOINT.z0]}/><meshStandardMaterial color="#69716c"/></mesh>
  <SpiralSteps visible={level === 'spiral'} />
  <group ref={beacon} position={[TOWER.x,TOWER.lampY,TOWER.z]}>
   <mesh><sphereGeometry args={[.22,12,8]}/><meshStandardMaterial color="#ffe798" emissive="#ffc74a" emissiveIntensity={time==='night'?4:1}/></mesh>
   {time!=='day'&&<mesh position={[0,0,15]} rotation-x={Math.PI/2}><coneGeometry args={[3,30,16,1,true]}/><meshBasicMaterial color="#ffe798" transparent opacity={.12} side={THREE.DoubleSide} depthWrite={false}/></mesh>}
  </group>
  <pointLight position={[TOWER.x,TOWER.lampY,TOWER.z]} color="#ffe9a0" intensity={time==='night'?8:1} distance={45}/>
 </group>;
}
