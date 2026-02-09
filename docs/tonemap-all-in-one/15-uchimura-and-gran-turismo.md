# 15. Uchimura / Gran Turismo

## 问题定义

Uchimura（常称 Gran Turismo 曲线）强调可控参数下的高光肩部、线性中段与暗部过渡，适合实时渲染中做可调且稳定的视觉风格控制。

## 输入输出

- 输入：线性场景 RGB（曝光后的工作域数据）。
- 输出：经过分段/平滑函数压缩后的显示线性 RGB。

## 核心流程图

```mermaid
flowchart TD
A1["线性输入"] --> A2["参数化分段准备(m,a,l,c,b)"]
A2 --> A3["暗部段映射"]
A3 --> A4["中间线性段映射"]
A4 --> A5["高光肩部压缩"]
A5 --> A6["段间平滑拼接"]
A6 --> A7["输出显示RGB"]
```

## 实现流程图

```mermaid
flowchart TD
B1["输入准备: HDR采样或测试图"] --> B2["曝光处理: EV和白点控制"]
B2 --> B3["色彩变换: 可选亮度域处理"]
B3 --> B4["曲线映射: Uchimura分段函数"]
B4 --> B5["输出编码: 转sRGB预览"]
B5 --> B6["UI参数: m/a/l/c/b实时调节"]
```

## 伪代码骨架

```text
color = sampleLinearHDR(uv)
color = applyExposure(color, ev)
params = buildUchimuraParams(m, a, l, c, b)
mapped = uchimuraCurve(color, params)
outColor = encodeToSRGB(mapped)
return outColor
```

## 参考映射

- 章节索引：[`references/tonemap-all-in-one/algorithms/gran-turismo-uchimura.md`](../../references/tonemap-all-in-one/algorithms/gran-turismo-uchimura.md)
- 本地快照：[`references/tonemap-all-in-one/snapshots/uchimura.glsl`](../../references/tonemap-all-in-one/snapshots/uchimura.glsl)
- 本地快照：[`references/tonemap-all-in-one/snapshots/uchimura_hdr_theory_and_practice_slideshare.html`](../../references/tonemap-all-in-one/snapshots/uchimura_hdr_theory_and_practice_slideshare.html)
