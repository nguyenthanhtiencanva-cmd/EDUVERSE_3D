import hillStairs from './hill-stairs.json' with { type: 'json' };
// Photo/video reconstruction, estimated metres. Blender (x,y,z) -> web (x,z,-y).
export const SEA_LEVEL=-31;
export const TOWER={x:-10,z:0,rotundaRadius:4.45,rotundaFloor:1.11,rotundaHeight:5.2,coreBottom:1.65,coreTop:1.12,coreHeight:18.2,balconyY:19.35,balconyRadius:1.96,drumRadius:1.04,lanternBase:20.36,lanternTop:21.9,lanternRadius:1,lampY:21.1,spiralTurns:4,spiralSteps:112,spiralStartAngle:Math.PI*.28};
export const HOUSE={x0:-6,x1:14,z0:-4.5,z1:2.5,floor:1.11};
export const YARD={x0:-14.6,x1:16.4,z0:-6.6,z1:7.4};
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
 if(z>=STAIRS.z0-.5)return hillGroundAt(z);
 if(Math.hypot(x-TOWER.x,z-TOWER.z)<4.45)return 1.11;
 if(x>2.5&&x<6&&z>4.1&&z<5.7)return Math.min(1.05,Math.max(.15,(5.7-z)/.24*.15));
 if(x>-6&&x<14&&z<4.1)return 1.11;
 return .075;
}
// Resolve the tread under each foot on the turn nearest the player's height.
export function footGroundAt(x, z, level = 'ground', t = 0) {
 // Match the visible boxes from hill_stairs.py and the entrance builder.
 // Adjacent treads overlap slightly, so the higher tread owns the overlap.
 if (level === 'ground') {
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
