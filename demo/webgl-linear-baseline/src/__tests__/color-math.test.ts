import { describe, expect, it } from 'vitest';
import {
  acesCgToLinearSrgb,
  acesFittedChannel,
  agxChannel,
  agxPunchyChannel,
  applyExposure,
  computeLuminance,
  linearToSrgbChannel,
  reinhardChannel,
  srgbToLinearChannel
} from '../core/color';

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

  it('aces fitted channel keeps value in range and is monotonic on sample points', () => {
    const sample = [0, 0.18, 1, 2, 4, 8, 16].map((v) => acesFittedChannel(v));
    for (const v of sample) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < sample.length; i += 1) {
      expect(sample[i]).toBeGreaterThanOrEqual(sample[i - 1]);
    }
  });

  it('reinhard channel compresses highlights and is monotonic', () => {
    const sample = [0, 0.18, 1, 2, 4, 8, 16].map((v) => reinhardChannel(v));
    expect(sample[0]).toBeCloseTo(0, 6);
    expect(sample[2]).toBeCloseTo(0.5, 6);
    for (const v of sample) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < sample.length; i += 1) {
      expect(sample[i]).toBeGreaterThanOrEqual(sample[i - 1]);
    }
  });

  it('agx channel keeps values bounded and monotonic on sample points', () => {
    const sample = [0, 0.001, 0.18, 1, 2, 4, 8, 16].map((v) => agxChannel(v));
    for (const v of sample) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < sample.length; i += 1) {
      expect(sample[i]).toBeGreaterThanOrEqual(sample[i - 1]);
    }
  });

  it('agx punchy channel stays bounded and monotonic', () => {
    const sample = [0, 0.001, 0.18, 1, 2, 4, 8, 16].map((v) => agxPunchyChannel(v));
    for (const v of sample) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < sample.length; i += 1) {
      expect(sample[i]).toBeGreaterThanOrEqual(sample[i - 1]);
    }
  });

  it('acescg to linear srgb keeps neutral close to neutral', () => {
    const [r, g, b] = acesCgToLinearSrgb(1, 1, 1);
    expect(r).toBeCloseTo(g, 3);
    expect(g).toBeCloseTo(b, 3);
  });
});
