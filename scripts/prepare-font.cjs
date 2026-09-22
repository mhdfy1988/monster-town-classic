const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'public', 'assets', 'fonts', 'zpix.woff2');
const source = 'https://github.com/SolidZORO/zpix-pixel-font/releases/download/v3.2.0/zpix.woff2';

function validFont(file) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 100000) return false;
  return fs.readFileSync(file).subarray(0, 4).toString('ascii') === 'wOF2';
}

function download(url, redirects = 0) {
  if (redirects > 5) throw new Error('Zpix 下载重定向次数过多');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'monster-town-classic-build' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        resolve(download(new URL(response.headers.location, url).toString(), redirects + 1));
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Zpix 下载失败：HTTP ${response.statusCode}`));
        return;
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const temporary = `${target}.download`;
      const output = fs.createWriteStream(temporary);
      response.pipe(output);
      output.on('finish', () => {
        output.close();
        if (!validFont(temporary)) {
          fs.rmSync(temporary, { force: true });
          reject(new Error('下载结果不是有效的 WOFF2 字体'));
          return;
        }
        fs.renameSync(temporary, target);
        resolve();
      });
      output.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  if (validFont(target)) {
    console.log('Zpix v3.2.0 已就绪');
    return;
  }
  await download(source);
  console.log('已从作者官方 Release 下载 Zpix v3.2.0');
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
