import { describe, expect, it } from 'vitest';
import {
  acesCgToLinearSrgb,
  acesFittedChannel,
  agxChannel,
  agxPunchyChannel,
  amdLpmApproxChannel,
  applyExposure,
  computeLuminance,
  flimLogEncodeChannel,
  gt7CurveChannel,
  hejlChannel,
  linearToSrgbChannel,
  reinhardChannel,
  reinhardExtendedChannel,
  srgbToLinearChannel,
  uchimuraChannel
} from '../core/color';

function assertMonotonic(samples: number[]): void {
  for (let i = 1; i < samples.length; i += 1) {
    expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
  }
}

describe('color math', () => {
  it('applies exposure in EV', () => {
    expect(applyExposure(1, 0)).toBeCloseTo(1, 6);
    expect(applyExposure(1, 1)).toBeCloseTo(2, 6);
    expect(applyExposure(4, -1)).toBeCloseTo(2, 6);
  });

  it('computes Rec709 luminance', () => {
    expect(computeLuminance(1, 1, 1)).toBeCloseTo(1, 6);
    expect(computeLuminance(1, 0, 0)).toBeCloseTo(0.2126, 6);
  });

  it('converts linear to srgb boundaries', () => {
    expect(linearToSrgbChannel(0)).toBeCloseTo(0, 6);
    expect(linearToSrgbChannel(1)).toBeCloseTo(1, 6);
  });

  it('srgb to linear roundtrip on representative value', () => {
    const srgb = 0.5;
    const linear = srgbToLinearChannel(srgb);
    const back = linearToSrgbChannel(linear);
    expect(back).toBeCloseTo(srgb, 4);
  });

  it('aces fitted channel keeps value in range and monotonic', () => {
    const sample = [0, 0.18, 1, 2, 4, 8, 16].map((v) => acesFittedChannel(v));
    for (const v of sample) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    assertMonotonic(sample);
  });

  it('reinhard channel compresses highlights', () => {
    const sample = [0, 0.18, 1, 2, 4, 8, 16].map((v) => reinhardChannel(v));
    expect(sample[2]).toBeCloseTo(0.5, 6);
    assertMonotonic(sample);
  });

  it('reinhard extended channel is monotonic', () => {
    const sample = [0, 0.18, 1, 2, 4, 8, 16].map((v) => reinhardExtendedChannel(v, 4));
    assertMonotonic(sample);
  });

  it('agx channel keeps values bounded and monotonic', () => {
    const sample = [0, 0.001, 0.18, 1, 2, 4, 8, 16].map((v) => agxChannel(v));
    for (const v of sample) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    assertMonotonic(sample);
  });

  it('agx punchy channel stays bounded and monotonic', () => {
    const sample = [0, 0.001, 0.18, 1, 2, 4, 8, 16].map((v) => agxPunchyChannel(v));
    for (const v of sample) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    assertMonotonic(sample);
  });

  it('uchimura channel is monotonic on sample points', () => {
    const sample = [0, 0.02, 0.18, 0.5, 1, 2, 4].map((v) => uchimuraChannel(v));
    assertMonotonic(sample);
  });

  it('hejl channel is monotonic and bounded near [0,1]', () => {
    const sample = [0, 0.02, 0.18, 0.5, 1, 2, 4].map((v) => hejlChannel(v, 1));
    assertMonotonic(sample);
    expect(sample[0]).toBeGreaterThanOrEqual(0);
    expect(sample[sample.length - 1]).toBeLessThanOrEqual(1.25);
  });

  it('gt7 curve channel is monotonic on key sample points', () => {
    const sample = [0, 0.05, 0.18, 0.5, 1, 2, 4].map((v) => gt7CurveChannel(v));
    assertMonotonic(sample);
  });

  it('amd lpm approx channel remains bounded and compresses highlights', () => {
    const sample = [0, 0.05, 0.18, 0.5, 1, 2, 4, 8].map((v) => amdLpmApproxChannel(v));
    for (const v of sample) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(2);
    }
    expect(sample[sample.length - 1]).toBeLessThan(1);
  });

  it('flim log encode is monotonic and bounded', () => {
    const sample = [0, 0.001, 0.01, 0.18, 1, 4, 16].map((v) => flimLogEncodeChannel(v));
    for (const v of sample) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    assertMonotonic(sample);
  });

  it('acescg to linear srgb keeps neutral close to neutral', () => {
    const [r, g, b] = acesCgToLinearSrgb(1, 1, 1);
    expect(r).toBeCloseTo(g, 3);
    expect(g).toBeCloseTo(b, 3);
  });
});
