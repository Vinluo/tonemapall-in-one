import type {
  CompareMode,
  InputColorSpace,
  InputSource,
  OperatorParamState,
  TonemapOperator,
  ViewMode
} from '../types';
import { cloneParamState } from '../tonemap/operator-registry';

const STORAGE_KEY = 'webgl-linear-baseline:state:v2';

export interface PersistedDemoState {
  input: InputSource;
  view: ViewMode;
  exposure: number;
  tonemapA: TonemapOperator;
  tonemapB: TonemapOperator;
  compareMode: CompareMode;
  split: number;
  inputColorSpace: InputColorSpace;
  paramsA: OperatorParamState;
  paramsB: OperatorParamState;
  panelVisible: boolean;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let base64: string;
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    let raw = '';
    for (let i = 0; i < bytes.length; i += 1) {
      raw += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(raw);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(encoded: string): string {
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  if (typeof Buffer !== 'undefined') {
    return new TextDecoder().decode(Buffer.from(normalized + padding, 'base64'));
  }
  const raw = atob(normalized + padding);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function safeParse(value: string): PersistedDemoState | null {
  try {
    const parsed = JSON.parse(value) as PersistedDemoState;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (!parsed.paramsA || !parsed.paramsB) {
      return null;
    }
    return {
      ...parsed,
      paramsA: cloneParamState(parsed.paramsA),
      paramsB: cloneParamState(parsed.paramsB)
    };
  } catch {
    return null;
  }
}

export function readStateFromUrl(): PersistedDemoState | null {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get('tm');
  if (!encoded) {
    return null;
  }
  try {
    return safeParse(fromBase64Url(encoded));
  } catch {
    return null;
  }
}

export function readStateFromStorage(): PersistedDemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return safeParse(raw);
  } catch {
    return null;
  }
}

export function writeState(state: PersistedDemoState): void {
  const cloned: PersistedDemoState = {
    ...state,
    paramsA: cloneParamState(state.paramsA),
    paramsB: cloneParamState(state.paramsB)
  };
  const json = JSON.stringify(cloned);
  try {
    window.localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // ignore storage quota / privacy mode failures
  }
  const url = new URL(window.location.href);
  url.searchParams.set('tm', toBase64Url(json));
  window.history.replaceState(null, '', url.toString());
}

export function clearPersistedState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  const url = new URL(window.location.href);
  if (url.searchParams.has('tm')) {
    url.searchParams.delete('tm');
    window.history.replaceState(null, '', url.toString());
  }
}
