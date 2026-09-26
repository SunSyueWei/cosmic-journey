const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const now='2026-09-27T16:00:00.000Z';
class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return Date.parse(now);}}
const records=[{name:'前週',score:900,distance:900,playerId:'old',date:'2026-09-27T15:59:59.999Z',eventId:'event'},{name:'新週',score:100,distance:100,playerId:'new',date:now,eventId:'event'}];
const box={Date:Clock,URLSearchParams,location:{search:''},RUN_CONFIG:{storageKey:'week-test',eventId:'event'},localStorage:{getItem:()=>JSON.stringify({records}),setItem(){}}};box.window=box;vm.createContext(box);vm.runInContext(fs.readFileSync('js/storage.js','utf8'),box);
(async()=>{
 const api=box.RunStore;
 assert.equal(api.weekKey('2026-09-27T15:59:59.999Z'),'2026-09-21');
 assert.equal(api.weekKey('2026-09-27T16:00:00Z'),'2026-09-28');
 assert.equal(api.weekKey('2027-01-03T15:59:59Z'),'2026-12-28');
 assert.equal(api.weekKey('2027-01-03T16:00:00Z'),'2027-01-04');
 const week=(await api.list('week')).filter(r=>!r.demo),event=(await api.list('event')).filter(r=>!r.demo);
 assert.equal(week.length,1);assert.equal(week[0].name,'新週');assert.equal(event.length,1,'legacy event query cannot expose history');
 assert.equal(records.length,2,'source history must not be deleted');
 console.log('PASS: Taiwan Sunday last millisecond, Monday rollover, year boundary, weekly filtering and retained history.');
})();
