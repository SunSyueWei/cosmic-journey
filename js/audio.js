window.RunAudio=(()=>{
  let ctx,muted=true,playing=false,track,rate=1,stage=0;
  const voices=new Set();
  function musicTrack(){
    if(!track&&window.Audio){track=new Audio('assets/audio/cosmic-mystery.m4a');track.loop=true;track.preload='auto';track.volume=.45;track.preservesPitch=true;track.playbackRate=rate;}
    return track;
  }
  function playTrack(){const audio=musicTrack();if(audio&&playing&&!muted){const attempt=audio.play();attempt?.catch(()=>{});}}
  function tone(frequency,duration=.1,type='sine',gain=.04,when,background=false){
    if(muted||!ctx||ctx.state!=='running')return;
    const start=when??ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(gain,start);
    g.gain.exponentialRampToValueAtTime(.001,start+duration);o.connect(g);g.connect(ctx.destination);
    const voice={o,g,background};voices.add(voice);
    o.onended=()=>{o.disconnect();g.disconnect();voices.delete(voice);};o.start(start);o.stop(start+duration);
  }
  function stopVoices(all=false){for(const voice of voices){if(all||voice.background){voice.g.gain.cancelScheduledValues(ctx.currentTime);voice.g.gain.setValueAtTime(0,ctx.currentTime);try{voice.o.stop();}catch(_){}}}}
  return {
    unlock(){try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch(_){}},
    // One rate change per 1,000 m scene, never tied to continuously rising game speed.
    // Keep the absolute stage after the nine planets loop; do not restart the song.
    setStage(value){const next=Math.max(0,Math.floor(Number(value)||0));if(next===stage)return;stage=next;rate=Math.min(RUN_CONFIG.musicMaxRate,1+stage*RUN_CONFIG.musicRateStep);if(track&&Math.abs(track.playbackRate-rate)>.0001)track.playbackRate=rate;},
    reset(){if(track){track.pause();track.currentTime=0;track.playbackRate=1;}rate=1;stage=0;},
    mute(value){muted=value;if(muted){track?.pause();stopVoices(true);}else playTrack();},
    music(on){const wasPlaying=playing;playing=on;if(!on){track?.pause();stopVoices();return;}if(!wasPlaying||track?.paused)playTrack();},
    jump(){tone(520,.13,'triangle');},card(){tone(880,.13);},hit(){tone(160,.2,'triangle');},
    cheer(){if(ctx)[523,659,784,1047].forEach((n,i)=>tone(n,.35,'triangle',.065,ctx.currentTime+i*.1));}
  };
})();
