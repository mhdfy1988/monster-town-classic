import { skills } from '../combat';
import { elementNames, maxHp, monsterInfo, normalizeTeam, TEAM_LIMIT, type Save } from '../model';
import { battleIcon, creatureArtwork, partnerCard, portrait } from '../portraitUi';

export type RosterTab = 'team' | 'reserve';

export function rosterView(save: Save, requestedIndex: number, tab: RosterTab) {
  normalizeTeam(save);
  const list=tab==='team'?save.team:save.reserve;
  const selected=Math.max(0,Math.min(requestedIndex,list.length-1));
  const monster=list[selected],info=monster?monsterInfo(monster):undefined;
  const canStore=!!monster&&save.team.length>1&&save.team.some((partner,index)=>index!==selected&&partner.hp>0);
  const detail=monster&&info?`<span class="element-label" style="background:${info.color}">${elementNames[info.element]}属性 · Lv.${monster.level}</span><div class="partner-stage">${creatureArtwork(monster.species,monster.form??0,false)}</div><h3>${info.name}</h3><p>${info.desc}</p><h4>当前招式</h4><div class="move-pair">${skills(monster).map(move=>`<span>${battleIcon(move.kind)}${move.name}<small>${move.desc}</small></span>`).join('')}</div><div class="roster-actions">${tab==='team'?`<button class="rpg-action" id="partner-lead" ${selected===0||monster.hp===0?'disabled':''}>${selected===0?'当前首发':monster.hp===0?'需要先治疗':'设为首发'}</button><button class="rpg-action" id="store-partner" ${canStore?'':'disabled'}>移入收容箱</button>${!canStore?'<small>需保留一位能战斗的随行伙伴</small>':''}`:`<button class="rpg-action" id="withdraw-partner">${save.team.length<TEAM_LIMIT?'加入队伍':'选择交换对象'}</button>`}</div>`:'<p class="roster-empty">选择伙伴查看详情</p>';
  const html=`<div class="modal-shade"><section class="rpg-panel partner-panel roster-window"><header class="partner-heading"><h2>同行伙伴</h2><button class="rpg-action" id="partner-close" aria-label="关闭队伍">返回旅行</button></header><nav class="roster-tabs" aria-label="伙伴分类">${(['team','reserve'] as const).map(value=>`<button data-roster-tab="${value}" aria-pressed="${tab===value}">${value==='team'?'随行队伍':'收容箱'} <span>${value==='team'?`${save.team.length} / ${TEAM_LIMIT}`:save.reserve.length}</span></button>`).join('')}</nav><div class="partner-layout"><div class="partner-roster">${list.map((partner,index)=>partnerCard(partner,index,index===selected).replace('· 首发',tab==='team'?'· 首发':'')).join('')||'<p class="roster-empty">还没有寄存的伙伴</p>'}</div><article class="partner-detail">${detail}</article></div></section></div>`;
  return {html,list,selected,monster,info,canStore};
}

export function swapChooserView(save: Save, reserveIndex: number) {
  const monster=save.reserve[reserveIndex];
  return `<h3>与谁交换？</h3><div class="potion-targets">${save.team.map((partner,index)=>`<button class="potion-target" data-swap="${index}" ${monster.hp<=0&&!save.team.some((other,otherIndex)=>otherIndex!==index&&other.hp>0)?'disabled':''}>${portrait(partner)}<span><strong>${monsterInfo(partner).name}</strong><small>Lv.${partner.level} · ${partner.hp} / ${maxHp(partner)} HP</small></span></button>`).join('')}</div><button class="rpg-action" id="cancel-swap">取消</button>`;
}
