import type {
  CompareMode,
  DemoInstance,
  DemoOptions,
  FloatImage,
  InputColorSpace,
  InputSource,
  RenderState,
  TonemapOperator,
  ViewMode
} from './types';
import {
  createColorCheckerPattern,
  createHighlightStressPattern,
  createRampPattern,
  createStepWedgePattern
} from './core/patterns';
import { loadExrAsFloatImage, loadHdrAsFloatImage } from './core/hdr-loader';
import { LinearRenderer } from './core/webgl';
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
  agxPunchy: 4
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

type FileInputSource = keyof typeof hdrPath | keyof typeof exrPath;
type PatternInputSource = Exclude<InputSource, FileInputSource>;

function isHdrInput(input: InputSource): input is keyof typeof hdrPath {
  return input === 'hdr01' || input === 'hdr02';
}

function isExrInput(input: InputSource): input is keyof typeof exrPath {
  return input === 'exr01' || input === 'exr02' || input === 'exr03';
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
  } catch {
    canvas.remove();
    showFallback(container, 'WebGL2 is not supported in this environment.');
    return {
      async setInput(): Promise<void> {},
      setView(): void {},
      setExposure(): void {},
      setTonemapA(): void {},
      setTonemapB(): void {},
      setCompareMode(): void {},
      setSplit(): void {},
      setInputColorSpace(): void {},
      resize(): void {},
      destroy(): void {}
    };
  }

  const state: RenderState = {
    input: options.initialInput ?? DEFAULTS.initialInput,
    view: options.initialView ?? DEFAULTS.initialView,
    exposure: options.initialExposure ?? DEFAULTS.initialExposure,
    tonemapA: options.initialTonemapA ?? DEFAULTS.initialTonemapA,
    tonemapB: options.initialTonemapB ?? DEFAULTS.initialTonemapB,
    compareMode: options.initialCompareMode ?? DEFAULTS.initialCompareMode,
    split: options.initialSplit ?? DEFAULTS.initialSplit,
    inputColorSpace: options.initialInputColorSpace ?? DEFAULTS.initialInputColorSpace,
    channel: 0
  };

  const syncSize = (): void => {
    const { w, h, dpr } = computeCssSize(container, options);
    canvas.style.width = `${Math.max(1, Math.floor(w))}px`;
    canvas.style.height = `${Math.max(1, Math.floor(h))}px`;
    renderer.resize(w * dpr, h * dpr);
  };

  syncSize();

  let controls: ControlsHandle | null = null;

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
    } else {
      renderer.setInput(createPattern(input));
    }

    controls?.setState(state);
  };

  renderer.setInput(createPattern('ramp'));
  void applyInput(state.input);

  if (options.showControls ?? DEFAULTS.showControls) {
    controls = createMinimalControls(container, state, {
      onInputChange(input) {
        void applyInput(input);
      },
      onViewChange(view) {
        state.view = view;
        controls?.setState(state);
      },
      onExposureChange(exposure) {
        state.exposure = exposure;
      },
      onTonemapAChange(op) {
        state.tonemapA = op;
      },
      onTonemapBChange(op) {
        state.tonemapB = op;
      },
      onCompareModeChange(mode) {
        state.compareMode = mode;
        controls?.setState(state);
      },
      onSplitChange(split) {
        state.split = split;
      },
      onInputColorSpaceChange(space) {
        state.inputColorSpace = space;
      },
      onChannelChange(channel) {
        state.channel = channel;
      },
      onReset() {
        state.view = options.initialView ?? DEFAULTS.initialView;
        state.exposure = options.initialExposure ?? DEFAULTS.initialExposure;
        state.tonemapA = options.initialTonemapA ?? DEFAULTS.initialTonemapA;
        state.tonemapB = options.initialTonemapB ?? DEFAULTS.initialTonemapB;
        state.compareMode = options.initialCompareMode ?? DEFAULTS.initialCompareMode;
        state.split = options.initialSplit ?? DEFAULTS.initialSplit;
        state.inputColorSpace = options.initialInputColorSpace ?? DEFAULTS.initialInputColorSpace;
        state.channel = 0;
        void applyInput(options.initialInput ?? DEFAULTS.initialInput);
        controls?.setState(state);
      }
    });
  }

  let rafId = 0;
  const frame = (): void => {
    renderer.render(
      viewToIndex[state.view],
      state.exposure,
      state.channel,
      tonemapToIndex[state.tonemapA],
      tonemapToIndex[state.tonemapB],
      compareToIndex[state.compareMode],
      state.split,
      inputColorSpaceToIndex[state.inputColorSpace]
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
    },
    setExposure(exposureEv: number): void {
      if (destroyed) {
        return;
      }
      state.exposure = exposureEv;
      controls?.setState(state);
    },
    setTonemapA(op: TonemapOperator): void {
      if (destroyed) {
        return;
      }
      state.tonemapA = op;
      controls?.setState(state);
    },
    setTonemapB(op: TonemapOperator): void {
      if (destroyed) {
        return;
      }
      state.tonemapB = op;
      controls?.setState(state);
    },
    setCompareMode(mode: CompareMode): void {
      if (destroyed) {
        return;
      }
      state.compareMode = mode;
      controls?.setState(state);
    },
    setSplit(split: number): void {
      if (destroyed) {
        return;
      }
      state.split = Math.min(0.95, Math.max(0.05, split));
      controls?.setState(state);
    },
    setInputColorSpace(space: InputColorSpace): void {
      if (destroyed) {
        return;
      }
      state.inputColorSpace = space;
      controls?.setState(state);
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
      window.cancelAnimationFrame(rafId);
      controls?.destroy();
      controls = null;
      renderer.destroy();
      canvas.remove();
    }
  };
}
