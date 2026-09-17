const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let track,count=0;
class Audio{
 constructor(src){track=this;count++;this.src=src;this.paused=true;this.currentTime=0;}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
}
const box={Audio};box.window=box;vm.createContext(box);
for(const file of ['config','audio'])vm.runInContext(fs.readFileSync(`${__dirname}/../js/${file}.js`,'utf8'),box);
const a=box.RunAudio;a.mute(false);a.music(true);
assert(track.src.endsWith('cosmic-mystery.m4a'));assert(track.loop);assert(!track.paused);assert.equal(track.playbackRate,1);
a.setStage(1);assert.equal(track.playbackRate,1.08);a.setStage(2);assert.equal(track.playbackRate,1.16);
a.setStage(9);assert.equal(track.playbackRate,1.72);a.setStage(100);assert.equal(track.playbackRate,1.8);
track.currentTime=42;a.music(false);assert(track.paused);a.music(true);assert.equal(track.currentTime,42);
a.mute(true);assert(track.paused);a.mute(false);assert(!track.paused);
a.music(false);a.mute(true);a.mute(false);assert(track.paused);
a.reset();assert.equal(track.currentTime,0);assert.equal(track.playbackRate,1);
let writes=0,currentRate=1;Object.defineProperty(track,'playbackRate',{get:()=>currentRate,set:value=>{writes++;currentRate=value;}});
for(let i=0;i<1200;i++)a.setStage(0);
assert.equal(writes,0,'no decoder rate writes during the same planet');
track.currentTime=42;a.setStage(1);assert.equal(writes,1);assert.equal(track.currentTime,42);
for(let i=0;i<1200;i++)a.setStage(1);assert.equal(writes,1);
a.setStage(2);assert.equal(writes,2);assert.equal(currentRate,1.16);
a.setStage(100);const cappedWrites=writes;a.setStage(101);assert.equal(writes,cappedWrites);
a.music(true);assert.equal(count,1);assert(fs.statSync('assets/audio/cosmic-mystery.m4a').size>0);
console.log('PASS: M4A loop, acceleration, pause/resume position, mute, reset and single audio instance.');
