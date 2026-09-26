# 开发与回归脚本

- `check-assets.cjs`：无需服务，检查运行资源与本地素材库边界。
- `check-deployment.cjs`：检查生产构建在站点子路径中的游戏和资源加载；可通过 `RPG_ORIGIN` 指定地址。
- `check-*.cjs`：需要本地 Vite 服务和 Playwright，用真实 Chromium 页面检查对应界面或流程。

一次性素材生成、早期地图样板和离线编辑器工具已移入本地 `assets/workbench/tools/`，不属于正式源码或默认提交范围。

音乐复现脚本需要项目外的 ACE-Step 1.5。执行前设置 `ACE_STEP_ROOT` 为其仓库绝对路径；模型、虚拟环境和生成母版不进入本仓库。

首次运行浏览器回归：

```powershell
npm.cmd install
npx.cmd playwright install chromium
npm.cmd run dev -- --port 4190
```

另开终端执行所需的 `node scripts/check-*.cjs`。这些脚本的截图统一写入 `assets/qa/<主题>/`，不会进入生产构建或默认 Git 提交范围。

开发查询参数中，`?qa=1` 专用于真实标题生命周期回归；需要跳过标题、直接取得场景测试句柄的脚本统一使用 `?qa=runtime` 或 `town`、`battle-fx` 等命名预设。不得再依赖“标题覆盖在已启动场景上”的旧行为。

首页回归默认访问 `http://127.0.0.1:4190`，也可以显式指定另一个隔离入口：

```powershell
$env:RPG_ORIGIN='http://127.0.0.1:4191'
node scripts\check-title.cjs
```
