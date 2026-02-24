import type {
  OperatorParamState,
  TonemapOperator,
  TonemapParams,
  TonemapParamValue
} from '../types';

export type ParamControlType = 'slider' | 'toggle' | 'select';

export interface ParamOption {
  label: string;
  value: string;
}

export interface ParamDescriptor {
  key: string;
  label: string;
  type: ParamControlType;
  min?: number;
  max?: number;
  step?: number;
  options?: ParamOption[];
}

export interface OperatorDescriptor {
  id: TonemapOperator;
  label: string;
  params: ParamDescriptor[];
  defaults: TonemapParams;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function asNumber(value: TonemapParamValue | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: TonemapParamValue | undefined, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function asString(value: TonemapParamValue | undefined, fallback: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return fallback;
}

const flimPresetOptions: ParamOption[] = [
  { label: 'default', value: 'default' },
  { label: 'nostalgia', value: 'nostalgia' },
  { label: 'silver', value: 'silver' }
];

export const OPERATOR_DESCRIPTORS: OperatorDescriptor[] = [
  { id: 'none', label: 'None (Linear)', params: [], defaults: {} },
  { id: 'acesFitted', label: 'ACES Fitted', params: [], defaults: {} },
  {
    id: 'reinhard',
    label: 'Reinhard',
    params: [
      { key: 'whitePoint', label: 'White Point', type: 'slider', min: 1.0, max: 32.0, step: 0.1 },
      { key: 'luminanceOnly', label: 'Luminance Only', type: 'toggle' }
    ],
    defaults: { whitePoint: 4.0, luminanceOnly: true }
  },
  { id: 'agx', label: 'AgX', params: [], defaults: {} },
  {
    id: 'agxGolden',
    label: 'AgX Golden',
    params: [{ key: 'lookMix', label: 'Look Mix', type: 'slider', min: 0, max: 1, step: 0.01 }],
    defaults: { lookMix: 1.0 }
  },
  {
    id: 'agxPunchy',
    label: 'AgX Punchy',
    params: [{ key: 'lookMix', label: 'Look Mix', type: 'slider', min: 0, max: 1, step: 0.01 }],
    defaults: { lookMix: 1.0 }
  },
  {
    id: 'uchimura',
    label: 'Uchimura / Gran Turismo',
    params: [
      { key: 'P', label: 'P', type: 'slider', min: 0.5, max: 4, step: 0.01 },
      { key: 'a', label: 'a', type: 'slider', min: 0.1, max: 2, step: 0.01 },
      { key: 'm', label: 'm', type: 'slider', min: 0.01, max: 0.8, step: 0.01 },
      { key: 'l', label: 'l', type: 'slider', min: 0.01, max: 1.0, step: 0.01 },
      { key: 'c', label: 'c', type: 'slider', min: 0.1, max: 3.0, step: 0.01 },
      { key: 'b', label: 'b', type: 'slider', min: -0.2, max: 0.2, step: 0.01 }
    ],
    defaults: { P: 1.0, a: 1.0, m: 0.22, l: 0.4, c: 1.33, b: 0.0 }
  },
  {
    id: 'hejl',
    label: 'Hejl',
    params: [{ key: 'whitePoint', label: 'White Point', type: 'slider', min: 0.5, max: 2.0, step: 0.01 }],
    defaults: { whitePoint: 1.0 }
  },
  {
    id: 'gt7',
    label: 'GT7',
    params: [
      { key: 'peakNits', label: 'Peak Nits', type: 'slider', min: 250, max: 4000, step: 10 },
      { key: 'alpha', label: 'Alpha', type: 'slider', min: 0.05, max: 1.0, step: 0.005 },
      { key: 'midPoint', label: 'Mid Point', type: 'slider', min: 0.1, max: 1.0, step: 0.001 },
      { key: 'linearSection', label: 'Linear Section', type: 'slider', min: 0.05, max: 1.0, step: 0.001 },
      { key: 'toeStrength', label: 'Toe Strength', type: 'slider', min: 0.5, max: 2.0, step: 0.01 },
      { key: 'blendRatio', label: 'Blend Ratio', type: 'slider', min: 0.0, max: 1.0, step: 0.01 },
      { key: 'fadeStart', label: 'Fade Start', type: 'slider', min: 0.6, max: 1.2, step: 0.01 },
      { key: 'fadeEnd', label: 'Fade End', type: 'slider', min: 0.7, max: 1.4, step: 0.01 }
    ],
    defaults: {
      peakNits: 1000.0,
      alpha: 0.25,
      midPoint: 0.538,
      linearSection: 0.444,
      toeStrength: 1.28,
      blendRatio: 0.6,
      fadeStart: 0.98,
      fadeEnd: 1.16
    }
  },
  {
    id: 'tonyMcMapface',
    label: 'Tony McMapface',
    params: [{ key: 'lutStrength', label: 'LUT Strength', type: 'slider', min: 0.0, max: 1.0, step: 0.01 }],
    defaults: { lutStrength: 1.0 }
  },
  {
    id: 'flim',
    label: 'Flim by Bean',
    params: [
      { key: 'preset', label: 'Preset', type: 'select', options: flimPresetOptions },
      { key: 'lutStrength', label: 'LUT Strength', type: 'slider', min: 0.0, max: 1.0, step: 0.01 }
    ],
    defaults: { preset: 'default', lutStrength: 1.0 }
  },
  {
    id: 'amdLpm',
    label: 'AMD LPM',
    params: [
      { key: 'hdrMax', label: 'HDR Max', type: 'slider', min: 32, max: 2000, step: 1 },
      { key: 'exposureStops', label: 'Exposure Stops', type: 'slider', min: 0, max: 16, step: 0.1 },
      { key: 'contrast', label: 'Contrast', type: 'slider', min: 0.0, max: 1.0, step: 0.01 },
      { key: 'shoulderContrast', label: 'Shoulder Contrast', type: 'slider', min: 0.25, max: 2.0, step: 0.01 },
      { key: 'saturation', label: 'Saturation', type: 'slider', min: -1.0, max: 1.0, step: 0.01 },
      { key: 'crosstalk', label: 'Crosstalk', type: 'slider', min: 0.01, max: 1.0, step: 0.01 },
      { key: 'softGap', label: 'Soft Gap', type: 'slider', min: 0.001, max: 0.1, step: 0.001 }
    ],
    defaults: {
      hdrMax: 256,
      exposureStops: 10,
      contrast: 0.25,
      shoulderContrast: 1.0,
      saturation: 0.0,
      crosstalk: 0.5,
      softGap: 0.01
    }
  }
];

export const OPERATOR_ORDER: TonemapOperator[] = OPERATOR_DESCRIPTORS.map((x) => x.id);

const descriptorMap = new Map<TonemapOperator, OperatorDescriptor>(
  OPERATOR_DESCRIPTORS.map((x) => [x.id, x] as const)
);

export function getOperatorDescriptor(op: TonemapOperator): OperatorDescriptor {
  const d = descriptorMap.get(op);
  if (!d) {
    throw new Error(`Unknown operator: ${String(op)}`);
  }
  return d;
}

export function createDefaultOperatorParamState(): OperatorParamState {
  const out = {} as OperatorParamState;
  for (const item of OPERATOR_DESCRIPTORS) {
    out[item.id] = { ...item.defaults };
  }
  return out;
}

export function mergeParamState(base: OperatorParamState, partial?: Partial<OperatorParamState>): OperatorParamState {
  const out = createDefaultOperatorParamState();
  for (const op of OPERATOR_ORDER) {
    out[op] = { ...out[op], ...base[op], ...(partial?.[op] ?? {}) };
  }
  return out;
}

export function cloneParamState(state: OperatorParamState): OperatorParamState {
  const out = {} as OperatorParamState;
  for (const op of OPERATOR_ORDER) {
    out[op] = { ...state[op] };
  }
  return out;
}

function flimPresetToIndex(value: string): number {
  if (value === 'nostalgia') {
    return 1;
  }
  if (value === 'silver') {
    return 2;
  }
  return 0;
}

export function packOperatorParams(op: TonemapOperator, params: TonemapParams): Float32Array {
  const packed = new Float32Array(16);
  switch (op) {
    case 'reinhard': {
      packed[0] = clamp(asNumber(params.whitePoint, 4.0), 1.0, 32.0);
      packed[1] = asBoolean(params.luminanceOnly, true) ? 1.0 : 0.0;
      break;
    }
    case 'agxGolden':
    case 'agxPunchy': {
      packed[0] = clamp(asNumber(params.lookMix, 1.0), 0.0, 1.0);
      break;
    }
    case 'uchimura': {
      packed[0] = clamp(asNumber(params.P, 1.0), 0.5, 4.0);
      packed[1] = clamp(asNumber(params.a, 1.0), 0.1, 2.0);
      packed[2] = clamp(asNumber(params.m, 0.22), 0.01, 0.8);
      packed[3] = clamp(asNumber(params.l, 0.4), 0.01, 1.0);
      packed[4] = clamp(asNumber(params.c, 1.33), 0.1, 3.0);
      packed[5] = clamp(asNumber(params.b, 0.0), -0.2, 0.2);
      break;
    }
    case 'hejl': {
      packed[0] = clamp(asNumber(params.whitePoint, 1.0), 0.5, 2.0);
      break;
    }
    case 'gt7': {
      packed[0] = clamp(asNumber(params.peakNits, 1000.0), 250.0, 4000.0);
      packed[1] = clamp(asNumber(params.alpha, 0.25), 0.05, 1.0);
      packed[2] = clamp(asNumber(params.midPoint, 0.538), 0.1, 1.0);
      packed[3] = clamp(asNumber(params.linearSection, 0.444), 0.05, 1.0);
      packed[4] = clamp(asNumber(params.toeStrength, 1.28), 0.5, 2.0);
      packed[5] = clamp(asNumber(params.blendRatio, 0.6), 0.0, 1.0);
      packed[6] = clamp(asNumber(params.fadeStart, 0.98), 0.6, 1.2);
      packed[7] = clamp(asNumber(params.fadeEnd, 1.16), 0.7, 1.4);
      break;
    }
    case 'tonyMcMapface': {
      packed[0] = clamp(asNumber(params.lutStrength, 1.0), 0.0, 1.0);
      break;
    }
    case 'flim': {
      packed[0] = flimPresetToIndex(asString(params.preset, 'default'));
      packed[1] = clamp(asNumber(params.lutStrength, 1.0), 0.0, 1.0);
      break;
    }
    case 'amdLpm': {
      packed[0] = clamp(asNumber(params.hdrMax, 256.0), 32.0, 2000.0);
      packed[1] = clamp(asNumber(params.exposureStops, 10.0), 0.0, 16.0);
      packed[2] = clamp(asNumber(params.contrast, 0.25), 0.0, 1.0);
      packed[3] = clamp(asNumber(params.shoulderContrast, 1.0), 0.25, 2.0);
      packed[4] = clamp(asNumber(params.saturation, 0.0), -1.0, 1.0);
      packed[5] = clamp(asNumber(params.crosstalk, 0.5), 0.01, 1.0);
      packed[6] = clamp(asNumber(params.softGap, 0.01), 0.001, 0.1);
      break;
    }
    default:
      break;
  }
  return packed;
}
