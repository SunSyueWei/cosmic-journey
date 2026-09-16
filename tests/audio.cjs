const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const notes=[],timers=new Map();let id=0,ctx;
class AudioContext{
 constructor(){ctx=this;this.currentTime=0;this.state='running';this.destination={};}
 createOscillator(){const note={frequency:{value:0},connect(){},disconnect(){},start(time){this.started=time;notes.push(this);},stop(time){if(time===undefined){this.stopped=true;this.onended?.();}}};return note;}
 createGain(){return {connect(){},disconnect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}}};}
}
const box={AudioContext,setInterval:fn=>{timers.set(++id,fn);return id;},clearInterval:i=>timers.delete(i)};box.window=box;vm.createContext(box);
for(const file of ['config','audio'])vm.runInContext(fs.readFileSync(`${__dirname}/../js/${file}.js`,'utf8'),box);
const a=box.RunAudio;a.unlock();a.mute(false);
function advance(seconds){const end=ctx.currentTime+seconds;while(ctx.currentTime<end){ctx.currentTime+=.025;for(const fn of timers.values())fn();}}
function measure(speed){a.music(false);notes.length=0;a.setSpeed(speed);a.music(true);advance(2);const melody=notes.filter(n=>n.frequency.value>200);const gaps=melody.slice(1).map((n,i)=>n.started-melody[i].started);return gaps.reduce((x,y)=>x+y)/gaps.length;}
const slow=measure(210),fast=measure(540),faster=measure(10000);assert(Math.abs(slow-30/108)<1e-6);assert(fast<slow);assert(faster<fast);assert(faster>30/240);
a.music(false);assert.equal(timers.size,0);assert(notes.every(n=>n.stopped));
a.music(true);a.mute(true);const count=notes.length;advance(1);assert.equal(notes.length,count);assert(notes.every(n=>n.stopped));
a.mute(false);advance(.4);assert(notes.length>count);assert.equal(timers.size,1);
assert(Math.abs(measure(210)-slow)<1e-6);a.music(false);
console.log('PASS: tempo increases beyond former speed cap, pause/mute, unmute, one scheduler, slow restart.');
