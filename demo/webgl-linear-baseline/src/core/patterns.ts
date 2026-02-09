import { srgbToLinearChannel } from './color';
import type { FloatImage } from '../types';

function createEmpty(width: number, height: number): FloatImage {
  return {
    width,
    height,
    data: new Float32Array(width * height * 4)
  };
}

function setPixel(img: FloatImage, x: number, y: number, r: number, g: number, b: number, a = 1): void {
  const idx = (y * img.width + x) * 4;
  img.data[idx + 0] = r;
  img.data[idx + 1] = g;
  img.data[idx + 2] = b;
  img.data[idx + 3] = a;
}

export function createRampPattern(width = 1024, height = 256): FloatImage {
  const img = createEmpty(width, height);
  for (let y = 0; y < height; y += 1) {
    const tint = y / Math.max(1, height - 1);
    for (let x = 0; x < width; x += 1) {
      const t = x / Math.max(1, width - 1);
      const value = Math.pow(t, 1.0) * 16.0;
      setPixel(img, x, y, value, value * (0.9 + 0.1 * tint), value * (0.8 + 0.2 * tint));
    }
  }
  return img;
}

export function createStepWedgePattern(width = 1024, height = 256, steps = 12): FloatImage {
  const img = createEmpty(width, height);
  const stepWidth = Math.max(1, Math.floor(width / steps));

  for (let s = 0; s < steps; s += 1) {
    const ev = s - 4;
    const value = Math.pow(2, ev);
    const xStart = s * stepWidth;
    const xEnd = s === steps - 1 ? width : (s + 1) * stepWidth;
    for (let y = 0; y < height; y += 1) {
      for (let x = xStart; x < xEnd; x += 1) {
        setPixel(img, x, y, value, value, value);
      }
    }
  }
  return img;
}

const COLOR_CHECKER_SRGB: Array<[number, number, number]> = [
  [115, 82, 68],
  [194, 150, 130],
  [98, 122, 157],
  [87, 108, 67],
  [133, 128, 177],
  [103, 189, 170],
  [214, 126, 44],
  [80, 91, 166],
  [193, 90, 99],
  [94, 60, 108],
  [157, 188, 64],
  [224, 163, 46],
  [56, 61, 150],
  [70, 148, 73],
  [175, 54, 60],
  [231, 199, 31],
  [187, 86, 149],
  [8, 133, 161],
  [243, 243, 242],
  [200, 200, 200],
  [160, 160, 160],
  [122, 122, 121],
  [85, 85, 85],
  [52, 52, 52]
];

export function createColorCheckerPattern(width = 960, height = 640): FloatImage {
  const img = createEmpty(width, height);
  const cols = 6;
  const rows = 4;
  const patchW = Math.floor(width / cols);
  const patchH = Math.floor(height / rows);

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const index = r * cols + c;
      const [sr, sg, sb] = COLOR_CHECKER_SRGB[index];
      const lr = srgbToLinearChannel(sr / 255);
      const lg = srgbToLinearChannel(sg / 255);
      const lb = srgbToLinearChannel(sb / 255);

      const xStart = c * patchW;
      const xEnd = c === cols - 1 ? width : (c + 1) * patchW;
      const yStart = r * patchH;
      const yEnd = r === rows - 1 ? height : (r + 1) * patchH;

      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          setPixel(img, x, y, lr, lg, lb);
        }
      }
    }
  }

  return img;
}

function gaussian2d(x: number, y: number, cx: number, cy: number, sigma: number): number {
  const dx = x - cx;
  const dy = y - cy;
  const d2 = dx * dx + dy * dy;
  return Math.exp(-d2 / (2 * sigma * sigma));
}

export function createHighlightStressPattern(width = 1024, height = 512): FloatImage {
  const img = createEmpty(width, height);

  const spots = [
    { cx: width * 0.25, cy: height * 0.45, intensity: 8, sigma: 24 },
    { cx: width * 0.5, cy: height * 0.5, intensity: 24, sigma: 36 },
    { cx: width * 0.75, cy: height * 0.4, intensity: 64, sigma: 28 }
  ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / Math.max(1, width - 1);
      const ny = y / Math.max(1, height - 1);

      let r = 0.01 + 0.02 * nx;
      let g = 0.01 + 0.015 * ny;
      let b = 0.02;

      for (const spot of spots) {
        const w = gaussian2d(x, y, spot.cx, spot.cy, spot.sigma) * spot.intensity;
        r += w;
        g += w * 0.9;
        b += w * 0.8;
      }

      if ((x + y) % 64 < 2) {
        r *= 1.2;
        g *= 1.2;
        b *= 1.2;
      }

      setPixel(img, x, y, r, g, b);
    }
  }

  return img;
}
