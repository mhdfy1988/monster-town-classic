import {describe,expect,it} from 'vitest';
import {newGame} from '../model';
import {acceptSideQuest,completeSideQuest,mainQuestSnapshot,questJournal,recordQuestMarker} from './questProgress';

describe('任务进度',()=>{
  it('主线从现有剧情状态派生，不保存第二份主线进度',()=>{
    const save=newGame();expect(mainQuestSnapshot(save).objective).toContain('研究所');
    save.team.push({species:0,level:5,hp:49,xp:0});save.caught=[0,1];save.story.flags.push('ranger-pass','forest-investigation');
    expect(mainQuestSnapshot(save)).toMatchObject({id:'chapter-1',progress:4,status:'active'});
    save.story.flags.push('chapter-1-complete');expect(mainQuestSnapshot(save).status).toBe('completed');
  });

  it('支线只记录唯一目标并在达成后显式结算',()=>{
    const save=newGame();acceptSideQuest(save,'dim-glow-moss');
    expect(recordQuestMarker(save,'dim-glow-moss','moss-1')).toBe(true);expect(recordQuestMarker(save,'dim-glow-moss','moss-1')).toBe(false);
    recordQuestMarker(save,'dim-glow-moss','moss-2');recordQuestMarker(save,'dim-glow-moss','moss-3');
    expect(save.sideQuests[0]).toMatchObject({status:'ready',progress:3});expect(completeSideQuest(save,'dim-glow-moss')).toBe(true);
    expect(questJournal(save).find(quest=>quest.id==='dim-glow-moss')?.status).toBe('completed');
  });
});
