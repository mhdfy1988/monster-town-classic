// page-flip 2.0.7 发布包未附带类型，仅声明适配层实际使用的官方接口。
declare module 'page-flip' {
 export class PageFlip {
  constructor(element:HTMLElement,settings:Record<string,string|number|boolean>);
  on(event:string,callback:(event:{data:unknown})=>void):void;
  loadFromHTML(pages:NodeListOf<HTMLElement>):void;
  getOrientation():'portrait'|'landscape';
  getState():string;
  flipNext(corner?:string):void;flipPrev(corner?:string):void;
  turnToNextPage():void;turnToPrevPage():void;turnToPage(page:number):void;
  destroy():void;
 }
}
