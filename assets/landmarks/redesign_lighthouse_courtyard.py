"""Widen the authored terrace and connect the arrival to the tower entrance.

Dimensions are for the interactive reconstruction, not a surveyed site plan.
All positions in the shared JSON use web coordinates (x, height, z).
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = HERE / 'vinh_thuc_rebuilt'
sys.path.insert(0, str(HERE))
from hill_stairs import replace_hill_stairs

CFG = json.loads((ROOT / 'client/src/world/lighthouse/courtyard.json').read_text(encoding='utf-8'))
CX, CZ, ROTUNDA_Y = -10, 0, 1.11


def world(x, y, z):
    return (x, -z, y)


def update_courtyard():
    bounds, entry = CFG['bounds'], CFG['rotundaEntry']
    angle = entry['angle']
    for obj in list(bpy.context.scene.objects):
        x, by, height = obj.location
        z = -by
        radial = (x-CX)*math.cos(angle)+(z-CZ)*math.sin(angle)
        lateral = -(x-CX)*math.sin(angle)+(z-CZ)*math.cos(angle)
        original_floor = obj.name.startswith(('Raised courtyard', 'Terracotta courtyard', 'Paving joint'))
        old_outer_rail = obj.name.startswith(('Rail coping', 'Rail base', 'Baluster')) and height < 1.1 and not obj.get('hill_stairs_generated')
        opening_rail = obj.name.startswith(('Rotunda balustrade', 'Baluster')) and 1.1 < height < 2.3 and radial > 3.5 and abs(lateral) < 1.32
        vegetation = obj.name.startswith(('Coastal tree trunk', 'Broadleaf crown', 'Low hillside scrub')) and bounds['x0']-3 < x < bounds['x1']+3 and bounds['z0']-3 < z < bounds['z1']+3
        if obj.get('courtyard_generated') or original_floor or old_outer_rail or opening_rail or vegetation:
            bpy.data.objects.remove(obj, do_unlink=True)

    collection = bpy.data.collections.get('Courtyard and continuous tower approach')
    if collection is None:
        collection = bpy.data.collections.new('Courtyard and continuous tower approach')
        bpy.context.scene.collection.children.link(collection)

    def material(name, color):
        mat = bpy.data.materials.get(name)
        if mat is None:
            mat = bpy.data.materials.new(name)
            mat.diffuse_color = (*color, 1)
            mat.use_nodes = True
            mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*color, 1)
            mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .82
        return mat

    stone = bpy.data.materials['Basalt plinth']
    trim = bpy.data.materials['Ivory limestone trim']
    tile = bpy.data.materials['Terracotta tiles']
    path_mat = material('Courtyard limestone path', (.63, .57, .42))
    joint_mat = material('Courtyard tile joints', (.22, .10, .055))

    def finish(obj, name, mat):
        obj.name = name
        obj['courtyard_generated'] = 1
        for old in list(obj.users_collection):
            old.objects.unlink(obj)
        collection.objects.link(obj)
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        return obj

    def box(name, position, dimensions, mat, rotation=0):
        width,height,depth=dimensions
        vertices=[(sx*width/2,sy*depth/2,sz*height/2) for sz in (-1,1) for sy in (-1,1) for sx in (-1,1)]
        faces=[(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)]
        data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
        obj=bpy.data.objects.new(name,data);collection.objects.link(obj)
        obj.location=world(*position)
        obj.rotation_euler.z = rotation
        return finish(obj, name, mat)

    def beam(name, a, b, radius, mat):
        start, end = Vector(world(*a)), Vector(world(*b))
        rotation=(end-start).to_track_quat('Z','Y')
        center=(start+end)/2;length=(end-start).length
        vertices=[center+rotation@Vector((radius*math.cos(i*math.tau/8),radius*math.sin(i*math.tau/8),height)) for height in (-length/2,length/2) for i in range(8)]
        faces=[tuple(reversed(range(8))),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
        data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
        obj=bpy.data.objects.new(name,data);collection.objects.link(obj)
        return finish(obj, name, mat)

    def railing(a, b, base=CFG['floorY']):
        distance = math.dist(a, b)
        for i in range(math.ceil(distance/.42)+1):
            t = i/math.ceil(distance/.42)
            x, z = a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t
            for lo, hi, radius in [(0,.15,.085),(.15,.57,.06),(.57,.79,.075)]:
                beam('Courtyard baluster', (x,base+lo,z), (x,base+hi,z), radius, trim)
        beam('Courtyard rail base',(a[0],base+.035,a[1]),(b[0],base+.035,b[1]),.075,trim)
        beam('Courtyard handrail',(a[0],base+.84,a[1]),(b[0],base+.84,b[1]),.085,trim)

    mid_x, mid_z = (bounds['x0']+bounds['x1'])/2, (bounds['z0']+bounds['z1'])/2
    width, depth = bounds['x1']-bounds['x0'], bounds['z1']-bounds['z0']
    box('Courtyard retaining foundation',(mid_x,-2.1,mid_z),(width,4.2,depth),stone)
    box('Courtyard terracotta paving',(mid_x,CFG['floorY']/2,mid_z),(width,CFG['floorY'],depth),tile)
    for x in range(math.ceil(bounds['x0']), math.floor(bounds['x1'])):
        box('Courtyard paving seam',(x,.076,mid_z),(.014,.003,depth),joint_mat)
    for z in range(math.ceil(bounds['z0']), math.floor(bounds['z1'])):
        box('Courtyard paving seam',(mid_x,.076,z),(width,.003,.014),joint_mat)

    # One mitered strip, with shared vertices at the bends and no coplanar overlaps.
    route = [Vector(p) for p in CFG['path']]
    normals = []
    for a, b in zip(route, route[1:]):
        direction = (b-a).normalized()
        normals.append(Vector((-direction.y,direction.x)))
    left, right = [], []
    for i,p in enumerate(route):
        n = normals[0] if i==0 else normals[-1] if i==len(route)-1 else (normals[i-1]+normals[i]).normalized()
        side = n*(CFG['pathWidth']/2/(n.dot(normals[min(i,len(normals)-1)])))
        left.append(p+side); right.append(p-side)
    vertices = [world(p.x,.08,p.y) for pair in zip(left,right) for p in pair]
    faces = [(2*i,2*i+2,2*i+3,2*i+1) for i in range(len(route)-1)]
    data = bpy.data.meshes.new('Continuous approach strip')
    data.from_pydata(vertices,[],faces);data.update()
    obj = bpy.data.objects.new('Continuous limestone approach',data);collection.objects.link(obj)
    finish(obj,obj.name,path_mat)
    solid = obj.modifiers.new('Paving thickness','SOLIDIFY');solid.thickness=.025
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=solid.name)

    # New perimeter leaves only the hill-stair arrival open.
    x0,x1,z0,z1=bounds['x0']+.2,bounds['x1']-.2,bounds['z0']+.2,bounds['z1']-.2
    for a,b in [((x0,z1),(2.55,z1)),((5.45,z1),(x1,z1)),((x0,z0),(x0,z1)),((x1,z0),(x1,z1)),((x0,z0),(x1,z0))]:
        railing(a,b)

    rise=(ROTUNDA_Y-CFG['floorY'])/entry['steps']
    going=(entry['outerRadius']-entry['innerRadius'])/(entry['steps']-1)
    for i in range(entry['steps']):
        radius=entry['outerRadius']-i*going
        top=CFG['floorY']+(i+1)*rise
        obj=box('Rotunda access tread',(CX+math.cos(angle)*radius,(top+CFG['floorY'])/2,math.sin(angle)*radius),(entry['width'],top-CFG['floorY'],entry['depth']),stone,rotation=-angle-math.pi/2)
        obj['entry_tread_index']=i
    for side in [-1,1]:
        ends=[]
        for radius,height in [(entry['outerRadius'],CFG['floorY']+rise),(entry['innerRadius'],ROTUNDA_Y)]:
            x=CX+math.cos(angle)*radius-math.sin(angle)*side*1.32
            z=math.sin(angle)*radius+math.cos(angle)*side*1.32
            beam('Entry rail post',(x,height,z),(x,height+.84,z),.045,trim)
            ends.append((x,height+.84,z))
        beam('Entry handrail',ends[0],ends[1],.06,trim)

    # A real aperture in the solid lower tower, reached through the open arcade.
    door=CFG['towerDoor']; a=door['angle']
    core=bpy.data.objects.get('Tower core')
    if core and not core.get('courtyard_door_cut'):
        cutter=box('Temporary tower door cutter',(CX+math.cos(a)*1.3,ROTUNDA_Y+door['height']/2,math.sin(a)*1.3),(door['width'],door['height']+.04,2),stone,rotation=-a-math.pi/2)
        modifier=core.modifiers.new('Accessible tower door','BOOLEAN');modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=cutter
        bpy.context.view_layer.objects.active=core;bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.data.objects.remove(cutter,do_unlink=True);core['courtyard_door_cut']=1
    for side in [-1,1]:
        x=CX+math.cos(a)*1.68-math.sin(a)*side*(door['width']/2+.06)
        z=math.sin(a)*1.68+math.cos(a)*side*(door['width']/2+.06)
        box('Tower doorway jamb',(x,ROTUNDA_Y+1.2,z),(.09,2.4,.13),trim,rotation=-a-math.pi/2)
    box('Tower doorway lintel',(CX+math.cos(a)*1.68,ROTUNDA_Y+2.44,math.sin(a)*1.68),(1.3,.12,.13),trim,rotation=-a-math.pi/2)

    # Only the tower enclosure fades during the existing explanatory stair view.
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH' or not obj.name.startswith(('Tower core','Tower white tapered rib','Tower belt course','Rotunda cornice','Rotunda parapet','Balcony corbel','Balcony deck','Lantern pedestal')):
            continue
        for slot in obj.material_slots:
            if not slot.material or slot.material.name.startswith('Tower cutaway '):continue
            name='Tower cutaway '+slot.material.name
            mat=bpy.data.materials.get(name)
            if mat is None:mat=slot.material.copy();mat.name=name
            slot.material=mat
    stairs=replace_hill_stairs()
    (OUT/'stair_scale_report.json').write_text(json.dumps(stairs,indent=2),encoding='utf-8')
    return {'courtyardAreaSquareMeters':width*depth,'previousAreaSquareMeters':480,'pathWidthMeters':CFG['pathWidth'],'entrySteps':entry['steps'],'entryRiserMeters':rise,'hillTreads':110,'doorWidthMeters':door['width']}


def run():
    bpy.ops.wm.open_mainfile(filepath=str(OUT/'vinh_thuc_lighthouse_landscape.blend'))
    print('COURTYARD_BUILD_START',flush=True)
    report=update_courtyard() if '--render-only' not in sys.argv else {}
    print('COURTYARD_GEOMETRY_READY',flush=True)
    scene=bpy.context.scene
    if '--render-only' not in sys.argv:
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'vinh_thuc_lighthouse_landscape.blend'))
    if '--render' in sys.argv:
        scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=True
        scene.render.resolution_x=1280;scene.render.resolution_y=900;scene.render.resolution_percentage=100
        cam=scene.camera
        for name,pos,target,ortho in [('courtyard_design',(-42,-60,40),(-1,-2,7),None),('courtyard_entrance',(-3,-13,6.5),(-9,-1.5,2),None),('courtyard_plan',(1,-1.4,2.6),(1,-1.4,-5),45)]:
            if '--overview-only' in sys.argv and name!='courtyard_design':continue
            cam.data.type='ORTHO' if ortho else 'PERSP';cam.data.lens=48
            if ortho:cam.data.ortho_scale=ortho
            cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
            scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    if '--render-only' in sys.argv:return
    bpy.ops.object.select_all(action='DESELECT')
    meshes=[o for o in scene.objects if o.type=='MESH' and o.name!='Sea']
    for obj in meshes:obj.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join()
    bpy.ops.export_scene.gltf(filepath=str(OUT/'vinh_thuc_lighthouse_landscape.glb'),export_format='GLB',use_selection=True)
    (OUT/'courtyard_design_report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('COURTYARD_UPDATED '+json.dumps(report),flush=True)


if __name__=='__main__':run()
