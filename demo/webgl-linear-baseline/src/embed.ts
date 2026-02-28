import type {
  CompareMode,
  DemoInstance,
  DemoOptions,
  FloatImage,
  InputColorSpace,
  InputSource,
  OperatorParamState,
  OperatorSide,
  RenderState,
  TonemapOperator,
  TonemapParams,
  ViewMode
} from './types';
import {
  createColorCheckerPattern,
  createHighlightStressPattern,
  createRampPattern,
  createStepWedgePattern
} from './core/patterns';
import { srgbToLinearChannel } from './core/color';
import { loadExrAsFloatImage, loadHdrAsFloatImage } from './core/hdr-loader';
import { LinearRenderer } from './core/webgl';
import { loadFlimLut, loadTonyLut } from './core/lut-loader';
import {
  clearPersistedState,
  readStateFromStorage,
  readStateFromUrl,
  writeState,
  type PersistedDemoState
} from './core/state-persistence';
import {
  cloneParamState,
  createDefaultOperatorParamState,
  mergeParamState,
  OPERATOR_ORDER,
  packOperatorParams
} from './tonemap/operator-registry';
import { createMinimalControls, type ControlsHandle } from './ui/minimal-controls';

const DEFAULTS: Required<
  Pick<
    DemoOptions,
    | 'initialInput'
    | 'initialView'
    | 'initialExposure'
    | 'initialTonemapA'
    | 'initialTonemapB'
    | 'initialCompareMode'
    | 'initialSplit'
    | 'initialInputColorSpace'
    | 'initialPanelVisible'
    | 'persistState'
    | 'showControls'
  >
> = {
  initialInput: 'ramp',
  initialView: 'srgbPreview',
  initialExposure: 0,
  initialTonemapA: 'none',
  initialTonemapB: 'acesFitted',
  initialCompareMode: 'single',
  initialSplit: 0.5,
  initialInputColorSpace: 'linearSrgb',
  initialPanelVisible: false,
  persistState: true,
  showControls: true
};

const viewToIndex: Record<ViewMode, number> = {
  srgbPreview: 0,
  linearFalseColor: 1,
  luminanceHeatmap: 2,
  channelInspect: 3
};

const tonemapToIndex: Record<TonemapOperator, number> = {
  none: 0,
  acesFitted: 1,
  reinhard: 2,
  agx: 3,
  agxGolden: 4,
  agxPunchy: 5,
  uchimura: 6,
  hejl: 7,
  gt7: 8,
  tonyMcMapface: 9,
  flim: 10,
  amdLpm: 11
};

const compareToIndex: Record<CompareMode, number> = {
  single: 0,
  splitAB: 1
};

const inputColorSpaceToIndex: Record<InputColorSpace, number> = {
  linearSrgb: 0,
  acesCg: 1
};

const hdrPath: Record<'hdr01' | 'hdr02', string> = {
  hdr01: '/assets/hdr/test_scene_01.hdr',
  hdr02: '/assets/hdr/test_scene_02.hdr'
};

const exrPath: Record<'exr01' | 'exr02' | 'exr03', string> = {
  exr01: '/assets/exr/Carrots.exr',
  exr02: '/assets/exr/StillLife.exr',
  exr03: '/assets/exr/Kapaa.exr'
};

const tonyLutPath = '/assets/lut/tony_mc_mapface.dds';
const flimLutPath = {
  default: '/assets/lut/flim_default.spi3d',
  nostalgia: '/assets/lut/flim_nostalgia.spi3d',
  silver: '/assets/lut/flim_silver.spi3d'
} as const;

type FileInputSource = keyof typeof hdrPath | keyof typeof exrPath;
type PatternInputSource = Exclude<InputSource, FileInputSource | 'uploaded'>;

function isHdrInput(input: InputSource): input is keyof typeof hdrPath {
  return input === 'hdr01' || input === 'hdr02';
}

function isExrInput(input: InputSource): input is keyof typeof exrPath {
  return input === 'exr01' || input === 'exr02' || input === 'exr03';
}

function isUploadedInput(input: InputSource): input is 'uploaded' {
  return input === 'uploaded';
}

function isTonemapOperator(input: unknown): input is TonemapOperator {
  return typeof input === 'string' && OPERATOR_ORDER.includes(input as TonemapOperator);
}

function createPattern(input: PatternInputSource): FloatImage {
  switch (input) {
    case 'ramp':
      return createRampPattern();
    case 'colorChecker':
      return createColorCheckerPattern();
    case 'stepWedge':
      return createStepWedgePattern();
    case 'highlightStress':
      return createHighlightStressPattern();
  }
}

