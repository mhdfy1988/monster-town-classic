import { TILE_SIZE } from '../../config';
import type { CollisionShape, MapDocument, MapTerrainCell } from './mapDocument';
import type { Box } from './greenbudTown';

export const echoCaveEncounters: readonly Box[] = [
  { x: 4, y: 13, w: 10, h: 7 },
  { x: 30, y: 13, w: 10, h: 7 },
] as const;

export const echoBeacons = [
  { index: 1 as const, x: 9, y: 22, name: '低音回声石' },
  { index: 2 as const, x: 34, y: 20, name: '中音回声石' },
  { index: 3 as const, x: 22, y: 10, name: '高音回声石' },
] as const;
export const echoExtractor = { x: 22, y: 6 } as const;
// 出口提示避开出生点、传送格和底部常驻功能栏的屏幕安全区。
export const echoCaveExitMarker = { x:18.5, y:30.2, text:'风铃森林出口 →' } as const;

const columns=44,rows=34;
const terrain:MapTerrainCell[][]=Array.from({length:rows},()=>Array<MapTerrainCell>(columns).fill(4));
function paint(kind:MapTerrainCell,box:Box){for(let y=box.y;y<box.y+box.h;y++)for(let x=box.x;x<box.x+box.w;x++)terrain[y][x]=kind;}

// 轨道从入口分成左右环路，在北侧设备前重新汇合；熔岩池不参与碰撞推断。
paint(5,{x:21,y:6,w:3,h:25});
paint(5,{x:9,y:21,w:26,h:2});
paint(5,{x:9,y:10,w:2,h:13});
paint(5,{x:33,y:10,w:2,h:13});
paint(5,{x:9,y:9,w:26,h:2});
export const echoCaveLavaAreas:readonly Box[]=[
  {x:5,y:25,w:6,h:5},{x:4,y:26,w:8,h:3},
  {x:33,y:25,w:6,h:5},{x:32,y:26,w:8,h:3},
] as const;
echoCaveLavaAreas.forEach(area=>paint(6,area));

export const echoCaveRockAreas:readonly Box[]=[
  {x:0,y:0,w:44,h:2},{x:0,y:32,w:21,h:2},{x:24,y:32,w:20,h:2},{x:0,y:0,w:2,h:34},{x:42,y:0,w:2,h:34},
  // 中央岩柱和两侧岩台采用阶梯轮廓，避免大矩形地块的拼贴感。
  {x:17,y:12,w:10,h:1},{x:16,y:13,w:12,h:2},{x:15,y:15,w:14,h:3},{x:16,y:18,w:12,h:2},{x:18,y:20,w:8,h:1},
  {x:4,y:7,w:9,h:1},{x:3,y:8,w:11,h:1},{x:5,y:9,w:7,h:1},
  {x:31,y:7,w:9,h:1},{x:30,y:8,w:11,h:1},{x:32,y:9,w:7,h:1},
] as const;

const collisionShapes:CollisionShape[]=[
  ...echoCaveRockAreas.map((area,index)=>({id:`rock-${String(index+1).padStart(2,'0')}`,shape:'rectangle' as const,x:area.x*TILE_SIZE,y:area.y*TILE_SIZE,width:area.w*TILE_SIZE,height:area.h*TILE_SIZE})),
  ...echoCaveLavaAreas.map((area,index)=>({id:`lava-${String(index+1).padStart(2,'0')}`,shape:'rectangle' as const,x:area.x*TILE_SIZE,y:area.y*TILE_SIZE,width:area.w*TILE_SIZE,height:area.h*TILE_SIZE})),
  ...echoBeacons.map(beacon=>({id:`echo-beacon-${beacon.index}`,shape:'rectangle' as const,x:beacon.x*TILE_SIZE,y:beacon.y*TILE_SIZE,width:TILE_SIZE,height:TILE_SIZE})),
  {id:'echo-extractor',shape:'rectangle',x:echoExtractor.x*TILE_SIZE,y:echoExtractor.y*TILE_SIZE,width:TILE_SIZE,height:TILE_SIZE},
];

export const echoCaveDocument:MapDocument={
  format:'monster-town-map',version:3,id:'echo-cave',name:'回声洞穴',revision:1,
  createdAt:'2026-09-19T00:00:00.000Z',updatedAt:'2026-09-19T00:00:00.000Z',
  tileSize:TILE_SIZE,columns,rows,spawn:{x:22,y:30},terrain,collisionShapes,
};
