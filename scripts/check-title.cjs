// 标题生命周期黑盒测试：独立无头页面，不触碰用户标签页或存档。
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs/promises');
const origin=(process.env.RPG_ORIGIN??'http://127.0.0.1:4190').replace(/\/$/,'');

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}});
    await page.addInitScript(()=>{window.__mediaPlayCalls=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__mediaPlayCalls.push(this.currentSrc||this.src);return play.call(this);};});
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    const output=path.resolve(__dirname,'../assets/qa/title');
    await fs.mkdir(output,{recursive:true});
    await page.goto(`${origin}/?qa=1`);
    await page.evaluate(()=>localStorage.removeItem('pocket-grove-slots-v1'));
    await page.reload();

    const assertOutsideGame=async(label)=>{
      await page.locator('.title-screen').waitFor();
      const state=await page.locator('.rpg-shell').getAttribute('data-app-state');
      const canvasCount=await page.locator('#game canvas').count();
      const runtimeVisible=await page.evaluate(()=>Boolean(window.__rpg));
      if(state!=='title'||canvasCount!==0||runtimeVisible)throw new Error(`${label}: 标题状态仍存在游戏实例 state=${state} canvas=${canvasCount} runtime=${runtimeVisible}`);
    };
    const waitForGame=async()=>{
      try{await page.waitForFunction(()=>document.querySelector('.rpg-shell')?.getAttribute('data-app-state')==='game'&&Boolean(window.__rpg));}
      catch(error){const diagnostic=await page.evaluate(()=>({state:document.querySelector('.rpg-shell')?.getAttribute('data-app-state'),overlay:document.querySelector('#rpg-overlay')?.textContent?.trim(),canvas:document.querySelectorAll('#game canvas').length,runtime:Boolean(window.__rpg)}));throw new Error(`游戏启动超时: ${JSON.stringify(diagnostic)} pageErrors=${JSON.stringify(pageErrors)} cause=${error.message}`);}
      if(await page.locator('#game canvas').count()!==1)throw new Error('启动后画布数量不为 1');
    };

    await assertOutsideGame('初次打开');
    if(!await page.locator('#title-continue').isDisabled())throw new Error('空存档时继续游戏应禁用');
    const companions=await page.locator('.title-companion .monster-art').evaluateAll(elements=>elements.map(element=>{const rect=element.getBoundingClientRect();const style=getComputedStyle(element);return {width:rect.width,height:rect.height,opacity:style.opacity,display:style.display};}));
    if(companions.length!==3||companions.some(item=>item.width<1||item.height<1||item.opacity==='0'||item.display==='none'))throw new Error(`首页伙伴不可见: ${JSON.stringify(companions)}`);
    await page.screenshot({path:path.join(output,'title.png')});

    await page.locator('#title-slots').click();
    if(await page.locator('#game canvas').count())throw new Error('打开存档管理时启动了游戏');
    if(await page.evaluate(()=>window.__mediaPlayCalls.length))throw new Error('打开存档管理时启动了音乐');
    await page.screenshot({path:path.join(output,'slots-empty.png')});
    await page.locator('#slots-back').click();
    await page.locator('#title-exit').click();
    if(await page.locator('#game canvas').count())throw new Error('结束游戏确认框启动了游戏');
    if(await page.evaluate(()=>window.__mediaPlayCalls.length))throw new Error('打开结束游戏确认框时启动了音乐');
    await page.getByRole('button',{name:'结束游戏',exact:true}).click();
    if(await page.locator('#game canvas').count())throw new Error('结束提示页仍有游戏画布');
    await page.locator('#return-title').click();
    await assertOutsideGame('结束后返回');

    await page.keyboard.press('ArrowDown');
    if(!await page.locator('#title-slots').evaluate(element=>element===document.activeElement))throw new Error('标题键盘导航失效');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await waitForGame();
    await page.evaluate(()=>{window.__rpg.close();window.__rpg.save.money=456;});
    if(!await page.evaluate(()=>window.__rpg.activeSlot===null&&JSON.parse(localStorage.getItem('pocket-grove-slots-v1')).slots.every(slot=>slot===null)))throw new Error('未保存旅程写入了存档位');

    await page.evaluate(()=>window.__rpg.returnToTitle());
    await page.getByRole('button',{name:'取消',exact:true}).click();
    if(!await page.evaluate(()=>window.__rpg.save.money===456))throw new Error('取消返回标题后丢失进度');
    if(await page.locator('.rpg-shell').getAttribute('data-app-state')!=='game')throw new Error('取消返回标题后离开了游戏状态');

    await page.evaluate(()=>window.__rpg.returnToTitle());
    await page.getByRole('button',{name:'保存并返回',exact:true}).click();
    await page.locator('[data-slot="1"]').click();
    await assertOutsideGame('保存并返回');
    if(!await page.evaluate(()=>JSON.parse(localStorage.getItem('pocket-grove-slots-v1')).slots[1].data.money===456))throw new Error('返回标题前未写入指定存档');

    await page.locator('#title-continue').click();
    await waitForGame();
    if(!await page.evaluate(()=>window.__rpg.save.money===456&&window.__rpg.activeSlot===1))throw new Error('继续游戏没有恢复最近存档');
    await page.evaluate(()=>{window.__rpg.save.money=458;window.__rpg.toggleTravelMenu();});
    await page.locator('#menu-save').click();
    if(await page.locator('[data-slot]').count())throw new Error('已有存档的再次保存仍要求选择存档位');
    if(!await page.evaluate(()=>JSON.parse(localStorage.getItem('pocket-grove-slots-v1')).slots[1].data.money===458))throw new Error('再次保存写错存档位');

    await page.evaluate(()=>window.__rpg.returnToTitle());
    await page.getByRole('button',{name:'放弃本次未保存进度',exact:true}).click();
    await assertOutsideGame('放弃并返回');
    await page.locator('#title-slots').click();
    await page.screenshot({path:path.join(output,'slots.png')});
    await page.locator('[data-delete="1"]').click();
    await page.getByRole('button',{name:'取消',exact:true}).click();
    if(!await page.locator('[data-delete="1"]').count())throw new Error('取消删除却移除了存档');
    await page.locator('[data-delete="1"]').click();
    await page.getByRole('button',{name:'确认删除',exact:true}).click();
    if(!await page.locator('[data-slot="1"]').isDisabled())throw new Error('删除后存档位仍可读取');
    await page.locator('#slots-back').click();
    await assertOutsideGame('删除存档后');

    for(const size of [{width:390,height:844},{width:800,height:450}]){
      await page.setViewportSize(size);
      await page.screenshot({path:path.join(output,`title-${size.width}.png`)});
      const visible=await page.locator('#title-exit').evaluate(element=>{const rect=element.getBoundingClientRect();return {ok:rect.width>0&&rect.height>0&&rect.top>=-1&&rect.left>=-1&&rect.right<=innerWidth+1&&rect.bottom<=innerHeight+1,rect:{top:rect.top,left:rect.left,right:rect.right,bottom:rect.bottom},viewport:{width:innerWidth,height:innerHeight}};});
      if(!visible.ok)throw new Error(`结束游戏按钮在 ${size.width}x${size.height} 不可见: ${JSON.stringify(visible)}`);
    }

    const slowPage=await browser.newPage({viewport:{width:1280,height:800}});
    let runtimeRequests=0;
    await slowPage.route(/gameRuntime[^/]*(?:\.ts|\.js)/,async route=>{runtimeRequests+=1;await new Promise(resolve=>setTimeout(resolve,900));await route.continue();});
    await slowPage.goto(`${origin}/?qa=1`);
    if(runtimeRequests!==0)throw new Error('尚未开始游戏就请求了运行时资源');
    await slowPage.locator('#title-new').click();
    await slowPage.waitForFunction(()=>document.querySelector('.rpg-shell')?.getAttribute('data-app-state')==='loading');
    const loadingState=await slowPage.locator('#game').evaluate(element=>({visibility:getComputedStyle(element).visibility,canvas:element.querySelectorAll('canvas').length,loading:Boolean(document.querySelector('.title-loading'))}));
    if(loadingState.visibility!=='hidden'||loadingState.canvas!==0||!loadingState.loading)throw new Error(`慢加载期间泄露游戏画面: ${JSON.stringify(loadingState)}`);
    await slowPage.waitForFunction(()=>document.querySelector('.rpg-shell')?.getAttribute('data-app-state')==='game'&&Boolean(window.__rpg));
    if(runtimeRequests!==1||await slowPage.locator('#game canvas').count()!==1)throw new Error(`慢加载完成后的运行时异常 requests=${runtimeRequests}`);
    await slowPage.close();
    console.log('PASS: title owns no Phaser runtime; save/end stay outside game; start/load create one runtime; return destroys it');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
