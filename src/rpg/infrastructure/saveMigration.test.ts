import { describe,expect,it } from 'vitest';
import { newGame } from '../model';
import { migrateSave } from './saveMigration';

describe('存档版本迁移',()=>{
  it('旧镇区被新建筑占用的落点迁往广场并保留资产',()=>{
    const {townLayoutRevision:_,...old}=newGame();old.x=13;old.y=19;old.money=321;
    const migrated=migrateSave(old);
    expect([migrated.x,migrated.y]).toEqual([20,22]);expect(migrated.money).toBe(321);
    expect(migrated.townLayoutRevision).toBe(2);expect(migrateSave(migrated)).toEqual(migrated);
    expect(old.x).toBe(13);
  });
  it('不掩盖原本就在房屋内、越界、当前版或资源损坏的存档',()=>{
    const {townLayoutRevision:_,...old}=newGame();
    expect(()=>migrateSave({...old,x:20,y:13})).toThrow();
    expect(()=>migrateSave({...old,x:-1})).toThrow();
    expect(()=>migrateSave({...newGame(),x:13,y:19})).toThrow();
    expect(()=>migrateSave({...old,x:13,y:19,money:-1})).toThrow();
  });
  it('v2 存档迁移到 v3 时保留领域进度并初始化支线',()=>{
    const current=newGame();const {sideQuests:_,...rest}=current;
    const migrated=migrateSave({...rest,version:2,story:{nodeId:'chapter-1-wild',flags:['ranger-pass'],defeatedBossIds:[]}});
    expect(migrated.version).toBe(3);expect(migrated.story.nodeId).toBe('chapter-1-wild');expect(migrated.story.flags).toEqual(['ranger-pass']);expect(migrated.sideQuests).toEqual([]);
  });
});
