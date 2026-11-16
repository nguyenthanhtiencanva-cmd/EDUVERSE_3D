import bpy, os
from mathutils import Vector
out=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'vinh_thuc_lighthouse.blend'))
glasses=[o for o in bpy.data.objects if o.name.startswith('Dark recessed glazing')]
for o in list(bpy.data.objects):
 if o.name.startswith('Door glazing bar'):
  g=min(glasses,key=lambda g:abs(g.location.x-o.location.x)+abs(g.location.y-o.location.y))
  if o.location.z>g.location.z+g.dimensions.z/2+.04: bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
 if o.type=='MESH' and o.name!='Presentation ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'vinh_thuc_lighthouse.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.cycles.use_denoising=True
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'vinh_thuc_lighthouse.blend'))
for name,pos,target,scale in [('overview',(-36,-53,34),(0,-1,8),46),('front',(1,-65,24),(0,0,10),40)]:
 cam=scene.camera;cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
 scene.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)
