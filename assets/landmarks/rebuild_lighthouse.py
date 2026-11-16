"""Photo-based architectural reconstruction. Dimensions are estimates, not survey data.
Run with Blender 4.2 --background --python this_file.py.
"""
import bpy, math, os, json
from mathutils import Vector
from math import sin, cos, pi
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vinh_thuc_rebuilt')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.65,metal=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
 return m
cream=mat('Warm ochre plaster',(.78,.59,.32)); white=mat('Ivory limestone trim',(.9,.88,.79)); red=mat('Terracotta tiles',(.40,.075,.035)); stone=mat('Basalt plinth',(.075,.10,.11)); dark=mat('Window dark blue glass',(.055,.13,.17),.2,.3); roof=mat('Roof terrace',(.19,.20,.19)); brass=mat('Frieze ochre',(.64,.34,.10)); metal=mat('Lantern metal',(.23,.24,.22),.3,.65); ground=mat('Landscape green',(.16,.23,.11)); flagmat=mat('Flag red',(.7,.012,.025)); gold=mat('Flag star',(.95,.67,.03))
def finish(o,n,m):
 o.name=n; o.data.materials.append(m); return o
def box(n,p,s,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p); o=bpy.context.object; o.dimensions=s; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); return finish(o,n,m)
def cyl(n,p,r,h,m,r2=None,v=48):
 bpy.ops.mesh.primitive_cone_add(vertices=v,radius1=r,radius2=r if r2 is None else r2,depth=h,location=p); return finish(bpy.context.object,n,m)
def mesh(n,vs,fs,m):
 d=bpy.data.meshes.new(n); d.from_pydata(vs,[],fs); d.update(); o=bpy.data.objects.new(n,d); bpy.context.collection.objects.link(o); return finish(o,n,m)
def beam(n,a,b,r,m):
 o=cyl(n,(Vector(a)+Vector(b))/2,r,(Vector(b)-Vector(a)).length,m,v=12); o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler(); return o
def ring(n,c,r,z,thick,m):
 pts=[(c[0]+r*cos(i*2*pi/96),c[1]+r*sin(i*2*pi/96),z) for i in range(97)]
 for a,b in zip(pts,pts[1:]): beam(n,a,b,thick,m)
def arch(n,c,width,spring,depth,m,angle=0):
 # Open arch, no solid panel across the opening.
 r=width/2; t=.17; vs=[]
 for y in [-depth/2,depth/2]:
  for rr in [r,r+t]:
   for i in range(25):
    a=i*pi/24; x=rr*cos(a); z=spring+rr*sin(a)
    vs.append((c[0]+x*cos(angle)-y*sin(angle),c[1]+x*sin(angle)+y*cos(angle),c[2]+z))
 fs=[]
 for i in range(24):
  fs.extend([(i,i+1,26+i,25+i),(50+i,75+i,76+i,51+i),(i,50+i,51+i,i+1),(25+i,26+i,76+i,75+i)])
 return mesh(n,vs,fs,m)
def baluster(x,y,z):
 cyl('Baluster foot',(x,y,z+.08),.10,.16,white,v=8)
 cyl('Baluster lower',(x,y,z+.27),.075,.24,white,r2=.12,v=8)
 cyl('Baluster upper',(x,y,z+.49),.12,.20,white,r2=.055,v=8)
 cyl('Baluster neck',(x,y,z+.66),.055,.17,white,v=8)
def rail(a,b,z):
 l=(Vector(b)-Vector(a)).length; count=max(2,int(l/.31))
 for i in range(count+1):
  t=i/count; baluster(a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,z)
 beam('Rail coping',(*a,z+.84),(*b,z+.84),.095,white)
 beam('Rail base',(*a,z),(*b,z),.10,white)
def window(x,y,z,w=1.25,h=2.45):
 box('Dark recessed glazing',(x,y,z+h/2),(w,.10,h),dark)
 for xx in [-w/2,0,w/2]: box('Door stile',(x+xx,y-.09,z+h/2),(.075,.13,h+.12),white)
 for zz in [h*i/5 for i in range(6)]: box('Door glazing bar',(x,y-.09,z+zz),(w+.12,.13,.065),white)
 arch('Window arched crown',(x,y-.08,z+h),w,0,.18,white)
 # semicircle glazing behind arch
 vs=[(x,y,z+h)]+[(x+w/2*cos(i*pi/24),y,z+h+w/2*sin(i*pi/24)) for i in range(25)]
 mesh('Fanlight',vs,[(0,i,i+1) for i in range(1,25)],dark)
def text(n,body,p,size,m):
 d=bpy.data.curves.new(n,'FONT');d.body=body;d.size=size;d.align_x='CENTER';d.extrude=.008
 font='C:/Windows/Fonts/arialbd.ttf'
 if os.path.exists(font): d.font=bpy.data.fonts.load(font)
 o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);o.location=p;o.rotation_euler=(pi/2,0,0);o.data.materials.append(m)
 return o
