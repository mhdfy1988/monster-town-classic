import { describe, expect, it } from 'vitest';
import { battleMusic, mapMusic, TITLE_MUSIC } from './audioCues';
import { runtimeMaps } from './maps/mapRegistry';

describe('第一章音乐映射', () => {
  it('标题和每张已实现地图都有显式音乐，不依赖缺失资源回退', () => {
    expect(TITLE_MUSIC).toBe('exploration');
    expect(Object.keys(mapMusic).sort()).toEqual(Object.keys(runtimeMaps).sort());
    expect(Object.values(mapMusic).every(Boolean)).toBe(true);
  });

  it('野生、训练家和首领战都有明确战斗音乐', () => {
    expect(battleMusic).toEqual({ wild: 'battle', trainer: 'battle', boss: 'battle' });
  });
});
