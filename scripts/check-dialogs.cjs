// 使用 NODE_PATH 指向本机已有 Playwright。仅启动无头浏览器，不连接用户浏览器。
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs/promises');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const output = path.resolve(__dirname, '../assets/qa/dialogs');
    await fs.mkdir(output, { recursive: true });
 await page.goto('http://127.0.0.1:4190/?qa=runtime');
    await page.waitForFunction(() => window.__rpg);
    for (const name of ['bag', 'shop', 'team', 'journal', 'dialog']) {
      await page.evaluate(async (name) => {
        const rpg = window.__rpg;
        const m = await import('/src/rpg/model.ts');
        rpg.close(); rpg.save.team = [m.makeMonster(0, 5), m.makeMonster(2, 4)];
        rpg.save.caught = [0,2];
        if (name === 'bag') rpg.bagMenu();
        if (name === 'shop') rpg.shop();
        if (name === 'team') rpg.teamMenu();
        if (name === 'journal') rpg.journal();
        if (name === 'dialog') rpg.dialog('青禾博士', '新的伙伴正在等待与你相遇。沿着林间小路继续前行吧。');
      }, name);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(output, `${name}.png`) });
      const valid = await page.evaluate(() => {
        const r = document.querySelector('.rpg-panel,.dex-book-shell').getBoundingClientRect();
        return r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
      });
      if (!valid) throw new Error(`${name}: panel outside viewport`);
    }
    await page.evaluate(()=>{const r=window.__rpg;r.close();r.save.team[0].hp=1;r.save.potions=2;r.bagMenu('potions');});
    await page.locator('#use-item').click();
    await page.locator('[data-heal-target="0"]').click();
    await page.locator('#confirm-heal').click();
    if(!await page.evaluate(()=>window.__rpg.save.potions===1&&window.__rpg.save.team[0].hp===26))throw new Error('potion use failed');
    await page.evaluate(()=>{window.__rpg.close();window.__rpg.shop();window.__rpg.save.money=100;window.__rpg.shop();});
    const before=await page.evaluate(()=>window.__rpg.save.balls);
    await page.locator('#trade-buy').click();
    if(!await page.evaluate(before=>window.__rpg.save.money===70&&window.__rpg.save.balls===before+3,before))throw new Error('purchase failed');
    await page.setViewportSize({ width: 390, height: 844 });
    for(const name of ['bagMenu','shop','journal','teamMenu']){
    await page.evaluate(name => { window.__rpg.close(); window.__rpg[name](); },name);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(output, `${name}-mobile.png`) });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('mobile overflow');
    if(await page.evaluate(()=>{const p=document.querySelector('.rpg-panel,.dex-book-shell');return p.scrollWidth>p.clientWidth+1;}))throw new Error(`${name}: panel horizontal overflow`);
    }
    console.log('PASS: panels, mobile layouts, purchase and potion; headless only');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
