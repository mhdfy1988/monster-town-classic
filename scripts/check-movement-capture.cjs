// 移动与正式捕捉方案回归：仅使用无头浏览器，不接管用户当前页面。
const { chromium } = require('playwright');

const origin = process.env.RPG_ORIGIN ?? 'http://127.0.0.1:4190';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`${origin}/?qa=town`);
    await page.waitForFunction(() => window.__rpg);
    await page.evaluate(() => {
      const scene = window.__rpg;
      scene.close();
      scene.save.x = 22;
      scene.save.y = 25;
      scene.drawWorld();
    });

    await page.keyboard.down('d');
    await page.waitForTimeout(520);
    await page.keyboard.up('d');
    await page.waitForTimeout(180);
    const heldMove = await page.evaluate(() => ({ x: window.__rpg.save.x, y: window.__rpg.save.y }));
    if (heldMove.x < 25 || heldMove.y !== 25) {
      throw new Error(`长按连续移动不符合预期：${JSON.stringify(heldMove)}`);
    }

    await page.evaluate(() => {
      const scene = window.__rpg;
      scene.save.x = 22;
      scene.save.y = 25;
      scene.drawWorld();
    });
    await page.keyboard.down('d');
    await page.waitForTimeout(55);
    await page.keyboard.down('w');
    await page.waitForTimeout(45);
    await page.keyboard.up('w');
    await page.waitForTimeout(125);
    await page.keyboard.up('d');
    await page.waitForTimeout(180);
    const bufferedTurn = await page.evaluate(() => ({ x: window.__rpg.save.x, y: window.__rpg.save.y }));
    if (bufferedTurn.x < 23 || bufferedTurn.y !== 24) {
      throw new Error(`移动中转向缓冲不符合预期：${JSON.stringify(bufferedTurn)}`);
    }

    await page.goto(`${origin}/?qa=battle-fx&effect=capture-throw&fxTime=900`);
    await page.waitForFunction(() => window.__rpg);
    await page.waitForFunction(() => document.querySelectorAll('.capture-pixels i').length > 10);
    const officialCapture = await page.evaluate(() => ({
      style: document.querySelector('.battle-screen')?.getAttribute('data-capture-style'),
      particles: document.querySelectorAll('.capture-pixels i').length,
    }));
    if (officialCapture.style !== 'pixel' || officialCapture.particles < 10) {
      throw new Error(`默认捕捉方案未使用粒子版：${JSON.stringify(officialCapture)}`);
    }

    await page.goto(`${origin}/?qa=battle-fx&effect=capture-throw&captureFx=classic&fxTime=900`);
    await page.waitForFunction(() => window.__rpg);
    await page.waitForTimeout(180);
    const classicCapture = await page.evaluate(() => ({
      style: document.querySelector('.battle-screen')?.getAttribute('data-capture-style'),
      particles: document.querySelectorAll('.capture-pixels i').length,
    }));
    if (classicCapture.style !== 'classic' || classicCapture.particles !== 0) {
      throw new Error(`经典捕捉对照开关失效：${JSON.stringify(classicCapture)}`);
    }

    if (errors.length) throw new Error(errors.join('\n'));
    console.log('PASS movement: hold continuation and buffered turn; capture: pixel default and explicit classic comparison');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
