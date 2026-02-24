# PROJECT PROGRESS (Basic)

- Last Updated: 2026-02-15
- Current Focus: 补齐 EXR 额外测试素材 -> 进入 Tone Mapping 算法接入

## Task List

| ID | Task | Status | Notes |
|---|---|---|---|
| T-001 | 搭建 WebGL2 线性输入最小环境 | DONE | `demo/webgl-linear-baseline` 已可 `dev/build/test` |
| T-002 | 整理 tone mapping references 索引 | DONE | `references/tonemap-all-in-one` 已完成 |
| T-003 | 接入第一个 tone mapping 算法对照（ACES） | DONE | 已接入 ACES，支持 A/B 对比 |
| T-004 | 增加算法切换与统一参数面板 | IN_PROGRESS | 已支持 `none/aces/reinhard/agx/agxPunchy`、split A/B、输入色彩空间切换 |
| T-005 | 博客内嵌示例与接入文档 | TODO | 产出 iife 接入片段 |
| T-006 | 新增 EXR 额外测试用例（OpenEXR 样例） | DONE | 已加入 `demo/webgl-linear-baseline/public/assets/exr` |
| T-007 | 将 EXR 输入接入 demo 输入切换与加载链路 | DONE | 已支持 `exr01/exr02/exr03` |

## Simple Status Rules

- `TODO`: 未开始
- `IN_PROGRESS`: 进行中
- `BLOCKED`: 受阻
- `DONE`: 完成

## Next 3 Actions

1. 接入第三个 tone mapping 算子（建议 `AgX` 或 `Hejl`）并加入 A/B 对比。
2. 对 `HDR + EXR` 输入做手动验收截图并补说明。
3. 提供博客最小内嵌代码片段（iife 方式）。
