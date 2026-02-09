declare module 'parse-hdr' {
  export interface ParsedHdr {
    shape: [number, number];
    exposure: number;
    gamma: number;
    data: Float32Array;
  }

  export default function parseHdr(buffer: ArrayBuffer | Uint8Array): ParsedHdr;
}
