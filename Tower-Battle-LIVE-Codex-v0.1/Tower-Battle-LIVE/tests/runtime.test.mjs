import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizedTower,currentTower} from '../scripts/runtime.mjs';
import {createEngine} from '../src/engine.mjs';
import {RULE_LIMITS} from '../src/rules.mjs';
test('updater recognizes legacy Tower state and latest theme while rejecting unrelated local services',()=>{
 assert.equal(recognizedTower(null),false);assert.equal(recognizedTower({app:'seguidor-arena',game:{phase:'waiting'}}),false);const old={game:createEngine().snapshot(),limits:RULE_LIMITS};assert.equal(recognizedTower(old),true);assert.equal(currentTower(old),false);assert.equal(currentTower({...old,app:'tower-battle',theme:{id:'krabs-plankton-v1',version:1}}),true);
});
