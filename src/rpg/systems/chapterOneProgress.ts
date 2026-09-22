import type { Save } from '../model';
import { acceptSideQuest, completeSideQuest, recordQuestMarker, sideQuestProgress } from './questProgress';
import { addStoryFlag, advanceStory } from './storyProgress';

export function startForestInvestigation(save:Save){
  if(!save.story.flags.includes('ranger-pass'))return false;
  addStoryFlag(save,'forest-investigation');
  advanceStory(save,'chapter-1-town');
  return true;
}

export function meetWhiteGravel(save:Save){addStoryFlag(save,'met-white-gravel');}

export function observeMoss(save:Save,id:string){return recordQuestMarker(save,'dim-glow-moss',id);}
export function findSurveyor(save:Save){return recordQuestMarker(save,'lost-surveyor','surveyor-found');}

export function deliverMossReport(save:Save){
  if(!completeSideQuest(save,'dim-glow-moss'))return false;
  save.money+=60;save.potions+=2;return true;
}

export function reportSurveyorSafe(save:Save){
  const quest=sideQuestProgress(save,'lost-surveyor');
  if(quest?.status==='active'&&quest.progress===1)recordQuestMarker(save,'lost-surveyor','reported-to-ranger');
  if(!completeSideQuest(save,'lost-surveyor'))return false;
  save.money+=80;save.balls+=2;return true;
}

export function finishChapterOne(save:Save){
  if(!save.story.flags.includes('magma-tortoise-calmed'))return false;
  addStoryFlag(save,'chapter-1-complete');addStoryFlag(save,'riverbend-pass');
  advanceStory(save,'chapter-1-boss');return true;
}

export { acceptSideQuest };
