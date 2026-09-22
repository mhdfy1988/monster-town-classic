import { describe, expect, it } from 'vitest';
import { newGame } from '../model';
import { locationName, questText } from './hud';

describe('场景 HUD 呈现', () => {
  it('按地图和坐标显示区域名', () => {
    const save=newGame();
    expect(locationName(save)).toBe('青芽镇');
save.x=32;save.y=10;expect(locationName(save)).toBe('镇东草地');
    save.map='greenbud-lab';expect(locationName(save)).toBe('青芽研究所');
    save.map='windbell-forest';expect(locationName(save)).toBe('风铃森林');
    save.map='echo-cave';expect(locationName(save)).toBe('回声洞穴');
  });

  it('只根据领域进度生成当前目标', () => {
    const save=newGame();
    expect(questText(save)).toContain('领取伙伴');
    save.team.push({species:0,level:5,hp:49,xp:0});
    expect(questText(save)).toContain('捕捉');
    save.caught=[0,1];save.badge=true;save.story.flags=['ranger-pass'];expect(questText(save)).toContain('青禾博士');
    save.story.flags.push('forest-investigation');expect(questText(save)).toContain('风铃森林');
    save.story.flags.push('met-white-gravel','forest-route-cleared');save.story.nodeId='chapter-1-dungeon';expect(questText(save)).toContain('回声洞穴');
    save.story.flags.push('extractor-off');save.story.nodeId='chapter-1-boss';expect(questText(save)).toContain('熔岩巨龟');
    save.story.flags.push('magma-tortoise-calmed');expect(questText(save)).toContain('镇长');
    save.story.flags.push('chapter-1-complete');save.story.nodeId='chapter-2-town';expect(questText(save)).toContain('第一章完成');
  });
});
