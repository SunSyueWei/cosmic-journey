/* Only the public site key belongs in this file. Configure the secret in Supabase. */
window.RunCaptcha=(()=>{
 const siteKey=''; // Cloudflare Turnstile production site key; never the secret key.
 let loader,pending;
 function load(){
  if(window.turnstile)return Promise.resolve();
  if(loader)return loader;
  loader=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
   const timer=setTimeout(()=>{script.remove();loader=null;reject(new Error('驗證服務載入逾時'));},15000);
   script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();loader=null;reject(new Error('驗證服務無法載入'));};document.head.append(script);
  });return loader;
 }
 return {enabled:!!siteKey,
  async token(){
   if(!siteKey)return undefined;
   if(pending)return pending;
   pending=(async()=>{
    await load();
    return new Promise((resolve,reject)=>{
     const dialog=document.getElementById('captcha-dialog'),mount=document.getElementById('captcha-widget');let widget,done=false;
     const finish=(error,token)=>{if(done)return;done=true;clearTimeout(timer);dialog.removeEventListener('close',cancel);if(widget!==undefined)window.turnstile.remove(widget);dialog.close();error?reject(error):resolve(token);};
     const cancel=()=>finish(new Error('已取消驗證'));
     const timer=setTimeout(()=>finish(new Error('驗證逾時，請重新開始')),120000);
     document.getElementById('captcha-cancel').onclick=cancel;dialog.addEventListener('close',cancel);dialog.showModal();
     try{widget=window.turnstile.render(mount,{sitekey:siteKey,theme:'dark',size:'flexible',callback:token=>finish(null,token),'error-callback':()=>finish(new Error('驗證失敗，請重試')),'expired-callback':()=>finish(new Error('驗證已過期，請重試'))});}catch(error){finish(error);}
    });
   })();try{return await pending;}finally{pending=null;}
  }
 };
})();
