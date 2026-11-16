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
 const activeStop = useStore(state => state.activeHotspot);
 if (!walking || activeStop) return null;
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
 useLayoutEffect(() => {
  const transform = new THREE.Object3D();
  for (let i = 0; i < TOWER.spiralSteps; i++) {
   const pose = getSpiralPose((i + 0.5) / TOWER.spiralSteps);
   transform.position.set(pose.x, pose.y - 0.06, pose.z);
   transform.rotation.y = -pose.angle;
   transform.updateMatrix();
   steps.current.setMatrixAt(i, transform.matrix);
  }
  steps.current.instanceMatrix.needsUpdate = true;
  steps.current.computeBoundingSphere();
 }, []);
 return (
  <instancedMesh ref={steps} args={[null, null, TOWER.spiralSteps]} visible={visible}>
   <boxGeometry args={[0.8, 0.12, 0.3]} />
   <meshStandardMaterial color="#bc8542" />
  </instancedMesh>
 );
}

export function LighthouseScene() {
 const { scene } = useGLTF(MODEL_URLS.lighthouseLandscape);
 const level=useStore(s=>s.lighthouseLevel), time=useStore(s=>s.timeOfDay), quality=useStore(s=>s.quality);
 const beacon=useRef();
 const model=useMemo(()=>{const c=scene.clone(true);c.traverse(o=>{if(o.isMesh){o.receiveShadow=true;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();}});return c;},[scene]);
 useEffect(()=>{model.traverse(o=>{if(!o.isMesh)return;o.castShadow=quality!=='low';for(const m of Array.isArray(o.material)?o.material:[o.material]){const fade=level==='spiral'&&/plaster|trim|plinth/i.test(m.name);m.transparent=fade;m.opacity=fade?.22:1;m.depthWrite=!fade;m.needsUpdate=true;}});},[model,level,quality]);
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
