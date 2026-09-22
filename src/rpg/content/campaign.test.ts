import { describe, expect, it } from 'vitest';
import { campaignBosses, campaignChapters, campaignRegions, campaignStory } from './campaign';

describe('主线内容契约', () => {
  it('固定预留三座小镇、三片独立野外、三处洞穴和三个首领', () => {
    expect(campaignRegions.filter(region => region.kind === 'town')).toHaveLength(3);
    expect(campaignRegions.filter(region => region.kind === 'wild')).toHaveLength(3);
    expect(campaignRegions.filter(region => region.kind === 'dungeon')).toHaveLength(3);
    expect(campaignBosses).toHaveLength(3);
    expect(campaignChapters).toHaveLength(3);
  });

  it('所有内容 ID 唯一且章节引用有效', () => {
    const regionIds = campaignRegions.map(region => region.id);
    const bossIds = campaignBosses.map(boss => boss.id);
    expect(new Set(regionIds).size).toBe(regionIds.length);
    expect(new Set(bossIds).size).toBe(bossIds.length);
    for (const chapter of campaignChapters) {
      expect(regionIds).toContain(chapter.townId);
      expect(regionIds).toContain(chapter.wildId);
      expect(regionIds).toContain(chapter.dungeonId);
      expect(bossIds).toContain(chapter.bossId);
      expect(chapter.townId).not.toBe(chapter.wildId);
      expect(chapter.wildId).not.toBe(chapter.dungeonId);
    }
    for (const boss of campaignBosses) expect(regionIds).toContain(boss.arenaRegionId);
  });

  it('地图连接双向有效且九张规划地图属于同一张连通图', () => {
    const byId = new Map(campaignRegions.map(region => [region.id, region]));
    for (const region of campaignRegions) {
      for (const targetId of region.connectedTo) {
        const target = byId.get(targetId);
        expect(target).toBeDefined();
        expect(target?.connectedTo).toContain(region.id);
      }
    }
    const visited = new Set<string>();
    const queue = [campaignRegions[0].id];
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      queue.push(...byId.get(id)!.connectedTo);
    }
    expect(visited.size).toBe(campaignRegions.length);
  });

  it('仅第一章的三张正式地图与首领标记为已经实现', () => {
    expect(campaignRegions.filter(region => region.status === 'implemented').map(region => region.id)).toEqual(['greenbud-town','windbell-forest','echo-cave']);
    expect(campaignBosses.filter(boss => boss.status === 'implemented').map(boss=>boss.id)).toEqual(['magma-tortoise']);
    expect(campaignStory.filter(node=>node.status==='implemented').map(node=>node.id)).toEqual(['chapter-1-town','chapter-1-wild','chapter-1-dungeon','chapter-1-boss']);
  });

  it('剧情骨架按小镇、野外、洞穴、首领串联三章',()=>{
    const nodeIds=campaignStory.map(node=>node.id),regionIds=campaignRegions.map(region=>region.id),bossIds=campaignBosses.map(boss=>boss.id);
    for(const node of campaignStory){expect(regionIds).toContain(node.regionId);if(node.bossId)expect(bossIds).toContain(node.bossId);if(node.nextId)expect(nodeIds).toContain(node.nextId);}
    const visited:string[]=[];let current:typeof campaignStory[number]|undefined=campaignStory[0];
    while(current){expect(visited).not.toContain(current.id);visited.push(current.id);current=current.nextId?campaignStory.find(node=>node.id===current!.nextId):undefined;}
    expect(visited).toHaveLength(campaignStory.length);expect(campaignStory.filter(node=>node.bossId)).toHaveLength(3);
    for(const chapter of campaignChapters){
      expect(campaignStory.filter(node=>node.chapter===chapter.chapter).map(node=>node.kind)).toEqual(['town','wild','dungeon','boss']);
    }
  });
});
