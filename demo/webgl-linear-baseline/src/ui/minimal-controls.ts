import type { CompareMode, InputColorSpace, InputSource, TonemapOperator, ViewMode } from '../types';

export interface ControlCallbacks {
  onInputChange(input: InputSource): void;
  onViewChange(view: ViewMode): void;
  onExposureChange(exposure: number): void;
  onTonemapAChange(op: TonemapOperator): void;
  onTonemapBChange(op: TonemapOperator): void;
  onCompareModeChange(mode: CompareMode): void;
  onSplitChange(split: number): void;
  onInputColorSpaceChange(space: InputColorSpace): void;
  onChannelChange(channel: 0 | 1 | 2): void;
  onReset(): void;
}

export interface ControlsState {
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

export interface ControlsHandle {
  setState(state: ControlsState): void;
  destroy(): void;
}

const inputOptions: Array<{ value: InputSource; label: string }> = [
  { value: 'ramp', label: 'Gray Ramp' },
  { value: 'colorChecker', label: 'Color Checker' },
  { value: 'stepWedge', label: 'Step Wedge' },
  { value: 'highlightStress', label: 'Highlight Stress' },
  { value: 'hdr01', label: 'HDR Scene 01' },
  { value: 'hdr02', label: 'HDR Scene 02' },
  { value: 'exr01', label: 'EXR Carrots' },
  { value: 'exr02', label: 'EXR StillLife' },
  { value: 'exr03', label: 'EXR Kapaa' }
];

const viewOptions: Array<{ value: ViewMode; label: string }> = [
  { value: 'srgbPreview', label: 'sRGB Preview' },
  { value: 'linearFalseColor', label: 'Linear False Color' },
  { value: 'luminanceHeatmap', label: 'Luminance Heatmap' },
  { value: 'channelInspect', label: 'Channel Inspect' }
];

const tonemapOptions: Array<{ value: TonemapOperator; label: string }> = [
  { value: 'none', label: 'None (Linear)' },
  { value: 'acesFitted', label: 'ACES Fitted' },
  { value: 'reinhard', label: 'Reinhard' },
  { value: 'agx', label: 'AgX' },
  { value: 'agxPunchy', label: 'AgX Punchy' }
];

const compareOptions: Array<{ value: CompareMode; label: string }> = [
  { value: 'single', label: 'Single View' },
  { value: 'splitAB', label: 'Split A/B' }
];

const inputColorSpaceOptions: Array<{ value: InputColorSpace; label: string }> = [
  { value: 'linearSrgb', label: 'Linear sRGB' },
  { value: 'acesCg', label: 'ACEScg (AP1)' }
];

function createLabel(text: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.textContent = text;
  label.style.display = 'grid';
  label.style.gap = '4px';
  label.style.fontSize = '12px';
  return label;
}

export function createMinimalControls(
  container: HTMLElement,
  initial: ControlsState,
  callbacks: ControlCallbacks
): ControlsHandle {
  const panel = document.createElement('div');
  panel.style.position = 'absolute';
  panel.style.top = '12px';
  panel.style.left = '12px';
  panel.style.zIndex = '20';
  panel.style.display = 'grid';
  panel.style.gridTemplateColumns = 'repeat(2, minmax(140px, 180px))';
  panel.style.gap = '8px';
  panel.style.padding = '10px';
  panel.style.border = '1px solid rgba(255,255,255,0.12)';
  panel.style.background = 'rgba(13,17,23,0.82)';
  panel.style.backdropFilter = 'blur(4px)';
  panel.style.color = '#e5e7eb';

  const inputLabel = createLabel('Input');
  const inputSelect = document.createElement('select');
  for (const option of inputOptions) {
    const o = document.createElement('option');
    o.value = option.value;
    o.textContent = option.label;
    inputSelect.appendChild(o);
  }
  inputSelect.value = initial.input;
  inputSelect.onchange = () => callbacks.onInputChange(inputSelect.value as InputSource);
  inputLabel.appendChild(inputSelect);

  const viewLabel = createLabel('View');
  const viewSelect = document.createElement('select');
  for (const option of viewOptions) {
    const o = document.createElement('option');
    o.value = option.value;
    o.textContent = option.label;
    viewSelect.appendChild(o);
  }
  viewSelect.value = initial.view;
  viewSelect.onchange = () => callbacks.onViewChange(viewSelect.value as ViewMode);
  viewLabel.appendChild(viewSelect);

  const exposureLabel = createLabel('Exposure (EV)');
  const exposureWrap = document.createElement('div');
  exposureWrap.style.display = 'grid';
  exposureWrap.style.gridTemplateColumns = '1fr auto';
  exposureWrap.style.gap = '8px';
  const exposureSlider = document.createElement('input');
  exposureSlider.type = 'range';
  exposureSlider.min = '-6';
  exposureSlider.max = '6';
  exposureSlider.step = '0.05';
  exposureSlider.value = String(initial.exposure);
  const exposureReadout = document.createElement('span');
  exposureReadout.style.minWidth = '48px';
  exposureReadout.style.textAlign = 'right';
  exposureReadout.textContent = Number(initial.exposure).toFixed(2);
  exposureSlider.oninput = () => {
    const v = Number(exposureSlider.value);
    exposureReadout.textContent = v.toFixed(2);
    callbacks.onExposureChange(v);
  };
  exposureWrap.appendChild(exposureSlider);
  exposureWrap.appendChild(exposureReadout);
  exposureLabel.appendChild(exposureWrap);

  const tonemapALabel = createLabel('Tonemap A');
  const tonemapASelect = document.createElement('select');
  for (const option of tonemapOptions) {
    const o = document.createElement('option');
    o.value = option.value;
    o.textContent = option.label;
    tonemapASelect.appendChild(o);
  }
  tonemapASelect.value = initial.tonemapA;
  tonemapASelect.onchange = () => callbacks.onTonemapAChange(tonemapASelect.value as TonemapOperator);
  tonemapALabel.appendChild(tonemapASelect);

  const tonemapBLabel = createLabel('Tonemap B');
  const tonemapBSelect = document.createElement('select');
  for (const option of tonemapOptions) {
    const o = document.createElement('option');
    o.value = option.value;
    o.textContent = option.label;
    tonemapBSelect.appendChild(o);
  }
  tonemapBSelect.value = initial.tonemapB;
  tonemapBSelect.onchange = () => callbacks.onTonemapBChange(tonemapBSelect.value as TonemapOperator);
  tonemapBLabel.appendChild(tonemapBSelect);

  const compareLabel = createLabel('Compare');
  const compareSelect = document.createElement('select');
  for (const option of compareOptions) {
    const o = document.createElement('option');
    o.value = option.value;
    o.textContent = option.label;
    compareSelect.appendChild(o);
  }
  compareSelect.value = initial.compareMode;
  compareSelect.onchange = () => callbacks.onCompareModeChange(compareSelect.value as CompareMode);
  compareLabel.appendChild(compareSelect);

  const splitLabel = createLabel('Split (A|B)');
  const splitWrap = document.createElement('div');
  splitWrap.style.display = 'grid';
  splitWrap.style.gridTemplateColumns = '1fr auto';
  splitWrap.style.gap = '8px';
  const splitSlider = document.createElement('input');
  splitSlider.type = 'range';
  splitSlider.min = '0.05';
  splitSlider.max = '0.95';
  splitSlider.step = '0.01';
  splitSlider.value = String(initial.split);
  const splitReadout = document.createElement('span');
  splitReadout.style.minWidth = '48px';
  splitReadout.style.textAlign = 'right';
  splitReadout.textContent = initial.split.toFixed(2);
  splitSlider.oninput = () => {
    const v = Number(splitSlider.value);
    splitReadout.textContent = v.toFixed(2);
    callbacks.onSplitChange(v);
  };
  splitWrap.appendChild(splitSlider);
  splitWrap.appendChild(splitReadout);
  splitLabel.appendChild(splitWrap);

  const inputColorSpaceLabel = createLabel('Input Color Space');
  const inputColorSpaceSelect = document.createElement('select');
  for (const option of inputColorSpaceOptions) {
    const o = document.createElement('option');
    o.value = option.value;
    o.textContent = option.label;
    inputColorSpaceSelect.appendChild(o);
  }
  inputColorSpaceSelect.value = initial.inputColorSpace;
  inputColorSpaceSelect.onchange = () => callbacks.onInputColorSpaceChange(inputColorSpaceSelect.value as InputColorSpace);
  inputColorSpaceLabel.appendChild(inputColorSpaceSelect);

  const channelLabel = createLabel('Channel');
  const channelSelect = document.createElement('select');
  const channels: Array<{ value: 0 | 1 | 2; label: string }> = [
    { value: 0, label: 'Red' },
    { value: 1, label: 'Green' },
    { value: 2, label: 'Blue' }
  ];
  for (const option of channels) {
    const o = document.createElement('option');
    o.value = String(option.value);
    o.textContent = option.label;
    channelSelect.appendChild(o);
  }
  channelSelect.value = String(initial.channel);
  channelSelect.onchange = () => callbacks.onChannelChange(Number(channelSelect.value) as 0 | 1 | 2);
  channelLabel.appendChild(channelSelect);

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.onclick = () => callbacks.onReset();
  resetButton.style.gridColumn = '1 / -1';
  resetButton.style.padding = '8px 10px';
  resetButton.style.cursor = 'pointer';

  panel.appendChild(inputLabel);
  panel.appendChild(viewLabel);
  panel.appendChild(exposureLabel);
  panel.appendChild(compareLabel);
  panel.appendChild(tonemapALabel);
  panel.appendChild(tonemapBLabel);
  panel.appendChild(splitLabel);
  panel.appendChild(inputColorSpaceLabel);
  panel.appendChild(channelLabel);
  panel.appendChild(resetButton);

  container.appendChild(panel);

  const syncCompareUi = (mode: CompareMode): void => {
    const splitOn = mode === 'splitAB';
    tonemapBSelect.disabled = !splitOn;
    splitSlider.disabled = !splitOn;
    splitReadout.style.opacity = splitOn ? '1' : '0.5';
  };

  syncCompareUi(initial.compareMode);

  return {
    setState(state: ControlsState): void {
      inputSelect.value = state.input;
      viewSelect.value = state.view;
      exposureSlider.value = String(state.exposure);
      exposureReadout.textContent = state.exposure.toFixed(2);
      tonemapASelect.value = state.tonemapA;
      tonemapBSelect.value = state.tonemapB;
      compareSelect.value = state.compareMode;
      splitSlider.value = String(state.split);
      splitReadout.textContent = state.split.toFixed(2);
      inputColorSpaceSelect.value = state.inputColorSpace;
      channelSelect.value = String(state.channel);
      syncCompareUi(state.compareMode);
    },
    destroy(): void {
      inputSelect.onchange = null;
      viewSelect.onchange = null;
      exposureSlider.oninput = null;
      tonemapASelect.onchange = null;
      tonemapBSelect.onchange = null;
      compareSelect.onchange = null;
      splitSlider.oninput = null;
      inputColorSpaceSelect.onchange = null;
      channelSelect.onchange = null;
      resetButton.onclick = null;
      panel.remove();
    }
  };
}
