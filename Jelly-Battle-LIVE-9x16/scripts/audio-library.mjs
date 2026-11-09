import {readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const events = {telainicial:'intro', duranteabatalha:'idle', capturado:'capture', errouacaptura:'miss', erruacaptura:'miss', presenteespecial:'special', presentesespecial:'special', vitoria:'win'};
export async function buildAudioLibrary(root) {
  const library = {A:{}, B:{}};
  for (const [team, character] of [['A','bobesponja'], ['B','patrick']]) {
    const base = path.join(root, 'public/assets/audio', character);
    for (const folder of await readdir(base, {withFileTypes:true})) {
      const event = events[normalize(folder.name)];
      if (!folder.isDirectory() || !event) continue;
      const files = (await readdir(path.join(base, folder.name))).sort();
      const pool = library[team][event] ||= [];
      for (const file of files) {
        if (!/\.(mp3|wav|ogg|m4a|aac|webm|flac|txt)$/i.test(file)) continue;
        const text = file.replace(/\.[^.]+$/, '');
        if (event !== 'special' && /\.txt$/i.test(file)) continue;
        if (/\.txt$/i.test(file)) {
          for (const line of (await readFile(path.join(base,folder.name,file),'utf8')).split(/\r?\n/).map(x=>x.trim()).filter(Boolean)) {
            if (!pool.some(clip=>clip.text===line)) pool.push({name:file,text:line});
          }
          continue;
        }
        pool.push({name:file, text, url:['assets','audio',character,folder.name,file].map(encodeURIComponent).join('/')});
      }
    }
  }
  await writeFile(path.join(root, 'public/audio-library.js'), 'globalThis.JellyAudioLibrary = '+JSON.stringify(library,null,2)+';\n');
  return library;
}
