import { species } from '../model';
import { creatureArtwork, portrait } from '../portraitUi';
import type { SlotBook } from '../saveSlots';
import { mapDefinition } from '../content/maps/mapRegistry';

export function titleScreenView(latestSlot: number, storageError: string) {
  const companionClasses=['leaf','fire','stone'];
  const companions=[0,1,2].map((index)=>`<span class="title-companion title-companion-${companionClasses[index]}">${creatureArtwork(index,0,false)}</span>`).join('');
  const menuItems=[
    {id:'title-new',number:'01',label:'开始游戏',hint:'踏上新的旅程'},
    {id:'title-continue',number:'02',label:'继续游戏',hint:latestSlot<0?'尚未建立存档':`读取存档 ${latestSlot+1}`,disabled:latestSlot<0},
    {id:'title-slots',number:'03',label:'存档管理',hint:'查看三份旅行记录'},
    {id:'title-exit',number:'04',label:'结束游戏',hint:'暂时离开青芽镇'},
  ];
  const menu=menuItems.map(item=>`<button id="${item.id}" aria-label="${item.label}" ${item.disabled?'disabled':''}><span class="title-menu-number">${item.number}</span><span class="title-menu-copy"><b>${item.label}</b><small>${item.hint}</small></span><span class="title-menu-arrow" aria-hidden="true">›</span></button>`).join('');
  return `<section class="title-screen classic-title"><div class="title-vignette" aria-hidden="true"></div><div class="title-pixel-noise" aria-hidden="true"></div><div class="title-layout"><section class="title-story"><div class="title-chapter"><span>CHAPTER 01</span><b>风从青芽镇出发</b></div><div class="title-brand"><small>POCKET GROVE</small><h1>青芽纪行</h1><p>与伙伴同行，循着风与回声寻找真相。</p></div><div class="title-hero" aria-hidden="true"><div class="title-sun"></div><div class="title-companions">${companions}</div><div class="title-ground"></div></div><ol class="title-route" aria-label="第一章旅途"><li class="is-current"><span></span><b>青芽镇</b></li><li><span></span><b>风铃森林</b></li><li><span></span><b>回声洞穴</b></li></ol></section><aside class="title-menu-panel"><header><small>TRAVEL RECORD</small><h2>选择旅程</h2><p>${latestSlot<0?'新的记录正等待书写':`存档 ${latestSlot+1} 可以继续`}</p></header><nav class="classic-menu" aria-label="游戏主菜单">${menu}</nav><footer><span>↑ ↓</span> 选择 <span>Enter</span> 确认</footer></aside></div><footer class="title-footer"><span>青芽镇调查队 · 第一章</span><span>MONSTER TOWN ARCHIVE / 001</span></footer>${storageError?`<p class="title-error" role="alert">${storageError}</p>`:''}</section>`;
}

export function endedScreenView() {
  return '<section class="title-screen classic-title ended-screen"><h1>旅途暂歇</h1><p>现在可以安全关闭此标签页。</p><button class="rpg-action" id="return-title">返回标题</button></section>';
}

export function loadingScreenView() {
  return '<section class="title-screen classic-title title-loading" aria-live="polite"><div class="title-vignette" aria-hidden="true"></div><div class="title-pixel-noise" aria-hidden="true"></div><div class="loading-emblem" aria-hidden="true"><span></span></div><small>POCKET GROVE</small><h1>正在整理行装</h1><p>地图与伙伴将在准备完成后出现。</p></section>';
}

export function saveSlotsView(book: SlotBook, mode: 'load'|'save', atTitle: boolean, activeSlot: number | null) {
  return `<div class="modal-shade"><section class="rpg-panel save-panel"><header class="partner-heading"><h2>${mode==='save'?'保存游戏':'存档管理'}</h2><button class="rpg-action" id="slots-back">返回</button></header><div class="save-list">${book.slots.map((slot,index)=>`<article class="save-row"><div class="save-number">0${index+1}</div><div class="save-summary"><h3>存档 ${index+1} ${!atTitle&&index===activeSlot?'<small>当前旅程</small>':''}</h3>${slot?`<p>${mapDefinition(slot.data.map).name} · 图鉴 ${slot.data.caught.length}/${species.length} · ${slot.data.badge?'已获徽章':'旅途中'}</p><div class="save-party">${slot.data.team.map(monster=>portrait(monster)).join('')||'<span>尚未领取伙伴</span>'}</div><time>${new Date(slot.updated).toLocaleString('zh-CN')}</time>`:'<p>空存档位</p>'}</div><div class="save-actions"><button class="rpg-action" data-slot="${index}" ${!slot&&mode==='load'?'disabled':''}>${mode==='save'?'保存到这里':'读取存档'}</button>${slot?`<button class="rpg-action delete-slot" data-delete="${index}">删除</button>`:''}</div></article>`).join('')}</div><p class="save-note">存档保存在此浏览器中；清除网站数据会丢失进度。</p></section></div>`;
}
