import { describe,expect,it } from 'vitest';
import { newGame } from '../model';
import { activateEchoBeacon, canShutDownExtractor, echoSequenceProgress, shutDownExtractor } from './caveProgress';

describe('回声洞穴机关',()=>{
  it('按低中高顺序点亮回声石后才能关闭设备',()=>{
    const save=newGame();save.story.nodeId='chapter-1-dungeon';
    expect(activateEchoBeacon(save,1)).toMatchObject({correct:true,progress:1});
    expect(activateEchoBeacon(save,2)).toMatchObject({correct:true,progress:2});
    expect(activateEchoBeacon(save,3)).toMatchObject({correct:true,complete:true});
    expect(canShutDownExtractor(save)).toBe(true);expect(shutDownExtractor(save)).toBe(true);
    expect(save.story.flags).toContain('extractor-off');expect(save.story.nodeId).toBe('chapter-1-boss');
  });

  it('错误音序会重置路线提示',()=>{
    const save=newGame();activateEchoBeacon(save,1);activateEchoBeacon(save,3);
    expect(echoSequenceProgress(save)).toBe(0);expect(shutDownExtractor(save)).toBe(false);
  });
});
