export type InputSource =
  | 'ramp'
  | 'colorChecker'
  | 'stepWedge'
  | 'highlightStress'
  | 'hdr01'
  | 'hdr02'
  | 'exr01'
  | 'exr02'
  | 'exr03';

export type ViewMode =
  | 'srgbPreview'
  | 'linearFalseColor'
  | 'luminanceHeatmap'
  | 'channelInspect';

export type TonemapOperator = 'none' | 'acesFitted' | 'reinhard' | 'agx' | 'agxPunchy';
export type CompareMode = 'single' | 'splitAB';
export type InputColorSpace = 'linearSrgb' | 'acesCg';

export interface DemoOptions {
  width?: number;
  height?: number;
  dpr?: number;
  initialInput?: InputSource;
  initialView?: ViewMode;
  initialExposure?: number;
  initialTonemapA?: TonemapOperator;
  initialTonemapB?: TonemapOperator;
  initialCompareMode?: CompareMode;
  initialSplit?: number;
  initialInputColorSpace?: InputColorSpace;
  showControls?: boolean;
}

export interface DemoInstance {
  setInput(input: InputSource): Promise<void>;
  setView(view: ViewMode): void;
  setExposure(exposureEv: number): void;
  setTonemapA(op: TonemapOperator): void;
  setTonemapB(op: TonemapOperator): void;
  setCompareMode(mode: CompareMode): void;
  setSplit(split: number): void;
  setInputColorSpace(space: InputColorSpace): void;
  resize(width?: number, height?: number, dpr?: number): void;
  destroy(): void;
}

export interface FloatImage {
  width: number;
  height: number;
  data: Float32Array;
}

export interface RenderState {
  input: InputSource;
  view: ViewMode;
  exposure: number;
  tonemapA: TonemapOperator;
  tonemapB: TonemapOperator;
  compareMode: CompareMode;
  split: number;
  inputColorSpace: InputColorSpace;
  channel: 0 | 1 | 2;
}
