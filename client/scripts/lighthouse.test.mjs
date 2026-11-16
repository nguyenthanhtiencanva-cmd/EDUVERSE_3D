import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIGHTHOUSE_WORLD,STAIRS,TOWER,groundAt,canWalk,getSpiralPose} from '../src/world/lighthouse/layout.js';
import {LIGHTHOUSE_STOPS, nearbyLighthouseStop} from '../src/world/lighthouse/tour.js';

test('tour stops are reachable and only open while walking nearby on their floor', () => {
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
test('spawn, hill stair route and balcony remain walkable on the new model',()=>{
 const [x,y,z]=LIGHTHOUSE_WORLD.spawn.position;
 assert.ok(canWalk(x,z));assert.equal(groundAt(x,z),y);
 for(let i=0;i<40;i++){
  const z=7.5+i*.952;assert.ok(canWalk(4,z));assert.ok(Math.abs(groundAt(4,z)+i*.448)<.0001);
 }
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
 assert.ok(b.length<4*1024*1024);
 assert.ok(j.materials.some(m=>m.name.includes('Coastal foliage')));
 assert.ok(j.materials.some(m=>m.name.includes('Hill grass')));
});
