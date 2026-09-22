import { describe, expect, it } from 'vitest';
import { newGame } from '../model';
import { addStoryFlag, advanceStory, markBossDefeated } from './storyProgress';

describe('剧情进度系统',()=>{
  it('事件标记幂等且只能从预期节点前进',()=>{
    const save=newGame();addStoryFlag(save,'ranger-pass');addStoryFlag(save,'ranger-pass');
    expect(save.story.flags).toEqual(['ranger-pass']);
    expect(advanceStory(save,'chapter-2-town')).toBe(false);expect(save.story.nodeId).toBe('chapter-1-town');
    expect(advanceStory(save,'chapter-1-town')).toBe(true);expect(save.story.nodeId).toBe('chapter-1-wild');
  });

  it('章节首领记录幂等并拒绝未知 ID',()=>{
    const save=newGame();markBossDefeated(save,'magma-tortoise');markBossDefeated(save,'magma-tortoise');
    expect(save.story.defeatedBossIds).toEqual(['magma-tortoise']);expect(()=>markBossDefeated(save,'missing')).toThrow('未知章节首领');
  });
});
