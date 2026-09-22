// 背包与商店共享同一套物品立绘。
import { assetUrl } from '../shared/assetUrl';

const supplyImages:Record<string,{file:string;name:string}>={
 balls:{file:'capture-ball-medium',name:'精灵球'},
 potions:{file:'healing-potion-medium',name:'恢复药水'},
 tonics:{file:'strength-tonic-medium',name:'力量药剂'},
 remedies:{file:'cleansing-remedy-medium',name:'净化药剂'},
};
export function supplyImage(key:string,className:string){
 const item=supplyImages[key];
 if(!item)throw new Error(`未知物品图片：${key}`);
 return `<img class="${className}" src="${assetUrl(`items-v2/${item.file}.png`)}" alt="${item.name}" width="160" height="160" />`;
}
