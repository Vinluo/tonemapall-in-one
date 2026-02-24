import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPersistedState,
  readStateFromStorage,
  readStateFromUrl,
  writeState,
  type PersistedDemoState
} from '../core/state-persistence';
import { createDefaultOperatorParamState } from '../tonemap/operator-registry';

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function makeState(): PersistedDemoState {
  return {
    input: 'ramp',
    view: 'srgbPreview',
    exposure: 0.5,
    tonemapA: 'agx',
    tonemapB: 'acesFitted',
    compareMode: 'splitAB',
    split: 0.4,
    inputColorSpace: 'linearSrgb',
    paramsA: createDefaultOperatorParamState(),
    paramsB: createDefaultOperatorParamState(),
    panelVisible: true
  };
}

describe('state persistence', () => {
  beforeEach(() => {
    const store = new MemoryStorage();
    const historyState = { href: 'https://example.test/demo' };
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: { href: historyState.href },
        localStorage: store,
        history: {
          replaceState: (_a: unknown, _b: string, url: string): void => {
            historyState.href = url;
            (globalThis.window as Window & typeof globalThis).location.href = url;
          }
        }
      },
      writable: true
    });
  });

  it('writes and reads from storage', () => {
    const state = makeState();
    writeState(state);
    const loaded = readStateFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded?.tonemapA).toBe('agx');
    expect(loaded?.compareMode).toBe('splitAB');
  });

  it('writes and reads from url query', () => {
    const state = makeState();
    writeState(state);
    const loaded = readStateFromUrl();
    expect(loaded).not.toBeNull();
    expect(loaded?.tonemapB).toBe('acesFitted');
    expect(loaded?.panelVisible).toBe(true);
  });

  it('clears both local storage and url state', () => {
    writeState(makeState());
    clearPersistedState();
    expect(readStateFromStorage()).toBeNull();
    expect(readStateFromUrl()).toBeNull();
  });
});
