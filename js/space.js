/* All scenery is local Canvas art. Stable world coordinates eliminate tile-reset flicker. */
window.SpaceScene=(()=>{
 const planets=[
  {name:'水星',en:'MERCURY',land:'隕石荒原',color:'#9899b1',soil:'#343549',ridge:'#49465d',type:'crater'},
  {name:'金星',en:'VENUS',land:'金色雲海',color:'#e7b472',soil:'#4d3439',ridge:'#835c52',type:'cloud'},
  {name:'地球',en:'EARTH',land:'蔚藍家園',color:'#4d9dc5',soil:'#173b44',ridge:'#306879',type:'earth'},
  {name:'火星',en:'MARS',land:'赤紅峽谷',color:'#db8567',soil:'#4a2934',ridge:'#9a5650',type:'canyon'},
  {name:'木星',en:'JUPITER',land:'風暴浮島',color:'#d5b393',soil:'#433845',ridge:'#8d6c69',type:'bands'},
  {name:'土星',en:'SATURN',land:'星環碎石帶',color:'#e4ce9c',soil:'#373745',ridge:'#777365',type:'ring'},
  {name:'天王星',en:'URANUS',land:'青色冰原',color:'#9ad9dc',soil:'#233d51',ridge:'#5193a4',type:'ice'},
  {name:'海王星',en:'NEPTUNE',land:'深藍風暴',color:'#568ddd',soil:'#202d54',ridge:'#3e5699',type:'storm'},
  {name:'冥王星',en:'PLUTO',land:'寂靜冰境',color:'#c2b5bc',soil:'#332e46',ridge:'#74627e',type:'frost'}
 ];
 const mod=(n,m)=>((n%m)+m)%m;
 const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 function phase(distance){const position=Math.max(0,distance)/RUN_CONFIG.planetDistance,index=Math.floor(position);const t=Math.min(1,(position-index)*RUN_CONFIG.planetDistance/RUN_CONFIG.transitionDistance);return {index:index%9,previous:mod(index-1,9),mix:index===0?1:t*t*(3-2*t)};}
 function rgb(hex){return hex.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16));}
 function blend(a,b,t){const x=rgb(a),y=rgb(b);return `rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')})`;}
 function terrainY(x,type,layer){const base=Math.sin(x*.009+layer)*15+Math.sin(x*.023)*7;return base+(type==='ice'||type==='canyon'||type==='frost'?Math.abs(Math.sin(x*.017))*34:Math.sin(x*.004)*18);}
 function terrainPoints(scroll,width,type,layer){const spacing=16,start=Math.floor(scroll/spacing)-1,end=Math.ceil((scroll+width)/spacing)+1;const points=[];for(let i=start;i<=end;i++)points.push([i*spacing-scroll,terrainY(i*spacing,type,layer)]);return points;}
 let sky,skyWidth=0,skyHeight=0,planetCache=new Map();
 function buildSky(w,h){sky=document.createElement('canvas');sky.width=Math.ceil(w);sky.height=h;const c=sky.getContext('2d');const gradient=c.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#020919');gradient.addColorStop(.6,'#092246');gradient.addColorStop(1,'#172348');c.fillStyle=gradient;c.fillRect(0,0,w,h);
  // Nebula and stars are rasterized only when the viewport changes, never randomized per frame.
  for(let i=0;i<13;i++){const x=w*(.35+i*.055),y=h*(.95-i*.072);const g=c.createRadialGradient(x,y,0,x,y,h*.33);g.addColorStop(0,i%2?'#8a85c015':'#427fbb20');g.addColorStop(1,'#07152d00');c.fillStyle=g;c.fillRect(0,0,w,h);}
  for(let i=0;i<1400;i++){const x=hash(i+2)*w,y=hash(i+800)*h,r=hash(i+1600);c.fillStyle=`rgba(210,229,255,${.1+r*.6})`;c.fillRect(x,y,r>.98?1.8:.65,r>.98?1.8:.65);}
  // A quiet diagonal Milky Way adds scale without animated noise or flashing.
  for(let i=0;i<1900;i++){const t=hash(i+3100),spread=(hash(i+5200)+hash(i+7300)-1)*w*.14;const x=w*(.3+t*.63)+spread,y=h*(1.08-t*1.15);c.fillStyle=i%5?'#b1c8ee26':'#e2eafa55';c.fillRect(x,y,.75,.75);}
  skyWidth=w;skyHeight=h;
 }
 function planetTexture(index){if(planetCache.has(index))return planetCache.get(index);const p=planets[index],cvs=document.createElement('canvas');cvs.width=420;cvs.height=420;const c=cvs.getContext('2d');c.save();c.beginPath();c.arc(210,210,163,0,Math.PI*2);c.clip();c.fillStyle=p.color;c.fillRect(0,0,420,420);
  if(['bands','cloud','storm','ring'].includes(p.type)){for(let i=0;i<23;i++){c.fillStyle=i%2?'#ffffff1b':'#381b3d25';c.beginPath();c.ellipse(205,50+i*16,205,12+hash(i)*13,-.15,0,Math.PI*2);c.fill();}if(p.type==='bands'){c.fillStyle='#9b655d';c.beginPath();c.ellipse(269,260,35,16,-.1,0,Math.PI*2);c.fill();}}
  else if(p.type==='earth'){c.fillStyle='#80b09c';for(let i=0;i<12;i++){c.beginPath();c.ellipse(70+hash(i)*280,60+hash(i+44)*280,15+hash(i+2)*40,10+hash(i+8)*35,.4,0,Math.PI*2);c.fill();}c.fillStyle='#eaf4f257';for(let i=0;i<7;i++){c.beginPath();c.ellipse(210,95+i*38,150,7,-.3,0,Math.PI*2);c.fill();}}
  else{for(let i=0;i<65;i++){const x=hash(i+9)*420,y=hash(i+92)*420,r=3+hash(i+105)*21;c.fillStyle='#16213e24';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle='#ffffff16';c.lineWidth=2;c.stroke();}}
  const shade=c.createLinearGradient(60,50,360,280);shade.addColorStop(0,'#fff2db22');shade.addColorStop(.45,'#03132b15');shade.addColorStop(1,'#02091cef');c.fillStyle=shade;c.fillRect(0,0,420,420);c.restore();planetCache.set(index,cvs);return cvs;
 }
 function paintPlanet(ctx,p,index,w,alpha){if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;const size=Math.min(480,w*.7),x=w*.75-size/2,y=58;ctx.drawImage(planetTexture(index),x,y,size,size);if(p.type==='ring'){ctx.strokeStyle='#dbca9a83';ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(x+size/2,y+size/2,size*.59,size*.14,-.32,0,Math.PI*2);ctx.stroke();}ctx.restore();}
 function draw(ctx,w,h,ground,distance){if(!sky||skyWidth!==w||skyHeight!==h)buildSky(w,h);ctx.drawImage(sky,0,0,w,h);const ph=phase(distance),a=planets[ph.previous],b=planets[ph.index],scroll=distance/RUN_CONFIG.metresPerPixel;
  paintPlanet(ctx,a,ph.previous,w,1-ph.mix);paintPlanet(ctx,b,ph.index,w,ph.mix);
  // Individually wrapped stars keep their identity across the wrap boundary.
  for(let i=0;i<45;i++){const x=mod(hash(i+71)*(w+40)-scroll*(.018+hash(i)*.016),w+40)-20;ctx.fillStyle=i%8?'#c5ddf5aa':'#fff3d2';ctx.fillRect(x,95+hash(i+190)*(ground-120),i%8?1:2,i%8?1:2);}
  for(let layer=0;layer<2;layer++){const position=scroll*(layer===0?.13:.32);const ptsA=terrainPoints(position,w,a.type,layer),ptsB=terrainPoints(position,w,b.type,layer);ctx.fillStyle=blend(layer===0?'#152643':a.ridge,layer===0?'#152643':b.ridge,ph.mix);ctx.globalAlpha=layer===0?.8:.55;ctx.beginPath();ctx.moveTo(ptsA[0][0],ground);for(let i=0;i<ptsA.length;i++)ctx.lineTo(ptsA[i][0],ground-28-layer*5-(ptsA[i][1]*(1-ph.mix)+ptsB[i][1]*ph.mix));ctx.lineTo(w+30,ground+2);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
  ctx.fillStyle=blend(a.soil,b.soil,ph.mix);ctx.fillRect(0,ground,w,h-ground);ctx.fillStyle=blend(a.color,b.color,ph.mix);ctx.fillRect(0,ground,w,2);
  // Terrain details are anchored to world IDs, not to recycled screen-array slots.
  const start=Math.floor(scroll/65)-1;for(let i=start;i<start+w/65+3;i++){const x=i*65-scroll;ctx.fillStyle='#d5e7ff20';ctx.beginPath();ctx.ellipse(x,ground+13+hash(i+600)*14,8+hash(i)*12,2,0,0,Math.PI*2);ctx.fill();}
 }
 return {planets,phase,terrainPoints,draw};
})();
