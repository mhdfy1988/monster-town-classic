// 提交前素材门禁：验证运行资源、源素材、制作过程和 QA 证据边界。
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const publicAssets = path.join(root, 'public', 'assets');
const requiredDirectories = [
  path.join(root, 'assets', 'source'),
  path.join(root, 'assets', 'workbench'),
  path.join(root, 'assets', 'qa'),
];

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

function pngInfo(file) {
  const data = fs.readFileSync(file);
  if (data.subarray(1, 4).toString('ascii') !== 'PNG') throw new Error(`不是 PNG：${file}`);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), colorType: data[25] };
}

for (const directory of requiredDirectories) {
  if (!fs.existsSync(directory)) throw new Error(`缺少素材分区：${path.relative(root, directory)}`);
}

const runtimeFiles = filesBelow(publicAssets);
const forbidden = runtimeFiles.filter(file => /source-reference|runtime-backup|faithful|(?:^|[\\/])source(?:[\\/]|-)/i.test(path.relative(publicAssets, file)));
if (forbidden.length) throw new Error(`运行资源混入源文件：${forbidden.map(file => path.relative(root, file)).join(', ')}`);

for (const removedPath of ['tiles', 'characters']) {
  if (fs.existsSync(path.join(publicAssets, removedPath))) throw new Error(`旧编辑器资源仍在运行库：public/assets/${removedPath}`);
}
for (const legacyFile of ['agnite-sheet.png', 'budaye-sheet.png', 'eyenemy-sheet.png', 'grintot-sheet.png', 'rockitten-sheet.png']) {
  if (fs.existsSync(path.join(publicAssets, 'tuxemon', legacyFile))) throw new Error(`旧怪物图表仍在运行库：${legacyFile}`);
}

const forms = Array.from({ length: 24 }, (_, index) => path.join(publicAssets, 'creatures-v2', 'forms', `${String(index + 1).padStart(3, '0')}.png`));
for (const form of forms) {
  if (!fs.existsSync(form)) throw new Error(`缺少怪兽形态：${path.relative(root, form)}`);
  const info = pngInfo(form);
  if (info.width !== 1774 || info.height !== 887 || info.colorType !== 6) {
    throw new Error(`怪兽形态尺寸或透明格式错误：${path.relative(root, form)} ${JSON.stringify(info)}`);
  }
}

for (const file of [
  'public/assets/tuxemon/LICENSE',
  'public/assets/tuxemon/ATTRIBUTIONS.md',
  'public/assets/fonts/README.md',
]) if (!fs.existsSync(path.join(root, file))) throw new Error(`缺少授权说明：${file}`);

const requiredAudio = [
  'public/assets/audio/music/greenbud-town-day-v1.ogg',
  'public/assets/audio/music/wild-battle-v1.ogg',
  'public/assets/audio/sfx/capture-throw-v1.wav',
  'public/assets/audio/sfx/capture-shake-v1.wav',
  'public/assets/audio/sfx/capture-success-v1.wav',
  'public/assets/audio/sfx/hit-normal-v1.wav',
  'public/assets/audio/sfx/level-up-v1.wav',
];
for (const relative of requiredAudio) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`缺少音频样板：${relative}`);
  const signature = fs.readFileSync(file).subarray(0, 4).toString('ascii');
  const expected = file.endsWith('.ogg') ? 'OggS' : 'RIFF';
  if (signature !== expected) throw new Error(`音频容器与扩展名不符：${relative}`);
}

const strayQa = fs.readdirSync(path.join(root, 'assets'), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && entry.name.startsWith('qa-'))
  .filter(entry => filesBelow(path.join(root, 'assets', entry.name)).some(file => !file.endsWith('.log')));
if (strayQa.length) throw new Error(`QA 目录尚未归档：${strayQa.map(entry => entry.name).join(', ')}`);

const runtimeMiB = runtimeFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0) / 1024 / 1024;
if (runtimeMiB > 55) throw new Error(`运行资源体积异常：${runtimeMiB.toFixed(2)} MiB`);

console.log(`PASS assets: ${runtimeFiles.length} runtime files, 24 RGBA creature forms, ${runtimeMiB.toFixed(2)} MiB; source/workbench/qa separated`);
