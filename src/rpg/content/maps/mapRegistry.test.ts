import { describe,expect,it } from 'vitest';
import { isMovementBlocked, isRuntimeMapId, isValidMapLocation, runtimeMaps } from './mapRegistry';
import { echoCaveExitMarker } from './echoCave';

describe('运行地图注册表',()=>{
  it('第一章城镇、室内、独立野外与洞穴地图使用稳定 ID 和明确尺寸',()=>{
    expect(Object.keys(runtimeMaps)).toEqual(['greenbud-town','greenbud-lab','windbell-forest','echo-cave']);
    expect(runtimeMaps['greenbud-town']).toMatchObject({regionId:'greenbud-town',kind:'town',width:48,height:36});
    expect(runtimeMaps['greenbud-lab']).toMatchObject({regionId:'greenbud-town',kind:'interior',width:40,height:25});
    expect(runtimeMaps['windbell-forest']).toMatchObject({regionId:'windbell-forest',kind:'wild',width:48,height:36,spawn:{x:24,y:33}});
    expect(runtimeMaps['windbell-forest'].document?.id).toBe('windbell-forest');
    expect(runtimeMaps['echo-cave']).toMatchObject({regionId:'echo-cave',kind:'dungeon',width:44,height:34,spawn:{x:22,y:30}});
    expect(runtimeMaps['echo-cave'].document?.id).toBe('echo-cave');
  });

  it('所有传送目标与落点都属于已注册地图',()=>{
    for(const map of Object.values(runtimeMaps))for(const transition of map.transitions){
      expect(isRuntimeMapId(transition.targetMap),`${map.id} -> ${transition.targetMap}`).toBe(true);
      expect(isValidMapLocation(transition.targetMap,transition.targetX,transition.targetY)).toBe(true);
    }
  });

  it('森林落石清理前阻挡洞口，清理后才允许进入传送格',()=>{
    expect(isMovementBlocked('windbell-forest',24,3,[])).toBe(true);
    expect(isMovementBlocked('windbell-forest',24,3,['forest-route-cleared'])).toBe(false);
  });

  it('洞穴出口提示避开出生点、传送格和底部功能栏区域',()=>{
    const exit=runtimeMaps['echo-cave'].transitions[0];
    expect(echoCaveExitMarker.y).toBeLessThan(exit.y);
    expect(Math.abs(echoCaveExitMarker.x-(exit.x+.5))).toBeGreaterThanOrEqual(3);
    expect(`${echoCaveExitMarker.x},${echoCaveExitMarker.y}`).not.toBe('22,30');
  });
});
