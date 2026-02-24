import { describe, expect, it } from 'vitest';
import {
  createDefaultOperatorParamState,
  getOperatorDescriptor,
  OPERATOR_ORDER,
  packOperatorParams
} from '../tonemap/operator-registry';

describe('operator registry', () => {
  it('provides defaults for all operators', () => {
    const state = createDefaultOperatorParamState();
    for (const op of OPERATOR_ORDER) {
      expect(state[op]).toBeDefined();
    }
  });

  it('descriptors and defaults are aligned', () => {
    const state = createDefaultOperatorParamState();
    for (const op of OPERATOR_ORDER) {
      const descriptor = getOperatorDescriptor(op);
      for (const key of descriptor.params.map((x) => x.key)) {
        expect(key in state[op]).toBe(true);
      }
    }
  });

  it('pack result is fixed 16-float layout', () => {
    const state = createDefaultOperatorParamState();
    for (const op of OPERATOR_ORDER) {
      const packed = packOperatorParams(op, state[op]);
      expect(packed).toHaveLength(16);
    }
  });

  it('flim preset packing maps to stable preset indices', () => {
    const pDefault = packOperatorParams('flim', { preset: 'default', lutStrength: 1 });
    const pNostalgia = packOperatorParams('flim', { preset: 'nostalgia', lutStrength: 1 });
    const pSilver = packOperatorParams('flim', { preset: 'silver', lutStrength: 1 });
    expect(pDefault[0]).toBe(0);
    expect(pNostalgia[0]).toBe(1);
    expect(pSilver[0]).toBe(2);
  });
});
