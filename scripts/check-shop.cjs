const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{
const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4190/?qa=1');await page.waitForFunction(()=>window.__rpg);
await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.save=m.newGame();r.save.money=100;r.save.potions=0;r.shop();});
await page.locator('[data-product="potions"]').click();await page.locator('#trade-more').click();
await page.screenshot({path:'assets/qa/book/shop.png'});await page.locator('#trade-buy').click();
if(!await page.evaluate(()=>window.__rpg.save.money===60&&window.__rpg.save.potions===4))throw Error('purchase accounting');
if(await page.locator('[data-product="potions"]').getAttribute('aria-pressed')!=='true')throw Error('selection lost');
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'assets/qa/book/shop-mobile.png'});
if(!await page.evaluate(()=>{const r=document.querySelector('.trading-post').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}))throw Error('overflow');
await page.evaluate(()=>{window.__rpg.save.money=0;window.__rpg.shop();});if(!await page.locator('#trade-buy').isDisabled())throw Error('zero money purchase');
await page.locator('#leave-shop').click();if(await page.locator('.trading-post').count())throw Error('close');
if(errors.length)throw Error(errors.join('\n'));console.log('PASS shop selection, quantity, accounting, insufficient funds, mobile, close');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
