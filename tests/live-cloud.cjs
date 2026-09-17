// Explicit real-service test: creates two temporary anonymous identities and
// deletes only their test runs. Tokens stay in process memory and are never logged.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const box={window:{}};vm.runInNewContext(fs.readFileSync('js/cloud-config.js','utf8'),box);
const {url,publishableKey}=box.window.RUN_CLOUD;
async function call(path,body,token,method='POST'){
 const response=await fetch(url+path,{method,headers:{apikey:publishableKey,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 return {status:response.status,data:await response.json()};
}
const rpc=(name,body,token)=>call('/rest/v1/rpc/'+name,body,token);
(async()=>{
 const settings=await call('/auth/v1/settings',undefined,undefined,'GET');assert.equal(settings.status,200);assert.equal(settings.data.external.anonymous_users,true);console.log('PASS anonymous sign-ins enabled');
 const board=await rpc('cosmic_leaderboard',{p_period:'event'});assert.equal(board.status,200);assert(Array.isArray(board.data));console.log('PASS public leaderboard');
 for(const name of ['cosmic_begin_run','cosmic_delete_my_runs'])assert((await rpc(name,{})).status>=400);
 assert((await call('/rest/v1/cosmic_runs?select=id&limit=1',undefined,undefined,'GET')).status>=400);console.log('PASS unauthenticated writes and raw table reads denied');
 const sessions=[];
 try{
  for(let i=0;i<2;i++){const r=await call('/auth/v1/signup',{data:{game:'cosmic-journey',purpose:'permission-test'}});assert.equal(r.status,200,`signup ${r.status}: ${r.data.error_code||''}`);sessions.push(r.data.access_token);}
  const [a,b]=sessions;const begin=await rpc('cosmic_begin_run',{},a);assert.equal(begin.status,200);const id=begin.data;
  const payload={p_run:id,p_name:'權限測試',p_distance:25.308,p_seconds:1,p_before:0,p_after:0};
  assert((await rpc('cosmic_submit_run',payload,b)).status>=400,'another player cannot submit your run');
  assert((await rpc('cosmic_submit_run',{...payload,p_distance:999999},a)).status>=400,'impossible distance denied');
  assert((await call('/rest/v1/cosmic_runs?select=id&limit=1',undefined,a,'GET')).status>=400);
  assert((await call('/rest/v1/cosmic_runs',{user_id:'00000000-0000-0000-0000-000000000000',score:999999},a)).status>=400);
  const valid=await rpc('cosmic_submit_run',payload,a);assert.equal(valid.status,200);assert.equal(valid.data,25);
  assert.equal((await rpc('cosmic_submit_run',{...payload,p_before:1},a)).data,25,'retry cannot change score');
  const otherDelete=await rpc('cosmic_delete_my_runs',{},b);assert.equal(otherDelete.status,200);assert.equal(otherDelete.data,0);
  const mine=await rpc('cosmic_leaderboard',{p_period:'today'},a);assert(mine.data.some(r=>r.mine&&r.score===25));assert(mine.data.every(r=>Object.keys(r).every(k=>['name','score','distance','rank','mine'].includes(k))));
  console.log('PASS server score, replay protection, identity isolation, private column protection, today ranking');
 }finally{for(const token of sessions){const r=await rpc('cosmic_delete_my_runs',{},token);assert.equal(r.status,200);console.log('PASS test run cleanup');}}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
