import type { Save } from '../model';
import { questJournal } from '../systems/questProgress';

const statusNames={available:'可接取',active:'进行中',ready:'可交付',completed:'已完成'} as const;

export function questView(save:Save){
  const quests=questJournal(save);
  return `<div class="modal-shade quest-shade"><section class="quest-window" aria-labelledby="quest-title"><header><div><small>TRAVEL LOG</small><h2 id="quest-title">任务日志</h2></div><button id="quest-close" aria-label="关闭任务日志">×</button></header><div class="quest-list">${quests.map(quest=>`<article class="quest-card ${quest.kind}" data-status="${quest.status}"><div class="quest-card-head"><span>${quest.kind==='main'?'主线':'支线'}</span><strong>${quest.title}</strong><em>${statusNames[quest.status]}</em></div><p>${quest.objective}</p><div class="quest-progress"><i style="--quest-progress:${Math.round(quest.progress/quest.objectiveCount*100)}%"></i></div><footer><span>${quest.giver}</span><span>${quest.progress} / ${quest.objectiveCount}</span>${quest.reward?`<span>奖励 · ${quest.reward}</span>`:''}</footer></article>`).join('')}</div></section></div>`;
}
