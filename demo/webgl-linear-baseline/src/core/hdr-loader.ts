import parseHdr from 'parse-hdr';
import type { FloatImage } from '../types';

export async function loadHdrAsFloatImage(url: string): Promise<FloatImage> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load HDR: ${url} (${res.status})`);
  }

  const buffer = await res.arrayBuffer();
  const parsed = parseHdr(buffer);

  return {
    width: parsed.shape[0],
    height: parsed.shape[1],
    data: parsed.data
  };
}
