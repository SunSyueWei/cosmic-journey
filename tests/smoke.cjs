const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const saved=new Map();
function boot(){
 const elements=new Map();const context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
 function el(id){if(!elements.has(id))elements.set(id,{value:'',style:{},dataset:{},children:[],listeners:{},textContent:'',hidden:false,setAttribute(){},addEventListener(type,fn){this.listeners[type]=fn;},after(){},focus(){},matches(){return false;},querySelector(){return el('restart');},append(...v){this.children.push(...v);},replaceChildren(){this.children=[];},click(){},toDataURL:()=> 'data:image/png;base64,test',getBoundingClientRect:()=>({width:390,height:480}),getContext:()=>context,showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();}});return elements.get(id);}
 const box={console,Date,Math,URLSearchParams,performance:{now:()=>0},devicePixelRatio:1,location:{search:'?test=1'},setTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame(){},addEventListener(){},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},createElement:()=>el('child'+Math.random())}};box.window=box;vm.createContext(box);
 for(const file of ['config','storage','audio','space','achievement','obstacles','game'])vm.runInContext(fs.readFileSync(`${__dirname}/../js/${file}.js`,'utf8'),box,{filename:file});return {box,t:box.RunTest,el};
}
(async()=>{
 let {box,t,el}=boot();await t.start();assert.equal(t.state,'running');t.jump();t.step(1/120);assert(t.player.y>0);const vy=t.player.vy;t.jump();assert.equal(t.player.vy,vy,'no double jump');
 t.pause();assert.equal(t.state,'paused');t.resume();assert.equal(t.state,'running');
 await t.start();t.run.collectibles=[{x:t.player.x+8,y:30}];t.step(1/120);assert.equal(t.run.cards,1);assert(t.run.score>=100);
 for(let kind=0;kind<3;kind++){await t.start();t.run.obstacles=[{x:t.player.x,w:64,h:kind===1?8:40,kind,rotation:0}];t.step(1/120);assert.equal(t.state,'over',`collision ${kind}`);await Promise.resolve();}
 await t.start();t.run.distance=999.99;t.run.score=999.99;t.step(1/120);assert(t.run.arrived);assert.equal(t.state,'running');el('achievement').close();assert(t.run.score>=3000);assert(t.run.particles.length>0);assert.equal(t.run.obstacles.length,0);
 const score=t.run.score,distance=t.run.distance;t.step(1/120);assert(Math.abs((t.run.score-score)/(t.run.distance-distance)-1.5)<1e-6);
 t.run.distance=1499.99;const old=t.run.score;t.step(1/120);assert(t.run.score-old>=500);t.render();assert(el('remaining').textContent.includes('1.5'));
 await t.finish();assert.equal(el('achievement').open,true);assert.equal(t.state,'over');el('achievement').close();const best=box.RunStore.getProfile().best;assert(best>3000);const rows=await box.RunStore.list();assert(rows.some(r=>r.mine));assert.equal(rows.filter(r=>r.demo).length,3);
 assert.equal(Array.from(box.RunStore.nickname('一二三四五六七八九十一二')).length,10);
 const reload=boot();assert.equal(reload.box.RunStore.getProfile().best,best);assert((await reload.box.RunStore.list('today')).some(r=>r.mine));await reload.t.start();assert.equal(reload.t.run.score,0);
 for(let i=0;i<9;i++){t.run.distance=i*1000+50;t.render();assert.equal(box.SpaceScene.phase(t.run.distance).index,i);assert(el('planet-name').textContent.includes(box.SpaceScene.planets[i].name));}
 const boundary=box.SpaceScene.phase(1000);assert.equal(boundary.mix,0);assert.equal(boundary.previous,0);assert.equal(box.SpaceScene.phase(9000).index,0);
 // Shared world samples retain their height when crossing the old tile reset boundary.
 for(const planet of box.SpaceScene.planets){const a=box.SpaceScene.terrainPoints(159.9,390,planet.type,1),b=box.SpaceScene.terrainPoints(160.1,390,planet.type,1);const sample=a.find(p=>Math.abs(p[0]+159.9-192)<1e-6),next=b.find(p=>Math.abs(p[0]+160.1-192)<1e-6);assert.equal(sample[1],next[1]);assert(Math.abs(sample[0]-next[0]-.2)<1e-6);}
 await t.start();t.step(1/120);const slow=t.run.speed-210;t.run.arrived=true;const beforeSpeed=t.run.speed;t.step(1/120);assert(Math.abs((t.run.speed-beforeSpeed)/slow-4)<1e-6);
 t.run.speed=10000;t.step(1/120);assert(t.run.speed>10000);
 await t.start();t.run.nextCard=9;t.run.distance=8999.99;t.run.arrived=true;t.run.obstacles=[];t.step(1/120);assert.equal(t.state,'running');assert(t.run.achievement);assert(!el('achievement').open);assert.equal(t.run.obstacles.length,0);assert.equal(box.RunStore.getAchievement().distance,9000);
 box.AchievementCard.download(el('achievement-card'));
 const trophy=boot();assert(trophy.box.RunStore.getAchievement());assert.equal(trophy.el('last-achievement').hidden,false);
 // Resume preserves the run and does not re-award the milestone on subsequent ticks.
 const snapshot=t.run.achievement;t.resume();assert.equal(t.state,'running'); // unlocking must not pause gameplay
 el('achievement').close();assert.equal(t.state,'running');t.step(1/120);assert.equal(t.run.achievement,snapshot);assert.equal(t.state,'running');assert.equal(el('achievement').open,false);
 await t.start();assert.equal(t.run.achievement,undefined);
 // Each new planet has its own persistent collectible, including the starting planet.
 await t.start();assert.equal(box.RunStore.getAchievement().planetIndex,0);
 for(let index=1;index<9;index++){t.run.distance=index*1000-.001;t.run.obstacles=[];t.step(1/120);assert.equal(t.state,'running');assert.equal(t.run.achievement.planetIndex,index);box.AchievementCard.draw(el('achievement-card'),t.run.achievement);el('achievement').close();}
 assert.equal(box.RunStore.getAchievements().filter(r=>r.planetIndex!=null).length,9);
 const savedCards=boot();assert.equal(savedCards.box.RunStore.getAchievements().filter(r=>r.planetIndex!=null).length,9);
 // Extreme speed cannot skip an obstacle in a single simulation tick.
 await t.start();t.run.speed=100000;t.run.obstacles=[{x:t.player.x+100,w:33,h:40,kind:0,rotation:0}];t.step(1/120);assert.equal(t.state,'over');
 // Seeded obstacle sampling covers contrasting rhythms, with physical clearance.
 let seed=3;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const modes=new Set(),delays=[];const sampleRun={time:200,speed:1500,burstRemaining:0};
 for(let i=0;i<300;i++){const plan=box.ObstacleDirector.next(sampleRun,rng);modes.add(plan.mode);delays.push(plan.delay);assert(plan.delay>=plan.minimum);assert(box.ObstacleDirector.minimumSpacing(sampleRun.speed,plan.w)>sampleRun.speed*(2*box.RUN_CONFIG.jumpVelocity/box.RUN_CONFIG.gravity));}
 assert.equal(modes.size,3);assert(Math.max(...delays)-Math.min(...delays)>1.5);
 // Same elapsed time at 30/60/90/120 Hz gives the same simulated distance.
 const distances=[];for(const fps of [30,60,90,120]){const fresh=boot();await fresh.t.start();fresh.t.run.safe=100;fresh.t.frame(0);for(let frame=1;frame<=fps*5;frame++)fresh.t.frame(frame*1000/fps);distances.push(fresh.t.run.distance);}assert(Math.max(...distances)-Math.min(...distances)<.5);
 console.log('PASS: gameplay, 1000 m planets, uncapped acceleration, 9000 m achievement, card export, persistent trophy, safe resume, continuous terrain and 30/60/90/120 Hz consistency.');
})();
