import {test,expect} from 'vitest';
import {skills} from './combat';
import {makeMonster} from './model';
test('撞击属于招式，学习受种族和等级控制',()=>{
 expect(skills(makeMonster(1,1)).map(m=>m.id)).toEqual(['attack']);
 expect(skills(makeMonster(1,3)).map(m=>m.id)).toEqual(['attack','special']);
 expect(skills(makeMonster(1,7)).map(m=>m.name)).toContain('叫声');
 expect(skills(makeMonster(1,30)).map(m=>m.id)).not.toContain('guard');
 expect(skills(makeMonster(2,3)).map(m=>m.id)).toEqual(['attack','guard']);
 for(let species=0;species<5;species++)for(let level=1;level<=30;level++){
  const moves=skills(makeMonster(species,level));expect(moves.length).toBeLessThanOrEqual(4);expect(moves[0].id).toBe('attack');expect(new Set(moves.map(m=>m.id)).size).toBe(moves.length);
 }
});
