const {chromium}=require('playwright');const fs=require('node:fs/promises'),path=require('node:path');
async function checkCover(page){
 const valid=await page.evaluate(()=>{
  const cover=document.querySelector('.book-cover').getBoundingClientRect(),paper=document.querySelector('.book-paper').getBoundingClientRect();
  return cover.left>=0&&cover.right<=innerWidth&&cover.bottom<=innerHeight&&Math.abs(cover.width-paper.width-30)<2&&Math.abs(cover.height-paper.height-31)<2;
 });
 if(!valid)throw Error('book cover must fit paper and viewport');
}
(async()=>{const browser=await chromium.launch({ headless: true, channel: 'chrome' });try{const page=await browser.newPage({viewport:{width:1280,height:800}}),out=path.resolve(__dirname,'../assets/qa/book');await fs.mkdir(out,{recursive:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4190/?qa=runtime');await page.waitForFunction(()=>window.__rpg);await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.save=m.newGame();r.save.team=[m.makeMonster(1,10)];r.save.caught=[1];m.unlockForm(r.save,r.save.team[0]);r.journal();});await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'open.png')});
await checkCover(page);const first=await page.locator('.book-counter').textContent();await page.locator('[data-next]').click();await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'turning.png')});await page.waitForTimeout(600);if(await page.locator('.book-counter').textContent()===first)throw Error('not flipping');
await page.locator('[data-directory]').click();await page.locator('[data-jump="6"]').click();await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'last.png')});
const before=await page.locator('.book-counter').textContent();await page.locator('.book-close').click();await page.evaluate(()=>window.__rpg.journal());await page.waitForTimeout(200);if(await page.locator('.book-counter').textContent()!==before)throw Error('page not restored');
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await page.locator('[data-directory]').click();await page.locator('[data-jump="1"]').click();await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'mobile.png')});
await checkCover(page);if(!await page.evaluate(()=>{const r=document.querySelector('.book-stage').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}))throw Error('overflow');
if(!await page.evaluate(()=>window.__rpg.save.dexForms.length===1))throw Error('preview unlocked');await page.locator('.book-close').click();if(await page.locator('.dex-book-shell').count())throw Error('close');if(errors.length)throw Error(errors.join('\n'));console.log('PASS flip, directory, page restore, resize, mobile, no unlock mutations, close');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
