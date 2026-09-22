import { TILE_SIZE } from '../../config';
import { validateMapDocument, type CollisionPoint, type CollisionShape, type MapDocument } from './mapDocument';
import type { RuntimeMapDefinition, RuntimeMapKind, RuntimeMapTransition } from './runtimeMap';

function pointInsidePolygon(point: CollisionPoint, polygon: readonly CollisionPoint[]) {
  let inside = false;
  for (let i = 0, previous = polygon.length - 1; i < polygon.length; previous = i++) {
    const a = polygon[i], b = polygon[previous];
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function collisionContains(shape: CollisionShape, point: CollisionPoint) {
  if (shape.shape === 'rectangle') {
    return point.x >= shape.x && point.y >= shape.y && point.x < shape.x + shape.width && point.y < shape.y + shape.height;
  }
  return pointInsidePolygon(point, shape.points);
}

export function mapDocumentToRuntime(
  input: MapDocument,
  options: {
    regionId: string;
    kind: RuntimeMapKind;
    transitions?: readonly RuntimeMapTransition[];
    encounterZones?: RuntimeMapDefinition['encounterZones'];
  },
): RuntimeMapDefinition {
  const document = validateMapDocument(input);
  return {
    id: document.id,
    regionId: options.regionId,
    name: document.name,
    kind: options.kind,
    width: document.columns,
    height: document.rows,
    spawn: { ...document.spawn },
    transitions: options.transitions ?? [],
    encounterZones: options.encounterZones ?? [],
    document,
    isBlocked(x, y) {
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= document.columns || y >= document.rows) return true;
      const foot = { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 };
      return document.collisionShapes.some(shape => collisionContains(shape, foot));
    },
  };
}
