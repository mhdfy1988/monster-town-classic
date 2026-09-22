export type QuestKind='main'|'side';
export interface QuestDefinition {
  id:string;
  kind:QuestKind;
  title:string;
  giver:string;
  summary:string;
  objectiveCount:number;
  reward?:string;
}

export const mainQuestDefinitions:readonly QuestDefinition[]=[
  {id:'chapter-1',kind:'main',title:'森林发热了',giver:'青禾博士',summary:'调查风铃森林的异常热风，关闭回声洞穴里的过热设备。',objectiveCount:9,reward:'河湾镇通行证'},
] as const;

export const sideQuestDefinitions:readonly QuestDefinition[]=[
  {id:'lost-surveyor',kind:'side',title:'迷路的测量员',giver:'巡林员 · 林川',summary:'寻找在风铃森林西侧失联的测量员，再向林川报平安。',objectiveCount:2,reward:'80 金币与 2 个捕捉球'},
  {id:'dim-glow-moss',kind:'side',title:'暗淡的苔光',giver:'向导 · 小夏',summary:'调查风铃森林中三处失去光泽的苔藓，并把观察结果带回给小夏。',objectiveCount:3,reward:'60 金币与 2 瓶恢复药水'},
] as const;

export const questDefinitions:readonly QuestDefinition[]=[...mainQuestDefinitions,...sideQuestDefinitions];
export const sideQuestIds=new Set(sideQuestDefinitions.map(quest=>quest.id));
