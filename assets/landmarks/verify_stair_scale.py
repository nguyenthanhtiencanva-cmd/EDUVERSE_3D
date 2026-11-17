"""Audit exported tread heights and render a scale reference beside the existing avatar."""
import json
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/landmarks/vinh_thuc_rebuilt'
cfg=json.loads((ROOT/'client/src/world/lighthouse/hill-stairs.json').read_text(encoding='utf-8'))
going=(cfg['bottomZ']-cfg['topZ'])/(cfg['treads']-1)
rise=(cfg['topY']-cfg['bottomY'])/(cfg['treads']-1)

# Audit the actual compressed asset, not only its authoring parameters.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'client/src/assets/models/lighthouse_landscape.glb'))
bpy.context.view_layer.update()
depsgraph=bpy.context.evaluated_depsgraph_get()
max_error=0
for i in range(cfg['treads']):
    z=cfg['topZ']+i*going; y=cfg['topY']-i*rise
    for x in [cfg['centerX']-.8,cfg['centerX'],cfg['centerX']+.8]:
        hit,point,*_=bpy.context.scene.ray_cast(depsgraph,Vector((x,-z,y+.4)),Vector((0,0,-1)),distance=1)
        assert hit, f'Missing tread {i} at x={x}'
        error=abs(point.z-y); max_error=max(max_error,error)
        assert error<.012, f'Tread {i}: exported top differs by {error:.4f} m'
report={'sampledTreads':cfg['treads'],'raySamples':cfg['treads']*3,'maxExportHeightErrorMeters':max_error,
        'riserMeters':rise,'goingMeters':going,'avatarRestHeightMeters':1.72,'imagePurpose':'Blender scale reference, not a gameplay screenshot'}
(OUT/'stair_scale_verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('EXPORTED_STAIRS_VERIFIED '+json.dumps(report),flush=True)

# Use the authored scene and the existing avatar, at their real scale.
bpy.ops.wm.open_mainfile(filepath=str(OUT/'vinh_thuc_lighthouse_landscape.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/web-models/tourist_salomon_glasses.glb'))
added=set(bpy.context.scene.objects)-before
arm=next(o for o in added if o.type=='ARMATURE')
if arm.animation_data:
    for track in arm.animation_data.nla_tracks: track.mute=True
    arm.animation_data.action=None
arm.data.pose_position='REST'
bpy.context.scene.frame_set(0)
anchor=bpy.data.objects.new('Avatar scale reference 1.72m',None);bpy.context.scene.collection.objects.link(anchor)
for obj in added:
    if obj.parent is None: obj.parent=anchor
i=55
z=cfg['topZ']+i*going; y=cfg['topY']-i*rise
anchor.location=(cfg['centerX'],-z,y+.004);anchor.rotation_euler.z=3.141592653589793
bpy.context.view_layer.update()
# Centre the actual shoe soles on one tread in this static scale reference.
shoe_points=[]
for obj in added:
    if obj.type=='MESH' and obj.name!='Icosphere':
        for v in obj.data.vertices:
            p=obj.matrix_world@v.co
            if p.z<y+.06: shoe_points.append(p)
if shoe_points:
    anchor.location.y += -z-(min(p.y for p in shoe_points)+max(p.y for p in shoe_points))/2
scene=bpy.context.scene
camera=scene.camera
camera.data.type='PERSP';camera.data.lens=50
target=Vector((4,-z,y+.8));camera.location=target+Vector((.65,4.6,2.4))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
scene.render.resolution_x=1100;scene.render.resolution_y=850;scene.render.resolution_percentage=100
scene.render.filepath=str(OUT/'stairs_human_scale.png')
bpy.ops.render.render(write_still=True)
print('SCALE_REFERENCE_RENDERED '+scene.render.filepath,flush=True)
