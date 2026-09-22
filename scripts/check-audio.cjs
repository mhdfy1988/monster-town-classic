const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = process.env.RPG_AUDIO_QA_URL || 'http://127.0.0.1:4191/';
const outputDir = path.resolve(__dirname, '..', 'assets', 'qa', 'audio');
fs.mkdirSync(outputDir, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const audioResponses = [];
  const errors = [];
  page.on('response', response => {
    if (/\.(?:ogg|wav)(?:$|\?)/.test(response.url())) audioResponses.push({ url: response.url(), status: response.status() });
  });
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(`${baseUrl}?qa=town`, { waitUntil: 'networkidle' });
  await page.mouse.click(680, 380);
  await page.click('#menu-toggle');
  await page.waitForSelector('#travel-menu:not([hidden])');
  await page.locator('#menu-music-volume').fill('65');
  await page.locator('#menu-sfx-volume').fill('55');
  await page.screenshot({ path: path.join(outputDir, 'settings-desktop.png'), fullPage: true });

  const settings = await page.evaluate(() => ({
    music: (document.querySelector('#menu-music-volume')).value,
    sfx: (document.querySelector('#menu-sfx-volume')).value,
    stored: JSON.parse(localStorage.getItem('pocket-grove-audio-v1')),
  }));
  if (settings.music !== '65' || settings.sfx !== '55') throw new Error(`设置面板未同步音量：${JSON.stringify(settings)}`);
  if (settings.stored.musicVolume !== 0.65 || settings.stored.sfxVolume !== 0.55) throw new Error(`声音偏好未持久化：${JSON.stringify(settings.stored)}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(outputDir, 'settings-mobile.png'), fullPage: true });
  const mobileBounds = await page.locator('#travel-menu').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  if (mobileBounds.left < 0 || mobileBounds.right > mobileBounds.viewportWidth || mobileBounds.top < 0 || mobileBounds.bottom > mobileBounds.viewportHeight) {
    throw new Error(`窄屏设置面板越界：${JSON.stringify(mobileBounds)}`);
  }

  await page.goto(`${baseUrl}?qa=battle-fx`, { waitUntil: 'networkidle' });
  await page.mouse.click(680, 380);
  await page.evaluate(() => {
    const scene = window.__rpg;
    scene.battleEffect({ kind: 'capture', phase: 'throw' });
    scene.battleEffect({ kind: 'capture', phase: 'shake', shake: 1 });
    scene.battleEffect({ kind: 'capture', phase: 'success' });
    scene.battleEffect({ kind: 'attack', actor: 'ally', element: 'fire', amount: 10 });
    scene.audio.playSfx('level-up');
  });
  await page.waitForTimeout(1000);

  const expected = [
    'greenbud-town-day-v1.ogg',
    'wild-battle-v1.ogg',
    'capture-throw-v1.wav',
    'capture-shake-v1.wav',
    'capture-success-v1.wav',
    'hit-normal-v1.wav',
    'level-up-v1.wav',
  ];
  for (const file of expected) {
    const response = audioResponses.find(item => item.url.includes(file));
    if (!response) throw new Error(`浏览器未请求音频：${file}`);
    if (![200, 206].includes(response.status)) throw new Error(`音频请求失败：${file} HTTP ${response.status}`);
  }
  if (errors.length) throw new Error(`浏览器错误：${errors.join(' | ')}`);
  console.log(`PASS audio: ${expected.length} files requested successfully; preferences persisted; settings screenshot saved`);
  await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
