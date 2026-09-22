import { campaignBosses, campaignStory } from './content/campaign';
import { sideQuestDefinitions, sideQuestIds } from './content/quests';
import { isValidMapLocation, type RuntimeMapId } from './content/maps/mapRegistry';

export type Element = 'fire' | 'earth' | 'water' | 'wood' | 'metal' | 'ice' | 'light' | 'lightning';
export const species = [
  { id: 'budaye', name: '叶芽鹿', element: 'wood', color: '#84b97d', desc: '耳朵像两片嫩叶，跑过的地方会留下细小芽点。', move: '飞叶', power: 12 },
  { id: 'agnite', name: '小火狐', element: 'fire', color: '#e99565', desc: '额头和尾尖燃着暖火，好奇心比火苗还旺。', move: '火花', power: 13 },
  // 旧 ID 保留给既有存档；展示形象与名称按新编号体系更新。
  { id: 'rockitten', name: '小岩龟', element: 'earth', color: '#b49a82', desc: '背着一簇圆岩的小龟，四只脚稳得像钉在地上。', move: '碎石冲撞', power: 12 },
  { id: 'grintot', name: '铁甲鼠', element: 'metal', color: '#9aa4a8', desc: '银色甲片包住身体，遇到危险时会缩成一团。', move: '铁头撞', power: 12 },
  { id: 'eyenemy', name: '光耳兔', element: 'light', color: '#e9cf77', desc: '长耳会收集晨光，胸口的小光点会随呼吸闪烁。', move: '闪光弹', power: 14 },
  { id: 'rippleotter', name: '水泡獭', element: 'water', color: '#72adc0', desc: '喜欢把水泡顶在头上，尾巴一甩就能滑出很远。', move: '水泡冲', power: 12 },
  { id: 'frostfox', name: '冰晶狐', element: 'ice', color: '#8ecbe8', desc: '白毛间长着小冰晶，走过的草尖会结一层薄霜。', move: '冰晶刺', power: 13 },
  { id: 'voltcat', name: '闪电猫', element: 'lightning', color: '#e8bd4f', desc: '尾巴弯成闪电形，兴奋时耳尖会冒出细小电花。', move: '电光爪', power: 13 },
] as const;
export const elementNames: Record<Element, string> = { fire:'火',earth:'土',water:'水',wood:'木',metal:'金',ice:'冰',light:'光',lightning:'雷' };
export interface Monster { species: number; level: number; hp: number; xp: number; form?: 0 | 1 | 2 }
// 保留旧种族编号；旧存档无 form 字段时按初阶解释，不覆盖等级或经验。
export const woodForms = [
  {catalogId:'004',name:'叶芽鹿',level:1,move:'飞叶',desc:'耳朵像两片嫩叶，跑过的地方会留下细小芽点。'},
  {catalogId:'012',name:'绿角鹿',level:10,move:'叶刃',desc:'枝角长出新叶，能借着灌木的遮掩快速穿行。'},
  {catalogId:'020',name:'古树鹿',level:20,move:'古树冲击',desc:'巨大的树枝角像一片小树林，是森林里沉稳的守护者。'},
] as const;
export const fireForms = [
  {catalogId:'001',name:'小火狐',level:1,move:'火花',desc:'额头和尾尖燃着暖火，好奇心比火苗还旺。'},
  {catalogId:'009',name:'双尾火狐',level:10,move:'火焰爪',desc:'长出两条火尾，奔跑时会拖出两道明亮火线。'},
  {catalogId:'017',name:'九尾火狐',level:20,move:'九尾烈焰',desc:'九条火尾完全展开，额上的火冠标志着它已经成熟。'},
] as const;
export const earthForms = [
  {catalogId:'002',name:'小岩龟',level:1,move:'碎石冲撞',desc:'背着一簇圆岩的小龟，四只脚稳得像钉在地上。'},
  {catalogId:'010',name:'岩甲龟',level:10,move:'岩甲冲锋',desc:'尖岩和晶石铺满背甲，冲锋时像一块移动的山石。'},
  {catalogId:'018',name:'熔岩巨龟',level:20,move:'熔岩震地',desc:'巨大的火山岩甲裂出红光，重踏足以让地面震动。'},
] as const;
export const waterForms = [
  {catalogId:'003',name:'水泡獭',level:1,move:'水泡冲',desc:'喜欢把水泡顶在头上，尾巴一甩就能滑出很远。'},
  {catalogId:'011',name:'浪花獭',level:10,move:'浪花拍击',desc:'背鳍和尾巴化成浪花，转身时会甩出一圈水刃。'},
  {catalogId:'019',name:'巨浪水龙',level:20,move:'巨浪冲击',desc:'身体能顺着水流拉长，卷起巨浪穿过河道。'},
] as const;
export const metalForms = [
  {catalogId:'005',name:'铁甲鼠',level:1,move:'铁头撞',desc:'银色甲片包住身体，遇到危险时会缩成一团。'},
  {catalogId:'013',name:'钢甲兽',level:10,move:'钢尾扫',desc:'甲片变得更厚，尾巴能像钢鞭一样扫开石块。'},
  {catalogId:'021',name:'炮甲兽',level:20,move:'钢炮轰击',desc:'前肢变成重型钢炮，厚甲能承受巨大的后坐力。'},
] as const;
export const iceForms = [
  {catalogId:'006',name:'冰晶狐',level:1,move:'冰晶刺',desc:'白毛间长着小冰晶，走过的草尖会结一层薄霜。'},
  {catalogId:'014',name:'冰尾狐',level:10,move:'冰尾扫',desc:'数条冰尾能够一起卷起冷风，冻结追来的敌人。'},
  {catalogId:'022',name:'冰冠九尾',level:20,move:'冰冠风暴',desc:'头顶结出冰晶王冠，九条长尾能引来一场暴雪。'},
] as const;
export const lightForms = [
  {catalogId:'007',name:'光耳兔',level:1,move:'闪光弹',desc:'长耳会收集晨光，胸口的小光点会随呼吸闪烁。'},
  {catalogId:'015',name:'光翼兔',level:10,move:'光翼冲',desc:'背上展开一对光翼，跳起时像一颗小流星。'},
  {catalogId:'023',name:'圣光翼兔',level:20,move:'圣光环',desc:'巨大的光翼和金色光环能照亮整片夜空。'},
] as const;
export const lightningForms = [
  {catalogId:'008',name:'闪电猫',level:1,move:'电光爪',desc:'尾巴弯成闪电形，兴奋时耳尖会冒出细小电花。'},
  {catalogId:'016',name:'雷纹猫',level:10,move:'雷纹扑击',desc:'身上的黑色雷纹扩展开来，扑击速度快得只剩残影。'},
  {catalogId:'024',name:'雷牙虎',level:20,move:'雷牙突袭',desc:'长牙和双雷尾储满电力，起跑时会炸开一圈电光。'},
] as const;
type EvolutionForm={catalogId:string;name:string;level:number;move:string;desc:string};
type EvolutionForms=readonly [EvolutionForm,EvolutionForm,EvolutionForm];
// 数组下标继续兼容旧存档；图鉴顺序由 catalogId 决定。
// 八条进化线均已接入二视图；数组下标继续作为旧存档中的稳定种族编号。
export const speciesForms:Readonly<Record<number,EvolutionForms>>={0:woodForms,1:fireForms,2:earthForms,3:metalForms,4:lightForms,5:waterForms,6:iceForms,7:lightningForms};
export function monsterInfo(m:Monster){const s=species[m.species],forms=speciesForms[m.species];return forms?{...s,...forms[m.form??0]}:s;}
export const monsterName=(m:Monster)=>monsterInfo(m).name;
export function evolveMonster(m:Monster):{from:0|1|2;to:0|1|2}|null{
  const forms=speciesForms[m.species];if(!forms)return null;
  const from=m.form??0,to=m.level>=forms[2].level?2:m.level>=forms[1].level?1:0;
  if(to<=from)return null;
  m.form=to;return {from,to};
}
export interface StoryProgress { nodeId: string; flags: string[]; defeatedBossIds: string[] }
export interface SideQuestProgress { id:string;status:'active'|'ready'|'completed';progress:number;markers:string[] }
export interface Save { townLayoutRevision?: 2; version: 3; team: Monster[]; reserve: Monster[]; balls: number; potions: number; tonics?: number; remedies?: number; dexForms?: string[]; money: number; badge: boolean; caught: number[]; map: RuntimeMapId; x: number; y: number; steps: number; gifts: string[]; story: StoryProgress; sideQuests:SideQuestProgress[] }
export const dexEntries=species.flatMap((s,i)=>[0,1,2].map(f=>({key:`${s.id}:${f}`,species:i,form:f as 0|1|2,catalogId:speciesForms[i][f].catalogId}))).sort((a,b)=>Number(a.catalogId)-Number(b.catalogId));
export function unlockedForms(s:Save):Set<string>{
  if(s.dexForms)return new Set(s.dexForms);
  // 旧档只能推断已捕获初阶和当前持有形态，不能按等级猜测未来形态。
  return new Set([...s.caught.map(i=>`${species[i].id}:0`),...s.team.concat(s.reserve).map(m=>`${species[m.species].id}:${m.form??0}`)]);
}
export function unlockForm(s:Save,m:Monster){const known=unlockedForms(s);known.add(`${species[m.species].id}:${m.form??0}`);s.dexForms=[...known];}
export const maxHp = (m: Monster) => 24 + m.level * 5 + (m.species === 2 ? 6 : 0);
export const makeMonster = (s: number, level: number): Monster => { const m = { species: s, level, hp: 0, xp: 0 }; m.hp = maxHp(m); return m; };
export const newGame = (): Save => ({ townLayoutRevision: 2, version: 3, team: [], reserve: [], balls: 8, potions: 4, tonics:2, remedies:2, dexForms:[], money: 100, badge: false, caught: [], map: 'greenbud-town', x: 20, y: 22, steps: 0, gifts: [], story:{nodeId:'chapter-1-town',flags:[],defeatedBossIds:[]},sideQuests:[] });
export function damage(attacker: Monster, target: Monster, special: boolean, rng = Math.random): { amount: number; effective: boolean } {
  const a = species[attacker.species], b = species[target.species];
  const advantages:Record<Element,readonly Element[]>={fire:['wood','ice','metal'],earth:['fire','lightning'],water:['fire','earth'],wood:['earth','water'],metal:['earth','ice'],ice:['wood','water'],light:[],lightning:['water','metal']};
  const effective = special && advantages[a.element].includes(b.element);
  return { amount: Math.max(2, Math.floor((special ? a.power+(attacker.form??0)*2 : 9) * (0.7 + attacker.level / 15) * (effective ? 1.5 : 1) * (0.9 + rng() * 0.2))), effective };
}
export const captureChance = (m: Monster) => Math.min(0.95, 0.25 + (1 - m.hp / maxHp(m)) * 0.75);
export function gainXp(m: Monster, amount: number): boolean { m.xp += amount; let leveled = false; while (m.xp >= m.level * 12 && m.level < 30) { m.xp -= m.level * 12; m.level++; m.hp = Math.min(maxHp(m), m.hp + 7); leveled = true; } return leveled; }
export const TEAM_LIMIT=5;
// 仅旧档读取允许六人；迁移不丢弃伙伴或修改伙伴属性。
export function normalizeTeam(s:Save){if(s.team.length>TEAM_LIMIT)s.reserve.push(...s.team.splice(TEAM_LIMIT));return s;}
export function validSave(v: unknown,teamLimit=TEAM_LIMIT): v is Save {
  if (!v || typeof v !== 'object') return false;
  const s = v as Save;
  if(['tonics','remedies'].some(k=>{const n=s[k as 'tonics'|'remedies'];return n!==undefined&&(!Number.isInteger(n)||n<0);}))return false;
  if(s.dexForms!==undefined&&(!Array.isArray(s.dexForms)||s.dexForms.some(k=>!dexEntries.some(e=>e.key===k))))return false;
  const storyNodeIds=new Set<string>(campaignStory.map(node=>node.id)),bossIds=new Set<string>(campaignBosses.map(boss=>boss.id));
  const story=s.story;
  if(!story||!storyNodeIds.has(story.nodeId)||!Array.isArray(story.flags)||story.flags.some(flag=>typeof flag!=='string')||new Set(story.flags).size!==story.flags.length||!Array.isArray(story.defeatedBossIds)||story.defeatedBossIds.some(id=>!bossIds.has(id))||new Set(story.defeatedBossIds).size!==story.defeatedBossIds.length)return false;
  if(!Array.isArray(s.sideQuests)||s.sideQuests.some(quest=>!quest||!sideQuestIds.has(quest.id)||!['active','ready','completed'].includes(quest.status)||!Number.isInteger(quest.progress)||quest.progress<0||quest.progress>(sideQuestDefinitions.find(entry=>entry.id===quest.id)?.objectiveCount??-1)||!Array.isArray(quest.markers)||quest.markers.some(marker=>typeof marker!=='string')||new Set(quest.markers).size!==quest.markers.length)||new Set(s.sideQuests.map(quest=>quest.id)).size!==s.sideQuests.length)return false;
  const monster = (m: Monster) => m && Number.isInteger(m.species) && m.species >= 0 && m.species < species.length && Number.isInteger(m.level) && m.level >= 1 && m.level <= 30 && Number.isFinite(m.hp) && m.hp >= 0 && m.hp <= maxHp(m) && Number.isFinite(m.xp) && m.xp >= 0 && (m.form === undefined || (Boolean(speciesForms[m.species]) && Number.isInteger(m.form) && m.form >= 0 && m.form <= 2));
  return s.version === 3 && Array.isArray(s.team) && s.team.length <= teamLimit && s.team.every(monster) && Array.isArray(s.reserve) && s.reserve.every(monster) && ['balls','potions','money','steps'].every(k => Number.isInteger(s[k as keyof Save]) && Number(s[k as keyof Save]) >= 0) && typeof s.badge === 'boolean' && isValidMapLocation(s.map,s.x,s.y) && Array.isArray(s.caught) && s.caught.every(i => Number.isInteger(i) && i >= 0 && i < species.length) && Array.isArray(s.gifts) && s.gifts.every(g => typeof g === 'string');
}
export const SAVE_KEY = 'pocket-grove-rpg-v1';
