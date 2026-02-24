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

export function acesFittedChannel(v: number): number {
  const x = Math.max(0, v);
  const num = x * (2.51 * x + 0.03);
  const den = x * (2.43 * x + 0.59) + 0.14;
  return Math.min(1, Math.max(0, num / den));
}

export function reinhardChannel(v: number): number {
  const x = Math.max(0, v);
  return x / (1 + x);
}

const AGX_MIN_EV = -12.47393;
const AGX_MAX_EV = 4.026069;

function agxDefaultContrastApproxChannel(x: number): number {
  const x2 = x * x;
  const x4 = x2 * x2;
  return (
    15.5 * x4 * x2 -
    40.14 * x4 * x +
    31.96 * x4 -
    6.868 * x2 * x +
    0.4298 * x2 +
    0.1191 * x -
    0.00232
  );
}

export function agxChannel(v: number): number {
  const x = Math.max(1e-10, v);
  const encoded = (Math.min(AGX_MAX_EV, Math.max(AGX_MIN_EV, Math.log2(x))) - AGX_MIN_EV) / (AGX_MAX_EV - AGX_MIN_EV);
  const curved = agxDefaultContrastApproxChannel(Math.min(1, Math.max(0, encoded)));
  return Math.min(1, Math.max(0, Math.pow(Math.max(0, curved), 2.2)));
}

export function agxPunchyChannel(v: number): number {
  const base = agxChannel(v);
  return Math.min(1, Math.max(0, Math.pow(base, 1.35)));
}

export function acesCgToLinearSrgb(r: number, g: number, b: number): [number, number, number] {
  const sr = 1.7048586763 * r - 0.6217160219 * g - 0.0832993717 * b;
  const sg = -0.1300768242 * r + 1.1407357748 * g - 0.0105598017 * b;
  const sb = -0.0239640729 * r - 0.1289755083 * g + 1.1530140189 * b;
  return [sr, sg, sb];
}

export function srgbToLinearChannel(v: number): number {
  const x = Math.min(1, Math.max(0, v));
  if (x <= 0.04045) {
    return x / 12.92;
  }
  return Math.pow((x + 0.055) / 1.055, 2.4);
}
