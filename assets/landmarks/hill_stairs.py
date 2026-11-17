"""Shared Blender geometry for the hill flight. Dimensions also drive web collision."""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

CONFIG_PATH = Path(__file__).resolve().parents[2] / 'client/src/world/lighthouse/hill-stairs.json'
CONFIG = json.loads(CONFIG_PATH.read_text(encoding='utf-8'))


def replace_hill_stairs():
    c = CONFIG
    # Remove only this flight and its own railings, preserving the yard/architecture.
    for obj in list(bpy.context.scene.objects):
        legacy_post = (obj.name.startswith('Baluster') and obj.location.y < -7.45
                       and 2.4 < obj.location.x < 5.6)
        if obj.get('hill_stairs_generated') or obj.name.startswith(('Hill stair', 'Stair handrail')) or legacy_post:
            bpy.data.objects.remove(obj, do_unlink=True)
    collection = bpy.data.collections.get('Hill stairs — human scale')
    if collection is None:
        collection = bpy.data.collections.new('Hill stairs — human scale')
        bpy.context.scene.collection.children.link(collection)
    stone = bpy.data.materials.get('Basalt plinth')
    trim = bpy.data.materials.get('Ivory limestone trim')
    if stone is None:
        stone = bpy.data.materials.new('Basalt plinth'); stone.diffuse_color = (.075, .10, .11, 1)
    if trim is None:
        trim = bpy.data.materials.new('Ivory limestone trim'); trim.diffuse_color = (.9, .88, .79, 1)

    def mesh(name, vertices, faces, material):
        data = bpy.data.meshes.new(name)
        data.from_pydata(vertices, [], faces); data.materials.append(material); data.update()
        obj = bpy.data.objects.new(name, data); collection.objects.link(obj)
        obj['hill_stairs_generated'] = c['version']
        return obj

    def box(name, x, y, top, width, depth, height):
        vertices = [(x+dx*width/2, y+dy*depth/2, top-dz*height)
                    for dz in (0, 1) for dy in (-1, 1) for dx in (-1, 1)]
        return mesh(name, vertices, [(0,1,3,2),(4,6,7,5),(0,4,5,1),
                                    (2,3,7,6),(0,2,6,4),(1,5,7,3)], stone)

    def cone(name, center, height, radius1, radius2, rotation=None):
        center = Vector(center); vertices = []
        for z, radius in [(-height/2, radius1), (height/2, radius2)]:
            for i in range(8):
                p = Vector((radius*math.cos(i*math.tau/8), radius*math.sin(i*math.tau/8), z))
                vertices.append(center + (rotation @ p if rotation else p))
        faces = [tuple(reversed(range(8))), tuple(range(8,16))]
        faces += [(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
        return mesh(name, vertices, faces, trim)

    rise = (c['topY']-c['bottomY'])/(c['treads']-1)
    going = (c['bottomZ']-c['topZ'])/(c['treads']-1)
    steps = []
    for i in range(c['treads']):
        z = c['topZ']+i*going; y = c['topY']-i*rise
        obj = box(f'Hill stair {i:03d}', c['centerX'], -z, y, c['width'], going+c['overlap'], c['thickness'])
        obj['tread_index'] = i; steps.append(obj)
        if i % 3 == 0 or i == c['treads']-1:
            for side in (-1,1):
                x = c['centerX'] + side*c['railOffset']
                for suffix, dz, height, r1, r2 in [('foot',.08,.16,.10,.10),('lower',.27,.24,.075,.12),
                                                   ('upper',.49,.20,.12,.055),('neck',.66,.17,.055,.055)]:
                    cone(f'Hill baluster {i:03d} {side} {suffix}', (x,-z,y+dz), height, r1, r2)
    for side in (-1,1):
        x = c['centerX']+side*c['railOffset']
        a = Vector((x,-c['topZ'],c['topY']+c['railHeight']))
        b = Vector((x,-c['bottomZ'],c['bottomY']+c['railHeight']))
        cone(f'Hill handrail {side}', (a+b)/2, (b-a).length, .085, .085, (b-a).to_track_quat('Z','Y'))
    return {'treads':len(steps),'rise':rise,'going':going,'width':c['width'],'railHeight':c['railHeight']}
