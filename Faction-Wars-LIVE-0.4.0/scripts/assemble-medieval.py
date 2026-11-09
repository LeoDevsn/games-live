from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1];tmp=root/'.runtime/medieval-frames';out=root/'src/ui/assets'
for f in ['R','S']:
 for k in ['G','D','A','C']:
  sheet=Image.new('RGBA',(1024,512))
  for row in range(8):
   for frame in range(4):
    index=row*4+frame;im=Image.open(tmp/f'{f}-{k}-{row}-{frame}.png');sheet.paste(im,((index%8)*128,(index//8)*128))
  sheet.save(out/f'troops/{f}-{k}.png',optimize=True)
paths=[out/'arena-medieval.png',*sorted((out/'troops').glob('*.png'))]
(out/'medieval-manifest.json').write_text(json.dumps({str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},indent=2))
print('Assembled 8 sheets / 256 original 3D rendered animation frames')
