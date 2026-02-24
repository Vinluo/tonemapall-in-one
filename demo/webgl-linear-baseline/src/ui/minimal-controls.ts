import type {
  CompareMode,
  InputColorSpace,
  InputSource,
  OperatorParamState,
  OperatorSide,
  TonemapOperator,
  TonemapParams,
  ViewMode
} from '../types';
import { getOperatorDescriptor, OPERATOR_DESCRIPTORS, type ParamDescriptor } from '../tonemap/operator-registry';

export interface ControlCallbacks {
  onInputChange(input: InputSource): void;
  onViewChange(view: ViewMode): void;
  onExposureChange(exposure: number): void;
  onTonemapAChange(op: TonemapOperator): void;
  onTonemapBChange(op: TonemapOperator): void;
  onTonemapParamsChange(side: OperatorSide, partial: Partial<TonemapParams>): void;
  onCompareModeChange(mode: CompareMode): void;
  onSplitChange(split: number): void;
  onInputColorSpaceChange(space: InputColorSpace): void;
  onChannelChange(channel: 0 | 1 | 2): void;
  onCopyShareUrl(): void;
  onVisibilityChange(visible: boolean): void;
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
  paramsA: OperatorParamState;
  paramsB: OperatorParamState;
  panelVisible: boolean;
  channel: 0 | 1 | 2;
}

