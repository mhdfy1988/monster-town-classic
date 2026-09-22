# 翻页图鉴样板

当前入口：游戏中的图鉴图标，使用 7 个已实现形态和 1 张收尾页。每页独立编号；未获得保持剪影，阅读绝不解锁或写入队伍。页码仅在本次游戏会话内记忆，刷新后不保留。

实现：`src/rpg/dexBook.ts` 封装 `page-flip@2.0.7`（MIT，无运行时依赖），`dexBook.css` 负责书页。桌面双页、窄屏单页；箭头和方向键翻页，目录直接跳页，库处理页角拖动和阴影。关闭时销毁实例和观察器；调整窗口时重新挂载并保留页码。不保留旧滚动图鉴作为静默回退。

官方依据：https://github.com/Nodlik/StPageFlip/blob/master/README.md ：`loadFromHTML`、`flipNext/flipPrev`、`turnToPage`、`destroy`、`usePortrait` 和 `disableFlipByClick`。发布包缺少类型声明，项目只声明本适配层使用的接口，不修改第三方包。

验证：构建和 45 项领域测试通过；`scripts/check-dex-book.cjs` 在独立无头浏览器检查实际翻页、目录跳转、重新打开页码、窗口变化、未知形态不解锁、关闭清理；截图 `assets/qa/book/`。旧 `check-dex-scroll.cjs` 对应已替换的滚动版，不再是图鉴验收入口；旧综合脚本中的图鉴 DOM 断言后续需切换到书本入口，不能宣称它们已全部通过。

本轮为试用样板。尚未做封面开合、翻页音效、首次解锁显现动画；手机滑动手感仍需用户实机试用。主入口仍为 4190，没有操作用户浏览器或清理存档。
