"""Editable original Blender models. Run: blender -b --python scripts/render-medieval.py.
No gameplay dimensions: all geometry is presentation. PNGs bundled for players.
"""
import bpy, math, random, os, json, sys
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'src/ui/assets'; TMP=ROOT/'.runtime/medieval-frames';TMP.mkdir(parents=True,exist_ok=True)
random.seed(29)
M={}
def mat(name,color):
 if name not in M:
  m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);M[name]=m
 return M[name]
stone=mat('warm limestone',(.58,.52,.40));cap=mat('cut limestone',(.79,.73,.58));grout=mat('mortar',(.30,.31,.25));gold=mat('antique gold',(.88,.57,.17));steel=mat('forged blue steel',(.35,.46,.55));silver=mat('steel edge',(.68,.79,.84));dark=mat('black iron',(.07,.12,.16));wood=mat('oak',(.29,.14,.06));skin=mat('skin',(.73,.46,.26));green=mat('ivy',(.16,.29,.06));leaf=mat('sunlit foliage',(.37,.48,.09));red=mat('rubra',(.69,.025,.05));blue=mat('safira',(.025,.30,.76));redgem=mat('ruby light',(1,.10,.12));bluegem=mat('sapphire light',(.06,.68,1));sand=mat('paving',(.66,.59,.45))
def setup(w,h,transparent=True):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=w;s.render.resolution_y=h;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=transparent
 sh=s.display.shading;sh.light='STUDIO';sh.studiolight_rotate_z=.6;sh.color_type='MATERIAL';sh.show_shadows=True;sh.show_cavity=True;sh.cavity_type='BOTH';sh.curvature_ridge_factor=1.5;sh.curvature_valley_factor=1.1;sh.show_specular_highlight=True;sh.background_type='WORLD';sh.background_color=(.045,.10,.10);s.display.render_aa='16';s.view_settings.view_transform='Standard'
 return s
def mesh_object(name,verts,faces,loc,m,parent=None):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=loc;o.data.materials.append(m)
 if parent:o.parent=parent
 return o
def cube(name,loc,scale,m,bevel=.04,parent=None):
 x,y,z=[v/2 for v in scale];verts=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
 o=mesh_object(name,verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],loc,m,parent)
 if bevel:
  b=o.modifiers.new('hand cut edges','BEVEL');b.width=bevel;b.segments=1;o.modifiers.new('weighted light','WEIGHTED_NORMAL')
 return o
def ball(name,loc,scale,m,parent=None):
 rings=4;segments=8;verts=[]
 for j in range(rings+1):
  phi=math.pi*j/rings
  for i in range(segments):
   theta=2*math.pi*i/segments;verts.append((math.sin(phi)*math.cos(theta)*scale[0],math.sin(phi)*math.sin(theta)*scale[1],math.cos(phi)*scale[2]))
 faces=[]
 for j in range(rings):
  for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
 return mesh_object(name,verts,faces,loc,m,parent)
def cylinder(name,loc,radius,depth,m,vertices=12,parent=None):
 verts=[(math.cos(i*2*math.pi/vertices)*radius,math.sin(i*2*math.pi/vertices)*radius,z)for z in [-depth/2,depth/2]for i in range(vertices)]
 faces=[tuple(reversed(range(vertices))),tuple(range(vertices,vertices*2))]+[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices)for i in range(vertices)]
 return mesh_object(name,verts,faces,loc,m,parent)
def rod(name,a,b,r,m,parent=None):
 a,b=Vector(a),Vector(b);o=cylinder(name,(a+b)/2,r,(b-a).length,m,8,parent);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def camera(loc,target,ortho):
 bpy.ops.object.camera_add(location=loc);o=bpy.context.object;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();o.data.type='ORTHO';o.data.ortho_scale=ortho;bpy.context.scene.camera=o;return o
