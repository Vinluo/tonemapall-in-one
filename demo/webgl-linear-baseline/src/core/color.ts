export function applyExposure(value: number, exposureEv: number): number {
  return value * Math.pow(2, exposureEv);
}

export function linearToSrgbChannel(v: number): number {
  const x = Math.max(0, v);
  if (x <= 0.0031308) {
    return 12.92 * x;
  }
  return 1.055 * Math.pow(x, 1.0 / 2.4) - 0.055;
}

export function computeLuminance(r: number, g: number, b: number): number {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

export function srgbToLinearChannel(v: number): number {
  const x = Math.min(1, Math.max(0, v));
  if (x <= 0.04045) {
    return x / 12.92;
  }
  return Math.pow((x + 0.055) / 1.055, 2.4);
}
