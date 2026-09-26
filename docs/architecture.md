# 青芽纪行工程架构

## 目标

在不改变第一章现有玩法和视觉表现的前提下，把游戏从单体场景拆成可独立扩展的模块。后续增加城镇、野外、首领和剧情时，应以新增内容定义与系统适配为主，不再继续扩大 `RpgScene`。

## 当前分层

```text
main.ts
  └─ rpg/gameApp.ts               游戏外壳与 title/loading/game 生命周期
       ├─ ui/TitleController.ts    标题、存档目录与启动请求（无 Phaser）
       └─ gameRuntime.ts           进入旅程后动态创建 Phaser
            └─ RpgScene.ts         场景生命周期和用例编排
            ├─ content/           资源清单、章节和内容契约
            ├─ systems/           移动、任务与章节推进等可测试游戏系统
            ├─ world/             世界画面构建
            ├─ battle/            战斗会话与临时状态
            ├─ infrastructure/    浏览器存档和音频适配
            ├─ ui/                HUD、弹窗和战斗视图组件
            └─ model/combat/...   领域数据、规则、存档和成长
shared/assetUrl.ts               统一生成遵循 Vite base 的运行资源地址
```

依赖只能由入口和编排层指向下层。`content`、`systems`、`battle`、`infrastructure` 和领域模块不得反向导入 `RpgScene`；界面组件可以读取领域类型，但不能修改存档或推进剧情。

运行资源只从 `public/assets/` 读取，TypeScript 入口统一通过 `shared/assetUrl.ts` 适配站点根目录和 Pages 项目子路径。`assets/source`、`assets/workbench` 与 `assets/qa` 是本地素材工作区，不得被运行代码引用；详细契约见 [素材库规范](asset-library.md)。早期地图编辑器、旧 `src/game` 原型模块、图块画板、地图生成器和临时纹理生成器均已删除或退出提交范围，不保留为静默回退。

应用生命周期只有 `title → loading → game` 三种状态。`title` 只读取浏览器存档并渲染 HTML 界面，不创建画布；`loading` 动态导入游戏运行包，游戏容器保留尺寸但不可见、不可交互；`game` 在场景报告就绪后才显示画布。返回标题必须销毁 Phaser、场景输入与场景音频，再重新挂载标题控制器；任一时刻最多存在一个游戏实例。

## 一次探索到战斗的状态流

1. `RpgScene` 从键盘读取输入，交给 `systems/movement` 解析方向、站立帧、行走帧和目标格。
2. 场景从 `content/maps/mapRegistry.ts` 取得统一地图定义；城镇与静态地图文档都经同一运行接口提供尺寸、出生点、碰撞、遭遇区和传送点。成功移动后只更新 `Save` 中的位置和步数。
3. 进入野外触发战斗时，场景创建敌方伙伴，并调用 `BattleSession.start` 建立本场临时状态。
4. `combat.ts` 计算伤害和道具效果；`BattleSession` 保存菜单、日志、增减益与忙碌状态；`BattleFlow` 在结算后发出结构化 `BattleFeedback`；`ui/battleView` 和场景适配层只渲染快照、动画、粒子与音阶。
5. 胜利后 `battleProgress.ts` 生成全队成长事件，场景持久化 `Save`，界面逐项播放结算。

不变式：战斗临时增减益不进入存档；表现层不得反向修改伤害、捕捉概率、库存或回合状态；界面不能反推升级或图鉴解锁；世界图片不决定碰撞；规划中的内容不能标记为已实现。

## 三章内容扩展契约

`content/campaign.ts` 是后续剧情和关卡的结构入口，当前固定三章，每章包含一座小镇、一片专属野外、一处洞穴和一个章节首领。`campaignStory` 按“小镇 → 野外 → 洞穴 → 首领”连接成十二节点无环主线。这里的区域全部代表具有稳定 ID 的独立运行地图；镇内长草区只承担遭遇教学，不能计作正式野外地图。

