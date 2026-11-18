import test from 'node:test';
import assert from 'node:assert/strict';
import { COURTYARD, TOWER, STAIRS, ROTUNDA_ENTRY, LIGHTHOUSE_WORLD, groundAt, canWalk, getRotundaStep, getSpiralPose, advanceLighthousePlayer, stairEntryAt } from '../src/world/lighthouse/layout.js';
import { movementHeading, rebaseMovementHeading, followHeading, manualStairProgress, manualStairStep } from '../src/player/thirdPersonMovement.js';

test('the widened courtyard has a continuous walkable route from the hill to the tower door', () => {
  const bounds=COURTYARD.bounds;
  assert.ok((bounds.x1-bounds.x0)*(bounds.z1-bounds.z0)>480*1.5);
  assert.ok(COURTYARD.pathWidth>=2.4);
  const player={x:LIGHTHOUSE_WORLD.spawn.position[0],z:LIGHTHOUSE_WORLD.spawn.position[2]};
  const points=[...COURTYARD.path];
  for(let i=0;i<ROTUNDA_ENTRY.steps;i++){const p=getRotundaStep(i);points.push([p.x,p.z]);}
  points.push([TOWER.x+Math.cos(ROTUNDA_ENTRY.angle)*3.4,Math.sin(ROTUNDA_ENTRY.angle)*3.4]);
  const door=COURTYARD.towerDoor.angle;
  points.push([TOWER.x+Math.cos(door)*2.15,Math.sin(door)*2.15]);
  const bottom=getSpiralPose(0);points.push([bottom.x,bottom.z]);
  let previousHeight=groundAt(player.x,player.z);
  for(const [x,z] of points){
    const count=Math.ceil(Math.hypot(x-player.x,z-player.z)/.05);
    const dx=(x-player.x)/count,dz=(z-player.z)/count;
    for(let i=0;i<count;i++){
      advanceLighthousePlayer(player,dx,dz,'ground');
      const height=groundAt(player.x,player.z);
      assert.ok(Math.abs(height-previousHeight)<.18,`Unexpected ledge at ${player.x}, ${player.z}: ${previousHeight} -> ${height}`);
      previousHeight=height;
    }
    assert.ok(Math.hypot(x-player.x,z-player.z)<.01,`Blocked route before ${x}, ${z}`);
  }
  assert.ok(stairEntryAt({...player,y:groundAt(player.x,player.z)},'ground'));
  assert.ok(STAIRS.going>=.3&&STAIRS.rise<.18);
});

test('raised rotunda and courtyard boundaries cannot be entered through their railings',()=>{
  assert.equal(canWalk(COURTYARD.bounds.x1,8,'ground'),false);
  assert.equal(canWalk(0,COURTYARD.bounds.z1+1,'ground'),false);
  assert.equal(canWalk(TOWER.x-4.2,0,'ground'),false);
  assert.equal(canWalk(TOWER.x,0,'ground'),false);
  const step=getRotundaStep(6);
  assert.ok(canWalk(step.x,step.z,'ground'));
  assert.equal(groundAt(step.x,step.z),TOWER.rotundaFloor);
});

test('rear and side courtyard stay at paving height while the front veranda remains raised',()=>{
  for(const x of [-16,-10,-4,4,12,18]){
    for(const z of [-8,-6]){
      assert.ok(canWalk(x,z,'ground'),`Rear courtyard should be walkable at ${x}, ${z}`);
      assert.equal(groundAt(x,z),COURTYARD.floorY,`Unexpected rear-yard ledge at ${x}, ${z}`);
    }
  }
  for(const x of [-16,18]){
    for(const z of [-3,2,7,10]){
      assert.ok(canWalk(x,z,'ground'),`Side courtyard should be walkable at ${x}, ${z}`);
      assert.equal(groundAt(x,z),COURTYARD.floorY,`Unexpected side-yard ledge at ${x}, ${z}`);
    }
  }
  assert.equal(groundAt(4,3.5),TOWER.rotundaFloor);
});

