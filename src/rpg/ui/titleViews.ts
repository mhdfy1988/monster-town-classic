import { species } from '../model';
import { creatureArtwork, portrait } from '../portraitUi';
import type { SlotBook } from '../saveSlots';
import { mapDefinition } from '../content/maps/mapRegistry';

export function titleScreenView(latestSlot: number, storageError: string) {
  const companions=[0,1,2].map(index=>creatureArtwork(index,0,false)).join('');
  return `<section class="title-screen classic-title"><div class="title-vignette"></div><div class="title-brand"><small>POCKET GROVE</small><h1>青芽纪行</h1><span>──────── ◆ ────────</span></div><nav class="classic-menu" aria-label="游戏主菜单"><button id="title-new">开始游戏</button><button id="title-continue" ${latestSlot<0?'disabled':''}>继续游戏</button><button id="title-slots">存档管理</button><button id="title-exit">结束游戏</button></nav><div class="title-companions" aria-hidden="true">${companions}</div><footer class="title-footer">↑ ↓ 选择 · Enter 确认 <span>青芽镇 · 第一章</span></footer>${storageError?`<p class="title-error" role="alert">${storageError}</p>`:''}</section>`;
}

export function endedScreenView() {
  return '<section class="title-screen classic-title ended-screen"><h1>旅途暂歇</h1><p>现在可以安全关闭此标签页。</p><button class="rpg-action" id="return-title">返回标题</button></section>';
}

export function saveSlotsView(book: SlotBook, mode: 'load'|'save', atTitle: boolean, activeSlot: number | null) {
  return `<div class="modal-shade"><section class="rpg-panel save-panel"><header class="partner-heading"><h2>${mode==='save'?'保存游戏':'存档管理'}</h2><button class="rpg-action" id="slots-back">返回</button></header><div class="save-list">${book.slots.map((slot,index)=>`<article class="save-row"><div class="save-number">0${index+1}</div><div class="save-summary"><h3>存档 ${index+1} ${!atTitle&&index===activeSlot?'<small>当前旅程</small>':''}</h3>${slot?`<p>${mapDefinition(slot.data.map).name} · 图鉴 ${slot.data.caught.length}/${species.length} · ${slot.data.badge?'已获徽章':'旅途中'}</p><div class="save-party">${slot.data.team.map(monster=>portrait(monster)).join('')||'<span>尚未领取伙伴</span>'}</div><time>${new Date(slot.updated).toLocaleString('zh-CN')}</time>`:'<p>空存档位</p>'}</div><div class="save-actions"><button class="rpg-action" data-slot="${index}" ${!slot&&mode==='load'?'disabled':''}>${mode==='save'?'保存到这里':'读取存档'}</button>${slot?`<button class="rpg-action delete-slot" data-delete="${index}">删除</button>`:''}</div></article>`).join('')}</div><p class="save-note">存档保存在此浏览器中；清除网站数据会丢失进度。</p></section></div>`;
}
