# 14. Flim by Bean

## 问题定义

Flim 是面向胶片风格模拟的变换链，强调观感风格塑造与颜色压缩协同，不仅是单一曲线，而是一组联动步骤。

## 输入输出

- 输入：线性场景 RGB（通常假设在一致工作色域中）。
- 输出：film-style display RGB，可用于后续输出编码。

## 核心流程图

```mermaid
flowchart TD
A1["线性输入"] --> A2["曝光与中灰对齐"]
A2 --> A3["胶片风格色彩预处理"]
A3 --> A4["主压缩曲线"]
A4 --> A5["高光/饱和度联动修正"]
A5 --> A6["风格化输出线性RGB"]
A6 --> A7["显示编码"]
```

## 实现流程图

```mermaid
flowchart TD
B1["输入准备: 线性纹理采样"] --> B2["曝光处理: 统一EV控制"]
B2 --> B3["色彩变换: flim预处理函数"]
B3 --> B4["曲线映射: flim核心映射段"]
B4 --> B5["输出编码: 到sRGB预览"]
B5 --> B6["参数配置: 预设与风格切换"]
```

## 伪代码骨架

```text
color = sampleLinearHDR(uv)
color = applyExposure(color, ev)
prepared = flimPreTransform(color, preset)
mapped = flimMainCurve(prepared, preset)
styled = flimPostAdjust(mapped, preset)
outColor = encodeToSRGB(styled)
return outColor
```

## 参考映射

- 章节索引：[`references/tonemap-all-in-one/algorithms/flim-by-bean.md`](../../references/tonemap-all-in-one/algorithms/flim-by-bean.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/flim-README.md`](../../references/tonemap-all-in-one/snapshots/flim-README.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/flim.py`](../../references/tonemap-all-in-one/snapshots/flim.py)
- 本地快照：[`references/tonemap-all-in-one/snapshots/flim-main.py`](../../references/tonemap-all-in-one/snapshots/flim-main.py)
