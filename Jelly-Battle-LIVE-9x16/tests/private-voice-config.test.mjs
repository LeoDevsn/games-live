import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {privateVoiceFile,savePrivateVoice,restorePrivateVoice} from '../scripts/private-voice-config.mjs';
test('platform privately restores key and voices into a new game version, without overwriting current settings',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'jelly-private-'));writeFileSync(path.join(root,'INICIAR-GAMES-LIVE.bat'),'fixture');const old=path.join(root,'jelly-v1'),next=path.join(root,'jelly-v2');mkdirSync(old);mkdirSync(next);
 const settings={FISH_AUDIO_API_KEY:'fixture-key',FISH_AUDIO_VOICE_ID_A:'voice-a',FISH_AUDIO_VOICE_ID_B:'voice-b',FISH_AUDIO_MODEL:'s2.1-pro-free'};assert.equal(savePrivateVoice(old,settings),true);assert.equal(privateVoiceFile(old),privateVoiceFile(next));
 const restored={};restorePrivateVoice(next,restored);assert.deepEqual(restored,settings);assert.ok(existsSync(path.join(next,'.env')));assert.ok(readFileSync(path.join(next,'.env'),'utf8').includes('voice-b'));
 const changed={...settings,FISH_AUDIO_API_KEY:'fixture-new'};savePrivateVoice(next,changed);const current={...settings};restorePrivateVoice(old,current);assert.equal(current.FISH_AUDIO_API_KEY,settings.FISH_AUDIO_API_KEY);
});
