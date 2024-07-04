import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

//  初始化着色器程序，让 WebGL 知道如何绘制我们的数据
export function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // 创建着色器程序

  const shaderProgram = gl.createProgram();

  if (!shaderProgram || !vertexShader || !fragmentShader) {
    alert("创建着色器程序失败！");
    return null;
  }
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // 如果创建失败，alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

//
// 创建指定类型的着色器，上传 source 源码并编译
//
function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    alert("创建指定类型shader失败");
    return null;
  }
  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
export function loadTexture(gl: WebGLRenderingContext, url: string) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture); //先将当前的纹理指针绑定当前操作中的纹理

  // 图片需要从互联网上加载，所以需要过一会才能使用
  // 在纹理加载完毕之前我们可以放一个特定颜色像素进去，作为临时纹理，这样就能立刻使用这个纹理。
  // 当真正的图像加载完毕之后，我们再去加载真正的图像
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  ); //将当前gl指向的纹理填入我们预设的像素

  fetch(url)
    .then((response) => {
      // 确保请求成功
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.blob(); // 将响应转换为blob
    })
    .then((blob) => {
      // 创建一个URL对象，使用blob来创建一个可访问的URL
      const objectURL = URL.createObjectURL(blob);

      const image = new Image();
      //当图像加载完毕后重新绑定这个纹理（这一步是异步的，可能会在之后被调用）
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          image
        );

        // WebGL1对2的幂尺寸的图像和非2的幂尺寸的图像有不同的要求。
        // 对于2的幂尺寸的图像，可以利用Mipmap（多级渐进纹理）提高渲染效率；
        // 而对于非2的幂尺寸的图像，则需要关闭Mipmap并使用CLAMP_TO_EDGE来避免纹理坐标越界的问题。
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
          // Yes, it's a power of 2. Generate mips.
          //     多级渐进纹理（Mipmap）：
          // Mipmap是一种优化技术，用于提高纹理映射的性能，尤其是在纹理被缩小显示时。它通过创建多个不同分辨率的纹理图像副本来实现，每个副本的分辨率依次减半，直到达到1x1像素。这些副本按照分辨率从大到小分别称为Mipmap等级。
          //   优点：
          //     当纹理映射到3D模型上时，如果纹理的某个区域被放大，Mipmap可以提供更高分辨率的图像，从而避免纹理的锯齿和模糊。
          //     当纹理被缩小时，使用低分辨率的Mipmap副本可以减少像素着色器的工作量，提高渲染效率。
          //   生成：
          //     Mipmap通常在纹理上传到GPU时自动或手动生成。在WebGL中，可以通过调用gl.generateMipmap(gl.TEXTURE_2D);来生成Mipmap。
          gl.generateMipmap(gl.TEXTURE_2D);
        } else {
          // No, it's not a power of 2. Turn off mips and set
          // wrapping to clamp to edge
          // 纹理坐标重复（Texture Coordinate Wrapping）：
          // 纹理坐标重复是指当纹理坐标超出了[0.0, 1.0]的范围时，坐标会根据某种模式重复或环绕纹理图像。这决定了当几何体的表面大于纹理图像大小时纹理如何显示。以下是几种常见的纹理坐标重复模式：
          //   Repeat：
          //     纹理图像会在所有方向上重复，即纹理坐标会被截取到小数部分，形成无缝的重复纹理效果。
          //   Mirrored Repeat：
          //     类似于Repeat，但每次重复时纹理图像会镜像翻转，这可以创建一个镜像的重复纹理效果。
          //   Clamp to Edge：
          //     纹理坐标会被夹到[0.0, 1.0]的范围内，超出部分会被拉伸到最近的边缘像素颜色。
          //   Clamp to Border：
          //     超出[0.0, 1.0]范围的纹理坐标会被指定一个边界颜色。
          // 在3D渲染中，纹理坐标重复模式通常通过设置纹理参数来控制，例如在OpenGL或WebGL中，可以通过gl.texParameteri()函数来设置纹理的环绕方式。
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //水平方向上采用Clamp to Edge
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //垂直方向上采用Clamp to Edge
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //定义最小化滤波器类型。当纹理被放大时，将使用线性滤波来计算像素颜色。
        }
      };
      image.src = objectURL; //指定image对象的数据源，让其自动开始加载，等其加载完成后将会继续onload里的步骤
    });

  return texture;
}

function isPowerOf2(value: number) {
  return (value & (value - 1)) === 0;
}
