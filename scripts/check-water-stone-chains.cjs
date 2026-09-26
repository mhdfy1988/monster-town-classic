// 水系与土系三阶视觉验收；仅使用独立无头浏览器，不读取或覆盖用户浏览器存档。
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');

(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const output=path.resolve(__dirname,'../assets/qa/water-stone');
  await fs.mkdir(output,{recursive:true});
  await page.goto('http://127.0.0.1:4190/?qa=water-stone');
  await page.waitForFunction(()=>window.__rpg);
  await page.evaluate(async()=>{
    const r=window.__rpg,m=await import('/src/rpg/model.ts');
 r.close();r.save=m.newGame();
    r.save.team=[
      {...m.makeMonster(2,5),form:0},{...m.makeMonster(2,12),form:1},{...m.makeMonster(2,22),form:2},
      {...m.makeMonster(5,12),form:1},{...m.makeMonster(5,22),form:2},
    ];
    r.save.caught=[2,5];
    r.save.dexForms=['rockitten:0','rockitten:1','rockitten:2','rippleotter:0','rippleotter:1','rippleotter:2'];
    r.teamMenu();
  });
  await page.waitForTimeout(500);
  if(await page.locator('image[href*="/creatures-v2/forms/002.png"],image[href*="/creatures-v2/forms/010.png"],image[href*="/creatures-v2/forms/018.png"]').count()<3)throw Error('team missing earth stages');
  if(await page.locator('image[href*="/creatures-v2/forms/003.png"],image[href*="/creatures-v2/forms/011.png"],image[href*="/creatures-v2/forms/019.png"]').count()<2)throw Error('team missing water stages');
  await page.screenshot({path:path.join(output,'team.png')});

  await page.evaluate(()=>{const r=window.__rpg;r.close();r.journal(0);});
  await page.waitForTimeout(600);
  if(!await page.getByText('小岩龟',{exact:true}).count()||!await page.getByText('岩甲龟',{exact:true}).count())throw Error('dex missing earth forms');
  await page.screenshot({path:path.join(output,'dex-stone.png')});
  await page.evaluate(()=>{const r=window.__rpg;r.close();r.journal(0);});
  await page.waitForTimeout(600);
  if(!await page.getByText('水泡獭',{exact:true}).count()||!await page.getByText('浪花獭',{exact:true}).count())throw Error('dex missing water forms');
  await page.screenshot({path:path.join(output,'dex-water.png')});

  await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.enemy=null;r.save.team=[{...m.makeMonster(5,22),form:2}];r.startBattle({...m.makeMonster(2,22),form:2},false);});
  await page.waitForTimeout(700);
  if(!await page.locator('.ally-monster image[href*="/forms/019.png"]').count())throw Error('battle missing water back view');
  if(!await page.locator('.enemy-monster image[href*="/forms/018.png"]').count())throw Error('battle missing earth front view');
  const inside=await page.evaluate(()=>{const field=document.querySelector('.battle-field').getBoundingClientRect();return [...document.querySelectorAll('.battle-field .monster-art')].every(el=>{const r=el.getBoundingClientRect();return r.left>=field.left&&r.right<=field.right&&r.top>=field.top&&r.bottom<=field.bottom;});});
  if(!inside)throw Error('fighter outside battle field');
  await page.screenshot({path:path.join(output,'battle.png')});
  console.log('PASS: water and earth chains in team, dex and battle; front/back assets within field; headless only');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
