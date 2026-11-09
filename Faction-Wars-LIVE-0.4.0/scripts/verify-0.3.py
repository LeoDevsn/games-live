"""Final local0.3 verification. Browser checks should already have passed for frozen assets."""
import pathlib,subprocess,json,sys,time
from concurrent.futures import ThreadPoolExecutor
root=pathlib.Path(__file__).resolve().parents[1]
def run(args,log):
 with (root/'evidence'/log).open('w') as f:
  p=subprocess.run(args,cwd=root,stdout=f,stderr=subprocess.STDOUT)
 if p.returncode:raise SystemExit(f'FAILED {args}; see evidence/{log}')
with ThreadPoolExecutor(max_workers=2) as pool:
 list(pool.map(lambda i:run(['node','scripts/replay.js',f'.runtime/stress-medieval-03-{i}.sqlite'],f'stress-fresh-03-{i}.json'),range(2)))
for attempt in range(120):
 if (root/'evidence/stress-medieval-03.json').exists():break
 time.sleep(1)
else:raise SystemExit('Current stress report not ready')
run(['node','scripts/promote-stress.js'],'stress-promote-03.log')
for name in ['phaser-battle-1','phaser-battle-2']:
 file=root/'.runtime'/f'{name}.sqlite'
 if file.exists():
  old=root/'.runtime/archive0.2';old.mkdir(exist_ok=True);file.rename(old/file.name)
 run(['node','scripts/scenario.js',name],name+'.log')
run(['node','tests/medieval.js'],'medieval.log')
run(['node','tests/movement.js'],'movement-2x.log')
run(['node','tests/static-path.js'],'static-path.log')
run(['node','scripts/build.js'],'build-03.log')
run(['node','scripts/clean-smoke.js'],'clean-smoke.log')
run(['node','tests/render-load.js'],'render-load.log')
run(['node','tests/acceptance.js'],'acceptance.log')
run(['node','scripts/report.js'],'report-03.log')
run(['python','scripts/package_delivery.py'],'package-0.3.0.log')
print('0.3 final verification passed')
