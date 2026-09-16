(function(){
  const key=RUN_CONFIG.storageKey+(new URLSearchParams(location.search).has('test')?'-test':'');
  let memory={};
  try { memory=JSON.parse(localStorage.getItem(key)||'{}')||{}; } catch (_) {}
  if(typeof memory!=='object'||Array.isArray(memory)) memory={};
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(memory));}catch(_){}};
  const day=(date)=>{const d=new Date(date);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
  const nickname=value=>Array.from(String(value||'跳跳羊').trim()||'跳跳羊').slice(0,10).join('');
  const id=memory.playerId||(memory.playerId='p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  // Replace this async adapter for a shared backend; demo records never masquerade as real players.
  window.RunStore={
    getAchievements:()=>Object.values(memory.achievements||{}),
    saveAchievement(record){memory.achievements||={};memory.achievements[record.id]=record;memory.achievement=record;save();},
    getAchievement:()=>memory.achievement||null,
    nickname, getProfile:()=>({name:nickname(memory.name),best:Number(memory.best)||0,muted:memory.muted!==false}),
    setProfile:values=>{Object.assign(memory,values);save();},
    async submit(result){
      const record={...result,name:nickname(result.name),playerId:id,date:new Date().toISOString(),eventId:RUN_CONFIG.eventId};
      memory.records=[...(Array.isArray(memory.records)?memory.records:[]),record].slice(-500);
      memory.best=Math.max(Number(memory.best)||0,record.score);save();return record;
    },
    async list(period='event'){
      const demos=[['薄荷小羊',7280,2520],['小橘子',5940,2080],['喜樂跑跑',3860,1120]].map(([name,score,distance],i)=>({name,score,distance,playerId:'demo-'+i,demo:true,date:new Date().toISOString(),eventId:RUN_CONFIG.eventId}));
      const rows=[...demos,...(Array.isArray(memory.records)?memory.records:[])].filter(r=>r.eventId===RUN_CONFIG.eventId&&(period!=='today'||day(r.date)===day(Date.now())));
      rows.sort((a,b)=>b.score-a.score||b.distance-a.distance||new Date(a.date)-new Date(b.date));
      const seen=new Set();return rows.filter(r=>{if(seen.has(r.playerId))return false;seen.add(r.playerId);return true;}).map((r,i)=>({...r,rank:i+1,mine:r.playerId===id}));
    }
  };
  // Preserve the previous 4,500 m trophy as a separately labelled legacy card.
  if(memory.achievement&&!memory.achievement.id){memory.achievements||={};memory.achievements.legacy={...memory.achievement,id:'legacy',title:'九星旅人 · 舊版紀念'};memory.achievement=memory.achievements.legacy;}
  save();
})();
