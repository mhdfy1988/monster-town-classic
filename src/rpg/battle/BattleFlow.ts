import { townRescue } from '../content/maps/greenbudTown';
import { awardTeamExperience, type BattleGrowth } from '../battleProgress';
import { combatDamage, skills, useCombatItem } from '../combat';
import { captureChance, maxHp, monsterInfo, monsterName, TEAM_LIMIT, unlockForm, type Save } from '../model';
import type { BattleSession } from './BattleSession';
import { addStoryFlag, markBossDefeated } from '../systems/storyProgress';
import { captureShakeCount, type BattleFeedback } from './battleFeedback';

export type BattleAction='attack'|'special'|'capture'|'potion'|'tonic'|'remedy'|'weaken'|'guard';

export interface BattleFlowHooks {
  render(): void;
  pauseLog(text:string,feedback?:BattleFeedback): Promise<void>;
  finish(text:string,growth?:BattleGrowth[]): void;
  returnToTownAfterDefeat(): void;
}

export class BattleFlow {
  private readonly getSave:()=>Save;
  private readonly session:BattleSession;
  private readonly hooks:BattleFlowHooks;
  private readonly random:()=>number;
  constructor(getSave:()=>Save,session:BattleSession,hooks:BattleFlowHooks,random=()=>Math.random()){this.getSave=getSave;this.session=session;this.hooks=hooks;this.random=random;}

  async turn(action:BattleAction){
    const save=this.getSave(),enemy=this.session.enemy;if(!enemy)return;
    if(['attack','special','weaken','guard'].includes(action)&&!skills(save.team[0]).some(move=>move.id===action))return;
    if(this.session.busy)return;this.session.busy=true;this.session.menu='main';const ally=save.team[0];
    if(action==='capture'){
      if(this.session.kind!=='wild'||!save.balls){this.session.busy=false;this.session.log=this.session.boss?'熔岩巨龟正处于失控状态，捕捉球无法使用。':this.session.trainer?'这是林川的伙伴，不能捕捉。':'捕捉球用完了，回镇补给吧。';this.hooks.render();return;}
      save.balls--;await this.hooks.pauseLog('你掷出了捕捉球！',{kind:'capture',phase:'throw'});
      const chance=captureChance(enemy),roll=this.random(),captured=roll<chance,shakes=captureShakeCount(roll,chance,captured);
      for(let shake=1;shake<=shakes;shake++)await this.hooks.pauseLog(shake===1?'……摇了一下。':shake===2?'……又摇了一下。':'……最后一下。',{kind:'capture',phase:'shake',shake:shake as 1|2|3});
      if(captured){await this.hooks.pauseLog('咔哒！捕捉球锁定了。',{kind:'capture',phase:'success'});const caught={...enemy};if(save.team.length<TEAM_LIMIT)save.team.push(caught);else save.reserve.push(caught);if(!save.caught.includes(caught.species))save.caught.push(caught.species);unlockForm(save,caught);this.hooks.finish(`捕捉成功！${monsterName(caught)} ${save.team.includes(caught)?'加入了队伍':'进入了收容箱'}。`);return;}
      await this.hooks.pauseLog(`${monsterName(enemy)} 挣脱了捕捉球！`,{kind:'capture',phase:'break'});
    }else if(action==='potion'||action==='tonic'||action==='remedy'){
      const message=useCombatItem(save,ally,this.session.state(ally),action);
      if(!message){this.session.busy=false;this.session.log='道具不足或当前无法使用，未消耗道具与回合。';this.session.menu='items';this.hooks.render();return;}
      await this.hooks.pauseLog(message,action==='potion'?{kind:'heal',target:'ally'}:{kind:'buff',target:'ally',tone:action==='tonic'?'attack':'cleanse'});
    }else if(action==='weaken'||action==='guard'){
      if(action==='weaken'){this.session.state(enemy).attack=Math.max(-2,this.session.state(enemy).attack-1);await this.hooks.pauseLog('叫声！敌方攻击降低一层。',{kind:'debuff',target:'enemy'});}
      else{this.session.state(ally).guard=1;await this.hooks.pauseLog('守护！下一次受击减伤 50%。',{kind:'buff',target:'ally',tone:'guard'});}
    }else{
      const hit=combatDamage(ally,enemy,action==='special',this.session.state(ally),this.session.state(enemy),this.random);this.session.state(enemy).guard=0;enemy.hp=Math.max(0,enemy.hp-hit.amount);
      await this.hooks.pauseLog(`${monsterName(ally)} 使用${action==='special'?monsterInfo(ally).move:'撞击'}，造成 ${hit.amount} 伤害！${hit.effective?' 效果拔群！':''}`,{kind:'attack',actor:'ally',element:action==='special'?monsterInfo(ally).element:'normal',amount:hit.amount,effective:hit.effective});
      if(!enemy.hp){
        const reward=this.session.boss?180:this.session.trainer?85:30+enemy.level*3,growth=awardTeamExperience(save.team,reward);
        save.money+=this.session.boss?250:this.session.trainer?100:18;
        if(this.session.trainer){save.badge=true;addStoryFlag(save,'ranger-pass');}
        if(this.session.boss){markBossDefeated(save,'magma-tortoise');addStoryFlag(save,'magma-tortoise-calmed');}
        this.hooks.finish(this.session.boss?'熔岩巨龟恢复了平静 · 获得 250 金币 · 返回青芽镇报告调查结果':this.session.trainer?'挑战成功 · 获得青芽徽章与 100 金币 · 回研究所领取正式委托':'战斗胜利 · 获得 18 金币',growth);return;
      }
    }
    await this.enemyTurn();
  }

  async enemyTurn(){
    const save=this.getSave(),enemy=this.session.enemy;if(!enemy)return;const ally=save.team[0];
    const available=skills(enemy),move=available[Math.floor(this.random()*available.length)];
    if(move.id==='weaken'){this.session.state(ally).attack=Math.max(-2,this.session.state(ally).attack-1);await this.hooks.pauseLog(`${monsterName(enemy)} 使用叫声，我方攻击降低一层。`,{kind:'debuff',target:'ally'});}
    else if(move.id==='guard'){this.session.state(enemy).guard=1;await this.hooks.pauseLog(`${monsterName(enemy)} 使用守护。`,{kind:'buff',target:'enemy',tone:'guard'});}
    else{const hit=combatDamage(enemy,ally,move.id==='special',this.session.state(enemy),this.session.state(ally),this.random);this.session.state(ally).guard=0;ally.hp=Math.max(0,ally.hp-hit.amount);await this.hooks.pauseLog(`${monsterName(enemy)} 使用${move.name}，造成 ${hit.amount} 伤害。`,{kind:'attack',actor:'enemy',element:move.id==='special'?monsterInfo(enemy).element:'normal',amount:hit.amount,effective:hit.effective});}
    if(!ally.hp){const next=save.team.findIndex(monster=>monster.hp>0);if(next<0){save.team.forEach(monster=>monster.hp=maxHp(monster));save.map='greenbud-town';save.x=townRescue.x;save.y=townRescue.y;this.hooks.returnToTownAfterDefeat();this.hooks.finish('伙伴们已经精疲力尽。阿澄把你们带回驿站，免费恢复了体力。');return;}[save.team[0],save.team[next]]=[save.team[next],save.team[0]];await this.hooks.pauseLog(`${monsterName(ally)} 暂时无法战斗。${monsterName(save.team[0])} 接替出战！`,{kind:'switch',target:'ally'});}
    this.session.busy=false;this.session.log=`${monsterName(save.team[0])} 正等待你的指令。`;this.hooks.render();
  }
}
