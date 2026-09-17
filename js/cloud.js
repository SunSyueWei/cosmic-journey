/* Supabase REST adapter. Auth sessions stay on-device; database writes only use validated RPCs. */
window.CloudScores=(()=>{
 const config=window.RUN_CLOUD||{},testMode=new URLSearchParams(location.search).has('test');
 const enabled=!!(config.enabled&&config.url&&config.publishableKey&&!testMode);
 const key=RUN_CONFIG.storageKey+'-auth-'+(config.url||'');
 let session=null,authPending=null;
 try{session=JSON.parse(localStorage.getItem(key)||'null');}catch(_){}
 async function request(path,body,token){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
   const response=await fetch(config.url+path,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:controller.signal});
   const data=await response.json();if(!response.ok)throw new Error(data.msg||data.message||data.error_description||'連線失敗');return data;
  }finally{clearTimeout(timer);}
 }
 async function authenticate(){
  if(session?.access_token&&session.expires_at>Date.now()/1000+60)return session;
  if(authPending)return authPending;
  authPending=(async()=>{
   // Do not silently discard an existing identity if token refresh fails.
   const captchaToken=session?.refresh_token?undefined:await window.RunCaptcha?.token();
   const data=session?.refresh_token?await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token}):await request('/auth/v1/signup',{data:{game:'cosmic-journey'},...(captchaToken?{gotrue_meta_security:{captcha_token:captchaToken}}:{})});
   session={...data,expires_at:data.expires_at||Date.now()/1000+data.expires_in};
   try{localStorage.setItem(key,JSON.stringify(session));}catch(_){}return session;
  })();try{return await authPending;}finally{authPending=null;}
 }
 async function rpc(name,payload){const auth=await authenticate();return request('/rest/v1/rpc/'+name,payload,auth.access_token);}
 return {
  enabled,
  async begin(){if(!enabled)return null;return rpc('cosmic_begin_run',{});},
  async submit(result){return rpc('cosmic_submit_run',{p_run:result.sessionId,p_name:result.name,p_distance:result.exactDistance,p_seconds:result.seconds,p_before:result.cardsBefore,p_after:result.cards-result.cardsBefore});},
  // Leaderboard rows are intentionally public; viewing them must not create an auth identity.
  async list(period){const token=session?.access_token&&session.expires_at>Date.now()/1000+60?session.access_token:undefined;const rows=await request('/rest/v1/rpc/cosmic_leaderboard',{p_period:period},token);return rows.map(r=>({...r,score:Number(r.score),distance:Number(r.distance),rank:Number(r.rank),demo:false}));},
  // Deletion must never create a new anonymous identity just to answer a click.
  async deleteMine(){if(!session?.access_token)return 0;return rpc('cosmic_delete_my_runs',{});}
 };
})();
