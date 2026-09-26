// 木系三阶独立无头验收，不读取或覆盖用户浏览器存档。
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');

(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const output=path.resolve(__dirname,'../assets/qa/leaf-chain');
  await fs.mkdir(output,{recursive:true});
 await page.goto('http://127.0.0.1:4190/?qa=runtime');
  await page.waitForFunction(()=>window.__rpg);
  await page.evaluate(async()=>{
    const r=window.__rpg,m=await import('/src/rpg/model.ts');
 r.close();r.save=m.newGame();r.save.caught=[0];
    r.save.team=[0,1,2].map((form,i)=>({...m.makeMonster(0,[5,12,22][i]),form}));
    r.save.dexForms=['budaye:0','budaye:1','budaye:2'];r.teamMenu();
  });
  await page.waitForTimeout(400);
  if(await page.locator('image[href*="/forms/004.png"],image[href*="/forms/012.png"],image[href*="/forms/020.png"]').count()<3)throw Error('team does not use three wood stages');
  await page.screenshot({path:path.join(output,'team.png')});
  await page.evaluate(()=>{const r=window.__rpg;r.close();r.journal(0);});
  await page.waitForTimeout(500);
  if(!await page.getByText('叶芽鹿',{exact:true}).count()||!await page.getByText('绿角鹿',{exact:true}).count())throw Error('dex missing wood forms');
  await page.screenshot({path:path.join(output,'dex-1.png')});
  await page.locator('[data-next]').click();await page.waitForTimeout(750);
  if(!await page.getByText('古树鹿',{exact:true}).count())throw Error('dex final form missing');
  await page.screenshot({path:path.join(output,'dex-2.png')});
  await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.enemy=null;r.save.team=[{...m.makeMonster(0,22),form:2}];r.startBattle(m.makeMonster(1,18),false);});
  await page.waitForTimeout(500);
  if(!await page.locator('.ally-monster image[href*="/forms/020.png"]').count())throw Error('battle does not use wood back view');
  if(!await page.evaluate(()=>{const field=document.querySelector('.battle-field').getBoundingClientRect(),art=document.querySelector('.ally-monster .monster-art').getBoundingClientRect();return art.left>=field.left&&art.right<=field.right&&art.top>=field.top&&art.bottom<=field.bottom;}))throw Error('leaf fighter outside field');
  await page.screenshot({path:path.join(output,'battle.png')});
  console.log('PASS: leaf chain team, three dex entries, battle front/back and field bounds; headless only');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
