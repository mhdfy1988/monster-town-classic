import { describe, expect, it } from 'vitest';
import { directionFromInput, MOVEMENT_DURATION_MS, nextBufferedDirection, nextTile, standingFrame, walkingFrame } from './movement';

describe('格子移动系统', () => {
  it('按左、右、上、下顺序解析同时按键', () => {
    expect(directionFromInput({ left: true, right: true, up: false, down: false })).toEqual({ x: -1, y: 0, frame: 3 });
    expect(directionFromInput({ left: false, right: false, up: true, down: true })).toEqual({ x: 0, y: -1, frame: 9 });
  });

  it('统一计算站立帧、行走帧与目标格', () => {
    const direction = directionFromInput({ left: false, right: true, up: false, down: false })!;
    expect(standingFrame(direction)).toBe(7);
    expect([0, 90, 180, 270].map(time => walkingFrame(direction, time))).toEqual([7, 6, 7, 8]);
    expect(nextTile(4, 8, direction)).toEqual({ x: 5, y: 8 });
  });

  it('优先消费移动期间缓存的转向，并保持紧凑的单格时长', () => {
    const held = directionFromInput({ left: false, right: false, up: true, down: false });
    const buffered = directionFromInput({ left: false, right: true, up: false, down: false });
    expect(nextBufferedDirection(buffered, held)).toBe(buffered);
    expect(nextBufferedDirection(null, held)).toBe(held);
    expect(MOVEMENT_DURATION_MS).toBe(150);
  });
});
