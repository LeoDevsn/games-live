"""Verified offline0.3 delivery; creates a local ZIP and never publishes it."""
import hashlib,json,pathlib,zipfile,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
def read(name):return json.loads((root/f'evidence/{name}.json').read_text())
a,p,b,r,m=map(read,['acceptance','stress','browser','render-load','movement-2x'])
for name in ['mobile','mobile-browser','preview','integration','studio']:
 current=read(name);assert current['status']=='pass'
v,u=map(read,['medieval','medieval-browser'])
assert v['totals']=={'pass':8,'fail':0,'skip':0}
assert u['status']=='pass'
assert a['totals']=={'pass':40,'fail':0,'skip':0},a['totals']
js="import {sourceDigest,engineDigest} from './scripts/source-digest.js';console.log(JSON.stringify({source:sourceDigest(),engine:engineDigest()}));"
d=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root,text=True))
assert a['sourceDigest']==b['sourceDigest']==r['sourceDigest']==u['sourceDigest']==v['sourceDigest']==d['source']
assert p['engineDigest']==m['engineDigest']==d['engine']
assert p['paced'] and p['admissionWallMs']>=600000 and p['ticks']==12000 and p['events']==60000
assert b['status']==r['status']==m['status']=='pass'
assert b['renderer']['version']=='3.90.0' and b['renderer']['assetsReady']
assert r['active']['renderer']['units']==122 and r['active']['renderer']['interpolatedFrames']>0
assert all(c['newDistance']==2*c['oldDistance'] for c in m['checks'])
for name in ['phaser-battle-1','phaser-battle-2']:
 x=read(name);assert x['sourceDigest']==d['source'] and x['hash']==x['replayHash']
for line in (root/'sources/FACTION_WARS_MVP_OFFLINE/MANIFESTO_SHA256.txt').read_text().splitlines():
 expected,name=line.split(None,1);assert hashlib.sha256((root/'sources/FACTION_WARS_MVP_OFFLINE'/name.strip()).read_bytes()).hexdigest()==expected
vendor=json.loads((root/'src/ui/vendor/manifest.json').read_text());assert hashlib.sha256((root/'src/ui/vendor/phaser-3.90.0.min.js').read_bytes()).hexdigest()==vendor['sha256']
files=[]
selected={'.runtime/phaser-battle-1.sqlite','.runtime/phaser-battle-2.sqlite','.runtime/stress-medieval-03-0.sqlite','.runtime/stress-medieval-03-1.sqlite'}
for path in sorted(root.rglob('*')):
 if not path.is_file() or path.suffix in ['.blend1','.blend2']:continue
 rel=path.relative_to(root)
 if any(x in rel.parts for x in ['node_modules','__pycache__','.git']):continue
 if rel.parts[0]=='.runtime' and str(rel) not in selected:continue
 if str(rel) in {'SHA256SUMS.txt','evidence/final-verification.log','evidence/final-verification-02.log','evidence/package-0.2.0.json','evidence/package-0.3.0.json','evidence/final-verification-03.log','evidence/package-0.3.0.log','evidence/package-0.3.1.log','evidence/package-0.4.0.log'}:continue
 files.append(path)
(root/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(root))+'\n' for p in files));files.append(root/'SHA256SUMS.txt')
version=json.loads((root/'package.json').read_text())['version']
output=root.parent/f'FACTION_WARS_OFFLINE_{version}.zip'
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,'faction-wars-offline/'+str(p.relative_to(root)))
metadata={'archive':str(output),'bytes':output.stat().st_size,'files':len(files),'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
(root.parent/f'FACTION_WARS_OFFLINE_{version}.manifest.json').write_text(json.dumps(metadata,indent=2))
print(json.dumps(metadata))