# Front of the compound faces -Y. Units are approximate metres.
box('Raised courtyard',(1,-.4,-.30),(32,15,.6),stone)
box('Terracotta courtyard',(1,-.4,.035),(32,15,.07),red)
# Subtle courtyard paving joints
for x in range(-14,17): box('Paving joint',(x,-.4,.074),(.018,15,.008),brass)
for y in range(-7,7): box('Paving joint',(1,y,.075),(32,.018,.008),brass)
# Main house, front veranda
box('House stone foundation',(4,1,.48),(20,8, .9),stone)
box('Main ochre house',(4,1,3.08),(20,7,4.3),cream)
box('Veranda floor',(4,-3.1,1.0),(20,2.0,.22),white)
for x in [-5.7,-1.5,2.4,6.1,10.0,13.7]:
 box('Facade pilaster',(x,-2.58,3.2),(.38,.25,4.5),white)
 box('Pilaster capital',(x,-2.63,5.22),(.62,.45,.25),white)
for x in [-4,-.1,4.1,8.1,12]: window(x,-2.57,1.25)
for z,w,h,m in [(1.12,20.5,.17,white),(5.35,20.6,.25,white),(5.64,20.1,.27,brass),(5.88,21,.25,white)]:box('House cornice',(4,1,z),(w,8,h),m)
# three veranda arches and square piers
for x in [-1.5,2.4,6.1,10.0]:
 box('Veranda pier',(x,-3.88,2.85),(.38,.40,3.5),white)
 box('Pier cap',(x,-3.88,4.6),(.58,.58,.18),white)
for x in [.45,8.05]: arch('Veranda arch',(x,-3.88,1.1),3.5,2.0,.38,white)
box('Central sign lintel',(4.25,-3.88,4.85),(3.8,.4,.7),cream)
text('Station sign','HẢI ĐĂNG VĨNH THỰC',(4.25,-4.1,4.68),.29,red)
for a,b in [((-5.7,-3.9),(-1.5,-3.9)),((-1.5,-3.9),(2.4,-3.9)),((6.1,-3.9),(10,-3.9)),((10,-3.9),(13.7,-3.9))]:rail(a,b,1.12)
for i in range(7):box('Entrance stair',(4.25,-5.55+i*.24,(i+1)*.075),(3.4,.26,(i+1)*.15),stone)
# Mansard hip roof with flat upper terrace
lo=[(-6.5,-3.2,6),(14.5,-3.2,6),(14.5,5.2,6),(-6.5,5.2,6)]
hi=[(-5.2,-1.8,8),(13.2,-1.8,8),(13.2,3.8,8),(-5.2,3.8,8)]
mesh('Red mansard roof',lo+hi,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],red)
box('Flat roof terrace',(4,1,8),(18.4,5.6,.13),roof)
for i in range(4):
 beam('White hip seam',lo[i],hi[i],.10,white);beam('Roof upper trim',hi[i],hi[(i+1)%4],.10,white)
# tile courses along visible long slopes
for i in range(1,16):
 t=i/16; z=6+2*t; left=-6.5+1.3*t;right=14.5-1.3*t
 for y in [-3.2+1.4*t,5.2-1.4*t]:beam('Roof tile course',(left,y,z),(right,y,z),.018,brass)
for x in [-1,4,9]:
 box('Dormer cheek',(x,-2.25,7.0),(1,.48,.65),white);window(x,-2.52,6.77,.66,.55)
# Rotunda and tapering lighthouse, attached to left wing
cx,cy=-10,0
cyl('Rotunda basalt base',(cx,cy,.48),4.3,.95,stone)
cyl('Rotunda floor',(cx,cy,1.02),4.45,.18,white)
cyl('Tower core',(cx,cy,10.15),1.65,18.2,cream,r2=1.12,v=64)
for i in range(8):
 a=2*pi*i/8; x=cx+4*cos(a);y=cy+4*sin(a)
 o=box('Rotunda white pier',(x,y,3.18),(.45,.48,4.2),white);o.rotation_euler.z=a
 box('Rotunda capital',(x,y,5.2),(.68,.68,.24),white)
 mid=a+pi/8; rr=4*cos(pi/8)
 arch('Rotunda open arcade',(cx+rr*cos(mid),cy+rr*sin(mid),1.1),2.65,2.5,.35,white,mid+pi/2)
 for j in range(1,9):
  aa=a+j*pi/40;baluster(cx+4.08*cos(aa),cy+4.08*sin(aa),1.15)
ring('Rotunda balustrade',(cx,cy),4.08,2,.10,white)
for z,r,h,m in [(5.35,4.35,.25,white),(5.60,4.25,.28,brass),(5.86,4.5,.22,white),(6.04,4.36,.14,roof)]:cyl('Rotunda cornice',(cx,cy,z),r,h,m)
ring('Rotunda parapet',(cx,cy),4.36,6.25,.09,white)
# Four vertical structural ribs and horizontal decorative bands
for i in range(4):
 a=pi/4+i*pi/2
 vs=[]
 for z,r in [(6.08,1.57),(18.7,1.18)]:
  for tang,rad in [(-.17,-.07),(.17,-.07),(.17,.17),(-.17,.17)]:vs.append((cx+(r+rad)*cos(a)-tang*sin(a),cy+(r+rad)*sin(a)+tang*cos(a),z))
 mesh('Tower white tapered rib',vs,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],white)
