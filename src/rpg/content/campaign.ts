export type ContentStatus = 'implemented' | 'planned';
export type RegionKind = 'town' | 'wild' | 'dungeon';
export type StoryNodeKind = 'town' | 'wild' | 'dungeon' | 'boss';

export interface RegionDefinition {
  id: string;
  name: string;
  kind: RegionKind;
  chapter: 1 | 2 | 3;
  status: ContentStatus;
  connectedTo: readonly string[];
}

export interface BossDefinition {
  id: string;
  name: string;
  chapter: 1 | 2 | 3;
  arenaRegionId: string;
  status: ContentStatus;
}

export interface StoryNode {
  id: string;
  kind: StoryNodeKind;
  chapter: 1 | 2 | 3;
  regionId: string;
  bossId?: string;
  status: ContentStatus;
  nextId: string | null;
}

// 每一项都代表独立运行地图。镇内长草区只是第一章开篇的遭遇教学区，不能充当正式野外地图。
export const campaignRegions: readonly RegionDefinition[] = [
  { id: 'greenbud-town', name: '青芽镇', kind: 'town', chapter: 1, status: 'implemented', connectedTo: ['windbell-forest', 'riverbend-town'] },
  { id: 'windbell-forest', name: '风铃森林', kind: 'wild', chapter: 1, status: 'implemented', connectedTo: ['greenbud-town', 'echo-cave'] },
  { id: 'echo-cave', name: '回声洞穴', kind: 'dungeon', chapter: 1, status: 'implemented', connectedTo: ['windbell-forest'] },
  { id: 'riverbend-town', name: '河湾镇', kind: 'town', chapter: 2, status: 'planned', connectedTo: ['greenbud-town', 'reed-marsh', 'thunderstone-town'] },
  { id: 'reed-marsh', name: '芦苇湿地', kind: 'wild', chapter: 2, status: 'planned', connectedTo: ['riverbend-town', 'flooded-cave'] },
  { id: 'flooded-cave', name: '沉水洞窟', kind: 'dungeon', chapter: 2, status: 'planned', connectedTo: ['reed-marsh'] },
  { id: 'thunderstone-town', name: '雷石镇', kind: 'town', chapter: 3, status: 'planned', connectedTo: ['riverbend-town', 'thunder-plateau'] },
  { id: 'thunder-plateau', name: '雷鸣高原', kind: 'wild', chapter: 3, status: 'planned', connectedTo: ['thunderstone-town', 'abandoned-mine'] },
  { id: 'abandoned-mine', name: '废弃矿洞', kind: 'dungeon', chapter: 3, status: 'planned', connectedTo: ['thunder-plateau'] },
] as const;

export const campaignBosses: readonly BossDefinition[] = [
  { id: 'magma-tortoise', name: '熔岩巨龟', chapter: 1, arenaRegionId: 'echo-cave', status: 'implemented' },
  { id: 'great-wave-dragon', name: '巨浪水龙', chapter: 2, arenaRegionId: 'flooded-cave', status: 'planned' },
  { id: 'thunder-fang-tiger', name: '雷牙虎', chapter: 3, arenaRegionId: 'abandoned-mine', status: 'planned' },
] as const;

export const campaignChapters = [
  { chapter: 1, townId: 'greenbud-town', wildId: 'windbell-forest', dungeonId: 'echo-cave', bossId: 'magma-tortoise' },
  { chapter: 2, townId: 'riverbend-town', wildId: 'reed-marsh', dungeonId: 'flooded-cave', bossId: 'great-wave-dragon' },
  { chapter: 3, townId: 'thunderstone-town', wildId: 'thunder-plateau', dungeonId: 'abandoned-mine', bossId: 'thunder-fang-tiger' },
] as const;

// 这里固定三章主线顺序与地图边界；第一章对白、任务与奖励由 interactions/quests 和 systems 共同实现。
export const campaignStory: readonly StoryNode[] = [
  { id: 'chapter-1-town', kind: 'town', chapter: 1, regionId: 'greenbud-town', status: 'implemented', nextId: 'chapter-1-wild' },
  { id: 'chapter-1-wild', kind: 'wild', chapter: 1, regionId: 'windbell-forest', status: 'implemented', nextId: 'chapter-1-dungeon' },
  { id: 'chapter-1-dungeon', kind: 'dungeon', chapter: 1, regionId: 'echo-cave', status: 'implemented', nextId: 'chapter-1-boss' },
  { id: 'chapter-1-boss', kind: 'boss', chapter: 1, regionId: 'echo-cave', bossId: 'magma-tortoise', status: 'implemented', nextId: 'chapter-2-town' },
  { id: 'chapter-2-town', kind: 'town', chapter: 2, regionId: 'riverbend-town', status: 'planned', nextId: 'chapter-2-wild' },
  { id: 'chapter-2-wild', kind: 'wild', chapter: 2, regionId: 'reed-marsh', status: 'planned', nextId: 'chapter-2-dungeon' },
  { id: 'chapter-2-dungeon', kind: 'dungeon', chapter: 2, regionId: 'flooded-cave', status: 'planned', nextId: 'chapter-2-boss' },
  { id: 'chapter-2-boss', kind: 'boss', chapter: 2, regionId: 'flooded-cave', bossId: 'great-wave-dragon', status: 'planned', nextId: 'chapter-3-town' },
  { id: 'chapter-3-town', kind: 'town', chapter: 3, regionId: 'thunderstone-town', status: 'planned', nextId: 'chapter-3-wild' },
  { id: 'chapter-3-wild', kind: 'wild', chapter: 3, regionId: 'thunder-plateau', status: 'planned', nextId: 'chapter-3-dungeon' },
  { id: 'chapter-3-dungeon', kind: 'dungeon', chapter: 3, regionId: 'abandoned-mine', status: 'planned', nextId: 'chapter-3-boss' },
  { id: 'chapter-3-boss', kind: 'boss', chapter: 3, regionId: 'abandoned-mine', bossId: 'thunder-fang-tiger', status: 'planned', nextId: null },
] as const;
