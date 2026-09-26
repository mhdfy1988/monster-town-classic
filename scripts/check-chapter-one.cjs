// 第一章纵向回归：只启动无头浏览器，不接管用户当前浏览器。
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

(async()=>{
  const browser=await chromium.launch({ headless: true, channel: 'chrome' });
  try{
    const output=path.resolve(__dirname,'../assets/qa/chapter-one');
    await fs.mkdir(output,{recursive:true});
    const page=await browser.newPage({viewport:{width:1366,height:768}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4190/?qa=chapter-one');
    await page.waitForFunction(()=>window.__rpg);
    await page.evaluate(async()=>{
      const r=window.__rpg,m=await import('/src/rpg/model.ts');
 r.close();r.save=m.newGame();r.save.team=[m.makeMonster(1,30),m.makeMonster(0,12)];
      r.save.caught=[0,1];r.save.badge=true;r.save.story.flags=['ranger-pass','forest-route-cleared'];r.save.story.nodeId='chapter-1-wild';
      r.save.map='windbell-forest';r.save.x=24;r.save.y=3;r.enterCell();
    });
    await page.waitForTimeout(250);
    const cave=await page.evaluate(()=>({map:window.__rpg.save.map,x:window.__rpg.save.x,y:window.__rpg.save.y,node:window.__rpg.save.story.nodeId,name:document.querySelector('#location-name')?.textContent}));
    if(cave.map!=='echo-cave'||cave.x!==22||cave.y!==30||cave.node!=='chapter-1-dungeon'||cave.name!=='回声洞穴')throw Error(`洞穴入口状态错误：${JSON.stringify(cave)}`);
    await page.screenshot({path:path.join(output,'echo-cave-intro.png')});
    await page.locator('.dialog-panel button').click();await page.waitForTimeout(120);
    await page.screenshot({path:path.join(output,'echo-cave-entry-desktop.png')});

    const sequence=await page.evaluate(async()=>{
      const r=window.__rpg,c=await import('/src/rpg/systems/caveProgress.ts');
      const first=c.activateEchoBeacon(r.save,1),wrong=c.activateEchoBeacon(r.save,3),again=c.activateEchoBeacon(r.save,1),second=c.activateEchoBeacon(r.save,2),third=c.activateEchoBeacon(r.save,3);
      r.save.x=22;r.save.y=11;r.drawWorld();r.updateHud();
      return {first,wrong,again,second,third,progress:c.echoSequenceProgress(r.save)};
    });
    if(!sequence.first.correct||sequence.wrong.correct||!sequence.third.complete||sequence.progress!==3)throw Error(`回声音序异常：${JSON.stringify(sequence)}`);
    await page.waitForTimeout(150);await page.screenshot({path:path.join(output,'echo-cave-beacons-desktop.png')});

    await page.evaluate(async()=>{
      const r=window.__rpg,c=await import('/src/rpg/systems/caveProgress.ts');
      if(!c.shutDownExtractor(r.save))throw Error('完整音序后仍无法关闭设备');
      r.save.x=22;r.save.y=7;r.drawWorld();r.updateHud();
    });
    await page.waitForTimeout(150);await page.screenshot({path:path.join(output,'echo-cave-extractor-off.png')});
    await page.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.startBattle({...m.makeMonster(2,18),form:2,hp:1},'boss');});
    await page.waitForTimeout(250);
    if(await page.getByRole('button',{name:'逃跑'}).isEnabled())throw Error('首领战仍可逃跑');
    await page.getByRole('button',{name:'道具'}).click();
    const items=await page.locator('.battle-actions').innerText();if(items.includes('捕捉球'))throw Error('首领战仍显示捕捉球');
    await page.getByRole('button',{name:'返回'}).click();
    await page.screenshot({path:path.join(output,'magma-tortoise-boss-desktop.png')});
    await page.evaluate(()=>window.__rpg.turn('attack'));
    await page.waitForTimeout(1100);
    const bossResult=await page.evaluate(()=>({node:window.__rpg.save.story.nodeId,flags:window.__rpg.save.story.flags,bosses:window.__rpg.save.story.defeatedBossIds,text:document.querySelector('#rpg-overlay')?.textContent}));
    if(bossResult.node!=='chapter-1-boss'||!bossResult.flags.includes('magma-tortoise-calmed')||bossResult.flags.includes('chapter-1-complete')||!bossResult.bosses.includes('magma-tortoise')||!bossResult.text.includes('返回青芽镇'))throw Error(`首领结算状态错误：${JSON.stringify(bossResult)}`);
    await page.locator('.result-next').click();await page.waitForTimeout(80);await page.locator('.result-next').click();await page.waitForTimeout(80);
    await page.evaluate(()=>{const r=window.__rpg;r.save.map='greenbud-town';r.save.x=26;r.save.y=22;r.facing={x:0,y:-1,frame:3};r.drawWorld();r.interact();});
    await page.getByRole('button',{name:'领取河湾镇通行证'}).click();await page.waitForTimeout(120);
    const result=await page.evaluate(()=>({node:window.__rpg.save.story.nodeId,flags:window.__rpg.save.story.flags,bosses:window.__rpg.save.story.defeatedBossIds,text:document.querySelector('#rpg-overlay')?.textContent}));
    if(result.node!=='chapter-2-town'||!result.flags.includes('chapter-1-complete')||!result.flags.includes('riverbend-pass')||!result.bosses.includes('magma-tortoise')||!result.text.includes('第一章完成'))throw Error(`返镇结算状态错误：${JSON.stringify(result)}`);
    await page.screenshot({path:path.join(output,'chapter-one-result-desktop.png')});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
    const bounds=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,scrollHeight:document.documentElement.scrollHeight,height:innerHeight}));
    if(bounds.scrollWidth>bounds.width+1||bounds.scrollHeight>bounds.height+1)throw Error(`窄屏发生页面级溢出：${JSON.stringify(bounds)}`);
    await page.screenshot({path:path.join(output,'chapter-one-result-mobile.png')});
    await page.evaluate(()=>{const r=window.__rpg;r.close();r.save.map='echo-cave';r.save.x=22;r.save.y=31;r.enterCell();});
    const returned=await page.evaluate(()=>({map:window.__rpg.save.map,x:window.__rpg.save.x,y:window.__rpg.save.y}));
    if(returned.map!=='windbell-forest'||returned.x!==24||returned.y!==4)throw Error(`洞穴返回路线错误：${JSON.stringify(returned)}`);
    if(errors.length)throw Error(errors.join('\n'));
    console.log(`PASS chapter one: forest -> cave, echo reset/order, extractor, boss rules/victory, return route, desktop/mobile; result=${JSON.stringify(result)}`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