第一章的青芽镇、风铃森林、回声洞穴和熔岩巨龟均标记为 `implemented`。巡林员胜利只写入 `ranger-pass`；玩家必须返回研究所接受博士委托并写入 `forest-investigation`，北门才开放。`systems/questProgress.ts` 由既有剧情标记推导九阶段主线，并独立持久化两条支线；`systems/chapterOneProgress.ts` 统一负责调查、白砾会面、支线奖励和返镇收尾。清理森林北口写入 `forest-route-cleared`；洞穴的回声石音序由 `systems/caveProgress.ts` 独立维护，关闭设备后才进入不可捕捉、不可逃跑的首领战。首领胜利只记录稳定首领 ID 和 `magma-tortoise-calmed`，返镇由镇长结算后才写入第一章完成标记与河湾镇通行证。第二、三章仍保持 `planned`。完整剧情与地图拓扑见 [三章主线与地图规划](design/三章主线与地图规划.md)。

## 地图与存档契约

- 运行地图使用稳定 ID：`greenbud-town`、`greenbud-lab`、`windbell-forest`、`echo-cave`，不再把中文名或 `town | lab` 作为持久化协议。
- `content/maps/mapDocument.ts` 只定义当前游戏需要的静态地图、地形和碰撞结构；`mapDocumentAdapter.ts` 将它转换为统一运行地图。早期编辑器的自定义图块、旋转、浏览器地图库和旧版本导入迁移不属于当前游戏。
- 存档版本为 v3，除当前剧情节点、事件标记和已击败章节首领外，还持久化支线任务状态。v1、v2 单档与三槽目录在读取时逐版显式迁移；未知版本、未知地图或非法落点直接报错并保留原数据，不静默回退。
- 地图传送由注册表声明，剧情门只检查事件标记。青芽镇、风铃森林和回声洞穴保持双向返回，不删除队伍、图鉴或补给。

## 音频运行时契约

- `infrastructure/AudioPlayer.ts` 是浏览器音频适配层，独立管理背景音乐与游戏音效两条总线；音量、开关保存在 `pocket-grove-audio-v1`，不混入游戏存档。
- `content/audioCues.ts` 显式声明每张已实现地图和 `wild | trainer | boss` 三类战斗使用的音乐。当前第一版只有探索与战斗两首主题，因此多个游戏场景共用同一资源是明确内容映射，不是加载失败后的静默回退；标题、存档管理和结束提示保持静音。
- 浏览器自动播放限制由进入游戏后的首次 `pointerdown` 或 `keydown` 解锁。地图切换、开战与战斗结束只请求内容映射中的音乐；捕捉、受击和升级事件只播放已经登记的本地短音效。
- 运行时只加载 `public/assets/audio/` 成品，不调用 ACE-Step、jsfxr 或任何在线生成服务。新增音频时必须同时更新内容映射、资源说明、资源门禁和音频实景回归。

后续制作每章时按以下顺序推进：

1. 确定章节冲突、城镇目标、野外阻碍、洞穴机制和首领动机。
2. 为地图建立稳定 ID、入口、出口、碰撞和事件定义。
3. 用剧情节点连接“城镇获得目标 → 野外寻找入口 → 洞穴解决核心阻碍 → 首领结算 → 下一章入口”。
4. 接入 NPC、战斗和奖励，再做完整游玩回归。

## 后续扩展入口

- 新界面继续以 `ui/` 中的无状态视图函数和控制器组合，存档修改与流程推进仍由场景用例层负责。
- 新 NPC、对话、区域切换和奖励优先扩展 `content/interactions.ts`，不在 `RpgScene.interact()` 中新增身份分支。
- 主线进度继续由稳定剧情标记推导，避免维护第二份主线游标；支线状态使用 `Save.sideQuests` 持久化，接受、推进、结算必须通过任务系统并保持奖励幂等。
- 后续地图继续通过现有 `MapDocument → RuntimeMapDefinition` 适配层接入；如将来确实需要制作工具，应作为独立工具项目消费这份明确协议，不再把编辑器界面混入游戏入口。
- 剧情、正式地名和首领动机已经形成第一版设计；`campaign.ts` 中未标记为 `implemented` 的地图和首领仍只是可验证规划，不属于当前可玩内容。
- 首页主包不再包含 Phaser；游戏运行时已拆成进入旅程后才请求的独立包。运行包仍超过 500 kB，当前为非阻断构建提示，后续新增章节资源组时再按地图或场景边界继续拆分。
