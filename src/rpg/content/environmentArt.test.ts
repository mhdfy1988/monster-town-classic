import { describe,expect,it } from 'vitest';
import { cliffSegments } from './environmentArt';

describe('洞窟岩壁片段',()=>{
  it('完整覆盖岩沿且长岩壁不会重复同一种宽度与朝向',()=>{
    const segments=cliffSegments(0,44,1);
    expect(segments.reduce((sum,segment)=>sum+segment.tiles,0)).toBe(44);
    expect(new Set(segments.map(segment=>segment.tiles)).size).toBeGreaterThan(1);
    expect(new Set(segments.map(segment=>segment.flip)).size).toBe(2);
    expect(new Set(segments.map(segment=>segment.tint)).size).toBeGreaterThan(1);
    for(let index=1;index<segments.length;index++)expect(segments[index].x).toBe(segments[index-1].x+segments[index-1].tiles);
  });
});
