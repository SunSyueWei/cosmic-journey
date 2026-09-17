const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const calls=[],data=new Map();let fail=false;
const box={URLSearchParams,location:{search:''},RUN_CONFIG:{storageKey:'test'},RUN_CLOUD:{enabled:true,url:'https://example.supabase.co',publishableKey:'sb_publishable_test'},AbortController,setTimeout,clearTimeout,localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},fetch:async(url,options)=>{
 calls.push({url,options});if(fail)return {ok:false,json:async()=>({message:'unavailable'})};
 if(url.endsWith('/signup'))return {ok:true,json:async()=>({access_token:'user-jwt',refresh_token:'refresh-token',expires_in:3600})};
 if(url.endsWith('cosmic_begin_run'))return {ok:true,json:async()=>'run-uuid'};
 if(url.endsWith('cosmic_submit_run'))return {ok:true,json:async()=>123};
 if(url.endsWith('cosmic_delete_my_runs'))return {ok:true,json:async()=>2};
 return {ok:true,json:async()=>[{name:'旅人',score:'123',distance:'123',rank:'1',mine:true}]};
}};box.window=box;vm.createContext(box);vm.runInContext(fs.readFileSync(`${__dirname}/../js/cloud.js`,'utf8'),box);
(async()=>{
 box.RunCaptcha={token:async()=> 'test-captcha-token'};
 const api=box.CloudScores;assert(api.enabled);const results=await Promise.all([api.begin(),api.list('event')]);assert.equal(results[0],'run-uuid');assert.equal(results[1][0].rank,1);
 assert.equal(JSON.parse(calls.find(c=>c.url.endsWith('/signup')).options.body).gotrue_meta_security.captcha_token,'test-captcha-token');
 assert.equal(calls.filter(c=>c.url.endsWith('/signup')).length,1);
 assert(!calls[0].options.headers.Authorization);assert(!calls[1].options.headers.Authorization,'viewing a board does not need a token');
 await api.submit({sessionId:'run-uuid',name:'旅人',exactDistance:123.4,seconds:4.8,cardsBefore:2,cards:3});
 const payload=JSON.parse(calls.at(-1).options.body);assert.equal(payload.p_before,2);assert.equal(payload.p_after,1);assert(!('score' in payload));
 assert.equal(await api.deleteMine(),2);assert.equal(calls.at(-1).options.headers.Authorization,'Bearer user-jwt');
 fail=true;await assert.rejects(api.list('today'),/unavailable/);
 box.location.search='?test=1';vm.runInContext(fs.readFileSync(`${__dirname}/../js/cloud.js`,'utf8'),box);assert.equal(box.CloudScores.enabled,false);assert.equal(await box.CloudScores.begin(),null);
 console.log('PASS: anonymous auth, one concurrent signup, user token headers, server score calculation payload, visible network failure, isolated test mode.');
})();
