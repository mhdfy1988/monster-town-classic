import {describe,it,expect} from 'vitest';
import {roads,townBuildings,townGate,townRescue,npcs,inBox,isTownBlocked} from './greenbudTown';
import {isMovementBlocked,mapDefinition} from './mapRegistry';
describe('青芽镇布局契约',()=>{
  it('所有道路避开建筑且南路止于镇内',()=>{
    for(const road of roads)for(let y=road.y;y<road.y+road.h;y++)for(let x=road.x;x<road.x+road.w;x++){
      expect(townBuildings.some(b=>inBox(x,y,b)),`道路压建筑 ${x},${y}`).toBe(false);
      expect(isTownBlocked(x,y),`道路被阻挡 ${x},${y}`).toBe(false);
      expect(y).toBeLessThan(34);
    }
  });
  it('北门四格均锁定、解锁且对应森林传送',()=>{
    for(let x=townGate.x;x<townGate.x+townGate.w;x++){
      expect(isMovementBlocked('greenbud-town',x,townGate.y,[])).toBe(true);
      expect(isMovementBlocked('greenbud-town',x,townGate.y,['forest-investigation'])).toBe(false);
      expect(mapDefinition('greenbud-town').transitions.find(t=>t.x===x&&t.y===townGate.y)?.targetMap).toBe('windbell-forest');
    }
  });
  it('救援落点在护士旁但不占据任何 NPC 或实体',()=>{
    const nurse=npcs.find(n=>n.id==='healer')!;
    expect(Math.abs(nurse.x-townRescue.x)+Math.abs(nurse.y-townRescue.y)).toBe(1);
    expect(npcs.some(n=>n.x===townRescue.x&&n.y===townRescue.y)).toBe(false);
    expect(isTownBlocked(townRescue.x,townRescue.y)).toBe(false);
    for(const npc of npcs)expect(isTownBlocked(npc.x,npc.y),npc.id).toBe(false);
  });
});
