import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIGHTHOUSE_WORLD,STAIRS,TOWER,groundAt,canWalk,getSpiralPose} from '../src/world/lighthouse/layout.js';
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
