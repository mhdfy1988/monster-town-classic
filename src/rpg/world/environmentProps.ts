import Phaser from 'phaser';
import { environmentFrames, type EnvironmentProp } from '../content/environmentArt';

// 统一底部中心锚点和独立地面接触影，避免把源图透明留白当作物件脚底。
export function environmentProp(scene:Phaser.Scene,objects:Phaser.GameObjects.GameObject[],kind:EnvironmentProp,
  x:number,y:number,width:number,depth=y,tint=0xffffff,shadow=true){
  const frame=environmentFrames[kind],texture=scene.textures.get('forest-cave');
  if(!texture.has(kind))texture.add(kind,0,frame.x,frame.y,frame.w,frame.h);
  if(shadow){
    const g=scene.add.graphics().setDepth(5);objects.push(g);
    g.fillStyle(0x102b29,.16);g.fillEllipse(x+width*.10,y+3,width*.90,width*.20);
    g.fillStyle(0x142721,.22);g.fillEllipse(x,y-1,width*.63,width*.10);
  }
  const image=scene.add.image(x,y,'forest-cave',kind).setOrigin(.5,1).setDisplaySize(width,width*frame.h/frame.w).setDepth(depth).setTint(tint);
  objects.push(image);return image;
}
