import { describe, expect, it } from 'vitest';
import {
  createColorCheckerPattern,
  createHighlightStressPattern,
  createRampPattern,
  createStepWedgePattern
} from '../core/patterns';

describe('pattern generation', () => {
  it('creates ramp with HDR headroom', () => {
    const img = createRampPattern(32, 8);
    const first = img.data[0];
    const last = img.data[(img.width - 1) * 4];

    expect(img.width).toBe(32);
    expect(img.height).toBe(8);
    expect(first).toBeCloseTo(0, 6);
    expect(last).toBeGreaterThan(15.0);
  });

  it('creates monotonic step wedge', () => {
    const steps = 8;
    const img = createStepWedgePattern(80, 10, steps);
    const stepValues: number[] = [];

    for (let i = 0; i < steps; i += 1) {
      const x = Math.floor((i + 0.5) * (img.width / steps));
      const idx = x * 4;
      stepValues.push(img.data[idx]);
    }

    for (let i = 1; i < stepValues.length; i += 1) {
      expect(stepValues[i]).toBeGreaterThanOrEqual(stepValues[i - 1]);
    }
  });

  it('creates color checker patches', () => {
    const img = createColorCheckerPattern(120, 80);
    expect(img.data.length).toBe(120 * 80 * 4);
    const mid = ((40 * img.width + 60) * 4);
    expect(img.data[mid + 0]).toBeGreaterThan(0);
    expect(img.data[mid + 1]).toBeGreaterThan(0);
    expect(img.data[mid + 2]).toBeGreaterThan(0);
  });

  it('creates highlight stress with strong peaks', () => {
    const img = createHighlightStressPattern(256, 128);
    let maxV = 0;
    for (let i = 0; i < img.data.length; i += 4) {
      maxV = Math.max(maxV, img.data[i], img.data[i + 1], img.data[i + 2]);
    }
    expect(maxV).toBeGreaterThan(20);
  });
});
