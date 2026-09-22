import { describe, expect, it } from 'vitest';
import { makeMonster } from '../model';
import { BattleSession } from './BattleSession';

describe('战斗会话', () => {
  it('集中维护敌方、菜单、日志和临时状态', () => {
    const session=new BattleSession(),enemy=makeMonster(0,3);
    session.start(enemy,false,'相遇');
    session.menu='items';session.busy=true;session.state(enemy).guard=1;
    expect(session.enemy).toBe(enemy);expect(session.state(enemy).guard).toBe(1);
    session.finish();
    expect(session.enemy).toBeNull();expect(session.busy).toBe(false);expect(session.menu).toBe('main');
  });

  it('明确区分野外、训练家和不可捕捉首领战',()=>{
    const session=new BattleSession(),enemy=makeMonster(2,18);
    session.start(enemy,'boss','首领战');expect(session.boss).toBe(true);expect(session.trainer).toBe(false);
    session.start(enemy,true,'训练家战');expect(session.boss).toBe(false);expect(session.trainer).toBe(true);
  });
});
