const $=id=>document.getElementById(id);let games=[],busy=false;
const symbols={jelly:'◕',faction:'⚔',tower:'♜',arena:'◎'};
async function request(route){const r=await fetch(route,{method:'POST'}),out=await r.json();if(!r.ok)throw Error(out.error||'Não foi possível abrir o aplicativo.');return out;}
async function openWindow(game,target,button){
 if(busy)return;busy=true;button.disabled=true;
 try{await request(`/api/open/${game.id}/${target}`);$('notice').textContent=(target==='studio'?game.name:'Painel de '+game.name)+' aberto em janela de aplicativo.';}
 catch(error){$('notice').textContent=error.message;}finally{busy=false;button.disabled=false;}
}
function showLaunch(game,out){
 const source=new URL(out.studio);source.hash='tiktok.studio';const captureUrl=source.href;
 $('chosen').textContent=game.name;$('url').textContent=captureUrl;$('launch').hidden=false;
 $('arena').onclick=()=>openWindow(game,'studio',$('arena'));$('panel').onclick=()=>openWindow(game,'panel',$('panel'));
 $('copy').onclick=async()=>{try{await navigator.clipboard.writeText(captureUrl);$('copy').textContent='URL copiada';}catch{$('notice').textContent='Copie o endereço exibido no painel.';}};
}
async function load(){try{const r=await fetch('/api/games');if(!r.ok)throw Error();games=await r.json();$('games').replaceChildren();for(const game of games){
 const card=document.createElement('article');card.className='game '+game.id;
 const cover=document.createElement('div');cover.className='cover';const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent=symbols[game.id];const badge=document.createElement('small');badge.textContent=game.running?'DISPONÍVEL NO PC':'PRONTO PARA INICIAR';cover.append(symbol,badge);
 const body=document.createElement('div');body.className='game-body';const tag=document.createElement('p');tag.className='eyebrow';tag.textContent=game.tag;const title=document.createElement('h2');title.textContent=game.name;const desc=document.createElement('p');desc.textContent=game.description;const button=document.createElement('button');button.textContent=game.running?'Abrir aplicativo →':'Executar jogo →';button.onclick=()=>start(game,button);body.append(tag,title,desc,button);card.append(cover,body);$('games').append(card);
 }}catch{$('notice').textContent='Não foi possível consultar os jogos. Abra novamente o Games Live.';}}
async function start(game,button){
 if(busy)return;busy=true;button.disabled=true;button.textContent='Preparando…';$('notice').textContent='Iniciando '+game.name+'…';
 try{const out=await request('/api/start/'+game.id);showLaunch(game,out);$('notice').textContent=game.name+' aberto em janela de aplicativo.';button.textContent='Abrir aplicativo →';$('launch').scrollIntoView({behavior:'smooth',block:'nearest'});}
 catch(error){$('notice').textContent=error.message;button.textContent='Tentar novamente';}finally{busy=false;button.disabled=false;}
}
load();
