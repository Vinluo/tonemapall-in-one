export type InputSource =
  | 'ramp'
  | 'colorChecker'
  | 'stepWedge'
  | 'highlightStress'
  | 'hdr01'
  | 'hdr02'
  | 'exr01'
  | 'exr02'
  | 'exr03'
  | 'uploaded';

export type ViewMode =
  | 'srgbPreview'
  | 'linearFalseColor'
  | 'luminanceHeatmap'
  | 'channelInspect';

export type TonemapOperator =
  | 'none'
  | 'acesFitted'
  | 'reinhard'
  | 'agx'
  | 'agxGolden'
  | 'agxPunchy'
  | 'uchimura'
  | 'hejl'
  | 'gt7'
  | 'tonyMcMapface'
  | 'flim'
  | 'amdLpm';
export type CompareMode = 'single' | 'splitAB';
export type InputColorSpace = 'linearSrgb' | 'acesCg';
export type OperatorSide = 'A' | 'B';
export type TonemapParamValue = number | boolean | string;
export type TonemapParams = Record<string, TonemapParamValue>;
export type OperatorParamState = Record<TonemapOperator, TonemapParams>;

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
  initialParamsA?: Partial<OperatorParamState>;
  initialParamsB?: Partial<OperatorParamState>;
  initialPanelVisible?: boolean;
  persistState?: boolean;
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
  setTonemapParams(side: OperatorSide, partial: Partial<TonemapParams>): void;
  resetTonemapParams(side: OperatorSide, op?: TonemapOperator): void;
  setControlsVisible(visible: boolean): void;
  toggleControls(): void;
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
  paramsA: OperatorParamState;
  paramsB: OperatorParamState;
  panelVisible: boolean;
  channel: 0 | 1 | 2;
}
