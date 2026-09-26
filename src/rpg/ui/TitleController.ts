import { newGame, type Save } from '../model';
import { AudioPlayer } from '../infrastructure/AudioPlayer';
import { SaveRepository } from '../infrastructure/SaveRepository';
import type { GameLaunch } from '../runtimeContract';
import { appendActionButton, mountModalFrame, type UiAction } from './modal';
import { endedScreenView, loadingScreenView, saveSlotsView, titleScreenView } from './titleViews';

interface TitleControllerOptions {
  shell: HTMLElement;
  overlay: HTMLElement;
  qaPreset: string | null;
  launch: (request: GameLaunch) => Promise<void>;
}

/** 标题宿主：只管理首页、存档目录和启动请求，不创建游戏世界。 */
export class TitleController {
  private readonly shell: HTMLElement;
  private readonly overlay: HTMLElement;
  private readonly qaPreset: string | null;
  private readonly launchGame: (request: GameLaunch) => Promise<void>;
  private readonly saves = new SaveRepository(localStorage);
  private readonly audio = new AudioPlayer();
  private active = false;
  private readonly unlockAudio = () => this.audio.unlock();

  constructor(options: TitleControllerOptions) {
    this.shell=options.shell;this.overlay=options.overlay;this.qaPreset=options.qaPreset;this.launchGame=options.launch;
  }

  mount(message='') {
    this.activate();this.shell.dataset.appState='title';this.showTitle(message);
  }

  dispose() {
    this.deactivate();this.overlay.innerHTML='';void this.audio.suspend();
  }

  private activate() {
    if(this.active)return;this.active=true;
    window.addEventListener('pointerdown',this.unlockAudio,{once:true});
    window.addEventListener('keydown',this.unlockAudio,{once:true});
  }

  private deactivate() {
    if(!this.active)return;this.active=false;
    window.removeEventListener('pointerdown',this.unlockAudio);
    window.removeEventListener('keydown',this.unlockAudio);
    void this.audio.suspend();
  }

  private showTitle(message='') {
    let latest=-1;
    try{latest=this.saves.latestIndex();}catch{message='存档读取失败，原数据已保留。请检查浏览器存储权限。';}
    this.overlay.innerHTML=titleScreenView(latest,message);
    this.overlay.querySelector<HTMLButtonElement>('#title-new')!.onclick=()=>void this.launch(newGame(),null,'new');
    this.overlay.querySelector<HTMLButtonElement>('#title-continue')!.onclick=()=>this.loadSlot(latest);
    this.overlay.querySelector<HTMLButtonElement>('#title-slots')!.onclick=()=>this.slotMenu();
    this.overlay.querySelector<HTMLButtonElement>('#title-exit')!.onclick=()=>this.panel('结束游戏','结束后将停留在关闭提示页。存档仍保存在此浏览器中。',[{label:'结束游戏',run:()=>this.showEnded()},{label:'取消',run:()=>this.showTitle()}]);
    const menu=this.overlay.querySelector<HTMLElement>('.classic-menu')!;
    menu.onkeydown=event=>{if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const buttons=[...menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];const index=buttons.indexOf(document.activeElement as HTMLButtonElement);buttons[(index+(event.key==='ArrowDown'?1:buttons.length-1)+buttons.length)%buttons.length].focus();};
    this.overlay.querySelector<HTMLButtonElement>(latest>=0?'#title-continue':'#title-new')!.focus();
  }

  private async launch(save: Save, activeSlot: number | null, mode: GameLaunch['mode']) {
    this.deactivate();this.shell.dataset.appState='loading';this.overlay.innerHTML=loadingScreenView();
    try{await this.launchGame({save,activeSlot,mode,qaPreset:this.qaPreset});}
    catch(error){console.error(error);this.activate();this.shell.dataset.appState='title';this.showTitle('游戏资源加载失败，请刷新页面后重试。');}
  }

  private loadSlot(index:number) {
    try{const save=this.saves.load(index);if(save)void this.launch(save,index,'load');}
    catch{this.panel('读取失败','原存档已保留，未载入游戏。',[{label:'返回标题',run:()=>this.showTitle()}]);}
  }

  private slotMenu() {
    let book;try{book=this.saves.readBook();}catch{this.panel('存档不可用','原数据已保留，无法读取存档目录。',[{label:'返回',run:()=>this.showTitle()}]);return;}
    this.overlay.innerHTML=saveSlotsView(book,'load',true,null);
    this.overlay.querySelector<HTMLButtonElement>('#slots-back')!.onclick=()=>this.showTitle();
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach(button=>button.onclick=()=>this.loadSlot(Number(button.dataset.slot)));
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach(button=>button.onclick=()=>{const index=Number(button.dataset.delete);this.panel('删除存档？',`永久删除存档 ${index+1}，无法撤销。`,[{label:'确认删除',run:()=>{try{this.saves.remove(index);this.slotMenu();}catch{this.panel('删除失败','原存档已保留。',[{label:'返回',run:()=>this.slotMenu()}]);}}},{label:'取消',run:()=>this.slotMenu()}]);});
  }

  private panel(title:string,body:string,actions:UiAction[]) {
    const parent=mountModalFrame(this.overlay,title,body);actions.forEach(action=>appendActionButton(parent,action,()=>this.audio.beep()));
  }

  private showEnded() {
    this.overlay.innerHTML=endedScreenView();
    this.overlay.querySelector<HTMLButtonElement>('#return-title')!.onclick=()=>this.showTitle();
  }
}
