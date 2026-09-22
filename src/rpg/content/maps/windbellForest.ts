import { TILE_SIZE } from '../../config';
import type { CollisionShape, MapDocument, MapTerrainCell } from './mapDocument';
import type { Box } from './greenbudTown';

export const windbellForestEncounters: readonly Box[] = [
  { x: 5, y: 23, w: 12, h: 7 },
  { x: 30, y: 20, w: 12, h: 8 },
  { x: 8, y: 7, w: 13, h: 8 },
] as const;

export const windbellForestTrees = [
  ...Array.from({ length: 22 }, (_, index) => ({ x: index * 2, y: 2 })),
  ...Array.from({ length: 11 }, (_, index) => ({ x: 2, y: 5 + index * 3 })),
  ...Array.from({ length: 11 }, (_, index) => ({ x: 44, y: 5 + index * 3 })),
  { x: 8, y: 18 }, { x: 12, y: 20 }, { x: 17, y: 17 }, { x: 29, y: 17 },
  { x: 34, y: 15 }, { x: 39, y: 18 }, { x: 20, y: 27 }, { x: 28, y: 29 },
] as const;

export const windbellForestNpcs = [
  { id:'surveyor', x:14, y:21, name:'测量员 · 阿陆', sprite:'merchant' },
  { id:'white-gravel', x:24, y:13, name:'工程护卫 · 白砾', sprite:'silver-guard' },
] as const;

export const windbellMossClues = [
  { id:'west-moss', x:11, y:16, name:'西坡苔藓' },
  { id:'pond-moss', x:39, y:13, name:'水边苔藓' },
  { id:'south-moss', x:31, y:23, name:'南路苔藓' },
] as const;

const columns = 48, rows = 36;
const terrain: MapTerrainCell[][] = Array.from({ length: rows }, () => Array<MapTerrainCell>(columns).fill(0));

function paint(kind: MapTerrainCell, box: Box) {
  for (let y = box.y; y < box.y + box.h; y += 1) for (let x = box.x; x < box.x + box.w; x += 1) terrain[y][x] = kind;
}

// 南北主路在中段分叉后重新汇合，给第一张独立野外地图一个清晰回环。
paint(1, { x: 23, y: 3, w: 3, h: 31 });
paint(1, { x: 13, y: 15, w: 23, h: 3 });
paint(1, { x: 13, y: 15, w: 3, h: 9 });
paint(1, { x: 34, y: 15, w: 3, h: 9 });
paint(1, { x: 13, y: 22, w: 24, h: 3 });
paint(2, { x: 37, y: 5, w: 6, h: 7 });

const collisionShapes: CollisionShape[] = [
  { id: 'north-wall', shape: 'rectangle', x: 0, y: 0, width: columns * TILE_SIZE, height: 2 * TILE_SIZE },
  { id: 'south-wall-left', shape: 'rectangle', x: 0, y: 35 * TILE_SIZE, width: 23 * TILE_SIZE, height: TILE_SIZE },
  { id: 'south-wall-right', shape: 'rectangle', x: 26 * TILE_SIZE, y: 35 * TILE_SIZE, width: 22 * TILE_SIZE, height: TILE_SIZE },
  { id: 'west-wall', shape: 'rectangle', x: 0, y: 0, width: 2 * TILE_SIZE, height: rows * TILE_SIZE },
  { id: 'east-wall', shape: 'rectangle', x: 46 * TILE_SIZE, y: 0, width: 2 * TILE_SIZE, height: rows * TILE_SIZE },
  { id: 'forest-pond', shape: 'rectangle', x: 37 * TILE_SIZE, y: 5 * TILE_SIZE, width: 6 * TILE_SIZE, height: 7 * TILE_SIZE },
  ...windbellForestNpcs.map(npc => ({ id:`npc-${npc.id}`, shape:'rectangle' as const, x:npc.x*TILE_SIZE, y:npc.y*TILE_SIZE, width:TILE_SIZE, height:TILE_SIZE })),
  ...windbellMossClues.map(clue => ({ id:`clue-${clue.id}`, shape:'rectangle' as const, x:clue.x*TILE_SIZE, y:clue.y*TILE_SIZE, width:TILE_SIZE, height:TILE_SIZE })),
  ...windbellForestTrees.map((tree, index) => ({ id: `tree-${String(index + 1).padStart(2, '0')}`, shape: 'rectangle' as const, x: tree.x * TILE_SIZE, y: tree.y * TILE_SIZE, width: 2 * TILE_SIZE, height: TILE_SIZE })),
];

export const windbellForestDocument: MapDocument = {
  format: 'monster-town-map',
  version: 3,
  id: 'windbell-forest',
  name: '风铃森林',
  revision: 1,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  tileSize: TILE_SIZE,
  columns,
  rows,
  spawn: { x: 24, y: 33 },
  terrain,
  collisionShapes,
};
