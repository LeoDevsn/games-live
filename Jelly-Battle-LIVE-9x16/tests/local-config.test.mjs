import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseEnv} from 'node:util';
import {createLocalConfig,voiceId} from '../scripts/local-config.mjs';

const base='http://127.0.0.1:4174';
const request=(body,headers={})=>new Request(base+'/api/setup/voice',{method:'POST',headers:{origin:base,'content-type':'application/json',...headers},body:JSON.stringify(body)});
async function setup(){
  const root=await mkdtemp(path.join(os.tmpdir(),'jelly-voice-setup-')),env={};
  return{root,env,handle:createLocalConfig({root,env}),cleanup:async()=>{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('jelly-voice-setup-'));await rm(root,{recursive:true,force:true})}};
}
const values={key:'test-secret-only',voiceA:'bob-id',voiceB:'patrick-id',model:'s2.1-pro'};

test('accepts voice IDs and Fish Audio links, rejecting foreign URLs and multiline values',()=>{
  assert.equal(voiceId('bob-id'),'bob-id');assert.equal(voiceId('https://fish.audio/m/bob-id/?x=1'),'bob-id');
  assert.equal(voiceId('https://evil.test/m/bob-id/'),null);assert.equal(voiceId('bob\nSECRET=value'),null);
});
test('local setup saves private credentials, applies both voices and never returns the key',async()=>{
  const s=await setup();
  try{
    const response=await s.handle(request(values));assert.equal(response.status,200);const body=await response.text();assert(!body.includes(values.key));assert.equal(JSON.parse(body).saved,true);
    assert.equal(s.env.FISH_AUDIO_API_KEY,values.key);assert.equal(s.env.FISH_AUDIO_VOICE_ID_A,'bob-id');assert.equal(s.env.FISH_AUDIO_VOICE_ID_B,'patrick-id');
    const saved=parseEnv(await readFile(path.join(s.root,'.env'),'utf8'));assert.equal(saved.FISH_AUDIO_API_KEY,values.key);
    const status=await s.handle(new Request(base+'/api/setup/voice'));const info=await status.json();assert.equal(info.keySaved,true);assert.deepEqual(info.teams,{A:true,B:true});assert.equal(info.key,undefined);
  }finally{await s.cleanup()}
});
test('updating voices keeps existing key and unrelated env settings',async()=>{
  const s=await setup();
  try{
    await writeFile(path.join(s.root,'.env'),'OTHER_SETTING=keep\nFISH_AUDIO_API_KEY=old\n');s.env.FISH_AUDIO_API_KEY='old';
    const response=await s.handle(request({...values,key:'',voiceA:'https://fish.audio/m/new-bob/'}));assert.equal(response.status,200);
    const saved=parseEnv(await readFile(path.join(s.root,'.env'),'utf8'));assert.equal(saved.OTHER_SETTING,'keep');assert.equal(saved.FISH_AUDIO_API_KEY,'old');assert.equal(saved.FISH_AUDIO_VOICE_ID_A,'new-bob');
  }finally{await s.cleanup()}
});
test('cross-site requests cannot change local credentials',async()=>{
  const s=await setup();
  try{
    assert.equal((await s.handle(request(values,{origin:'https://evil.test'}))).status,403);
    assert.equal((await s.handle(request(values,{'sec-fetch-site':'cross-site'}))).status,403);
    assert.equal(s.env.FISH_AUDIO_API_KEY,undefined);
  }finally{await s.cleanup()}
});
test('invalid credentials, models and voice IDs cannot create an env file',async()=>{
  const s=await setup();
  try{
    for(const body of [{...values,key:'x\nINJECT=1'},{...values,voiceA:'bad id'},{...values,voiceB:''},{...values,model:'unknown'},null])assert.equal((await s.handle(request(body))).status,400);
    await assert.rejects(readFile(path.join(s.root,'.env')),{code:'ENOENT'});
  }finally{await s.cleanup()}
});