def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;return o
def gem(loc,size,color,parent=None):
 x,y,z=loc;r=size*.27;verts=[(x+math.cos(i*math.pi/2)*r,y+math.sin(i*math.pi/2)*r,z+size*.30)for i in range(4)]+[(x,y,z+size),(x,y,z)]
 faces=[(i,(i+1)%4,4)for i in range(4)]+[(i,5,(i+1)%4)for i in range(4)];mesh=bpy.data.meshes.new('crystal facets');mesh.from_pydata(verts,[],faces);o=bpy.data.objects.new('faceted crystal',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(color);o.data.materials.append(bluegem if color==blue else redgem)
 for p in o.data.polygons:p.material_index=p.index%2
 if parent:o.parent=parent
 return o

def arena():
 s=setup(1080,1920,False);s.world.color=(.035,.08,.09);camera((0,-16,27),(0,0,0),23.5)
 cube('forest floor',(0,0,-.36),(12,24,.45),green,.15)
 cube('foundation',(0,0,-.26),(9.5,22,.40),grout,.18)
 for row in range(55):
  y=-10.65+row*.40
  for col in range(20):
   x=-4.65+col*.49+(row%2)*.24
   if x>4.7:continue
   m=mat('paver'+str((row*7+col)%7),tuple(v+((row*7+col)%7-3)*.014 for v in (.67,.60,.47)))
   o=cube('individual stone',(x,y,random.uniform(-.028,.008)),(.47,.38,.10),m,.025);o.rotation_euler.z=random.uniform(-.018,.018)
 # Dividers end before both shared Nexus courtyards.
 for x in [-1.52,1.52]:
  for j in range(32):
   y=-6.8+j*.44
   cube('wall block',(x,y,.31),(.37,.425,.62),stone,.035)
   cube('wall coping',(x,y,.65),(.46,.44,.12),cap,.03)
   if j%5==0:
    cube('square pier',(x,y,.45),(.58,.55,.9),stone,.04);cube('pier crown',(x,y,.94),(.67,.64,.16),cap,.035)
   for k in range(2):ball('ivy',(x+random.uniform(-.24,.24),y+random.uniform(-.15,.15),.75+random.uniform(-.05,.16)),(.20,.24,.18),leaf if random.random()>.5 else green)
 for x in [-4.7,4.7]:
  for j in range(43):
   y=-9.8+j*.46;cube('outer wall',(x,y,.45),(.42,.44,.9),stone,.04)
   if j%2==0:cube('crenellation',(x,y,1.05),(.46,.30,.34),cap,.02)
  for j in range(24):
   y=-10+j*.85
   ball('forest',(x+random.choice([-.55,.55]),y,.55),(.65,.72,.85),green)
   ball('canopy',(x+random.uniform(-.5,.5),y,.98),(.58,.58,.56),leaf)
 for f,y in [('S',8.2),('R',-8.2)]:
  c=blue if f=='S' else red
  cylinder('shared courtyard',(0,y,.04),3.05,.08,grout,48)
  for ring,r in enumerate([1.65,2.12,2.65]):
   segments=24 if ring else 18
   for i in range(segments):
    a=i*math.pi*2/segments;tile=cube('courtyard radial stone',(math.cos(a)*r,y+math.sin(a)*r,.09),(.42,.48,.10),cap if i%3==0 else sand,.025);tile.rotation_euler.z=a
  for x in [-.65,.65]:gem((x,y+.20,.48),1.08,c)
  for r,m in [(1.35,dark),(1.18,gold),(1.05,stone),(.95,c)]:cylinder('Nexus plinth',(0,y,.12+(1.35-r)*1.5),r,.24,m,12)
  gem((0,y,.55),2.45,c)
  for a in range(8):
   angle=a*math.pi/4;x=1.05*math.cos(angle);dy=y+1.05*math.sin(angle)
   cube('Nexus gold braces',(x,dy,.73),(.14,.14,.8),gold,.03)
  for x in [-3.8,3.8]:
   cube('watchtower',(x,y,.65),(.8,.8,1.3),stone,.06);cube('tower cap',(x,y,1.35),(1,.95,.16),cap,.04)
   cylinder('gold brazier',(x,y,1.50),.28,.22,gold)
   gem((x,y,1.6),.65,bluegem if f=='S' else redgem)
   rod('banner pole',(x,y-.5,.1),(x,y-.5,2.1),.035,gold)
   cube('faction banner',(x+.20,y-.5,1.45),(.38,.045,.85),c,.02)
   cube('banner gold',(x+.20,y-.54,1.45),(.035,.025,.65),gold,.0)
 # CPU beauty render for the arena; unit sheets use fast studio prerenders.
 for material in M.values():
  material.use_nodes=True;node=material.node_tree.nodes.get('Principled BSDF');node.inputs['Base Color'].default_value=material.diffuse_color;node.inputs['Roughness'].default_value=.78
  if material in [gold,steel,silver]:node.inputs['Metallic'].default_value=.55;node.inputs['Roughness'].default_value=.33
  if material in [blue,red,bluegem,redgem]:
   node.inputs['Emission Color'].default_value=material.diffuse_color;node.inputs['Emission Strength'].default_value=1.8 if material in [bluegem,redgem] else .35
 s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.use_denoising=False;s.render.threads_mode='FIXED';s.render.threads=2
 s.world.use_nodes=True;s.world.node_tree.nodes.get('Background').inputs[0].default_value=(.38,.48,.66,1);s.world.node_tree.nodes.get('Background').inputs[1].default_value=.45
 bpy.ops.object.light_add(type='SUN',location=(-5,-8,12));sun=bpy.context.object;sun.rotation_euler=(.45,-.45,-.5);sun.data.energy=2.0;sun.data.angle=.35;sun.data.color=(1,.88,.67)
 bpy.ops.object.light_add(type='AREA',location=(3,-2,12));light=bpy.context.object;light.data.energy=1200;light.data.shape='DISK';light.data.size=9
 s.render.filepath=str(OUT/'arena-medieval.png');bpy.ops.render.render(write_still=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'medieval-arena.blend'),compress=True)
 print('ARENA_DONE',flush=True)

