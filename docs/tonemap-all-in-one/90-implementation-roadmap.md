# 90. 实现路线图（从 WebGL Baseline 到全算法）

## 目标

将当前基线工程 [`demo/webgl-linear-baseline`](../../demo/webgl-linear-baseline) 逐步演进为可切换多算法、可对比、可验证的教学与实验平台。

## 当前基线状态（已具备）

1. WebGL2 最小渲染链路可用。
2. 线性输入与基础调试视图可用。
3. 文档参考索引已在 [`references/tonemap-all-in-one`](../../references/tonemap-all-in-one) 整理。

## 分阶段实施

### 阶段 1：统一算法接口层

- 在 shader 端定义统一入口：`applyTonemap(color, operatorId, params)`。
- 在 CPU/UI 端维护 `TonemapOperator` 枚举与参数结构体。
- 保证所有算法共享同一输入准备与输出编码流程。

### 阶段 2：先接轻量闭式算子

建议顺序：

1. Reinhard
2. Hejl
3. Uchimura/Gran Turismo
4. ACES fitted

交付检查：

- 每个算子都可被 UI 切换。
- 固定测试图案下结果稳定且单调。
- 同一曝光下可并排截图对比。

### 阶段 3：接入查表与复杂链路

建议顺序：

1. Tony McMapface（LUT 路线）
2. AgX + Look 变体
3. Flim by Bean（风格链）

交付检查：

- LUT 资源加载与采样正确。
- Look/预设切换无闪烁、无 NaN。
- 参数范围与默认值文档化。

### 阶段 4：接入高阶/感知域链路

建议顺序：

1. AMD LPM
2. GT7 路线（感知空间 + 目标显示编码）

交付检查：

- 明确 SDR 预览与 HDR 目标输出的分支。
- 关键中间值可视化（亮度域/感知域）。
- 性能预算与精度策略明确（FP16/FP32）。

## 工程模块建议

1. `src/core/tonemap/operators/*.glsl`：每算法独立模块。
2. `src/core/tonemap/common.glsl`：共享色彩与编码函数。
3. `src/core/tonemap/dispatcher.glsl`：`operatorId` 分发。
4. `src/ui/minimal-controls.ts`：算法选择与参数面板。
5. `src/__tests__/`：数学函数与参数映射测试。

## 回归与验收清单

1. 输入回归：程序化图案 + HDR 贴图均可跑通所有算子。
2. 数值回归：关键函数无 `NaN/Inf`，输出处于可编码范围。
3. 视觉回归：固定输入下截图 hash 或人工核对通过。
4. 生命周期回归：`mount -> resize -> destroy` 全流程稳定。
5. 文档回归：新增算子必须同步补章节与参考映射。
