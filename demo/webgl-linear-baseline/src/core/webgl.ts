import type { FloatImage } from '../types';
import { fullscreenVertexSource, linearDebugFragmentSource } from './shaders';

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to allocate shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error('Failed to allocate program.');
  }

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown program link error';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export class LinearRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vbo: WebGLBuffer;
  private readonly texture: WebGLTexture;
  private readonly uInputTex: WebGLUniformLocation;
  private readonly uViewMode: WebGLUniformLocation;
  private readonly uExposure: WebGLUniformLocation;
  private readonly uChannel: WebGLUniformLocation;
  private readonly uTonemapA: WebGLUniformLocation;
  private readonly uTonemapB: WebGLUniformLocation;
  private readonly uCompareMode: WebGLUniformLocation;
  private readonly uSplit: WebGLUniformLocation;
  private readonly uInputColorSpace: WebGLUniformLocation;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: false });
    if (!gl) {
      throw new Error('WebGL2 is not supported in this environment.');
    }
    this.gl = gl;

    this.program = createProgram(gl, fullscreenVertexSource, linearDebugFragmentSource);

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) {
      throw new Error('Failed to allocate geometry buffers.');
    }
    this.vao = vao;
    this.vbo = vbo;

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const tri = new Float32Array([-1, -1, 3, -1, -1, 3]);
    gl.bufferData(gl.ARRAY_BUFFER, tri, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const tex = gl.createTexture();
    if (!tex) {
      throw new Error('Failed to allocate texture.');
    }
    this.texture = tex;

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const uInputTex = gl.getUniformLocation(this.program, 'uInputTex');
    const uViewMode = gl.getUniformLocation(this.program, 'uViewMode');
    const uExposure = gl.getUniformLocation(this.program, 'uExposure');
    const uChannel = gl.getUniformLocation(this.program, 'uChannel');
    const uTonemapA = gl.getUniformLocation(this.program, 'uTonemapA');
    const uTonemapB = gl.getUniformLocation(this.program, 'uTonemapB');
    const uCompareMode = gl.getUniformLocation(this.program, 'uCompareMode');
    const uSplit = gl.getUniformLocation(this.program, 'uSplit');
    const uInputColorSpace = gl.getUniformLocation(this.program, 'uInputColorSpace');

    if (!uInputTex || !uViewMode || !uExposure || !uChannel || !uTonemapA || !uTonemapB || !uCompareMode || !uSplit || !uInputColorSpace) {
      throw new Error('Failed to locate required uniforms.');
    }

    this.uInputTex = uInputTex;
    this.uViewMode = uViewMode;
    this.uExposure = uExposure;
    this.uChannel = uChannel;
    this.uTonemapA = uTonemapA;
    this.uTonemapB = uTonemapB;
    this.uCompareMode = uCompareMode;
    this.uSplit = uSplit;
    this.uInputColorSpace = uInputColorSpace;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }

  resize(pixelWidth: number, pixelHeight: number): void {
    this.canvas.width = Math.max(1, Math.floor(pixelWidth));
    this.canvas.height = Math.max(1, Math.floor(pixelHeight));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  setInput(image: FloatImage): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      image.width,
      image.height,
      0,
      gl.RGBA,
      gl.FLOAT,
      image.data
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  render(
    viewMode: number,
    exposure: number,
    channel: number,
    tonemapA: number,
    tonemapB: number,
    compareMode: number,
    split: number,
    inputColorSpace: number
  ): void {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uInputTex, 0);
    gl.uniform1i(this.uViewMode, viewMode);
    gl.uniform1f(this.uExposure, exposure);
    gl.uniform1i(this.uChannel, channel);
    gl.uniform1i(this.uTonemapA, tonemapA);
    gl.uniform1i(this.uTonemapB, tonemapB);
    gl.uniform1i(this.uCompareMode, compareMode);
    gl.uniform1f(this.uSplit, split);
    gl.uniform1i(this.uInputColorSpace, inputColorSpace);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
  }

  destroy(): void {
    const gl = this.gl;
    gl.deleteTexture(this.texture);
    gl.deleteBuffer(this.vbo);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
}
