import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { loadHdrAsFloatImage, loadExrAsFloatImage } from '../core/hdr-loader';

// Minimal Float32Array stub that parse-hdr would return
const fakeHdrData = new Float32Array([0.1, 0.2, 0.3, 1.0]);
const fakeExrData = new Float32Array([0.4, 0.5, 0.6, 1.0]);

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((_url: string, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal | undefined;

      return new Promise<Response>((resolve, reject) => {
        if (signal?.aborted) {
          reject(signal.reason ?? new DOMException('AbortError', 'AbortError'));
          return;
        }
        const onAbort = (): void => {
          reject(signal!.reason ?? new DOMException('AbortError', 'AbortError'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });

        // Resolve asynchronously so abort can fire first in tests
        setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          if (signal?.aborted) {
            reject(signal.reason ?? new DOMException('AbortError', 'AbortError'));
            return;
          }
          resolve({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(4)
          } as unknown as Response);
        }, 0);
      });
    })
  );

  vi.mock('parse-hdr', () => ({
    default: (_buf: ArrayBuffer) => ({ shape: [1, 1], data: fakeHdrData })
  }));

  vi.mock('hdrify', () => ({
    readExr: (_bytes: Uint8Array) => ({ width: 1, height: 1, data: fakeExrData })
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('loadHdrAsFloatImage', () => {
  it('resolves with parsed image data', async () => {
    const img = await loadHdrAsFloatImage('fake.hdr');
    expect(img.width).toBe(1);
    expect(img.height).toBe(1);
  });

  it('rejects when AbortSignal is already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(loadHdrAsFloatImage('fake.hdr', ctrl.signal)).rejects.toBeDefined();
  });

  it('rejects when AbortSignal is aborted mid-flight', async () => {
    const ctrl = new AbortController();
    const promise = loadHdrAsFloatImage('fake.hdr', ctrl.signal);
    ctrl.abort();
    await expect(promise).rejects.toBeDefined();
  });
});

describe('loadExrAsFloatImage', () => {
  it('resolves with parsed image data', async () => {
    const img = await loadExrAsFloatImage('fake.exr');
    expect(img.width).toBe(1);
    expect(img.height).toBe(1);
  });

  it('rejects when AbortSignal is already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(loadExrAsFloatImage('fake.exr', ctrl.signal)).rejects.toBeDefined();
  });

  it('rejects when AbortSignal is aborted mid-flight', async () => {
    const ctrl = new AbortController();
    const promise = loadExrAsFloatImage('fake.exr', ctrl.signal);
    ctrl.abort();
    await expect(promise).rejects.toBeDefined();
  });
});
