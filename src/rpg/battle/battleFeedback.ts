import type { Element } from '../model';

export type BattleSide = 'ally' | 'enemy';

/**
 * 战斗领域只描述“刚刚发生了什么”，DOM、动画和声音由场景适配层决定。
 * 这样表现可以继续升级，而不会复制伤害、捕捉概率或回合结算。
 */
export type BattleFeedback =
  | { kind: 'entry' }
  | { kind: 'attack'; actor: BattleSide; element: Element | 'normal'; amount: number; effective?: boolean }
  | { kind: 'heal'; target: BattleSide }
  | { kind: 'buff'; target: BattleSide; tone: 'guard' | 'attack' | 'cleanse' }
  | { kind: 'debuff'; target: BattleSide }
  | { kind: 'switch'; target: 'ally' }
  | { kind: 'capture'; phase: 'throw' | 'shake' | 'break' | 'success'; shake?: 1 | 2 | 3 };

export function captureShakeCount(roll: number, chance: number, captured: boolean): 1 | 2 | 3 {
  if (captured || roll < chance + .18) return 3;
  if (roll < chance + .4) return 2;
  return 1;
}

export function feedbackDuration(feedback?: BattleFeedback) {
  if (!feedback) return 650;
  if (feedback.kind !== 'capture') return feedback.kind === 'entry' ? 700 : 620;
  if (feedback.phase === 'throw') return 1200;
  if (feedback.phase === 'shake') return feedback.shake === 3 ? 1250 : 950;
  return feedback.phase === 'success' ? 1450 : 1250;
}
