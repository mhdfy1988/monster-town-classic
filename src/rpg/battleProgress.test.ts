import { describe, expect, it } from 'vitest';
import { makeMonster } from './model';
import { awardTeamExperience, BENCH_XP_RATE } from './battleProgress';

describe('战后全队成长', () => {
  it('首发获得完整经验，后备成员也获得固定比例经验', () => {
    const team = [makeMonster(1, 5), makeMonster(2, 5), makeMonster(5, 5)];
    const result = awardTeamExperience(team, 30);
    expect(result.map(entry => entry.xpGain)).toEqual([30, Math.floor(30 * BENCH_XP_RATE), Math.floor(30 * BENCH_XP_RATE)]);
    expect(team.map(monster => monster.xp)).toEqual([30, 18, 18]);
    expect(result.map(entry => entry.active)).toEqual([true, false, false]);
  });

  it('结算会记录升级、领悟招式和进化前后形态', () => {
    const fire = makeMonster(1, 9);
    fire.xp = 100;
    const [result] = awardTeamExperience([fire], 20);
    expect(result.levelBefore).toBe(9);
    expect(result.levelAfter).toBe(10);
    expect(result.evolution).toEqual({ from: 0, to: 1 });
    expect(result.nameBefore).toBe('小火狐');
    expect(result.nameAfter).toBe('双尾火狐');
    expect(result.learnedMoves).toContainEqual({ name: '火焰爪', kind: 'upgraded' });
  });

  it('跨过招式等级时会记录新领悟招式', () => {
    const fire = makeMonster(1, 6);
    fire.xp = 70;
    const [result] = awardTeamExperience([fire], 10);
    expect(result.levelAfter).toBe(7);
    expect(result.learnedMoves).toContainEqual({ name: '叫声', kind: 'learned' });
  });
});
