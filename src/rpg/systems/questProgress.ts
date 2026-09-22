import { mainQuestDefinitions, sideQuestDefinitions, type QuestDefinition } from '../content/quests';
import type { Save, SideQuestProgress } from '../model';
import { echoSequenceProgress } from './caveProgress';

export interface QuestSnapshot extends QuestDefinition {
  status:'available'|'active'|'ready'|'completed';
  progress:number;
  objective:string;
}

export function sideQuestProgress(save:Pick<Save,'sideQuests'>,id:string){return save.sideQuests.find(quest=>quest.id===id);}

export function acceptSideQuest(save:Pick<Save,'sideQuests'>,id:string){
  if(!sideQuestDefinitions.some(quest=>quest.id===id))throw new Error(`未知支线任务：${id}`);
  const existing=sideQuestProgress(save,id);if(existing)return existing;
  const created:SideQuestProgress={id,status:'active',progress:0,markers:[]};save.sideQuests.push(created);return created;
}

export function recordQuestMarker(save:Pick<Save,'sideQuests'>,id:string,marker:string){
  const quest=sideQuestProgress(save,id);if(!quest||quest.status==='completed'||quest.markers.includes(marker))return false;
  quest.markers.push(marker);quest.progress=quest.markers.length;
  const definition=sideQuestDefinitions.find(entry=>entry.id===id)!;
  if(quest.progress>=definition.objectiveCount)quest.status='ready';
  return true;
}

export function completeSideQuest(save:Pick<Save,'sideQuests'>,id:string){
  const quest=sideQuestProgress(save,id);if(!quest||quest.status!=='ready')return false;
  quest.status='completed';return true;
}

export function mainQuestSnapshot(save:Save):QuestSnapshot {
  const definition=mainQuestDefinitions[0];let progress=0,objective='前往青芽研究所领取伙伴';
  if(save.team.length){progress=1;objective='在镇内长草中捕捉第二种伙伴';}
  if(save.caught.length>=2){progress=2;objective='挑战东北方的巡林员林川';}
  if(save.story.flags.includes('ranger-pass')){progress=3;objective='向青禾博士报告，领取森林调查委托';}
  if(save.story.flags.includes('forest-investigation')){progress=4;objective='穿过风铃森林，调查异常热风的来源';}
  if(save.story.flags.includes('met-white-gravel')){progress=5;objective='清理森林北侧通往回声洞穴的道路';}
  if(save.story.flags.includes('forest-route-cleared')){progress=6;objective=`在回声洞穴依次确认三段回声（${echoSequenceProgress(save)}/3）`;}
  if(save.story.flags.includes('extractor-off')){progress=7;objective='安抚被设备惊醒的熔岩巨龟';}
  if(save.story.flags.includes('magma-tortoise-calmed')){progress=8;objective='返回青芽镇，向镇长报告调查结果';}
  if(save.story.flags.includes('chapter-1-complete')){progress=9;objective='第一章完成 · 河湾镇通行证已取得';}
  return {...definition,status:progress>=definition.objectiveCount?'completed':'active',progress,objective};
}

function sideObjective(id:string,progress?:SideQuestProgress){
  if(!progress)return '尚未接取';
  if(progress.status==='completed')return '已完成';
  if(id==='lost-surveyor')return progress.status==='ready'?'回青芽镇向林川报平安':'前往风铃森林西侧寻找测量员';
  return progress.status==='ready'?'回青芽镇把观察结果交给小夏':`调查三处暗淡苔藓（${progress.progress}/3）`;
}

export function questJournal(save:Save):QuestSnapshot[]{
  const main=mainQuestSnapshot(save);
  const sides=sideQuestDefinitions.map(definition=>{const progress=sideQuestProgress(save,definition.id);return {...definition,status:progress?.status??'available',progress:progress?.progress??0,objective:sideObjective(definition.id,progress)} as QuestSnapshot;});
  return [main,...sides];
}
