import hillStairs from './hill-stairs.json' with { type: 'json' };
import courtyard from './courtyard.json' with { type: 'json' };
// Photo/video reconstruction, estimated metres. Blender (x,y,z) -> web (x,z,-y).
export const SEA_LEVEL=-31;
export const TOWER={x:-10,z:0,rotundaRadius:4.45,rotundaFloor:1.11,rotundaHeight:5.2,coreBottom:1.65,coreTop:1.12,coreHeight:18.2,balconyY:19.35,balconyRadius:1.96,drumRadius:1.04,lanternBase:20.36,lanternTop:21.9,lanternRadius:1,lampY:21.1,spiralTurns:4,spiralSteps:112,spiralStartAngle:Math.PI*.28};
export const HOUSE={x0:-6,x1:14,z0:-4.5,z1:2.5,floor:1.11};
export const COURTYARD = courtyard;
export const YARD={x0:courtyard.bounds.x0+courtyard.edgeInset,x1:courtyard.bounds.x1-courtyard.edgeInset,z0:courtyard.bounds.z0+courtyard.edgeInset,z1:courtyard.bounds.z1-courtyard.edgeInset};
export const ROTUNDA_ENTRY = courtyard.rotundaEntry;

export function entryCoordinates(x,z,angle=ROTUNDA_ENTRY.angle) {
 const dx=x-TOWER.x,dz=z-TOWER.z;
 return { radial:dx*Math.cos(angle)+dz*Math.sin(angle), lateral:-dx*Math.sin(angle)+dz*Math.cos(angle) };
}
export function getRotundaStep(index) {
 const i=Math.max(0,Math.min(ROTUNDA_ENTRY.steps-1,index));
 const going=(ROTUNDA_ENTRY.outerRadius-ROTUNDA_ENTRY.innerRadius)/(ROTUNDA_ENTRY.steps-1);
 const radius=ROTUNDA_ENTRY.outerRadius-i*going;
 return {x:TOWER.x+Math.cos(ROTUNDA_ENTRY.angle)*radius,z:TOWER.z+Math.sin(ROTUNDA_ENTRY.angle)*radius,
  y:courtyard.floorY+(i+1)*(TOWER.rotundaFloor-courtyard.floorY)/ROTUNDA_ENTRY.steps,
  width:ROTUNDA_ENTRY.width,depth:ROTUNDA_ENTRY.depth,angle:ROTUNDA_ENTRY.angle};
}
function rotundaStepHeight(x,z) {
 const p=entryCoordinates(x,z);
 if(Math.abs(p.lateral)>ROTUNDA_ENTRY.width/2)return null;
 for(let i=ROTUNDA_ENTRY.steps-1;i>=0;i--) {
  const step=getRotundaStep(i);
  const radius=ROTUNDA_ENTRY.outerRadius-i*(ROTUNDA_ENTRY.outerRadius-ROTUNDA_ENTRY.innerRadius)/(ROTUNDA_ENTRY.steps-1);
  if(Math.abs(p.radial-radius)<=step.depth/2)return step.y;
 }
 return null;
}
export function onRotundaSteps(x,z) {return rotundaStepHeight(x,z)!==null;}

