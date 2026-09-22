import type { Save } from '../model';
import { mapDefinition } from '../content/maps/mapRegistry';
import { mainQuestSnapshot } from '../systems/questProgress';

export function locationName(save: Save) {
  return save.map==='greenbud-town'&&save.x>=30&&save.y<20?'镇东草地':mapDefinition(save.map).name;
}

export function questText(save: Save) {
  return mainQuestSnapshot(save).objective;
}

export function updateHudView(save: Save, activeSlot: number | null, storageError: string) {
  document.getElementById('location-name')!.textContent=locationName(save);
  document.getElementById('quest-text')!.textContent=questText(save);
  document.getElementById('save-status')!.textContent=storageError||(activeSlot===null?'尚未创建存档':`当前存档 ${activeSlot+1}`);
}
