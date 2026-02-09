#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = 0.5 * (aPosition + 1.0);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