function computeCssSize(container: HTMLElement, options: DemoOptions): { w: number; h: number; dpr: number } {
  const fallbackW = 960;
  const fallbackH = 540;
  const w = options.width ?? (container.clientWidth || fallbackW);
  const h = options.height ?? (container.clientHeight || fallbackH);
  const dpr = options.dpr ?? window.devicePixelRatio ?? 1;
  return { w, h, dpr };
}

function showFallback(container: HTMLElement, message: string): void {
  const node = document.createElement('div');
  node.textContent = message;
  node.style.padding = '16px';
  node.style.background = '#2b0b12';
  node.style.color = '#fee2e2';
  node.style.border = '1px solid #7f1d1d';
  node.style.fontFamily = 'ui-sans-serif, system-ui, sans-serif';
  node.style.fontSize = '14px';
  container.appendChild(node);
}

function getWebglDiagnosticMessage(): string {
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  if (gl2) {
    return 'WebGL2 context exists, but renderer initialization failed. Open DevTools Console for shader/uniform details.';
  }

  const gl1 = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
  if (gl1) {
    return 'WebGL2 is unavailable, but WebGL1 is available. This demo is currently WebGL2-only.';
  }

  return 'WebGL is unavailable in this browser context. Check browser GPU settings, iframe sandbox policy, or private/incognito restrictions.';
}

function makePersistedState(state: RenderState): PersistedDemoState {
  return {
    input: state.input,
    view: state.view,
    exposure: state.exposure,
    tonemapA: state.tonemapA,
    tonemapB: state.tonemapB,
    compareMode: state.compareMode,
    split: state.split,
    inputColorSpace: state.inputColorSpace,
    paramsA: cloneParamState(state.paramsA),
    paramsB: cloneParamState(state.paramsB),
    panelVisible: state.panelVisible
  };
}

function applyPersistedState(base: RenderState, persisted: PersistedDemoState | null): RenderState {
  if (!persisted) {
    return base;
  }
  return {
    ...base,
    input: persisted.input ?? base.input,
    view: persisted.view ?? base.view,
    exposure: Number.isFinite(persisted.exposure) ? persisted.exposure : base.exposure,
    tonemapA: isTonemapOperator(persisted.tonemapA) ? persisted.tonemapA : base.tonemapA,
    tonemapB: isTonemapOperator(persisted.tonemapB) ? persisted.tonemapB : base.tonemapB,
    compareMode: persisted.compareMode ?? base.compareMode,
    split: Number.isFinite(persisted.split) ? persisted.split : base.split,
    inputColorSpace: persisted.inputColorSpace ?? base.inputColorSpace,
    paramsA: mergeParamState(base.paramsA, persisted.paramsA),
    paramsB: mergeParamState(base.paramsB, persisted.paramsB),
    panelVisible: typeof persisted.panelVisible === 'boolean' ? persisted.panelVisible : base.panelVisible
  };
}

function mergeSideParams(
  state: OperatorParamState,
  op: TonemapOperator,
  partial: Partial<TonemapParams>
): OperatorParamState {
  return {
    ...state,
    [op]: {
      ...state[op],
      ...partial
    }
  };
}

