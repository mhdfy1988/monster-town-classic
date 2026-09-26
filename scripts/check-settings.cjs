const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4190/?qa=runtime');await page.waitForFunction(()=>window.__rpg);
 await page.evaluate(()=>{const r=window.__rpg;r.close();});
 await page.locator('#menu-toggle').click();
 for(const selector of ['#menu-music','#menu-sfx']){
  const before=await page.locator(selector).getAttribute('aria-checked');
  await page.locator(selector).click();
  if(await page.locator(selector).getAttribute('aria-checked')===before)throw Error(`${selector} did not toggle`);
  await page.locator(selector).click();
  if(await page.locator(selector).getAttribute('aria-checked')!==before)throw Error(`${selector} did not restore`);
 }
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'assets/qa/book/settings.png'});
 await page.setViewportSize({width:390,height:844});
 await page.locator('.settings-help summary').click();
 await page.screenshot({path:'assets/qa/book/settings-mobile.png'});
 if(!await page.locator('#travel-menu').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}))throw Error('settings overflow');
 await page.locator('#menu-save').click();
 if(await page.locator('#travel-menu').isVisible())throw Error('settings overlays save');
 if(!await page.locator('#rpg-overlay').textContent())throw Error('save dialog missing');
 await page.evaluate(()=>{const r=window.__rpg;r.close();r.toggleTravelMenu();});
 await page.locator('#menu-title').click();
 if(!(await page.locator('#rpg-overlay').textContent()).includes('保存并返回'))throw Error('exit confirmation missing');
 await page.evaluate(()=>{const r=window.__rpg;r.close();r.toggleTravelMenu();});
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>document.getElementById('travel-menu').hidden);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS settings audio, save entry, title confirmation, Esc and mobile bounds');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
