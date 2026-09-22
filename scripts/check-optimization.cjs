// 只运行独立无头上下文；不连接用户浏览器，也不更改主入口。
const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),out=path.resolve(__dirname,'../assets/qa/optimization');await fs.mkdir(out,{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4190/?qa=1');await page.waitForFunction(()=>window.__rpg);
 async function seed(form=2){await page.evaluate(async form=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.enemy=null;r.close();r.atTitle=false;r.save=m.newGame();r.save.team=[{...m.makeMonster(4,22),form},m.makeMonster(0,15)];r.save.caught=[4,0];r.save.team.forEach(x=>m.unlockForm(r.save,x));r.startBattle(m.makeMonster(1,30),false);Math.random=()=>.5;},form);await page.waitForTimeout(750);}
 const command=(name)=>page.getByRole('button',{name,exact:false});
 const ready=()=>page.waitForFunction(()=>!window.__rpg.battleBusy);
 await seed();
 await page.evaluate(()=>{const r=window.__rpg;r.state(r.save.team[0]).attack=2;r.state(r.save.team[0]).guard=1;r.state(r.enemy).attack=-1;r.battleView();});
 if(await page.locator('.status-icon').count()!==3)throw Error('status icons missing');
 await page.locator('.status-icon.up').click();if(await page.locator('.status-icon.up').getAttribute('aria-expanded')!=='true')throw Error('status tap');
 await page.screenshot({path:path.join(out,'status-icons.png')});await seed();
 for(const menu of ['bagMenu','journal','teamMenu']){await page.evaluate(menu=>{const r=window.__rpg;r.enemy=null;r.save.team=[];r.close();r[menu]();},menu);await page.waitForTimeout(250);const close=page.getByRole('button',{name:/关闭/}).first();if(await close.count()!==1)throw Error(`close missing ${menu}`);await page.screenshot({path:path.join(out,`${menu}-close.png`)});await close.click();if(await page.locator('.rpg-panel,.dex-book-shell').count())throw Error('close failed');}await seed();
 if(await page.locator('.battle-command').count()!==4)throw Error('main commands');
 await page.screenshot({path:path.join(out,'battle-desktop.png')});
 const hp=await page.evaluate(()=>window.__rpg.save.team[0].hp);
 await command('招式').click();await page.screenshot({path:path.join(out,'skills.png')});await command('返回').click();
 if(await page.evaluate(()=>window.__rpg.save.team[0].hp)!==hp)throw Error('submenu consumes turn');
 await command('招式').click();await command('叫声').click();await ready();
 if(await page.evaluate(()=>window.__rpg.state(window.__rpg.enemy).attack)!==-1)throw Error('weaken');
 await command('招式').click();await command('守护').click();await ready();
 if(await page.evaluate(()=>window.__rpg.state(window.__rpg.save.team[0]).guard)!==0)throw Error('guard not consumed');
 await command('道具').click();await page.screenshot({path:path.join(out,'items.png')});await command('力量药剂').click();await ready();
 const tonicState=await page.evaluate(()=>({count:window.__rpg.save.tonics,attack:window.__rpg.state(window.__rpg.save.team[0]).attack}));if(tonicState.count!==1||tonicState.attack!==1)throw Error(`tonic ${JSON.stringify(tonicState)}`);
 await page.evaluate(()=>{const r=window.__rpg;r.state(r.save.team[0]).attack=-1;});
 await command('道具').click();await command('净化药剂').click();await ready();
 if(!await page.evaluate(()=>window.__rpg.save.remedies===1&&window.__rpg.state(window.__rpg.save.team[0]).attack===0))throw Error('remedy');
 await command('道具').click();await command('药水 ×').click();await ready();
 if(await page.evaluate(()=>window.__rpg.save.potions)!==3)throw Error('potion');
 await command('更换').click();await command('返回战斗').click();
 await command('道具').click();await page.evaluate(()=>Math.random=()=>0);await command('精灵球').click();await page.waitForFunction(()=>window.__rpg.enemy===null);
 if(!await page.evaluate(()=>window.__rpg.save.team.length===3&&window.__rpg.save.balls===7))throw Error('capture');
 // 实际击败敌人触发进化，再回读存档与图鉴。
 await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.save=m.newGame();r.save.team=[m.makeMonster(1,9)];r.save.team[0].xp=107;r.save.caught=[1];m.unlockForm(r.save,r.save.team[0]);r.slotMenu('save');});await page.locator('[data-slot="0"]').click();
 await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();const e=m.makeMonster(0,1);e.hp=1;r.startBattle(e,false);});await command('招式').click();await command('撞击').click();await page.getByRole('heading',{name:'同行成长'}).waitFor();
 await page.evaluate(()=>{window.__rpg.close();window.__rpg.journal(8);});await page.waitForTimeout(300);
 if(await page.locator('[data-jump]').count()!==24)throw Error('dex entries');
 if(!await page.locator('[data-jump="8"]').getByText('双尾火狐').count())throw Error('evolved dex not unlocked');
 if(!await page.locator('[data-jump="16"]').getByText('未解锁形态').count())throw Error('future form unlocked');
 if(await page.evaluate(()=>window.__rpg.save.dexForms.length)!==2)throw Error('preview changed dex');
 await page.screenshot({path:path.join(out,'dex.png')});
 await page.reload();await page.waitForFunction(()=>window.__rpg);await page.locator('#title-continue').click();
 if(!await page.evaluate(()=>window.__rpg.save.dexForms.includes('agnite:1')))throw Error('dex reload');
 await page.evaluate(()=>{window.__rpg.close();window.__rpg.shop();});await page.locator('[data-product="tonics"]').click();await page.locator('#trade-buy').click();if(await page.evaluate(()=>window.__rpg.save.tonics)!==3)throw Error('shop tonic');
 for(const [w,h] of [[1280,800],[390,844],[844,390]]){await page.setViewportSize({width:w,height:h});await seed();for(const menu of ['main','skills','items']){await page.evaluate(menu=>{window.__rpg.battleMenu=menu;window.__rpg.battleView();},menu);await page.waitForTimeout(300);const overflow=await page.evaluate(()=>[...document.querySelectorAll('.battle-command,.battle-status,.battle-field .monster-art,.battle-actions')].map(el=>{const r=el.getBoundingClientRect(),scrollParent=el.closest('.battle-actions');const clipped=scrollParent!==el&&scrollParent&&getComputedStyle(scrollParent).overflowY==='auto';return {name:el.className,text:el.textContent?.trim().slice(0,30),left:r.left,top:r.top,right:r.right,bottom:r.bottom,clipped};}).filter(r=>!r.clipped&&(r.left< -1||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1)));if(overflow.length)throw Error(`overflow ${w} ${h} ${menu} ${JSON.stringify(overflow)}`);if(menu!=='main'){const accessible=await page.evaluate(()=>{const list=document.querySelector('.battle-actions'),last=list?.lastElementChild;if(!(list instanceof HTMLElement)||!(last instanceof HTMLElement))return false;last.scrollIntoView({block:'nearest'});const a=list.getBoundingClientRect(),b=last.getBoundingClientRect();return b.top>=a.top-1&&b.bottom<=a.bottom+1&&b.left>=a.left-1&&b.right<=a.right+1;});if(!accessible)throw Error(`submenu scroll inaccessible ${w} ${h} ${menu}`);}await page.screenshot({path:path.join(out,`${w}-${h}-${menu}.png`)});}}
 await page.setViewportSize({width:1280,height:800});
 for(const species of [0,2,3,4]){await page.evaluate(async species=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.enemy=null;r.save.team=[m.makeMonster(species,10)];r.startBattle(m.makeMonster(species,10),false);},species);await page.waitForTimeout(750);await page.screenshot({path:path.join(out,`ground-${species}.png`)});}
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS commands, submenus, skills, items, capture, evolution, independent dex, persistence, shop, 3 viewports');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