export interface ControlsHandle {
  setState(state: ControlsState): void;
  setVisible(visible: boolean): void;
  toggle(): void;
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

const compareOptions: Array<{ value: CompareMode; label: string }> = [
  { value: 'single', label: 'Single View' },
  { value: 'splitAB', label: 'Split A/B' }
];

const inputColorSpaceOptions: Array<{ value: InputColorSpace; label: string }> = [
  { value: 'linearSrgb', label: 'Linear sRGB' },
  { value: 'acesCg', label: 'ACEScg (AP1)' }
];

function stylePanel(panel: HTMLElement): void {
  panel.style.background = 'rgba(2, 6, 23, 0.56)';
  panel.style.backdropFilter = 'blur(10px)';
  panel.style.border = '1px solid rgba(148, 163, 184, 0.32)';
  panel.style.borderRadius = '12px';
  panel.style.color = '#e2e8f0';
}

function styleFieldControl(node: HTMLInputElement | HTMLSelectElement): void {
  node.style.width = '100%';
  node.style.boxSizing = 'border-box';
  node.style.padding = node instanceof HTMLSelectElement ? '6px 8px' : '';
  node.style.border = '1px solid rgba(148, 163, 184, 0.35)';
  node.style.background = 'rgba(15, 23, 42, 0.42)';
  node.style.color = '#e2e8f0';
  node.style.borderRadius = '8px';
}

function styleButton(button: HTMLButtonElement): void {
  button.style.padding = '7px 10px';
  button.style.cursor = 'pointer';
  button.style.border = '1px solid rgba(148, 163, 184, 0.35)';
  button.style.background = 'rgba(15, 23, 42, 0.46)';
  button.style.color = '#f8fafc';
  button.style.borderRadius = '8px';
}

function createLabel(text: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.textContent = text;
  label.style.display = 'grid';
  label.style.gap = '4px';
  label.style.fontSize = '12px';
  label.style.fontWeight = '500';
  return label;
}

function createPanelTitle(text: string): HTMLDivElement {
  const node = document.createElement('div');
  node.textContent = text;
  node.style.fontSize = '12px';
  node.style.fontWeight = '700';
  node.style.letterSpacing = '0.04em';
  node.style.textTransform = 'uppercase';
  node.style.color = '#cbd5e1';
  return node;
}

function createSelect<T extends string>(options: Array<{ value: T; label: string }>, value: T): HTMLSelectElement {
  const select = document.createElement('select');
  for (const option of options) {
    const o = document.createElement('option');
    o.value = option.value;
    o.textContent = option.label;
    select.appendChild(o);
  }
  select.value = value;
  styleFieldControl(select);
  return select;
}

function formatNumber(v: number, digits = 3): string {
  return v.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function renderParamControl(
  parent: HTMLElement,
  side: OperatorSide,
  desc: ParamDescriptor,
  current: TonemapParams,
  callbacks: ControlCallbacks
): void {
  const label = createLabel(desc.label);

  if (desc.type === 'toggle') {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = current[desc.key] === true;
    styleFieldControl(checkbox);
    checkbox.onchange = () => callbacks.onTonemapParamsChange(side, { [desc.key]: checkbox.checked });
    label.appendChild(checkbox);
    parent.appendChild(label);
    return;
  }

  if (desc.type === 'select') {
    const select = createSelect(
      (desc.options ?? []).map((o) => ({ label: o.label, value: o.value })),
      String(current[desc.key] ?? desc.options?.[0]?.value ?? '') as string
    );
    select.onchange = () => callbacks.onTonemapParamsChange(side, { [desc.key]: select.value });
    label.appendChild(select);
    parent.appendChild(label);
    return;
  }

  const wrap = document.createElement('div');
  wrap.style.display = 'grid';
  wrap.style.gridTemplateColumns = '1fr auto';
  wrap.style.gap = '8px';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(desc.min ?? 0);
  slider.max = String(desc.max ?? 1);
  slider.step = String(desc.step ?? 0.01);
  const sliderValue = Number(current[desc.key] ?? desc.min ?? 0);
  slider.value = String(sliderValue);
  styleFieldControl(slider);

  const readout = document.createElement('span');
  readout.style.minWidth = '56px';
  readout.style.textAlign = 'right';
  readout.textContent = formatNumber(sliderValue);

  slider.oninput = () => {
    const v = Number(slider.value);
    readout.textContent = formatNumber(v);
    callbacks.onTonemapParamsChange(side, { [desc.key]: v });
  };

  wrap.appendChild(slider);
  wrap.appendChild(readout);
  label.appendChild(wrap);
  parent.appendChild(label);
}

function createFloatingEdgeButton(text: string, side: 'left' | 'right'): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  styleButton(button);
  button.style.position = 'absolute';
  button.style.top = '50%';
  button.style.transform = 'translateY(-50%)';
  button.style.zIndex = '30';
  button.style.padding = '8px 6px';
  button.style.writingMode = 'vertical-rl';
  button.style.textOrientation = 'mixed';
  if (side === 'left') {
    button.style.left = '8px';
  } else {
    button.style.right = '8px';
  }
  return button;
}

export function createMinimalControls(
  container: HTMLElement,
  initial: ControlsState,
  callbacks: ControlCallbacks
): ControlsHandle {
  const globalToggleButton = document.createElement('button');
  globalToggleButton.style.position = 'absolute';
  globalToggleButton.style.top = '12px';
  globalToggleButton.style.right = '12px';
  globalToggleButton.style.zIndex = '40';
  styleButton(globalToggleButton);

  const toolsPanel = document.createElement('div');
  toolsPanel.style.position = 'absolute';
  toolsPanel.style.top = '12px';
  toolsPanel.style.left = '50%';
  toolsPanel.style.transform = 'translateX(-50%)';
  toolsPanel.style.width = 'min(880px, calc(100% - 92px))';
  toolsPanel.style.zIndex = '28';
  toolsPanel.style.padding = '10px';
  toolsPanel.style.display = 'grid';
  toolsPanel.style.gridTemplateColumns = 'repeat(6, minmax(100px, 1fr))';
  toolsPanel.style.gap = '8px';
  toolsPanel.style.alignItems = 'end';
  stylePanel(toolsPanel);

  const panelA = document.createElement('div');
  panelA.style.position = 'absolute';
  panelA.style.left = '12px';
  panelA.style.top = '92px';
  panelA.style.bottom = '12px';
  panelA.style.width = 'min(320px, 38vw)';
  panelA.style.zIndex = '27';
  panelA.style.padding = '10px';
  panelA.style.display = 'grid';
  panelA.style.gridTemplateRows = 'auto auto 1fr';
  panelA.style.gap = '8px';
  panelA.style.overflowY = 'auto';
  stylePanel(panelA);

  const panelB = document.createElement('div');
  panelB.style.position = 'absolute';
  panelB.style.right = '12px';
  panelB.style.top = '92px';
  panelB.style.bottom = '12px';
  panelB.style.width = 'min(320px, 38vw)';
  panelB.style.zIndex = '27';
  panelB.style.padding = '10px';
  panelB.style.display = 'grid';
  panelB.style.gridTemplateRows = 'auto auto 1fr';
  panelB.style.gap = '8px';
  panelB.style.overflowY = 'auto';
  stylePanel(panelB);

  const splitOverlay = document.createElement('div');
  splitOverlay.style.position = 'absolute';
  splitOverlay.style.left = '50%';
  splitOverlay.style.bottom = '18px';
  splitOverlay.style.transform = 'translateX(-50%)';
  splitOverlay.style.zIndex = '29';
  splitOverlay.style.width = 'min(420px, 68vw)';
  splitOverlay.style.padding = '10px';
  splitOverlay.style.display = 'grid';
  splitOverlay.style.gap = '6px';
  stylePanel(splitOverlay);

  const showAButton = createFloatingEdgeButton('Show A', 'left');
  const showBButton = createFloatingEdgeButton('Show B', 'right');

  const inputSelect = createSelect(inputOptions, initial.input);
  const inputLabel = createLabel('Input');
  inputLabel.appendChild(inputSelect);

  const viewSelect = createSelect(viewOptions, initial.view);
  const viewLabel = createLabel('View');
  viewLabel.appendChild(viewSelect);

  const exposureLabel = createLabel('Exposure (EV)');
  const exposureWrap = document.createElement('div');
  exposureWrap.style.display = 'grid';
  exposureWrap.style.gridTemplateColumns = '1fr auto';
  exposureWrap.style.gap = '8px';
  const exposureSlider = document.createElement('input');
  exposureSlider.type = 'range';
  exposureSlider.min = '-8';
  exposureSlider.max = '8';
  exposureSlider.step = '0.05';
  exposureSlider.value = String(initial.exposure);
  styleFieldControl(exposureSlider);
  const exposureReadout = document.createElement('span');
  exposureReadout.textContent = initial.exposure.toFixed(2);
  exposureReadout.style.minWidth = '56px';
  exposureReadout.style.textAlign = 'right';
  exposureSlider.oninput = () => {
    const v = Number(exposureSlider.value);
    exposureReadout.textContent = v.toFixed(2);
    callbacks.onExposureChange(v);
  };
  exposureWrap.appendChild(exposureSlider);
  exposureWrap.appendChild(exposureReadout);
  exposureLabel.appendChild(exposureWrap);

  const compareSelect = createSelect(compareOptions, initial.compareMode);
  const compareLabel = createLabel('Compare');
  compareLabel.appendChild(compareSelect);

  const inputColorSpaceSelect = createSelect(inputColorSpaceOptions, initial.inputColorSpace);
  const inputColorSpaceLabel = createLabel('Input Color Space');
  inputColorSpaceLabel.appendChild(inputColorSpaceSelect);

  const channelLabel = createLabel('Channel');
  const channelSelect = createSelect(
    [
      { value: '0', label: 'Red' },
      { value: '1', label: 'Green' },
      { value: '2', label: 'Blue' }
    ],
    String(initial.channel)
  );
  channelLabel.appendChild(channelSelect);

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  styleButton(resetButton);

  const copyButton = document.createElement('button');
  copyButton.textContent = 'Copy Share URL';
  styleButton(copyButton);

  const hideUiButton = document.createElement('button');
  hideUiButton.textContent = 'Hide UI';
  styleButton(hideUiButton);

  const actionRow = document.createElement('div');
  actionRow.style.gridColumn = '1 / -1';
  actionRow.style.display = 'grid';
  actionRow.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
  actionRow.style.gap = '8px';
  actionRow.appendChild(resetButton);
  actionRow.appendChild(copyButton);
  actionRow.appendChild(hideUiButton);

  toolsPanel.appendChild(inputLabel);
  toolsPanel.appendChild(viewLabel);
  toolsPanel.appendChild(exposureLabel);
  toolsPanel.appendChild(inputColorSpaceLabel);
  toolsPanel.appendChild(compareLabel);
  toolsPanel.appendChild(channelLabel);
  toolsPanel.appendChild(actionRow);

  const splitTitle = createPanelTitle('Split A/B');
  const splitHint = document.createElement('div');
  splitHint.style.fontSize = '11px';
  splitHint.style.opacity = '0.85';
  splitHint.textContent = '中央分割线位置';

  const splitWrap = document.createElement('div');
  splitWrap.style.display = 'grid';
  splitWrap.style.gridTemplateColumns = '24px 1fr auto 24px';
  splitWrap.style.alignItems = 'center';
  splitWrap.style.gap = '8px';
  const splitALabel = document.createElement('span');
  splitALabel.textContent = 'A';
  splitALabel.style.textAlign = 'center';
  const splitBLabel = document.createElement('span');
  splitBLabel.textContent = 'B';
  splitBLabel.style.textAlign = 'center';
  const splitSlider = document.createElement('input');
  splitSlider.type = 'range';
  splitSlider.min = '0.05';
  splitSlider.max = '0.95';
  splitSlider.step = '0.01';
  splitSlider.value = String(initial.split);
  styleFieldControl(splitSlider);
  const splitReadout = document.createElement('span');
  splitReadout.textContent = initial.split.toFixed(2);
  splitReadout.style.minWidth = '48px';
  splitReadout.style.textAlign = 'right';
  splitSlider.oninput = () => {
    const v = Number(splitSlider.value);
    splitReadout.textContent = v.toFixed(2);
    callbacks.onSplitChange(v);
  };
  splitWrap.appendChild(splitALabel);
  splitWrap.appendChild(splitSlider);
  splitWrap.appendChild(splitReadout);
  splitWrap.appendChild(splitBLabel);
  splitOverlay.appendChild(splitTitle);
  splitOverlay.appendChild(splitHint);
  splitOverlay.appendChild(splitWrap);

  const panelAHeader = document.createElement('div');
  panelAHeader.style.display = 'flex';
  panelAHeader.style.justifyContent = 'space-between';
  panelAHeader.style.alignItems = 'center';
  const panelATitle = createPanelTitle('Tonemap A (Left)');
  const hideAButton = document.createElement('button');
  hideAButton.textContent = 'Hide A';
  styleButton(hideAButton);
  panelAHeader.appendChild(panelATitle);
  panelAHeader.appendChild(hideAButton);

  const tonemapASelect = createSelect(
    OPERATOR_DESCRIPTORS.map((x) => ({ value: x.id, label: x.label })),
    initial.tonemapA
  );
  const tonemapALabel = createLabel('Operator');
  tonemapALabel.appendChild(tonemapASelect);

  const paramsASection = document.createElement('div');
  paramsASection.style.display = 'grid';
  paramsASection.style.gap = '6px';
  panelA.appendChild(panelAHeader);
  panelA.appendChild(tonemapALabel);
  panelA.appendChild(paramsASection);

  const panelBHeader = document.createElement('div');
  panelBHeader.style.display = 'flex';
  panelBHeader.style.justifyContent = 'space-between';
  panelBHeader.style.alignItems = 'center';
  const panelBTitle = createPanelTitle('Tonemap B (Right)');
  const hideBButton = document.createElement('button');
  hideBButton.textContent = 'Hide B';
  styleButton(hideBButton);
  panelBHeader.appendChild(panelBTitle);
  panelBHeader.appendChild(hideBButton);

  const tonemapBSelect = createSelect(
    OPERATOR_DESCRIPTORS.map((x) => ({ value: x.id, label: x.label })),
    initial.tonemapB
  );
  const tonemapBLabel = createLabel('Operator');
  tonemapBLabel.appendChild(tonemapBSelect);

  const paramsBSection = document.createElement('div');
  paramsBSection.style.display = 'grid';
  paramsBSection.style.gap = '6px';
  panelB.appendChild(panelBHeader);
  panelB.appendChild(tonemapBLabel);
  panelB.appendChild(paramsBSection);

  container.appendChild(toolsPanel);
  container.appendChild(panelA);
  container.appendChild(panelB);
  container.appendChild(splitOverlay);
  container.appendChild(showAButton);
  container.appendChild(showBButton);
  container.appendChild(globalToggleButton);

  const viewState = {
    globalVisible: initial.panelVisible,
    sideAVisible: true,
    sideBVisible: true
  };

  const renderParamsSection = (node: HTMLElement, side: OperatorSide, op: TonemapOperator, state: OperatorParamState): void => {
    node.innerHTML = '';
    const descriptor = getOperatorDescriptor(op);
    if (descriptor.params.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '该算法无可调参数';
      empty.style.fontSize = '12px';
      empty.style.opacity = '0.8';
      node.appendChild(empty);
      return;
    }
    for (const paramDesc of descriptor.params) {
      renderParamControl(node, side, paramDesc, state[op], callbacks);
    }
  };

  const syncSidePanels = (): void => {
    const splitOn = compareSelect.value === 'splitAB';
    const showGlobal = viewState.globalVisible;
    toolsPanel.style.display = showGlobal ? 'grid' : 'none';
    splitOverlay.style.display = showGlobal && splitOn ? 'grid' : 'none';

    panelA.style.display = showGlobal && viewState.sideAVisible ? 'grid' : 'none';
    showAButton.style.display = showGlobal && !viewState.sideAVisible ? 'block' : 'none';

    panelB.style.display = showGlobal && splitOn && viewState.sideBVisible ? 'grid' : 'none';
    showBButton.style.display = showGlobal && splitOn && !viewState.sideBVisible ? 'block' : 'none';

    if (!splitOn) {
      panelB.style.display = 'none';
      showBButton.style.display = 'none';
    }
  };

  const syncChannelUi = (): void => {
    const channelVisible = viewSelect.value === 'channelInspect';
    channelLabel.style.display = channelVisible ? 'grid' : 'none';
  };

  const syncResponsiveLayout = (): void => {
    const mobile = window.innerWidth <= 900;
    if (mobile) {
      toolsPanel.style.width = 'calc(100% - 24px)';
      toolsPanel.style.left = '12px';
      toolsPanel.style.transform = 'none';
      toolsPanel.style.gridTemplateColumns = 'repeat(2, minmax(120px, 1fr))';

      panelA.style.top = '240px';
      panelA.style.bottom = '12px';
      panelA.style.width = 'calc(100% - 24px)';
      panelA.style.left = '12px';
      panelA.style.right = '12px';

      panelB.style.top = '240px';
      panelB.style.bottom = '12px';
      panelB.style.width = 'calc(100% - 24px)';
      panelB.style.left = '12px';
      panelB.style.right = '12px';

      splitOverlay.style.width = 'min(500px, calc(100% - 24px))';
      splitOverlay.style.bottom = '12px';
    } else {
      toolsPanel.style.width = 'min(880px, calc(100% - 92px))';
      toolsPanel.style.left = '50%';
      toolsPanel.style.transform = 'translateX(-50%)';
      toolsPanel.style.gridTemplateColumns = 'repeat(6, minmax(100px, 1fr))';

      panelA.style.top = '92px';
      panelA.style.bottom = '12px';
      panelA.style.width = 'min(320px, 38vw)';
      panelA.style.left = '12px';
      panelA.style.right = 'auto';

      panelB.style.top = '92px';
      panelB.style.bottom = '12px';
      panelB.style.width = 'min(320px, 38vw)';
      panelB.style.left = 'auto';
      panelB.style.right = '12px';

      splitOverlay.style.width = 'min(420px, 68vw)';
      splitOverlay.style.bottom = '18px';
    }
  };

  const setVisible = (visible: boolean, notify = true): void => {
    viewState.globalVisible = visible;
    globalToggleButton.textContent = visible ? 'Hide UI' : 'Show UI';
    syncSidePanels();
    if (notify) {
      callbacks.onVisibilityChange(visible);
    }
  };

  inputSelect.onchange = () => callbacks.onInputChange(inputSelect.value as InputSource);
  viewSelect.onchange = () => {
    syncChannelUi();
    callbacks.onViewChange(viewSelect.value as ViewMode);
  };
  compareSelect.onchange = () => {
    syncSidePanels();
    callbacks.onCompareModeChange(compareSelect.value as CompareMode);
  };
  inputColorSpaceSelect.onchange = () => callbacks.onInputColorSpaceChange(inputColorSpaceSelect.value as InputColorSpace);
  channelSelect.onchange = () => callbacks.onChannelChange(Number(channelSelect.value) as 0 | 1 | 2);
  tonemapASelect.onchange = () => callbacks.onTonemapAChange(tonemapASelect.value as TonemapOperator);
  tonemapBSelect.onchange = () => callbacks.onTonemapBChange(tonemapBSelect.value as TonemapOperator);

  resetButton.onclick = () => callbacks.onReset();
  copyButton.onclick = () => callbacks.onCopyShareUrl();
  hideUiButton.onclick = () => setVisible(false);
  globalToggleButton.onclick = () => setVisible(!viewState.globalVisible);

  hideAButton.onclick = () => {
    viewState.sideAVisible = false;
    syncSidePanels();
  };
  hideBButton.onclick = () => {
    viewState.sideBVisible = false;
    syncSidePanels();
  };
  showAButton.onclick = () => {
    viewState.sideAVisible = true;
    syncSidePanels();
  };
  showBButton.onclick = () => {
    viewState.sideBVisible = true;
    syncSidePanels();
  };

  syncResponsiveLayout();
  syncChannelUi();
  renderParamsSection(paramsASection, 'A', initial.tonemapA, initial.paramsA);
  renderParamsSection(paramsBSection, 'B', initial.tonemapB, initial.paramsB);
  setVisible(initial.panelVisible, false);

  const onWindowResize = (): void => {
    syncResponsiveLayout();
    syncSidePanels();
  };
  window.addEventListener('resize', onWindowResize);

  return {
    setState(state: ControlsState): void {
      inputSelect.value = state.input;
      viewSelect.value = state.view;
      exposureSlider.value = String(state.exposure);
      exposureReadout.textContent = state.exposure.toFixed(2);
      compareSelect.value = state.compareMode;
      splitSlider.value = String(state.split);
      splitReadout.textContent = state.split.toFixed(2);
      inputColorSpaceSelect.value = state.inputColorSpace;
      channelSelect.value = String(state.channel);
      tonemapASelect.value = state.tonemapA;
      tonemapBSelect.value = state.tonemapB;
      syncChannelUi();
      syncSidePanels();
      renderParamsSection(paramsASection, 'A', state.tonemapA, state.paramsA);
      renderParamsSection(paramsBSection, 'B', state.tonemapB, state.paramsB);
      setVisible(state.panelVisible, false);
    },
    setVisible(visible: boolean): void {
      setVisible(visible);
    },
    toggle(): void {
      setVisible(!viewState.globalVisible);
    },
    destroy(): void {
      window.removeEventListener('resize', onWindowResize);
      inputSelect.onchange = null;
      viewSelect.onchange = null;
      exposureSlider.oninput = null;
      compareSelect.onchange = null;
      splitSlider.oninput = null;
      inputColorSpaceSelect.onchange = null;
      channelSelect.onchange = null;
      tonemapASelect.onchange = null;
      tonemapBSelect.onchange = null;
      resetButton.onclick = null;
      copyButton.onclick = null;
      hideUiButton.onclick = null;
      globalToggleButton.onclick = null;
      hideAButton.onclick = null;
      hideBButton.onclick = null;
      showAButton.onclick = null;
      showBButton.onclick = null;
      toolsPanel.remove();
      panelA.remove();
      panelB.remove();
      splitOverlay.remove();
      showAButton.remove();
      showBButton.remove();
      globalToggleButton.remove();
    }
  };
}
