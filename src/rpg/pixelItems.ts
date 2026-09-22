import { supplyImage } from './supplyImages';
// 物品使用统一立绘；金币与预览图保留像素图元。
export function pixelItem(key:string){
 if(['balls','potions','tonics','remedies'].includes(key))return supplyImage(key,'potion-artwork');
 const ink='#354638',cream='#f6e7b5';
 const rect=(x:number,y:number,w:number,h:number,color:string)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
 const path=(d:string,color:string)=>`<path d="${d}" fill="${color}"/>`;
 let art=rect(9,29,15,1,'#a9ad82')+rect(6,28,20,1,'#a9ad82');
 if(key==='coin'){
  art=path('M11 3H21V5H25V9H27V23H25V27H21V29H11V27H7V23H5V9H7V5H11Z','#765735')+path('M11 3H20V5H24V9H26V21H24V25H20V27H11V25H7V21H5V9H7V5H11Z','#c49141')+path('M11 5H20V7H23V10H24V20H22V23H19V25H11V23H8V20H7V10H9V7H11Z','#f0cb68')+path('M11 7H19V9H22V12H10V21H8V10H11Z','#fff0a0')+path('M14 10H18V12H20V15H18V20H14V18H12V15H14Z','#b78235')+rect(15,11,2,7,'#ffe29a');
 }else if(key==='balls'){
  art+=path('M11 4H21V6H25V10H28V22H25V26H21V28H11V26H7V22H4V10H7V6H11Z',ink)+path('M11 6H21V8H24V11H26V17H6V11H8V8H11Z','#d66e46')+path('M10 7H20V9H12V11H9V14H6V11H8V9H10Z','#f5a36a')+rect(11,7,6,2,cream)+rect(8,10,3,3,cream)+path('M22 10H24V13H26V18H21V16H23Z','#994f3b')+path('M6 18H26V21H24V24H20V26H12V24H8V21H6Z','#e4d5a6')+path('M24 19H26V21H24V24H20V26H12V24H20V22H23V19Z','#a39b78')+rect(5,16,22,3,ink)+rect(12,14,8,8,ink)+rect(14,15,4,6,cream)+rect(13,16,6,4,cream)+rect(14,16,3,2,'#fff6d5');
 }else{
  const colors=key==='tonics'?['#f6d17c','#d09245','#93593b']:key==='remedies'?['#bce8df','#69b2b4','#3c757f']:['#c8e6b1','#79b48a','#426f57'];
  art+=path('M11 3H21V5H22V9H20V14H22V16H24V19H26V26H24V28H8V26H6V19H8V16H10V14H12V9H10V5H11Z',ink)+path('M14 9H18V15H20V17H22V20H24V25H22V26H10V25H8V20H10V17H12V15H14Z','#9cbb9e')+path('M14 10H17V15H15V18H12V21H9V19H11V17H13V15H14Z','#e2efca')+path('M9 21H23V25H21V26H11V25H9Z',colors[1])+rect(10,20,12,2,colors[0])+rect(21,22,2,3,colors[2])+rect(11,22,2,3,'#f2f5cb')+rect(11,4,10,4,'#b59152')+rect(12,4,8,2,'#f0d38b')+rect(12,8,8,1,'#745c37')+rect(13,22,7,4,cream);
  art+=key==='tonics'?path('M17 22H19L17 24H18L15 26V24H14Z','#a7713e'):key==='remedies'?path('M17 22H20V24H18V25H15V24H16V23H17Z',colors[2]):rect(16,22,2,4,colors[2])+rect(14,23,6,2,colors[2]);
 }
 return `<svg class="pixel-item" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${art}</svg>`;
}
