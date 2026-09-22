import { damage, monsterInfo, type Monster, type Save, maxHp } from './model';

export interface BattleState { attack: number; guard: number }
export const freshState=():BattleState=>({attack:0,guard:0});
export type CombatItem='capture'|'potion'|'tonic'|'remedy';
export type SupplyKey='balls'|'potions'|'tonics'|'remedies';
type Supply={key:SupplyKey;name:string;desc:string;count:number;price:number;combat?:{action:CombatItem;hint:string}};
// 背包、商店和战斗共用同一份物品目录；以后新增非战斗物品时可不填写 combat。
export const supplies:readonly Supply[]=[
  {key:'balls',name:'精灵球',desc:'野生战斗中捕捉伙伴，体力越低越容易成功。',count:3,price:30,combat:{action:'capture',hint:'削弱后捕捉'}},
  {key:'potions',name:'恢复药水',desc:'恢复当前伙伴 25 HP。',count:2,price:20,combat:{action:'potion',hint:'当前伙伴恢复 25 HP'}},
  {key:'tonics',name:'力量药剂',desc:'本场战斗攻击提升 20%，最多 2 层。',count:1,price:20,combat:{action:'tonic',hint:'攻击 +20%，最多 2 层'}},
  {key:'remedies',name:'净化药剂',desc:'解除当前伙伴的攻击弱化；战斗中使用。',count:1,price:15,combat:{action:'remedy',hint:'解除攻击弱化'}},
];
export type MoveId='attack'|'special'|'weaken'|'guard';
// 首版按种族与等级自动学习，最多四招；不引入额外存档字段。
export const learnsets:ReadonlyArray<ReadonlyArray<readonly [MoveId,number]>>=[
 [['attack',1],['weaken',3],['special',5]],
 [['attack',1],['special',3],['weaken',7]],
 [['attack',1],['guard',3],['special',5]],
 [['attack',1],['special',4],['guard',7]],
 [['attack',1],['weaken',3],['special',5],['guard',10]],
 [['attack',1],['special',3],['guard',7]],
 [['attack',1],['special',3],['weaken',7]],
 [['attack',1],['special',3],['guard',7]],
];
export function skills(m:Monster){
 const info=monsterInfo(m);
 const moves={attack:{name:'撞击',desc:'普通属性 · 伤害招式',kind:'attack'},special:{name:info.move,desc:'属性伤害招式',kind:info.element},weaken:{name:'叫声',desc:'变化招式 · 降低敌方攻击，最多 2 层',kind:'light'},guard:{name:'守护',desc:'变化招式 · 下一次受击减伤 50%',kind:'earth'}};
 return learnsets[m.species].filter(([,level])=>m.level>=level).slice(0,4).map(([id])=>({id,...moves[id]}));
}
export function combatDamage(a:Monster,b:Monster,special:boolean,source:BattleState,target:BattleState,rng=Math.random){
  const hit=damage(a,b,special,rng);return {...hit,amount:Math.max(1,Math.floor(hit.amount*(1+source.attack*.2)*(target.guard?.5:1)))};
}
export function useCombatItem(s:Save,m:Monster,state:BattleState,item:Exclude<CombatItem,'capture'>):string|null{
  if(item==='potion'){if(s.potions<1||m.hp<=0||m.hp>=maxHp(m))return null;s.potions--;m.hp=Math.min(maxHp(m),m.hp+25);return '恢复了 25 HP';}
  if(item==='tonic'){if((s.tonics??0)<1||state.attack>=2)return null;s.tonics=(s.tonics??0)-1;state.attack++;return '攻击提升 1 层';}
  if((s.remedies??0)<1||state.attack>=0)return null;s.remedies=(s.remedies??0)-1;state.attack=0;return '攻击弱化已解除';
}
