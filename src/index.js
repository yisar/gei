let vs = `
      attribute vec4 a_position;
      attribute vec2 a_texcoord;
      uniform mat4 u_matrix;
      varying vec2 v_texcoord;
      void main() {
         gl_Position = u_matrix * a_position;
         v_texcoord = a_texcoord;
      }`
let fs = `
      precision mediump float;
      varying vec2 v_texcoord;
      uniform sampler2D u_texture;
      void main() {
         gl_FragColor = texture2D(u_texture, v_texcoord);
      }
      `
export function create(selector) {
  const canvas = document.querySelector(selector)
  const gl = canvas.getContext('webgl', {
    alpha: true,
  })

  const compileShader = (source, type) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }

  const resize = () => {
    let width = canvas.clientWidth | 0
    let height = canvas.clientHeight | 0
    const change = canvas.width !== width || canvas.height !== height
    canvas.width = width
    canvas.height = height
    return change
  }

  const program = gl.createProgram()
  gl.attachShader(program, compileShader(vs, gl.VERTEX_SHADER))
  gl.attachShader(program, compileShader(fs, gl.FRAGMENT_SHADER))
  gl.linkProgram(program)
  gl.useProgram(program)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  const positionLocation = gl.getAttribLocation(program, 'a_position')
  const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord')

  const matrixLocation = gl.getUniformLocation(program, 'u_matrix')
  const textureLocation = gl.getUniformLocation(program, 'u_texture')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)

  const texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW)

  function loadImage(url) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    const info = {
      width: 1,
      height: 1,
      texture,
    }
    const img = new Image()
    img.addEventListener('load', () => {
      info.width = img.width
      info.height = img.height
      gl.bindTexture(gl.TEXTURE_2D, info.texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    })
    img.src = url

    return info
  }

  const sprites = []
  const add = (sprite) => {
    sprites.push({
      x: sprite.x || Math.random() * gl.canvas.width,
      y: sprite.y || Math.random() * gl.canvas.height,
      dx: Math.random() > 0.5 ? -1 : 1,
      dy: Math.random() > 0.5 ? -1 : 1,
      info: loadImage(sprite.src || sprite),
    })
    return sprites[sprites.length - 1]
  }

  function draw() {
    resize()

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    gl.clear(gl.COLOR_BUFFER_BIT)

    sprites.forEach((sprite) => {
      drawImage(sprite.info.texture, sprite.info.width, sprite.info.height, sprite.x, sprite.y)
    })
  }

  function drawImage(tex, texWidth, texHeight, dstX, dstY) {
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
    gl.enableVertexAttribArray(texcoordLocation)
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0)

    var matrix = orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1)

    matrix = translate(matrix, dstX, dstY, 0)

    matrix = scale(matrix, texWidth, texHeight, 1)

    gl.uniformMatrix4fv(matrixLocation, false, matrix)

    gl.uniform1i(textureLocation, 0)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  return {
    add,
    draw,
    gl
  }
}
function orthographic(left, right, bottom, top, near, far, dst) {
  dst = dst || new Float32Array(16)

  dst[0] = 2 / (right - left)
  dst[1] = 0
  dst[2] = 0
  dst[3] = 0
  dst[4] = 0
  dst[5] = 2 / (top - bottom)
  dst[6] = 0
  dst[7] = 0
  dst[8] = 0
  dst[9] = 0
  dst[10] = 2 / (near - far)
  dst[11] = 0
  dst[12] = (left + right) / (left - right)
  dst[13] = (bottom + top) / (bottom - top)
  dst[14] = (near + far) / (near - far)
  dst[15] = 1

  return dst
}
function translate(m, tx, ty, tz, dst) {
  dst = dst || new Float32Array(16)

  var m00 = m[0]
  var m01 = m[1]
  var m02 = m[2]
  var m03 = m[3]
  var m10 = m[1 * 4 + 0]
  var m11 = m[1 * 4 + 1]
  var m12 = m[1 * 4 + 2]
  var m13 = m[1 * 4 + 3]
  var m20 = m[2 * 4 + 0]
  var m21 = m[2 * 4 + 1]
  var m22 = m[2 * 4 + 2]
  var m23 = m[2 * 4 + 3]
  var m30 = m[3 * 4 + 0]
  var m31 = m[3 * 4 + 1]
  var m32 = m[3 * 4 + 2]
  var m33 = m[3 * 4 + 3]

  if (m !== dst) {
    dst[0] = m00
    dst[1] = m01
    dst[2] = m02
    dst[3] = m03
    dst[4] = m10
    dst[5] = m11
    dst[6] = m12
    dst[7] = m13
    dst[8] = m20
    dst[9] = m21
    dst[10] = m22
    dst[11] = m23
  }

  dst[12] = m00 * tx + m10 * ty + m20 * tz + m30
  dst[13] = m01 * tx + m11 * ty + m21 * tz + m31
  dst[14] = m02 * tx + m12 * ty + m22 * tz + m32
  dst[15] = m03 * tx + m13 * ty + m23 * tz + m33

  return dst
}
function scale(m, sx, sy, sz, dst) {
  dst = dst || new Float32Array(16)

  dst[0] = sx * m[0 * 4 + 0]
  dst[1] = sx * m[0 * 4 + 1]
  dst[2] = sx * m[0 * 4 + 2]
  dst[3] = sx * m[0 * 4 + 3]
  dst[4] = sy * m[1 * 4 + 0]
  dst[5] = sy * m[1 * 4 + 1]
  dst[6] = sy * m[1 * 4 + 2]
  dst[7] = sy * m[1 * 4 + 3]
  dst[8] = sz * m[2 * 4 + 0]
  dst[9] = sz * m[2 * 4 + 1]
  dst[10] = sz * m[2 * 4 + 2]
  dst[11] = sz * m[2 * 4 + 3]

  if (m !== dst) {
    dst[12] = m[12]
    dst[13] = m[13]
    dst[14] = m[14]
    dst[15] = m[15]
  }

  return dst
}
