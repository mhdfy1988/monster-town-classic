import { mountDexBook } from './dexBook';
import Phaser from 'phaser';
import { portrait, battleIcon, creatureArtwork, statusIcon } from './portraitUi';
import { species, elementNames, makeMonster, maxHp, newGame, monsterName, type Save, type Monster } from './model';
import { unlockForm } from './model';
import { supplies, skills } from './combat';
import { inBox, npcs, townGate } from './content/maps/greenbudTown';
import { isMovementBlocked, isValidMapLocation, mapDefinition } from './content/maps/mapRegistry';
import type { BattleGrowth } from './battleProgress';
import { TEAM_LIMIT } from './model';
import { pixelItem } from './pixelItems';
import { supplyImage } from './supplyImages';
import { preloadRpgAssets } from './content/assets';
import { directionFromInput, MOVEMENT_DURATION_MS, nextBufferedDirection, nextTile, standingFrame, walkingFrame, type Direction } from './systems/movement';
import { renderWorld } from './world/renderWorld';
import { appendActionButton, convertToCompactClose, mountModalFrame, type UiAction } from './ui/modal';
import { updateHudView } from './ui/hud';
import { battleScreenView } from './ui/battleView';
import { BattleSession, type BattleMenu } from './battle/BattleSession';
import { bagView, shopView } from './ui/inventoryViews';
import { rosterView, swapChooserView, type RosterTab } from './ui/rosterView';
import { endedScreenView, saveSlotsView, titleScreenView } from './ui/titleViews';
import { battleResultsView } from './ui/battleResultsView';
import { interactionAt, mapTransitionAt } from './content/interactions';
import { BattleFlow, type BattleAction } from './battle/BattleFlow';
import { SaveRepository } from './infrastructure/SaveRepository';
import { AudioPlayer } from './infrastructure/AudioPlayer';
import { bindGameControls } from './ui/gameControls';
import { addStoryFlag, advanceStory } from './systems/storyProgress';
import { activateEchoBeacon, canShutDownExtractor, echoSequenceProgress, shutDownExtractor } from './systems/caveProgress';
import { sideQuestProgress } from './systems/questProgress';
import { acceptSideQuest, deliverMossReport, findSurveyor, finishChapterOne, meetWhiteGravel, observeMoss, reportSurveyorSafe, startForestInvestigation } from './systems/chapterOneProgress';
import { questView } from './ui/questView';
import type { BattleKind } from './battle/BattleSession';
import { feedbackDuration, type BattleFeedback } from './battle/battleFeedback';
import { captureEffectView, DEFAULT_CAPTURE_EFFECT_STYLE, hydratePixelCaptureEffect, PIXEL_CAPTURE_THROW_DURATION, resolveCaptureEffectStyle, type CaptureEffectStyle } from './ui/captureEffectView';
import { battleMusic, mapMusic, TITLE_MUSIC } from './content/audioCues';

