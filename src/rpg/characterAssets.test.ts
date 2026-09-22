import { describe, expect, it } from 'vitest';

declare const require: (id: string) => any;
declare const process: { cwd: () => string };
const { readFileSync } = require('fs');
const { join } = require('path');

const characterSheets = ['player', 'mage', 'nurse', 'ranger', 'merchant', 'grandpa', 'mayor', 'silver-guard'];

describe('角色与 NPC 行走图资源', () => {
  it.each(characterSheets)('%s 使用统一的 3×4 RGBA 图表契约', name => {
    const png = readFileSync(join(process.cwd(), 'public', 'assets', 'characters-v2', `walk-${name}.png`));
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(48 * 3);
    expect(png.readUInt32BE(20)).toBe(64 * 4);
    expect(png[24]).toBe(8);
    expect(png[25]).toBe(6);
  });
});
