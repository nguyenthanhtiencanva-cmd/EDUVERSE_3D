"""Compare the compressed web mesh against floor heights exported by runtime JS."""
import json
from pathlib import Path
import bpy
from mathutils import Vector
import math

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/landmarks/vinh_thuc_rebuilt'
data=json.loads((OUT/'courtyard_runtime_probes.json').read_text(encoding='utf-8'))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'client/src/assets/models/lighthouse_landscape.glb'))
bpy.context.view_layer.update()
graph=bpy.context.evaluated_depsgraph_get()
errors=[];maximum=0
for p in data['probes']:
    hit,point,*_=bpy.context.scene.ray_cast(graph,Vector((p['x'],-p['z'],p['y']+.4)),Vector((0,0,-1)),distance=.8)
    error=abs(point.z-p['y']) if hit else 999
    maximum=max(maximum,error)
    if error>p['tolerance']:errors.append({**p,'actualY':point.z if hit else None,'error':error})

# Verify torso-height passages through the balustrade and the new Boolean door.
clearance_checks=0
for radius,angle,depth in [(4.7,data['entry']['angle'],1.0),(2.2,data['door']['angle'],.8)]:
    for side in [-.25,0,.25]:
        for height in [.4,.9,1.65]:
            x=-10+math.cos(angle)*radius-math.sin(angle)*side
            z=math.sin(angle)*radius+math.cos(angle)*side
            hit,*_=bpy.context.scene.ray_cast(graph,Vector((x,-z,1.11+height)),Vector((-math.cos(angle),math.sin(angle),0)),distance=depth)
            clearance_checks+=1
            if hit:errors.append({'blockedPassage':radius,'side':side,'height':height})
report={'floorSamples':len(data['probes']),'passageSamples':clearance_checks,'maxFloorErrorMeters':maximum,'failures':errors}
(OUT/'courtyard_geometry_verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('COURTYARD_AUDIT '+json.dumps({**report,'failures':errors[:8]}),flush=True)
assert not errors, f'{len(errors)} courtyard geometry checks failed'
