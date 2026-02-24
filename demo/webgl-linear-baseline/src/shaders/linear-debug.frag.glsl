#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uInputTex;
uniform int uViewMode;
uniform float uExposure;
uniform int uChannel;
uniform int uTonemapA;
uniform int uTonemapB;
uniform int uCompareMode;
uniform float uSplit;
uniform int uInputColorSpace;

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 linearToSrgb(vec3 linearColor) {
  vec3 cutoff = step(linearColor, vec3(0.0031308));
  vec3 lower = 12.92 * linearColor;
  vec3 upper = 1.055 * pow(max(linearColor, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(upper, lower, cutoff);
}

vec3 acesFitted(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 reinhard(vec3 x) {
  return x / (1.0 + x);
}

const mat3 ACESCG_TO_LINEAR_SRGB = mat3(
  1.7048586763, -0.1300768242, -0.0239640729,
  -0.6217160219, 1.1407357748, -0.1289755083,
  -0.0832993717, -0.0105598017, 1.1530140189
);

const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
  1.6605, -0.1246, -0.0182,
  -0.5876, 1.1329, -0.1006,
  -0.0728, -0.0083, 1.1187
);

const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
  0.6274, 0.0691, 0.0164,
  0.3293, 0.9195, 0.0880,
  0.0433, 0.0113, 0.8956
);

const mat3 AGX_INSET_MATRIX = mat3(
  0.8566271533, 0.1373189729, 0.1118982130,
  0.0951212405, 0.7612419906, 0.0767994186,
  0.0482516061, 0.1014390365, 0.8113023684
);

const mat3 AGX_OUTSET_MATRIX = mat3(
  1.1271005818, -0.1413297635, -0.1413297635,
  -0.1106066431, 1.1578237022, -0.1106066431,
  -0.0164939387, -0.0164939387, 1.2519364066
);

const float AGX_MIN_EV = -12.47393;
const float AGX_MAX_EV = 4.026069;

vec3 agxDefaultContrastApprox(vec3 x) {
  vec3 x2 = x * x;
  vec3 x4 = x2 * x2;
  return
      15.5 * x4 * x2
    - 40.14 * x4 * x
    + 31.96 * x4
    - 6.868 * x2 * x
    + 0.4298 * x2
    + 0.1191 * x
    - 0.00232;
}

vec3 agxLook(vec3 color, vec3 slope, vec3 offset, vec3 power, float saturation) {
  color = pow(max(color * slope + offset, vec3(0.0)), power);
  float luma = luminance(color);
  return luma + saturation * (color - luma);
}

vec3 agxCurve(vec3 color) {
  color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
  color = AGX_INSET_MATRIX * color;
  color = max(color, vec3(1e-10));
  color = clamp(log2(color), AGX_MIN_EV, AGX_MAX_EV);
  color = (color - AGX_MIN_EV) / (AGX_MAX_EV - AGX_MIN_EV);
  color = clamp(color, 0.0, 1.0);
  color = agxDefaultContrastApprox(color);
  return color;
}

vec3 agxEotf(vec3 color) {
  color = AGX_OUTSET_MATRIX * color;
  color = pow(max(color, vec3(0.0)), vec3(2.2));
  color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
  return clamp(color, 0.0, 1.0);
}

vec3 agx(vec3 color) {
  return agxEotf(agxCurve(color));
}

vec3 agxPunchy(vec3 color) {
  vec3 c = agxCurve(color);
  c = agxLook(c, vec3(1.0), vec3(0.0), vec3(1.35), 1.4);
  return agxEotf(c);
}

vec3 decodeInputColorSpace(vec3 color) {
  if (uInputColorSpace == 1) {
    return ACESCG_TO_LINEAR_SRGB * color;
  }
  return color;
}

vec3 applyTonemap(vec3 linearColor, int op) {
  vec3 x = max(linearColor, vec3(0.0));
  if (op == 1) {
    return acesFitted(x);
  }
  if (op == 2) {
    return reinhard(x);
  }
  if (op == 3) {
    return agx(x);
  }
  if (op == 4) {
    return agxPunchy(x);
  }
  return x;
}

vec3 turboColormap(float t) {
  t = clamp(t, 0.0, 1.0);
  float r = 34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))));
  float g = 23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))));
  float b = 27.2 + t * (3211.1 - t * (15327.97 - t * (27814.0 - t * (22569.18 - t * 6838.66))));
  return clamp(vec3(r, g, b) / 255.0, 0.0, 1.0);
}

vec3 falseColor(float luma) {
  float t = clamp(log2(luma + 1.0) / 6.0, 0.0, 1.0);
  return turboColormap(t);
}

void main() {
  // WebGL texture coordinates are bottom-left origin while our CPU-side
  // generated/uploaded image rows are top-down, so flip Y for sampling.
  vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
  vec3 linearColor = texture(uInputTex, sampleUv).rgb;
  linearColor = decodeInputColorSpace(linearColor);
  linearColor *= exp2(uExposure);
  vec3 previewA = applyTonemap(linearColor, uTonemapA);
  vec3 previewB = applyTonemap(linearColor, uTonemapB);
  bool splitMode = (uCompareMode == 1) && (uViewMode == 0);
  vec3 previewLinear = splitMode && (vUv.x >= uSplit) ? previewB : previewA;

  vec3 outColor;
  if (uViewMode == 0) {
    outColor = linearToSrgb(previewLinear);
  } else if (uViewMode == 1) {
    outColor = falseColor(luminance(linearColor));
  } else if (uViewMode == 2) {
    float l = luminance(linearColor);
    float t = clamp(l / 8.0, 0.0, 1.0);
    outColor = vec3(t, t * t, 1.0 - t);
  } else {
    float v = uChannel == 0 ? linearColor.r : (uChannel == 1 ? linearColor.g : linearColor.b);
    vec3 mono = vec3(v);
    outColor = linearToSrgb(mono);
  }

  if (splitMode && abs(vUv.x - uSplit) < 0.0015) {
    outColor = vec3(1.0);
  }

  fragColor = vec4(clamp(outColor, 0.0, 1.0), 1.0);
}
