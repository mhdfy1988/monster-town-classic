// 独立浏览器上下文，不读取或覆盖玩家存档。
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({ headless: true, channel: 'chrome' });
 try{
  const out=path.resolve(__dirname,'../assets/qa/town-layout');await fs.mkdir(out,{recursive:true});
  const page=await browser.newPage({viewport:{width:1536,height:1152}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4190/?qa=town');
  await page.waitForFunction(()=>window.__rpg);
  await page.evaluate(async()=>{
   const r=window.__rpg,m=await import('/src/rpg/model.ts');
 r.close();r.save=m.newGame();r.drawWorld();r.updateHud();
   r.cameras.main.stopFollow();r.cameras.main.setScroll(0,0);
  });
  await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'town-overview.png')});
  // 真正键盘跨越四格门槛，分别覆盖关闭与开放状态。
  for(const x of [32,33,34,35]){
   for(const open of [false,true]){
    await page.evaluate(({x,open})=>{
     const r=window.__rpg;r.close();r.save.map='greenbud-town';r.save.x=x;r.save.y=4;
     r.save.story.flags=open?['forest-investigation']:[];r.drawWorld();r.updateHud();
    },{x,open});
    if(x===32){await page.waitForTimeout(120);await page.screenshot({path:path.join(out,open?'gate-open.png':'gate-closed.png')});}
    await page.keyboard.down('ArrowUp');await page.waitForTimeout(210);await page.keyboard.up('ArrowUp');await page.waitForTimeout(220);
    const state=await page.evaluate(()=>({map:window.__rpg.save.map,y:window.__rpg.save.y}));
    if(open?state.map!=='windbell-forest':state.map!=='greenbud-town'||state.y!==4)throw Error(JSON.stringify({x,open,state}));
    if(!open&&!await page.locator('.dialog-panel').innerText().then(text=>text.includes('先等一下')))throw Error('未完成委托时缺少林川提醒');
    if(!open){
      const before=await page.evaluate(()=>window.__rpg.save.steps);
      await page.keyboard.down('ArrowUp');
      if(x%2===0)await page.locator('.dialog-panel button').click();else{await page.keyboard.down('Escape');await page.waitForTimeout(50);await page.keyboard.up('Escape');}
      await page.waitForTimeout(100);
      if(!await page.evaluate(()=>window.__rpg.moving))throw Error(`退步未锁定操作 x=${x} ${JSON.stringify(await page.evaluate(()=>({y:window.__rpg.save.y,modal:window.__rpg.modal,pending:window.__rpg.retreatAfterClose})))}`);
      await page.waitForTimeout(550);
      const retreat=await page.evaluate(()=>({y:window.__rpg.save.y,steps:window.__rpg.save.steps,moving:window.__rpg.moving,modal:window.__rpg.modal,heroY:window.__rpg.hero.y}));
      if(retreat.y!==5||retreat.heroY!==190||retreat.steps!==before||retreat.moving||retreat.modal)throw Error(`退步异常 ${JSON.stringify(retreat)}`);
      await page.keyboard.up('ArrowUp');await page.waitForTimeout(80);
    }
   }
  }
  await page.setViewportSize({width:1366,height:768});
  await page.evaluate(()=>{const r=window.__rpg;r.close();r.save.map='greenbud-town';r.save.x=23;r.save.y=22;r.drawWorld();r.updateHud();});
  await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'town-player-view.png')});
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: 八次北门键盘通行检查，无运行异常；全图及玩家视角截图已保存。');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
