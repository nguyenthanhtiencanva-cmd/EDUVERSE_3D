import bpy, math, random, os, json, sys
from mathutils import Vector
from mathutils.noise import noise_vector
sys.path.insert(0, os.path.dirname(__file__))
from redesign_lighthouse_courtyard import update_courtyard
random.seed(1611)
OUT=os.path.join(os.path.dirname(__file__),'vinh_thuc_rebuilt')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'vinh_thuc_lighthouse.blend'))
for o in list(bpy.data.objects):
 if o.name=='Presentation ground':bpy.data.objects.remove(o,do_unlink=True)
land=bpy.data.collections.new('Video reference — hill and vegetation');bpy.context.scene.collection.children.link(land)
def mat(n,c,rough=.85):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;return m
grass=mat('Hill grass olive',(.22,.28,.065));rock=mat('Exposed pink brown rock',(.27,.16,.12));road=mat('Weathered access road',(.39,.38,.32));trunk=mat('Tree bark',(.13,.075,.025));sea=mat('Coastal blue sea',(.035,.27,.34),.22)
leaf=[mat('Coastal foliage %02d'%i,c) for i,c in enumerate([(.065,.15,.035),(.11,.21,.045),(.16,.24,.045),(.21,.29,.065),(.07,.19,.075),(.25,.31,.075)])]
def textured(m,scale,strength):
 nt=m.node_tree;p=nt.nodes.get('Principled BSDF');n=nt.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=scale;n.inputs['Detail'].default_value=3
 bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=strength;bump.inputs['Distance'].default_value=.18;nt.links.new(n.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],p.inputs['Normal'])
textured(grass,3,.6);textured(rock,2,.8);textured(sea,1.7,.22)
def mesh(n,vs,fs,m):
 d=bpy.data.meshes.new(n);d.from_pydata(vs,[],fs);d.materials.append(m);d.update();o=bpy.data.objects.new(n,d);land.objects.link(o);return o
def h(x,y):
 # Raised flat summit blends into a long approach ridge and coastal slopes.
 dx=max(abs(x-1)-16,0);dy=max(abs(y)-7.5,0)
 z=-.55-math.sqrt((dx*.62)**2+(dy*.47)**2)
 z+=min(1,(dx+dy)/12)*(math.sin(x*.12)*math.cos(y*.09)*1.3+math.sin(y*.2+x*.1)*.6)
 return max(-34,z)
N=150;vs=[]
for j in range(N+1):
 y=-105+j*180/N
 for i in range(N+1):
  x=-100+i*200/N;vs.append((x,y,h(x,y)))
fs=[]
for j in range(N):
 for i in range(N):a=j*(N+1)+i;fs.append((a,a+1,a+N+2,a+N+1))
o=mesh('Continuous hill terrain',vs,fs,grass);o.data.materials.append(rock)
for poly in o.data.polygons:
 poly.use_smooth=True;x,y,z=poly.center
 # centers computed after mesh update
 if (17<x<53 and -48<y<-20) or z<-28:poly.material_index=1
# Extend the flight by adding human-scale treads, not by enlarging each tread.
# Road on the right side of the hill, running across the approach landing.
pts=[]
for i in range(85):
 t=i/84;x=-14+90*t;y=-49+10*math.sin(t*math.pi*1.4);pts.append((x,y))
vs=[]
for x,y in pts:
 for d in [-2.0,2.0]:vs.append((x,y+d,h(x,y+d)+.09))
mesh('Curving hillside access road',vs,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(pts)-1)],road)
# Reusable tree canopy geometry: rounded but irregular coastal crowns.
protos=[]
for k in range(6):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1);o=bpy.context.object
 for v in o.data.vertices:v.co*=1+random.uniform(-.16,.16)
 for p in o.data.polygons:p.use_smooth=True
 o.data.materials.append(leaf[k]);protos.append(o.data);bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=.13,radius2=.05,depth=1);o=bpy.context.object;o.data.materials.append(trunk);stem=o.data;bpy.data.objects.remove(o,do_unlink=True)
