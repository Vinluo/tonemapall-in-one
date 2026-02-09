# PROJECT PROGRESS (Basic)

- Last Updated: 2026-02-10
- Current Focus: WebGL Linear Baseline -> Tone Mapping 扩展准备

## Task List

| ID | Task | Status | Notes |
|---|---|---|---|
| T-001 | 搭建 WebGL2 线性输入最小环境 | DONE | `demo/webgl-linear-baseline` 已可 `dev/build/test` |
| T-002 | 整理 tone mapping references 索引 | DONE | `references/tonemap-all-in-one` 已完成 |
| T-003 | 接入第一个 tone mapping 算法对照（建议 ACES） | TODO | 下一步优先任务 |
| T-004 | 增加算法切换与统一参数面板 | TODO | 在首个算法稳定后开始 |
| T-005 | 博客内嵌示例与接入文档 | TODO | 产出 iife 接入片段 |

## Simple Status Rules

- `TODO`: 未开始
- `IN_PROGRESS`: 进行中
- `BLOCKED`: 受阻
- `DONE`: 完成

## Next 3 Actions

1. 在当前 demo 中实现 ACES 作为首个对照算法。
2. 补一组“Linear vs ACES”对照截图与手动验收记录。
3. 提供博客最小内嵌代码片段（iife 方式）。

