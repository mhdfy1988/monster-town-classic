import { isTownBlocked, wildZones, townGate, inBox } from './greenbudTown';
import { mapDocumentToRuntime } from './mapDocumentAdapter';
import type { RuntimeMapDefinition } from './runtimeMap';
import { windbellForestDocument, windbellForestEncounters } from './windbellForest';
import { echoCaveDocument, echoCaveEncounters } from './echoCave';

const definitions = {
  'greenbud-town': {
    id: 'greenbud-town', regionId: 'greenbud-town', name: '青芽镇', kind: 'town', width: 48, height: 36,
    spawn: { x: 20, y: 22 }, encounterZones: wildZones,
    transitions: [
      { x: 20, y: 15, targetMap: 'greenbud-lab', targetX: 20, targetY: 19 },
      ...Array.from({length:townGate.w},(_,i)=>({ x: townGate.x+i, y: townGate.y, targetMap: 'windbell-forest', targetX: 24, targetY: 33, requiredFlag: 'forest-investigation' })),
    ],
    isBlocked: isTownBlocked,
  },
  'greenbud-lab': {
    id: 'greenbud-lab', regionId: 'greenbud-town', name: '青芽研究所', kind: 'interior', width: 40, height: 25,
    spawn: { x: 20, y: 19 }, encounterZones: [],
    transitions: [{ x: 20, y: 20, targetMap: 'greenbud-town', targetX: 20, targetY: 16 }],
    isBlocked: (x: number, y: number) => x < 12 || x > 27 || y < 6 || y > 20 || (y === 9 && x >= 14 && x <= 25) || (x === 25 && y === 12),
  },
  'windbell-forest': mapDocumentToRuntime(windbellForestDocument, {
    regionId: 'windbell-forest', kind: 'wild', encounterZones: windbellForestEncounters,
    transitions: [
      { x: 24, y: 34, targetMap: 'greenbud-town', targetX: 34, targetY: 5 },
      { x: 24, y: 3, targetMap: 'echo-cave', targetX: 22, targetY: 30, requiredFlag: 'forest-route-cleared' },
    ],
  }),
  'echo-cave': mapDocumentToRuntime(echoCaveDocument, {
    regionId:'echo-cave',kind:'dungeon',encounterZones:echoCaveEncounters,
    transitions:[{x:22,y:31,targetMap:'windbell-forest',targetX:24,targetY:4}],
  }),
} satisfies Record<string, RuntimeMapDefinition>;

export const runtimeMaps = definitions;
export type RuntimeMapId = keyof typeof runtimeMaps;

export function isRuntimeMapId(value: unknown): value is RuntimeMapId {
  return typeof value === 'string' && Object.hasOwn(runtimeMaps, value);
}

export function mapDefinition(id: RuntimeMapId): RuntimeMapDefinition { return runtimeMaps[id]; }
export const isBlocked = (map: RuntimeMapId, x: number, y: number) => runtimeMaps[map].isBlocked(x, y);
export const isMovementBlocked = (map: RuntimeMapId,x:number,y:number,flags:readonly string[]) => isBlocked(map,x,y)
  || (map==='greenbud-town' && inBox(x,y,townGate) && !flags.includes('forest-investigation'))
  || (map==='windbell-forest' && x===24 && y===3 && !flags.includes('forest-route-cleared'));
export const isValidMapLocation = (map: unknown, x: unknown, y: unknown) => isRuntimeMapId(map)
  && Number.isInteger(x) && Number.isInteger(y) && !runtimeMaps[map].isBlocked(Number(x), Number(y));
