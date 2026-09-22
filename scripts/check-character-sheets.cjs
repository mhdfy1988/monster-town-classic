const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4190/?qa=characters-v2');
    await page.waitForFunction(() => window.__rpg);
    const result = await page.evaluate(() => {
      const scene = window.__rpg;
scene.save.map = 'greenbud-town';
      scene.save.x = 31;
      scene.save.y = 10;
      scene.drawWorld();
      scene.cameras.main.centerOn(32 * 32, 10 * 32);
      const hero = scene.textures.get('hero').getSourceImage();
      const ranger = scene.textures.get('ranger').getSourceImage();
      return {
        hero: [hero.width, hero.height],
        ranger: [ranger.width, ranger.height],
        heroDisplay: [scene.hero.displayWidth, scene.hero.displayHeight],
      };
    });
    if (String(result.hero) !== '144,256' || String(result.ranger) !== '144,256') throw new Error(`图表尺寸错误：${JSON.stringify(result)}`);
    if (String(result.heroDisplay) !== '48,64') throw new Error(`玩家显示尺寸错误：${result.heroDisplay}`);
    await page.waitForTimeout(200);
    await page.locator('canvas').screenshot({ path: 'assets/qa/book/characters-v2-town.png' });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('PASS character sheets 144x256, frames 48x64, town render');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
