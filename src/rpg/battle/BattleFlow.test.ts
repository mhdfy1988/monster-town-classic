import { describe, expect, it, vi } from 'vitest';
import { townRescue, npcs } from '../content/maps/greenbudTown';
import { makeMonster, maxHp, newGame } from '../model';
import { BattleFlow } from './BattleFlow';
import { BattleSession } from './BattleSession';
import type { BattleFeedback } from './battleFeedback';

describe('战斗流程控制器', () => {
  it('全队战败在护士旁安全落地并恢复体力',async()=>{
    const save=newGame(),ally=makeMonster(0,1);ally.hp=1;save.team=[ally];save.map='windbell-forest';
    const session=new BattleSession();session.start(makeMonster(1,30),false,'相遇');
    const rescue=vi.fn();const flow=new BattleFlow(()=>save,session,{render:vi.fn(),pauseLog:vi.fn(async()=>{}),finish:vi.fn(),returnToTownAfterDefeat:rescue},()=>0.5);
    await flow.turn('attack');
    expect(rescue).toHaveBeenCalledOnce();expect(save.map).toBe('greenbud-town');
    expect([save.x,save.y]).toEqual([townRescue.x,townRescue.y]);
    expect(npcs.some(n=>n.x===save.x&&n.y===save.y)).toBe(false);expect(ally.hp).toBe(maxHp(ally));
  });
  it('捕捉成功统一更新库存、队伍、图鉴和结束事件', async () => {
    const save=newGame(),ally=makeMonster(0,5),enemy=makeMonster(1,3);save.team=[ally];save.balls=1;enemy.hp=1;
    const session=new BattleSession();session.start(enemy,false,'相遇');
    const finish=vi.fn(),pauseLog=vi.fn(async(_text:string,_feedback?:BattleFeedback)=>{});
    const flow=new BattleFlow(()=>save,session,{render:vi.fn(),pauseLog,finish,returnToTownAfterDefeat:vi.fn()},()=>0);
    await flow.turn('capture');
    expect(save.balls).toBe(0);expect(save.team).toContainEqual(enemy);expect(save.caught).toContain(enemy.species);
    expect(save.dexForms).toContain('agnite:0');
    expect(pauseLog.mock.calls.map(([text])=>text)).toEqual(['你掷出了捕捉球！','……摇了一下。','……又摇了一下。','……最后一下。','咔哒！捕捉球锁定了。']);
    expect(pauseLog).toHaveBeenLastCalledWith('咔哒！捕捉球锁定了。',{kind:'capture',phase:'success'});expect(finish).toHaveBeenCalledOnce();
  });

  it('捕捉失败按接近成功的程度展示摇晃和挣脱，再进入敌方回合',async()=>{
    const save=newGame(),ally=makeMonster(1,8),enemy=makeMonster(0,5);save.team=[ally];save.balls=1;enemy.hp=1;
    const session=new BattleSession();session.start(enemy,false,'相遇');const pauseLog=vi.fn(async(_text:string,_feedback?:BattleFeedback)=>{});
    const rolls=[.97,.5,.5];const flow=new BattleFlow(()=>save,session,{render:vi.fn(),pauseLog,finish:vi.fn(),returnToTownAfterDefeat:vi.fn()},()=>rolls.shift()??.5);
    await flow.turn('capture');
    expect(save.balls).toBe(0);expect(save.team).not.toContainEqual(enemy);
    expect(pauseLog).toHaveBeenCalledWith(expect.stringContaining('挣脱'),{kind:'capture',phase:'break'});
    expect(pauseLog.mock.calls.some(([,feedback])=>feedback?.kind==='capture'&&feedback.phase==='shake')).toBe(true);
    expect(pauseLog.mock.calls.at(-1)?.[1]?.kind).not.toBe('capture');expect(session.busy).toBe(false);
  });

  it('无效治疗不消耗道具或敌方回合', async () => {
    const save=newGame(),ally=makeMonster(0,5),enemy=makeMonster(1,3);save.team=[ally];save.potions=1;
    const session=new BattleSession();session.start(enemy,false,'相遇');const render=vi.fn(),pauseLog=vi.fn(async()=>{});
    const flow=new BattleFlow(()=>save,session,{render,pauseLog,finish:vi.fn(),returnToTownAfterDefeat:vi.fn()},()=>0);
    await flow.turn('potion');
    expect(save.potions).toBe(1);expect(session.busy).toBe(false);expect(session.menu).toBe('items');expect(render).toHaveBeenCalledOnce();expect(pauseLog).not.toHaveBeenCalled();
  });

  it('首次击败巡林员后发放徽章并等待博士正式委托', async () => {
    const save=newGame(),ally=makeMonster(1,8),enemy=makeMonster(4,1);save.team=[ally];enemy.hp=1;
    const session=new BattleSession();session.start(enemy,true,'考验');
    const finish=vi.fn();const flow=new BattleFlow(()=>save,session,{render:vi.fn(),pauseLog:vi.fn(async()=>{}),finish,returnToTownAfterDefeat:vi.fn()},()=>0);
    await flow.turn('attack');
    expect(save.badge).toBe(true);expect(save.story.flags).toContain('ranger-pass');expect(save.story.nodeId).toBe('chapter-1-town');expect(finish).toHaveBeenCalledWith(expect.stringContaining('研究所'),expect.any(Array));
  });

  it('首领不可捕捉，失败尝试不消耗捕捉球与回合', async()=>{
    const save=newGame(),ally=makeMonster(0,12),enemy=makeMonster(2,18);save.team=[ally];save.balls=2;
    const session=new BattleSession();session.start(enemy,'boss','首领战');const render=vi.fn();
    const flow=new BattleFlow(()=>save,session,{render,pauseLog:vi.fn(async()=>{}),finish:vi.fn(),returnToTownAfterDefeat:vi.fn()},()=>0);
    await flow.turn('capture');
    expect(save.balls).toBe(2);expect(session.busy).toBe(false);expect(session.log).toContain('无法使用');expect(render).toHaveBeenCalledOnce();
  });

  it('击败熔岩巨龟只记录安抚结果，返镇后再结算章节',async()=>{
    const save=newGame(),ally=makeMonster(1,30),enemy={...makeMonster(2,18),form:2 as const};save.team=[ally];enemy.hp=1;
    save.story.nodeId='chapter-1-boss';const session=new BattleSession();session.start(enemy,'boss','首领战');const finish=vi.fn();
    const flow=new BattleFlow(()=>save,session,{render:vi.fn(),pauseLog:vi.fn(async()=>{}),finish,returnToTownAfterDefeat:vi.fn()},()=>0);
    await flow.turn('attack');
    expect(save.story.defeatedBossIds).toContain('magma-tortoise');expect(save.story.flags).toContain('magma-tortoise-calmed');
    expect(save.story.flags).not.toEqual(expect.arrayContaining(['chapter-1-complete','riverbend-pass']));expect(save.story.nodeId).toBe('chapter-1-boss');expect(save.money).toBe(350);expect(finish).toHaveBeenCalledWith(expect.stringContaining('返回青芽镇'),expect.any(Array));
  });
});
