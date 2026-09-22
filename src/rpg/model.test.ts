import { describe, it, expect } from 'vitest';
import { makeMonster, maxHp, damage, captureChance, gainXp, validSave, newGame } from './model';
import { npcs } from './content/maps/greenbudTown';
import { isBlocked } from './content/maps/mapRegistry';
describe('伙伴与存档规则',()=>{
  it('克制攻击比同等级普通攻击伤害高',()=>{const fire=makeMonster(1,5),leaf=makeMonster(0,5);expect(damage(fire,leaf,true,()=>.5).effective).toBe(true);expect(damage(fire,leaf,true,()=>.5).amount).toBeGreaterThan(damage(fire,leaf,false,()=>.5).amount);});
  it('削弱提升捕捉率，且概率不超过95%',()=>{const m=makeMonster(2,5);const healthy=captureChance(m);m.hp=1;expect(captureChance(m)).toBeGreaterThan(healthy);expect(captureChance(m)).toBeLessThanOrEqual(.95);});
  it('经验跨级正确且保留剩余经验',()=>{const m=makeMonster(1,5);expect(gainXp(m,140)).toBe(true);expect(m.level).toBe(7);expect(m.xp).toBe(8);expect(m.hp).toBeLessThanOrEqual(maxHp(m));});
it('损坏的存档不会当成有效状态',()=>{const s=newGame();expect(validSave(s)).toBe(true);expect(validSave({...s,team:[{species:99,level:5,hp:30,xp:0}]})).toBe(false);expect(validSave({...s,balls:-1})).toBe(false);expect(validSave({...s,map:'greenbud-lab',x:47})).toBe(false);expect(validSave({...s,map:'missing-map'})).toBe(false);});
});
describe('实际探索路径',()=>{
const reachable=(map:'greenbud-town'|'greenbud-lab'|'windbell-forest'|'echo-cave',sx:number,sy:number)=>{const seen=new Set([`${sx},${sy}`]),q=[[sx,sy]];for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,key=`${a},${b}`;if(seen.has(key)||isBlocked(map,a,b)||(map==='greenbud-town'?npcs.some(n=>n.x===a&&n.y===b):map==='greenbud-lab'&&a===20&&b===11))continue;seen.add(key);q.push([a,b]);}}return seen;};
it('出生点可到研究所入口、长草、治疗、商店、镇长与北门前',()=>{const r=reachable('greenbud-town',20,22);for(const p of ['20,15','28,26','12,22','31,8','29,21','26,22','34,3','23,30'])expect(r.has(p),p).toBe(true);});
it('水域、房屋阻挡，门洞无静态阻挡，研究所入口与门前传送格不阻挡',()=>{expect(isBlocked('greenbud-town',38,27)).toBe(true);expect(isBlocked('greenbud-town',20,13)).toBe(true);expect(isBlocked('greenbud-town',34,3)).toBe(false);expect(isBlocked('greenbud-town',20,15)).toBe(false);expect(isBlocked('greenbud-town',34,4)).toBe(false);});
it('室内能到博士与出口',()=>{const r=reachable('greenbud-lab',20,19);expect(r.has('20,12')).toBe(true);expect(r.has('20,20')).toBe(true);});
it('独立风铃森林出生点能走回青芽镇出口',()=>{const r=reachable('windbell-forest',24,33);expect(r.has('24,34')).toBe(true);expect(r.has('24,3')).toBe(true);});
it('回声洞穴入口可抵达三块回声石与设备相邻格',()=>{const r=reachable('echo-cave',22,30);for(const p of ['22,31','9,23','34,21','22,11','22,7'])expect(r.has(p),p).toBe(true);});
});
