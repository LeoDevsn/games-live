import {copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),target=resolve(root,'Faction-Wars-LIVE-0.4.0/integrations/tikfinity');
copyFileSync(resolve(root,'Jelly-Battle-LIVE-9x16/scripts/private-voice-config.mjs'),resolve(target,'private-voice-config.mjs'));
copyFileSync(resolve(root,'Jelly-Battle-LIVE-9x16/worker/voice.js'),resolve(target,'fish-voice.js'));
copyFileSync(resolve(root,'Jelly-Battle-LIVE-9x16/scripts/private-voice-config.mjs'),resolve(root,'Seguidor Arena/src/private-voice-config.mjs'));
copyFileSync(resolve(root,'Jelly-Battle-LIVE-9x16/worker/voice.js'),resolve(root,'Seguidor Arena/src/fish-voice.mjs'));
for(const [source,target]of [['scripts/private-voice-config.mjs','private-voice-config.mjs'],['worker/voice.js','fish-voice.mjs']])copyFileSync(resolve(root,'Jelly-Battle-LIVE-9x16',source),resolve(root,'Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/src',target));
console.log('Shared private voice loader and Fish provider synced. No credentials copied into source.');
