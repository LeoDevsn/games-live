import * as T from './vendor/three.module.js';

// Original procedural geometry. WebGL is cosmetic; the server owns all results.
export function createScene() {
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});
  renderer.setSize(1080,1000);renderer.setPixelRatio(1);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(38,1080/1000,.1,100);
  camera.position.set(6,10.8,22);camera.lookAt(0,2.4,0);
  scene.add(new T.HemisphereLight(0xbcf5e8,0x596d54,3));
  const sun=new T.DirectionalLight(0xffe6cf,4);sun.position.set(-6,14,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.03;scene.add(sun);
  const rim=new T.DirectionalLight(0x5abaff,3);rim.position.set(8,5,-7);scene.add(rim);
  const box=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8),cylinder=new T.CylinderGeometry(1,1,1,12);
  const mat=(color,glow=0)=>new T.MeshStandardMaterial({color,roughness:.72,metalness:.12,emissive:glow,emissiveIntensity:.5});
  const stone=mat(0x9daac0),dark=mat(0x283550),gold=mat(0xffd58b,0x4b2a00),grass=mat(0xceba82),rock=mat(0x8a9e7b);
  function mesh(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const towers={},seen=new Set(),particles=[],projectiles=[];
  for(const [team,x,color] of [['A',-3.25,0xffc371],['B',3.25,0xb6ed70]]){
    const root=new T.Group();root.position.x=x;scene.add(root);
    const material=mat(color,color),pale=mat(team==='A'?0xf8deb1:0xc8f2bf),building=mat(team==='A'?0xb7874d:0x69958c);
    const island=mesh(root,cylinder,grass,0,-.28,0,2.75,.65,2.45);
    const rim=mesh(root,cylinder,dark,0,-.65,0,2.82,.22,2.52);
    for(let i=0;i<9;i++){const a=i*2.399;const geo=new T.DodecahedronGeometry(.8+(i%3)*.2,0);mesh(root,geo,rock,Math.cos(a)*1.7,-1-(i%3)*.25,Math.sin(a)*1.45,1,1.4,1);}
    const ring=mesh(root,new T.TorusGeometry(2.5,.035,6,64),material,0,.09,0);ring.rotation.x=Math.PI/2;
    mesh(root,box,building,0,.22,0,3.15,.45,2.65);
    mesh(root,box,dark,0,.49,0,2.9,.1,2.45);
    const levels=[];
    for(let level=0;level<13;level++){
      const group=new T.Group();root.add(group);levels.push(group);
      const y=.85+level*.34;
      for(let side=0;side<4;side++){
        const a=side*Math.PI/2;
        for(let j=0;j<3;j++){
          const xx=(j-1)*.73,zz=1.06;
          mesh(group,box,(level%3===0?material:building),Math.cos(a)*xx-Math.sin(a)*zz,y,Math.sin(a)*xx+Math.cos(a)*zz,.69,.3,.45).rotation.y=-a;
        }
      }
      if(level%3===1){mesh(group,box,dark,-.45,y,1.301,.24,.25,.015);mesh(group,box,dark,.45,y,1.301,.24,.25,.015);}
    }
    const crown=new T.Group();root.add(crown);
    mesh(crown,box,pale,0,0,0,2.8,.22,2.8);
    for(let i=0;i<4;i++)for(const j of [-1,1]){
      mesh(crown,box,material,(i-1.5)*.77,.29,j*1.18,.45,.5,.43);
      mesh(crown,box,material,j*1.18,.29,(i-1.5)*.77,.43,.5,.45);
    }
    mesh(crown,cylinder,gold,-.85,1.1,-.6,.045,1.8,.045);
    const flag=mesh(crown,box,material,-.42,1.65,-.6,.83,.45,.035);
    const gem=mesh(crown,new T.OctahedronGeometry(.27),material,0,.8,0);gem.rotation.z=.3;
    // Cannon points toward the opposing castle.
    const cannon=mesh(crown,cylinder,dark,team==='A'?.8:-.8,.48,0,.2,.85,.2);cannon.rotation.z=Math.PI/2;
    mesh(root,box,dark,0,.95,1.299,.55,.95,.03);
    mesh(root,box,gold,0,1.49,1.31,.66,.09,.06);
    const shield=mesh(root,new T.SphereGeometry(2.1,24,16),new T.MeshBasicMaterial({color,transparent:true,opacity:.12,wireframe:true}),0,2,0,1,1.4,1);
    const avatars=[];
    for(let i=0;i<8;i++){
      const avatar=new T.Group();root.add(avatar);
      mesh(avatar,box,material,0,.23,0,.22,.34,.18);mesh(avatar,sphere,pale,0,.52,0,.14,.14,.14);
      avatars.push(avatar);
    }
    towers[team]={root,levels,crown,flag,gem,shield,avatars,height:1.7,material};
  }
  // Suspended bridge and tiny gold lanterns connect both floating islands.
  for(let i=0;i<9;i++)mesh(scene,box,i%2?dark:stone,-1.65+i*.41,-.03,0,.37,.14,.8);
  const motes=[];
  for(let i=0;i<45;i++){const m=mesh(scene,sphere,new T.MeshBasicMaterial({color:i%2?0x8de1f7:0xffe2a5,transparent:true,opacity:.6}),((i*13)%29-14)*.6,((i*17)%13)*.6-1,((i*7)%17-8)*.7,.018,.018,.018);motes.push(m);}
  function remove(list,item){scene.remove(item.mesh);item.mesh.material.dispose();list.splice(list.indexOf(item),1);}
  function burst(team,now){const tower=towers[team];if(!tower)return;for(let i=0;i<12&&particles.length<240;i++){const m=mesh(scene,sphere,tower.material.clone(),tower.root.position.x,tower.height+.3,0,.055,.055,.055);particles.push({mesh:m,at:now,v:new T.Vector3(Math.cos(i*2.4)*1.7,.7+(i%4)*.35,Math.sin(i*2.4)*1.7)});}}
  function render(state,now){
    const t=now/1000;
    for(const key of ['A','B']){
      const data=state.teams[key],tower=towers[key],floors=3+Math.round(data.blocks/state.rules.maxBlocks*10),target=.7+floors*.34;
      tower.height+=(target-tower.height)*.12;
      tower.levels.forEach((m,i)=>{m.visible=i<floors;});tower.crown.position.y=tower.height;
      tower.gem.rotation.y=t*.7;tower.gem.position.y=.8+Math.sin(t*2)*.08;
      tower.flag.rotation.y=Math.sin(t*3)*.13;
      tower.shield.visible=data.shield>0;tower.shield.material.opacity=.07+Math.sin(t*3)*.025;
      tower.shield.scale.y=.7+tower.height*.2;tower.shield.position.y=tower.height*.5;
      tower.avatars.forEach((m,i)=>{m.visible=i<Math.min(8,data.memberCount);const a=i*.785+t*.18;m.position.set(Math.cos(a)*2.12,.1+Math.max(0,Math.sin(t*5+i))*.09,Math.sin(a)*1.8);m.rotation.y=-a;});
    }
    for(const effect of state.effects||[]){
      const key=state.round+':'+effect.id;if(seen.has(key))continue;seen.add(key);if(seen.size>500)seen.delete(seen.values().next().value);
      if(effect.kind==='attack'&&projectiles.length<24){
        const tower=towers[effect.team],m=mesh(scene,sphere,new T.MeshBasicMaterial({color:effect.team==='A'?0xff7597:0x69f6ff}),tower.root.position.x,tower.height+.5,0,.15,.15,.15);
        projectiles.push({mesh:m,at:now,from:effect.team});
      }else if(['build','gift','like','join'].includes(effect.kind))burst(effect.team,now);
    }
    for(const p of [...projectiles]){const age=(now-p.at)/850;if(age>=1){burst(p.from==='A'?'B':'A',now);remove(projectiles,p);continue;}const from=towers[p.from],to=towers[p.from==='A'?'B':'A'];p.mesh.position.set(T.MathUtils.lerp(from.root.position.x,to.root.position.x,age),T.MathUtils.lerp(from.height,to.height,age)+Math.sin(age*Math.PI)*2+.5,0);}
    for(const p of [...particles]){const age=(now-p.at)/1100;if(age>=1){remove(particles,p);continue;}p.mesh.position.addScaledVector(p.v,.016);p.mesh.position.y-=age*.035;p.mesh.scale.setScalar(.055*(1-age));}
    motes.forEach((m,i)=>{m.position.y+=Math.sin(t*.7+i)*.0015;});
    renderer.render(scene,camera);
    return renderer.domElement;
  }
  renderer.domElement.addEventListener('webglcontextlost',event=>event.preventDefault());
  return {render,renderer};
}
