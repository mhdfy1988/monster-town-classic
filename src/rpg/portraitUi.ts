import { species, maxHp, elementNames, monsterInfo, speciesForms, type Monster } from './model';
import { assetUrl } from '../shared/assetUrl';

export function legacyArtwork(index:number,back=false){
  // 图集下方是其他图标，战斗只读取顶部 64×64 正背帧。
  const bounds:Record<number,number[][]>={0:[[10,6,54,57],[79,22,113,64]],2:[[16,19,47,44],[73,28,122,64]],3:[[5,12,52,58],[75,35,121,64]],4:[[20,10,42,56],[86,10,108,56]]};
  const [x,y,right,bottom]=bounds[index][back?1:0],center=(x+right)/2,size=64;
  return `<span class="monster-art generated-creature" role="img" aria-label="${species[index].name}${back?'背面':'正面'}"><svg viewBox="${center-size/2} ${bottom-size} ${size} ${size}" aria-hidden="true"><svg x="${x}" y="${y}" width="${right-x}" height="${bottom-y}" viewBox="${x} ${y} ${right-x} ${bottom-y}" overflow="hidden"><image href="${assetUrl(`tuxemon/${species[index].id}-sheet.png`)}" width="128" height="88"/></svg></svg></span>`;
}

export function statusIcon(kind:'up'|'down'|'guard',layers=1){
  const label=kind==='guard'?'守护：下一次受击减伤 50%':`攻击${kind==='up'?'提升':'降低'} ${layers*20}%，本场战斗有效`;
  const sword='<path d="M8 23 22 5l5-1-1 6L12 26Zm-3-4 10 8M6 29l4-5"/>';
  const glyph=kind==='guard'?'<path d="M16 3 27 7v10c0 6-11 12-11 12S5 23 5 17V7Z"/><path d="m10 16 4 4 8-9"/>':sword+`<path d="${kind==='up'?'M24 26V16m-4 4 4-4 4 4':'M24 16v10m-4-4 4 4 4-4'}"/>`;
  return `<button type="button" class="status-icon ${kind}" aria-label="${label}" aria-expanded="false"><svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>${kind==='guard'?'':`<b>${layers}</b>`}<span class="status-tooltip" role="tooltip">${label}</span></button>`;
}

export function fireArtwork(form:0|1|2=0,back=false,className='monster-art'){
  return generatedArtwork(1,form,back,className);
}

const generatedBoxes:Record<number,number[][][]>={
  0:[[[131,127,789,841,502],[1062,156,1675,837,1362]],[[132,28,851,863,534],[1001,29,1677,863,1356]],[[10,18,812,872,468],[988,15,1764,869,1314]]],
  1:[[[157,64,841,825,472],[986,64,1634,820,1324]],[[86,62,887,840,350],[887,78,1690,836,1370]],[[57,43,886,851,390],[905,43,1674,846,1438]]],
  2:[[[205,155,800,822,434],[1026,189,1620,822,1304]],[[26,82,867,831,556],[947,127,1748,836,1370]],[[0,32,854,868,481],[906,42,1774,862,1391]]],
  3:[[[104,129,736,795,304],[1058,125,1692,795,1450]],[[71,126,791,816,370],[999,127,1690,816,1460]],[[34,35,887,858,340],[887,64,1763,858,1341]]],
  4:[[[157,45,805,850,408],[1063,46,1657,846,1346]],[[153,29,859,857,438],[1009,29,1633,857,1349]],[[103,23,849,860,414],[959,23,1697,860,1300]]],
  5:[[[74,193,759,818,422],[1015,197,1700,818,1436]],[[63,97,884,819,330],[956,102,1727,819,1412]],[[22,16,880,876,415],[926,16,1753,875,1428]]],
  6:[[[105,94,833,831,419],[981,94,1672,828,1353]],[[96,82,878,847,404],[975,82,1694,838,1356]],[[49,30,878,873,276],[916,22,1718,854,1384]]],
  7:[[[108,147,813,778,490],[961,150,1672,777,1316]],[[100,108,841,826,396],[968,98,1676,819,1361]],[[99,96,863,823,376],[940,96,1669,812,1389]]],
};
const generatedFiles:Record<number,readonly string[]>={
  0:['004.png','012.png','020.png'],
  1:['001.png','009.png','017.png'],
  2:['002.png','010.png','018.png'],
  3:['005.png','013.png','021.png'],
  4:['007.png','015.png','023.png'],
  5:['003.png','011.png','019.png'],
  6:['006.png','014.png','022.png'],
  7:['008.png','016.png','024.png'],
};
export function generatedArtwork(index:number,form:0|1|2=0,back=false,className='monster-art'){
  const [left,top,right,bottom,foot]=generatedBoxes[index][form][back?1:0];
  const size=Math.max((foot-left)*2,(right-foot)*2,bottom-top)+4;
  // 母版实际 1774×887。SVG 视窗只裁掉透明间隙，不改原图、不强行宣称原生低分辨率。
  return `<span class="${className} generated-creature" role="img" aria-label="${speciesForms[index][form].name}${back?'背面':'正面'}"><svg viewBox="${foot-size/2} ${bottom-size} ${size} ${size}" aria-hidden="true"><svg x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" viewBox="${left} ${top} ${right-left} ${bottom-top}" overflow="hidden"><image href="${assetUrl(`creatures-v2/forms/${generatedFiles[index][form]}`)}" width="1774" height="887"/></svg></svg></span>`;
}

