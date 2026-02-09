# Tonemap All-in-One References

更新时间：2026-02-10

这个目录用于快速索引你要求的 tone mapping 参考资料（ACES、AgX、AgX 变体、Reinhard、Tony McMapface、Flim、Gran Turismo/Uchimura、Hejl、GT7、AMD LPM）。

## 快速入口

- `algorithms/aces.md`
- `algorithms/agx.md`
- `algorithms/agx-variants.md`
- `algorithms/reinhard.md`
- `algorithms/tony-mc-mapface.md`
- `algorithms/flim-by-bean.md`
- `algorithms/gran-turismo-uchimura.md`
- `algorithms/hejl.md`
- `algorithms/gt7.md`
- `algorithms/amd-lpm.md`

## 快速索引表

| 算法 | Primary References | Production / Shader References | 本地快照 |
|---|---|---|---|
| ACES | [ACES Central](https://docs.acescentral.com/), [aces-dev](https://github.com/ampas/aces-dev) | [BakingLab ACES.hlsl](https://github.com/TheRealMJP/BakingLab/blob/master/BakingLab/ACES.hlsl), [glsl-tone-map/aces.glsl](https://unpkg.com/glsl-tone-map@2.2.0/aces.glsl) | `snapshots/aces.glsl`, `snapshots/aces-dev-README.md` |
| AgX | [sobotka/AgX](https://github.com/sobotka/AgX) | [three.js AgX](https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js), [Bevy tonemapping_shared.wgsl](https://github.com/bevyengine/bevy/blob/main/crates/bevy_core_pipeline/src/tonemapping/tonemapping_shared.wgsl) | `snapshots/agx.glsl`, `snapshots/threejs_tonemapping_pars_fragment.glsl.js`, `snapshots/bevy_tonemapping_shared.wgsl` |
| AgX 变体 | [Minimal AgX](https://iolite-engine.com/blog_posts/minimal_agx_implementation) | [glsl-tone-map agxGolden/agxPunchy](https://unpkg.com/glsl-tone-map@2.2.0/agx.glsl) | `snapshots/agx.glsl` |
| Reinhard | [Photographic Tone Reproduction](https://w3.impa.br/~lvelho/ip02/papers/reinhard/), [Paper PDF](https://w3.impa.br/~lvelho/ip02/papers/reinhard/tonemap.pdf) | [glsl-tone-map/reinhard.glsl](https://unpkg.com/glsl-tone-map@2.2.0/reinhard.glsl), [64.github.io guide](https://64.github.io/tonemapping/#reinhard) | `snapshots/reinhard-tonemap-2002.pdf`, `snapshots/reinhard.glsl` |
| Tony McMapface | [h3r2tic/tony-mc-mapface](https://github.com/h3r2tic/tony-mc-mapface) | [tony_mc_mapface.hlsl](https://github.com/h3r2tic/tony-mc-mapface/blob/main/shader/tony_mc_mapface.hlsl) | `snapshots/tony-mc-mapface-README.md`, `snapshots/tony_mc_mapface.hlsl` |
| Flim by Bean | [bean-mhm/flim](https://github.com/bean-mhm/flim), [Releases](https://github.com/bean-mhm/flim/releases) | [flim.py](https://github.com/bean-mhm/flim/blob/main/flim.py), [Shadertoy port](https://www.shadertoy.com/view/dd2yDz) | `snapshots/flim-README.md`, `snapshots/flim.py`, `snapshots/flim-main.py` |
| Gran Turismo / Uchimura | [HDR Theory and Practice (Slides)](https://www.slideshare.net/nikuque/hdr-theory-and-practicce-jp) | [glsl-tone-map/uchimura.glsl](https://unpkg.com/glsl-tone-map@2.2.0/uchimura.glsl), [64.github.io](https://64.github.io/tonemapping/) | `snapshots/uchimura.glsl`, `snapshots/uchimura_hdr_theory_and_practice_slideshare.html` |
| Hejl (Jim Hejl) | [Filmic Tonemapping Operators](http://filmicworlds.com/blog/filmic-tonemapping-operators/) | [MJP tone mapping roundup](https://therealmjp.github.io/posts/a-closer-look-at-tone-mapping/) | `snapshots/filmicworlds-tonemapping-operators.html` |
| GT7 | [SIGGRAPH 2025 course page](https://blog.selfshadow.com/publications/s2025-shading-course/) | [GT7 code sample](https://blog.selfshadow.com/publications/s2025-shading-course/pdi/supplemental/gt7_tone_mapping.cpp), [GT7 slides v1.1 PDF](https://blog.selfshadow.com/publications/s2025-shading-course/pdi/s2025_pbs_pdi_slides_v1.1.pdf) | `snapshots/gt7_tone_mapping.cpp`, `snapshots/gt7_pbs_slides_v1.1.pdf` |
| AMD LPM | [GPUOpen LPM page](https://gpuopen.com/fidelityfx-lpm/), [GPUOpen SDK manual](https://gpuopen.com/manuals/fidelityfx_sdk/fidelityfx_sdk-group__ffxlpm/) | [FidelityFX-LPM repo](https://github.com/GPUOpen-Effects/FidelityFX-LPM), [ffx_lpm.h](https://github.com/GPUOpen-Effects/FidelityFX-LPM/blob/master/ffx-lpm/ffx_lpm.h) | `snapshots/ffx_lpm.h`, `snapshots/fidelityfx-lpm-readme.md`, `snapshots/LPM_doc.pdf` |

## 本地快照目录

- `snapshots/` 包含关键源码与论文/PDF快照，适合离线对照。
- `references.json` 提供机器可读索引，可直接被博客脚本读取。
