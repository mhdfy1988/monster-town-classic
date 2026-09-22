// 独立物件母版的内容边界。世界坐标、碰撞和剧情仍由地图内容定义。
export const environmentFrames = {
  entrance: { x:21,y:69,w:394,h:329 },
  cliff: { x:441,y:65,w:388,h:333 },
  boulder: { x:863,y:113,w:357,h:281 },
  log: { x:30,y:512,w:387,h:245 },
  moss: { x:486,y:505,w:302,h:263 },
  cart: { x:878,y:511,w:326,h:257 },
  crystalLit: { x:74,y:853,w:298,h:337 },
  crystal: { x:490,y:861,w:281,h:332 },
  extractor: { x:874,y:847,w:331,h:329 },
} as const;
export type EnvironmentProp = keyof typeof environmentFrames;

export interface CliffSegment {
  x:number;
  tiles:number;
  flip:boolean;
  yOffset:number;
  tint:number;
}

// 将长岩沿拆成宽窄、朝向和色调不同的确定性片段；同一地图每次绘制保持一致。
export function cliffSegments(start:number,length:number,row:number):CliffSegment[]{
  const widths=[2,3,4,3] as const,offsets=[-2,1,0,3] as const,tints=[0x899399,0x7f8b90,0x929b96,0x858f91] as const;
  const result:CliffSegment[]=[];
  let x=start,remaining=length,index=0;
  while(remaining>0){
    const seed=Math.abs(start*7+row*11+index*5);
    let tiles=Math.min(remaining,widths[seed%widths.length]);
    if(remaining-tiles===1&&tiles>2)tiles--;
    result.push({x,tiles,flip:seed%2===1,yOffset:offsets[seed%offsets.length],tint:tints[seed%tints.length]});
    x+=tiles;remaining-=tiles;index++;
  }
  return result;
}
