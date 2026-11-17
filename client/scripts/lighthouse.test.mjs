import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIGHTHOUSE_WORLD,STAIRS,TOWER,groundAt,canWalk,getHillStep,getSpiralPose,advanceLighthousePlayer,cameraDistance} from '../src/world/lighthouse/layout.js';
import {LIGHTHOUSE_STOPS, nearbyLighthouseStop} from '../src/world/lighthouse/tour.js';

test('tour stops are reachable and only count while walking nearby on their floor', () => {
 const state = {worldScope:'lighthouse', cameraMode:'fps', playerTeleport:null};
 for (const stop of LIGHTHOUSE_STOPS) {
  const [x,y,z] = stop.position;
  assert.ok(canWalk(x,z,stop.level), stop.title);
  assert.equal(groundAt(x,z,stop.level),y);
  const standing = {...state, lighthouseLevel:stop.level, playerPosition:[x,y+1.4,z]};
  assert.equal(nearbyLighthouseStop(standing), stop);
  assert.equal(nearbyLighthouseStop({...standing, cameraMode:'orbit'}), null);
  assert.equal(nearbyLighthouseStop({...standing, worldScope:'campus'}), null);
  assert.equal(nearbyLighthouseStop({...standing, lighthouseLevel:'spiral'}), null);
  assert.equal(nearbyLighthouseStop({...standing, playerTeleport:{position:stop.position}}), null);
  assert.equal(nearbyLighthouseStop({...standing, playerPosition:[x+20,y,z]}), null);
 }
 assert.equal(nearbyLighthouseStop({
  ...state, lighthouseLevel:'ground', playerPosition:LIGHTHOUSE_STOPS.at(-1).position,
 }), null);
});
test('movement follows the stairs and slides along the house without entering it', () => {
 const [x, , z] = LIGHTHOUSE_WORLD.spawn.position;
 const player = {x, z};
 for (let i = 0; i < 70; i++) advanceLighthousePlayer(player, 0, -0.56, 'ground');
 assert.ok(player.z < STAIRS.z0);
 assert.ok(groundAt(player.x, player.z) > -0.1);
 advanceLighthousePlayer(player, 1, -9, 'ground');
 assert.ok(player.x > x);
 assert.ok(player.z >= 2.8);

 const balcony = {x:TOWER.x, z:TOWER.z+1.55};
 advanceLighthousePlayer(balcony, 0, -3, 'balcony');
 assert.ok(balcony.z > TOWER.z);
 assert.ok(canWalk(balcony.x, balcony.z, 'balcony'));
});
test('walking camera retracts at the house and the balcony core', () => {
 const front = {x:4, y:2.4, z:4.5};
 assert.ok(cameraDistance(front, {x:0,y:0,z:-1}, 4) < 2);
 assert.equal(cameraDistance(front, {x:0,y:0,z:1}, 4), 4);
 const balcony = {x:TOWER.x, y:TOWER.balconyY+1.25, z:TOWER.z+1.55};
 assert.ok(cameraDistance(balcony, {x:0,y:0,z:-1}, 4, 'balcony') < 1);
});
test('spawn, hill stair route and balcony remain walkable on the new model',()=>{
 const [x,y,z]=LIGHTHOUSE_WORLD.spawn.position;
 assert.ok(canWalk(x,z));assert.equal(groundAt(x,z),y);
 assert.equal(STAIRS.steps,110);
 assert.ok(STAIRS.rise>=.14 && STAIRS.rise<=.18,'Human-scale risers');
 assert.ok(STAIRS.going>=.30 && STAIRS.going<=.36,'Human-scale treads');
 for(let i=0;i<STAIRS.steps;i++){
  const p=getHillStep(i);assert.ok(canWalk(p.x,p.z));assert.ok(Math.abs(groundAt(p.x,p.z)-p.y)<.0001);
 }
 assert.ok(Math.abs(getHillStep(109).y+17.472)<.0001,'Preserve the bottom elevation');
 assert.ok(Math.abs(getHillStep(109).z-44.628)<.0001,'Preserve the approach route');
 assert.ok(canWalk(TOWER.x,TOWER.z+1.55,'balcony'));
 assert.equal(getSpiralPose(1).y,TOWER.balconyY);
 assert.ok(!canWalk(30,20));assert.ok(!canWalk(4,0));
 assert.ok(Math.abs(groundAt(4,STAIRS.z1)-STAIRS.yBottom)<.001);
});
test('web GLB is compressed, bounded and contains terrain plus the tower',()=>{
 const b=readFileSync(new URL('../src/assets/models/lighthouse_landscape.glb',import.meta.url));
 assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);
 const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 assert.ok(j.extensionsRequired.includes('KHR_draco_mesh_compression'));
 assert.ok(b.length<2*1024*1024);
 const triangles=j.meshes.flatMap(m=>m.primitives)
  .reduce((total,p)=>total+j.accessors[p.indices].count/3,0);
 assert.ok(triangles<260_000,'Vegetation must fit the walking scene triangle budget');
 assert.ok(j.materials.some(m=>m.name.includes('Coastal foliage')));
 assert.ok(j.materials.some(m=>m.name.includes('Hill grass')));
});
