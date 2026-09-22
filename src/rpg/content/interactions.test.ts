import { describe, expect, it } from 'vitest';
import { newGame } from '../model';
import { interactionAt, mapTransitionAt } from './interactions';
import { npcs } from './maps/greenbudTown';

const npc = (id: (typeof npcs)[number]['id']) => {
  const placement=npcs.find(entry=>entry.id===id);
  if(!placement)throw new Error(`缺少 NPC：${id}`);
  return placement;
};

describe('第一章内容交互', () => {
  it('地图入口由内容数据解析', () => {
    const save=newGame();save.x=20;save.y=15;
    expect(mapTransitionAt(save)).toEqual({map:'greenbud-lab',x:20,y:19});
    save.map='greenbud-lab';save.x=20;save.y=20;
    expect(mapTransitionAt(save)).toEqual({map:'greenbud-town',x:20,y:16});
    save.map='greenbud-town';save.x=34;save.y=3;
    expect(mapTransitionAt(save)).toBeNull();
    save.story.flags.push('ranger-pass');expect(mapTransitionAt(save)).toBeNull();
    save.story.flags.push('forest-investigation');expect(mapTransitionAt(save)).toEqual({map:'windbell-forest',x:24,y:33});
    save.map='windbell-forest';save.x=24;save.y=3;expect(mapTransitionAt(save)).toBeNull();
    save.story.flags.push('forest-route-cleared');expect(mapTransitionAt(save)).toEqual({map:'echo-cave',x:22,y:30});
    save.map='echo-cave';save.x=22;save.y=31;expect(mapTransitionAt(save)).toEqual({map:'windbell-forest',x:24,y:4});
  });

  it('博士和巡林员条件不依赖场景类', () => {
    const save=newGame();save.map='greenbud-lab';save.x=20;save.y=12;
    expect(interactionAt(save,{x:0,y:-1}).kind).toBe('starter');
    const ranger=npc('ranger');save.map='greenbud-town';save.x=ranger.x;save.y=ranger.y+1;save.team.push({species:0,level:5,hp:49,xp:0});
    expect(interactionAt(save,{x:0,y:-1})).toMatchObject({kind:'dialog'});
    save.caught=[0,1];expect(interactionAt(save,{x:0,y:-1})).toEqual({kind:'ranger-trial',replay:false});
  });

  it('森林封路、洞穴回声石和设备由相邻格交互',()=>{
    const save=newGame();save.map='windbell-forest';save.x=24;save.y=4;
    expect(interactionAt(save,{x:0,y:-1})).toEqual({kind:'forest-route'});
    save.map='echo-cave';save.x=9;save.y=23;
    expect(interactionAt(save,{x:0,y:-1})).toMatchObject({kind:'echo-beacon',index:1});
    save.x=22;save.y=7;expect(interactionAt(save,{x:0,y:-1})).toEqual({kind:'cave-device'});
  });

  it('博士委托、森林人物和返镇结算都有独立交互',()=>{
    const save=newGame();save.team.push({species:1,level:8,hp:64,xp:0});save.caught=[0,1];save.badge=true;save.story.flags.push('ranger-pass');
    save.map='greenbud-lab';save.x=20;save.y=12;expect(interactionAt(save,{x:0,y:-1})).toEqual({kind:'forest-briefing'});
    save.story.flags.push('forest-investigation');save.map='windbell-forest';save.x=24;save.y=14;expect(interactionAt(save,{x:0,y:-1})).toEqual({kind:'white-gravel'});
    save.x=14;save.y=22;expect(interactionAt(save,{x:0,y:-1})).toEqual({kind:'forest-surveyor'});
    save.x=11;save.y=17;expect(interactionAt(save,{x:0,y:-1})).toMatchObject({kind:'forest-clue',id:'west-moss'});
    const mayor=npc('mayor');save.story.flags.push('magma-tortoise-calmed');save.map='greenbud-town';save.x=mayor.x;save.y=mayor.y+1;expect(interactionAt(save,{x:0,y:-1})).toEqual({kind:'chapter-one-finale'});
  });
});
