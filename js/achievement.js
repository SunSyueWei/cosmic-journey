/* A self-contained local PNG: no upload, account or external image required. */
window.AchievementCard={
 draw(canvas,record){
  if(record.planetIndex!=null){this.drawPlanet(canvas,record);return;}
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#071329');bg.addColorStop(.6,'#16355b');bg.addColorStop(1,'#0a122a');c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(let i=0;i<300;i++){const x=(Math.sin(i*73.1)*.5+.5)*w,y=(Math.sin(i*127.7)*.5+.5)*h;c.fillStyle=i%4?'#c3d9ef55':'#f5dfbaaa';c.fillRect(x,y,i%4?1:2,i%4?1:2);}
  c.strokeStyle='#d4b383';c.lineWidth=2;c.strokeRect(28,28,w-56,h-56);c.strokeStyle='#d4b38344';c.strokeRect(39,39,w-78,h-78);
  function label(value,y,size,color='#e5edf8'){c.fillStyle=color;c.font=`${size}px "PingFang TC", "Microsoft JhengHei", sans-serif`;c.textAlign='center';c.fillText(value,w/2,y,w-100);}
  label('THE COSMIC JOURNEY',100,20,'#c5d4e9');label('✧',235,95,'#ead0a5');
  label(record.id==='legacy'?'九星旅人 · 舊版紀念':'九 星 旅 人',323,60,'#f6dfb9');
  label('穿越九大行星 · 全星域探索完成',375,24,'#b6cbe5');
  label(record.name,459,38);label('我很渺小，卻走過了整片星海。',510,23,'#d4b98f');
  SpaceScene.planets.forEach((p,i)=>{const x=122+i*82;c.fillStyle=p.color;c.beginPath();c.arc(x,591,i===4?19:13,0,Math.PI*2);c.fill();if(i===5){c.strokeStyle=p.color;c.lineWidth=3;c.beginPath();c.ellipse(x,591,24,7,-.3,0,Math.PI*2);c.stroke();}c.fillStyle='#d6e3f5';c.font='17px sans-serif';c.textAlign='center';c.fillText(p.name,x,634);});
  label(`${record.distance.toLocaleString()} m`,747,64,'#f6dfb9');
  label(`積分 ${record.score.toLocaleString()}  ·  邀請卡 ${record.cards} 張`,800,27);
  label(`09 / 09 星球完成  ·  ${Math.floor(record.time/60)} 分 ${Math.floor(record.time%60)} 秒`,849,22,'#b8cce7');
  label('宇宙的奧秘與人生的意義',937,27);label('宇宙浩瀚，但你從不孤單。',980,21,'#d5b98f');label('台中青少年福音聚會 · '+new Date(record.date).toLocaleDateString('zh-TW'),1034,17,'#9bb4d1');
 },
 drawPlanet(canvas,record){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,index=record.planetIndex,p=SpaceScene.planets[index];
  const mottos=['微小的一步，是浩瀚旅程的開始。','穿過迷霧，我仍向著光前行。','在無垠宇宙中，發現家的珍貴。','越過荒原，勇氣留下了足跡。','風暴再大，也擋不住探索的心。','每一道光環，都是走過的證明。','在寒冷的遠方，守住心裡的光。','深入未知，遇見更勇敢的自己。','走到遙遠的邊界，我仍被記得。'];
  const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#050d20');bg.addColorStop(1,p.soil);c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(let i=0;i<240;i++){c.fillStyle=i%3?'#c8dcf044':p.color;c.fillRect((Math.sin(i*32.7)*.5+.5)*w,(Math.sin(i*77.2)*.5+.5)*h,i%7?1:3,i%7?1:3);}
  c.strokeStyle=p.color;c.lineWidth=2;c.strokeRect(28,28,w-56,h-56);
  const label=(t,y,size,color='#e6eefb')=>{c.fillStyle=color;c.font=`${size}px "PingFang TC",sans-serif`;c.textAlign='center';c.fillText(t,w/2,y,w-100);};
  label('PLANET COLLECTION  /  '+String(index+1).padStart(2,'0')+' OF 09',95,20,p.color);label(p.en,155,38,p.color);
  c.save();c.beginPath();c.arc(450,360,145,0,Math.PI*2);c.clip();c.fillStyle=p.color;c.fillRect(290,200,320,320);
  if([1,4,5,7].includes(index)){for(let i=0;i<15;i++){c.fillStyle=i%2?'#ffffff25':'#18203944';c.beginPath();c.ellipse(450,217+i*22,180,13,-.15,0,Math.PI*2);c.fill();}}
  else if(index===2){for(let i=0;i<16;i++){c.fillStyle='#83b497';c.beginPath();c.ellipse(330+(Math.sin(i*7)+1)*130,250+(Math.cos(i*11)+1)*120,25,35,i,0,Math.PI*2);c.fill();}}
  else{for(let i=0;i<26;i++){c.fillStyle='#15203933';c.beginPath();c.arc(310+(Math.sin(i*13)+1)*150,220+(Math.cos(i*8)+1)*140,5+i%19,0,Math.PI*2);c.fill();}}
  const shade=c.createLinearGradient(310,220,595,470);shade.addColorStop(0,'#ffffff22');shade.addColorStop(1,'#02091cdd');c.fillStyle=shade;c.fillRect(290,200,320,320);c.restore();
  if(index===5||index===6){c.strokeStyle=p.color;c.lineWidth=index===5?14:3;c.beginPath();c.ellipse(450,360,205,52,index===5?-.35:-1,0,Math.PI*2);c.stroke();}
  label(p.name+'探索者',588,58);label(p.land+' · '+(index===0?'啟航紀念':'抵達紀念'),637,25,p.color);
  label(record.name,712,34);label(mottos[index],765,22,p.color);
  label(`${record.distance.toLocaleString()} m  ·  ${record.score.toLocaleString()} 分`,843,34);label(`邀請卡 ${record.cards} 張  ·  ${Math.floor(record.time/60)} 分 ${Math.floor(record.time%60)} 秒`,892,22);
  label('宇宙的奧秘與人生的意義',974,25);label('台中青少年福音聚會 · '+new Date(record.date).toLocaleDateString('zh-TW'),1027,18,p.color);
 },
 download(canvas,record){const link=document.createElement('a');link.download=(record?.title||'九星旅人')+'-成就卡.png';link.href=canvas.toDataURL('image/png');link.click();}
};
