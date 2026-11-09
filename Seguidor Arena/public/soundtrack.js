// Older running servers can still play their installed Filmic track until restarted.
const fallback={MUSIC_TRACKS:{filmic:{title:'Filmic Remix',url:'/assets/audio/filmic-remix.mp3',credit:'Arquivo fornecido pelo operador.'}},MUSIC_SELECTIONS:{filmic:['filmic']}};
const {MUSIC_TRACKS,MUSIC_SELECTIONS}=await import('./music-catalog.js').catch(()=>fallback);
export function createSoundtrack({studio=false,save=async()=>{},AudioClass=globalThis.Audio,document:doc=globalThis.document}={}){
 const empty={value:'',checked:false,textContent:'',hidden:true};const $=id=>doc.getElementById(id)||empty,audio=new AudioClass();audio.src=MUSIC_TRACKS.filmic.url;audio.loop=true;audio.preload='none';audio.volume=.22;
 let config={enabled:true,volume:.22,selection:'filmic'},preview=false,pending=false,active=false,dirty=false,blocked=false,received=false,ducked=false,phase='waiting',revision=0;
 const playlist=()=>config.selection==='liberadas'?[phase==='running'?'sailor':'rag']:(MUSIC_SELECTIONS[config.selection]||MUSIC_SELECTIONS.filmic);
 const current=()=>MUSIC_TRACKS[playlist()[0]];
 function showCredits(){$('musicCredits').value=(MUSIC_SELECTIONS[config.selection]||MUSIC_SELECTIONS.filmic).map(id=>MUSIC_TRACKS[id].credit).join('\n\n');}
 const volume=()=>config.volume*(ducked?.28:1);
 const unlock=doc.createElement('button');unlock.className='music-unlock';unlock.type='button';unlock.textContent='♫ Ativar música';unlock.hidden=true;if(!studio)doc.querySelector('.preview').append(unlock);
 function wanted(){return preview||studio&&config.enabled;}
 function status(text){$('musicStatus').textContent=text;}
 async function play(){
  if(!wanted()||pending||active)return;pending=true;
  const startedRevision=revision;
  try{await audio.play();if(startedRevision!==revision)return;if(!wanted()){audio.pause();return;}active=true;blocked=false;unlock.hidden=true;status(`${preview?'Prévia':'LIVE'} · ${current().title} · em loop.`);}
  catch(e){if(!wanted()||startedRevision!==revision)return;blocked=true;unlock.hidden=!studio||!config.enabled;unlock.textContent=e.name==='NotAllowedError'?'♫ Ativar música':'♫ Tentar música novamente';status(e.name==='NotAllowedError'?'Clique em Ativar música na tela da LIVE para liberar o áudio.':'Não foi possível tocar a trilha. Confira se a atualização foi reiniciada.');}
  finally{pending=false;if(startedRevision!==revision&&wanted()&&!blocked)void play();}
 }
 function sync(){if(!dirty)audio.volume=volume();if(wanted()){if(!blocked)void play();}else{audio.pause();active=false;blocked=false;unlock.hidden=true;status(config.enabled?'Música ligada na tela da LIVE.':'Música desligada.');}}
 audio.addEventListener('error',()=>{if(!wanted())return;active=false;blocked=true;unlock.hidden=!studio||!config.enabled;unlock.textContent='♫ Tentar música novamente';status('Não foi possível carregar '+current().title+'. Reinicie o jogo para carregar a trilha.');});
 unlock.onclick=()=>{blocked=false;void play();};
 if(!studio)$('musicEnabled').onchange=()=>save({enabled:$('musicEnabled').checked});
 if(!studio)$('musicSelection').onchange=()=>save({selection:$('musicSelection').value});
 if(!studio)$('musicVolume').oninput=()=>{dirty=true;const volume=Number($('musicVolume').value)/100;audio.volume=volume*(ducked?.28:1);$('musicVolumeLabel').textContent=Math.round(volume*100)+'%';};
 if(!studio)$('musicVolume').onchange=async()=>{try{await save({volume:Number($('musicVolume').value)/100});}finally{dirty=false;}};
 if(!studio)$('musicPreview').onclick=()=>{preview=!preview;$('musicPreview').textContent=preview?'Parar prévia':'Ouvir neste painel';blocked=false;sync();};
 if(studio)doc.addEventListener?.('pointerdown',()=>{if(blocked){blocked=false;void play();}},{passive:true});
 return {
  update(value,gamePhase='waiting'){if(!value)return;const wasEnabled=config.enabled,wasSelection=config.selection,wasTrack=current().url;phase=gamePhase;config={enabled:value.enabled!==false,volume:Number.isFinite(value.volume)?value.volume:.22,selection:Object.hasOwn(MUSIC_SELECTIONS,value.selection)?value.selection:'filmic'};$('musicEnabled').checked=config.enabled;$('musicSelection').value=config.selection;
   const changed=wasSelection!==config.selection||wasTrack!==current().url;
   if(changed){revision++;audio.pause();active=false;blocked=false;audio.src=current().url;}
   audio.loop=playlist().length===1;showCredits();
   if(!dirty){$('musicVolume').value=Math.round(config.volume*100);$('musicVolumeLabel').textContent=Math.round(config.volume*100)+'%';}
   if(wasEnabled!==config.enabled)blocked=false;
   if(!received||wasEnabled!==config.enabled||changed||audio.volume!==volume()){received=true;sync();}
  },
  duck(value){ducked=!!value;if(!dirty)audio.volume=volume();},
  stop(){preview=false;config.enabled=false;audio.pause();active=false;unlock.hidden=true;},
 };
}
