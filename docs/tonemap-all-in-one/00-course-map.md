# 00. 课程总览（Course Map）

## 学习目标

本教程的目标是把 tone mapping 拆成两个维度：

1. 数学流程：输入是什么，如何压缩动态范围，如何保持颜色感知一致。
2. 工程流程：在 WebGL/Shader 管线里，如何把算法变成稳定可维护的模块。

## 先修知识

- 线性空间与 gamma/sRGB 的区别。
- HDR 与 SDR 的动态范围概念。
- 基础 shader 编程（顶点/片元、纹理采样、uniform）。

## 阅读顺序

1. [`01-why-tonemap.md`](./01-why-tonemap.md)
2. [`02-color-space-and-display-pipeline.md`](./02-color-space-and-display-pipeline.md)
3. [`03-global-pipeline-overview.md`](./03-global-pipeline-overview.md)
4. 算法章节 `10` 到 `18`
5. [`90-implementation-roadmap.md`](./90-implementation-roadmap.md)
6. [`99-glossary.md`](./99-glossary.md)

## 章节组织约定

每个算法章节固定包含 6 个小节：

1. 问题定义
2. 输入输出
3. 核心流程图
4. 实现流程图
5. 伪代码骨架
6. 参考映射

## 如何配合当前代码库实践

- 基线工程：[`demo/webgl-linear-baseline`](../../demo/webgl-linear-baseline)
- 参考资料索引：[`references/tonemap-all-in-one/INDEX.md`](../../references/tonemap-all-in-one/INDEX.md)
- 建议做法：每阅读一个算法章节，就在 baseline 里增加一个 `ViewMode` 或 `TonemapOperator`，并截图记录对比。
