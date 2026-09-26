// 独立无头验收，不读取或覆盖用户浏览器存档。
const {chromium}=require('playwright');const path=require('node:path');const fs=require('node:fs/promises');
(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{
const page=await browser.newPage({viewport:{width:1280,height:800}}),output=path.resolve(__dirname,'../assets/qa/evolution');await fs.mkdir(output,{recursive:true});
 await page.goto('http://127.0.0.1:4190/?qa=runtime');await page.waitForFunction(()=>window.__rpg);
for(let form=0;form<3;form++){
 await page.evaluate(async form=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.enemy=null;r.save=m.newGame();r.save.team=[{...m.makeMonster(1,[5,12,22][form]),form}];r.save.caught=[1];r.startBattle({...r.save.team[0]},false);await Promise.all(['001','009','017'].map(id=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=`/assets/creatures-v2/forms/${id}.png`;})));},form);
 await page.waitForTimeout(800);await page.screenshot({path:path.join(output,`battle-stage-${form+1}.png`)});
 if(!await page.evaluate(()=>{const field=document.querySelector('.battle-field').getBoundingClientRect();return [...document.querySelectorAll('.battle-field .monster-art')].every(el=>{const r=el.getBoundingClientRect();return r.left>=field.left&&r.right<=field.right&&r.top>=field.top&&r.bottom<=field.bottom;});}))throw new Error('fighter outside field');
}
await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.enemy=null;r.save.team=[m.makeMonster(1,9)];r.save.team[0].xp=107;r.close();r.slotMenu('save');});await page.locator('[data-slot="0"]').click();
await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();const enemy=m.makeMonster(0,1);enemy.hp=1;r.startBattle(enemy,false);});
await page.locator('.battle-command').first().click();await page.locator('.battle-command').first().click();await page.getByRole('heading',{name:'伙伴进化'}).waitFor();await page.waitForTimeout(250);
await page.screenshot({path:path.join(output,'evolution.png')});
if(!await page.evaluate(()=>{const r=window.__rpg,s=JSON.parse(localStorage.getItem('pocket-grove-slots-v1'));return r.save.team[0].form===1&&s.slots[0].data.team[0].form===1;}))throw new Error('evolution not saved');
await page.reload();await page.waitForFunction(()=>window.__rpg);await page.locator('#title-continue').click();
if(!await page.evaluate(()=>window.__rpg.save.team[0].form===1))throw new Error('evolution reload');
await page.evaluate(()=>{window.__rpg.close();window.__rpg.teamMenu();});await page.waitForTimeout(250);await page.screenshot({path:path.join(output,'team.png')});
await page.evaluate(()=>{window.__rpg.close();window.__rpg.journal(16);});await page.waitForTimeout(500);
if(!await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');return !m.unlockedForms(r.save).has('agnite:2');}))throw new Error('future dex form unlocked');
if(!await page.locator('.field-page').filter({hasText:'No.017'}).getByText('未知形态',{exact:true}).count())throw new Error('future dex page not hidden');
if(!await page.evaluate(()=>window.__rpg.save.caught.length===1))throw new Error('dex preview altered capture records');
await page.waitForTimeout(500);await page.screenshot({path:path.join(output,'journal.png')});
await page.setViewportSize({width:390,height:844});await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.save.team=[{...m.makeMonster(1,22),form:2}];r.startBattle({...r.save.team[0]},false);});await page.waitForTimeout(800);await page.screenshot({path:path.join(output,'battle-mobile.png')});
console.log('PASS: 3 full-body stages, battle victory evolution, slot persistence, reload, team, mobile; headless only');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
