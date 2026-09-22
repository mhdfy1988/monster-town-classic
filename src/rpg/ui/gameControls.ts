export interface GameControlActions {
  close():void;
  openTeam():void;
  openBag():void;
  openJournal():void;
  openQuests():void;
  save():void;
  returnToTitle():void;
  toggleSettings():void;
  getAudioSettings():{musicEnabled:boolean;sfxEnabled:boolean;musicVolume:number;sfxVolume:number};
  toggleMusic():boolean;
  toggleSfx():boolean;
  setMusicVolume(value:number):void;
  setSfxVolume(value:number):void;
  resetEscapeKey():void;
}

export function bindGameControls(overlay:HTMLElement,actions:GameControlActions){
  overlay.onkeydown=event=>{if((event.key==='Enter'||event.key===' ')&&event.target instanceof HTMLButtonElement){event.preventDefault();event.stopPropagation();if(!event.repeat&&!event.target.disabled)event.target.click();}};
  document.getElementById('menu-toggle')!.onclick=actions.toggleSettings;
  document.getElementById('menu-close')!.onclick=actions.close;
  document.getElementById('travel-menu')!.onkeydown=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();actions.resetEscapeKey();actions.close();return;}
    if((event.key==='Enter'||event.key===' ')&&event.target instanceof HTMLButtonElement){event.preventDefault();event.stopPropagation();if(!event.repeat&&!event.target.disabled)event.target.click();}
  };
  document.getElementById('menu-team')!.onclick=()=>{actions.close();actions.openTeam();};
  document.getElementById('menu-bag')!.onclick=()=>{actions.close();actions.openBag();};
  document.getElementById('menu-journal')!.onclick=()=>{actions.close();actions.openJournal();};
  document.getElementById('menu-quests')!.onclick=()=>{actions.close();actions.openQuests();};
  document.getElementById('menu-save')!.onclick=actions.save;
  document.getElementById('menu-title')!.onclick=actions.returnToTitle;
  const syncAudioControls=()=>{
    const settings=actions.getAudioSettings();
    for(const [id,enabled] of [['menu-music',settings.musicEnabled],['menu-sfx',settings.sfxEnabled]] as const){
      const control=document.getElementById(id)!;control.setAttribute('aria-checked',String(enabled));control.querySelector('.sound-state')!.textContent=enabled?'开':'关';
    }
    for(const [id,outputId,value] of [['menu-music-volume','menu-music-volume-value',settings.musicVolume],['menu-sfx-volume','menu-sfx-volume-value',settings.sfxVolume]] as const){
      const input=document.getElementById(id) as HTMLInputElement;input.value=String(Math.round(value*100));document.getElementById(outputId)!.textContent=`${input.value}%`;
    }
  };
  document.getElementById('menu-music')!.onclick=()=>{actions.toggleMusic();syncAudioControls();};
  document.getElementById('menu-sfx')!.onclick=()=>{actions.toggleSfx();syncAudioControls();};
  for(const [id,setVolume] of [['menu-music-volume',actions.setMusicVolume],['menu-sfx-volume',actions.setSfxVolume]] as const){
    document.getElementById(id)!.addEventListener('input',event=>{setVolume(Number((event.target as HTMLInputElement).value)/100);syncAudioControls();});
  }
  syncAudioControls();
}
