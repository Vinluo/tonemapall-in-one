# Tonemap All-in-One

`Tonemap All-in-One` 是一个以 **交互演示** 为核心的 tone mapping 工程。

当前主仓库重点是：

1. 运行并对比多种 tonemap 算子（A/B 对比、分屏）。
2. 用统一输入链路验证 HDR/EXR/LDR 场景。
3. 通过最小 WebGL2 实现快速嵌入博客。

## Demo（主入口）

- 路径：`demo/webgl-linear-baseline`
- 技术栈：Vite + TypeScript + 原生 WebGL2
- 主要能力：
  - 输入源切换：程序化图案 / HDR / EXR / 本地上传图片
  - 视图诊断：sRGB 预览 / false color / luminance heatmap / channel inspect
  - 算子切换：ACES、AgX 系列、Reinhard、Uchimura、Hejl、GT7、Tony、Flim、AMD LPM
  - A/B 对比：Split AB + 独立参数

### 本地运行

```bash
cd demo/webgl-linear-baseline
npm install
npm run dev
```

### 构建与测试

```bash
npm run test
npm run build
npm run build:pages
```

### GitHub Pages 部署示例

- 工作流：`.github/workflows/deploy-demo.yml`
- 触发：推送到 `master` 或手动触发
- 产物：`demo/webgl-linear-baseline/dist-pages`

说明：

1. `npm run build` 继续产出可嵌入博客的库包。
2. `npm run build:pages` 产出可直接部署到 GitHub Pages 的演示站点。

## References（保留）

算法来源、论文、快照和索引保留在：

- 索引：`references/tonemap-all-in-one/INDEX.md`
- 快照目录：`references/tonemap-all-in-one/snapshots`
- 算法映射：`references/tonemap-all-in-one/algorithms`

## 项目治理（轻量）

- 愿景：`management/PROJECT_VISION.md`
- 进度：`management/PROGRESS.md`
