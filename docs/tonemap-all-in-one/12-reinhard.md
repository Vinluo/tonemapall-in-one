# 12. Reinhard（Reinhard et al.）

## 问题定义

Reinhard 是经典全局 tone mapping 算子，目标是在低复杂度下完成动态范围压缩，并保持整体亮度关系的连续性。

## 输入输出

- 输入：线性场景 RGB，或由线性 RGB 计算得到的亮度 `L`。
- 输出：压缩后的显示线性 RGB，再编码到 sRGB。

## 核心流程图

```mermaid
flowchart TD
A1["线性场景RGB"] --> A2["计算亮度L"]
A2 --> A3["关键值/曝光标定"]
A3 --> A4["Reinhard压缩 L/(1+L)"]
A4 --> A5["可选白点扩展版本"]
A5 --> A6["按比例回写RGB"]
A6 --> A7["输出显示RGB"]
```

## 实现流程图

```mermaid
flowchart TD
B1["输入准备: 读取线性纹理"] --> B2["曝光处理: EV乘法"]
B2 --> B3["色彩变换: RGB到亮度并保留色比"]
B3 --> B4["曲线映射: Reinhard或Reinhard2"]
B4 --> B5["输出编码: Linear到sRGB"]
B5 --> B6["调试视图: 亮度热力图"]
```

## 伪代码骨架

```text
color = sampleLinearHDR(uv)
color = applyExposure(color, ev)
L = dot(color, lumaWeights)
Ld = reinhard(L, whitePoint)
mapped = color * (Ld / max(L, eps))
outColor = encodeToSRGB(mapped)
return outColor
```

## 参考映射

- 章节索引：[`references/tonemap-all-in-one/algorithms/reinhard.md`](../../references/tonemap-all-in-one/algorithms/reinhard.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/reinhard-tonemap-2002.pdf`](../../references/tonemap-all-in-one/snapshots/reinhard-tonemap-2002.pdf)
- 本地快照：[`references/tonemap-all-in-one/snapshots/reinhard.glsl`](../../references/tonemap-all-in-one/snapshots/reinhard.glsl)
