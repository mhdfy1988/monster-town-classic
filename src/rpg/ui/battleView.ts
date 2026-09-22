import { creatureArtwork } from '../portraitUi';
import { elementNames, maxHp, monsterName, species, type Monster } from '../model';
import type { BattleKind } from '../battle/BattleSession';

function statusCard(monster: Monster, enemy=false) {
  const element=species[monster.species].element,ratio=monster.hp/maxHp(monster);
  return `<div class="battle-status ${enemy?'enemy-status':'ally-status'}${ratio<.3?' is-critical':''}" data-element="${element}"><div class="battle-status-head"><b>${monsterName(monster)}</b><span>Lv.${monster.level}</span><em>${elementNames[element]}</em></div><div class="hp-line"><span>HP</span><div class="hp-track"><i style="width:${100*ratio}%"></i></div><small>${monster.hp}<i>/</i>${maxHp(monster)}</small></div></div>`;
}

export function battleScreenView(enemy: Monster, ally: Monster, kind: BattleKind, busy: boolean, log: string) {
  const title=kind==='boss'?'第一章首领战':kind==='trainer'?'巡林员的试炼':'林间相遇',subtitle=kind==='boss'?'失控伙伴 · 不可捕捉':kind==='trainer'?'训练家对战':'野生伙伴';
  return `<section class="battle-screen"><div class="battle-topline"><b>${title}</b><span>${subtitle}</span></div><div class="battle-field">${statusCard(enemy,true)}<div class="enemy-monster">${creatureArtwork(enemy.species,enemy.form??0,false)}</div><div class="ally-monster">${creatureArtwork(ally.species,ally.form??0,true)}</div>${statusCard(ally)}<div class="battle-fx-layer" aria-hidden="true"></div></div><div class="battle-console"><div class="battle-message"><span class="eyebrow">${busy?'战斗进行中':'轮到你了'}</span><p>${log}</p></div><div class="battle-actions"></div></div></section>`;
}
