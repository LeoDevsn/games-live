import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';

export function desktopAppCommand(address,{kind='game',env=process.env,exists=existsSync}={}){
 const url=new URL(address);
 if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password)throw Error('O aplicativo precisa usar um endereço local.');
 const roots=[env['ProgramFiles(x86)']||'C:/Program Files (x86)',env.ProgramFiles||'C:/Program Files',env.LOCALAPPDATA].filter(Boolean);
 const candidates=['Microsoft/Edge/Application/msedge.exe','Google/Chrome/Application/chrome.exe'].flatMap(relative=>roots.map(root=>path.join(root,relative)));
 const executable=candidates.find(exists);
 if(!executable)throw Error('Microsoft Edge ou Google Chrome não foi localizado para abrir a janela do aplicativo.');
 const size=kind==='game'?'570,1000':'1440,960';
 return {executable,args:[`--app=${url.href}`,`--window-size=${size}`],options:{windowsHide:true,detached:true,stdio:'ignore'}};
}

export async function openDesktopApp(address,{spawnProcess=spawn,...options}={}){
 const command=desktopAppCommand(address,options);
 await new Promise((resolve,reject)=>{
  const child=spawnProcess(command.executable,command.args,command.options);
  child.once('error',error=>reject(new Error('Não foi possível abrir a janela do aplicativo: '+error.message)));
  child.once('spawn',()=>{child.unref();resolve();});
 });
 return {opened:true,mode:'app'};
}
