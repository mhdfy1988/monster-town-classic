# 真实窗口与模拟视口错位

## 2026-09-13 根因与结果

用户在 4190 页面看到右侧空白、底栏及战斗指令截断。实际标签页的 Playwright `viewportSize()` 为 1440×1000，页面 `innerWidth/innerHeight` 同样为 1440×1000，但窗口 `outerWidth/outerHeight` 只有 1536×834。内容高度甚至超过整个浏览器窗口，不是 CSS 容器撑开。

恢复真实视口后：页面为 1536×747，设备像素比为 1.25；底栏底边为 720，完整处于视口内。通过 Chrome 原生截图检查，地图两侧留白一致且底栏完整。另建 `viewport: null` 的隔离测试上下文，以测试伙伴进入战斗，六个指令底边最大为 635.6，全部可见。测试未覆盖所有手机尺寸，不据此宣称全设备验收完成。

本轮没有修改游戏渲染代码、地图和用户存档，仅恢复浏览器模拟状态并补充本说明。

## 恢复与验证顺序

1. 精确找到 URL 为 `http://127.0.0.1:4190/` 的现有标签页。不要新开测试窗口后把它误认为用户窗口。
2. 读取 `viewportSize()`、`innerWidth/innerHeight`、`outerWidth/outerHeight`、`devicePixelRatio`，以及地图、底栏矩形。
3. 通过该标签页的 CDP 会话执行 `Emulation.setDeviceMetricsOverride`，参数为 `{ width: 0, height: 0, deviceScaleFactor: 0, mobile: false }`，使用平台实际尺寸。
4. 重新读尺寸并用 `Page.captureScreenshot`（`captureBeyondViewport: false`）直接截图。不要使用这个旧标签页的 `page.screenshot()`；本次已实测它会重新恢复 1440×1000 的模拟尺寸。
5. 测试窗口用独立 `browser.newContext({ viewport: null })`；固定尺寸矩阵只能在专用测试上下文中跑，结束后关闭。不要再把带模拟尺寸的窗口交给用户。

恢复补充：本轮重新打开原存档上下文的标签页后，上下文本身仍会套用 1440×1000。此时先对该页执行 `setViewportSize({ width: 0, height: 0 })` 清掉工具持有的正数尺寸，再执行上述 CDP 零值覆盖；这是污染恢复例外，不用于正常验收。随后恢复窗口最大化，读回 1536×747、底栏底边 720。原存档上下文仍包含三名伙伴、青芽徽章与 242 金币，已恢复“继续旅行”页面，没有重写该存档。

## 尝试记录

- 仅调用新 CDP 会话的 `clearDeviceMetricsOverride`：未撤销另一会话已设置的尺寸，实测仍为 1440×1000。
- 设置宽高与设备比例为 0：实测恢复到真实 1536×747；普通 Playwright 截图随后又恢复了旧尺寸，因此改用原生 CDP 截图验证。
- 不再修改页面 CSS：正确的视口恢复后，现有剩余空间布局即可显示地图、底栏和战斗指令。

## 官方依据

[Chrome DevTools 的设备模拟协议](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride)明确规定宽、高、设备比例为 0 时禁用相应覆盖。页面百分比宽高、视口单位均依赖浏览器提供的视口，不能用布局代码修补被测试环境锁死的视口。
