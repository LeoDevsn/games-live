"""Verify the prepared Phaser0.2 artifacts and produce a local delivery."""
import json,pathlib,subprocess,time
root=pathlib.Path(__file__).resolve().parents[1]
def run(args,log=None):
 if log:
  with (root/'evidence'/log).open('w') as out:subprocess.run(args,cwd=root,stdout=out,stderr=subprocess.STDOUT,check=True)
 else:subprocess.run(args,cwd=root,check=True)
def ready(name,digest):
 try:
  r=json.loads((root/f'evidence/{name}.json').read_text());return r.get('status','pass')=='pass' and r.get('sourceDigest')==digest
 except (FileNotFoundError,json.JSONDecodeError):return False
print('Waiting for final renderer/scenario evidence',flush=True)
digest=subprocess.check_output(['node','--input-type=module','-e',"import {sourceDigest} from './scripts/source-digest.js';console.log(sourceDigest())"],cwd=root,text=True).strip()
while not all(ready(x,digest) for x in ['browser','render-load','phaser-battle-1','phaser-battle-2']):time.sleep(1)
run(['node','scripts/promote-stress.js'])
run(['npm','run','test:movement'],'movement-2x.log')
run(['npm','run','build'])
run(['node','scripts/clean-smoke.js'],'clean-smoke.log')
run(['npm','test'],'acceptance.log')
run(['node','scripts/report.js'])
run(['python3','scripts/package_delivery.py'])
print('Phaser0.2 local delivery verified',flush=True)
