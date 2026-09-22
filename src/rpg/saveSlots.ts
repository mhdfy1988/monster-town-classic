import { SAVE_KEY, validSave, type Save } from './model';
import { migrateSave } from './infrastructure/saveMigration';

export const SLOTS_KEY = 'pocket-grove-slots-v1';
export interface SaveSlot { updated: number; data: Save }
export interface SlotBook { version: 1; slots: (SaveSlot | null)[] }
// 外层存档目录沿用游戏已有的运行时校验；损坏时显式报错，不回退旧进度。
export function readSlots(storage: Pick<Storage,'getItem'|'setItem'>): SlotBook {
  const raw=storage.getItem(SLOTS_KEY);
  if(raw!==null){
    const source=JSON.parse(raw) as {version?:unknown;slots?:unknown};
    if(!source||source.version!==1||!Array.isArray(source.slots)||source.slots.length!==3)throw new Error('存档目录损坏，原数据已保留。');
    const slots=source.slots.map(slot=>{
      if(slot===null)return null;
      if(!slot||typeof slot!=='object')throw new Error('存档目录损坏，原数据已保留。');
      const candidate=slot as {updated?:unknown;data?:unknown};
      if(!Number.isFinite(candidate.updated)||Number(candidate.updated)<0)throw new Error('存档目录损坏，原数据已保留。');
      return {updated:Number(candidate.updated),data:migrateSave(candidate.data,6)};
    });
    return {version:1,slots};
  }
  const book:SlotBook={version:1,slots:[null,null,null]};
  const legacy=storage.getItem(SAVE_KEY);
  if(legacy!==null){book.slots[0]={updated:Date.now(),data:migrateSave(JSON.parse(legacy),6)};}
  // 一次性迁移。即使删除所有存档，也不会再次自动导入旧数据。
  storage.setItem(SLOTS_KEY,JSON.stringify(book));
  return book;
}
export function writeSlot(storage: Pick<Storage,'getItem'|'setItem'>,index:number,data:Save|null,now=Date.now()){
  if(!Number.isInteger(index)||index<0||index>2||data!==null&&!validSave(data))throw new Error('无效的存档数据。');
  const book=readSlots(storage);
  book.slots[index]=data?{updated:now,data:structuredClone(data)}:null;
  storage.setItem(SLOTS_KEY,JSON.stringify(book));
}
export function latestSlot(book:SlotBook){return book.slots.reduce((best,s,i)=>s&&(best<0||s.updated>book.slots[best]!.updated)?i:best,-1);}
