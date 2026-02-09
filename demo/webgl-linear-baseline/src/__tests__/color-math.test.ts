import { describe, expect, it } from 'vitest';
import {
  applyExposure,
  computeLuminance,
  linearToSrgbChannel,
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
});
