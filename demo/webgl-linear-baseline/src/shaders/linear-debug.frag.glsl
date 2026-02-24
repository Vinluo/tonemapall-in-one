#version 300 es
precision highp float;
precision highp sampler2D;
precision highp sampler3D;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uInputTex;
uniform sampler3D uTonyLut;
uniform sampler3D uFlimDefaultLut;
uniform sampler3D uFlimNostalgiaLut;
uniform sampler3D uFlimSilverLut;
uniform int uViewMode;
uniform float uExposure;
uniform int uChannel;
uniform int uTonemapA;
uniform int uTonemapB;
uniform int uCompareMode;
uniform float uSplit;
uniform int uInputColorSpace;
uniform vec4 uTonemapParamsA[4];
uniform vec4 uTonemapParamsB[4];
uniform int uTonyLutReady;
uniform int uFlimLutReady;

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 linearToSrgb(vec3 linearColor) {
  vec3 cutoff = step(linearColor, vec3(0.0031308));
  vec3 lower = 12.92 * linearColor;
  vec3 upper = 1.055 * pow(max(linearColor, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(upper, lower, cutoff);
}

vec3 srgbToLinear(vec3 srgb) {
  vec3 cutoff = step(srgb, vec3(0.04045));
  vec3 lower = srgb / 12.92;
  vec3 upper = pow((srgb + 0.055) / 1.055, vec3(2.4));
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

vec3 reinhardExtended(vec3 x, float whitePoint, bool luminanceOnly) {
  vec3 c = max(x, vec3(0.0));
  float wp2 = max(1e-4, whitePoint * whitePoint);
  if (luminanceOnly) {
    float lOld = max(1e-5, luminance(c));
    float lNew = (lOld * (1.0 + lOld / wp2)) / (1.0 + lOld);
    return c * (lNew / lOld);
  }
  return (c * (1.0 + c / wp2)) / (1.0 + c);
}

vec3 hejlBurgess(vec3 x, float whitePoint) {
  vec3 c = max(vec3(0.0), x - 0.004);
  vec3 outC = (c * (6.2 * c + 0.5)) / (c * (6.2 * c + 1.7) + 0.06);
  float w = max(0.0, whitePoint - 0.004);
  float white = (w * (6.2 * w + 0.5)) / (w * (6.2 * w + 1.7) + 0.06);
  return clamp(outC / max(1e-5, white), 0.0, 1.0);
}

vec3 uchimuraTone(vec3 x, float P, float a, float m, float l, float c, float b) {
  x = max(x, vec3(0.0));
  float l0 = ((P - m) * l) / max(1e-5, a);
  float S0 = m + l0;
  float S1 = m + a * l0;
  float C2 = (a * P) / max(1e-5, (P - S1));
  float CP = -C2 / max(1e-5, P);

  vec3 w0 = vec3(1.0 - smoothstep(0.0, m, x));
  vec3 w2 = vec3(step(m + l0, x));
  vec3 w1 = vec3(1.0 - w0 - w2);

  vec3 T = vec3(m * pow(max(vec3(0.0), x / max(1e-5, m)), vec3(c)) + b);
  vec3 S = vec3(P - (P - S1) * exp(CP * (x - S0)));
  vec3 L = vec3(m + a * (x - m));

  return clamp(T * w0 + L * w1 + S * w2, 0.0, 1.0);
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

vec3 agxBase(vec3 color) {
  return agxEotf(agxCurve(color));
}

vec3 agxGolden(vec3 color, float lookMix) {
  vec3 baseCurve = agxCurve(color);
  vec3 looked = agxLook(baseCurve, vec3(1.0, 0.9, 0.5), vec3(0.0), vec3(0.8), 1.3);
  vec3 lookedLinear = agxEotf(looked);
  return mix(agxEotf(baseCurve), lookedLinear, clamp(lookMix, 0.0, 1.0));
}

vec3 agxPunchy(vec3 color, float lookMix) {
  vec3 baseCurve = agxCurve(color);
  vec3 looked = agxLook(baseCurve, vec3(1.0), vec3(0.0), vec3(1.35), 1.4);
  vec3 lookedLinear = agxEotf(looked);
  return mix(agxEotf(baseCurve), lookedLinear, clamp(lookMix, 0.0, 1.0));
}

const float GT_REFERENCE_LUMINANCE = 100.0;
const float GT_PQ_PEAK_NITS = 10000.0;

float gtFramebufferToPhysical(float fbValue) {
  return fbValue * GT_REFERENCE_LUMINANCE;
}

float gtPhysicalToFramebuffer(float physicalNits) {
  return physicalNits / GT_REFERENCE_LUMINANCE;
}

float gtEotfSt2084(float n, float exponentScaleFactor) {
  n = clamp(n, 0.0, 1.0);
  const float m1 = 0.1593017578125;
  const float c1 = 0.8359375;
  const float c2 = 18.8515625;
  const float c3 = 18.6875;
  float m2 = 78.84375 * exponentScaleFactor;

  float np = pow(n, 1.0 / m2);
  float l = max(np - c1, 0.0) / max(1e-6, c2 - c3 * np);
  l = pow(max(l, 0.0), 1.0 / m1);
  return gtPhysicalToFramebuffer(l * GT_PQ_PEAK_NITS);
}

float gtInverseEotfSt2084(float v, float exponentScaleFactor) {
  const float m1 = 0.1593017578125;
  const float c1 = 0.8359375;
  const float c2 = 18.8515625;
  const float c3 = 18.6875;
  float m2 = 78.84375 * exponentScaleFactor;

  float physical = gtFramebufferToPhysical(max(v, 0.0));
  float y = max(0.0, physical / GT_PQ_PEAK_NITS);
  float ym = pow(y, m1);
  float num = max(c1 + c2 * ym, 1e-6);
  float den = max(1.0 + c3 * ym, 1e-6);
  return exp2(m2 * (log2(num) - log2(den)));
}

vec3 gtRgbToICtCp(vec3 rgbRec2020) {
  float l = (rgbRec2020.r * 1688.0 + rgbRec2020.g * 2146.0 + rgbRec2020.b * 262.0) / 4096.0;
  float m = (rgbRec2020.r * 683.0 + rgbRec2020.g * 2951.0 + rgbRec2020.b * 462.0) / 4096.0;
  float s = (rgbRec2020.r * 99.0 + rgbRec2020.g * 309.0 + rgbRec2020.b * 3688.0) / 4096.0;

  float lPQ = gtInverseEotfSt2084(l, 1.0);
  float mPQ = gtInverseEotfSt2084(m, 1.0);
  float sPQ = gtInverseEotfSt2084(s, 1.0);

  return vec3(
    (2048.0 * lPQ + 2048.0 * mPQ) / 4096.0,
    (6610.0 * lPQ - 13613.0 * mPQ + 7003.0 * sPQ) / 4096.0,
    (17933.0 * lPQ - 17390.0 * mPQ - 543.0 * sPQ) / 4096.0
  );
}

vec3 gtICtCpToRgb(vec3 ictcp) {
  float l = ictcp.x + 0.00860904 * ictcp.y + 0.11103 * ictcp.z;
  float m = ictcp.x - 0.00860904 * ictcp.y - 0.11103 * ictcp.z;
  float s = ictcp.x + 0.560031 * ictcp.y - 0.320627 * ictcp.z;

  float lLin = gtEotfSt2084(l, 1.0);
  float mLin = gtEotfSt2084(m, 1.0);
  float sLin = gtEotfSt2084(s, 1.0);

  return max(vec3(
    3.43661 * lLin - 2.50645 * mLin + 0.0698454 * sLin,
    -0.79133 * lLin + 1.9836 * mLin - 0.192271 * sLin,
    -0.0259499 * lLin - 0.0989137 * mLin + 1.12486 * sLin
  ), vec3(0.0));
}

float gtSmoothStep(float x, float edge0, float edge1) {
  if (x < edge0) {
    return 0.0;
  }
  if (x > edge1) {
    return 1.0;
  }
  float t = (x - edge0) / max(1e-6, edge1 - edge0);
  return t * t * (3.0 - 2.0 * t);
}

float gtChromaCurve(float x, float a, float b) {
  return 1.0 - gtSmoothStep(x, a, b);
}

float gtCurveEval(float x, float peakFb, float alpha, float midPoint, float linearSection, float toeStrength) {
  if (x < 0.0) {
    return 0.0;
  }

  float denom = alpha - 1.0;
  denom = abs(denom) < 1e-6 ? (denom < 0.0 ? -1e-6 : 1e-6) : denom;
  float k = (linearSection - 1.0) / denom;
  k = abs(k) < 1e-6 ? (k < 0.0 ? -1e-6 : 1e-6) : k;

  float kA = peakFb * linearSection + peakFb * k;
  float kB = -peakFb * k * exp(linearSection / k);
  float kC = -1.0 / (k * peakFb);

  float weightLinear = gtSmoothStep(x, 0.0, midPoint);
  float weightToe = 1.0 - weightLinear;
  float shoulder = kA + kB * exp(x * kC);

  if (x < linearSection * peakFb) {
    float toeMapped = midPoint * pow(max(0.0, x / max(1e-6, midPoint)), toeStrength);
    return weightToe * toeMapped + weightLinear * x;
  }
  return shoulder;
}

vec3 gt7Tone(vec3 x, vec4 p0, vec4 p1) {
  vec3 rgbRec2020 = max(LINEAR_SRGB_TO_LINEAR_REC2020 * max(x, vec3(0.0)), vec3(0.0));

  float peakNits = max(250.0, p0.x);
  float peakFb = gtPhysicalToFramebuffer(peakNits);
  float alpha = p0.y;
  float midPoint = p0.z;
  float linearSection = p0.w;
  float toeStrength = p1.x;
  float blendRatio = clamp(p1.y, 0.0, 1.0);
  float fadeStart = p1.z;
  float fadeEnd = p1.w;

  vec3 ucs = gtRgbToICtCp(rgbRec2020);
  vec3 skewed = vec3(
    gtCurveEval(rgbRec2020.r, peakFb, alpha, midPoint, linearSection, toeStrength),
    gtCurveEval(rgbRec2020.g, peakFb, alpha, midPoint, linearSection, toeStrength),
    gtCurveEval(rgbRec2020.b, peakFb, alpha, midPoint, linearSection, toeStrength)
  );
  vec3 skewedUcs = gtRgbToICtCp(skewed);
  float targetUcs = max(1e-6, gtRgbToICtCp(vec3(peakFb)).x);
  float chromaScale = gtChromaCurve(ucs.x / targetUcs, fadeStart, fadeEnd);

  vec3 scaledUcs = vec3(skewedUcs.x, ucs.y * chromaScale, ucs.z * chromaScale);
  vec3 scaledRgb = gtICtCpToRgb(scaledUcs);
  vec3 blended = mix(skewed, scaledRgb, blendRatio);
  vec3 clipped = min(blended, vec3(peakFb));

  // Normalize to SDR preview range so this operator is usable on standard displays.
  vec3 normalized = clipped * (1.0 / max(1e-6, peakFb));
  return max(LINEAR_REC2020_TO_LINEAR_SRGB * normalized, vec3(0.0));
}

vec3 sampleTonyLut(vec3 x) {
  vec3 stimulus = max(vec3(0.0), x);
  if (uTonyLutReady == 0) {
    return stimulus;
  }
  vec3 encoded = stimulus / (stimulus + vec3(1.0));
  vec3 dims = vec3(textureSize(uTonyLut, 0));
  vec3 uv = encoded * ((dims - 1.0) / dims) + 0.5 / dims;
  return texture(uTonyLut, uv).rgb;
}

vec3 sampleFlimLut(vec3 x, int presetIndex) {
  vec3 lin = max(vec3(0.0), x);
  if (uFlimLutReady == 0) {
    return lin;
  }
  const float logMin = -10.0;
  const float logMax = 10.0;
  const float offset = 0.0009765625;
  vec3 v = log2(lin + vec3(offset));
  vec3 uv = clamp((v - vec3(logMin)) / (logMax - logMin), 0.0, 1.0);
  vec3 sampled;
  if (presetIndex == 1) {
    sampled = texture(uFlimNostalgiaLut, uv).rgb;
  } else if (presetIndex == 2) {
    sampled = texture(uFlimSilverLut, uv).rgb;
  } else {
    sampled = texture(uFlimDefaultLut, uv).rgb;
  }
  return srgbToLinear(sampled);
}

vec2 lpmToneScaleBias(float hdrMax, float exposureStops, float contrastIn, float shoulderContrast) {
  float contrast = contrastIn + 1.0;
  float midIn = hdrMax * 0.18 * exp2(-exposureStops);
  float midOut = 0.18;
  float cs = contrast * shoulderContrast;

  float z0 = -pow(midIn, contrast);
  float z1 = pow(hdrMax, cs) * pow(midIn, contrast);
  float z2 = pow(hdrMax, contrast) * pow(midIn, cs) * midOut;
  float z3 = pow(hdrMax, cs) * midOut;
  float z4 = pow(midIn, cs) * midOut;
  float toneScale = -((z0 + (midOut * (z1 - z2)) / max(1e-6, z3 - z4)) / max(1e-6, z4));

  float w0 = pow(hdrMax, cs) * pow(midIn, contrast);
  float w1 = pow(hdrMax, contrast) * pow(midIn, cs) * midOut;
  float w2 = pow(hdrMax, cs) * midOut;
  float w3 = pow(midIn, cs) * midOut;
  float toneBias = (w0 - w1) / max(1e-6, w2 - w3);
  return vec2(toneScale, toneBias);
}

vec3 lpmCrosstalkFromScalar(float c) {
  float t = clamp(c, 0.01, 1.0);
  // Map scalar control to the common LPM tuning shape {1.0, t, t^5}.
  return vec3(1.0, t, max(0.001, pow(t, 5.0)));
}

vec3 amdLpmReference(vec3 x, vec4 p0, vec4 p1) {
  vec3 c = max(x, vec3(0.0));
  float hdrMax = max(1e-5, p0.x);
  float exposureStops = p0.y;
  float contrastIn = clamp(p0.z, 0.0, 1.0);
  float shoulderContrast = max(1e-5, p0.w);
  float saturationIn = clamp(p1.x, -1.0, 1.0);
  vec3 crosstalk = lpmCrosstalkFromScalar(p1.y);

  vec2 toneScaleBias = lpmToneScaleBias(hdrMax, exposureStops, contrastIn, shoulderContrast);
  float contrast = contrastIn + 1.0;
  vec3 saturation = vec3(saturationIn + contrast);

  float maxRgb = max(max(c.r, c.g), max(c.b, 1e-6));
  vec3 ratio = c / maxRgb;
  ratio = pow(max(ratio, vec3(0.0)), saturation);

  const vec3 lumaT = vec3(0.2126, 0.7152, 0.0722);
  const vec3 rcpLumaT = vec3(1.0) / lumaT;
  float luma = dot(c, lumaT);
  luma = pow(max(luma, 1e-6), contrast);
  float lumaShoulder = abs(shoulderContrast - 1.0) > 1e-6 ? pow(luma, shoulderContrast) : luma;
  luma = luma / max(1e-6, lumaShoulder * toneScaleBias.x + toneScaleBias.y);

  float lumaRatio = dot(ratio, lumaT);
  float ratioScale = clamp(luma / max(1e-6, lumaRatio), 0.0, 1.0);
  c = clamp(ratio * ratioScale, 0.0, 1.0);

  vec3 cap = (-crosstalk) * c + crosstalk;
  float lumaAdd = clamp(luma - dot(c, lumaT), 0.0, 1.0);
  float t = lumaAdd / max(1e-6, dot(cap, lumaT));
  c = clamp(t * cap + c, 0.0, 1.0);

  lumaAdd = clamp(luma - dot(c, lumaT), 0.0, 1.0);
  c = clamp(c + lumaAdd * rcpLumaT, 0.0, 1.0);

  return c;
}

vec3 decodeInputColorSpace(vec3 color) {
  if (uInputColorSpace == 1) {
    return ACESCG_TO_LINEAR_SRGB * color;
  }
  return color;
}

vec3 applyTonemap(vec3 linearColor, int op, vec4 params[4]) {
  vec3 x = max(linearColor, vec3(0.0));

  if (op == 1) {
    return acesFitted(x);
  }
  if (op == 2) {
    float whitePoint = params[0].x;
    bool luminanceOnly = params[0].y > 0.5;
    return reinhardExtended(x, whitePoint, luminanceOnly);
  }
  if (op == 3) {
    return agxBase(x);
  }
  if (op == 4) {
    return agxGolden(x, params[0].x);
  }
  if (op == 5) {
    return agxPunchy(x, params[0].x);
  }
  if (op == 6) {
    return uchimuraTone(x, params[0].x, params[0].y, params[0].z, params[0].w, params[1].x, params[1].y);
  }
  if (op == 7) {
    return hejlBurgess(x, params[0].x);
  }
  if (op == 8) {
    return gt7Tone(x, params[0], params[1]);
  }
  if (op == 9) {
    float strength = clamp(params[0].x, 0.0, 1.0);
    return mix(x, sampleTonyLut(x), strength);
  }
  if (op == 10) {
    int presetIndex = int(params[0].x + 0.5);
    float strength = clamp(params[0].y, 0.0, 1.0);
    return mix(x, sampleFlimLut(x, presetIndex), strength);
  }
  if (op == 11) {
    return amdLpmReference(x, params[0], params[1]);
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

  vec3 previewA = applyTonemap(linearColor, uTonemapA, uTonemapParamsA);
  vec3 previewB = applyTonemap(linearColor, uTonemapB, uTonemapParamsB);
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
