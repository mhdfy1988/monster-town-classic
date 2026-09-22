import { describe, expect, it } from 'vitest';
import { captureEffectView, PIXEL_CAPTURE_THROW_DURATION, resolveCaptureEffectStyle } from './captureEffectView';

describe('捕捉演出方案', () => {
  it('默认使用像素粒子方案，并保留经典方案作为显式对照入口', () => {
    expect(resolveCaptureEffectStyle('')).toBe('pixel');
    expect(resolveCaptureEffectStyle('?captureFx=pixel')).toBe('pixel');
    expect(resolveCaptureEffectStyle('?captureFx=classic')).toBe('classic');
    expect(resolveCaptureEffectStyle('?captureFx=unknown')).toBe('pixel');
  });

  it('经典方案不生成粒子，新方案只在吸入与挣脱阶段生成粒子', () => {
    const orb = '<img class="capture-orb-art">';
    expect(captureEffectView({ kind: 'capture', phase: 'throw' }, orb, 'classic', 'fire')).not.toContain('capture-pixels');
    const absorb = captureEffectView({ kind: 'capture', phase: 'throw' }, orb, 'pixel', 'fire');
    expect(absorb).toContain('capture-orb-body');
    expect(absorb).toContain('capture-pixels');
    expect(absorb).not.toContain('style="--px:');
    expect(PIXEL_CAPTURE_THROW_DURATION).toBeGreaterThan(1200);
    expect(captureEffectView({ kind: 'capture', phase: 'break' }, orb, 'pixel', 'wood')).toContain('capture-pixels');
    expect(captureEffectView({ kind: 'capture', phase: 'shake', shake: 1 }, orb, 'pixel', 'fire')).not.toContain('capture-pixels');
    expect(captureEffectView({ kind: 'capture', phase: 'success' }, orb, 'pixel', 'fire')).not.toContain('capture-pixels');
  });
});
