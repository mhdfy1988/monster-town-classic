import { TILE_SIZE } from '../../config';

export type TerrainIndex = 0 | 1 | 2 | 4 | 5 | 6 | 7 | 8;
export type MapTerrainCell = TerrainIndex | null;

export interface CollisionPoint {
  x: number;
  y: number;
}

export interface RectangleCollisionShape {
  id: string;
  shape: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PolygonCollisionShape {
  id: string;
  shape: 'polygon';
  points: CollisionPoint[];
}

export type CollisionShape = RectangleCollisionShape | PolygonCollisionShape;

/** 游戏运行时使用的静态地图文档，不包含旧编辑器的图块覆盖与制作状态。 */
export interface MapDocument {
  format: 'monster-town-map';
  version: 3;
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  tileSize: typeof TILE_SIZE;
  columns: number;
  rows: number;
  spawn: CollisionPoint;
  terrain: MapTerrainCell[][];
  collisionShapes: CollisionShape[];
}

const MAP_ID_PATTERN = /^[a-z0-9][a-z0-9-_]{2,63}$/;
const TERRAIN_IDS = new Set<number>([0, 1, 2, 4, 5, 6, 7, 8]);

function validateCollisionShapes(value: unknown, width: number, height: number): CollisionShape[] {
  if (!Array.isArray(value)) throw new Error('碰撞区域数据不正确');
  const ids = new Set<string>();
  return value.map((raw) => {
    if (typeof raw !== 'object' || raw === null) throw new Error('碰撞区域数据不正确');
    const shape = raw as Partial<CollisionShape>;
    if (typeof shape.id !== 'string' || !MAP_ID_PATTERN.test(shape.id) || ids.has(shape.id)) {
      throw new Error('碰撞区域 ID 不正确或重复');
    }
    ids.add(shape.id);
    if (shape.shape === 'rectangle') {
      const rectangle = shape as Partial<RectangleCollisionShape>;
      if (![rectangle.x, rectangle.y, rectangle.width, rectangle.height].every(Number.isFinite)
        || rectangle.x! < 0 || rectangle.y! < 0 || rectangle.width! <= 0 || rectangle.height! <= 0
        || rectangle.x! + rectangle.width! > width || rectangle.y! + rectangle.height! > height) {
        throw new Error(`矩形碰撞区域 ${shape.id} 超出地图或尺寸不正确`);
      }
      return { id: shape.id, shape: 'rectangle', x: rectangle.x!, y: rectangle.y!, width: rectangle.width!, height: rectangle.height! };
    }
    if (shape.shape === 'polygon') {
      const polygon = shape as Partial<PolygonCollisionShape>;
      if (!Array.isArray(polygon.points) || polygon.points.length < 3 || polygon.points.some((point) => !point
        || !Number.isFinite(point.x) || !Number.isFinite(point.y)
        || point.x < 0 || point.y < 0 || point.x > width || point.y > height)) {
        throw new Error(`多边形碰撞区域 ${shape.id} 的顶点不正确`);
      }
      return { id: shape.id, shape: 'polygon', points: polygon.points.map(({ x, y }) => ({ x, y })) };
    }
    throw new Error(`碰撞区域 ${shape.id} 的形状不支持`);
  });
}

export function validateMapDocument(value: unknown): MapDocument {
  if (typeof value !== 'object' || value === null) throw new Error('地图数据不正确');
  const document = value as Partial<MapDocument>;
  if (document.format !== 'monster-town-map' || document.version !== 3) throw new Error('地图格式或版本不支持');
  if (typeof document.id !== 'string' || !MAP_ID_PATTERN.test(document.id)) throw new Error('地图 ID 不正确');
  if (typeof document.name !== 'string' || !document.name.trim()) throw new Error('地图名称不能为空');
  if (!Number.isInteger(document.columns) || document.columns! < 8 || document.columns! > 128
    || !Number.isInteger(document.rows) || document.rows! < 8 || document.rows! > 128) throw new Error('地图尺寸不正确');
  if (document.tileSize !== TILE_SIZE) throw new Error(`地图地块尺寸必须是 ${TILE_SIZE}px`);
  const columns = document.columns!;
  const rows = document.rows!;
  if (!document.spawn || !Number.isInteger(document.spawn.x) || !Number.isInteger(document.spawn.y)
    || document.spawn.x < 0 || document.spawn.y < 0 || document.spawn.x >= columns || document.spawn.y >= rows) {
    throw new Error('出生点必须位于地图网格内');
  }
  if (!Array.isArray(document.terrain) || document.terrain.length !== rows) throw new Error('地形行数不正确');
  const terrain = document.terrain.map((row) => {
    if (!Array.isArray(row) || row.length !== columns
      || row.some((cell) => cell !== null && !TERRAIN_IDS.has(cell))) throw new Error('地形列数或编号不正确');
    return [...row];
  });
  return {
    ...document,
    name: document.name.trim(),
    terrain,
    collisionShapes: validateCollisionShapes(document.collisionShapes, columns * TILE_SIZE, rows * TILE_SIZE),
  } as MapDocument;
}
