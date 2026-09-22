import Phaser from 'phaser';
import { environmentProp } from './environmentProps';
import { cliffSegments } from '../content/environmentArt';
import type { Save } from '../model';
import { npcs, roads, townGate, townBuildings, townPond, trees, wildZones, type Box } from '../content/maps/greenbudTown';
import { mapDefinition } from '../content/maps/mapRegistry';
import { windbellForestDocument, windbellForestTrees, windbellForestNpcs, windbellMossClues } from '../content/maps/windbellForest';
import { echoBeacons, echoCaveDocument, echoCaveExitMarker, echoCaveRockAreas, echoExtractor } from '../content/maps/echoCave';

export interface WorldRenderResult {
  hero: Phaser.GameObjects.Sprite;
  objects: Phaser.GameObjects.GameObject[];
}

export function renderWorld(scene: Phaser.Scene, save: Save, previousObjects: Phaser.GameObjects.GameObject[], previousHero?: Phaser.GameObjects.Sprite): WorldRenderResult {
  previousObjects.forEach(object => object.destroy());
  previousHero?.destroy();
  const objects: Phaser.GameObjects.GameObject[] = [];

  const sprite = (key:string,sx:number,sy:number,sw:number,sh:number,x:number,y:number,depth=0) => {
    const frame=`${sx},${sy},${sw},${sh}`;
    const texture=scene.textures.get(key);
    if(!texture.has(frame))texture.add(frame,0,sx,sy,sw,sh);
    const image=scene.add.image(x,y,key,frame).setOrigin(0).setScale(2).setDepth(depth);
    objects.push(image);
    return image;
  };
  const label = (x:number,y:number,text:string) => {
    const value=scene.add.text(x,y,text,{fontFamily:'Microsoft YaHei',fontSize:'13px',color:'#fff8dc',backgroundColor:'#294c48e8',padding:{x:9,y:5}}).setOrigin(.5).setDepth(2500);
    objects.push(value);
  };
  const nine = (box:Box,sx:number,sy:number,key='core_outdoor',depth=1) => {
    for(let y=0;y<box.h;y++)for(let x=0;x<box.w;x++){
      const tx=x===0?0:x===box.w-1?2:1,ty=y===0?0:y===box.h-1?2:1;
      sprite(key,sx+tx*16,sy+ty*16,16,16,(box.x+x)*32,(box.y+y)*32,depth);
    }
  };
  const buildingShadow = (x:number,y:number,w:number,h:number) => {
    const graphics=scene.add.graphics().setDepth(5);
    graphics.fillStyle(0x243d40,.18);
    graphics.fillPoints([{x:x+8,y:y+h-12},{x:x+w-4,y:y+h-12},{x:x+w+42,y:y+h+15},{x:x+35,y:y+h+15}],true);
    graphics.fillStyle(0x203b35,.19);graphics.fillRect(x+4,y+h-8,w-8,12);
    objects.push(graphics);
  };
  const townNorthGate = () => {
    // 镇口只使用外框；阴影独立落在地面，不给透明图框添加发光式描边。
    const left=townGate.x*32,baseline=(townGate.y+1)*32,depth=baseline+30;
    const shadow=scene.add.graphics().setDepth(5);objects.push(shadow);
    shadow.fillStyle(0x203b35,.20);
    // 两根立柱向右后方投影，顶梁投影连接其远端。
    for(const x of [left-44,left+134])shadow.fillPoints([
      {x,y:baseline+9},{x:x+30,y:baseline+9},
      {x:x+65,y:baseline+30},{x:x+36,y:baseline+30},
    ],true);
    shadow.fillPoints([{x:left-8,y:baseline+24},{x:left+179,y:baseline+24},
      {x:left+194,y:baseline+37},{x:left+7,y:baseline+37}],true);
    shadow.fillStyle(0x19382f,.32);
    for(const x of [left-44,left+134]){
      shadow.fillRect(x+2,baseline+8,32,8);
      shadow.fillRect(x+6,baseline+16,24,3);
    }
    sprite('forest-gate',70,48,1180,758,left-48,0,depth).setDisplaySize(226,145);
  };

  if(save.map==='greenbud-town'){
    scene.cameras.main.setBackgroundColor('#74ac80');
    for(let y=0;y<36;y++)for(let x=0;x<48;x++)sprite('core_outdoor',16,48,16,16,x*32,y*32);
    const path=new Set<string>();roads.forEach(r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)path.add(`${x},${y}`);});
    // 四象限独立取边，凹角补回草地，避免 T 形路口出现整格接缝。
    const corners=scene.add.graphics().setDepth(2);objects.push(corners);
    for(const cell of path){const [x,y]=cell.split(',').map(Number);for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
      const qx=dx<0?0:8,qy=dy<0?0:8;
      const cx=path.has(`${x+dx},${y}`)?1:dx<0?0:2;
      const cy=path.has(`${x},${y+dy}`)?1:dy<0?0:2;
      sprite('core_outdoor',80+cx*16+qx,48+cy*16+qy,8,8,x*32+qx*2,y*32+qy*2,1);
      if(cx===1&&cy===1&&!path.has(`${x+dx},${y+dy}`)){
        const px=x*32+(dx<0?0:28),py=y*32+(dy<0?0:28);
        corners.fillStyle(0x75b477,1);corners.fillRect(px,py,4,4);
      }
    }}
    for(let y=townPond.y;y<townPond.y+townPond.h;y++)for(let x=townPond.x;x<townPond.x+townPond.w;x++)sprite('core_outdoor_water',0,0,16,16,x*32,y*32,1);
    nine(townPond,256,240,'core_outdoor',2);
    wildZones.forEach(r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)sprite('grass',0,0,16,16,x*32,y*32,2);});
    for(const tree of trees)sprite('core_outdoor_nature',768,0,32,48,tree.x*32,(tree.y-2)*32,tree.y*32+28);
    townNorthGate();
    for(const b of townBuildings){
      buildingShadow(b.x*32,b.y*32,b.w*32,b.h*32);
      sprite('core_buildings',b.sx,b.sy,80,64,b.x*32,b.y*32,(b.y+b.h)*32-4);
      label((b.x+b.w/2)*32,(b.y-.6)*32,b.name);
    }
    for(const [i,p] of [{x:6,y:18},{x:8,y:20},{x:16,y:7},{x:25,y:12},{x:39,y:23},{x:43,y:24},{x:8,y:30}].entries())sprite('core_outdoor',96+(i%2)*16,16,16,16,p.x*32,p.y*32,3);
    for(const bed of [{x:10,y:23},{x:24,y:15},{x:27,y:24},{x:18,y:27},{x:26,y:27},{x:19,y:31},{x:24,y:31}])for(let i=0;i<3;i++)sprite('core_outdoor_nature',960,0,16,16,(bed.x+i)*32,bed.y*32,4);
    sprite('core_outdoor',480,536,32,24,19*32,28*32,30*32);
    sprite('core_outdoor',480,536,32,24,26*32,28*32,30*32);
    for(const npc of npcs){
      const key=npc.id==='guide'?'guide':npc.id==='healer'?'nurse':npc.id==='ranger'?'ranger':npc.id==='mayor'?'mayor':'merchant';
      const character=scene.add.sprite(npc.x*32+16,npc.y*32+30,key,1).setOrigin(.5,1).setDepth(npc.y*32+31);
      objects.push(character);
      const quest=save.sideQuests.find(entry=>entry.id===(npc.id==='guide'?'dim-glow-moss':'lost-surveyor'));
      const marker=save.story.flags.includes('forest-investigation')&&(npc.id==='guide'||npc.id==='ranger')&&(!quest||quest.status==='ready'||(npc.id==='ranger'&&quest.progress===1))?'！':'';
      label(npc.x*32+16,npc.y*32-46,marker+(npc.id==='guide'?'小夏':npc.id==='healer'?'治疗':npc.id==='ranger'?'林川':npc.id==='mayor'?'镇长':'商店'));
    }
    scene.cameras.main.setBounds(0,0,48*32,36*32);
  }else if(save.map==='greenbud-lab'){
    scene.cameras.main.setBackgroundColor('#182e30');
    for(let y=5;y<=21;y++)for(let x=11;x<=28;x++)sprite('core_indoor_floors',x===11||x===28?32:16,32,16,16,x*32,y*32);
    for(let x=11;x<=28;x++)sprite('core_indoor_floors',32,0,16,16,x*32,5*32,2);
    for(let x=14;x<=25;x++)sprite('core_set pieces',320,80,16,32,x*32,8*32,10*32);
    sprite('core_set pieces',0,112,48,32,13*32,6*32,9*32);sprite('core_set pieces',240,0,32,32,23*32,6*32,9*32);sprite('core_set pieces',128,48,32,32,25*32,11*32,13*32);
    sprite('core_indoor_floors',416,0,48,48,19*32,14*32,1);sprite('core_set pieces',128,48,32,32,12*32,11*32,13*32);sprite('core_set pieces',16,112,32,32,12*32,17*32,19*32);sprite('core_set pieces',16,112,32,32,26*32,17*32,19*32);
    const professor=scene.add.sprite(20*32+16,11*32+30,'professor',1).setOrigin(.5,1).setDepth(383);objects.push(professor);
    label(20*32+16,11*32-46,'青禾博士');label(20.5*32,20.5*32,'↓ 返回青芽镇');
    scene.cameras.main.setBounds(0,0,1280,800);
  }else if(save.map==='windbell-forest'){
    scene.cameras.main.setBackgroundColor('#557d62');
    const terrain=windbellForestDocument.terrain;
    for(let y=0;y<windbellForestDocument.rows;y++)for(let x=0;x<windbellForestDocument.columns;x++){
      const kind=terrain[y][x];
      if(kind===2)sprite('core_outdoor_water',0,0,16,16,x*32,y*32,1);
      else if(kind===1){
        for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
          const qx=dx<0?0:8,qy=dy<0?0:8;
          const cx=terrain[y]?.[x+dx]===1?1:dx<0?0:2,cy=terrain[y+dy]?.[x]===1?1:dy<0?0:2;
          sprite('core_outdoor',80+cx*16+qx,48+cy*16+qy,8,8,x*32+qx*2,y*32+qy*2,1);
        }
      }
      else sprite('core_outdoor',16,48,16,16,x*32,y*32,0);
    }
    mapDefinition(save.map).encounterZones.forEach(area=>{for(let y=area.y;y<area.y+area.h;y++)for(let x=area.x;x<area.x+area.w;x++)if(terrain[y][x]!==1)sprite('grass',0,0,16,16,x*32,y*32,2);});
    nine({x:37,y:5,w:6,h:7},256,240,'core_outdoor',2);
    // 装饰随林缘、池畔和岔路成组布置，避免公式产生对角线条纹。
    for(const p of [{x:7,y:18},{x:9,y:19},{x:12,y:19},{x:18,y:17},{x:28,y:17},
      {x:29,y:18},{x:37,y:12},{x:40,y:12},{x:42,y:14},{x:20,y:28},{x:28,y:30}]){
      environmentProp(scene,objects,'moss',p.x*32+16,p.y*32+28,26,p.y*32+29,0xa3bd83);
    }
    for(const tree of windbellForestTrees){
      if(tree.y===2&&tree.x>=22&&tree.x<=26)continue;
      if(tree.x===12&&tree.y===20)environmentProp(scene,objects,'log',tree.x*32+32,tree.y*32+29,82);
      else if(tree.x===29&&tree.y===17)environmentProp(scene,objects,'boulder',tree.x*32+32,tree.y*32+29,76);
      else{
        const shadow=scene.add.graphics().setDepth(4);objects.push(shadow);
        shadow.fillStyle(0x244538,.20);shadow.fillEllipse(tree.x*32+42,tree.y*32+27,66,22);
        sprite('core_outdoor_nature',768,0,32,48,tree.x*32,(tree.y-2)*32,tree.y*32+28);
      }
    }
    environmentProp(scene,objects,'entrance',24.5*32,4*32,152,130);
    if(!save.story.flags.includes('forest-route-cleared'))environmentProp(scene,objects,'boulder',24.5*32,4*32,64,131);
    for(const clue of windbellMossClues){
      environmentProp(scene,objects,'moss',clue.x*32+16,clue.y*32+30,42);
    }
    for(const npc of windbellForestNpcs){
      const character=scene.add.sprite(npc.x*32+16,npc.y*32+30,npc.sprite,1).setOrigin(.5,1).setDepth(npc.y*32+31);objects.push(character);
      const survey=save.sideQuests.find(entry=>entry.id==='lost-surveyor');
      label(npc.x*32+16,npc.y*32-46,npc.id==='surveyor'&&survey?.status==='active'&&survey.progress===0?'！阿陆':npc.id==='surveyor'?'阿陆':'白砾');
    }
    label(24.5*32,5*32,save.story.flags.includes('forest-route-cleared')?'回声洞穴':'回声洞穴 · 落石封路');label(24.5*32,34.5*32,'↓ 青芽镇');
    scene.cameras.main.setBounds(0,0,windbellForestDocument.columns*32,windbellForestDocument.rows*32);
  }else{
    scene.cameras.main.setBackgroundColor('#171d22');
    const terrain=echoCaveDocument.terrain;

    const rails=scene.add.graphics().setDepth(3);objects.push(rails);
    const material=(quadrant:number,x:number,y:number,depth:number,tint=0xffffff)=>{
      const sx=(quadrant%2)*627+(x%4)*156,sy=Math.floor(quadrant/2)*627+(y%4)*156;
      sprite('cavern-materials',sx,sy,156,156,x*32,y*32,depth).setDisplaySize(32,32).setTint(tint);
    };
    for(let y=0;y<echoCaveDocument.rows;y++)for(let x=0;x<echoCaveDocument.columns;x++){
      const kind=terrain[y][x];
      material(kind===6?2:0,x,y,0,kind===6?0xd7b09a:0x8c9699);
    }
    // 轨道沿明确的线路连续铺设，纵向路段不再画成横向小梯子。
    const railSegment=(ax:number,ay:number,bx:number,by:number)=>{
      const vertical=ax===bx,x1=ax*32,y1=ay*32,x2=bx*32,y2=by*32;
      rails.lineStyle(5,0x222625,1);
      for(const offset of [-8,8])rails.lineBetween(x1+(vertical?offset:0),y1+(vertical?0:offset),x2+(vertical?offset:0),y2+(vertical?0:offset));
      rails.lineStyle(4,0x715f48,1);
      for(let p=0;p<=Math.abs(x2-x1)+Math.abs(y2-y1);p+=16){
        const x=x1+(vertical?0:p),y=y1+(vertical?p:0);
        rails.lineBetween(x-(vertical?13:0),y-(vertical?0:13),x+(vertical?13:0),y+(vertical?0:13));
      }
      rails.lineStyle(2,0x969280,.8);
      for(const offset of [-8,8])rails.lineBetween(x1+(vertical?offset:0),y1+(vertical?0:offset),x2+(vertical?offset:0),y2+(vertical?0:offset));
    };
    railSegment(22.5,7,22.5,31);railSegment(10,10,34,10);railSegment(10,22,34,22);
    railSegment(10,10,10,22);railSegment(34,10,34,22);
      // 先合并重叠区域，再只在真正外露的下沿绘制岩壁，避免内部接缝和重复积木感。
      const rockCells=new Set<string>();
      for(const area of echoCaveRockAreas)for(let row=0;row<area.h;row++)for(let col=0;col<area.w;col++)rockCells.add(`${area.x+col},${area.y+row}`);
      for(const cell of rockCells){
        const [x,y]=cell.split(',').map(Number);
        material(1,x,y,6,0x777f80);
      }
      for(let y=0;y<echoCaveDocument.rows-1;y++){
        let x=0;
        while(x<echoCaveDocument.columns){
          if(!rockCells.has(`${x},${y}`)||rockCells.has(`${x},${y+1}`)){x++;continue;}
          const start=x;
          while(x<echoCaveDocument.columns&&rockCells.has(`${x},${y}`)&&!rockCells.has(`${x},${y+1}`))x++;
          const length=x-start;
          for(const segment of cliffSegments(start,length,y)){
            const width=segment.tiles*32+18;
            const px=(segment.x+segment.tiles/2)*32,py=(y+1)*32+segment.yOffset;
            environmentProp(scene,objects,'cliff',px,py,width,py+5,segment.tint,false).setFlipX(segment.flip);
          }
          const shade=scene.add.graphics().setDepth(5);objects.push(shade);
          shade.fillStyle(0x0e1720,.30);shade.fillRect(start*32,(y+1)*32,length*32,8);
        }
      }
    const activated=['echo-tone-1','echo-tone-2','echo-tone-3'].filter(flag=>save.story.flags.includes(flag)).length;
    for(const beacon of echoBeacons){
      const lit=activated>=beacon.index;
      const glow=scene.add.graphics().setDepth(4);objects.push(glow);
      if(lit){glow.fillStyle(0x48cebd,.12);glow.fillEllipse(beacon.x*32+16,beacon.y*32+24,78,30);}
      environmentProp(scene,objects,lit?'crystalLit':'crystal',beacon.x*32+16,beacon.y*32+30,42);
      label(beacon.x*32+16,beacon.y*32-34,`${beacon.index} · ${beacon.name}`);
    }
    const extractorOff=save.story.flags.includes('extractor-off');
    environmentProp(scene,objects,'extractor',echoExtractor.x*32+16,echoExtractor.y*32+30,64,echoExtractor.y*32+30,extractorOff?0x70858a:0xffffff);
    label(echoExtractor.x*32+16,echoExtractor.y*32-48,extractorOff?'导能设备 · 已关闭':'导能设备 · 过热');
    // 废矿车位于既有岩壁内部，不额外占用可通行道路。
    environmentProp(scene,objects,'cart',16*32,20*32,62,20*32+6,0xb4b9ae);

    label(echoCaveExitMarker.x*32,echoCaveExitMarker.y*32,echoCaveExitMarker.text);
    scene.cameras.main.setBounds(0,0,echoCaveDocument.columns*32,echoCaveDocument.rows*32);
  }
  const hero=scene.add.sprite(save.x*32+16,save.y*32+30,'hero',1).setOrigin(.5,1).setDepth(save.y*32+31);
  scene.cameras.main.startFollow(hero,false,1,1);scene.cameras.main.roundPixels=true;
  return {hero,objects};
}
