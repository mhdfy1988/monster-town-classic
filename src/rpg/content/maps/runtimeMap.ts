import type { MapDocument } from './mapDocument';

export type RuntimeMapKind = 'town' | 'interior' | 'wild' | 'dungeon';

export interface RuntimeMapTransition {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
  requiredFlag?: string;
}

export interface RuntimeMapDefinition {
  id: string;
  regionId: string;
  name: string;
  kind: RuntimeMapKind;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  transitions: readonly RuntimeMapTransition[];
  encounterZones: readonly { x: number; y: number; w: number; h: number }[];
  document?: MapDocument;
  isBlocked(x: number, y: number): boolean;
}
