import { useEffect, useRef } from "react";
import { initShaderProgram, loadTexture } from "./webgl-demo";
import { drawScene } from "./draw-scene";
import { initBuffers } from "./init-buffers";

export type WebGLProgramInfo = {
  program: WebGLProgram;
  attribLocations: {
    vertexPosition: number;
    //vertexColor: number;
    textureCoord: number;
  };
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null;
    modelViewMatrix: WebGLUniformLocation | null;
    uSampler: WebGLUniformLocation | null;
  };
};

// 定义顶点着色器
const vsSource = /*glsl*/ `
attribute vec4 aVertexPosition;
//attribute vec4 aVertexColor;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

//varying lowp vec4 vColor;//定义一个能够被片段着色器获取的变量
varying highp vec2 vTextureCoord;//获得纹理坐标

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  //vColor = aVertexColor;//设置顶点颜色
  vTextureCoord = aTextureCoord;//设置纹理坐标
}
`;
//定义片段着色器
const fsSource = /*glsl*/ `
//varying lowp vec4 vColor;//获得顶点着色器传来的vColor（中间其实经历了光栅器插值，传来的是插值后一个片段的颜色）
varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

void main() {
  //gl_FragColor = vColor;//定义颜色
  gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;

const TestGlCanvas3D = () => {
  const glcanvas = useRef<HTMLCanvasElement>(null);
  const then = useRef<number>(0.0);

  useEffect(() => {
    if (glcanvas.current) {
      const canvas = glcanvas.current;
      //初始化WebGL上下文
      const gl = canvas.getContext("webgl");
      //确认WebGL支持性
      if (!gl) {
        alert("无法初始化WebGl，你的浏览器、操作系统或硬件可能不支持WebGL");
        return;
      }

      // 使用完全不透明的黑色清除所有图像
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      // 用上面指定的颜色清除缓冲区（OpenGL有多个Buffer，包括颜色缓冲区、深度缓冲区、模板缓冲区等。这个缓冲区其实就是输出的那一帧的组成部分）
      gl.clear(gl.COLOR_BUFFER_BIT);

      //初始化着色器程序（需要同时包含顶点着色器和片段着色器）
      const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
      if (!shaderProgram) {
        alert("初始化着色器程序失败");
        return;
      }
      //查找 WebGL 返回分配的输入位置。在上述情况下，我们有一个属性和两个 Uniform 。属性从缓冲区接收值。顶点着色器的每次迭代都从分配给该属性的缓冲区接收下一个值。uniform 类似于 JavaScript 全局变量。它们在着色器的所有迭代中保持相同的值。由于属性和统一的位置是特定于单个着色器程序的，因此我们将它们存储在一起以使它们易于传递
      const programInfo: WebGLProgramInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(
            shaderProgram,
            "aVertexPosition" // 这个变量的定义是在glsl的代码中，我们在这里只是获取了其指针
          ),
          //vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
          textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(
            shaderProgram,
            "uProjectionMatrix" // 这个变量的定义是在glsl的代码中，我们在这里只是获取了其指针
          ),
          modelViewMatrix: gl.getUniformLocation(
            shaderProgram,
            "uModelViewMatrix" // 这个变量的定义是在glsl的代码中，我们在这里只是获取了其指针
          ),
          uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
        },
      };
      // Here's where we call the routine that builds all the
      // objects we'll be drawing.
      const buffers = initBuffers(gl); //加载所有buffer（见init-buffers.js）

      // 加载纹理
      const texture = loadTexture(
        gl,
        "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/WMTS?tilematrix=0&layer=World_Imagery&style=default&tilerow=0&tilecol=0&tilematrixset=1&format=image%2Fjpeg&service=WMTS&version=1.0.0&request=GetTile"
      );
      // 浏览器会从加载的图像中按从左上角开始的自上而下顺序复制像素，而 WebGL 需要按自下而上的顺序——从左下角开始的像素顺序。
      // 为了防止渲染时图像纹理方向错误，我们还需要调用 pixelStorei() 并将 gl.UNPACK_FLIP_Y_WEBGL 参数设置为 true，以调整像素顺序，使其翻转成 WebGL 需要的自下而上顺序。
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      // Draw the scene
      //drawScene(gl, programInfo, buffers);

      // Draw the scene repeatedly
      function render(now: number) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then.current;
        then.current = now;

        if (!gl) {
          alert("gl未定义");
          return;
        }
        drawScene(gl, programInfo, buffers, texture, deltaTime);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
  }, []);
  return (
    <canvas id="glcanvas" width="640" height="480" ref={glcanvas}>
      你的浏览器似乎不支持或者禁用了 HTML5 <code>&lt;canvas&gt;</code> 元素。
    </canvas>
  );
};
export default TestGlCanvas3D;
