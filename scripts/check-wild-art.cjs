// 仅在独立上下文验证，不使用用户存档或改变正式访问端口。
const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({ headless: true, channel: 'chrome' });
 try{
  const out=path.resolve(__dirname,'../assets/qa/wild-art');await fs.mkdir(out,{recursive:true});
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4190/?qa=wild-art');await page.waitForFunction(()=>window.__rpg);
  async function scene(map,x,y,flags=[]){
   await page.evaluate(async({map,x,y,flags})=>{
 const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.save=m.newGame();
    r.save.map=map;r.save.x=x;r.save.y=y;r.save.story.flags=flags;r.drawWorld();r.updateHud();
   },{map,x,y,flags});await page.waitForTimeout(150);
  }
  for(const [name,map,x,y] of [
   ['forest-entry','windbell-forest',24,6],
   ['forest-loop','windbell-forest',24,21],
   ['cave-entry','echo-cave',22,27],
   ['cave-beacon','echo-cave',22,11],
  ]){await scene(map,x,y,['forest-investigation','forest-route-cleared']);await page.screenshot({path:path.join(out,name+'.png')});}
  const progress=await page.evaluate(async()=>{
   const r=window.__rpg,c=await import('/src/rpg/systems/caveProgress.ts');
   const first=c.activateEchoBeacon(r.save,1),wrong=c.activateEchoBeacon(r.save,3);
   c.activateEchoBeacon(r.save,1);c.activateEchoBeacon(r.save,2);const third=c.activateEchoBeacon(r.save,3);
   const off=c.shutDownExtractor(r.save);r.save.x=22;r.save.y=7;r.drawWorld();
   return {first,wrong,third,off};
  });
  if(!progress.first.correct||progress.wrong.correct||!progress.third.complete||!progress.off)throw Error('机关状态回归失败');
  await page.waitForTimeout(150);await page.screenshot({path:path.join(out,'cave-activated.png')});
  await scene('windbell-forest',24,4,['forest-investigation','forest-route-cleared']);
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(200);await page.keyboard.up('ArrowUp');await page.waitForTimeout(180);
  if(await page.evaluate(()=>window.__rpg.save.map)!=='echo-cave')throw Error('洞口实际通行失败');
  await scene('echo-cave',22,30,['forest-investigation','forest-route-cleared']);
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(200);await page.keyboard.up('ArrowDown');await page.waitForTimeout(180);
  if(await page.evaluate(()=>window.__rpg.save.map)!=='windbell-forest')throw Error('洞穴返回失败');
  await page.setViewportSize({width:390,height:844});await scene('echo-cave',22,11);
  await page.screenshot({path:path.join(out,'cave-mobile.png')});
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: 森林/洞窟截图、双向键盘通行、音序重置与激活、设备停机；无页面错误。');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
