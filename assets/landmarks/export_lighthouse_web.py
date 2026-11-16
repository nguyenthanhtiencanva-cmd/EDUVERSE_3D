from pathlib import Path

import bpy
import bmesh

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/landmarks/vinh_thuc_rebuilt/vinh_thuc_lighthouse_landscape.glb'
DESTINATION = ROOT / 'client/src/assets/models/lighthouse_landscape.glb'

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))

# Simplify the trees separately so the stairs and architectural geometry stay exact.
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH' or len(obj.data.materials) <= 1:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='MATERIAL')
    bpy.ops.object.mode_set(mode='OBJECT')

for obj in bpy.context.scene.objects:
    if obj.type != 'MESH' or not obj.active_material:
        continue
    material = obj.active_material.name
    if material.startswith('Coastal foliage'):
        ratio = 0.32
    elif material.startswith('Tree bark'):
        ratio = 0.55
    else:
        continue
    bpy.context.view_layer.objects.active = obj
    # glTF splits vertices at normal seams. Weld before simplifying so the
    # decimator works on closed crowns instead of collapsing each patch alone.
    if obj.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=0.00001)
    bmesh.ops.recalc_face_normals(mesh, faces=list(mesh.faces))
    for face in mesh.faces:
        face.smooth = True
    mesh.to_mesh(obj.data)
    mesh.free()
    modifier = obj.modifiers.new('Web vegetation budget', 'DECIMATE')
    modifier.ratio = ratio
    bpy.ops.object.modifier_apply(modifier=modifier.name)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()

bpy.ops.export_scene.gltf(
    filepath=str(DESTINATION),
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
