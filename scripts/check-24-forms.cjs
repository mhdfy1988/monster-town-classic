// 24 形态视觉契约验收；只使用独立无头浏览器，不读取或覆盖用户浏览器存档。
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');

const ids=Array.from({length:24},(_,i)=>String(i+1).padStart(3,'0'));
const formId=(species,form)=>String(form*8+[4,1,2,5,7,3,6,8][species]).padStart(3,'0');

(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{
  const output=path.resolve(__dirname,'../assets/qa/24-forms');
  await fs.mkdir(output,{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4190/?qa=24-forms');
  await page.waitForFunction(()=>window.__rpg);

  // 每个种族三阶都必须在队伍中使用各自编号图，不得回落到旧图集。
  for(let species=0;species<8;species++){
    await page.evaluate(async species=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.atTitle=false;r.save=m.newGame();r.save.team=[0,1,2].map((form,i)=>({...m.makeMonster(species,[5,12,22][i]),form}));r.teamMenu();},species);
    await page.waitForTimeout(80);
    for(let form=0;form<3;form++){
      const id=formId(species,form);
      if(!await page.locator(`.partner-roster image[href*="/forms/${id}.png"]`).count())throw Error(`team missing ${id}`);
    }
  }

  // 每个形态分别验证敌方正面、我方背面与战场边界。
  for(let species=0;species<8;species++)for(let form=0;form<3;form++){
    const id=formId(species,form);
    await page.evaluate(async({species,form})=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.enemy=null;r.atTitle=false;const mon={...m.makeMonster(species,[5,12,22][form]),form};r.save=m.newGame();r.save.team=[{...mon}];r.startBattle({...mon},false);},{species,form});
    await page.waitForTimeout(40);
    if(!await page.locator(`.enemy-monster image[href*="/forms/${id}.png"]`).count())throw Error(`enemy missing ${id}`);
    if(!await page.locator(`.ally-monster image[href*="/forms/${id}.png"]`).count())throw Error(`ally missing ${id}`);
    const inside=await page.evaluate(()=>{const f=document.querySelector('.battle-field').getBoundingClientRect();return [...document.querySelectorAll('.battle-field .monster-art')].every(el=>{const r=el.getBoundingClientRect();return r.left>=f.left-1&&r.right<=f.right+1&&r.top>=f.top-1&&r.bottom<=f.bottom+1;});});
    if(!inside)throw Error(`fighter outside field ${id}`);
  }
  await page.screenshot({path:path.join(output,'battle-024-desktop.png')});

  // 图鉴编号由 catalogId 驱动，24 页都存在且全部使用编号资源。
  await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.enemy=null;r.save=m.newGame();r.save.caught=Array.from({length:8},(_,i)=>i);r.save.dexForms=m.dexEntries.map(e=>e.key);r.journal(0);});
  await page.waitForTimeout(500);
  if(await page.locator('.field-page').count()!==24)throw Error('dex page count is not 24');
  const directory=await page.locator('.book-directory button small').allTextContents();
  if(directory.join(',')!==ids.join(','))throw Error('dex catalog order is not 001-024');
  for(const id of ids)if(!await page.locator(`.field-page image[href*="/forms/${id}.png"]`).count())throw Error(`dex missing ${id}`);
  await page.locator('[data-directory]').click();await page.locator('[data-jump="22"]').click();await page.waitForTimeout(250);
  await page.screenshot({path:path.join(output,'dex-023-024-desktop.png')});

  // 窄屏使用两种最终形态，确保战场、图鉴和队伍容器均不越出视口。
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.enemy=null;r.save=m.newGame();r.save.team=[{...m.makeMonster(7,22),form:2}];r.startBattle({...m.makeMonster(4,22),form:2},false);});
  await page.waitForTimeout(300);await page.screenshot({path:path.join(output,'battle-023-024-mobile.png')});
  if(!await page.evaluate(()=>{const f=document.querySelector('.battle-field').getBoundingClientRect();return f.left>=0&&f.right<=innerWidth&&[...document.querySelectorAll('.battle-field .monster-art')].every(el=>{const r=el.getBoundingClientRect();return r.left>=f.left-1&&r.right<=f.right+1&&r.top>=f.top-1&&r.bottom<=f.bottom+1;});}))throw Error('mobile battle overflow');
  await page.evaluate(()=>{const r=window.__rpg;r.enemy=null;r.close();r.teamMenu();});await page.waitForTimeout(150);
  if(!await page.evaluate(()=>{const r=document.querySelector('.roster-window').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}))throw Error('mobile roster overflow');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: 24 forms in team, dex 001-024, front/back battle bounds, desktop and mobile; headless only');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
