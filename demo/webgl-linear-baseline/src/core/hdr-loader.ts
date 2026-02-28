import parseHdr from 'parse-hdr';
import { readExr } from 'hdrify';
import type { FloatImage } from '../types';

export async function loadHdrAsFloatImage(url: string, signal?: AbortSignal): Promise<FloatImage> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load HDR: ${url} (${res.status})`);
  }

  const buffer = await res.arrayBuffer();
  signal?.throwIfAborted();
  const parsed = parseHdr(buffer);

  return {
    width: parsed.shape[0],
    height: parsed.shape[1],
    data: parsed.data
  };
}

export async function loadExrAsFloatImage(url: string, signal?: AbortSignal): Promise<FloatImage> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load EXR: ${url} (${res.status})`);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  signal?.throwIfAborted();
  const decoded = readExr(bytes);
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data
  };
}
