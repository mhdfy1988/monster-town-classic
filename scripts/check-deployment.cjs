// 静态部署回归：验证游戏和公共资源可在站点子路径加载。
const { chromium } = require('playwright');

const origin = (process.env.RPG_ORIGIN ?? 'http://127.0.0.1:4190').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    const failed = [];
    const mediaPlayCalls = [];
    let runtimeRequests = 0;
    await page.addInitScript(() => {
      window.__deploymentMediaPlayCalls = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        window.__deploymentMediaPlayCalls.push(this.currentSrc || this.src);
        return play.call(this);
      };
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => failed.push(`${request.url()} ${request.failure()?.errorText ?? ''}`));
    page.on('request', request => { if (/gameRuntime[^/]*\.(?:ts|js)/.test(request.url())) runtimeRequests += 1; });

    await page.goto(`${origin}/`);
    await page.waitForSelector('.title-screen');
    if (await page.locator('#game canvas').count()) throw new Error('标题页提前创建了游戏画布');
    if (runtimeRequests) throw new Error('标题页提前请求了游戏运行包');

    await page.locator('#title-slots').click();
    if (await page.locator('#game canvas').count()) throw new Error('存档管理启动了游戏画布');
    await page.locator('#slots-back').click();
    await page.locator('#title-exit').click();
    await page.getByRole('button', { name: '取消', exact: true }).click();
    mediaPlayCalls.push(...await page.evaluate(() => window.__deploymentMediaPlayCalls));
    if (mediaPlayCalls.length) throw new Error(`标题功能启动了音乐：${mediaPlayCalls.join(', ')}`);

    await page.locator('#title-new').click();
    await page.waitForFunction(() => document.querySelector('.rpg-shell')?.getAttribute('data-app-state') === 'game');
    await page.waitForSelector('#game canvas');
    if (runtimeRequests !== 1) throw new Error(`游戏运行包请求次数异常：${runtimeRequests}`);
    await page.waitForTimeout(300);
    const gameResources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));

    if (errors.length) throw new Error(`页面异常：${errors.join('\n')}`);
    if (failed.length) throw new Error(`资源加载失败：${failed.join('\n')}`);
    const site = new URL(`${origin}/`);
    const escaped = gameResources.filter(url => {
      const resource = new URL(url);
      return resource.origin === site.origin && resource.pathname.startsWith('/assets/');
    });
    if (site.pathname !== '/' && escaped.length) {
      throw new Error(`资源逃逸到站点根路径：${escaped.join(', ')}`);
    }
    console.log(`PASS deployment: title stayed outside runtime; game loaded on demand at ${site.pathname}; no failed or root-escaped assets`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
