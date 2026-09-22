import { describe, expect, it } from 'vitest';
import { windbellForestDocument } from './windbellForest';
import { mapDocumentToRuntime } from './mapDocumentAdapter';

describe('地图文档运行时适配器',()=>{
  it('复用静态地图尺寸、出生点和矩形碰撞',()=>{
    const map=mapDocumentToRuntime(windbellForestDocument,{regionId:'windbell-forest',kind:'wild'});
    expect(map).toMatchObject({id:'windbell-forest',width:48,height:36,spawn:{x:24,y:33}});
    expect(map.isBlocked(-1,0)).toBe(true);expect(map.isBlocked(38,7)).toBe(true);expect(map.isBlocked(24,33)).toBe(false);
  });

  it('支持多边形碰撞而不需要运行地图另写规则',()=>{
    const input={...windbellForestDocument,id:'polygon-test',collisionShapes:[{id:'triangle-area',shape:'polygon' as const,points:[{x:0,y:0},{x:64,y:0},{x:0,y:64}]}]};
    const map=mapDocumentToRuntime(input,{regionId:'polygon-test',kind:'wild'});
    expect(map.isBlocked(0,0)).toBe(true);expect(map.isBlocked(5,5)).toBe(false);
  });
});
