"""Apply the human-scale flight to the existing authored landscape; preserve terrain."""
import json
import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from hill_stairs import replace_hill_stairs

out = HERE / 'vinh_thuc_rebuilt'
bpy.ops.wm.open_mainfile(filepath=str(out / 'vinh_thuc_lighthouse_landscape.blend'))
report = replace_hill_stairs()
bpy.ops.wm.save_as_mainfile(filepath=str(out / 'vinh_thuc_lighthouse_landscape.blend'))
bpy.ops.object.select_all(action='DESELECT')
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'Sea']
for obj in meshes: obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()
bpy.ops.export_scene.gltf(filepath=str(out / 'vinh_thuc_lighthouse_landscape.glb'), export_format='GLB', use_selection=True)
(out / 'stair_scale_report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('STAIRS_UPDATED '+json.dumps(report), flush=True)
