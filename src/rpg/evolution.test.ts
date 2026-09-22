import {describe,it,expect} from 'vitest';
import {makeMonster,newGame,validSave,evolveMonster,monsterName,damage} from './model';
describe('怪兽直线进化',()=>{
 it('10级与20级进化，最终形态不再进化',()=>{const m=makeMonster(1,9);expect(evolveMonster(m)).toBeNull();m.level=10;expect(evolveMonster(m)).toEqual({from:0,to:1});expect(monsterName(m)).toBe('双尾火狐');m.level=20;expect(evolveMonster(m)).toEqual({from:1,to:2});expect(monsterName(m)).toBe('九尾火狐');expect(evolveMonster(m)).toBeNull();});
 it('跨级只向前，不降阶，不重置经验体力',()=>{const m=makeMonster(1,25);m.hp=3;m.xp=7;evolveMonster(m);expect(m.form).toBe(2);expect(m.hp).toBe(3);expect(m.xp).toBe(7);m.level=5;expect(evolveMonster(m)).toBeNull();});
 it('旧档不改编号或等级，无form仍有效，进化字段可往返',()=>{const s=newGame();s.team=[makeMonster(1,12)];expect(validSave(s)).toBe(true);expect(s.team[0].form).toBeUndefined();evolveMonster(s.team[0]);expect(validSave(JSON.parse(JSON.stringify(s)))).toBe(true);expect(s.team[0].species).toBe(1);expect(s.team[0].level).toBe(12);});
 it('八种族都有直线进化链，非法形态不进存档',()=>{for(let species=0;species<8;species++){const m=makeMonster(species,25);expect(evolveMonster(m)).toEqual({from:0,to:2});}const s=newGame();expect(validSave({...s,team:[{...makeMonster(1,25),form:3}]})).toBe(false);expect(validSave({...s,team:[{...makeMonster(7,5),form:-1}]})).toBe(false);});
 it('进化强化属性招式',()=>{const a=makeMonster(1,20),b=makeMonster(0,20),before=damage(a,b,true,()=>.5).amount;evolveMonster(a);expect(damage(a,b,true,()=>.5).amount).toBeGreaterThan(before);});
 it('木系样板同样按单线三阶进化',()=>{const m=makeMonster(0,10);expect(evolveMonster(m)).toEqual({from:0,to:1});expect(monsterName(m)).toBe('绿角鹿');m.level=20;expect(evolveMonster(m)).toEqual({from:1,to:2});expect(monsterName(m)).toBe('古树鹿');});
 it('土系与水系都按各自单线三阶进化',()=>{const earth=makeMonster(2,10),water=makeMonster(5,10);expect(evolveMonster(earth)).toEqual({from:0,to:1});expect(monsterName(earth)).toBe('岩甲龟');expect(evolveMonster(water)).toEqual({from:0,to:1});expect(monsterName(water)).toBe('浪花獭');water.level=20;expect(evolveMonster(water)).toEqual({from:1,to:2});expect(monsterName(water)).toBe('巨浪水龙');});
});
