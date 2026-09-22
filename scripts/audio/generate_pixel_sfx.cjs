#!/usr/bin/env node
/** 使用 jsfxr 的确定性参数生成项目核心像素音效。 */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");
const jsfxrRoot = process.env.JSFXR_ROOT || "D:\\learn_code\\tools\\audio-ai\\jsfxr";
const sfxr = require(path.join(jsfxrRoot, "sfxr.js"));
const outputDir = path.join(projectRoot, "public", "assets", "audio", "sfx");
const recordDir = path.join(projectRoot, "assets", "source", "audio", "jsfxr");

// 所有参数均为显式值，不调用带 Math.random() 的预设，确保可重复生成。
const sounds = {
  "capture-throw-v1": {
    usage: "捕捉球抛出与飞行",
    wave_type: 2,
    p_env_attack: 0,
    p_env_sustain: 0.28,
    p_env_punch: 0.18,
    p_env_decay: 0.24,
    p_base_freq: 0.3,
    p_freq_ramp: 0.34,
    p_freq_dramp: -0.08,
    p_vib_strength: 0.04,
    p_vib_speed: 0.38,
    p_pha_offset: 0.08,
    p_pha_ramp: -0.12,
    p_hpf_freq: 0.08,
  },
  "capture-shake-v1": {
    usage: "捕捉球落地后的摇晃提示",
    wave_type: 0,
    p_env_attack: 0,
    p_env_sustain: 0.18,
    p_env_punch: 0.32,
    p_env_decay: 0.18,
    p_base_freq: 0.27,
    p_freq_ramp: -0.08,
    p_arp_mod: 0.09,
    p_arp_speed: 0.7,
    p_duty: 0.28,
    p_repeat_speed: 0.58,
    p_lpf_freq: 0.72,
    p_hpf_freq: 0.07,
  },
  "capture-success-v1": {
    usage: "捕捉成功确认",
    wave_type: 0,
    p_env_attack: 0,
    p_env_sustain: 0.3,
    p_env_punch: 0.42,
    p_env_decay: 0.34,
    p_base_freq: 0.38,
    p_freq_ramp: 0.12,
    p_arp_mod: 0.32,
    p_arp_speed: 0.66,
    p_duty: 0.22,
    p_repeat_speed: 0.46,
    p_lpf_freq: 0.86,
    p_hpf_freq: 0.08,
  },
  "hit-normal-v1": {
    usage: "普通受击反馈",
    wave_type: 3,
    p_env_attack: 0,
    p_env_sustain: 0.1,
    p_env_punch: 0.48,
    p_env_decay: 0.22,
    p_base_freq: 0.32,
    p_freq_ramp: -0.42,
    p_pha_offset: -0.16,
    p_pha_ramp: -0.12,
    p_lpf_freq: 0.58,
    p_lpf_resonance: 0.18,
    p_hpf_freq: 0.14,
  },
  "level-up-v1": {
    usage: "等级提升与成长确认",
    wave_type: 1,
    p_env_attack: 0,
    p_env_sustain: 0.34,
    p_env_punch: 0.34,
    p_env_decay: 0.46,
    p_base_freq: 0.24,
    p_freq_ramp: 0.2,
    p_freq_dramp: 0.05,
    p_arp_mod: 0.28,
    p_arp_speed: 0.64,
    p_repeat_speed: 0.39,
    p_lpf_freq: 0.82,
    p_lpf_ramp: 0.1,
    p_hpf_freq: 0.06,
  },
};

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(recordDir, { recursive: true });

const manifest = {
  generator: "jsfxr",
  version: "1.4.0",
  source: "https://github.com/chr15m/jsfxr",
  license: "Unlicense",
  sampleRate: 44100,
  sampleSize: 16,
  sounds: {},
};

for (const [id, definition] of Object.entries(sounds)) {
  const params = new sfxr.Params();
  params.fromJSON({
    ...definition,
    sound_vol: 0.18,
    sample_rate: manifest.sampleRate,
    sample_size: manifest.sampleSize,
  });
  const generated = new sfxr.SoundEffect(params).generate();
  const payload = generated.dataURI.split(",", 2)[1];
  const wav = Buffer.from(payload, "base64");
  const outputPath = path.join(outputDir, `${id}.wav`);
  fs.writeFileSync(outputPath, wav);

  manifest.sounds[id] = {
    usage: definition.usage,
    parameters: definition,
    output: path.relative(projectRoot, outputPath).replaceAll("\\", "/"),
    sha256: crypto.createHash("sha256").update(wav).digest("hex"),
  };
  console.log(`生成完成：${outputPath}`);
}

const manifestPath = path.join(recordDir, "core-pixel-sfx-v1.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`生成记录：${manifestPath}`);
