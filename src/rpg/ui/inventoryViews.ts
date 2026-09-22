import { supplies } from '../combat';
import { itemArtwork } from '../itemArtwork';
import { maxHp, type Save } from '../model';
import { pixelItem } from '../pixelItems';

export type SupplyKey = typeof supplies[number]['key'];

export function bagView(save: Save, selected: SupplyKey) {
  const owned=supplies.filter(item=>(save[item.key]??0)>0);
  const item=owned.find(entry=>entry.key===selected)??owned[0];
  const potion=item?.key==='potions',usable=potion&&save.team.some(monster=>monster.hp<maxHp(monster));
  const html=`<div class="modal-shade"><section class="rpg-panel inventory-panel compact-inventory pixel-bag"><header class="partner-heading"><h2>旅行背包</h2><span class="bag-wallet" aria-label="${save.money} 金币"><span class="pixel-coin" aria-hidden="true">${pixelItem('coin')}</span><b>${save.money}</b></span></header><div class="inventory-layout"><div class="item-pocket">${owned.map(entry=>`<button class="item-tile ${item.key===entry.key?'selected':''}" data-item="${entry.key}" aria-label="${entry.name}，${save[entry.key]} 个" aria-pressed="${item.key===entry.key}"><span class="item-art">${pixelItem(entry.key)}</span><b class="item-count">${save[entry.key]}</b></button>`).join('')||'<p class="bag-empty">背包还是空的</p>'}</div><article class="item-inspect">${item?`<div class="item-hero">${pixelItem(item.key)}</div><h3>${item.name}</h3><p>${potion?'为选择的伙伴恢复 25 HP。':item.desc}</p><button class="rpg-action" id="use-item" ${usable?'':'disabled'}>${!potion?'战斗中使用':!save.team.length?'需要先领取伙伴':!usable?'队伍体力已满':'使用药水'}</button>`:'<div class="bag-empty-detail">暂无物品<p>获得的物品会收纳在这里。</p></div>'}</article></div><footer class="panel-actions"><button class="rpg-action" id="bag-close">返回旅行</button></footer></section></div>`;
  return {html,item,usable};
}

export function shopView(save: Save, message: string, selected: SupplyKey, quantity: number) {
  const item=supplies.find(entry=>entry.key===selected)!;
  const limit=Math.min(99,Math.floor(save.money/item.price));
  const groups=Math.max(1,Math.min(quantity,Math.max(1,limit))),cost=item.price*groups;
  const html=`<div class="modal-shade"><section class="rpg-panel compact-inventory trading-post"><header class="partner-heading"><h2>林间小铺</h2><span class="bag-wallet" aria-label="${save.money} 金币"><span class="wallet-coin" aria-hidden="true">✦</span><b>${save.money}</b></span></header><div class="trade-layout"><div class="trade-shelf">${supplies.map(entry=>`<button class="trade-goods ${entry.key===selected?'selected':''}" data-product="${entry.key}" aria-pressed="${entry.key===selected}"><span class="goods-art">${itemArtwork(entry.key)}</span><strong>${entry.name}</strong><span class="goods-price">◈ ${entry.price}<small> / ${entry.count}${entry.key==='balls'?'个':'瓶'}</small></span></button>`).join('')}</div><article class="trade-inspect"><div class="item-hero">${itemArtwork(item.key)}</div><h3>${item.name}</h3><p>${item.key==='potions'?'为选择的伙伴恢复 25 HP。':item.desc}</p><span class="trade-owned">已拥有 ${save[item.key]??0}</span><div class="trade-quantity"><button id="trade-less" aria-label="减少一组" ${groups===1?'disabled':''}>−</button><span><b>${groups}</b> 组<small>共 ${groups*item.count} ${item.key==='balls'?'个':'瓶'}</small></span><button id="trade-more" aria-label="增加一组" ${groups>=limit?'disabled':''}>＋</button></div><button class="rpg-action trade-purchase" id="trade-buy" ${limit<1?'disabled':''}>${limit<1?'金币不足':`购买 · ${cost} 金币`}</button></article></div><footer class="trade-footer"><span role="status">${message}</span><button id="leave-shop" class="rpg-action">离开商店</button></footer></section></div>`;
  return {html,item,limit,groups,cost};
}
