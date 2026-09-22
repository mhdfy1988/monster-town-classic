const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.goto('http://127.0.0.1:4190/?qa=1');await page.waitForFunction(()=>window.__rpg);
 await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.atTitle=false;r.save=m.newGame();r.save.team=[m.makeMonster(1,5)];r.save.team[0].hp=20;r.save.potions=4;r.bagMenu('potions');});
 await page.waitForFunction(()=>[...document.querySelectorAll('.potion-artwork')].length===2&&[...document.querySelectorAll('.potion-artwork')].every(i=>i.complete&&i.naturalWidth===1254));
 await page.screenshot({path:'assets/qa/book/potion-integrated.png'});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'assets/qa/book/potion-integrated-mobile.png'});
 console.log('PASS potion loaded in inventory thumbnail and detail at desktop/mobile');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
