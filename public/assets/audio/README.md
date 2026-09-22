# 音频资源说明

## 目录契约

- `music/`：场景背景音乐候选与正式成品。
- `sfx/`：界面、移动、战斗、捕捉和成长短音效。
- 运行时只读取本目录中的成品；模型、缓存、无损母版和未筛选候选不得进入 `public/`。

## 当前运行成品

### `music/greenbud-town-day-v1.ogg`

- 用途：探索主题；当前显式用于标题、青芽镇、青芽研究所、风铃森林和回声洞穴。
- 生成器：ACE-Step 1.5，`acestep-v15-turbo`，本地 DiT 模式。
- 生成日期：2026-09-22。
- 参数：24 秒、104 BPM、G 大调、4/4、种子 `241001`、8 步推理。
- 提示词：`instrumental bright pastoral pixel RPG town theme, playful woodwind melody, warm marimba and soft pizzicato strings, subtle chiptune pulse, welcoming and curious, compact handheld game arrangement, clean loop-friendly ending, no vocals, no choir, no cinematic trailer drums`
- 文件：48kHz、双声道 Ogg Vorbis q5，峰值约 0.9053，RMS 约 -17.50dBFS。
- SHA-256：`48470f22678d24013bba95f86a817044187f7273381c0923b2bbc203618829a1`。
- 许可边界：ACE-Step 1.5 代码采用 MIT 许可；正式发布前仍需保留生成记录，并对最终选中音频做相似性检查。

WAV 母版与 JSON 记录位于被 Git 忽略的 `assets/source/audio/acestep/`；`public/` 只保留浏览器运行时使用的压缩版本。当前版本整段循环 24 秒成品，尚未制作人工无缝循环点。

### `music/wild-battle-v1.ogg`

- 用途：战斗主题；当前显式用于野生、训练家和首领战。
- 生成器：ACE-Step 1.5，`acestep-v15-turbo`，关闭语言模型的本地 DiT 模式。
- 生成日期：2026-09-22。
- 参数：24 秒、148 BPM、E 小调、4/4、种子 `241002`、8 步推理。
- 提示词：`instrumental energetic turn-based monster battle theme for a colorful pixel RPG, urgent syncopated lead melody, punchy retro synth bass, tight snare and tom rhythm, short brass accents, adventurous rather than frightening, compact handheld game arrangement, strong repeating motif, clean loop-friendly ending, no vocals, no choir, no cinematic trailer booms`
- 文件：48kHz、双声道 Ogg Vorbis q5，峰值约 0.8748，RMS 约 -18.80dBFS。
- SHA-256：`77a4c38e7ad37824875a62061162bd7acbf60e7efb0076af91e046d0f83132e4`。

## 核心像素音效

以下音效由 jsfxr 1.4.0 使用固定参数离线合成，均为 44.1kHz、16-bit、单声道 WAV；生成参数和哈希保存在 `assets/source/audio/jsfxr/core-pixel-sfx-v1.json`。

| 文件 | 用途 | 时长 | 峰值 | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `sfx/capture-throw-v1.wav` | 捕捉球抛出与飞行 | 0.308s | 0.5684 | `236294b0e2e35ad91819bb7e84d991ca881aa9e769ba6179e8a509576c0f7893` |
| `sfx/capture-shake-v1.wav` | 捕捉球落地后的摇晃提示 | 0.147s | 0.4266 | `d52788dc20485526449f5f98fe798adc7b57e538c4239c5aaa3592016e215848` |
| `sfx/capture-success-v1.wav` | 捕捉成功确认 | 0.466s | 0.4483 | `46c85c28160f1520beed96158c0f9916d48e4542c120d9fa8734ce929f7bfdf3` |
| `sfx/hit-normal-v1.wav` | 普通受击反馈 | 0.132s | 0.7035 | `9bb9b885708b6b20595a7fd2de1e99d5bbace4be351200b0c504d8c81aaf640d` |
| `sfx/level-up-v1.wav` | 等级提升与成长确认 | 0.742s | 0.6487 | `3fcfc3d3dccb2ee21e2ef693c92e9c3912ff59e132d11fc33102d7ad1d58a8b5` |

jsfxr 上游采用 Unlicense。脚本不调用随机预设，重复运行会得到相同音频；以上五个音效已接入捕捉、受击和升级事件，后续如调整动画节拍或音色，必须同步运行音频实景回归。
