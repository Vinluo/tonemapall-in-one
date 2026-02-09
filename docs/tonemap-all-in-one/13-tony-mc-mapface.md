# 13. Tony McMapface（Tomasz Stachowiak）

## 问题定义

Tony McMapface 的核心思想是将复杂 tone mapping 行为烘焙到 3D LUT，通过查表方式在运行时获得稳定且艺术可控的映射结果。

## 输入输出

- 输入：线性场景 RGB（通常需要归一化到 LUT 采样域）。
- 输出：LUT 映射后的显示线性 RGB，再编码输出。

## 核心流程图

```mermaid
flowchart TD
A1["线性HDR输入"] --> A2["曝光与范围归一化"]
A2 --> A3["映射到LUT坐标域"]
A3 --> A4["3D LUT三线性采样"]
A4 --> A5["可选细节保真调节"]
A5 --> A6["输出显示线性RGB"]
A6 --> A7["编码到目标输出"]
```

## 实现流程图

```mermaid
flowchart TD
B1["输入准备: HDR纹理与3D LUT纹理"] --> B2["曝光处理: EV应用"]
B2 --> B3["色彩变换: RGB归一化到LUT域"]
B3 --> B4["曲线映射: sampleTonyLUT"]
B4 --> B5["输出编码: sRGB或其他编码"]
B5 --> B6["UI参数: LUT强度与混合"]
```

## 伪代码骨架

```text
color = sampleLinearHDR(uv)
color = applyExposure(color, ev)
lutUVW = toTonyLUTCoords(color)
mapped = sample3DLUT(tonyLut, lutUVW)
outColor = encodeToSRGB(mapped)
return outColor
```

## 参考映射

- 章节索引：[`references/tonemap-all-in-one/algorithms/tony-mc-mapface.md`](../../references/tonemap-all-in-one/algorithms/tony-mc-mapface.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/tony-mc-mapface-README.md`](../../references/tonemap-all-in-one/snapshots/tony-mc-mapface-README.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/tony_mc_mapface.hlsl`](../../references/tonemap-all-in-one/snapshots/tony_mc_mapface.hlsl)