def soldier(kind,faction):
 s=setup(128,128);camera((2,-6,5),(0,0,1.15),3.9)
 root=empty('unit');body=empty('body',(0,0,0),root);c=red if faction=='R' else blue
 joints={}
 if kind=='C':
  cube('chassis',(0,0,.58),(1.25,1.7,.35),wood,.08,body)
  cube('faction plating',(0,.10,.83),(1.05,1.20,.36),c,.08,body)
  for x in [-.68,.68]:
   for y in [-.55,.55]:
    o=cylinder('iron wheel',(x,y,.40),.37,.18,dark,12,body);o.rotation_euler.y=math.pi/2
    o=cylinder('gold wheel hub',(x*1.02,y,.40),.19,.2,gold,8,body);o.rotation_euler.y=math.pi/2
    joints[f'wheel{x}{y}']=o
  barrel=empty('recoil',(0,0,0),body);joints['weapon']=barrel
  rod('cannon barrel',(0,.5,1.05),(0,-.91,1.25),.23,steel,barrel)
  rod('muzzle',(0,-.8,1.24),(0,-1.03,1.27),.28,gold,barrel)
  rod('dark bore',(0,-1.025,1.27),(0,-1.04,1.272),.19,dark,barrel)
  for x in [-.42,.42]:cube('brass brace',(x,0,1.05),(.1,.6,.6),gold,.03,body)
  gem((0,.55,1),.45,c,body)
 else:
  bulk=1.18 if kind=='D' else 1
  for side,x in [('L',-.23),('R',.23)]:
   leg=empty('leg'+side,(x,0,.83),body);joints['leg'+side]=leg
   cube('greave',(0,0,-.25),(.31,.32,.50),steel,.055,leg);cube('gold knee',(0,-.15,-.03),(.34,.09,.19),gold,.025,leg);cube('boot',(0,-.08,-.63),(.35,.49,.26),dark,.04,leg)
  cube('tabard',(0,.06,1.05),(.77*bulk,.45,.62),c,.08,body)
  cube('breastplate',(0,-.05,1.43),(.79*bulk,.51,.66),steel,.10,body)
  cube('gold breastplate ridge',(0,-.325,1.44),(.09,.06,.49),gold,.02,body)
  cube('belt',(0,0,1.03),(.85*bulk,.55,.12),dark,.02,body);cube('buckle',(0,-.3,1.03),(.18,.09,.14),gold,.02,body)
  ball('head',(0,0,1.99),(.30,.28,.34),skin,body)
  if kind=='A':
   ball('hood',(0,.07,2.08),(.35,.29,.36),c,body);cube('face',(0,-.24,1.99),(.35,.10,.24),skin,.04,body)
   cube('quiver',(.27,.36,1.50),(.25,.25,.66),wood,.03,body)
   for x in [.20,.29,.35]:rod('arrows',(x,.37,1.5),(x,.37,2.05),.016,gold,body)
  else:
   ball('helmet',(0,.03,2.10),(.35,.32,.36),steel,body)
   cube('visor',(0,-.29,2.06),(.47,.075,.09),dark,.025,body);cube('nose guard',(0,-.34,2.0),(.08,.08,.25),gold,.02,body)
   cube('helmet crest',(0,.04,2.43),(.10,.49,.13),c,.04,body)
  for side,x in [('L',-.51*bulk),('R',.51*bulk)]:
   arm=empty('arm'+side,(x,0,1.64),body);joints['arm'+side]=arm
   ball('gold shoulder',(0,0,0),(.30 if kind=='D' else .25,.28,.22),gold,arm)
   cube('shoulder plate',(0,-.015,.025),(.42,.45,.22),steel,.06,arm)
   cube('bracer',(0,0,-.37),(.23,.27,.46),c,.04,arm);ball('gauntlet',(0,-.03,-.62),(.14,.16,.16),silver,arm)
  weapon=empty('weapon',(0,0,0),joints['armR']);joints['weapon']=weapon
  if kind=='G':
   cube('sword grip',(0,-.06,-.65),(.09,.10,.33),wood,.02,weapon)
   cube('crossguard',(0,-.06,-.43),(.43,.12,.09),gold,.02,weapon)
   cube('sword blade',(0,-.06,.04),(.16,.06,.88),silver,.025,weapon)
   ball('pommel',(0,-.06,-.85),(.09,.09,.1),gold,weapon)
  if kind=='D':
   shield=empty('shield',(0,-.21,-.39),joints['armL'])
   cube('shield rim',(0,-.06,0),(.70,.16,.96),gold,.14,shield)
   cube('shield face',(0,-.16,.01),(.57,.12,.80),c,.12,shield)
   cube('shield sigil',(0,-.24,.03),(.09,.04,.48),gold,.02,shield)
   rod('mace handle',(0,0,-.72),(0,0,.03),.06,wood,weapon);ball('mace head',(0,0,.08),(.22,.20,.22),steel,weapon)
  if kind=='A':
   bow=empty('bow',(0,-.10,-.48),weapon)
   pts=[(.1,-.2,.54),(.26,-.30,.32),(.30,-.33,0),(.26,-.30,-.32),(.1,-.2,-.54)]
   for a,b in zip(pts,pts[1:]):rod('curved bow',a,b,.045,gold,bow)
   rod('bow string',pts[0],pts[-1],.012,silver,bow);rod('drawn arrow',(-.18,-.2,0),(.5,-.2,0),.018,wood,bow)
 return s,root,body,joints

