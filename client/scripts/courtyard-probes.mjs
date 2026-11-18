import { writeFileSync } from 'node:fs';
import { COURTYARD, TOWER, STAIRS, ROTUNDA_ENTRY, groundAt, getHillStep, getRotundaStep, getSpiralPose } from '../src/world/lighthouse/layout.js';

const probes=[];
for(let i=0;i<STAIRS.steps;i++){
  const p=getHillStep(i);
  for(const offset of [-.8,0,.8])probes.push({kind:'hill',x:p.x+offset,z:p.z,y:p.y,tolerance:i===0?.025:.012});
}
for(let i=0;i<ROTUNDA_ENTRY.steps;i++){
  const p=getRotundaStep(i);
  for(const side of [-.8,0,.8])probes.push({kind:'rotunda-step',x:p.x-Math.sin(p.angle)*side,z:p.z+Math.cos(p.angle)*side,y:p.y,tolerance:.012});
}
const route=[...COURTYARD.path];
const inner=getRotundaStep(6);route.push([inner.x,inner.z]);
route.push([TOWER.x+Math.cos(ROTUNDA_ENTRY.angle)*3.4,Math.sin(ROTUNDA_ENTRY.angle)*3.4]);
const a=COURTYARD.towerDoor.angle;
route.push([TOWER.x+Math.cos(a)*2.15,Math.sin(a)*2.15]);
const door=getSpiralPose(0);route.push([door.x,door.z]);
for(let i=1;i<route.length;i++){
  const [x0,z0]=route[i-1],[x1,z1]=route[i],n=Math.ceil(Math.hypot(x1-x0,z1-z0)/.15);
  for(let j=0;j<=n;j++){
    const x=x0+(x1-x0)*j/n,z=z0+(z1-z0)*j/n;
    probes.push({kind:'route',x,z,y:groundAt(x,z),tolerance:.025});
  }
}
for(const x of [-16,-10,-4,4,12,18]){
  for(const z of [-8,-6])probes.push({kind:'rear-yard',x,z,y:groundAt(x,z),tolerance:.025});
}
for(const x of [-16,18]){
  for(const z of [-3,2,7,10])probes.push({kind:'side-yard',x,z,y:groundAt(x,z),tolerance:.025});
}
writeFileSync(new URL('../../assets/landmarks/vinh_thuc_rebuilt/courtyard_runtime_probes.json',import.meta.url),JSON.stringify({probes,door:{...door,angle:a},entry:ROTUNDA_ENTRY},null,2));
console.log(`Exported ${probes.length} probes from the actual runtime layout.`);
