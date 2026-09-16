window.ObstacleDirector={
 next(run,random=Math.random){
  const difficulty=1-Math.exp(-run.time/100);
  // Unpredictable changes between solitary obstacles, short runs, and breathing spaces.
  let mode;
  if(run.burstRemaining>0){mode='burst';run.burstRemaining--;}
  else{const roll=random();mode=roll<.25?'rest':roll<.55+difficulty*.2?'burst':'single';if(mode==='burst')run.burstRemaining=1+Math.floor(random()*2);}
  const kind=Math.floor(random()*3),w=[33,64,30][kind],h=[40,8,30][kind];
  const flight=2*RUN_CONFIG.jumpVelocity/RUN_CONFIG.gravity;
  const minimum=flight+.17+w/run.speed;
  const jitter=random();
  const delay=minimum+(mode==='rest'?1.0+jitter*1.4:mode==='burst'?.04+jitter*.36:.4+jitter*1.1)+(1-difficulty)*.45;
  return {kind,w,h,mode,delay,minimum};
 },
 // Screen width does not change the minimum world-space separation.
 minimumSpacing(speed,width){const t=2*RUN_CONFIG.jumpVelocity/RUN_CONFIG.gravity+.17+width/speed;return speed*t+.5*RUN_CONFIG.afterAcceleration*t*t;}
};
