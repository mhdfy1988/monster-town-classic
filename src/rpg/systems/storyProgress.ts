import { campaignBosses, campaignStory } from '../content/campaign';
import type { Save } from '../model';

export function hasStoryFlag(save: Pick<Save,'story'>, flag: string) { return save.story.flags.includes(flag); }

export function addStoryFlag(save: Pick<Save,'story'>, flag: string) {
  if (!hasStoryFlag(save, flag)) save.story.flags.push(flag);
}

export function advanceStory(save: Pick<Save,'story'>, expectedNodeId = save.story.nodeId) {
  if (save.story.nodeId !== expectedNodeId) return false;
  const current = campaignStory.find(node => node.id === expectedNodeId);
  if (!current?.nextId) return false;
  save.story.nodeId = current.nextId;
  return true;
}

export function markBossDefeated(save: Pick<Save,'story'>, bossId: string) {
  if (!campaignBosses.some(boss => boss.id === bossId)) throw new Error(`未知章节首领：${bossId}`);
  if (!save.story.defeatedBossIds.includes(bossId)) save.story.defeatedBossIds.push(bossId);
}
