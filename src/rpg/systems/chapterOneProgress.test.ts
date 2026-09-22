import { describe,expect,it } from 'vitest';
import { makeMonster,newGame } from '../model';
import { acceptSideQuest, deliverMossReport, findSurveyor, finishChapterOne, meetWhiteGravel, observeMoss, reportSurveyorSafe, startForestInvestigation } from './chapterOneProgress';
import { addStoryFlag } from './storyProgress';

describe('第一章任务闭环',()=>{
  it('从林川考验后经过博士委托、森林线索和两条支线完成返镇结算',()=>{
    const save=newGame();save.team=[makeMonster(1,8)];save.caught=[0,1];save.badge=true;addStoryFlag(save,'ranger-pass');
    expect(startForestInvestigation(save)).toBe(true);expect(save.story.nodeId).toBe('chapter-1-wild');
    acceptSideQuest(save,'lost-surveyor');acceptSideQuest(save,'dim-glow-moss');
    expect(findSurveyor(save)).toBe(true);expect(reportSurveyorSafe(save)).toBe(true);expect(save.money).toBe(180);expect(save.balls).toBe(10);
    for(const clue of ['west-moss','pond-moss','south-moss'])expect(observeMoss(save,clue)).toBe(true);
    expect(deliverMossReport(save)).toBe(true);expect(save.money).toBe(240);expect(save.potions).toBe(6);
    meetWhiteGravel(save);expect(save.story.flags).toContain('met-white-gravel');
    save.story.nodeId='chapter-1-boss';addStoryFlag(save,'magma-tortoise-calmed');
    expect(finishChapterOne(save)).toBe(true);expect(save.story.flags).toEqual(expect.arrayContaining(['chapter-1-complete','riverbend-pass']));expect(save.story.nodeId).toBe('chapter-2-town');
  });

  it('奖励和章节结算不能重复领取',()=>{
    const save=newGame();acceptSideQuest(save,'lost-surveyor');findSurveyor(save);expect(reportSurveyorSafe(save)).toBe(true);const money=save.money;
    expect(reportSurveyorSafe(save)).toBe(false);expect(save.money).toBe(money);expect(finishChapterOne(save)).toBe(false);
  });
});
