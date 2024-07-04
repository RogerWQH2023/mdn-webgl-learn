import { WebGLProgramInfo } from ".";
import { mat4 } from "gl-matrix";
import { Buffers } from "./init-buffers";

let squareRotation = 0.0;

function drawScene(
  gl: WebGLRenderingContext,
  programInfo: WebGLProgramInfo,
  buffers: Buffers,
  deltaTime: number
) {
  //如果canvas类型不是HTMLCanvasElement则报错并返回
  if (!("clientWidth" in gl.canvas)) {
    alert("canvas 类型有误");
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置清除颜色为黑色
  gl.clearDepth(1.0); // 设置清除深度为1.0
  gl.enable(gl.DEPTH_TEST); // 开启深度检测
  gl.depthFunc(gl.LEQUAL); // 深度检测方法为近的东西遮盖远的东西

  // 清除画布，这里清除了颜色的缓冲和深度的缓冲

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 创建透视矩阵。
  // 用来模拟摄像机的透视变形。
  // 我们的视场角为 45 度，宽度/高度
  // 比例与画布的显示尺寸相匹配。
  // 我们只想看到距离摄像机 0.1 个单位
  // 和 100 个单位之间的物体。

  const fieldOfView = (45 * Math.PI) / 180; //把角度转换为弧度

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight; //计算摄像机的宽高比，计算为画布的宽度除以高度
  const zNear = 0.1; //设置近截面距离
  const zFar = 100.0; //设置远截面距离
  const projectionMatrix = mat4.create(); //创建一个4x4空矩阵，用于存储透视投影的结果

  // 调用gl-matrix库中的mat4.perspective函数，构建透视投影矩阵
  // 注意：glmatrix.js 总是将第一个参数
  // 作为接收结果的目的地。
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  //模型变换矩阵用于进行模型变换，用于将每个顶点从模型的局部坐标系转换到世界坐标系
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  //矩阵长这样：初始位置就是
  //1 0 0 0
  //0 1 0 0
  //0 0 1 0
  //0 0 0 1
  //在三维空间中，初始状态下的单位矩阵代表了一个没有经过任何变换的坐标系。这意味着：
  //  位置未改变：对象位于原点（0,0,0）。
  //  方向未改变：X、Y、Z轴的方向没有旋转，保持它们在笛卡尔坐标系中的原始方向。
  //  大小未改变：对象没有被缩放，保持其原始大小。
  //使用单位矩阵进行变换相当于告诉渲染系统：“直接使用对象的原始坐标数据进行渲染，不需要进行任何调整。”
  const modelViewMatrix = mat4.create();

  // 接下来可以通过变换模型变换矩阵来进行模型的位置移动
  //1 0 0 0
  //0 1 0 0
  //0 0 1 -6
  //0 0 0 1
  mat4.translate(
    modelViewMatrix, // 存储的位置
    modelViewMatrix, // 需要平移的矩阵
    [-0.0, 0.0, -6] // 在z方向上平移-6
  );

  //更改模型变换矩阵来应用旋转
  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    squareRotation, // amount to rotate in radians
    [0, 0, 1]
  ); // axis to rotate around

  //一系列读取缓冲的函数，其实他的核心步骤都是，告诉WebGL如何从一个一维数组中读取出各个顶点需要的属性，并告诉他要把这些属性传递到什么地方。
  // 告诉WebGL如何从顶点缓冲区中获取顶点，并将顶点存入programInfo里的vertexPosition属性中
  setPositionAttribute(gl, buffers, programInfo);
  //设置颜色
  setColorAttribute(gl, buffers, programInfo);

  // 告知WebGL使用我们的ShaderProgram进行渲染
  gl.useProgram(programInfo.program);

  //设置统一状态（Uniform state）
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  ); //设置模型变换矩阵
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  //使用渲染命令绘制图形
  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount); //TRIANGLE_STRIP模式下，上个三角形的一条边和下一个点组成新的三角形。
  }

  //根据经过的时间更新旋转的角度
  squareRotation += deltaTime;
  if (squareRotation >= 2 * Math.PI) {
    squareRotation -= 2 * Math.PI;
  }
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(
  gl: WebGLRenderingContext,
  buffers: Buffers,
  programInfo: WebGLProgramInfo
) {
  const numComponents = 2; // 每个顶点具有两个组件（x，y），即每个顶点从数组中取出两个值
  const type = gl.FLOAT; // 顶点的数据类型是32为浮点数
  const normalize = false; // 这表示不对顶点数据进行归一化处理。归一化通常用于将数据范围从[-1, 1]或[0, 1]映射到浮点数的表示范围。
  const stride = 0; // 这指定了从一组顶点属性到下一组顶点属性之间的字节数。
  // 注：如果设置为0，WebGL会根据numComponents和type自动计算步长。
  const offset = 0; // 这指定了从顶点缓冲区的哪个位置开始读取顶点数据。0表示从起始位置读取。
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position); //绑定顶点缓冲区到gl.ARRAY_BUFFER
  /* 告诉WebGL如何从当前绑定的ARRAY_BUFFER中读取顶点属性数据。
    参数包括：
      programInfo.attribLocations.vertexPosition：顶点位置属性在顶点着色器中的位置。
      numComponents：每个顶点属性的组件数。
      type：顶点属性的数据类型。
      normalize：是否进行归一化。
      stride和offset：数据在缓冲区中的布局。 
    */
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition); //启用顶点属性数组，这样WebGL就可以使用上面设置的顶点属性数据进行渲染
}

// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
function setColorAttribute(
  gl: WebGLRenderingContext,
  buffers: Buffers,
  programInfo: WebGLProgramInfo
) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

export { drawScene };
