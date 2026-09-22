import { describe,it,expect } from 'vitest';
import { readSlots,writeSlot,latestSlot,SLOTS_KEY } from './saveSlots';
import { newGame,SAVE_KEY } from './model';
const storage=()=>{const map=new Map<string,string>();return {getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}};};
describe('独立存档位',()=>{
  it('保留旧存档并迁入一号，删除后不重新导入',()=>{const s=storage(),current=newGame();const {story:_,sideQuests:__,...rest}=current;const data={...rest,version:1,map:'town',money:321,badge:true};s.setItem(SAVE_KEY,JSON.stringify(data));const migrated=readSlots(s).slots[0]?.data;expect(migrated?.money).toBe(321);expect(migrated?.version).toBe(3);expect(migrated?.sideQuests).toEqual([]);expect(migrated?.map).toBe('greenbud-town');expect(migrated?.story.flags).toContain('ranger-pass');writeSlot(s,0,null);expect(readSlots(s).slots.every(x=>x===null)).toBe(true);expect(s.getItem(SAVE_KEY)).not.toBeNull();});
  it('三个槽互不覆盖并按保存时间继续',()=>{const s=storage(),a=newGame(),b=newGame();b.money=55;writeSlot(s,0,a,10);writeSlot(s,2,b,20);expect(readSlots(s).slots[0]?.data.money).toBe(100);expect(latestSlot(readSlots(s))).toBe(2);writeSlot(s,2,null);expect(latestSlot(readSlots(s))).toBe(0);});
  it('损坏目录不回退旧存档、不覆盖损坏内容',()=>{const s=storage();s.setItem(SAVE_KEY,JSON.stringify(newGame()));s.setItem(SLOTS_KEY,'broken');expect(()=>readSlots(s)).toThrow();expect(s.getItem(SLOTS_KEY)).toBe('broken');});
  it('槽位内的 v1 存档也会逐格迁移',()=>{const s=storage(),current=newGame();const {story:_,...rest}=current;s.setItem(SLOTS_KEY,JSON.stringify({version:1,slots:[{updated:10,data:{...rest,version:1,map:'lab',x:20,y:19}},null,null]}));expect(readSlots(s).slots[0]?.data.map).toBe('greenbud-lab');});
  it('无存档时继续不可用，拒绝非法索引和存档',()=>{const s=storage();expect(latestSlot(readSlots(s))).toBe(-1);expect(()=>writeSlot(s,3,newGame())).toThrow();expect(()=>writeSlot(s,0,{...newGame(),money:-1})).toThrow();});
});
