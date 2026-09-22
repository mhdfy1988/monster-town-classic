# 素材库规范

## 目录边界

| 目录 | 用途 | 构建行为 | 默认提交策略 |
| --- | --- | --- | --- |
| `public/assets/` | 游戏实际加载的成品资源 | Vite 原样复制到 `dist/assets/` | 提交；必须带来源说明并通过资源门禁 |
| `assets/source/` | 参考图、母版、历史导出、可编辑原件 | 不进入构建 | 本地保留，默认忽略；确认授权后再决定是否使用 Git LFS 或独立素材仓库 |
| `assets/workbench/` | 生成候选、联系表、地图样板和制作过程产物 | 不进入构建 | 本地保留，默认忽略 |
| `assets/qa/` | 截图和视觉回归证据 | 不进入构建 | 本地生成，默认忽略 |

`public/assets` 是唯一运行资源库。源码通过 `src/shared/assetUrl.ts` 生成遵循 Vite `base` 的地址，不直接拼接站点根路径。CSS 内的公共资源由 Vite 在构建时转换为相对地址，因此同一份 `dist` 可以放在站点根目录或 GitHub Pages 项目子路径。

## 当前运行资源契约

- 怪兽：`public/assets/creatures-v2/forms/001.png` 至 `024.png`，每张 `1774×887`、RGBA、左右两半分别为正面和背面；运行时按每个形态的内容框与脚底锚点裁剪。
- 人物：`public/assets/characters-v2/walk-*.png`，3 列 × 4 行，单帧 `48×64`，方向顺序为下、左、右、上；每行依次为行走、待机、行走。
- 地图地块：逻辑格固定 `32×32`。基础图集和连接素材保持硬像素边缘、最近邻采样；跨格物件显式声明显示宽高并使用底部中心锚点。
- 道具：`public/assets/items-v2/` 保存背包、商店和战斗共享的成品图，不在各界面复制一套资源。
- 音频：`public/assets/audio/music/` 与 `public/assets/audio/sfx/` 分别保存音乐和短音效；生成模型、缓存、无损母版和未筛选候选只留在 `assets/source/audio/`，运行时不得连接生成服务。
- 开放素材：`public/assets/tuxemon/ATTRIBUTIONS.md` 与 `LICENSE` 随资源保存；公开发布时必须保留署名并逐项遵守对应条款。
- 字体：Zpix 的来源与当前用途记录在 `public/assets/fonts/README.md`。公开仓库或在线 Demo 前仍需确认字体文件的再分发授权，不能把“个人练习可用”当成可公开托管。

## 新素材进入运行库的流程

1. 将用户原图、生成母版或第三方参考放在 `assets/source/`，记录来源、作者、许可和取得日期。
2. 在 `assets/workbench/` 完成裁剪、去背景、限色、图集组装和预览，不覆盖原件。
3. 按目标画布、透明通道、像素采样、方向、脚底锚点和界面显示尺寸验收。
4. 只把最终成品复制到 `public/assets/<分类>/`，在代码中的统一资源清单或映射中登记。
5. 执行 `npm.cmd run check:assets`、`npm.cmd test` 和 `npm.cmd run build`；涉及布局时再执行对应 Playwright 实景回归。

## 本地音频制作路线

- 背景音乐使用项目外安装的 ACE-Step 1.5 本地生成，不依赖在线账户、API Key 或点数；项目只保存可复现脚本、生成记录和人工选中的成品。
- 像素感明确的界面与战斗短音效使用 jsfxr 1.4.0 固定参数离线合成；自然环境、火焰、水流和岩石等复杂音效后续再评估本地生成模型。
- 首个可复现样片脚本为 `scripts/audio/generate_acestep_sample.py`。6GB RTX 3060 使用 Turbo、INT8 权重量化、CPU 卸载和 CPU VAE 解码，禁止把约 6GB 的模型检查点复制进仓库。
- `scripts/audio/generate_acestep_sample.py` 在纯 DiT 模式显式排除未使用的 1.7B 语言模型，避免 ACE-Step 主模型完整性检查误触发下载；短音效由 `scripts/audio/generate_pixel_sfx.cjs` 生成，参数记录在被 Git 忽略的 `assets/source/audio/jsfxr/`。
- 每个正式音频必须记录用途、生成器与版本、提示词、种子、日期、格式、哈希和许可边界。当前两首 24 秒主题曲由浏览器整段循环，已完成运行时接入与响度记录，但尚未制作人工无缝循环点；后续替换或扩充专属场景曲时仍需做听审、循环剪辑和相似性检查。

## 自动门禁

`scripts/check-assets.cjs` 当前检查：

- `source`、`workbench`、`qa` 三个本地分区存在；
- 运行资源库不混入源参考、备份和 faithful 历史导出；
- 001—024 怪兽成品齐全，尺寸为 `1774×887` 且 PNG 色彩类型为 RGBA；
- Tuxemon 许可、署名和字体来源说明存在；
- QA 目录已归档，运行资源体积没有异常回涨。

这个门禁验证结构和文件契约，不替代逐张视觉验收，也不构成版权或商用授权结论。
