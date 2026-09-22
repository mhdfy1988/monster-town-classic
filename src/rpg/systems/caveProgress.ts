import type { Save } from '../model';
import { addStoryFlag, advanceStory } from './storyProgress';

const echoFlags=['echo-tone-1','echo-tone-2','echo-tone-3'] as const;
export const echoSequenceProgress=(save:Pick<Save,'story'>)=>echoFlags.filter(flag=>save.story.flags.includes(flag)).length;

export function activateEchoBeacon(save:Pick<Save,'story'>,index:1|2|3){
  const expected=echoSequenceProgress(save)+1;
  if(index===expected){addStoryFlag(save,echoFlags[index-1]);return {correct:true,complete:index===3,progress:index};}
  save.story.flags=save.story.flags.filter(flag=>!echoFlags.includes(flag as typeof echoFlags[number]));
  if(index===1)addStoryFlag(save,echoFlags[0]);
  return {correct:false,complete:false,progress:index===1?1:0};
}

export const canShutDownExtractor=(save:Pick<Save,'story'>)=>echoSequenceProgress(save)===3;
export function shutDownExtractor(save:Pick<Save,'story'>){
  if(!canShutDownExtractor(save))return false;
  addStoryFlag(save,'extractor-off');advanceStory(save,'chapter-1-dungeon');return true;
}
