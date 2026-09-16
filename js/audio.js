window.RunAudio=(()=>{
  let ctx,muted=true,timer=null,beat=0,playing=false,nextNote=0,bpm=108;
  const voices=new Set(),melody=[262,330,392,330,294,349,440,392];
  function tone(frequency,duration=.1,type='sine',gain=.04,when,background=false){
    if(muted||!ctx||ctx.state!=='running')return;
    const start=when??ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(gain,start);
    g.gain.exponentialRampToValueAtTime(.001,start+duration);o.connect(g);g.connect(ctx.destination);
    const voice={o,g,background};voices.add(voice);
    o.onended=()=>{o.disconnect();g.disconnect();voices.delete(voice);};o.start(start);o.stop(start+duration);
  }
  function stopVoices(all=false){for(const voice of voices){if(all||voice.background){voice.g.gain.cancelScheduledValues(ctx.currentTime);voice.g.gain.setValueAtTime(0,ctx.currentTime);try{voice.o.stop();}catch(_){}}}}
  // Audio-clock scheduling stays steady while speed changes; never restart the melody per frame.
  function schedule(){
    if(!playing||muted||!ctx||ctx.state!=='running')return;
    if(nextNote<ctx.currentTime-.1)nextNote=ctx.currentTime;
    while(nextNote<ctx.currentTime+.06){
      const interval=30/bpm;
      tone(melody[beat%8],interval*.72,'triangle',.017,nextNote,true);
      if(beat%2===0)tone(beat%8<4?131:147,interval*.85,'sine',.022,nextNote,true);
      beat++;nextNote+=interval;
    }
  }
  return {
    unlock(){try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch(_){}},
    // Movement is uncapped; tempo keeps rising gently toward 240 BPM for listenability.
    setSpeed(speed){const extra=Math.max(0,speed-RUN_CONFIG.startSpeed);bpm=108+132*extra/(extra+200);},
    mute(value){muted=value;if(muted){stopVoices(true);}else if(ctx){nextNote=ctx.currentTime;schedule();}},
    music(on){playing=on;if(timer!==null){clearInterval(timer);timer=null;}if(!on){stopVoices();return;}nextNote=ctx?.currentTime||0;schedule();timer=setInterval(schedule,25);},
    jump(){tone(520,.13,'triangle');},card(){tone(880,.13);},hit(){tone(160,.2,'triangle');},
    cheer(){if(ctx)[523,659,784,1047].forEach((n,i)=>tone(n,.35,'triangle',.065,ctx.currentTime+i*.1));}
  };
})();
