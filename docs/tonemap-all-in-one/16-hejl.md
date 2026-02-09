# 16. Hejl（Jim Hejl / HBD）

## 问题定义

Hejl-Burgess-Dawson 公式是实时渲染中常见的轻量 filmic 近似，目标是在极低成本下获得比线性裁剪更自然的高光压缩与整体对比关系。

## 输入输出

- 输入：线性场景 RGB（通常带曝光预乘）。
- 输出：filmic 风格压缩后的显示线性 RGB。

## 核心流程图

```mermaid
flowchart TD
A1["线性输入"] --> A2["曝光与偏移准备"]
A2 --> A3["多项式分子计算"]
A3 --> A4["多项式分母计算"]
A4 --> A5["分式映射与归一化"]
A5 --> A6["可选去伽马或后调节"]
A6 --> A7["输出显示RGB"]
```

## 实现流程图

```mermaid
flowchart TD
B1["输入准备: 采样线性纹理"] --> B2["曝光处理: color * 2^EV"]
B2 --> B3["色彩变换: 通道独立或亮度引导"]
B3 --> B4["曲线映射: Hejl/HBD函数"]
B4 --> B5["输出编码: sRGB编码"]
B5 --> B6["对比检查: 与Reinhard/ACES并排"]
```

## 伪代码骨架

```text
color = sampleLinearHDR(uv)
color = applyExposure(color, ev)
mapped = hejlBurgessDawson(color)
outColor = encodeToSRGB(mapped)
return outColor
```

## 参考映射

- 章节索引：[`references/tonemap-all-in-one/algorithms/hejl.md`](../../references/tonemap-all-in-one/algorithms/hejl.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/filmicworlds-tonemapping-operators.html`](../../references/tonemap-all-in-one/snapshots/filmicworlds-tonemapping-operators.html)
- 本地快照：[`references/tonemap-all-in-one/snapshots/filmic-hable.glsl`](../../references/tonemap-all-in-one/snapshots/filmic-hable.glsl)
