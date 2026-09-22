import { describe,expect,it } from 'vitest';
import { newGame } from '../model';
import { acceptSideQuest, recordQuestMarker } from '../systems/questProgress';
import { questView } from './questView';

describe('任务日志视图',()=>{
  it('同时呈现主线、可接支线和进行中进度',()=>{
    const save=newGame();acceptSideQuest(save,'dim-glow-moss');recordQuestMarker(save,'dim-glow-moss','west-moss');
    const html=questView(save);expect(html).toContain('森林发热了');expect(html).toContain('迷路的测量员');expect(html).toContain('暗淡的苔光');expect(html).toContain('调查三处暗淡苔藓（1/3）');expect(html).toContain('可接取');
  });
});
