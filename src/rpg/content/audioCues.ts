import type { BattleKind } from '../battle/BattleSession';
import type { MusicTrackId } from '../infrastructure/AudioPlayer';
import type { RuntimeMapId } from './maps/mapRegistry';

/**
 * 第一批音乐只有“探索”和“战斗”两首，因此当前按章节主题显式复用。
 * 这是可测试的内容映射，不是加载失败后的静默回退；新增专属曲目时只改这里和资源清单。
 */
export const TITLE_MUSIC: MusicTrackId = 'exploration';

export const mapMusic: Record<RuntimeMapId, MusicTrackId> = {
  'greenbud-town': 'exploration',
  'greenbud-lab': 'exploration',
  'windbell-forest': 'exploration',
  'echo-cave': 'exploration',
};

export const battleMusic: Record<BattleKind, MusicTrackId> = {
  wild: 'battle',
  trainer: 'battle',
  boss: 'battle',
};
