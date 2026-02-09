# 99. 术语表（Glossary）

## 核心术语

- `HDR`：High Dynamic Range，高动态范围。
- `SDR`：Standard Dynamic Range，标准动态范围。
- `Tone Mapping`：把场景动态范围映射到目标显示动态范围的过程。
- `Scene-referred`：场景参考数据，强调物理/相对光能关系。
- `Display-referred`：显示参考数据，强调面向目标设备的输出。

## 颜色与编码

- `Linear`：线性空间，数值与光能近似成比例。
- `sRGB`：常见显示色彩空间与非线性编码组合。
- `Rec.709`：传统 HDTV 色域标准。
- `Rec.2020`：更宽色域标准。
- `OETF`：光电传递函数，线性光到编码信号。
- `EOTF`：电光传递函数，编码信号到显示亮度。
- `PQ (ST-2084)`：HDR 常用感知量化传递函数。

## 渲染与显示流程

- `Exposure`：曝光控制，常用 `color * 2^EV`。
- `Luma/Luminance`：亮度相关分量，常用于 tone mapping 引导。
- `Gamut Mapping`：色域映射，把颜色约束到目标色域。
- `Roll-off`：高光肩部的平滑压缩段。

## 算法名词

- `ACES`：Academy Color Encoding System 及其显示变换链。
- `AgX`：强调中间调和颜色稳定的现代渲染映射方案。
- `Reinhard`：经典全局 tone mapping 算子。
- `Hejl/HBD`：Jim Hejl 与 Burgess-Dawson 的轻量 filmic 近似。
- `Tony McMapface`：基于 3D LUT 的 tone mapping 方案。
- `Flim`：Bean 的胶片风格变换链。
- `Uchimura`：Gran Turismo 系列参数化分段曲线。
- `GT7`：Gran Turismo 7 的完整感知/显示链路实践。
- `LPM`：AMD Luma Preserving Mapper，亮度保持型映射。

## 文档内约定

- “核心流程图”指算法数学逻辑。
- “实现流程图”指工程模块与数据流。
- 算法章节统一模板见 [`00-course-map.md`](./00-course-map.md)。