for z,r in [(6.3,1.58),(10,1.46),(14.4,1.32),(18.55,1.21)]:cyl('Tower belt course',(cx,cy,z),r,.20,white)
window(cx,cy-1.62,6.25,.62,1.5)
for z in [10.8,15.0]:window(cx,cy-1.36,z,.32,.70)
cyl('Balcony corbel',(cx,cy,18.95),1.3,.5,white,r2=2.05)
cyl('Balcony deck',(cx,cy,19.25),2.08,.20,white)
for i in range(48):a=i*2*pi/48;baluster(cx+1.96*cos(a),cy+1.96*sin(a),19.36)
ring('Balcony handrail',(cx,cy),1.96,20.18,.08,white)
cyl('Lantern pedestal',(cx,cy,19.9),1.04,1.1,white)
cyl('Lantern glazing',(cx,cy,21.1),.96,1.45,dark,v=12)
for i in range(8):
 a=i*2*pi/8;beam('Lantern mullion',(cx+cos(a),cy+sin(a),20.36),(cx+cos(a),cy+sin(a),21.9),.045,metal)
cyl('Lantern roof rim',(cx,cy,21.92),1.18,.14,metal)
cyl('Lantern cap',(cx,cy,22.32),1.18,.7,metal,r2=.18,v=32)
beam('Lightning conductor',(cx,cy,22.6),(cx,cy,24.0),.025,metal)
# Yard balustrades and long descending stair
rail((-14.8,-7.4),(2.5,-7.4),.1);rail((5.5,-7.4),(16.5,-7.4),.1)
rail((16.5,-7.4),(16.5,6.7),.1);rail((-14.8,-7.4),(-14.8,6.7),.1)
for i in range(40):
 y=-7.5-i*.34;z=-i*.16
 box('Hill stair',(4,y,z-.10),(2.6,.36,.20),stone)
 for x in [2.55,5.45]:
  if i%2==0:baluster(x,y,z)
for x in [2.55,5.45]:beam('Stair handrail',(x,-7.5,.84),(x,-20.76,-5.40),.085,white)
beam('Flagpole',(6.7,-5.8,.1),(6.7,-5.8,7),.035,metal)
mesh('Vietnam flag',[(6.7,-5.8,6.8),(8.2,-5.7,6.65),(8.2,-5.7,5.7),(6.7,-5.8,5.85)],[(0,1,2,3)],flagmat)
vs=[(7.45,-5.82,6.23)]+[(7.45+(.26 if i%2==0 else .11)*sin(i*pi/5),-5.83,6.23+(.26 if i%2==0 else .11)*cos(i*pi/5)) for i in range(10)]
mesh('Five pointed gold star',vs,[(0,i+1,(i+1)%10+1) for i in range(10)],gold)
# Save architectural model separately from presentation ground and lights.
for o in list(bpy.context.scene.objects):
 if o.type=='FONT':
  bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
architecture=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='DESELECT')
for o in architecture:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'vinh_thuc_lighthouse.glb'),export_format='GLB',use_selection=True)
box('Presentation ground',(0,0,-6.8),(200,200,.4),ground)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.world.color=(.45,.45,.45)
bpy.ops.object.light_add(type='AREA',location=(0,-20,35));bpy.context.object.data.energy=6500;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=20
bpy.ops.object.light_add(type='SUN',location=(0,0,30));bpy.context.object.rotation_euler=(.45,-.5,-.5);bpy.context.object.data.energy=2.3
bpy.ops.object.camera_add(location=(-36,-53,34));cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=46
def aim(p):cam.rotation_euler=(Vector(p)-cam.location).to_track_quat('-Z','Y').to_euler()
aim((0,-1,8));scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'vinh_thuc_lighthouse.blend'))
for name,pos,target,scale in [('overview',(-36,-53,34),(0,-1,8),46),('front',(1,-65,24),(0,0,10),40)]:
 cam.location=pos;aim(target);cam.data.ortho_scale=scale;scene.render.filepath=os.path.join(OUT,name+'.png');bpy.ops.render.render(write_still=True)
with open(os.path.join(OUT,'model_notes.json'),'w',encoding='utf8') as f:json.dump({'basis':'Four user-supplied reference photographs','dimensions':'Estimated proportions; not a measured 1:1 survey','scope':'Exterior tower, rotunda, house, courtyard and stairs; unseen elevations inferred','objects':len(architecture),'triangles':sum(len(o.data.polygons) for o in architecture if o.type=='MESH')},f,indent=2)
