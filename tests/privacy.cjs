const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=new Map(),calls=[];
const box={RUN_CONFIG:{storageKey:'privacy-test',eventId:'good-news-2026'},URLSearchParams,location:{search:''},CloudScores:{enabled:true,begin:async()=>{calls.push('begin');return 'run-id';},submit:async()=>calls.push('submit'),list:async()=>[],deleteMine:async()=>{calls.push('delete');return 1;}},localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}};
box.window=box;vm.createContext(box);vm.runInContext(fs.readFileSync(`${__dirname}/../js/storage.js`,'utf8'),box);
(async()=>{
 assert.equal(await box.RunStore.beginRun(),null,'no anonymous session before opt-in');
 await box.RunStore.submit({name:'星海旅人',score:10,distance:10,cards:0});
 assert.deepEqual(calls,[],'local-only play does not call the cloud adapter');
 box.RunStore.setProfile({cloudConsent:true});
 assert.equal(await box.RunStore.beginRun(),'run-id');
 await box.RunStore.submit({name:'星海旅人',score:20,distance:20,cards:0,sessionId:'run-id'});
 assert.deepEqual(calls,['begin','submit']);
 assert.equal(await box.RunStore.deleteCloudScores(),1);
 assert.deepEqual(calls,['begin','submit','delete']);
 console.log('PASS: shared leaderboard is explicit opt-in; local-only runs never upload; deletion delegates to the cloud adapter.');
})();
