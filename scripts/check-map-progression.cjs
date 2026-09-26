// 使用 NODE_PATH 指向本机已有 Playwright。仅启动无头浏览器，不连接用户浏览器。
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

(async()=>{
  const browser=await chromium.launch({ headless: true, channel: 'chrome' });
  try{
    const output=path.resolve(__dirname,'../assets/qa/maps');
    await fs.mkdir(output,{recursive:true});
    const page=await browser.newPage({viewport:{width:1366,height:768}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4190/?qa=map-progression');
    await page.waitForFunction(()=>window.__rpg);
    const locked=await page.evaluate(async()=>{
      const r=window.__rpg,m=await import('/src/rpg/model.ts'),i=await import('/src/rpg/content/interactions.ts');
 r.close();r.save=m.newGame();r.save.team=[m.makeMonster(1,8)];r.save.x=34;r.save.y=3;r.drawWorld();r.updateHud();
      return i.mapTransitionAt(r.save);
    });
    if(locked!==null)throw new Error('未取得通行标记时北门不应开放');
    await page.evaluate(()=>{const r=window.__rpg;r.save.badge=true;r.save.story.flags=['ranger-pass','forest-investigation'];r.save.story.nodeId='chapter-1-wild';r.enterCell();});
    await page.waitForTimeout(350);
    const forest=await page.evaluate(()=>({map:window.__rpg.save.map,x:window.__rpg.save.x,y:window.__rpg.save.y,name:document.querySelector('#location-name')?.textContent}));
    if(forest.map!=='windbell-forest'||forest.x!==24||forest.y!==33||forest.name!=='风铃森林')throw new Error(`进入风铃森林失败：${JSON.stringify(forest)}`);
    await page.screenshot({path:path.join(output,'windbell-forest-intro.png')});
    await page.locator('.dialog-panel button').click();await page.waitForTimeout(150);
    await page.screenshot({path:path.join(output,'windbell-forest-desktop.png')});
    await page.evaluate(()=>{const r=window.__rpg;r.save.x=24;r.save.y=19;r.drawWorld();});await page.waitForTimeout(100);
    await page.screenshot({path:path.join(output,'windbell-forest-center.png')});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
    await page.screenshot({path:path.join(output,'windbell-forest-mobile.png')});
    const returned=await page.evaluate(()=>{const r=window.__rpg;r.save.x=24;r.save.y=34;r.enterCell();return {map:r.save.map,x:r.save.x,y:r.save.y};});
    if(returned.map!=='greenbud-town'||returned.x!==34||returned.y!==5)throw new Error(`返回青芽镇失败：${JSON.stringify(returned)}`);
    if(errors.length)throw new Error(errors.join('\n'));
    console.log(`PASS locked gate, town -> forest -> town, desktop/mobile screenshots; forest=${JSON.stringify(forest)}`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
