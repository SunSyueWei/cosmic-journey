(()=>{
 'use strict';
 const C=RUN_CONFIG,$=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
 let width=960,height=500,ground=400,state='ready',run,muted=false,tab='today',last=0,accumulator=0,toastTime=0;
 const player={x:95,y:0,vy:0,w:38,h:43,previousY:0};
 function resize(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;height=500;width=rect.width/rect.height*height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);ground=height-83;player.x=Math.min(130,width*.21);}
 function reset(){run={distance:0,previousDistance:0,score:0,cards:0,cardsBefore:0,time:0,speed:C.startSpeed,arrived:false,nextCard:1,burstRemaining:0,milestone:0,obstacles:[],collectibles:[],particles:[],spawn:2.2,cardTimer:1.4,safe:0};player.y=0;player.previousY=0;player.vy=0;accumulator=0;toastTime=0;$('toast').textContent='';RunAudio.setSpeed(C.startSpeed);updateHUD();}
 function panels(name){['start','pause','end'].forEach(n=>$(n+'-panel').hidden=n!==name);}
 async function start(){
   if(state==='starting')return;RunAudio.unlock();RunAudio.music(false);
   if($('achievement').open)$('achievement').close();
   $('achievement-notice').getAnimations?.().forEach(animation=>animation.cancel());$('achievement-notice').textContent='';
   const name=RunStore.nickname($('nickname').value);$('nickname').value=name;RunStore.setProfile({name});reset();RunAudio.reset();RunAudio.music(true);state='starting';
   const button=$('start');button.disabled=true;const label=button.textContent;button.textContent='準備出發…';
   try{run.sessionId=await RunStore.beginRun();}catch(_){run.sessionId=null;run.cloudError=true;}
   button.disabled=false;button.textContent=label;state='running';panels('');$('pause').disabled=false;last=performance.now();RunAudio.music(true);canvas.focus();savePlanetCard(0);
   toast(run.cloudError?'目前無法連線 · 本局僅存本機':'水星啟航卡已收藏 · 點一下跳躍',3);
   if(document.hidden)pause();
 }
 function toast(message,seconds=2){$('toast').textContent=message;toastTime=seconds;}
 function jump(){if(state!=='running')return;if(player.y<=.5){player.vy=C.jumpVelocity;RunAudio.jump();}}
 function pause(){if(state!=='running')return;state='paused';RunAudio.music(false);panels('pause');$('resume').focus();}
 function resume(){if(state!=='paused')return;state='running';panels('');last=performance.now();accumulator=0;RunAudio.music(true);canvas.focus();}
 async function finish(){if(state!=='running')return;state='over';RunAudio.music(false);RunAudio.hit();$('pause').disabled=true;panels('end');updateHUD();const finishedRun=run;const score=Math.floor(run.score);$('final-score').textContent=score.toLocaleString();$('result-detail').textContent=`跑了 ${Math.floor(run.distance).toLocaleString()} m · 收集 ${run.cards} 張邀請卡`;$('end-badge').textContent=run.arrived?'成功抵達福音聚會！':'每一步都算數';$('end-title').textContent=run.arrived?'好消息，成功送達！':'再跳一下，就更遠！';$('best-score').textContent=Math.max(score,RunStore.getProfile().best).toLocaleString();$('rank-summary').textContent='正在記錄成績…';$('end-panel').querySelector('.restart').focus();const endCard=cardRecord(Math.min(9,run.nextCard-1));RunStore.saveAchievement(endCard);showAchievement(endCard);try{await RunStore.submit({name:RunStore.getProfile().name,score,distance:Math.floor(run.distance),cards:run.cards,arrived:run.arrived,sessionId:run.sessionId,seconds:run.time,exactDistance:run.distance,cardsBefore:run.cardsBefore});const rows=await RunStore.list('event');if(state==='over'&&run===finishedRun){const mine=rows.find(r=>r.mine);$('rank-summary').textContent=mine?`${RunStore.cloudEnabled?'共用':'本機'}活動排行第 ${mine.rank} 名 · 挑戰下一個紀錄！`:'已保存成績。';}}catch(_){if(run===finishedRun)$('rank-summary').textContent='成績已留在本機，但未能上傳共用排行。';}}
 function arrival(){run.arrived=true;run.score+=C.arrivalBonus;run.safe=3;run.obstacles=[];run.spawn=3.5;toast('成功抵達福音聚會！\n宇宙浩瀚，但你從不孤單。\n+2,000 分 · 積分 ×1.5',3.5);RunAudio.cheer();for(let i=0;i<75;i++)run.particles.push({x:Math.random()*width,y:Math.random()*180,vx:(Math.random()-.5)*130,vy:40+Math.random()*100,color:['#9dc9ff','#fff0ca','#b7a3e0','#f2c7ab'][i%4],life:3.5});}
 function updateHUD(){const planet=SpaceScene.planets[SpaceScene.phase(run.distance).index];$('planet-name').textContent=planet.name+' · '+planet.land;$('planet-en').textContent=planet.en;$('velocity').textContent=(run.speed/C.startSpeed).toFixed(2)+'×';$('score').textContent=Math.floor(run.score).toString().padStart(5,'0');$('distance').textContent=Math.floor(run.distance).toLocaleString();$('cards').textContent=run.cards;$('remaining').textContent=run.arrived?'無限挑戰 · 積分 ×1.5':`還有 ${Math.max(0,Math.ceil(C.venueDistance-run.distance)).toLocaleString()} m`;$('route-label').textContent=run.arrived?'已抵達聚會 · 繼續探索星海':'目的地：福音聚會';$('progress').style.width=`${Math.min(100,run.distance/C.venueDistance*100)}%`;}
 // Fixed 120 Hz simulation avoids frame-rate dependent jumps and tunnelling.
 function step(dt){
   run.previousDistance=run.distance;player.previousY=player.y;
   run.time+=dt;run.speed+=(run.arrived?C.afterAcceleration:C.acceleration)*dt;RunAudio.setSpeed(run.speed,dt);const metres=run.speed*dt*C.metresPerPixel,old=run.distance;run.distance+=metres;
   const before=Math.max(0,Math.min(metres,C.venueDistance-old));run.score+=before+(metres-before)*C.afterMultiplier;
   if(!run.arrived&&run.distance>=C.venueDistance)arrival();
   if(run.arrived){const milestone=Math.floor((run.distance-C.venueDistance)/C.milestoneDistance);if(milestone>run.milestone){run.score+=(milestone-run.milestone)*C.milestoneBonus;run.milestone=milestone;toast(`又前進 500 m！ +${C.milestoneBonus} 分`);}}
   player.vy-=C.gravity*dt;player.y+=player.vy*dt;if(player.y<0){player.y=0;player.vy=0;}
   run.safe=Math.max(0,run.safe-dt);run.spawn-=dt;
   if(run.spawn<=0){
     const plan=ObstacleDirector.next(run),lastObstacle=run.obstacles.at(-1);
     let x=width+35;
     if(lastObstacle)x=Math.max(x,lastObstacle.x+lastObstacle.w+ObstacleDirector.minimumSpacing(run.speed,plan.w));
     run.obstacles.push({x,w:plan.w,h:plan.h,kind:plan.kind,rotation:0});
     run.spawn=plan.delay;
   }
   run.cardTimer-=dt;if(run.cardTimer<=0){run.collectibles.push({x:width+30,y:75+Math.random()*30});run.cardTimer=1.25+Math.random()*1.3;}
   const px=player.x+5,py=ground-player.y-player.h+4;
   for(const obstacle of run.obstacles){
     const previousX=obstacle.x;obstacle.x-=run.speed*dt;obstacle.rotation+=dt*6;
     // Sweep from the old position to the new one: very fast objects cannot tunnel through.
     const crosses=obstacle.x+3<px+player.w-10&&previousX+obstacle.w-3>px;
     const travel=previousX-obstacle.x;
     const impact=Math.max(0,Math.min(1,(previousX+3-(px+player.w-10))/Math.max(.001,travel)));
     const impactY=player.previousY+(player.y-player.previousY)*impact;
     if(run.safe<=0&&crosses&&impactY<obstacle.h-5){finish();return;}
   }
   for(const card of run.collectibles){card.x-=run.speed*dt;if(!card.taken&&px<card.x+24&&px+player.w-10>card.x&&py<ground-card.y+18&&py+player.h>ground-card.y){card.taken=true;run.cards++;if(!run.arrived)run.cardsBefore++;run.score+=C.cardPoints*(run.arrived?C.afterMultiplier:1);RunAudio.card();}}
   run.obstacles=run.obstacles.filter(o=>o.x+o.w>-20);run.collectibles=run.collectibles.filter(c=>c.x>-40&&!c.taken);
   for(const p of run.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}run.particles=run.particles.filter(p=>p.life>0);
   if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').textContent='';}
   if(run.nextCard<=9&&run.distance>=C.planetDistance*run.nextCard){const index=run.nextCard++;unlockAchievement(index);}
 }
 let selectedCard=null;
 function cardRecord(index){return {id:index<9?'planet-'+index:'grand',planetIndex:index<9?index:null,title:index<9?SpaceScene.planets[index].name+'探索者':'九星旅人',name:RunStore.getProfile().name,distance:Math.floor(run.distance),score:Math.floor(run.score),cards:run.cards,time:run.time,date:new Date().toISOString()};}
 function savePlanetCard(index){const record=cardRecord(index);RunStore.saveAchievement(record);$('last-achievement').hidden=false;return record;}
 function showAchievement(record){
   selectedCard=record;AchievementCard.draw($('achievement-card'),record);
   $('achievement-title').textContent=record.title||'九星旅人';
   $('achievement-caption').textContent=record.planetIndex!=null?'新的世界，新的足跡。你的星球收藏又多了一張。':'你穿越了整片星海。這一刻，值得被記住。';
   $('achievement-card').setAttribute('aria-label',`${record.name}，${record.title}，${record.distance} 公尺，${record.score} 分`);
   $('achievement-status').textContent='下載成就卡，或直接截圖分享給朋友。';
   $('continue-achievement').textContent=state==='achievement'?'繼續探索 →':'關閉收藏冊';
   const album=$('card-album');album.replaceChildren();
   for(const card of RunStore.getAchievements()){const button=document.createElement('button');button.className='outline';button.textContent=card.title;button.setAttribute('aria-pressed',String(card.id===record.id));button.onclick=()=>showAchievement(card);album.append(button);}
   if(!$('achievement').open)$('achievement').showModal();
 }
 function unlockAchievement(index){
   run.achievement=savePlanetCard(index);
   const notice=$('achievement-notice');notice.textContent='✧ 已收藏 · '+run.achievement.title;
   notice.getAnimations?.().forEach(animation=>animation.cancel());
   notice.animate?.([{opacity:0},{opacity:.75,offset:.15},{opacity:.75,offset:.65},{opacity:0}],{duration:3200,fill:'forwards'});
 }
 $('save-achievement').onclick=()=>{try{AchievementCard.download($('achievement-card'),selectedCard);$('achievement-status').textContent='已準備 PNG 下載；也可以直接截圖保留。';}catch(_){$('achievement-status').textContent='此瀏覽器未能下載，請直接截圖保存成就卡。';}};
 $('continue-achievement').onclick=()=>$('achievement').close();
 $('achievement').addEventListener('close',()=>{if(state==='achievement'){state='paused';if(document.hidden){panels('pause');}else resume();}});
 $('last-achievement').onclick=()=>{pause();const record=RunStore.getAchievement();if(record)showAchievement(record);};
 $('last-achievement').hidden=!RunStore.getAchievement();
 function round(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
 function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 function text(label,x,y,size=12,color='#507352'){ctx.fillStyle=color;ctx.font=`600 ${size}px "PingFang TC",sans-serif`;ctx.textAlign='center';ctx.fillText(label,x,y);}
 // A tiny astronaut against planet-scale scenery. Visuals keep the original collision footprint.
 function astronaut(x,y){
   ctx.save();ctx.translate(x,y);
   const stride=state==='running'&&player.y===0?Math.sin(run.time*18)*4:0;
   round(-16,-27,10,21,3,'#7c98bb');
   ctx.strokeStyle='#d8e7f5';ctx.lineWidth=6;ctx.lineCap='round';
   for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(-5+i*13,-10);ctx.lineTo(-6+i*15+(i?stride:-stride),0);ctx.stroke();}
   round(-10,-28,25,20,6,'#e1edf6');round(-5,-26,13,8,2,'#d99c70');
   ellipse(4,-34,14,13,'#dce9f6');ellipse(8,-34,10,8,'#172e52');ellipse(11,-37,4,2,'#739dbd');
   ctx.strokeStyle='#a6c9e9';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-12,-29);ctx.lineTo(-17,-48);ctx.stroke();ellipse(-17,-48,2,2,'#e9bd8e');ctx.restore();
 }
 function venue(x){
   ctx.save();ctx.translate(x,ground);
   const glow=ctx.createLinearGradient(0,-160,0,0);glow.addColorStop(0,'#9bcaff00');glow.addColorStop(1,'#9bcaff45');ctx.fillStyle=glow;ctx.fillRect(-55,-160,110,160);
   ctx.strokeStyle='#aaceee';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-61,42,61,0,Math.PI,Math.PI*2);ctx.lineTo(42,0);ctx.moveTo(-42,-61);ctx.lineTo(-42,0);ctx.stroke();
   text('福音聚會',0,-139,13,'#f2d8b8');text('你從不孤單',0,-121,10,'#e2eefd');round(-53,-4,106,4,2,'#aaceee');ctx.restore();
 }
 function draw(){
   // Interpolate between fixed simulation ticks so 60/90/120 Hz displays all scroll smoothly.
   const alpha=state==='running'?accumulator/(1/120):1;
   const renderDistance=run.previousDistance+(run.distance-run.previousDistance)*alpha;
   const renderY=player.previousY+(player.y-player.previousY)*alpha;
   SpaceScene.draw(ctx,width,height,ground,renderDistance);
   const lag=(run.distance-renderDistance)/C.metresPerPixel;
   const vx=player.x+(C.venueDistance-renderDistance)/C.metresPerPixel;
   if(vx<width+80&&vx>-80)venue(vx);
   for(const c of run.collectibles){const x=c.x+lag;round(x,ground-c.y,25,18,3,'#f8dfb4');ctx.strokeStyle='#be8d62';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+2,ground-c.y+2);ctx.lineTo(x+12,ground-c.y+10);ctx.lineTo(x+23,ground-c.y+2);ctx.stroke();}
   for(const o of run.obstacles){const x=o.x+lag;if(o.kind===0){
     ctx.fillStyle='#8991a9';ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x+3,ground-26);ctx.lineTo(x+14,ground-40);ctx.lineTo(x+27,ground-32);ctx.lineTo(x+33,ground);ctx.closePath();ctx.fill();
     ctx.strokeStyle='#cbd5e5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+4,ground-25);ctx.lineTo(x+14,ground-38);ctx.lineTo(x+21,ground-17);ctx.stroke();
   }else if(o.kind===1){ellipse(x+32,ground-2,32,6,'#8fbce5');ellipse(x+32,ground-2,26,4,'#070f25');}
   else{ctx.save();ctx.translate(x+15,ground-15);ctx.rotate(o.rotation);ellipse(0,0,15,15,'#c2a298');ellipse(-4,-4,5,4,'#765f6c');ellipse(7,5,3,3,'#8d7580');ctx.restore();}}
   ellipse(player.x+16,ground+5,20,3,'#02071566');astronaut(player.x+17,ground-renderY);
   if(state==='over')text('✦',player.x+33,ground-renderY-57,24,'#e6be98');
   for(const p of run.particles){ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,7);}
 }
 let hudElapsed=0;
 function frame(now){const dt=Math.min((now-last)/1000||0,.05);last=now;if(state==='running'){accumulator+=dt;while(accumulator>=1/120&&state==='running'){step(1/120);accumulator-=1/120;}hudElapsed+=dt;if(hudElapsed>=.1){updateHUD();hudElapsed=0;}}draw();requestAnimationFrame(frame);}
 async function showRanking(){pause();$('ranking').showModal();await renderRanking();}
 let rankingRequest=0;
 async function renderRanking(){
   const request=++rankingRequest,list=$('rank-list');list.replaceChildren();$('ranking-note').textContent=RunStore.cloudEnabled?'共用排行榜 · 正在取得最新成績…':'本機排行榜 · 示範選手已標記，尚未跨手機連線。';
   try{const rows=await RunStore.list(tab);if(request!==rankingRequest)return;
   if(RunStore.cloudEnabled)$('ranking-note').textContent='共用排行榜 · 台灣時間 · 前 100 名及你的排名';
   if(!rows.length){list.textContent='還沒有成績，來當第一位星海旅人！';return;}
   rows.forEach(r=>{const row=document.createElement('div');row.className='rank-row'+(r.mine?' mine':'');const rank=document.createElement('b');rank.textContent=String(r.rank).padStart(2,'0');const name=document.createElement('div');name.textContent=r.name+(r.mine?'（你）':'');const detail=document.createElement('small');detail.textContent=`${r.demo?'示範 · ':''}${r.distance.toLocaleString()} m · ${r.distance>=C.venueDistance?'已抵達':'途中'}`;name.append(detail);const score=document.createElement('strong');score.textContent=r.score.toLocaleString();row.append(rank,name,score);list.append(row);});
   }catch(_){if(request===rankingRequest){$('ranking-note').textContent='共用排行榜暫時無法連線';list.textContent='請稍後切換排行頁籤重試；本機紀錄仍會保留。';}}
 }
 function refreshPrivacy(){
   const enabled=RunStore.cloudEnabled,profile=RunStore.getProfile();
   $('cloud-consent-label').hidden=!enabled;
   $('cloud-consent').checked=profile.cloudConsent;
   $('delete-cloud-scores').hidden=!enabled;
   $('privacy-summary').textContent=enabled&&profile.cloudConsent?'已參加共用排行榜；公開暱稱、最高分與距離。':'目前分數與收藏卡只保存在這個瀏覽器。';
 }
 $('cloud-consent').addEventListener('change',()=>{
   const checked=$('cloud-consent').checked;RunStore.setProfile({cloudConsent:checked});
   $('privacy-status').textContent=checked?'已加入共用排行榜；下一局開始時會上傳成績。':'已停止上傳新成績；既有雲端成績仍可按下方按鈕刪除。';
   refreshPrivacy();
 });
 $('delete-cloud-scores').onclick=async()=>{
   if(!RunStore.cloudEnabled)return;
   if(!window.confirm('確定刪除這個瀏覽器匿名身分的所有雲端成績嗎？此動作無法復原。'))return;
   const button=$('delete-cloud-scores');button.disabled=true;$('privacy-status').textContent='正在刪除…';
   try{const count=await RunStore.deleteCloudScores();$('privacy-status').textContent=`已刪除 ${Number(count)||0} 筆雲端成績。`;}catch(_){$('privacy-status').textContent='刪除失敗，請稍後再試或聯絡主辦人。';}
   finally{button.disabled=false;}
 };
 $('start').onclick=start;document.querySelectorAll('.restart').forEach(b=>b.onclick=start);$('pause').onclick=pause;$('resume').onclick=resume;$('leaderboard').onclick=showRanking;$('end-ranking').onclick=showRanking;$('close-ranking').onclick=()=>$('ranking').close();
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));renderRanking();});
 function soundUI(){$('sound').innerHTML=`♫ <span>${muted?'聲音關閉':'聲音開啟'}</span>`;$('sound').setAttribute('aria-label',muted?'開啟聲音':'關閉聲音');$('sound').setAttribute('aria-pressed',String(!muted));RunAudio.mute(muted);}
 $('sound').onclick=()=>{RunAudio.unlock();muted=!muted;RunStore.setProfile({muted});soundUI();};
 canvas.tabIndex=0;canvas.addEventListener('pointerdown',e=>{e.preventDefault();RunAudio.unlock();jump();});
 document.addEventListener('keydown',e=>{if(e.target.matches('input,button')||$('ranking').open||$('achievement').open)return;if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(!e.repeat)jump();}if(e.code==='Escape'||e.code==='KeyP'){if(state==='running')pause();else if(state==='paused')resume();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('resize',resize);
 $('nickname').value=RunStore.getProfile().name;$('nickname').addEventListener('change',()=>{$('nickname').value=RunStore.nickname($('nickname').value);});
 resize();reset();soundUI();refreshPrivacy();requestAnimationFrame(frame);
 if(window.ResizeObserver)new ResizeObserver(resize).observe(canvas);
 // Explicit opt-in diagnostic surface, absent in normal play.
 if(new URLSearchParams(location.search).has('test'))window.RunTest={frame,start,jump,step,finish,pause,resume,get state(){return state;},get run(){return run;},get player(){return player;},render:()=>{updateHUD();draw();}};
 if(new URLSearchParams(location.search).has('test')){
   const preview=document.createElement('button');preview.className='outline';preview.textContent='測試：九星成就流程';
   preview.onclick=async()=>{await start();run.nextCard=9;run.distance=C.planetDistance*9-.01;run.previousDistance=run.distance;run.arrived=true;run.score=9200;run.time=95;run.cards=12;step(1/120);};
   $('last-achievement').after(preview);
   SpaceScene.planets.forEach((planet,index)=>{const button=document.createElement('button');button.className='outline';button.textContent='測試卡片：'+planet.name;button.onclick=async()=>{await start();run.distance=index*C.planetDistance;run.nextCard=index+1;unlockAchievement(index);};preview.after(button);});
 }
})();
