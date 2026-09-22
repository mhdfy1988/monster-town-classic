// 静态部署回归：验证游戏和公共资源可在站点子路径加载。
const { chromium } = require('playwright');

const origin = (process.env.RPG_ORIGIN ?? 'http://127.0.0.1:4190').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    const failed = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => failed.push(`${request.url()} ${request.failure()?.errorText ?? ''}`));

    await page.goto(`${origin}/`);
    await page.waitForSelector('.title-screen');
    await page.waitForSelector('canvas');
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
    console.log(`PASS deployment: game loaded at ${site.pathname}; no failed or root-escaped assets`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
