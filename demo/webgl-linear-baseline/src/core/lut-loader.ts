export interface Lut3DData {
  width: number;
  height: number;
  depth: number;
  format: 'rgb9e5' | 'rgb32f';
  data: Uint32Array | Float32Array;
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function parseTonyDds(bytes: Uint8Array): Lut3DData {
  if (bytes.length < 148) {
    throw new Error('Invalid DDS file: too small');
  }
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== 'DDS ') {
    throw new Error('Invalid DDS file: bad magic');
  }

  const height = readU32(bytes, 12);
  const width = readU32(bytes, 16);
  const depth = readU32(bytes, 24);
  const fourCC = readU32(bytes, 84);
  if (fourCC !== 0x30315844) {
    throw new Error('Unsupported DDS file: expected DX10 extension');
  }

  const dxgiFormat = readU32(bytes, 128);
  const resourceDimension = readU32(bytes, 132);
  if (dxgiFormat !== 67 || resourceDimension !== 4) {
    throw new Error(`Unsupported DDS format: dxgi=${dxgiFormat}, dim=${resourceDimension}`);
  }

  const dataOffset = 148;
  const voxelCount = width * height * depth;
  const expectedBytes = voxelCount * 4;
  if (bytes.length < dataOffset + expectedBytes) {
    throw new Error('Invalid DDS payload size');
  }
  const raw = new Uint32Array(bytes.buffer.slice(bytes.byteOffset + dataOffset, bytes.byteOffset + dataOffset + expectedBytes));
  return {
    width,
    height,
    depth,
    format: 'rgb9e5',
    data: raw
  };
}

function parseSpi3d(text: string): Lut3DData {
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && !x.startsWith('#'));

  if (lines.length < 4 || !lines[0].startsWith('SPILUT')) {
    throw new Error('Invalid SPI3D file');
  }

  const sizeParts = lines[2].split(/\s+/).map((x) => Number(x));
  if (sizeParts.length < 3 || sizeParts.some((x) => !Number.isFinite(x))) {
    throw new Error('Invalid SPI3D dimensions');
  }

  const width = Math.floor(sizeParts[0]);
  const height = Math.floor(sizeParts[1]);
  const depth = Math.floor(sizeParts[2]);
  const voxelCount = width * height * depth;
  const out = new Float32Array(voxelCount * 3);

  let written = 0;
  for (let i = 3; i < lines.length; i += 1) {
    const tokens = lines[i].split(/\s+/).map((x) => Number(x));
    if (tokens.length < 6 || tokens.some((x) => Number.isNaN(x))) {
      continue;
    }
    const x = Math.floor(tokens[0]);
    const y = Math.floor(tokens[1]);
    const z = Math.floor(tokens[2]);
    if (x < 0 || y < 0 || z < 0 || x >= width || y >= height || z >= depth) {
      continue;
    }
    const base = ((z * height + y) * width + x) * 3;
    out[base] = tokens[3];
    out[base + 1] = tokens[4];
    out[base + 2] = tokens[5];
    written += 1;
  }

  if (written !== voxelCount) {
    throw new Error(`Incomplete SPI3D payload: expected ${voxelCount}, got ${written}`);
  }

  return {
    width,
    height,
    depth,
    format: 'rgb32f',
    data: out
  };
}

export async function loadTonyLut(url: string): Promise<Lut3DData> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load Tony LUT: ${url} (${res.status})`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  return parseTonyDds(bytes);
}

export async function loadFlimLut(url: string): Promise<Lut3DData> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load flim LUT: ${url} (${res.status})`);
  }
  return parseSpi3d(await res.text());
}
