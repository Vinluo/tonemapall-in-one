# EXR 测试图集（额外测试用例）

本目录存放 OpenEXR 格式测试图，用于补充 HDR `.hdr` 之外的输入验证。

## 文件清单

1. `Carrots.exr`
- 来源：`https://raw.githubusercontent.com/AcademySoftwareFoundation/openexr-images/main/ScanLines/Carrots.exr`
- 类型：`scanline`
- 场景：静物（中高频纹理、颜色饱和度测试）

2. `StillLife.exr`
- 来源：`https://raw.githubusercontent.com/AcademySoftwareFoundation/openexr-images/main/ScanLines/StillLife.exr`
- 类型：`scanline`
- 场景：室内静物（高亮反射与阴影细节测试）

3. `Kapaa.exr`
- 来源：`https://raw.githubusercontent.com/AcademySoftwareFoundation/openexr-images/main/MultiResolution/Kapaa.exr`
- 类型：`tiled / multi-resolution`
- 场景：户外自然（亮暗范围与远景层次测试）

## 说明

- 这 3 个文件来自 Academy Software Foundation 的 `openexr-images` 仓库。
- 当前 demo 已接入 EXR 读取链路，可通过输入源 `exr01` / `exr02` / `exr03` 直接切换测试。
