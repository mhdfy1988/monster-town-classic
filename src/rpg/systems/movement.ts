export interface Direction { x: -1 | 0 | 1; y: -1 | 0 | 1; frame: 0 | 3 | 6 | 9 }

export interface MovementInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export const MOVEMENT_DURATION_MS = 150;

const directions = {
  left: { x: -1, y: 0, frame: 3 },
  right: { x: 1, y: 0, frame: 6 },
  up: { x: 0, y: -1, frame: 9 },
  down: { x: 0, y: 1, frame: 0 },
} as const satisfies Record<string, Direction>;

export function directionFromInput(input: MovementInput): Direction | null {
  if (input.left) return directions.left;
  if (input.right) return directions.right;
  if (input.up) return directions.up;
  if (input.down) return directions.down;
  return null;
}

export const standingFrame = (direction: Direction) => direction.frame + 1;
export const walkingFrame = (direction: Direction, elapsedMs: number) => direction.frame + [1, 0, 1, 2][Math.floor(elapsedMs / 90) % 4];
export const nextTile = (x: number, y: number, direction: Direction) => ({ x: x + direction.x, y: y + direction.y });
export const nextBufferedDirection = (buffered: Direction | null, held: Direction | null) => buffered ?? held;
