# 10. ACES

## 问题定义

ACES 关注的是在较宽动态范围下，获得电影风格的高光 roll-off 和稳定的整体色彩观感，减少简单曲线压缩带来的塑料感与高光断层。

## 输入输出

- 输入：线性场景 RGB（通常先映射到 ACES 工作空间，或使用 fit 版本在渲染空间近似）。
- 输出：显示参考 RGB（常见是近似 ACES RRT+ODT 后再输出到 sRGB 显示）。

## 核心流程图

```mermaid
flowchart TD
A1["线性场景RGB"] --> A2["曝光归一化"]
A2 --> A3["工作色域准备(AP1或近似矩阵)"]
A3 --> A4["RRT风格非线性压缩"]
A4 --> A5["ODT风格显示适配"]
A5 --> A6["高光平滑roll-off"]
A6 --> A7["输出到显示RGB"]
```

## 实现流程图

```mermaid
flowchart TD
B1["输入准备: 采样线性HDR纹理"] --> B2["曝光处理: color * 2^EV"]
B2 --> B3["色彩变换: 渲染空间到ACES近似空间"]
B3 --> B4["曲线映射: ACES fitted/RRT-ODT近似"]
B4 --> B5["输出编码: Linear到sRGB"]
B5 --> B6["屏幕输出与调试叠加"]
```

## 伪代码骨架

```text
color = sampleLinearHDR(uv)
color = applyExposure(color, ev)
acesColor = toACESLikeWorkingSpace(color)
mapped = acesFitted(acesColor)
outColor = encodeToSRGB(mapped)
return outColor
```

## 参考映射

- 章节索引：[`references/tonemap-all-in-one/algorithms/aces.md`](../../references/tonemap-all-in-one/algorithms/aces.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/aces.glsl`](../../references/tonemap-all-in-one/snapshots/aces.glsl)
- 本地快照：[`references/tonemap-all-in-one/snapshots/aces-dev-README.md`](../../references/tonemap-all-in-one/snapshots/aces-dev-README.md)
