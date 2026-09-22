import { PageFlip } from 'page-flip';
import { dexEntries, unlockedForms, makeMonster, monsterInfo, elementNames, speciesForms, type Save } from './model';
import {creatureArtwork,battleIcon} from './portraitUi';

// 翻页库只负责展示；此组件不修改存档与解锁集合。
export function mountDexBook(host:HTMLElement,save:Save,start:number,onPage:(page:number)=>void,onClose:()=>void){
 const known=unlockedForms(save);
 const entries=dexEntries.map(e=>{const m={...makeMonster(e.species,1),form:e.form};return {...e,number:Number(e.catalogId),info:monsterInfo(m),known:known.has(e.key)};});
 host.innerHTML=`<div class="book-shade"><section class="dex-book-shell" aria-label="怪兽手册"><header class="book-heading"><div><small>FIELD NOTES · VOL.01</small><h2>青芽图鉴</h2></div><span>形态 ${known.size}/${entries.length}</span><button class="book-close" aria-label="关闭图鉴">×</button></header><div class="book-stage"><div class="book-paper"></div></div><nav class="book-controls" aria-label="翻页导航"><button data-prev aria-label="上一页">‹</button><button data-directory aria-expanded="false">☷ 目录</button><span class="book-counter" aria-live="polite"></span><button data-next aria-label="下一页">›</button></nav><nav class="book-directory" aria-label="图鉴目录" hidden>${entries.map((e,i)=>`<button data-jump="${i}"><small>${String(e.number).padStart(3,'0')}</small>${e.known?e.info.name:'未解锁形态'}</button>`).join('')}</nav></section></div>`;
 const shell=host.querySelector<HTMLElement>('.dex-book-shell')!,stage=host.querySelector<HTMLElement>('.book-stage')!,paper=host.querySelector<HTMLElement>('.book-paper')!;
 // 封皮跟随实际纸页尺寸，而不是铺满可用舞台；翻页库仍只管理纸页。
 const cover=document.createElement('div');cover.className='book-cover';
 paper.before(cover);cover.append(paper);
 const ribbon=document.createElement('span');ribbon.className='book-ribbon';ribbon.setAttribute('aria-hidden','true');cover.append(ribbon);
 const pages=entries.map(e=>`<article class="field-page" data-density="soft"><div class="page-content"><header><span>青芽地区 · 观察记录</span><b>No.${String(e.number).padStart(3,'0')}</b></header><div class="book-illustration ${e.known?'':'book-unknown'}">${creatureArtwork(e.species,e.form)}</div><h3>${e.known?e.info.name:'未知形态'}</h3><div class="book-element">${e.known?`${battleIcon(e.info.element)}<span>${elementNames[e.info.element]}属性</span>`:'◇ 尚未记录'}</div><p>${e.known?e.info.desc:e.form?'进化获得此形态后，这一页将留下它的故事。':'在旅途中结识这位伙伴，完成这一页记录。'}</p>${e.known?`<div class="book-skill">${battleIcon(e.info.element)}<span>${e.info.move}</span></div>`:''}<footer><span>${speciesForms[e.species]?(e.form?`Lv.${speciesForms[e.species][e.form].level} 进化`:'初始形态'):'初始形态'}</span><b>${e.number}</b><span>${e.known?'已记录':'未解锁'}</span></footer></div></article>`);
 // 偶数页收尾，避免最后一张在双页模式无法翻到。
 if(pages.length%2)pages.push('<article class="field-page"><div class="page-content book-end"><small>TO BE CONTINUED</small><h3>旅途，未完待续</h3><p>更多相遇，等待你来记录。</p><span>✦</span></div></article>');
 paper.innerHTML=pages.join('');
 let flip:PageFlip;let current=Math.min(start,pages.length-1),disposed=false;
 const render=()=>{
  if(disposed)return;
  const w=stage.clientWidth,h=stage.clientHeight,single=w<650;
  const pw=Math.floor(Math.min(single?w-44:(w-44)/2,(h-48)*.73)),ph=Math.floor(pw/.73);
  cover.style.width=`${pw*(single?1:2)}px`;cover.style.height=`${ph}px`;
  cover.classList.toggle('book-single',single);
  shell.style.setProperty('--book-width',`${pw*(single?1:2)+28}px`);
  flip=new PageFlip(paper,{width:pw,height:ph,size:'fixed',usePortrait:single,autoSize:false,startPage:current,drawShadow:true,maxShadowOpacity:.32,flippingTime:650,showCover:false,mobileScrollSupport:true,disableFlipByClick:true,useMouseEvents:true});
  flip.on('flip',e=>{current=Number(e.data);onPage(current);update();});
  flip.loadFromHTML(paper.querySelectorAll<HTMLElement>('.field-page'));update();
 };
 const update=()=>{host.querySelector('.book-counter')!.textContent=`${current+1} / ${pages.length}`;host.querySelector<HTMLButtonElement>('[data-prev]')!.disabled=current===0;host.querySelector<HTMLButtonElement>('[data-next]')!.disabled=current>=(flip.getOrientation()==='landscape'?pages.length-2:pages.length-1);};
 const move=(forward:boolean)=>{if(flip.getState()!=='read')return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){forward?flip.turnToNextPage():flip.turnToPrevPage();}else{forward?flip.flipNext('bottom'):flip.flipPrev('bottom');}};
 host.querySelector<HTMLButtonElement>('[data-prev]')!.onclick=()=>move(false);host.querySelector<HTMLButtonElement>('[data-next]')!.onclick=()=>move(true);
 const directory=host.querySelector<HTMLElement>('.book-directory')!,toggle=host.querySelector<HTMLButtonElement>('[data-directory]')!;
 toggle.onclick=()=>{directory.hidden=!directory.hidden;toggle.setAttribute('aria-expanded',String(!directory.hidden));};
 directory.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach(b=>b.onclick=()=>{flip.turnToPage(Number(b.dataset.jump));directory.hidden=true;toggle.setAttribute('aria-expanded','false');});
 host.querySelector<HTMLButtonElement>('.book-close')!.onclick=onClose;
 const keys=(e:KeyboardEvent)=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();move(e.key==='ArrowRight');}};
 shell.addEventListener('keydown',keys);render();
 // 窗口变化重新挂载，保留当前页；销毁旧实例释放触摸/鼠标监听。
 let width=stage.clientWidth,height=stage.clientHeight;
 const observer=new ResizeObserver(()=>{if(stage.clientWidth===width&&stage.clientHeight===height)return;width=stage.clientWidth;height=stage.clientHeight;const page=current;dispose();mountCleanup=mountDexBook(host,save,page,onPage,onClose);});observer.observe(stage);
 let mountCleanup:(()=>void)|undefined;
 const dispose=()=>{if(disposed)return;disposed=true;observer.disconnect();shell.removeEventListener('keydown',keys);flip.destroy();};
 host.querySelector<HTMLButtonElement>('[data-next]')!.focus();
 return ()=>{dispose();mountCleanup?.();};
}
