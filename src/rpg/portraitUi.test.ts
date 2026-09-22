import { describe, expect, it } from 'vitest';
import { menuIcon, partnerCard, portrait } from './portraitUi';
import { makeMonster } from './model';

describe('队伍视觉数据', () => {
  it('土系与水系使用独立三阶资产并提供可读名称', () => {
    expect(portrait(makeMonster(2, 5))).toContain('/forms/002.png');
    expect(portrait(makeMonster(2, 5))).toContain('小岩龟');
    expect(portrait(makeMonster(5, 20))).toContain('/forms/003.png');
    expect(portrait({...makeMonster(5,20),form:2})).toContain('巨浪水龙');
  });
  it('选中状态和无法战斗状态来自真实数据', () => {
    const monster = makeMonster(1, 5);monster.hp = 0;
    const html = partnerCard(monster, 1, true);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('无法战斗');
    expect(html).toContain('width:0%');
  });
  it('四个菜单入口提供矢量图标', () => {
    for (const name of ['team','bag','book','save'] as const) expect(menuIcon(name)).toContain('<svg');
  });
});
