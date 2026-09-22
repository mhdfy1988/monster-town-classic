import type { Save } from '../model';
import { npcs } from './maps/greenbudTown';
import { isRuntimeMapId, mapDefinition } from './maps/mapRegistry';
import { echoBeacons, echoExtractor } from './maps/echoCave';
import { windbellForestNpcs, windbellMossClues } from './maps/windbellForest';

export type Interaction =
  | { kind: 'starter' }
  | { kind: 'heal' }
  | { kind: 'shop' }
  | { kind: 'ranger-trial'; replay: boolean }
  | { kind: 'forest-briefing' }
  | { kind: 'guide-moss' }
  | { kind: 'ranger-surveyor' }
  | { kind: 'forest-surveyor' }
  | { kind: 'forest-clue'; id:string; name:string }
  | { kind: 'white-gravel' }
  | { kind: 'chapter-one-finale' }
  | { kind: 'forest-route' }
  | { kind: 'echo-beacon'; index: 1|2|3; name: string }
  | { kind: 'cave-device' }
  | { kind: 'dialog'; title: string; body: string };

const sideState=(save:Save,id:string)=>save.sideQuests.find(quest=>quest.id===id);

export function interactionAt(save: Save, facing: {x:number;y:number}): Interaction {
  if(save.map==='greenbud-lab'&&Math.abs(save.x-20)+Math.abs(save.y-11)<=2){
    if(!save.team.length)return {kind:'starter'};
    if(save.story.flags.includes('chapter-1-complete'))return {kind:'dialog',title:'青禾博士',body:'这次调查留下的温度和回声记录很有价值。河湾镇也出现了类似异常，下一段旅程会用得上这些资料。'};
    if(save.story.flags.includes('magma-tortoise-calmed'))return {kind:'dialog',title:'青禾博士',body:'你成功安抚了熔岩巨龟！先去镇中心向镇长正式报告，林川也在等你的消息。'};
    if(save.story.flags.includes('ranger-pass')&&!save.story.flags.includes('forest-investigation'))return {kind:'forest-briefing'};
    if(save.story.flags.includes('forest-investigation'))return {kind:'dialog',title:'青禾博士',body:'风铃森林的热风来自北面。先找当地人员确认生态变化，再沿主路调查回声洞穴。不要贸然触碰陌生设备。'};
    return {kind:'dialog',title:'青禾博士',body:'试着在长草中结识新伙伴。捕捉至少一种野生伙伴后，去东北方找巡林员林川。\n火克木，木克土，土克火。受伤就找镇里的护理员。'};
  }
  const targetX=save.x+facing.x,targetY=save.y+facing.y;
  if(save.map==='windbell-forest'){
    const forestNpc=windbellForestNpcs.find(entry=>entry.x===targetX&&entry.y===targetY);
    if(forestNpc?.id==='surveyor')return {kind:'forest-surveyor'};
    if(forestNpc?.id==='white-gravel')return save.story.flags.includes('met-white-gravel')
      ?{kind:'dialog',title:forestNpc.name,body:'倒木后面的石坡已经稳定了。沿这条路向北就是洞穴，里面的设备比图纸标注的更老。'}
      :{kind:'white-gravel'};
    const clue=windbellMossClues.find(entry=>entry.x===targetX&&entry.y===targetY);
    if(clue)return {kind:'forest-clue',id:clue.id,name:clue.name};
    if(targetX===24&&targetY===3&&!save.story.flags.includes('forest-route-cleared'))return {kind:'forest-route'};
  }
  if(save.map==='echo-cave'){
    const beacon=echoBeacons.find(entry=>entry.x===targetX&&entry.y===targetY);
    if(beacon)return {kind:'echo-beacon',index:beacon.index,name:beacon.name};
    if(targetX===echoExtractor.x&&targetY===echoExtractor.y)return {kind:'cave-device'};
  }
  const npc=npcs.find(entry=>save.map==='greenbud-town'&&((entry.x===targetX&&entry.y===targetY)||Math.abs(entry.x-save.x)+Math.abs(entry.y-save.y)===1));
  if(npc?.id==='healer')return {kind:'heal'};
  if(npc?.id==='shop')return {kind:'shop'};
  if(npc?.id==='mayor'){
    if(save.story.flags.includes('magma-tortoise-calmed')&&!save.story.flags.includes('chapter-1-complete'))return {kind:'chapter-one-finale'};
    return {kind:'dialog',title:npc.name,body:save.story.flags.includes('chapter-1-complete')?'河湾镇的渡口已经收到通知。整备完成后，你随时可以踏上下一段旅程。':'最近森林里的风变得发热，镇里已经请青禾博士查明原因。完成林川的考验后，去研究所听取安排吧。'};
  }
  if(npc?.id==='guide'){
    const moss=sideState(save,'dim-glow-moss');
    if(save.story.flags.includes('magma-tortoise-calmed'))return {kind:'dialog',title:npc.name,body:'你平安回来就好！森林的苔光也正在恢复，镇长在中央路口等你做正式报告。'};
    if(save.story.flags.includes('forest-investigation')&&(!moss||moss.status==='ready'))return {kind:'guide-moss'};
    if(moss?.status==='active')return {kind:'dialog',title:npc.name,body:`三处苔藓分布在西坡、水边和南路。现在记录了 ${moss.progress}/3 处，别漏掉背阴的位置。`};
    return {kind:'dialog',title:npc.name,body:save.team.length?'东北的小路通往林川的营地。长草里会遇到野生伙伴；先削弱它，再投出捕捉球。\nT 查看队伍，B 打开背包，M 查看旅行手册。':'研究所在北边，沿着这条路走进蓝色屋顶的门。青禾博士正在等你。'};
  }
  if(npc?.id==='ranger'){
    const surveyor=sideState(save,'lost-surveyor');
    if(save.story.flags.includes('magma-tortoise-calmed'))return {kind:'dialog',title:npc.name,body:'回声洞穴的热风已经停了。你先去向镇长报告，我会带人重新检查森林北路。'};
    if(save.story.flags.includes('forest-investigation')&&(!surveyor||surveyor.progress===1||surveyor.status==='ready'))return {kind:'ranger-surveyor'};
    if(surveyor?.status==='active')return {kind:'dialog',title:npc.name,body:'阿陆最后一次回报来自森林西侧环路。找到他后立刻回来告诉我。'};
    if(!save.team.length)return {kind:'dialog',title:npc.name,body:'你还没有伙伴。先到青芽研究所来一场相遇吧。'};
    if(save.caught.length<2)return {kind:'dialog',title:npc.name,body:'我的考验需要你先结识一种野生伙伴。去附近长草捕捉一只，再来找我。'};
    return {kind:'ranger-trial',replay:save.badge};
  }
  if(save.map==='greenbud-town'&&save.x===34&&save.y===4&&!save.story.flags.includes('forest-investigation'))return {kind:'dialog',title:'青芽镇北门',body:save.story.flags.includes('ranger-pass')?'青禾博士还没有签发森林调查记录。先回研究所听取正式委托。':'林川暂时封锁了通往风铃森林的北门。完成巡林员考验后再来吧。'};
  return {kind:'dialog',title:'旅行提示',body:save.map==='greenbud-lab'?'走到博士身边按 E 交谈。南侧出口可以回到小镇。':save.map==='windbell-forest'?'南出口通往青芽镇；沿主路向北可进入回声洞穴。':save.map==='echo-cave'?'依次寻找低音、中音、高音回声石；错误的声响会让环形岔路失去指引。':'沿路探索，靠近居民按 E 交谈。蓝色屋顶是研究所，粉红屋顶前可治疗伙伴。'};
}

export function mapTransitionAt(save: Pick<Save,'map'|'x'|'y'|'story'>) {
  const transition=mapDefinition(save.map).transitions.find(entry=>entry.x===save.x&&entry.y===save.y);
  if(!transition||transition.requiredFlag&&!save.story.flags.includes(transition.requiredFlag))return null;
  if(!isRuntimeMapId(transition.targetMap))throw new Error(`地图传送目标不存在：${transition.targetMap}`);
  return {map:transition.targetMap,x:transition.targetX,y:transition.targetY};
}
