import React, { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { MODEL_URLS } from '../models';
import { SEA_LEVEL, TOWER, VIEWPOINT, getSpiralPose } from './layout';
export function LighthouseScene() {
 const { scene } = useGLTF(MODEL_URLS.lighthouseLandscape);
 const level=useStore(s=>s.lighthouseLevel), time=useStore(s=>s.timeOfDay), quality=useStore(s=>s.quality);
 const beacon=useRef();
 const model=useMemo(()=>{const c=scene.clone(true);c.traverse(o=>{if(o.isMesh){o.receiveShadow=true;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();}});return c;},[scene]);
 useEffect(()=>{model.traverse(o=>{if(!o.isMesh)return;o.castShadow=quality!=='low';for(const m of Array.isArray(o.material)?o.material:[o.material]){const fade=level==='spiral'&&/plaster|trim|plinth/i.test(m.name);m.transparent=fade;m.opacity=fade?.22:1;m.depthWrite=!fade;m.needsUpdate=true;}});},[model,level,quality]);
 useFrame((_,dt)=>{if(beacon.current)beacon.current.rotation.y+=dt*.5;});
 const steps=useMemo(()=>Array.from({length:TOWER.spiralSteps},(_,i)=>getSpiralPose((i+.5)/TOWER.spiralSteps)),[]);
 return <group name="Lighthouse_Video_Reconstruction">
  {/* Blender exports metres and Y-up: no legacy Meshy scale or offset. */}
  <primitive object={model}/>
  <mesh rotation-x={-Math.PI/2} position={[0,SEA_LEVEL,0]}><planeGeometry args={[3200,3200]}/><meshStandardMaterial color={time==='night'?'#082736':time==='sunset'?'#426775':'#398b9c'} roughness={.3} metalness={.15}/></mesh>
  <mesh position={[4,VIEWPOINT.y-.15,(VIEWPOINT.z0+VIEWPOINT.z1)/2]} receiveShadow><boxGeometry args={[3.2,.3,VIEWPOINT.z1-VIEWPOINT.z0]}/><meshStandardMaterial color="#69716c"/></mesh>
  {steps.map((p,i)=><mesh key={i} position={[p.x,p.y-.06,p.z]} rotation-y={-p.angle} visible={level==='spiral'}><boxGeometry args={[.8,.12,.3]}/><meshStandardMaterial color="#bc8542"/></mesh>)}
  <group ref={beacon} position={[TOWER.x,TOWER.lampY,TOWER.z]}>
   <mesh><sphereGeometry args={[.22,12,8]}/><meshStandardMaterial color="#ffe798" emissive="#ffc74a" emissiveIntensity={time==='night'?4:1}/></mesh>
   {time!=='day'&&<mesh position={[0,0,15]} rotation-x={Math.PI/2}><coneGeometry args={[3,30,16,1,true]}/><meshBasicMaterial color="#ffe798" transparent opacity={.12} side={THREE.DoubleSide} depthWrite={false}/></mesh>}
  </group>
  <pointLight position={[TOWER.x,TOWER.lampY,TOWER.z]} color="#ffe9a0" intensity={time==='night'?8:1} distance={45}/>
 </group>;
}
