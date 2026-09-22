import { describe, expect, it } from 'vitest';
import { newGame } from '../model';
import { SaveRepository } from './SaveRepository';

function memoryStorage(){const values=new Map<string,string>();return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};}

describe('存档仓库适配器',()=>{
  it('集中管理当前存档位和未保存旅程',()=>{
    const repository=new SaveRepository(memoryStorage()),save=newGame();
    expect(repository.latestIndex()).toBe(-1);repository.write(1,save);expect(repository.activeSlot).toBe(1);expect(repository.latestIndex()).toBe(1);
    expect(repository.load(1)).toEqual(save);repository.beginUnsaved();expect(repository.activeSlot).toBeNull();
  });
});
