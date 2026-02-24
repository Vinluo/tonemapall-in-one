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

export function srgbToLinearChannel(v: number): number {
  const x = Math.min(1, Math.max(0, v));
  if (x <= 0.04045) {
    return x / 12.92;
  }
  return Math.pow((x + 0.055) / 1.055, 2.4);
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

export function reinhardExtendedChannel(v: number, whitePoint = 4): number {
  const x = Math.max(0, v);
  const wp2 = whitePoint * whitePoint;
  return (x * (1 + x / wp2)) / (1 + x);
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

export function hejlChannel(v: number, whitePoint = 1): number {
  const x = Math.max(0, v - 0.004);
  const mapped = (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
  const w = Math.max(0, whitePoint - 0.004);
  const white = (w * (6.2 * w + 0.5)) / (w * (6.2 * w + 1.7) + 0.06);
  return mapped / Math.max(1e-6, white);
}

export function uchimuraChannel(
  x: number,
  P = 1.0,
  a = 1.0,
  m = 0.22,
  l = 0.4,
  c = 1.33,
  b = 0.0
): number {
  const xv = Math.max(0, x);
  const l0 = ((P - m) * l) / a;
  const S0 = m + l0;
  const S1 = m + a * l0;
  const C2 = (a * P) / (P - S1);
  const CP = -C2 / P;

  const w0 = 1.0 - smoothstep(0.0, m, xv);
  const w2 = xv >= m + l0 ? 1.0 : 0.0;
  const w1 = 1.0 - w0 - w2;

  const T = m * Math.pow(xv / Math.max(1e-6, m), c) + b;
  const S = P - (P - S1) * Math.exp(CP * (xv - S0));
  const L = m + a * (xv - m);
  return T * w0 + L * w1 + S * w2;
}

export function gt7CurveChannel(
  x: number,
  peak = 1000,
  alpha = 0.25,
  midPoint = 0.538,
  linearSection = 0.444,
  toeStrength = 1.28
): number {
  if (x < 0) {
    return 0;
  }
  const peakFb = peak / 100.0;
  const denom = Math.abs(alpha - 1) < 1e-6 ? (alpha < 1 ? -1e-6 : 1e-6) : alpha - 1;
  const k0 = (linearSection - 1) / denom;
  const k = Math.abs(k0) < 1e-6 ? (k0 < 0 ? -1e-6 : 1e-6) : k0;
  const kA = peakFb * linearSection + peakFb * k;
  const kB = -peakFb * k * Math.exp(linearSection / k);
  const kC = -1 / (k * peakFb);
  const linearWeight = smoothstep(0, midPoint, x);
  const toe = midPoint * Math.pow(Math.max(0, x / Math.max(1e-6, midPoint)), toeStrength);
  const mixed = toe * (1 - linearWeight) + x * linearWeight;
  const shoulder = kA + kB * Math.exp(x * kC);
  return x < linearSection * peakFb ? mixed : shoulder;
}

export function amdLpmApproxChannel(v: number, hdrMax = 256, exposureStops = 10, contrast = 0.25, shoulderContrast = 1): number {
  const x = Math.max(0, v);
  const contrast1 = contrast + 1;
  const midIn = hdrMax * 0.18 * 2 ** (-exposureStops);
  const midOut = 0.18;
  const cs = contrast1 * Math.max(1e-6, shoulderContrast);

  const z0 = -Math.pow(midIn, contrast1);
  const z1 = Math.pow(hdrMax, cs) * Math.pow(midIn, contrast1);
  const z2 = Math.pow(hdrMax, contrast1) * Math.pow(midIn, cs) * midOut;
  const z3 = Math.pow(hdrMax, cs) * midOut;
  const z4 = Math.pow(midIn, cs) * midOut;
  const toneScaleBiasX = -((z0 + (midOut * (z1 - z2)) / Math.max(1e-6, z3 - z4)) / Math.max(1e-6, z4));

  const w0 = Math.pow(hdrMax, cs) * Math.pow(midIn, contrast1);
  const w1 = Math.pow(hdrMax, contrast1) * Math.pow(midIn, cs) * midOut;
  const w2 = Math.pow(hdrMax, cs) * midOut;
  const w3 = Math.pow(midIn, cs) * midOut;
  const toneScaleBiasY = (w0 - w1) / Math.max(1e-6, w2 - w3);

  const ratio = Math.max(0, Math.min(1, x / Math.max(1e-6, x)));
  const satRatio = Math.pow(ratio, contrast1);
  let luma = Math.pow(Math.max(1e-6, x), contrast1);
  const lumaShoulder = Math.abs(shoulderContrast - 1) > 1e-6 ? Math.pow(luma, shoulderContrast) : luma;
  luma = luma / Math.max(1e-6, lumaShoulder * toneScaleBiasX + toneScaleBiasY);
  const ratioScale = Math.max(0, Math.min(1, luma / Math.max(1e-6, satRatio)));
  return Math.max(0, Math.min(1, satRatio * ratioScale));
}

export function flimLogEncodeChannel(v: number): number {
  const logMin = -10;
  const logMax = 10;
  const offset = Math.pow(2, logMin);
  const x = Math.max(0, v) + offset;
  const y = Math.log2(x);
  return Math.min(1, Math.max(0, (y - logMin) / (logMax - logMin)));
}

export function acesCgToLinearSrgb(r: number, g: number, b: number): [number, number, number] {
  const sr = 1.7048586763 * r - 0.6217160219 * g - 0.0832993717 * b;
  const sg = -0.1300768242 * r + 1.1407357748 * g - 0.0105598017 * b;
  const sb = -0.0239640729 * r - 0.1289755083 * g + 1.1530140189 * b;
  return [sr, sg, sb];
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / Math.max(1e-6, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
