import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../config';
import { validateMapDocument, type MapDocument } from './mapDocument';

const createDocument = (): MapDocument => ({
  format: 'monster-town-map',
  version: 3,
  id: 'test-map',
  name: '测试地图',
  revision: 1,
  createdAt: '2026-09-21T00:00:00.000Z',
  updatedAt: '2026-09-21T00:00:00.000Z',
  tileSize: TILE_SIZE,
  columns: 8,
  rows: 8,
  spawn: { x: 2, y: 3 },
  terrain: Array.from({ length: 8 }, () => Array(8).fill(0)),
  collisionShapes: [{ id: 'north-wall', shape: 'rectangle', x: 0, y: 0, width: 8 * TILE_SIZE, height: TILE_SIZE }],
});

describe('validateMapDocument', () => {
  it('接受当前游戏使用的静态地图结构', () => {
    expect(validateMapDocument(createDocument())).toMatchObject({ id: 'test-map', columns: 8, rows: 8 });
  });

  it('拒绝旧编辑器版本与无效地形', () => {
    expect(() => validateMapDocument({ ...createDocument(), version: 2 })).toThrow('地图格式或版本不支持');
    const terrain = createDocument().terrain.map((row) => [...row]);
    terrain[0][0] = 3 as never;
    expect(() => validateMapDocument({ ...createDocument(), terrain })).toThrow('地形列数或编号不正确');
  });

  it('拒绝越界碰撞区域', () => {
    expect(() => validateMapDocument({
      ...createDocument(),
      collisionShapes: [{ id: 'bad-wall', shape: 'rectangle', x: 0, y: 0, width: 9999, height: TILE_SIZE }],
    })).toThrow('超出地图或尺寸不正确');
  });
});