export function stairEntryAt(position,level='ground') {
 if(level!=='ground'&&level!=='balcony')return null;
 const progress=level==='balcony'?1:0;
 const pose=getSpiralPose(progress);
 if(Math.hypot(position.x-pose.x,position.z-pose.z)>0.7||Math.abs(position.y-pose.y)>.3)return null;
 return {progress,pose,yaw:pose.yawUp+(progress===1?Math.PI:0)};
}
export const STAIRS={
 x0:hillStairs.centerX-hillStairs.width/2,x1:hillStairs.centerX+hillStairs.width/2,
 z0:hillStairs.topZ,z1:hillStairs.bottomZ,yTop:hillStairs.topY,yBottom:hillStairs.bottomY,
 steps:hillStairs.treads,width:hillStairs.width,thickness:hillStairs.thickness,
 rise:(hillStairs.topY-hillStairs.bottomY)/(hillStairs.treads-1),
 going:(hillStairs.bottomZ-hillStairs.topZ)/(hillStairs.treads-1),
 overlap:hillStairs.overlap,speed:hillStairs.walkingSpeed,stride:hillStairs.stride,
};
export function getHillStep(index) {
 const i=Math.max(0,Math.min(STAIRS.steps-1,index));
 return {x:hillStairs.centerX,y:STAIRS.yTop-i*STAIRS.rise,z:STAIRS.z0+i*STAIRS.going,
  width:STAIRS.width,depth:STAIRS.going+STAIRS.overlap,height:STAIRS.thickness};
}
function hillGroundAt(z) {
 const halfDepth=(STAIRS.going+STAIRS.overlap)/2;
 const i=Math.max(0,Math.min(STAIRS.steps-1,Math.ceil((z-STAIRS.z0-halfDepth)/STAIRS.going)));
 return STAIRS.yTop-i*STAIRS.rise;
}
export const VIEWPOINT={x0:2.4,x1:5.6,z0:44.63,z1:47,y:-17.472};
export function getSpiralPose(t){t=Math.min(1,Math.max(0,t));const angle=TOWER.spiralStartAngle+t*TOWER.spiralTurns*Math.PI*2,radius=1.35;return{x:TOWER.x+Math.cos(angle)*radius,z:TOWER.z+Math.sin(angle)*radius,y:TOWER.rotundaFloor+t*(TOWER.balconyY-TOWER.rotundaFloor),angle,radius,yawUp:Math.atan2(-Math.sin(angle),Math.cos(angle))};}
export function groundAt(x,z,level='ground',t=0){
 if(level==='spiral')return getSpiralPose(t).y;
 if(level==='balcony')return TOWER.balconyY;
 if(z>=VIEWPOINT.z0)return VIEWPOINT.y;
 if(z>=STAIRS.z0-.5&&x>=STAIRS.x0&&x<=STAIRS.x1)return hillGroundAt(z);
 const entryHeight=rotundaStepHeight(x,z);
 if(entryHeight!==null)return entryHeight;
 if(Math.hypot(x-TOWER.x,z-TOWER.z)<4.45)return 1.11;
 if(x>2.5&&x<6&&z>4.1&&z<5.7)return Math.min(1.05,Math.max(.15,(5.7-z)/.24*.15));
 // The front veranda occupies z=2.1..4.1; the rear courtyard stays at paving height.
 if(x>HOUSE.x0&&x<HOUSE.x1&&z>2.1&&z<4.1)return HOUSE.floor;
 return courtyard.floorY;
}
// Resolve the tread under each foot on the turn nearest the player's height.
export function footGroundAt(x, z, level = 'ground', t = 0) {
 // Match the visible boxes from hill_stairs.py and the entrance builder.
 // Adjacent treads overlap slightly, so the higher tread owns the overlap.
 if (level === 'ground') {
  const entryHeight=rotundaStepHeight(x,z);
  if(entryHeight!==null)return entryHeight;
  const halfDepth = (STAIRS.going + STAIRS.overlap) / 2;
  if (x >= STAIRS.x0 && x <= STAIRS.x1 && z >= STAIRS.z0-halfDepth && z <= STAIRS.z1+halfDepth) {
   return hillGroundAt(z);
  }
  if (x >= 2.55 && x <= 5.95) {
   for (let i = 6; i >= 0; i--) {
    const center = 5.55 - i * 0.24;
    if (z >= center - 0.13 && z <= center + 0.13) return (i + 1) * 0.15;
   }
  }
 }
 if (level !== 'spiral') return groundAt(x, z, level, t);
 const tau = Math.PI * 2;
 const angle = Math.atan2(z - TOWER.z, x - TOWER.x);
 const reference = TOWER.spiralStartAngle + t * TOWER.spiralTurns * tau;
 const unwrapped = angle + Math.round((reference - angle) / tau) * tau;
 const progress = (unwrapped - TOWER.spiralStartAngle) / (TOWER.spiralTurns * tau);
 const index = Math.max(0, Math.min(TOWER.spiralSteps - 1, Math.floor(progress * TOWER.spiralSteps)));
 return getSpiralPose((index + 0.5) / TOWER.spiralSteps).y;
}
export function canWalk(x,z,level='ground'){
 const d=Math.hypot(x-TOWER.x,z-TOWER.z);
 if(level==='spiral')return true;
 if(level==='balcony')return d>=1.24&&d<=1.8;
 const yard=x>=YARD.x0&&x<=YARD.x1&&z>=YARD.z0&&z<=YARD.z1;
 const stairs=x>=STAIRS.x0+.15&&x<=STAIRS.x1-.15&&z>=STAIRS.z0-.6&&z<=45;
 const landing=x>=2.65&&x<=5.35&&z>=44.3&&z<=46.75;
 if(!yard&&!stairs&&!landing)return false;
 const door=entryCoordinates(x,z,courtyard.towerDoor.angle);
 if(d<1.9&&!(door.radial>=1.15&&Math.abs(door.lateral)<courtyard.towerDoor.width/2-.25))return false;
 // The raised rotunda is entered through its new stair and the open arcade bay.
 const entry=entryCoordinates(x,z);
 if(d>=3.82&&d<=4.65&&!(entry.radial>0&&Math.abs(entry.lateral)<ROTUNDA_ENTRY.width/2-.15))return false;
 for(let i=0;i<8;i++) {
  const a=i*Math.PI/4;
  if(Math.hypot(x-TOWER.x-Math.cos(a)*4,z-TOWER.z-Math.sin(a)*4)<.38)return false;
 }
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
