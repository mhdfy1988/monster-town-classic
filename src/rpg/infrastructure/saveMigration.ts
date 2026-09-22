import { normalizeTeam, validSave, type Save } from '../model';

import { townBuildings, npcs, inBox } from '../content/maps/greenbudTown';

// 仅迁移旧布局新增的建筑与 NPC 占格，不吞掉越界或其他损坏数据。
function migrateTownLayout(source:Record<string,unknown>):Record<string,unknown>{
  if(source.townLayoutRevision!==undefined&&source.townLayoutRevision!==2)throw new Error('小镇布局版本无法识别。');
  if(source.townLayoutRevision===2)return source;
  const x=Number(source.x),y=Number(source.y);
  const oldBuildings=[{x:18,y:11,w:5,h:4},{x:7,y:14,w:5,h:4},{x:7,y:5,w:5,h:4}];
  const obstructed=(source.map==='greenbud-town'||source.map==='town')&&!oldBuildings.some(b=>inBox(x,y,b))&&Number.isInteger(source.x)&&Number.isInteger(source.y)
    &&(townBuildings.some(b=>inBox(x,y,b))||npcs.some(n=>n.x===x&&n.y===y));
  const updated={...source,townLayoutRevision:2,...(obstructed?{x:20,y:22}:{})};
  if(obstructed)console.info('青芽镇布局迁移：旧落点被新建筑或人物占用，迁往中央广场。');
  return updated;
}

const legacyMapIds = { town: 'greenbud-town', lab: 'greenbud-lab' } as const;

export function migrateSave(value: unknown, teamLimit = 5): Save {
  if (!value || typeof value !== 'object') throw new Error('存档不是有效对象。');
  const source = migrateTownLayout(value as Record<string, unknown>);
  if (source.version === 3) {
    if (!validSave(source, teamLimit)) throw new Error('存档内容无法识别。');
    return normalizeTeam(source);
  }
  if(source.version===2){
    const migrated={...source,version:3,sideQuests:[]};
    if(!validSave(migrated,teamLimit))throw new Error('v2 存档内容无法迁移。');
    return normalizeTeam(migrated);
  }
  if (source.version !== 1 || typeof source.map !== 'string' || !(source.map in legacyMapIds)) throw new Error('存档版本无法识别。');
  const migrated = {
    ...source,
    version: 3,
    map: legacyMapIds[source.map as keyof typeof legacyMapIds],
    story: {
      nodeId: 'chapter-1-town',
      flags: source.badge === true ? ['ranger-pass'] : [],
      defeatedBossIds: [],
    },
    sideQuests: [],
  };
  if (!validSave(migrated, teamLimit)) throw new Error('旧存档内容无法迁移。');
  return normalizeTeam(migrated);
}
