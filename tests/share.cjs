const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function boot(navigator){const nodes=new Map();const el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,focus(){},select(){this.selected=true;}});return nodes.get(id);};const box={navigator,document:{getElementById:el}};vm.createContext(box);vm.runInContext(fs.readFileSync('js/share.js','utf8'),box);return el;}
(async()=>{
 let sent;const native=boot({share:async data=>sent=data});assert.equal(sent,undefined);await native('share-game').onclick();assert.equal(sent.url,'https://sunsyuewei.github.io/cosmic-journey/');assert(!sent.url.includes('test'));
 let copied;const fallback=boot({clipboard:{writeText:async text=>copied=text}});await fallback('share-game').onclick();assert(copied);assert.equal(fallback('share-fallback').hidden,false);
 const denied=boot({});await denied('share-game').onclick();assert(denied('share-url').selected);
 const cancel=boot({share:async()=>{throw {name:'AbortError'};}});await cancel('share-game').onclick();assert.equal(cancel('share-fallback').hidden,true);
 console.log('PASS: explicit native sharing, clipboard/manual fallback, cancellation, canonical URL.');
})();
