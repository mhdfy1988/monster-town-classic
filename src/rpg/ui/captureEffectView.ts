import type { BattleFeedback } from '../battle/battleFeedback';

export type CaptureEffectStyle = 'classic' | 'pixel';
export type CaptureFeedback = Extract<BattleFeedback, { kind: 'capture' }>;

export const DEFAULT_CAPTURE_EFFECT_STYLE: CaptureEffectStyle = 'pixel';
export const PIXEL_CAPTURE_THROW_DURATION = 2600;

export function resolveCaptureEffectStyle(search: string): CaptureEffectStyle {
  const requested = new URLSearchParams(search).get('captureFx');
  return requested === 'pixel' || requested === 'classic' ? requested : DEFAULT_CAPTURE_EFFECT_STYLE;
}

function baseCaptureEffectView(feedback: CaptureFeedback, orbMarkup: string, particles = '') {
  const burst = feedback.phase === 'break'
    ? '<span class="capture-burst"><i></i><i></i><i></i><i></i><i></i><i></i></span>'
    : '';
  const stars = feedback.phase === 'success'
    ? '<span class="capture-stars"><i>✦</i><i>✦</i><i>✦</i></span>'
    : '';
  return `<span class="capture-shadow"></span><span class="capture-trail"><i></i><i></i><i></i></span><span class="capture-orb"><span class="capture-orb-body">${orbMarkup}<i class="orb-shade"></i><i class="orb-glint"></i><i class="orb-aura"></i></span></span>${particles}${burst}${stars}`;
}

export function classicCaptureEffectView(feedback: CaptureFeedback, orbMarkup: string) {
  return baseCaptureEffectView(feedback, orbMarkup);
}

export function pixelCaptureEffectView(feedback: CaptureFeedback, orbMarkup: string) {
  const particles = feedback.phase === 'throw' || feedback.phase === 'break'
    ? `${feedback.phase === 'throw' ? '<span class="capture-pixel-beam" aria-hidden="true"></span>' : ''}<span class="capture-pixels" aria-hidden="true"></span>`
    : '';
  return baseCaptureEffectView(feedback, orbMarkup, particles);
}

type PixelPoint = { x: number; y: number; color: string; order: number };

function sampledPixelPoints(data: Uint8ClampedArray, width: number, height: number): PixelPoint[] {
  const points: PixelPoint[] = [];
  for (let y = 1; y < height; y += 2) for (let x = 1; x < width; x += 2) {
    const offset = (y * width + x) * 4;
    if (data[offset + 3] < 96) continue;
    points.push({
      x,
      y,
      color: `rgb(${data[offset]} ${data[offset + 1]} ${data[offset + 2]})`,
      order: ((x * 17 + y * 29) % 37) / 37,
    });
  }
  const step = Math.max(1, Math.ceil(points.length / 220));
  return points.filter((_, index) => index % step === 0).slice(0, 220);
}

