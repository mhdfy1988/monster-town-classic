import {test,expect} from 'vitest';
import {newGame,makeMonster,validSave,normalizeTeam,TEAM_LIMIT} from './model';
import {readSlots,SLOTS_KEY} from './saveSlots';
test('六人旧档迁移到五人，完整保留多出的伙伴',()=>{
 const save=newGame();save.team=Array.from({length:6},(_,i)=>makeMonster(i%5,i+1));save.reserve=[makeMonster(0,9)];
 const extra={...save.team[5]};expect(validSave(save)).toBe(false);
 const raw=JSON.stringify({version:1,slots:[{updated:1,data:save},null,null]});
 const book=readSlots({getItem:key=>key===SLOTS_KEY?raw:null,setItem:()=>{throw Error('读取不可覆盖原档');}});
 const data=book.slots[0]!.data;expect(data.team).toHaveLength(TEAM_LIMIT);expect(data.reserve).toHaveLength(2);expect(data.reserve[1]).toEqual(extra);expect(validSave(data)).toBe(true);
 normalizeTeam(data);expect(data.reserve).toHaveLength(2);
});