def instance(n,d,p,s):
 o=bpy.data.objects.new(n,d);land.objects.link(o);o.location=p;o.scale=s;o.rotation_euler.z=random.uniform(0,6.28);return o
count=0
for i in range(2600):
 x=random.uniform(-82,82);y=random.uniform(-90,60);z=h(x,y)
 if z<-30:continue
 if -17<x<19 and -9<y<9:continue
 if -7<x<15 and -46<y<-7:continue # grassy view corridor beside stair
 if any(abs(x-rx)<3 and abs(y-ry)<3.3 for rx,ry in pts):continue
 if 17<x<53 and -45<y<-23:continue # visible bare road cutting
 size=random.uniform(1.1,2.5);height=random.uniform(1.3,3.3)
 instance('Coastal tree trunk',stem,(x,y,z+height/2),(1,1,height))
 for k in range(3):
  a=k*2.094;instance('Broadleaf crown',protos[random.randrange(6)],(x+.55*size*math.cos(a),y+.55*size*math.sin(a),z+height+.3*random.random()),(size,size*.85,size*.75))
 count+=1
# Lower scrub in the open grass strip; leave stair clear.
for i in range(180):
 x=random.uniform(-6,14);y=random.uniform(-44,-10)
 if 1.7<x<6.3:continue
 s=random.uniform(.2,.55);instance('Low hillside scrub',protos[random.randrange(6)],(x,y,h(x,y)+s*.4),(s,s,s*.6))
# Rock shelf on the shore, with a small offshore rocky outcrop visible in the video.
for i in range(110):
 a=random.uniform(0,6.28);r=random.uniform(66,79);x=math.cos(a)*r;y=math.sin(a)*r
 z=h(x,y)
 if z>-24:continue
 d=protos[0].copy();d.materials.clear();d.materials.append(rock);s=random.uniform(.6,2.0);instance('Coastal rock',d,(x,y,z),(s,s,s*.7))
for i in range(12):
 d=protos[0].copy();d.materials.clear();d.materials.append(rock);s=random.uniform(1.2,3.2);instance('Offshore outcrop',d,(-56+random.uniform(-5,5),48+random.uniform(-3,3),-29),(s,s,s*1.5))
mesh('Sea',[(-1400,-1400,-31),(1400,-1400,-31),(1400,1400,-31),(-1400,1400,-31)],[(0,1,2,3)],sea)
update_courtyard()
scene=bpy.context.scene;scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1600;scene.render.resolution_y=1100
# Soft daylight and blue environment.
scene.world.use_nodes=True;nt=scene.world.node_tree;nt.nodes.get('Background').inputs['Color'].default_value=(.55,.7,.9,1);nt.nodes.get('Background').inputs['Strength'].default_value=.45
cam=scene.camera;cam.data.type='PERSP';cam.data.lens=48
def camera(pos,target):cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
camera((-65,-115,65),(0,-7,1))
scene.render.filepath=os.path.join(OUT,'landscape_overview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'vinh_thuc_lighthouse_landscape.blend'))
print('LANDSCAPE_READY',count,'trees',flush=True)
bpy.ops.render.render(write_still=True)
camera((65,-95,45),(0,-4,3));scene.render.filepath=os.path.join(OUT,'landscape_side.png');bpy.ops.render.render(write_still=True)
# Export as one mesh with material groups to avoid thousands of GLB nodes.
bpy.ops.object.select_all(action='DESELECT')
objs=[o for o in scene.objects if o.type=='MESH' and o.name!='Sea']
for o in objs:o.select_set(True)
bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join()
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'vinh_thuc_lighthouse_landscape.glb'),export_format='GLB',use_selection=True)
with open(os.path.join(OUT,'landscape_notes.json'),'w',encoding='utf8') as f:json.dump({'reference':'User supplied video, sampled frames 00, 05, 06, 07 show lighthouse hill','trees':count,'scope':'Hill, coastal vegetation, clear stair corridor, road cutting, sea and coastal rocks','accuracy':'Visual reconstruction from video; terrain elevations, distances and individual tree locations estimated','export':'GLB excludes sea and lights; Blender retains editable objects'},f,ensure_ascii=False,indent=2)
