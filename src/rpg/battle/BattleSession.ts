import { freshState, type BattleState } from '../combat';
import type { Monster } from '../model';

export type BattleMenu = 'main' | 'skills' | 'items';
export type BattleKind = 'wild' | 'trainer' | 'boss';

export class BattleSession {
  enemy: Monster | null = null;
  kind:BattleKind='wild';
  get trainer(){return this.kind==='trainer';}
  set trainer(value:boolean){this.kind=value?'trainer':'wild';}
  get boss(){return this.kind==='boss';}
  busy = false;
  log = '';
  menu: BattleMenu = 'main';
  private readonly states=new Map<Monster,BattleState>();

  state(monster: Monster) {
    let state=this.states.get(monster);
    if(!state){state=freshState();this.states.set(monster,state);}
    return state;
  }

  start(enemy: Monster, kind: BattleKind|boolean, log: string) {
    this.states.clear();this.enemy=enemy;this.kind=typeof kind==='boolean'?(kind?'trainer':'wild'):kind;this.busy=false;this.menu='main';this.log=log;
  }

  finish() {
    this.enemy=null;this.kind='wild';this.busy=false;this.menu='main';this.states.clear();
  }
}
