import {mkdirSync,cpSync,rmSync,writeFileSync} from 'node:fs';
import {resolve,dirname,basename} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'dist');
if(dirname(out)!==root||basename(out)!=='dist')throw Error('Destino de build inválido');
rmSync(out,{recursive:true,force:true});mkdirSync(out);
for(const file of ['src','scenarios','profiles','scripts','integrations','studio','preview','netlify.toml','package.json','package-lock.json','README.md','PRONTO-PARA-LIVE.md','INICIAR-FACTION-WARS-LIVE.bat'])cpSync(resolve(root,file),resolve(out,file),{recursive:true});
// The local relay uses ws. Include its runtime in the offline bundle.
mkdirSync(resolve(out,'node_modules'),{recursive:true});cpSync(resolve(root,'node_modules/ws'),resolve(out,'node_modules/ws'),{recursive:true});
writeFileSync(resolve(out,'README.md'),`# Faction Wars LIVE 0.4.5 — bundle local

Requer Node.js 24. Execute INICIAR-FACTION-WARS-LIVE.bat ou npm run live (npm.cmd run live no PowerShell) para iniciar o painel e a captura juntos.
Painel: http://127.0.0.1:4173/
Fonte de captura: npm run studio, depois http://127.0.0.1:4176/ — 1080 × 1920.

Use Nova batalha com cenário / Retomar para teste local. Para receber a LIVE, conecte o TikFinity Desktop e clique Nova partida LIVE. O primeiro !vermelho ou !azul abre os 25 segundos de preparação. Antes dele, o relógio permanece parado. O jogo não inicia a transmissão. Guia: PRONTO-PARA-LIVE.md.

Arte e bibliotecas são locais. Phaser e arte pré-renderizada, sem CDN; a dependência ws do relay já está incluída no bundle. Um Nexus por facção, movimento 2× e regras aprovadas preservados. Presentes não alteram o combate. A seção Recepção / Como jogar oferece boas-vindas, !ajuda, !help e !comandos. Ative a voz no painel e configure o Chatbot do TikFinity conforme PRONTO-PARA-LIVE.md para responder no chat real.

Dados ficam em .runtime/, criada na primeira execução. Não compartilhe dados reais. A fonte de captura é somente leitura. A integração precisa ser validada pelo operador durante a LIVE; testes sintéticos não equivalem a transmissão real.

Este bundle inclui runtime e fontes necessários. Testes e evidências completos ficam no projeto principal. Replay de journal: npm run replay -- .runtime/<id>.sqlite.
`);
console.log('Executable local bundle: '+out+' (Node 24 required)');
