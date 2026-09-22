import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { menuIcon } from './portraitUi';
import { RpgScene } from './RpgScene';
import './rpg.css';
import './immersive.css';
import './partners.css';
import './battle.css';
import './capturePixel.css';
import './collections.css';
import './title.css';
import './game-ui.css';
import './dexBook.css';
import './pixelBag.css';
import './bagFrame.css';
import './shopFrame.css';
import './settingsFrame.css';
import './collectionFrame.css';
import './battleFrame.css';
import './modalFrame.css';
import './questFrame.css';

export function mountGame(root: HTMLDivElement) {
  root.innerHTML=`<main class="rpg-shell"><section class="rpg-stage"><div id="game" aria-label="青芽纪行游戏场景"></div><div class="world-hud"><div class="location"><b id="location-name">青芽镇</b></div></div><nav class="game-shortcuts" aria-label="游戏功能"><button id="menu-bag" aria-label="背包" data-hint="背包 · B">${menuIcon('bag')}</button><button id="menu-journal" aria-label="图鉴" data-hint="图鉴 · M">${menuIcon('book')}</button><button id="menu-team" aria-label="队伍" data-hint="队伍 · T">${menuIcon('team')}</button><button id="menu-toggle" aria-label="设置" aria-expanded="false" data-hint="设置 · Esc">${menuIcon('settings')}</button></nav><aside id="travel-menu" class="travel-menu" aria-label="旅行设置" hidden><header><h1>旅行设置</h1><button id="menu-close" aria-label="关闭设置">×</button></header><section class="settings-audio" aria-label="声音设置"><div class="settings-sound"><label for="menu-music-volume">背景音乐</label><input id="menu-music-volume" type="range" min="0" max="100" step="5" aria-label="背景音乐音量"><output id="menu-music-volume-value" for="menu-music-volume">42%</output><button id="menu-music" role="switch" aria-label="背景音乐" aria-checked="true"><span class="sound-state">开</span><i aria-hidden="true"></i></button></div><div class="settings-sound"><label for="menu-sfx-volume">游戏音效</label><input id="menu-sfx-volume" type="range" min="0" max="100" step="5" aria-label="游戏音效音量"><output id="menu-sfx-volume-value" for="menu-sfx-volume">78%</output><button id="menu-sfx" role="switch" aria-label="游戏音效" aria-checked="true"><span class="sound-state">开</span><i aria-hidden="true"></i></button></div></section><nav class="settings-actions" aria-label="进度管理"><button id="menu-quests"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 6h18v20H8zM12 11h10M12 16h10M12 21h7"/></svg><span>任务日志<small>查看主线与支线进度</small></span><span aria-hidden="true">›</span></button><button id="menu-save">${menuIcon('save')}<span>保存游戏<small id="save-status" role="status"></small></span><span aria-hidden="true">›</span></button><button id="menu-title"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 5h14v22H12M19 16H4m6-6-6 6 6 6"/></svg><span>返回标题</span><span aria-hidden="true">›</span></button></nav><details class="settings-help"><summary>操作与旅程</summary><dl><div><dt>移动</dt><dd>WASD / 方向键</dd></div><div><dt>交谈</dt><dd>E / 空格</dd></div><div><dt>背包 / 队伍 / 图鉴</dt><dd>B / T / M</dd></div><div><dt>关闭面板</dt><dd>Esc</dd></div></dl><div class="travel-quest"><small>当前旅程</small><p id="quest-text"></p></div></details></aside><div id="rpg-overlay" aria-live="polite"></div></section></main>`;
  const regionLabel=document.getElementById('location-name')!;let previousRegion=regionLabel.textContent;
  new MutationObserver(()=>{if(regionLabel.textContent===previousRegion)return;previousRegion=regionLabel.textContent;regionLabel.parentElement!.getAnimations().forEach(animation=>{animation.currentTime=0;animation.play();});}).observe(regionLabel,{childList:true});
  return new Phaser.Game({type:Phaser.AUTO,parent:'game',width:GAME_WIDTH,height:GAME_HEIGHT,backgroundColor:'#182f36',pixelArt:true,antialias:false,roundPixels:true,render:{antialias:false,pixelArt:true,roundPixels:true},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[RpgScene]});
}
