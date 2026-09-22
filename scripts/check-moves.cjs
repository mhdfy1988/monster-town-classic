const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({ headless: true, channel: 'chrome' });try{const p=await b.newPage({viewport:{width:1280,height:800}});await p.goto('http://127.0.0.1:4190/?qa=1');await p.waitForFunction(()=>window.__rpg);
await p.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.save=m.newGame();r.save.team=[m.makeMonster(1,7)];r.teamMenu();});
const detail=await p.locator('.move-pair').innerText();for(const name of ['撞击','火花','叫声'])if(!detail.includes(name))throw Error('detail missing '+name);if(detail.includes('守护'))throw Error('unlearned guard');
await p.evaluate(async()=>{const r=window.__rpg,m=await import('/src/rpg/model.ts');r.close();r.startBattle(m.makeMonster(2,5),false);});await p.waitForTimeout(400);
if(await p.locator('.battle-command').count()!==4)throw Error('main commands');await p.getByRole('button',{name:'招式'}).click();for(const name of ['撞击','火花','叫声'])if(!(await p.locator('.battle-actions').innerText()).includes(name))throw Error('battle missing '+name);
await p.screenshot({path:'assets/qa/book/moves.png'});console.log('PASS shared learned moves and four main commands');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
