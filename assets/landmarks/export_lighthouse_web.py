import bpy, os
root=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(root,'assets/landmarks/vinh_thuc_rebuilt/vinh_thuc_lighthouse_landscape.glb'))
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'client/src/assets/models/lighthouse_landscape.glb'),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