export async function hydratePixelCaptureEffect(screen: HTMLElement, phase: CaptureFeedback['phase']) {
  const enemy = screen.querySelector<HTMLElement>('.enemy-monster');
  const art = screen.querySelector<HTMLElement>('.enemy-monster .monster-art');
  const svg = art?.querySelector<SVGSVGElement>('svg');
  const source = svg?.querySelector<SVGImageElement>('image')?.getAttribute('href');
  const viewBox = svg?.viewBox.baseVal;
  const orb = screen.querySelector<HTMLElement>('.capture-orb');
  if (!enemy || !art || !orb) return;

  const screenRect = screen.getBoundingClientRect();
  const enemyRect = enemy.getBoundingClientRect();
  // 捕捉失败时怪兽本体正处于缩放返回动画，getBoundingClientRect 会返回变形后的瞬时尺寸。
  // 这里改用不受 transform 影响的布局尺寸，保证投球、摇晃和挣脱共用同一个落点。
  const artRect = {
    left: enemyRect.left - screenRect.left + art.offsetLeft,
    top: enemyRect.top - screenRect.top + art.offsetTop,
    width: art.offsetWidth,
    height: art.offsetHeight,
  };
  const targetX = Math.min(screenRect.width - 42, artRect.left + artRect.width * .72);
  const targetY = Math.min(screenRect.height * .62, artRect.top + artRect.height * .8);
  orb.style.left = `${targetX}px`;
  orb.style.top = `${targetY}px`;
  const shadow = screen.querySelector<HTMLElement>('.capture-shadow');
  if (shadow) {
    shadow.style.left = `${targetX}px`;
    shadow.style.top = `${targetY + 42}px`;
  }
  for (const selector of ['.capture-burst', '.capture-stars']) {
    const decoration = screen.querySelector<HTMLElement>(selector);
    if (decoration) {
      decoration.style.left = `${targetX}px`;
      decoration.style.top = `${targetY}px`;
    }
  }
  const beam = screen.querySelector<HTMLElement>('.capture-pixel-beam');
  if (beam) {
    const sourceX = artRect.left + artRect.width * .46;
    const sourceY = artRect.top + artRect.height * .5;
    beam.style.left = `${sourceX}px`;
    beam.style.top = `${sourceY}px`;
    beam.style.width = `${Math.hypot(targetX - sourceX, targetY - sourceY)}px`;
    beam.style.transform = `translateY(-50%) rotate(${Math.atan2(targetY - sourceY, targetX - sourceX)}rad)`;
  }

  if (phase !== 'throw' && phase !== 'break') return;
  const host = screen.querySelector<HTMLElement>('.capture-pixels');
  if (!host || !source || !viewBox) return;

  const image = new Image();
  image.src = new URL(source, window.location.href).href;
  await image.decode();
  if (!host.isConnected) return;

  const sampleSize = 72;
  const canvas = document.createElement('canvas');
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  context.imageSmoothingEnabled = false;
  context.drawImage(image, viewBox.x, viewBox.y, viewBox.width, viewBox.height, 0, 0, sampleSize, sampleSize);
  const points = sampledPixelPoints(context.getImageData(0, 0, sampleSize, sampleSize).data, sampleSize, sampleSize);
  const mapped = points.map((point) => {
    const x = artRect.left + point.x / sampleSize * artRect.width;
    const y = artRect.top + point.y / sampleSize * artRect.height;
    return { ...point, x, y, distance: Math.hypot(targetX - x, targetY - y) };
  });
  const distances = mapped.map((point) => point.distance);
  const minDistance = Math.min(...distances);
  const distanceRange = Math.max(1, Math.max(...distances) - minDistance);
  host.innerHTML = mapped.map((point, index) => {
    const { x, y } = point;
    const delay = Math.round((point.distance - minDistance) / distanceRange * 700 + point.order * 55);
    const releaseDelay = index % 14 * 9;
    const size = 2 + index % 2;
    const deltaX = targetX - x;
    const deltaY = targetY - y;
    return `<i style="--px:${x.toFixed(1)}px;--py:${y.toFixed(1)}px;--tx:${deltaX.toFixed(1)}px;--ty:${deltaY.toFixed(1)}px;--mx:${(deltaX * .42).toFixed(1)}px;--my:${(deltaY * .42 - 8).toFixed(1)}px;--rx:${(deltaX * .25).toFixed(1)}px;--ry:${(deltaY * .25 - 6).toFixed(1)}px;--ps:${size}px;--pd:${delay}ms;--rd:${releaseDelay}ms;--pc:${point.color}"></i>`;
  }).join('');
}

export function captureEffectView(
  feedback: CaptureFeedback,
  orbMarkup: string,
  style: CaptureEffectStyle,
  _element: unknown,
) {
  return style === 'pixel'
    ? pixelCaptureEffectView(feedback, orbMarkup)
    : classicCaptureEffectView(feedback, orbMarkup);
}
