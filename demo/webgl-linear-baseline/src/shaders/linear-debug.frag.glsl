#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uInputTex;
uniform int uViewMode;
uniform float uExposure;
uniform int uChannel;

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 linearToSrgb(vec3 linearColor) {
  vec3 cutoff = step(linearColor, vec3(0.0031308));
  vec3 lower = 12.92 * linearColor;
  vec3 upper = 1.055 * pow(max(linearColor, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(upper, lower, cutoff);
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
  linearColor *= exp2(uExposure);

  vec3 outColor;
  if (uViewMode == 0) {
    outColor = linearToSrgb(linearColor);
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

  fragColor = vec4(clamp(outColor, 0.0, 1.0), 1.0);
}
