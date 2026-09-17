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
assert(track.src.endsWith('cosmic-mystery.mp3'));assert(track.loop);assert(!track.paused);assert.equal(track.playbackRate,1);
a.setSpeed(540);const fast=track.playbackRate;a.setSpeed(10000);assert(track.playbackRate>fast);assert(track.playbackRate<1.8);
track.currentTime=42;a.music(false);assert(track.paused);a.music(true);assert.equal(track.currentTime,42);
a.mute(true);assert(track.paused);a.mute(false);assert(!track.paused);
a.music(false);a.mute(true);a.mute(false);assert(track.paused);
a.reset();assert.equal(track.currentTime,0);assert.equal(track.playbackRate,1);
a.music(true);assert.equal(count,1);assert(fs.statSync('assets/audio/cosmic-mystery.mp3').size>0);
console.log('PASS: MP3 loop, acceleration, pause/resume position, mute, reset and single audio instance.');
