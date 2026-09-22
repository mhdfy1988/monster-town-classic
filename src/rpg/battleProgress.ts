import { evolveMonster, gainXp, monsterInfo, monsterName, type Monster } from './model';
import { skills } from './combat';

export const BENCH_XP_RATE = 0.6;

export interface MoveGrowth {
  name: string;
  kind: 'learned' | 'upgraded';
}

export interface BattleGrowth {
  monster: Monster;
  teamIndex: number;
  active: boolean;
  nameBefore: string;
  nameAfter: string;
  xpGain: number;
  xpBefore: number;
  xpAfter: number;
  levelBefore: number;
  levelAfter: number;
  learnedMoves: MoveGrowth[];
  evolution: { from: 0 | 1 | 2; to: 0 | 1 | 2 } | null;
}

/**
 * 胜利经验覆盖整支随行队伍：当前出战者获得完整经验，其余成员获得 60%。
 * 返回的成长快照是结算界面的唯一数据源，避免界面自行猜测升级或进化。
 */
export function awardTeamExperience(team: Monster[], baseXp: number): BattleGrowth[] {
  return team.map((monster, teamIndex) => {
    const levelBefore = monster.level;
    const xpBefore = monster.xp;
    const nameBefore = monsterName(monster);
    const movesBefore = skills(monster);
    const xpGain = teamIndex === 0 ? baseXp : Math.max(1, Math.floor(baseXp * BENCH_XP_RATE));

    gainXp(monster, xpGain);
    const evolution = evolveMonster(monster);
    const movesAfter = skills(monster);
    const knownIds = new Set(movesBefore.map(move => move.id));
    const learnedMoves: MoveGrowth[] = movesAfter
      .filter(move => !knownIds.has(move.id))
      .map(move => ({ name: move.name, kind: 'learned' }));
    const oldSpecial = movesBefore.find(move => move.id === 'special');
    const newSpecial = movesAfter.find(move => move.id === 'special');
    if (oldSpecial && newSpecial && oldSpecial.name !== newSpecial.name) {
      learnedMoves.push({ name: newSpecial.name, kind: 'upgraded' });
    }

    return {
      monster,
      teamIndex,
      active: teamIndex === 0,
      nameBefore,
      nameAfter: monsterInfo(monster).name,
      xpGain,
      xpBefore,
      xpAfter: monster.xp,
      levelBefore,
      levelAfter: monster.level,
      learnedMoves,
      evolution,
    };
  });
}