type Action = UiAction;
export class RpgScene extends Phaser.Scene {
  save: Save = newGame();
  private hero!: Phaser.GameObjects.Sprite;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private moving = false;
  private bufferedDirection: Direction | null = null;
  private retreatAfterClose = false;
  private waitMovementRelease = false;
  private facing: Direction = { x:0, y:1, frame:0 };
  private overlay = document.getElementById('rpg-overlay')!;
  private modal = false;
  private battle = new BattleSession();
  private battleFlow=new BattleFlow(()=>this.save,this.battle,{render:()=>this.battleView(),pauseLog:(text,effect)=>this.pauseLog(text,effect),finish:(text,growth)=>this.finishBattle(text,growth),returnToTownAfterDefeat:()=>this.drawWorld()});
  private get enemy(){return this.battle.enemy;} private set enemy(value:Monster|null){this.battle.enemy=value;}
  private get boss(){return this.battle.boss;}
  private get battleBusy(){return this.battle.busy;} private set battleBusy(value:boolean){this.battle.busy=value;}
  private bookCleanup:(()=>void)|undefined;
  private bookPage=0;
  private get battleLog(){return this.battle.log;} private set battleLog(value:string){this.battle.log=value;}
  private get battleMenu(){return this.battle.menu;} private set battleMenu(value:BattleMenu){this.battle.menu=value;}
  private state(m:Monster){return this.battle.state(m);}
  private encounterCooldown = 7;
  private saves = new SaveRepository(localStorage);
  private get storageError(){return this.saves.error;} private set storageError(value:string){value?this.saves.fail(value):this.saves.error='';}
  private get activeSlot(){return this.saves.activeSlot;} private set activeSlot(value:number|null){this.saves.activeSlot=value;}
  private atTitle = true;
  private walkClock = 0;
  private audio = new AudioPlayer();
  private captureEffectStyle: CaptureEffectStyle = DEFAULT_CAPTURE_EFFECT_STYLE;
  constructor() { super('PocketGrove'); }
  preload() {
    preloadRpgAssets(this);
  }
  create() {
    const qaParams=new URLSearchParams(location.search),qaPreset=import.meta.env.DEV?qaParams.get('qa'):null;
    this.captureEffectStyle=resolveCaptureEffectStyle(location.search);
    if(qaPreset)(window as unknown as {__rpg:RpgScene}).__rpg=this;
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ENTER,ESC,T,B,M,ONE,TWO,THREE,FOUR') as typeof this.keys;
    const unlockAudio=()=>this.audio.unlock();window.addEventListener('pointerdown',unlockAudio,{once:true});window.addEventListener('keydown',unlockAudio,{once:true});
    this.events.once('shutdown',()=>{window.removeEventListener('pointerdown',unlockAudio);window.removeEventListener('keydown',unlockAudio);void this.audio.suspend();});
    bindGameControls(this.overlay,{close:()=>this.close(),openTeam:()=>this.teamMenu(),openBag:()=>this.bagMenu(),openJournal:()=>this.journal(),openQuests:()=>this.questMenu(),save:()=>{if(!this.enemy&&!this.moving){this.close();if(this.activeSlot===null){this.slotMenu('save');return;}this.persist();this.dialog(this.storageError?'保存失败':'已保存',this.storageError||`进度已保存到存档 ${this.activeSlot!+1}。`);}},returnToTitle:()=>this.returnToTitle(),toggleSettings:()=>this.toggleTravelMenu(),getAudioSettings:()=>this.audio.preferences,toggleMusic:()=>this.audio.toggleMusic(),toggleSfx:()=>{const enabled=this.audio.toggleSfx();if(enabled)this.beep();return enabled;},setMusicVolume:value=>this.audio.setMusicVolume(value),setSfxVolume:value=>this.audio.setSfxVolume(value),resetEscapeKey:()=>this.keys.ESC.reset()});
    if(qaPreset==='town'){
      this.save=newGame();this.save.map='greenbud-town';this.save.x=34;this.save.y=6;this.atTitle=false;this.drawWorld();this.updateHud();
    }else if(qaPreset==='forest'||qaPreset==='forest-art'){
      this.save=newGame();this.save.team=[makeMonster(1,8)];this.save.caught=[0,1];this.save.badge=true;this.save.map='windbell-forest';this.save.x=24;this.save.y=14;
      this.save.story.flags=['ranger-pass','forest-investigation',...(qaPreset==='forest-art'?['forest-route-cleared']:[])];this.save.story.nodeId='chapter-1-wild';acceptSideQuest(this.save,'lost-surveyor');acceptSideQuest(this.save,'dim-glow-moss');this.atTitle=false;this.drawWorld();this.updateHud();
      if(qaPreset==='forest-art'){this.save.x=24;this.save.y=6;this.drawWorld();}
    }else if(qaPreset==='cave-art'||qaPreset==='cave-entry-art'){
      this.save=newGame();this.save.team=[makeMonster(1,8)];this.save.caught=[0,1];this.save.badge=true;this.save.map='echo-cave';this.save.x=22;this.save.y=11;
      this.save.story.flags=['ranger-pass','forest-investigation','forest-route-cleared'];this.save.story.nodeId='chapter-1-cave';this.atTitle=false;this.drawWorld();this.updateHud();
      if(qaPreset==='cave-entry-art'){this.save.x=22;this.save.y=27;this.drawWorld();}
    }else if(qaPreset==='battle-fx'){
      this.save=newGame();this.save.team=[makeMonster(1,9)];this.save.caught=[1];this.save.balls=8;this.atTitle=false;this.drawWorld();this.updateHud();
      const previewEnemy=makeMonster(0,5);previewEnemy.hp=Math.max(1,Math.floor(maxHp(previewEnemy)*.28));this.startBattle(previewEnemy,'wild');
      const phase=qaParams.get('effect');
      const capturePreviews:Record<string,{feedback:BattleFeedback;log:string}>={
        'capture-throw':{feedback:{kind:'capture',phase:'throw'},log:'你掷出了捕捉球！'},
        'capture-shake-1':{feedback:{kind:'capture',phase:'shake',shake:1},log:'……摇了一下。'},
        'capture-shake-2':{feedback:{kind:'capture',phase:'shake',shake:2},log:'……又摇了一下。'},
        'capture-shake-3':{feedback:{kind:'capture',phase:'shake',shake:3},log:'……最后一下。'},
        'capture-break':{feedback:{kind:'capture',phase:'break'},log:'叶芽鹿挣脱了捕捉球！'},
        'capture-success':{feedback:{kind:'capture',phase:'success'},log:'咔哒！捕捉球锁定了。'},
      };
      const capturePreview=phase?capturePreviews[phase]:undefined;if(capturePreview){
        this.battleLog=capturePreview.log;this.battleView();this.battleEffect(capturePreview.feedback);
        const frozenTime=Number(qaParams.get('fxTime'));
        if(qaParams.has('fxTime')&&Number.isFinite(frozenTime)&&frozenTime>=0&&frozenTime<=(this.captureEffectStyle==='pixel'?PIXEL_CAPTURE_THROW_DURATION:1500)){
          const freeze=()=>this.overlay.querySelector<HTMLElement>('.battle-screen')?.getAnimations({subtree:true}).forEach(animation=>{animation.pause();animation.currentTime=frozenTime;});
          requestAnimationFrame(freeze);
          this.time.delayedCall(120,freeze);
        }
      }
      if(phase==='effective'){this.battleLog='属性克制！效果拔群！';this.battleView();this.battleEffect({kind:'attack',actor:'ally',element:'fire',amount:28,effective:true});}
    }else{this.drawWorld();this.updateHud();this.titleScreen();}
    this.game.events.on('blur',()=>this.keys && Object.values(this.keys).forEach(k=>k.reset()));
  }
  private beep(freq=480) { this.audio.beep(freq); }
  private titleScreen() {
    this.audio.playMusic(TITLE_MUSIC);
    this.atTitle=true;this.modal=true;document.getElementById('travel-menu')!.hidden=true;
    let latest=-1;
    try{latest=this.saves.latestIndex();}catch{this.storageError='存档读取失败，原数据已保留。请检查浏览器存储权限。';}
    this.overlay.innerHTML=titleScreenView(latest,this.storageError);
    this.overlay.querySelector<HTMLButtonElement>('#title-new')!.onclick=()=>this.startNew();
    this.overlay.querySelector<HTMLButtonElement>('#title-continue')!.onclick=()=>this.loadSlot(latest);
    this.overlay.querySelector<HTMLButtonElement>('#title-slots')!.onclick=()=>this.slotMenu('load');
    this.overlay.querySelector<HTMLButtonElement>('#title-exit')!.onclick=()=>this.panel('结束游戏','结束后将停留在关闭提示页。存档仍保存在此浏览器中。',[{label:'结束游戏',run:()=>{void this.audio.suspend();this.overlay.innerHTML=endedScreenView();this.overlay.querySelector<HTMLButtonElement>('#return-title')!.onclick=()=>this.titleScreen();}},{label:'取消',run:()=>this.titleScreen()}]);
    const menu=this.overlay.querySelector<HTMLElement>('.classic-menu')!;
    menu.onkeydown=e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const buttons=[...menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];const index=buttons.indexOf(document.activeElement as HTMLButtonElement);buttons[(index+(e.key==='ArrowDown'?1:buttons.length-1)+buttons.length)%buttons.length].focus();};
    this.overlay.querySelector<HTMLButtonElement>(latest>=0?'#title-continue':'#title-new')!.focus();
  }
  private startNew(){this.save=newGame();this.saves.beginUnsaved();this.atTitle=false;this.close();this.drawWorld();this.updateHud();this.dialog('向导 · 小夏','欢迎来到青芽镇！北边蓝色屋顶的研究所正在招募旅行者。先去见博士，领取你的伙伴吧。\n方向键 / WASD 移动，E 或空格与面前的人交谈。');}
  private loadSlot(index:number){try{const save=this.saves.load(index);if(!save)return;this.save=save;this.atTitle=false;if(!isValidMapLocation(this.save.map,this.save.x,this.save.y)){this.save.map='greenbud-town';Object.assign(this.save,mapDefinition('greenbud-town').spawn);}this.close();this.drawWorld();this.updateHud();}catch{this.panel('读取失败','原存档已保留，未载入游戏。',[{label:'返回标题',run:()=>this.titleScreen()}]);}}
  private returnToTitle(){
    this.close();
    this.panel('返回标题',this.activeSlot===null?'当前旅程尚未保存，离开后将丢失进度。':'保存当前进度后返回标题？',[
      {label:'保存并返回',run:()=>{if(this.activeSlot===null){this.slotMenu('save',()=>this.titleScreen());return;}this.persist();if(this.storageError){this.panel('保存失败',this.storageError,[{label:'返回',run:()=>this.returnToTitle()}]);return;}this.titleScreen();}},
      {label:'放弃本次未保存进度',run:()=>this.titleScreen()},
      {label:'取消',run:()=>this.close()},
    ]);
  }
  private slotMenu(mode:'load'|'save',afterSave?:()=>void){
    let book;try{book=this.saves.readBook();}catch{this.panel('存档不可用','原数据已保留，无法读取存档目录。',[{label:'返回',run:()=>this.atTitle?this.titleScreen():this.close()}]);return;}
    this.modal=true;
    this.overlay.innerHTML=saveSlotsView(book,mode,this.atTitle,this.activeSlot);
    this.overlay.querySelector<HTMLButtonElement>('#slots-back')!.onclick=()=>this.atTitle?this.titleScreen():this.close();
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.slot);const execute=()=>{if(mode==='load'){this.loadSlot(i);return;}try{this.saves.write(i,this.save);if(afterSave)afterSave();else this.slotMenu(mode,afterSave);}catch{this.panel('保存失败','原存档未被替换，请检查存储权限。',[{label:'返回',run:()=>this.slotMenu(mode,afterSave)}]);}};if(book.slots[i]&&mode!=='load')this.panel('覆盖存档？',`存档 ${i+1} 的已有进度将被替换。`,[{label:'确认覆盖',run:execute},{label:'取消',run:()=>this.slotMenu(mode,afterSave)}]);else execute();});
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.delete);this.panel('删除存档？',`永久删除存档 ${i+1}，无法撤销。`,[{label:'确认删除',run:()=>{try{this.saves.remove(i);this.slotMenu(mode,afterSave);}catch{this.panel('删除失败','原存档已保留。',[{label:'返回',run:()=>this.slotMenu(mode,afterSave)}]);}}},{label:'取消',run:()=>this.slotMenu(mode,afterSave)}]);});
  }
  private drawWorld(){
    const rendered=renderWorld(this,this.save,this.objects,this.hero);
    this.objects=rendered.objects;this.hero=rendered.hero;this.moving=false;this.bufferedDirection=null;this.audio.playMusic(mapMusic[this.save.map]);this.updateHud();
  }
  private movementDirection(justDown=false){
    const pressed=(...names:string[])=>names.some(name=>justDown?Phaser.Input.Keyboard.JustDown(this.keys[name]):this.keys[name].isDown);
    return directionFromInput({left:pressed('LEFT','A'),right:pressed('RIGHT','D'),up:pressed('UP','W'),down:pressed('DOWN','S')});
  }
  private startMovement(d:Direction){
    this.facing=d;const {x,y}=nextTile(this.save.x,this.save.y,d);
    if(this.save.map==='greenbud-town'&&inBox(x,y,townGate)&&!this.save.story.flags.includes('forest-investigation')){
      this.hero.setFrame(standingFrame(d));this.retreatAfterClose=true;
      this.dialog('林川',this.save.story.flags.includes('ranger-pass')?'先等一下！青禾博士正在研究所等你，听完调查安排再进森林。':'先等一下！森林最近不太平。准备好伙伴、通过我的考验后再出发。');return false;
    }
    if(isMovementBlocked(this.save.map,x,y,this.save.story.flags)||(this.save.map==='greenbud-town'&&npcs.some(n=>n.x===x&&n.y===y))||(this.save.map==='greenbud-lab'&&x===20&&y===11)){
      this.hero.setFrame(standingFrame(d));return false;
    }
    this.moving=true;const started=this.time.now;
    this.hero.setFrame(walkingFrame(d,this.walkClock));
    this.tweens.add({targets:this.hero,x:x*32+16,y:y*32+30,duration:MOVEMENT_DURATION_MS,ease:'Linear',onUpdate:()=>{this.hero.setDepth(this.hero.y+1);this.hero.setFrame(walkingFrame(d,this.walkClock+this.time.now-started));},onComplete:()=>{
      this.walkClock+=MOVEMENT_DURATION_MS;this.save.x=x;this.save.y=y;this.save.steps++;this.moving=false;this.enterCell();
      if(this.modal||this.enemy||this.moving||this.waitMovementRelease){this.hero.setFrame(standingFrame(d));return;}
      const next=nextBufferedDirection(this.bufferedDirection,this.movementDirection());this.bufferedDirection=null;
      if(next){if(this.startMovement(next))return;this.hero.setFrame(standingFrame(next));return;}
      this.hero.setFrame(standingFrame(d));
    }});
    return true;
  }
  update(){
    if(!this.keys)return;
    if(this.modal){
      if(!document.getElementById('travel-menu')!.hidden){
        for(const [key,open] of [['T',()=>this.teamMenu()],['B',()=>this.bagMenu()],['M',()=>this.journal()]] as const){
          if(Phaser.Input.Keyboard.JustDown(this.keys[key])){this.close();open();return;}
        }
      }
      if(Phaser.Input.Keyboard.JustDown(this.keys.ESC)&&!this.enemy&&!this.overlay.querySelector('.title-screen')){if(this.atTitle)this.titleScreen();else this.close();}return;
    }
    if(this.moving){const queued=this.movementDirection(true);if(queued)this.bufferedDirection=queued;return;}
    if(this.waitMovementRelease){
      if(['LEFT','RIGHT','UP','DOWN','A','D','W','S'].some(key=>this.keys[key].isDown))return;
      this.waitMovementRelease=false;
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.ESC)){this.toggleTravelMenu();return;}
    if(Phaser.Input.Keyboard.JustDown(this.keys.T)){this.teamMenu();return;}
    if(Phaser.Input.Keyboard.JustDown(this.keys.B)){this.bagMenu();return;}
    if(Phaser.Input.Keyboard.JustDown(this.keys.M)){this.journal();return;}
    if(['E','SPACE','ENTER'].some(k=>Phaser.Input.Keyboard.JustDown(this.keys[k]))){this.interact();return;}
    // 原始图集逐行是下、左、右、上，每行三帧，中间帧为站立。
    const d=nextBufferedDirection(this.bufferedDirection,this.movementDirection());this.bufferedDirection=null;
    if(!d){this.walkClock=0;this.hero.setFrame(standingFrame(this.facing));return;}
    this.startMovement(d);
  }
  private enterCell(){
    const {map,x,y}=this.save;
    const transition=mapTransitionAt(this.save);if(transition){const enteringForest=transition.map==='windbell-forest'&&map!=='windbell-forest',enteringCave=transition.map==='echo-cave'&&map!=='echo-cave';Object.assign(this.save,transition);if(enteringCave)advanceStory(this.save,'chapter-1-wild');this.drawWorld();this.persist();if(enteringForest)this.dialog('第一章 · 风铃森林','小夏说苔藓正在失去光泽，林川的测量员也迟迟没有回报。沿主路调查生态变化和异常热风。');if(enteringCave)this.dialog('第一章 · 回声洞穴','这里是早年铺设的引路塔试验场。矿车轨道在环形岔路中反复交叉，依次敲响低音、中音、高音回声石，才能找到旧导能设备。');return;}
    if(mapDefinition(map).encounterZones.some(r=>inBox(x,y,r))&&this.save.team.length&&--this.encounterCooldown<=0){this.encounterCooldown=6+Math.floor(Math.random()*6);const pool=map==='echo-cave'?[2,1]:species.map((_,index)=>index),enemySpecies=pool[Math.floor(Math.random()*pool.length)];this.startBattle(makeMonster(enemySpecies,map==='echo-cave'?9+Math.floor(Math.random()*3):map==='windbell-forest'?5+Math.floor(Math.random()*3):3+Math.floor(Math.random()*3)),'wild');return;}
    if(this.save.steps%10===0)this.persist();this.updateHud();
  }
  private interact(){
    this.beep();const interaction=interactionAt(this.save,this.facing);
    if(interaction.kind==='starter'){this.chooseStarter();return;}
    if(interaction.kind==='heal'){this.heal();return;}
    if(interaction.kind==='shop'){this.shop();return;}
    if(interaction.kind==='dialog'){this.dialog(interaction.title,interaction.body);return;}
    if(interaction.kind==='forest-briefing'){this.panel('青禾博士 · 森林调查','林川确认你已经能够独立行动。风铃森林出现反常热风，苔藓褪色，北侧洞穴还传来规律震动。请先记录生态变化，再查明热源。',[{label:'接受调查委托',run:()=>{startForestInvestigation(this.save);this.persist();this.drawWorld();this.dialog('调查记录已建立','北门现已开放。小夏和林川掌握着两条额外线索，可在任务日志中查看进度。');}}]);return;}
    if(interaction.kind==='guide-moss'){
      const quest=sideQuestProgress(this.save,'dim-glow-moss');
      if(!quest){this.panel('向导 · 小夏','森林里原本会发微光的苔藓突然暗了。你能记录西坡、水边和南路三处苔藓的情况吗？',[{label:'接受支线',run:()=>{acceptSideQuest(this.save,'dim-glow-moss');this.persist();this.dialog('支线 · 暗淡的苔光','已记入任务日志。调查三处苔藓后回来告诉小夏。');}},{label:'稍后再说',run:()=>this.close()}]);return;}
      if(quest.status==='ready'&&deliverMossReport(this.save)){this.persist();this.dialog('支线完成 · 暗淡的苔光','小夏确认苔藓褪色与北侧热风有关。获得 60 金币和 2 瓶恢复药水。');return;}
      this.dialog('向导 · 小夏','这份苔藓观察已经整理好了，谢谢你。');return;
    }
    if(interaction.kind==='ranger-surveyor'){
      const quest=sideQuestProgress(this.save,'lost-surveyor');
      if(!quest){this.panel('巡林员 · 林川','测量员阿陆在森林西侧环路失联了。主路还能通行，但我需要有人找到他并带回口信。',[{label:'接受支线',run:()=>{acceptSideQuest(this.save,'lost-surveyor');this.persist();this.dialog('支线 · 迷路的测量员','已记入任务日志。阿陆最后一次回报来自森林西侧。');}},{label:'稍后再说',run:()=>this.close()}]);return;}
      if(reportSurveyorSafe(this.save)){this.persist();this.dialog('支线完成 · 迷路的测量员','林川收到阿陆平安的消息。获得 80 金币和 2 个捕捉球。');return;}
      this.dialog('巡林员 · 林川','阿陆已经回到巡查路线，这份记录我收下了。');return;
    }
    if(interaction.kind==='forest-surveyor'){
      const quest=sideQuestProgress(this.save,'lost-surveyor');
      if(!quest){this.dialog('测量员 · 阿陆','热风吹乱了路标，我绕了很久才找到主路。要是你见到林川，告诉他我在这里。');return;}
      const changed=findSurveyor(this.save);if(changed)this.persist();this.dialog('测量员 · 阿陆',changed?'幸好你找到了我！我会沿安全标记返回，请替我先向林川报平安。':'我已经收好测量记录，接下来会沿安全标记返回。');return;
    }
    if(interaction.kind==='forest-clue'){
      const quest=sideQuestProgress(this.save,'dim-glow-moss');
      if(!quest){this.dialog(interaction.name,'苔藓失去了平时的微光，叶缘还有被热风烘干的痕迹。也许小夏知道这意味着什么。');return;}
      const changed=observeMoss(this.save,interaction.id);if(changed)this.persist();this.dialog(interaction.name,changed?`记录完成。已调查 ${sideQuestProgress(this.save,'dim-glow-moss')!.progress}/3 处苔藓。`:'这里的观察记录已经写入任务日志。');return;
    }
    if(interaction.kind==='white-gravel'){meetWhiteGravel(this.save);this.persist();this.dialog('工程护卫 · 白砾','别直接搬那块石头——下面压着旧引路塔的导线。我是白砾，来回收早年试验设备。北面洞穴出现异常过热，我们先按标记清出安全通道。');return;}
    if(interaction.kind==='chapter-one-finale'){this.panel('第一章 · 青芽镇的回声','镇长听完报告，青禾博士确认旧导能设备正是森林异常的源头，林川则接手后续巡查。',[{label:'领取河湾镇通行证',run:()=>{finishChapterOne(this.save);this.persist();this.drawWorld();this.dialog('第一章完成','镇长把河湾镇通行证交给了你。森林恢复平静，而设备上的工程标记指向了下一座小镇。');}}]);return;}
    if(interaction.kind==='forest-route'){
      if(!this.save.story.flags.includes('met-white-gravel')){this.dialog('风铃森林深处','倒木和碎石压住了旧导线。贸然清理可能引发塌落，先问问附近那位工程护卫。');return;}
      this.panel('风铃森林深处','白砾标出了旧导线和受力点。按顺序移开倒木，就能安全清出洞口。',[{label:'清理通道',run:()=>{addStoryFlag(this.save,'forest-route-cleared');this.persist();this.dialog('通往回声洞穴的道路','碎石滚到一旁，洞口涌出灼热的风。继续向北即可进入回声洞穴。');}},{label:'暂时返回',run:()=>this.close()}]);return;
    }
    if(interaction.kind==='echo-beacon'){const result=activateEchoBeacon(this.save,interaction.index);this.persist();this.dialog(interaction.name,result.complete?'三种回声连成完整旋律，北侧设备的控制灯亮了。':result.correct?`声响沿轨道传向深处。当前音序 ${result.progress}/3。`:'音序错误，回声绕回了原点。路标已经重置。');return;}
    if(interaction.kind==='cave-device'){
      if(this.save.story.defeatedBossIds.includes('magma-tortoise')){this.dialog('停机的旧导能设备','设备已经完全冷却。铭牌表明它属于早年的引路塔试验工程，白砾正在回收残留部件。回青芽镇向镇长报告吧。');return;}
      const startBoss=()=>this.startBattle({...makeMonster(2,18),form:2},'boss');
      if(this.save.story.flags.includes('extractor-off')){this.panel('熔岩巨龟','设备已经停机，但受惊的熔岩巨龟仍挡住出口。',[{label:'安抚失控伙伴',run:startBoss},{label:'返回准备',run:()=>this.close()}]);return;}
      if(!canShutDownExtractor(this.save)){this.dialog('过热的抽取设备',`控制面板被三重声锁保护。当前已确认 ${echoSequenceProgress(this.save)}/3 个回声音阶。`);return;}
      this.panel('过热的抽取设备','三重声锁已经解除。关闭设备会惊醒岩层下的巨大伙伴。',[{label:'关闭设备',run:()=>{shutDownExtractor(this.save);this.persist();this.dialog('设备停机','热浪逐渐散去，岩层却突然震动起来——熔岩巨龟醒了！',startBoss);}},{label:'先做准备',run:()=>this.close()}]);return;
    }
    this.panel('巡林员 · 林川',interaction.replay?'要再切磋一次吗？':'准备好了吗？击败我的光耳兔，就能获得青芽徽章。',[{label:'开始挑战 · Lv.7',run:()=>this.startBattle(makeMonster(4,7),true)},{label:'先准备一下',run:()=>this.close()}]);
  }
  private monsterImage(i:number,back=false,form:0|1|2=0){return creatureArtwork(i,form,back);}
  private button(parent:HTMLElement,a:Action){appendActionButton(parent,a,()=>this.beep());}
  private panel(title:string,body:string,actions:Action[],extra=''){
    this.modal=true;const p=mountModalFrame(this.overlay,title,body,extra);actions.forEach(a=>this.button(p,a));
    if(actions.length===1&&actions[0].label==='返回旅行')this.compactClose(p.querySelector<HTMLButtonElement>('button')!);
  }
  private compactClose(button:HTMLButtonElement){
    convertToCompactClose(button);
  }
  private dialog(title:string,body:string,after?:()=>void){this.panel(title,body,[{label:'继续 →',run:()=>{this.close();after?.();}}]);this.overlay.querySelector('.rpg-panel')?.classList.add('dialog-panel');}
  private toggleTravelMenu(){
    const menu=document.getElementById('travel-menu')!;
    if(!menu.hidden){this.close();return;}
    if(this.modal||this.moving||this.enemy)return;
    this.modal=true;menu.hidden=false;
    this.updateHud();
    document.getElementById('menu-toggle')!.setAttribute('aria-expanded','true');
    document.getElementById('menu-close')!.focus();
  }
  private close(){this.bookCleanup?.();this.bookCleanup=undefined;this.overlay.innerHTML='';document.getElementById('travel-menu')!.hidden=true;document.getElementById('menu-toggle')!.setAttribute('aria-expanded','false');this.modal=false;this.updateHud();
    if(this.retreatAfterClose){this.retreatAfterClose=false;this.retreatFromTownExit();}
  }
  private retreatFromTownExit(){
    const x=this.save.x,y=this.save.y+1;
    if(this.save.map!=='greenbud-town'||isMovementBlocked(this.save.map,x,y,this.save.story.flags)||npcs.some(n=>n.x===x&&n.y===y))throw new Error('镇口退步落点不可通行');
    this.moving=true;this.waitMovementRelease=true;
    const direction:Direction={x:0,y:1,frame:0},started=this.time.now;this.facing=direction;
    this.tweens.add({targets:this.hero,y:y*32+30,duration:240,ease:'Linear',
      onUpdate:()=>{this.hero.setDepth(this.hero.y+1);this.hero.setFrame(walkingFrame(direction,this.time.now-started));},
      onComplete:()=>{
        this.save.y=y;this.moving=false;this.walkClock=0;this.hero.setFrame(standingFrame(direction));
        // 剧情退步不累计探索步数、不触发遇敌和出口事件。
        this.persist();this.updateHud();
      },
    });
  }
  private chooseStarter(){this.panel('选择你的第一位伙伴','每一次远行，都始于一次相遇。选择后会获得 8 个捕捉球和 4 瓶药水。',[0,1,2].map(i=>({label:species[i].name,sub:`${elementNames[species[i].element]}属性 · ${species[i].desc}`,run:()=>{this.save.team=[makeMonster(i,5)];this.save.caught=[i];unlockForm(this.save,this.save.team[0]);this.persist();this.dialog('新的同行者',`${species[i].name} 加入了队伍！\n去镇东南的长草结识第二位伙伴，再向东北的巡林员发起挑战。`);}})),`<div class="starter-parade">${[0,1,2].map(i=>this.monsterImage(i)).join('')}</div>`);}
  private teamMenu(selected=0,tab:RosterTab='team',swapping=false,rosterScroll=0){
    if(this.moving||this.enemy)return;
    const view=rosterView(this.save,selected,tab),{monster:m,info:s,canStore}=view;selected=view.selected;
    this.modal=true;
    this.overlay.innerHTML=view.html;
    this.overlay.querySelector('.roster-window')!.classList.add('pixel-bag');
    this.overlay.querySelector<HTMLElement>('.partner-roster')!.scrollTop=rosterScroll;
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-roster-tab]').forEach(b=>b.onclick=()=>this.teamMenu(0,b.dataset.rosterTab as typeof tab));
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-partner]').forEach(b=>b.onclick=()=>{
      const scrollTop=this.overlay.querySelector<HTMLElement>('.partner-roster')?.scrollTop??0;
      this.teamMenu(Number(b.dataset.partner),tab,false,scrollTop);
    });
    const close=this.overlay.querySelector<HTMLButtonElement>('#partner-close')!;close.onclick=()=>this.close();this.compactClose(close);
    if(!m||!s)return;
    const detailPanel=this.overlay.querySelector<HTMLElement>('.partner-detail')!;
    const content=document.createElement('div');content.className='partner-detail-content';
    while(detailPanel.firstChild)content.append(detailPanel.firstChild);
    detailPanel.append(content);
    const toolbar=content.querySelector<HTMLElement>('.roster-actions')!;
    toolbar.className='partner-tools';toolbar.setAttribute('aria-label','伙伴操作');
    toolbar.querySelector('small')?.remove();
    const icons:Record<string,string>={
      'partner-lead':'<path d="M8 27V5m1 1c7-5 10 5 17 0v12c-7 5-10-5-17 0"/><path d="M4 28h9"/>',
      'store-partner':'<path d="m4 15 5-5h14l5 5v13H4Zm0 0h8l2 4h4l2-4h8M16 2v11m-4-4 4 4 4-4"/>',
      'withdraw-partner':'<path d="m4 18 5-5h4m6 0h4l5 5v10H4Zm0 0h8l2 4h4l2-4h8M16 14V2m-4 4 4-4 4 4"/>',
    };
    toolbar.querySelectorAll<HTMLButtonElement>('button').forEach(button=>{
      const label=button.id==='store-partner'&&!canStore?'需保留一位能战斗的随行伙伴':button.textContent!;
      // 禁用操作仍可聚焦查看原因，点击由原有领域条件拦截。
      const unavailable=button.disabled;button.disabled=false;button.setAttribute('aria-disabled',String(unavailable));
      button.className='partner-tool';button.setAttribute('aria-label',label);button.title=label;
      if(button.id==='partner-lead'&&selected===0)button.classList.add('is-lead');
      button.innerHTML=`<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[button.id]}</svg><span class="partner-tool-tip">${label}</span>`;
    });
    const heading=document.createElement('div');heading.className='partner-detail-toolbar';
    const badge=content.querySelector('.element-label');if(badge)heading.append(badge);
    heading.append(toolbar);detailPanel.prepend(heading);
    const lead=this.overlay.querySelector<HTMLButtonElement>('#partner-lead');
    if(lead)lead.onclick=()=>{if(selected===0||m.hp===0)return;[this.save.team[0],this.save.team[selected]]=[m,this.save.team[0]];this.persist();this.teamMenu();};
    const deposit=this.overlay.querySelector<HTMLButtonElement>('#store-partner');
    if(deposit)deposit.onclick=()=>{if(!canStore)return;this.save.reserve.push(this.save.team.splice(selected,1)[0]);this.persist();this.teamMenu(selected);};
    const withdraw=this.overlay.querySelector<HTMLButtonElement>('#withdraw-partner');
    if(withdraw)withdraw.onclick=()=>{if(this.save.team.length>=TEAM_LIMIT){this.teamMenu(selected,'reserve',true);return;}this.save.team.push(this.save.reserve.splice(selected,1)[0]);this.persist();this.teamMenu(selected,'reserve');};
    if(swapping&&tab==='reserve'){
      const detail=this.overlay.querySelector<HTMLElement>('.partner-detail')!;
      detail.innerHTML=swapChooserView(this.save,selected);
      detail.querySelectorAll<HTMLButtonElement>('[data-swap]').forEach(button=>button.onclick=()=>{const i=Number(button.dataset.swap);if(m.hp<=0&&!this.save.team.some((p,j)=>j!==i&&p.hp>0))return;[this.save.team[i],this.save.reserve[selected]]=[m,this.save.team[i]];this.persist();this.teamMenu(selected,'reserve');});
      detail.querySelector<HTMLButtonElement>('#cancel-swap')!.onclick=()=>this.teamMenu(selected,'reserve');
    }
  }
  private bagMenu(selected:typeof supplies[number]['key']='balls'){
    if(this.moving||this.enemy)return;
    const {html,usable}=bagView(this.save,selected);
    this.modal=true;
    this.overlay.innerHTML=html;
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b=>b.onclick=()=>this.bagMenu(b.dataset.item as typeof selected));
    this.overlay.querySelector<HTMLButtonElement>('#bag-close')!.onclick=()=>this.close();
    this.compactClose(this.overlay.querySelector<HTMLButtonElement>('#bag-close')!);
    const use=this.overlay.querySelector<HTMLButtonElement>('#use-item');
    if(use)use.onclick=()=>{if(usable)this.choosePotionTarget();};
  }
  private choosePotionTarget(selected=-1){
    if(this.save.potions<1){this.bagMenu();return;}
    const inspect=this.overlay.querySelector<HTMLElement>('.item-inspect');
    if(!inspect)return;
    const chosen=this.save.team[selected];
    inspect.innerHTML=`<h3>选择治疗对象</h3><div class="potion-targets">${this.save.team.map((m,i)=>`<button class="potion-target ${selected===i?'selected':''}" data-heal-target="${i}" aria-pressed="${selected===i}" ${m.hp>=maxHp(m)?'disabled':''}>${portrait(m)}<span><strong>${monsterName(m)}</strong><small>${m.hp} / ${maxHp(m)} HP</small><span class="partner-hp"><i style="width:${100*m.hp/maxHp(m)}%"></i></span>${m.hp>=maxHp(m)?'<small>无需治疗</small>':''}</span></button>`).join('')}</div><p class="heal-preview" aria-live="polite">${chosen?`${monsterName(chosen)}：${chosen.hp} → ${Math.min(maxHp(chosen),chosen.hp+25)} HP`:'请选择一位伙伴'}</p><button class="rpg-action" id="confirm-heal" ${chosen&&chosen.hp<maxHp(chosen)?'':'disabled'}>确认治疗</button><button class="rpg-action" id="cancel-heal">取消</button>`;
    inspect.querySelectorAll<HTMLButtonElement>('[data-heal-target]').forEach(button=>button.onclick=()=>this.choosePotionTarget(Number(button.dataset.healTarget)));
    inspect.querySelector<HTMLButtonElement>('#cancel-heal')!.onclick=()=>this.bagMenu('potions');
    inspect.querySelector<HTMLButtonElement>('#confirm-heal')!.onclick=()=>{
      // 确认时重新校验对象与库存；选择和取消都不产生存档修改。
      if(!chosen||this.save.team[selected]!==chosen||chosen.hp>=maxHp(chosen)||this.save.potions<1)return;
      this.save.potions--;chosen.hp=Math.min(maxHp(chosen),chosen.hp+25);this.persist();this.bagMenu('potions');
    };
  }
  private heal(){this.save.team.forEach(m=>m.hp=maxHp(m));this.save.reserve.forEach(m=>m.hp=maxHp(m));if(this.save.balls<3)this.save.balls=3;this.persist();this.dialog('护理员 · 阿澄','伙伴们已经恢复健康！\n如果捕捉球不足三个，我也会帮你补到三个。放心探索吧。');}
  private shop(message='',selected:typeof supplies[number]['key']='balls',quantity=1){
    this.modal=true;
    const {html,groups}=shopView(this.save,message,selected,quantity);
    this.overlay.innerHTML=html;
    this.overlay.querySelector('.trading-post')!.classList.add('pixel-bag');
    const coin=this.overlay.querySelector('.wallet-coin')!;
    coin.className='pixel-coin';coin.innerHTML=pixelItem('coin');
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-product]').forEach(b=>b.onclick=()=>this.shop('',b.dataset.product as typeof selected));
    this.overlay.querySelector<HTMLButtonElement>('#trade-less')!.onclick=()=>this.shop('',selected,groups-1);
    this.overlay.querySelector<HTMLButtonElement>('#trade-more')!.onclick=()=>this.shop('',selected,groups+1);
    this.overlay.querySelector<HTMLButtonElement>('#trade-buy')!.onclick=()=>this.buy(selected,groups);
    const close=this.overlay.querySelector<HTMLButtonElement>('#leave-shop')!;close.onclick=()=>this.close();this.compactClose(close);
  }
  private buy(key:typeof supplies[number]['key'],groups:number){
    const item=supplies.find(p=>p.key===key);
    if(!item||!Number.isInteger(groups)||groups<1||groups>99)return;
    const cost=item.price*groups,count=item.count*groups;
    if(this.save.money<cost){this.shop('金币不足，暂时无法购买。',key);return;}
    this.save.money-=cost;this.save[key]=(this.save[key]??0)+count;
    this.beep();this.persist();this.shop(`已收进背包：${item.name} ×${count}`,key);
  }
  private journal(selected=this.bookPage){
    if(this.moving||this.enemy)return;
    this.bookCleanup?.();this.modal=true;
    this.bookCleanup=mountDexBook(this.overlay,this.save,selected,page=>{this.bookPage=page;},()=>this.close());
  }
  private questMenu(){
    if(this.moving||this.enemy)return;this.modal=true;this.overlay.innerHTML=questView(this.save);
    this.overlay.querySelector<HTMLButtonElement>('#quest-close')!.onclick=()=>this.close();
  }
  private startBattle(enemy:Monster,kind:BattleKind|boolean){
    if(!this.save.team.some(m=>m.hp>0)){this.close();this.heal();return;}
    const living=this.save.team.findIndex(m=>m.hp>0);if(this.save.team[0].hp<=0)[this.save.team[0],this.save.team[living]]=[this.save.team[living],this.save.team[0]];
    const normalized=typeof kind==='boolean'?(kind?'trainer':'wild'):kind;
    this.battle.start(enemy,normalized,normalized==='boss'?'失控的熔岩巨龟挡住了出口！':normalized==='trainer'?'林川派出了星瞳灵！':`野生的 ${monsterName(enemy)} 出现了！`);this.audio.playMusic(battleMusic[normalized]);this.battleView();this.battleEffect({kind:'entry'});
  }
  private battleView(){const enemy=this.enemy;if(!enemy)return;this.modal=true;const ally=this.save.team[0];
    this.overlay.innerHTML=battleScreenView(enemy,ally,this.battle.kind,this.battleBusy,this.battleLog);
    const p=this.overlay.querySelector<HTMLElement>('.battle-actions')!;
    let actions:Action[]=[{label:'招式',sub:'选择招式',kind:species[ally.species].element,run:()=>{this.battleMenu='skills';this.battleView();}},{label:'道具',sub:'打开随身道具盘',kind:'potion',run:()=>{this.battleMenu='items';this.battleView();}},{label:'更换',sub:'切换伙伴',kind:'switch',run:()=>this.battleSwitch()},{label:'逃跑',sub:this.boss?'首领挡住了出口':'离开战斗',kind:'flee',disabled:this.boss,run:()=>this.finishBattle('你和伙伴安全地离开了战斗。')}];
    if(this.battleMenu==='skills'){const list=skills(ally);actions=list.map(k=>({label:k.name,sub:k.desc,kind:k.kind,run:()=>void this.turn(k.id)}));}
    if(this.battleMenu==='items'){
      const state=this.state(ally),owned=supplies.filter(item=>item.combat&&(this.save[item.key]??0)>0&&!(this.battle.kind!=='wild'&&item.combat.action==='capture'));
      actions=owned.map(item=>{const combat=item.combat!,disabled=combat.action==='potion'?(ally.hp<=0||ally.hp>=maxHp(ally)):combat.action==='tonic'?state.attack>=2:combat.action==='remedy'?state.attack>=0:false;return {label:`${item.name} ×${this.save[item.key]??0}`,sub:disabled?(combat.action==='potion'?'当前体力无需恢复':combat.action==='tonic'?'攻击已达上限':'当前没有攻击弱化'):combat.hint,kind:item.key,art:pixelItem(item.key),disabled,run:()=>void this.turn(combat.action)};});
      if(!actions.length)actions=[{label:'没有可用道具',sub:'背包中暂无战斗道具',kind:'empty',disabled:true,run:()=>{}}];
    }
    p.dataset.menu=this.battleMenu;
    if(this.battleMenu!=='main')actions.push({label:'返回',kind:'flee',run:()=>{this.battleMenu='main';this.battleView();}});
    actions.forEach(a=>this.button(p,a));p.querySelectorAll('button').forEach((b,i)=>{const action=actions[i];b.disabled=this.battleBusy||action.disabled===true;b.classList.add('battle-command');b.dataset.kind=action.kind??'attack';b.insertAdjacentHTML('afterbegin',`<span class="command-art">${action.art??battleIcon(action.kind??'attack')}</span>`);});
    for(const [mon,selector] of [[ally,'.ally-status'],[enemy,'.enemy-status']] as const){const st=this.state(mon);this.overlay.querySelector(selector)!.insertAdjacentHTML('beforeend',`<div class="battle-badges">${st.attack?statusIcon(st.attack>0?'up':'down',Math.abs(st.attack)):''}${st.guard?statusIcon('guard'):''}</div>`);}
    this.overlay.querySelectorAll<HTMLButtonElement>('.status-icon').forEach(b=>b.onclick=()=>{const expanded=b.getAttribute('aria-expanded')==='true';this.overlay.querySelectorAll('.status-icon').forEach(el=>el.setAttribute('aria-expanded','false'));b.setAttribute('aria-expanded',String(!expanded));});
  }
  private battleEffect(feedback:BattleFeedback){
    const screen=this.overlay.querySelector<HTMLElement>('.battle-screen');if(!screen)return;
    const layer=screen.querySelector<HTMLElement>('.battle-fx-layer');if(!layer)return;
    const effect=feedback.kind==='attack'?`${feedback.actor}-attack`:feedback.kind;
    screen.dataset.effect=effect;screen.dataset.element=feedback.kind==='attack'?feedback.element:'';screen.dataset.effective=feedback.kind==='attack'&&feedback.effective?'true':'false';
    screen.dataset.target='target' in feedback?feedback.target:'';
    if(feedback.kind==='capture'){
      screen.dataset.capturePhase=feedback.phase;screen.dataset.captureShake=String(feedback.shake??0);
      screen.dataset.captureStyle=this.captureEffectStyle;
      const enemyElement=this.enemy?species[this.enemy.species].element:'fire';
      layer.innerHTML=captureEffectView(feedback,supplyImage('balls','capture-orb-art'),this.captureEffectStyle,enemyElement);
      if(this.captureEffectStyle==='pixel')void hydratePixelCaptureEffect(screen,feedback.phase);
    }else if(feedback.kind==='attack')layer.innerHTML=`<span class="battle-impact"><i></i><i></i><i></i><i></i><i></i><i></i></span><strong class="damage-pop">-${feedback.amount}</strong>${feedback.effective?'<strong class="effective-callout">效果拔群！</strong>':''}`;
    else if(feedback.kind==='heal'||feedback.kind==='buff')layer.innerHTML='<span class="battle-sparkles"><i>+</i><i>✦</i><i>+</i><i>✦</i><i>+</i></span>';
    else if(feedback.kind==='debuff')layer.innerHTML='<span class="battle-debuff"><i></i><i></i><i></i></span>';
    else if(feedback.kind==='switch')layer.innerHTML='<span class="switch-wind"><i></i><i></i><i></i></span>';
    this.battleSound(feedback);
  }
  private battleSound(feedback:BattleFeedback){
    if(feedback.kind==='capture'){
      if(feedback.phase==='throw')this.audio.playSfx('capture-throw');
      else if(feedback.phase==='shake')this.audio.playSfx('capture-shake');
      else if(feedback.phase==='success')this.audio.playSfx('capture-success');
      else [420,260].forEach((note,index)=>this.time.delayedCall(index*90,()=>this.beep(note)));
      return;
    }
    if(feedback.kind==='attack'){this.audio.playSfx('hit-normal');return;}
    const notes=feedback.kind==='heal'||feedback.kind==='buff'?[520,680]:[300];
    notes.forEach((note,index)=>this.time.delayedCall(index*90,()=>this.beep(note)));
  }
  private async pauseLog(text:string,feedback?:BattleFeedback){this.battleLog=text;this.battleView();if(feedback)this.battleEffect(feedback);else this.beep(300);const duration=this.captureEffectStyle==='pixel'&&feedback?.kind==='capture'&&feedback.phase==='throw'?PIXEL_CAPTURE_THROW_DURATION:feedbackDuration(feedback);await new Promise<void>(resolve=>this.time.delayedCall(duration,resolve));}
  private turn(action:BattleAction){return this.battleFlow.turn(action);}
  private enemyTurn(){return this.battleFlow.enemyTurn();}
  private battleSwitch(){if(this.battleBusy)return;this.panel('更换出战伙伴','更换伙伴会消耗一个回合。',[...this.save.team.map((m,i)=>({label:`${monsterName(m)} · HP ${m.hp}/${maxHp(m)}`,run:()=>{if(i===0||!m.hp)return;[this.save.team[0],this.save.team[i]]=[this.save.team[i],this.save.team[0]];this.battleBusy=true;this.battleView();void this.enemyTurn();}})),{label:'返回战斗',run:()=>this.battleView()}]);}
  private finishBattle(text:string,growth:BattleGrowth[]=[]){
    if(this.battleBusy&&!this.enemy)return;
    this.battle.finish();this.encounterCooldown=8;this.audio.playMusic(mapMusic[this.save.map]);
    this.save.team.forEach(m=>unlockForm(this.save,m));
    this.persist();
    if(growth.some(item=>item.levelAfter>item.levelBefore))this.audio.playSfx('level-up');
    if(growth.length)this.battleResults(text,growth);else this.dialog('相遇的记录',text);
  }
  private battleResults(summary:string,growth:BattleGrowth[],selected=0){
    const view=battleResultsView(summary,growth,selected);selected=view.selected;this.modal=true;this.overlay.innerHTML=view.html;
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-growth-index]').forEach(button=>button.onclick=()=>this.battleResults(summary,growth,Number(button.dataset.growthIndex)));
    this.overlay.querySelector<HTMLButtonElement>('.result-next')!.onclick=()=>selected<growth.length-1?this.battleResults(summary,growth,selected+1):this.close();
    requestAnimationFrame(()=>this.overlay.querySelector('.battle-result-panel')?.classList.add('is-playing'));
  }
  private persist(){try{this.saves.persist(this.save);}catch{this.storageError='浏览器无法保存，请检查存储权限。';}this.updateHud();}
  private updateHud(){updateHudView(this.save,this.activeSlot,this.storageError);}
}
