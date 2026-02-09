# 18. AMD LPM（Luma Preserving Mapper）

## 问题定义

AMD LPM 旨在在高动态范围压缩过程中尽量保持亮度感知一致性与颜色稳定，适合实时图形管线中做高性能映射。

## 输入输出

- 输入：线性 HDR RGB（可结合预曝光与色域信息）。
- 输出：LPM 处理后的显示线性 RGB，随后做目标输出编码。

## 核心流程图

```mermaid
flowchart TD
A1["线性HDR输入"] --> A2["亮度分量提取"]
A2 --> A3["色度与亮度解耦"]
A3 --> A4["亮度保持型压缩映射"]
A4 --> A5["色度重组与饱和控制"]
A5 --> A6["输出线性显示RGB"]
A6 --> A7["编码到目标显示"]
```

## 实现流程图

```mermaid
flowchart TD
B1["输入准备: HDR纹理与LPM常量"] --> B2["曝光处理: 预曝光参数"]
B2 --> B3["色彩变换: LPM输入预处理"]
B3 --> B4["曲线映射: 调用LPM核心函数"]
B4 --> B5["输出编码: sRGB或HDR编码"]
B5 --> B6["性能检查: 常量缓存与分支控制"]
```

## 伪代码骨架

```text
color = sampleLinearHDR(uv)
color = applyExposure(color, ev)
lpmInput = lpmPrepare(color, constants)
mapped = lpmMap(lpmInput, constants)
outColor = encodeToDisplay(mapped, target)
return outColor
```

## 参考映射

- 章节索引：[`references/tonemap-all-in-one/algorithms/amd-lpm.md`](../../references/tonemap-all-in-one/algorithms/amd-lpm.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/ffx_lpm.h`](../../references/tonemap-all-in-one/snapshots/ffx_lpm.h)
- 本地快照：[`references/tonemap-all-in-one/snapshots/LPMPS.glsl`](../../references/tonemap-all-in-one/snapshots/LPMPS.glsl)
- 本地快照：[`references/tonemap-all-in-one/snapshots/fidelityfx-lpm-readme.md`](../../references/tonemap-all-in-one/snapshots/fidelityfx-lpm-readme.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/LPM_doc.pdf`](../../references/tonemap-all-in-one/snapshots/LPM_doc.pdf)