test('stair entry requires being at the correct doorway and floor',()=>{
  const bottom=getSpiralPose(0),top=getSpiralPose(1);
  assert.ok(stairEntryAt(bottom,'ground'));
  assert.ok(stairEntryAt(top,'balcony'));
  assert.equal(stairEntryAt({x:4,y:0,z:8},'ground'),null);
  assert.equal(stairEntryAt(top,'ground'),null);
  assert.equal(stairEntryAt(bottom,'balcony'),null);
  assert.equal(stairEntryAt(bottom,'spiral'),null);
  assert.ok(canWalk(bottom.x,bottom.z,'ground'));
  assert.ok(canWalk(top.x,top.z,'balcony'));
});

test('manual climbing stops immediately and can be reversed at any step',()=>{
  for(const fps of [20,30,60]){
    let progress=.35;
    for(let i=0;i<fps*2;i++)progress=manualStairProgress(progress,0,1/fps);
    assert.equal(progress,.35);
    for(let i=0;i<fps*3;i++)progress=manualStairProgress(progress,1,1/fps);
    assert.ok(Math.abs(progress-.44)<1e-8);
    const stopped=progress;
    for(let i=0;i<fps;i++)progress=manualStairProgress(progress,.08,1/fps,true);
    assert.equal(progress,stopped);
    for(let i=0;i<fps*3;i++)progress=manualStairProgress(progress,-1,1/fps);
    assert.ok(Math.abs(progress-.35)<1e-8);
  }
  assert.equal(manualStairProgress(.9999,1,.05),1);
  assert.equal(manualStairProgress(.0001,-1,.05),0);
});

test('stair endpoints allow immediate manual back-out but never exit without input',()=>{
  for(const progress of [0,1]){
    assert.deepEqual(manualStairStep(progress,0,1/60),{progress,exitLevel:null});
    assert.deepEqual(manualStairStep(progress,.08,1/60),{progress,exitLevel:null});
  }
  // S reverses the entry direction, which is up at ground and down at the balcony.
  assert.deepEqual(manualStairStep(0,-1,1/60),{progress:0,exitLevel:'ground'});
  assert.deepEqual(manualStairStep(1,1,1/60),{progress:1,exitLevel:'balcony'});
  assert.equal(manualStairStep(0,1,1/60).exitLevel,null);
  assert.equal(manualStairStep(1,-1,1/60).exitLevel,null);
  assert.deepEqual(manualStairStep(.0001,-1,1/60),{progress:0,exitLevel:'ground'});
  assert.deepEqual(manualStairStep(.9999,1,1/60),{progress:1,exitLevel:'balcony'});
});

test('holding a reverse stair gesture through an exit preserves its travel direction',()=>{
  for(const progress of [0,1]){
    const pose=getSpiralPose(progress);
    const heading=pose.yawUp+(progress===0?Math.PI:0);
    for(const forward of [-1,1]){
      const player={};
      rebaseMovementHeading(player,heading,forward,0);
      let camera=heading-.2;
      for(let frame=0;frame<60;frame++){
        assert.ok(Math.abs(movementHeading(player,camera,forward,0,false)-heading)<1e-10);
        camera=followHeading(camera,heading,1/60);
      }
      movementHeading(player,camera,0,0,false);
      assert.equal(movementHeading(player,camera,1,0,false),camera);
    }
  }
});

test('camera follows movement without causing a held sideways input to circle',()=>{
  const player={};let camera=Math.PI;
  const initial=movementHeading(player,camera,0,1,false);
  for(let i=0;i<240;i++){
    const heading=movementHeading(player,camera,0,1,false);
    assert.equal(heading,initial);
    camera=followHeading(camera,heading,1/60);
  }
  assert.ok(Math.abs(camera-initial)<.001);
  assert.equal(movementHeading(player,camera,0,0,false),null);
  assert.equal(movementHeading(player,camera,1,0,false),camera);
  assert.equal(followHeading(camera,camera+1,1/60,true),camera);
  assert.ok(followHeading(Math.PI-.05,-Math.PI+.05,.05)>Math.PI-.05,'Take the short rotation across the angle wrap');
});
