export type InputSource =
  | 'ramp'
  | 'colorChecker'
  | 'stepWedge'
  | 'highlightStress'
  | 'hdr01'
  | 'hdr02';

export type ViewMode =
  | 'srgbPreview'
  | 'linearFalseColor'
  | 'luminanceHeatmap'
  | 'channelInspect';

export interface DemoOptions {
  width?: number;
  height?: number;
  dpr?: number;
  initialInput?: InputSource;
  initialView?: ViewMode;
  initialExposure?: number;
  showControls?: boolean;
}

export interface DemoInstance {
  setInput(input: InputSource): Promise<void>;
  setView(view: ViewMode): void;
  setExposure(exposureEv: number): void;
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
  channel: 0 | 1 | 2;
}
