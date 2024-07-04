export type Buffers = {
  position: WebGLBuffer;
  color: WebGLBuffer;
};

function initBuffers(gl: WebGLRenderingContext) {
  //初始化顶点缓冲器
  const positionBuffer = initPositionBuffer(gl);

  const colorBuffer = initColorBuffer(gl);

  return {
    position: positionBuffer,
    color: colorBuffer,
  } as Buffers;
}

function initPositionBuffer(gl: WebGLRenderingContext) {
  // 为正方形的顶点创建缓冲器
  const positionBuffer = gl.createBuffer();

  //绑定上下文
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  //创建一个数组来记录正方体的每一个顶点
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

  //然后将其转化为 WebGL 浮点型类型的数组，并将其传到 gl 对象的 bufferData() 方法来填充对应的顶点缓冲器。
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer as Buffers;
}

function initColorBuffer(gl: WebGLRenderingContext) {
  const colors = [
    1.0,
    1.0,
    1.0,
    1.0, // 白
    1.0,
    0.0,
    0.0,
    1.0, // 红
    0.0,
    1.0,
    0.0,
    1.0, // 绿
    0.0,
    0.0,
    1.0,
    1.0, // 蓝
  ];

  const colorBuffer = gl.createBuffer(); //创建一个缓冲区对象
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); //这一步绑定了一个buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW); //这一步操作当前绑定的buffer

  return colorBuffer;
}

export { initBuffers };