async function loadLdrFileAsFloatImage(file: File): Promise<FloatImage> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();

    const width = Math.max(1, image.naturalWidth || image.width);
    const height = Math.max(1, image.naturalHeight || image.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('2D canvas context is unavailable');
    }
    ctx.drawImage(image, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height).data;

    const out = new Float32Array(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      const src = i * 4;
      const dst = i * 4;
      out[dst] = srgbToLinearChannel(pixels[src] / 255);
      out[dst + 1] = srgbToLinearChannel(pixels[src + 1] / 255);
      out[dst + 2] = srgbToLinearChannel(pixels[src + 2] / 255);
      out[dst + 3] = pixels[src + 3] / 255;
    }
    return { width, height, data: out };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadUploadedFileAsFloatImage(file: File): Promise<FloatImage> {
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'hdr') {
    const url = URL.createObjectURL(file);
    try {
      return await loadHdrAsFloatImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  if (ext === 'exr') {
    const url = URL.createObjectURL(file);
    try {
      return await loadExrAsFloatImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return loadLdrFileAsFloatImage(file);
}

export function createLinearDemo(container: HTMLElement, options: DemoOptions = {}): DemoInstance {
  container.style.position = container.style.position || 'relative';

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  let renderer: LinearRenderer;
  try {
    renderer = new LinearRenderer(canvas);
  } catch (err) {
    canvas.remove();
    const detail = err instanceof Error ? ` Detail: ${err.message}` : '';
    showFallback(container, `${getWebglDiagnosticMessage()}${detail}`);
    return {
      async setInput(): Promise<void> {},
      setView(): void {},
      setExposure(): void {},
      setTonemapA(): void {},
      setTonemapB(): void {},
      setCompareMode(): void {},
      setSplit(): void {},
      setInputColorSpace(): void {},
      setTonemapParams(): void {},
      resetTonemapParams(): void {},
      setControlsVisible(): void {},
      toggleControls(): void {},
      resize(): void {},
      destroy(): void {}
    };
  }

  const defaultsA = mergeParamState(createDefaultOperatorParamState(), options.initialParamsA);
  const defaultsB = mergeParamState(createDefaultOperatorParamState(), options.initialParamsB);

  const baseState: RenderState = {
    input: options.initialInput ?? DEFAULTS.initialInput,
    view: options.initialView ?? DEFAULTS.initialView,
    exposure: options.initialExposure ?? DEFAULTS.initialExposure,
    tonemapA: options.initialTonemapA ?? DEFAULTS.initialTonemapA,
    tonemapB: options.initialTonemapB ?? DEFAULTS.initialTonemapB,
    compareMode: options.initialCompareMode ?? DEFAULTS.initialCompareMode,
    split: options.initialSplit ?? DEFAULTS.initialSplit,
    inputColorSpace: options.initialInputColorSpace ?? DEFAULTS.initialInputColorSpace,
    paramsA: defaultsA,
    paramsB: defaultsB,
    panelVisible: options.initialPanelVisible ?? DEFAULTS.initialPanelVisible,
    channel: 0
  };

  const enablePersist = options.persistState ?? DEFAULTS.persistState;
  const persisted = enablePersist ? (readStateFromUrl() ?? readStateFromStorage()) : null;
  const state: RenderState = applyPersistedState(baseState, persisted);

  const syncSize = (): void => {
    const { w, h, dpr } = computeCssSize(container, options);
    canvas.style.width = `${Math.max(1, Math.floor(w))}px`;
    canvas.style.height = `${Math.max(1, Math.floor(h))}px`;
    renderer.resize(w * dpr, h * dpr);
  };

  const persistCurrentState = (): void => {
    if (!enablePersist) {
      return;
    }
    writeState(makePersistedState(state));
  };

  syncSize();

  let controls: ControlsHandle | null = null;
  let uploadedImage: FloatImage | null = null;

  const applyInput = async (input: InputSource): Promise<void> => {
    state.input = input;

    if (isHdrInput(input)) {
      try {
        const image = await loadHdrAsFloatImage(hdrPath[input]);
        renderer.setInput(image);
      } catch (err) {
        console.warn('[linear-demo] failed to load HDR, fallback to ramp', err);
        state.input = 'ramp';
        renderer.setInput(createPattern('ramp'));
      }
    } else if (isExrInput(input)) {
      try {
        const image = await loadExrAsFloatImage(exrPath[input]);
        renderer.setInput(image);
      } catch (err) {
        console.warn('[linear-demo] failed to load EXR, fallback to ramp', err);
        state.input = 'ramp';
        renderer.setInput(createPattern('ramp'));
      }
    } else if (isUploadedInput(input)) {
      if (uploadedImage) {
        renderer.setInput(uploadedImage);
      } else {
        console.warn('[linear-demo] no uploaded image is available, fallback to ramp');
        state.input = 'ramp';
        renderer.setInput(createPattern('ramp'));
      }
    } else {
      renderer.setInput(createPattern(input));
    }

    controls?.setState(state);
    persistCurrentState();
  };

  let tonyLutOk = false;
  let flimLutOk = false;

  const initLuts = async (): Promise<void> => {
    try {
      const tony = await loadTonyLut(tonyLutPath);
      renderer.setTonyLut(tony);
      tonyLutOk = true;
    } catch (err) {
      console.warn('[linear-demo] failed to load Tony LUT. Tony operator will fallback to none.', err);
      tonyLutOk = false;
    }

    try {
      const [defLut, nostalgiaLut, silverLut] = await Promise.all([
        loadFlimLut(flimLutPath.default),
        loadFlimLut(flimLutPath.nostalgia),
        loadFlimLut(flimLutPath.silver)
      ]);
      renderer.setFlimLut('default', defLut);
      renderer.setFlimLut('nostalgia', nostalgiaLut);
      renderer.setFlimLut('silver', silverLut);
      flimLutOk = true;
    } catch (err) {
      console.warn('[linear-demo] failed to load flim LUTs. flim operator will fallback to none.', err);
      flimLutOk = false;
    }
  };

  renderer.setInput(createPattern('ramp'));
  void applyInput(state.input);
  void initLuts();

  if (options.showControls ?? DEFAULTS.showControls) {
    controls = createMinimalControls(container, state, {
      onInputChange(input) {
        void applyInput(input);
      },
      onUploadImage(file) {
        void (async () => {
          try {
            uploadedImage = await loadUploadedFileAsFloatImage(file);
            state.inputColorSpace = 'linearSrgb';
            await applyInput('uploaded');
          } catch (err) {
            console.warn('[linear-demo] failed to load uploaded image', err);
          } finally {
            controls?.setState(state);
            persistCurrentState();
          }
        })();
      },
      onViewChange(view) {
        state.view = view;
        controls?.setState(state);
        persistCurrentState();
      },
      onExposureChange(exposure) {
        state.exposure = exposure;
        persistCurrentState();
      },
      onTonemapAChange(op) {
        state.tonemapA = op;
        controls?.setState(state);
        persistCurrentState();
      },
      onTonemapBChange(op) {
        state.tonemapB = op;
        controls?.setState(state);
        persistCurrentState();
      },
      onTonemapParamsChange(side, partial) {
        if (side === 'A') {
          state.paramsA = mergeSideParams(state.paramsA, state.tonemapA, partial);
        } else {
          state.paramsB = mergeSideParams(state.paramsB, state.tonemapB, partial);
        }
        persistCurrentState();
      },
      onCompareModeChange(mode) {
        state.compareMode = mode;
        controls?.setState(state);
        persistCurrentState();
      },
      onSplitChange(split) {
        state.split = split;
        persistCurrentState();
      },
      onInputColorSpaceChange(space) {
        state.inputColorSpace = space;
        persistCurrentState();
      },
      onChannelChange(channel) {
        state.channel = channel;
        persistCurrentState();
      },
      onCopyShareUrl() {
        persistCurrentState();
        void navigator.clipboard?.writeText(window.location.href);
      },
      onVisibilityChange(visible) {
        state.panelVisible = visible;
        persistCurrentState();
      },
      onReset() {
        state.view = options.initialView ?? DEFAULTS.initialView;
        state.exposure = options.initialExposure ?? DEFAULTS.initialExposure;
        state.tonemapA = options.initialTonemapA ?? DEFAULTS.initialTonemapA;
        state.tonemapB = options.initialTonemapB ?? DEFAULTS.initialTonemapB;
        state.compareMode = options.initialCompareMode ?? DEFAULTS.initialCompareMode;
        state.split = options.initialSplit ?? DEFAULTS.initialSplit;
        state.inputColorSpace = options.initialInputColorSpace ?? DEFAULTS.initialInputColorSpace;
        state.paramsA = mergeParamState(createDefaultOperatorParamState(), options.initialParamsA);
        state.paramsB = mergeParamState(createDefaultOperatorParamState(), options.initialParamsB);
        state.panelVisible = options.initialPanelVisible ?? DEFAULTS.initialPanelVisible;
        state.channel = 0;
        void applyInput(options.initialInput ?? DEFAULTS.initialInput);
        controls?.setState(state);
        if (!enablePersist) {
          clearPersistedState();
        }
      }
    });
  }

  const packedA = new Float32Array(16);
  const packedB = new Float32Array(16);

  const validateLutOperators = (): void => {
    let changed = false;
    if (!tonyLutOk && state.tonemapA === 'tonyMcMapface') {
      state.tonemapA = 'none';
      changed = true;
    }
    if (!tonyLutOk && state.tonemapB === 'tonyMcMapface') {
      state.tonemapB = 'none';
      changed = true;
    }
    if (!flimLutOk && state.tonemapA === 'flim') {
      state.tonemapA = 'none';
      changed = true;
    }
    if (!flimLutOk && state.tonemapB === 'flim') {
      state.tonemapB = 'none';
      changed = true;
    }
    if (changed) {
      controls?.setState(state);
      persistCurrentState();
    }
  };

  let rafId = 0;
  const frame = (): void => {
    validateLutOperators();

    packedA.set(packOperatorParams(state.tonemapA, state.paramsA[state.tonemapA]));
    packedB.set(packOperatorParams(state.tonemapB, state.paramsB[state.tonemapB]));

    renderer.render(
      viewToIndex[state.view],
      state.exposure,
      state.channel,
      tonemapToIndex[state.tonemapA],
      tonemapToIndex[state.tonemapB],
      compareToIndex[state.compareMode],
      state.split,
      inputColorSpaceToIndex[state.inputColorSpace],
      packedA,
      packedB
    );
    rafId = window.requestAnimationFrame(frame);
  };
  frame();

  const autoResize = options.width === undefined && options.height === undefined;
  const onResize = (): void => {
    if (autoResize) {
      syncSize();
    }
  };
  window.addEventListener('resize', onResize);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() !== 'h') {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
      return;
    }
    if (!(options.showControls ?? DEFAULTS.showControls)) {
      return;
    }
    state.panelVisible = !state.panelVisible;
    controls?.setVisible(state.panelVisible);
    persistCurrentState();
  };
  window.addEventListener('keydown', onKeyDown);

  let destroyed = false;

  return {
    async setInput(input: InputSource): Promise<void> {
      if (destroyed) {
        return;
      }
      await applyInput(input);
    },
    setView(view: ViewMode): void {
      if (destroyed) {
        return;
      }
      state.view = view;
      controls?.setState(state);
      persistCurrentState();
    },
    setExposure(exposureEv: number): void {
      if (destroyed) {
        return;
      }
      state.exposure = exposureEv;
      controls?.setState(state);
      persistCurrentState();
    },
    setTonemapA(op: TonemapOperator): void {
      if (destroyed) {
        return;
      }
      state.tonemapA = op;
      controls?.setState(state);
      persistCurrentState();
    },
    setTonemapB(op: TonemapOperator): void {
      if (destroyed) {
        return;
      }
      state.tonemapB = op;
      controls?.setState(state);
      persistCurrentState();
    },
    setCompareMode(mode: CompareMode): void {
      if (destroyed) {
        return;
      }
      state.compareMode = mode;
      controls?.setState(state);
      persistCurrentState();
    },
    setSplit(split: number): void {
      if (destroyed) {
        return;
      }
      state.split = Math.min(0.95, Math.max(0.05, split));
      controls?.setState(state);
      persistCurrentState();
    },
    setInputColorSpace(space: InputColorSpace): void {
      if (destroyed) {
        return;
      }
      state.inputColorSpace = space;
      controls?.setState(state);
      persistCurrentState();
    },
    setTonemapParams(side: OperatorSide, partial: Partial<TonemapParams>): void {
      if (destroyed) {
        return;
      }
      if (side === 'A') {
        state.paramsA = mergeSideParams(state.paramsA, state.tonemapA, partial);
      } else {
        state.paramsB = mergeSideParams(state.paramsB, state.tonemapB, partial);
      }
      controls?.setState(state);
      persistCurrentState();
    },
    resetTonemapParams(side: OperatorSide, op?: TonemapOperator): void {
      if (destroyed) {
        return;
      }
      const defaults = createDefaultOperatorParamState();
      if (side === 'A') {
        const target = op ?? state.tonemapA;
        state.paramsA = {
          ...state.paramsA,
          [target]: { ...defaults[target] }
        };
      } else {
        const target = op ?? state.tonemapB;
        state.paramsB = {
          ...state.paramsB,
          [target]: { ...defaults[target] }
        };
      }
      controls?.setState(state);
      persistCurrentState();
    },
    setControlsVisible(visible: boolean): void {
      if (destroyed) {
        return;
      }
      state.panelVisible = visible;
      controls?.setVisible(visible);
      persistCurrentState();
    },
    toggleControls(): void {
      if (destroyed) {
        return;
      }
      state.panelVisible = !state.panelVisible;
      controls?.setVisible(state.panelVisible);
      persistCurrentState();
    },
    resize(width?: number, height?: number, dpr?: number): void {
      if (destroyed) {
        return;
      }
      if (width !== undefined) {
        options.width = width;
      }
      if (height !== undefined) {
        options.height = height;
      }
      if (dpr !== undefined) {
        options.dpr = dpr;
      }
      syncSize();
    },
    destroy(): void {
      if (destroyed) {
        return;
      }
      destroyed = true;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(rafId);
      controls?.destroy();
      controls = null;
      renderer.destroy();
      canvas.remove();
    }
  };
}
