// Photo/video reconstruction, estimated metres. Blender (x,y,z) -> web (x,z,-y).
export const SEA_LEVEL=-31;
export const TOWER={x:-10,z:0,rotundaRadius:4.45,rotundaFloor:1.11,rotundaHeight:5.2,coreBottom:1.65,coreTop:1.12,coreHeight:18.2,balconyY:19.35,balconyRadius:1.96,drumRadius:1.04,lanternBase:20.36,lanternTop:21.9,lanternRadius:1,lampY:21.1,spiralTurns:4,spiralSteps:112,spiralStartAngle:Math.PI*.28};
export const HOUSE={x0:-6,x1:14,z0:-4.5,z1:2.5,floor:1.11};
export const YARD={x0:-14.6,x1:16.4,z0:-6.6,z1:7.4};
export const STAIRS={x0:2.7,x1:5.3,z0:7.5,z1:44.63,yTop:0,yBottom:-17.472,steps:40};
export const VIEWPOINT={x0:2.4,x1:5.6,z0:44.63,z1:47,y:-17.472};
export function getSpiralPose(t){t=Math.min(1,Math.max(0,t));const angle=TOWER.spiralStartAngle+t*TOWER.spiralTurns*Math.PI*2,radius=1.35;return{x:TOWER.x+Math.cos(angle)*radius,z:TOWER.z+Math.sin(angle)*radius,y:TOWER.rotundaFloor+t*(TOWER.balconyY-TOWER.rotundaFloor),angle,radius,yawUp:Math.atan2(-Math.sin(angle),Math.cos(angle))};}
export function groundAt(x,z,level='ground',t=0){
 if(level==='spiral')return getSpiralPose(t).y;
 if(level==='balcony')return TOWER.balconyY;
 if(z>=VIEWPOINT.z0)return VIEWPOINT.y;
 if(z>=STAIRS.z0-.5)return -Math.max(0,Math.min(39,Math.round((z-7.5)/.952)))*.448;
 if(Math.hypot(x-TOWER.x,z-TOWER.z)<4.45)return 1.11;
 if(x>2.5&&x<6&&z>4.1&&z<5.7)return Math.min(1.05,Math.max(.15,(5.7-z)/.24*.15));
 if(x>-6&&x<14&&z<4.1)return 1.11;
 return .075;
}
export function canWalk(x,z,level='ground'){
 const d=Math.hypot(x-TOWER.x,z-TOWER.z);
 if(level==='spiral')return true;
 if(level==='balcony')return d>=1.24&&d<=1.8;
 const yard=x>=YARD.x0&&x<=YARD.x1&&z>=YARD.z0&&z<=YARD.z1;
 const stairs=x>=STAIRS.x0+.15&&x<=STAIRS.x1-.15&&z>=7&&z<=45;
 const landing=x>=2.65&&x<=5.35&&z>=44.3&&z<=46.75;
 if(!yard&&!stairs&&!landing)return false;
 if(d<1.9)return false;
 if(x>HOUSE.x0-.3&&x<HOUSE.x1+.3&&z>HOUSE.z0-.3&&z<HOUSE.z1+.3)return false;
 return true;
}
export function advanceLighthousePlayer(position, dx, dz, level) {
 const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.2));
 for (let i = 0; i < steps; i++) {
  const x = position.x + dx / steps;
  const z = position.z + dz / steps;
  if (canWalk(x, z, level)) {
   position.x = x;
   position.z = z;
  } else {
   if (canWalk(x, position.z, level)) position.x = x;
   if (canWalk(position.x, z, level)) position.z = z;
  }
 }
}

export function cameraDistance(target, direction, maxDistance, level = 'ground') {
 const limit = level === 'ground' ? maxDistance : Math.min(maxDistance, 3.2);
 if (level === 'spiral') return limit;
 for (let d = 0.2; d <= limit; d += 0.2) {
  const x = target.x + direction.x * d;
  const y = target.y + direction.y * d;
  const z = target.z + direction.z * d;
  const insideHouse = level === 'ground' && y < 8.1 &&
   x > HOUSE.x0 - 0.2 && x < HOUSE.x1 + 0.2 && z > HOUSE.z0 - 0.2 && z < HOUSE.z1 + 0.2;
  const towerRadius = level === 'balcony' ? TOWER.drumRadius : TOWER.coreBottom;
  const insideTower = y < TOWER.lanternTop && Math.hypot(x - TOWER.x, z - TOWER.z) < towerRadius + 0.14;
  if (insideHouse || insideTower) return Math.max(0.2, d - 0.2);
 }
 return limit;
}
export const LIGHTHOUSE_WORLD={id:'lighthouse',spawn:{position:[4,VIEWPOINT.y,45.8],yaw:Math.PI,level:'ground'},groundAt,canWalk,cameraDistance};
export function teleportFor(){return LIGHTHOUSE_WORLD.spawn;}
