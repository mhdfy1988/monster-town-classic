import type { Save } from '../model';
import { latestSlot, readSlots, writeSlot, type SlotBook } from '../saveSlots';

export class SaveRepository {
  activeSlot: number | null = null;
  error = '';
  private readonly storage: Pick<Storage,'getItem'|'setItem'>;

  constructor(storage: Pick<Storage,'getItem'|'setItem'>){this.storage=storage;}

  readBook(): SlotBook {
    const book=readSlots(this.storage);this.error='';return book;
  }

  latestIndex(){return latestSlot(this.readBook());}

  load(index:number): Save | null {
    const slot=this.readBook().slots[index];
    if(!slot)return null;
    this.activeSlot=index;this.error='';return structuredClone(slot.data);
  }

  write(index:number,save:Save){writeSlot(this.storage,index,save);this.activeSlot=index;this.error='';}
  remove(index:number){writeSlot(this.storage,index,null);if(this.activeSlot===index)this.activeSlot=null;this.error='';}
  persist(save:Save){if(this.activeSlot===null){this.error='';return;}writeSlot(this.storage,this.activeSlot,save);this.error='';}
  beginUnsaved(){this.activeSlot=null;this.error='';}
  fail(message:string){this.error=message;}
}
