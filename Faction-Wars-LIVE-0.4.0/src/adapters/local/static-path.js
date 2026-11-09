import path from 'node:path';
// Use the platform path separator; literal '/src/' would reject every file on Windows.
export function staticPath(root,route,paths=path){
 const file=paths.resolve(root,route==='/'?'src/ui/index.html':'.'+route);
 if(!file.startsWith(root+paths.sep))return null;
 if(!['src','profiles'].some(dir=>file.startsWith(paths.resolve(root,dir)+paths.sep)))return null;
 return file;
}
