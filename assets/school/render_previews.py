import bpy
import math

blend_path = "d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/school_campus_blockout.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'

cameras = [
    ("Cam_Aerial_Overview", "d:/ANTIGRAVITY/EDUVERSE_3D/docs/preview_aerial_overview.png"),
    ("Cam_Ground_Ceremony", "d:/ANTIGRAVITY/EDUVERSE_3D/docs/preview_ground_ceremony.png"),
    ("Cam_Stage_Front", "d:/ANTIGRAVITY/EDUVERSE_3D/docs/preview_stage_front.png"),
    ("Cam_Photo1_BldC2", "d:/ANTIGRAVITY/EDUVERSE_3D/docs/preview_photo1_bld_c2.png"),
    ("Cam_Photo2_StageClose", "d:/ANTIGRAVITY/EDUVERSE_3D/docs/preview_photo2_stage.png"),
    ("Cam_Photo3_PlaygroundGym", "d:/ANTIGRAVITY/EDUVERSE_3D/docs/preview_photo3_playground_gym.png"),
]

for cam_name, output_path in cameras:
    cam_obj = bpy.data.objects.get(cam_name)
    if cam_obj:
        scene.camera = cam_obj
        scene.render.filepath = output_path
        bpy.ops.render.render(write_still=True)
        print(f"[OK] Rendered {cam_name} -> {output_path}")

# 4. Top-Down Orthographic Campus Plan
cam_td = bpy.data.cameras.new("Cam_TopDown")
cam_td.type = 'ORTHO'
cam_td.ortho_scale = 115.0
cam_td_obj = bpy.data.objects.new("Cam_TopDown", cam_td)
scene.collection.objects.link(cam_td_obj)
cam_td_obj.location = (2.0, -3.0, 90.0)
cam_td_obj.rotation_euler = (0.0, 0.0, 0.0)
scene.camera = cam_td_obj
scene.render.filepath = "d:/ANTIGRAVITY/EDUVERSE_3D/docs/preview_topdown.png"
bpy.ops.render.render(write_still=True)
print("[OK] Rendered Cam_TopDown -> docs/preview_topdown.png")

# 5. Google Maps 1:1 Overlay Verification Render (same orientation as Google Maps screenshot)
sat_obj = bpy.data.objects.get("REF_GoogleMaps_Satellite_1to1")
if sat_obj:
    sat_obj.hide_render = False
    sat_obj.location.z = 0.04  # Slightly above flat ground slabs so satellite ground shows around 3D buildings!
    for hide_name in ["ENV_Courtyard_Ground", "ENV_OuterGround_Base", "ENV_West_SideLane", "BLD_D_SecondaryYard"]:
        o = bpy.data.objects.get(hide_name)
        if o:
            o.hide_render = True
    scene.render.resolution_x = 1444
    scene.render.resolution_y = 1644
    cam_td.ortho_scale = 94.0
    cam_td_obj.location = (-5.37, -4.08, 90.0)
    cam_td_obj.rotation_euler = (0.0, 0.0, math.radians(25.33))
    scene.render.filepath = "d:/ANTIGRAVITY/EDUVERSE_3D/docs/preview_google_maps_overlay.png"
    bpy.ops.render.render(write_still=True)
    print("[OK] Rendered Google Maps 1:1 Overlay -> docs/preview_google_maps_overlay.png")