export function creatureArtwork(index:number,form:0|1|2=0,back=false,className='monster-art'){
  return generatedBoxes[index]?generatedArtwork(index,form,back,className):legacyArtwork(index,back);
}

// 图标为项目内矢量资源；怪兽继续使用已署名的原生像素图集。
export function menuIcon(kind: 'team' | 'bag' | 'book' | 'save' | 'settings') {
  const paths = {
    team: '<path fill="#578766" d="M3 6h7l5 5h4l5-5h5v17l-6 7H9l-6-7Z"/><path fill="#b0d88a" d="M5 8h4l5 6h7l5-6h1v13l-6 6H11l-6-6Z" stroke="none"/><path fill="#efd58b" d="M10 21h13v5H10Z" stroke="none"/><path d="M9 17h3v3H9Zm12 0h3v3h-3Z" fill="#293b36"/><path d="M15 22h4"/><path d="M13 7V3h6v4" fill="#efd58b"/>',
    bag: '<path d="M11 9V3h10v6" fill="#795139"/><path fill="#87553b" d="M5 10h22v18H5Z"/><path fill="#d69951" d="M7 8h18v20H7Z"/><path fill="#efc878" d="M5 7h22v10l-5 3H10l-5-3Z"/><path fill="#b7743e" d="M10 23h12v6H10Z"/><path fill="#f4df9d" d="M14 15h5v7h-5Z"/><path stroke="#ffe7ad" d="M8 10h15"/>',
    book: '<path fill="#4c727d" d="M5 4h21v24H5Z"/><path fill="#eedeb4" d="M7 24h20v5H7Z"/><path fill="#7cafab" d="M4 3h21v22H4Z"/><path stroke="#bce0c3" d="M8 5v17"/><path fill="#efcd70" d="M16 7h4v4h3v6h-3v3h-6v-3h-3v-6h5Z"/><path stroke="#345946" d="M15 17l5-6"/><path fill="#bb704d" d="M19 26h4v5l-2-1-2 1Z" stroke="none"/>',
    save: '<path d="M5 4h20l3 3v21H5ZM10 4v9h12V4M10 28V18h13v10M18 6v4"/>',
    settings: '<path fill="#aa8653" d="M12 2h8v5h5v5h5v8h-5v5h-5v5h-8v-5H7v-5H2v-8h5V7h5Z"/><path fill="#e6c482" d="M12 4h6v5h6v5h4v4h-5v5h-5v5h-4v-5H9v-5H4v-4h5V9h5Z" stroke="none"/><path fill="#54786c" d="M12 11h8v10h-8Z"/><path stroke="#f7e4ad" d="M12 7h6M7 12v6"/>',
  };
  return `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#354739" stroke-width="1.5" stroke-linejoin="miter" shape-rendering="crispEdges">${paths[kind]}</svg>`;
}
export function portrait(m: Monster, className = '') {
  if(speciesForms[m.species])return generatedArtwork(m.species,m.form??0,false,`partner-portrait ${className}`);
  return `<span class="partner-portrait ${className}" role="img" aria-label="${species[m.species].name}" style="background-image:url('${assetUrl(`tuxemon/${species[m.species].id}-sheet.png`)}')"></span>`;
}
export function battleIcon(kind: string) {
  const paths: Record<string,string> = {
    attack:'<path fill="#edc37b" d="m5 16 7-8 5 3 3-6 6 4-1 14-9 5-10-5Z"/><path d="m11 15 3 4m3-6 3 4"/>',
    leaf:'<path fill="#96c976" d="M5 25C2 10 13 4 28 4c0 17-8 26-20 21Z"/><path d="m5 28 18-18M12 20v-7m5 3h7"/>',
    wood:'<path fill="#96c976" d="M5 25C2 10 13 4 28 4c0 17-8 26-20 21Z"/><path d="m5 28 18-18M12 20v-7m5 3h7"/>',
    fire:'<path fill="#df7548" d="M17 2c3 12 14 12 10 23-7 10-23 4-22-7l7-10 1 9Z"/><path fill="#ffe298" d="m17 15 5 9-6 5-5-5Z"/>',
    stone:'<path fill="#b6b7ad" d="m5 11 12-7 10 8 2 12-12 6-14-7Z"/><path fill="#818c88" d="m17 16 10-4 2 12-12 6Z"/><path d="m5 11 12 5v14"/>',
    earth:'<path fill="#b6a078" d="m5 11 12-7 10 8 2 12-12 6-14-7Z"/><path fill="#82725f" d="m17 16 10-4 2 12-12 6Z"/><path d="m5 11 12 5v14"/>',
    water:'<path fill="#75b9ce" d="M16 2C13 9 6 13 6 21a10 10 0 0 0 20 0C26 13 19 9 16 2Z"/><path fill="#d8f4f1" d="M12 22c3 3 8 2 10-2"/><path d="M16 7c-2 5-6 8-6 13"/>',
    mystic:'<path fill="#b8a2d0" d="m16 2 4 10 11 4-11 4-4 11-4-11-10-4 10-4Z"/><path fill="#faf0ba" d="m16 10 6 6-6 6-6-6Z"/>',
    light:'<path fill="#f2d66f" d="m16 2 4 10 11 4-11 4-4 11-4-11-10-4 10-4Z"/><path fill="#fff7cf" d="m16 10 6 6-6 6-6-6Z"/>',
    metal:'<path fill="#aebbc2" d="M5 9h22v14l-6 6H11l-6-6Z"/><path fill="#e6ecec" d="m9 12 7-6 7 6-3 13h-8Z"/><path d="M6 18h20"/>',
    ice:'<path fill="#9dddf2" d="m16 2 5 9 8 5-8 5-5 9-5-9-8-5 8-5Z"/><path d="M16 5v22M6 16h20"/>',
    lightning:'<path fill="#f0c94f" d="M18 2 7 18h8l-2 12 12-17h-8Z"/><path d="M18 2 7 18h8l-2 12"/>',
    capture:'<circle cx="16" cy="16" r="12" fill="#f6e4b3"/><path fill="#db8163" d="M4 16a12 12 0 0 1 24 0Z"/><path d="M4 16h24"/><circle cx="16" cy="16" r="4" fill="#fff7dd"/>',
    potion:'<path fill="#bad9d0" d="M12 4h8v8l6 7v9H6v-9l6-7Z"/><path fill="#6ea99b" d="M8 20h16v6H8Z"/><path fill="#d8aa68" d="M11 3h10v6H11Z"/><path stroke="#fbf5d7" d="M16 18v7m-4-3h8"/>',
    switch:'<path fill="#97ba83" d="M4 8h17V3l8 8-8 8v-6H4Zm24 16H11v5l-8-8 8-8v6h17Z"/>',
    flee:'<path fill="#cbaa78" d="M4 4h14v24H4Z"/><path fill="#819974" d="M7 7h8v18H7Z"/><path fill="#f8df95" d="M12 13h11V8l8 8-8 8v-5H12Z"/>',
  };
  return `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#415343" stroke-width="1.5" stroke-linejoin="round">${paths[kind]??paths.attack}</svg>`;
}
export function partnerCard(m: Monster, index: number, selected: boolean) {
  const s = monsterInfo(m);
  return `<button class="partner-slot ${selected?'selected':''}" data-partner="${index}" aria-pressed="${selected}">${portrait(m)}<span class="partner-meta"><strong>${s.name}</strong><small>Lv.${m.level} · ${elementNames[s.element]} ${index===0?'· 首发':''}</small><span class="card-meter-label"><span>体力</span><span>${m.hp} / ${maxHp(m)}</span></span><span class="partner-hp"><i style="width:${100*m.hp/maxHp(m)}%;background:${m.hp/maxHp(m)<.3?'#cb745a':'#63997c'}"></i></span>${m.hp===0?'<small>无法战斗</small>':''}<span class="card-meter-label"><span>经验</span><span>${m.xp} / ${m.level*12}</span></span><span class="partner-hp card-xp"><i style="width:${Math.min(100,100*m.xp/(m.level*12))}%"></i></span></span></button>`;
}
