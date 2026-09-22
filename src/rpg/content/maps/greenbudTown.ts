export interface Box { x:number;y:number;w:number;h:number }
export interface NpcPlacement { id:'guide'|'healer'|'ranger'|'shop'|'mayor';x:number;y:number;name:string }

export const townGate={x:32,y:3,w:4,h:1,approachX:34,approachY:3} as const;
export const townRescue={x:12,y:22} as const;
export const townBuildings=[
  {x:18,y:11,w:5,h:4,sx:160,sy:80,name:'青芽研究所'},
  {x:10,y:16,w:5,h:4,sx:320,sy:80,name:'伙伴驿站'},
  {x:27,y:15,w:5,h:4,sx:0,sy:144,name:'林间杂货铺'},
] as const;
export const townPond:Box={x:36,y:25,w:8,h:6};

// 南路终止于休憩花园；北门是唯一野外出口。
export const roads:readonly Box[]=[
  {x:17,y:20,w:12,h:4},
  {x:22,y:24,w:3,h:4},
  {x:19,y:28,w:9,h:3},
  {x:32,y:3,w:4,h:21},
  {x:28,y:21,w:4,h:3},
  {x:28,y:19,w:3,h:2},
  {x:19,y:15,w:3,h:5},
  {x:12,y:20,w:5,h:3},
];
export const wildZones:readonly Box[]=[{x:28,y:26,w:7,h:6},{x:38,y:10,w:6,h:8},{x:14,y:6,w:5,h:4}];
const northTrees=Array.from({length:24},(_,index)=>({x:index*2,y:3})).filter(tree=>tree.x<30||tree.x>36);
export const trees=[...northTrees,...Array.from({length:24},(_,index)=>({x:index*2,y:35})),...Array.from({length:15},(_,index)=>({x:1,y:5+index*2})),...Array.from({length:15},(_,index)=>({x:46,y:5+index*2})),{x:5,y:12},{x:13,y:12},{x:16,y:9},{x:26,y:12},{x:28,y:13},{x:25,y:17},{x:5,y:28},{x:8,y:29},{x:12,y:31},{x:16,y:29},{x:30,y:33},{x:37,y:32},{x:40,y:31},{x:44,y:24}] as const;
export const npcs:readonly NpcPlacement[]=[{id:'guide',x:19,y:23,name:'向导 · 小夏'},{id:'healer',x:12,y:21,name:'护理员 · 阿澄'},{id:'ranger',x:31,y:7,name:'巡林员 · 林川'},{id:'shop',x:29,y:20,name:'旅行商人'},{id:'mayor',x:26,y:21,name:'青芽镇镇长'}];
export const solidAreas:readonly Box[]=[{x:0,y:0,w:48,h:3},{x:0,y:34,w:48,h:2},{x:0,y:0,w:2,h:36},{x:46,y:0,w:2,h:36},...townBuildings,townPond,{x:31,y:3,w:1,h:1},{x:36,y:3,w:1,h:1},...trees.map(tree=>({x:tree.x,y:tree.y,w:2,h:1}))];

export const inBox=(x:number,y:number,box:Box)=>x>=box.x&&y>=box.y&&x<box.x+box.w&&y<box.y+box.h;
export const isTownBlocked=(x:number,y:number)=>x<0||y<0||x>=48||y>=36||solidAreas.some(area=>inBox(x,y,area));