def troops():
 # 4 columns per action-facing; eight rows: walk up/down, attack up/down, hurt up/down, death up/down.
 for faction in ['R','S']:
  for kind in ['G','D','A','C']:
   s,root,body,j=soldier(kind,faction)
   for row in range(8):
    up=row%2==0;action=row//2
    for frame in range(4):
     t=frame/3;root.rotation_euler=(0,0,math.pi if up else 0);root.location=(0,0,0);body.location=(0,0,0);body.rotation_euler=(0,0,0)
     for o in j.values():o.rotation_euler=(0,0,0)
     if action==0:
      swing=math.sin(frame*math.pi/2)*.55;body.location.z=abs(swing)*.07
      if kind!='C':j['legL'].rotation_euler.x=swing;j['legR'].rotation_euler.x=-swing;j['armL'].rotation_euler.x=-swing*.5;j['armR'].rotation_euler.x=swing*.5
      else:
       for name,o in j.items():
        if name.startswith('wheel'):o.rotation_euler.y=math.pi/2;o.rotation_euler.x=frame*math.pi/2
     elif action==1:
      swing=math.sin(t*math.pi)
      if kind=='C':j['weapon'].location.y=swing*.19
      elif kind=='A':j['armR'].rotation_euler.x=-.9;j['armL'].rotation_euler.x=-1.25*swing;j['armR'].rotation_euler.z=-.4
      else:j['armR'].rotation_euler.x=-2.0*swing;j['armR'].rotation_euler.y=.55*swing;body.rotation_euler.z=.25*swing
     elif action==2:body.rotation_euler.x=-.22*math.sin(t*math.pi);body.location.y=.10*math.sin(t*math.pi)
     else:body.rotation_euler.x=-1.45*t;body.location.z=-.25*t
     s.render.filepath=str(TMP/f'{faction}-{kind}-{row}-{frame}.png');bpy.ops.render.render(write_still=True)
   print('TROOP_DONE',faction,kind,flush=True)
   bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'model-{faction}-{kind}.blend'),compress=True)
if '--troops-only' not in sys.argv:arena()
if '--arena-only' not in sys.argv:troops()
(OUT/'model-metadata.json').write_text(json.dumps({'tool':bpy.app.version_string,'method':'original meshes / Workbench studio light, shadows, cavity / orthographic prerender','rows':['walk-up','walk-down','attack-up','attack-down','hurt-up','hurt-down','death-up','death-down'],'framesPerAction':4,'frameSize':128,'geometry':'presentation only; server motor authoritative'},indent=2))
