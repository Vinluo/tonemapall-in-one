# Tonemap All-in-One

English | [简体中文](README_CN.md)

`Tonemap All-in-One` is a tone mapping project centered on **interactive visual comparison**.

This repository currently focuses on:

1. Running and comparing multiple tonemap operators with A/B and split-screen views.
2. Validating a shared input pipeline across HDR, EXR, and LDR sources.
3. Keeping the implementation minimal enough to embed into a blog quickly with WebGL2.

## Visual Preview

![Tonemap comparison collage](docs/assets/readme/tonemap-compare-collage.png)

The hero image uses a compact horizontal montage from `EXR StillLife`, with two high-resolution strip comparisons kept below:

1. `EXR StillLife`
2. `HDR Scene 01`

The fixed operator set shown here is:

1. `Linear`
2. `ACES`
3. `Reinhard`
4. `AgX`
5. `AgX Golden`
6. `Uchimura`
7. `GT7`
8. `Flim`

The high-resolution per-operator source renders for `EXR StillLife` are kept in `docs/assets/readme/exr-stilllife-*.png`.

### EXR StillLife

![EXR StillLife tonemap comparison](docs/assets/readme/exr-stilllife-compare.png)

### HDR Scene 01

![HDR Scene 01 tonemap comparison](docs/assets/readme/hdr-scene-01-compare.png)

## Demo (Primary Entry)

- Path: `demo/webgl-linear-baseline`
- Stack: Vite + TypeScript + native WebGL2
- Main capabilities:
  - Input switching: procedural patterns / HDR / EXR / local image upload
  - Diagnostic views: sRGB preview / false color / luminance heatmap / channel inspect
  - Operator switching: ACES, AgX variants, Reinhard, Uchimura, Hejl, GT7, Tony, Flim, AMD LPM
  - A/B comparison: split view with independent parameters

### Local Run

```bash
cd demo/webgl-linear-baseline
npm install
npm run dev
```

### Build and Test

```bash
npm run test
npm run build
npm run build:pages
```


## References

The source references, papers, snapshots, and index remain in:

- Index: `references/tonemap-all-in-one/INDEX.md`
- Snapshot directory: `references/tonemap-all-in-one/snapshots`
- Algorithm mapping: `references/tonemap-all-in-one/algorithms`

## Lightweight Project Governance

- Vision: `management/PROJECT_VISION.md`
- Progress: `management/PROGRESS.md`
