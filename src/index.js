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

  function drawImage(tex, texWidth, texHeight, mX, mY) {
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
    gl.enableVertexAttribArray(texcoordLocation)
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0)
    gl.uniformMatrix4fv(matrixLocation, false, matrix(gl.canvas.width, gl.canvas.height, mX, mY, texWidth, texHeight))
    gl.uniform1i(textureLocation, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  return {
    add,
    draw,
    gl,
  }
}
function matrix(r, b, x, y, w, h) {
  let m = new Float32Array(16)
  m[0] = 2 / r
  m[1] = 0
  m[2] = 0
  m[3] = 0
  m[4] = 0
  m[5] = 2 / -b
  m[6] = 0
  m[7] = 0
  m[8] = 0
  m[9] = 0
  m[10] = 1
  m[11] = 0
  m[12] = m[0] * x + m[4] * y - 1
  m[13] = m[1] * x + m[5] * y + 1
  m[14] = 0
  m[15] = 1
  m[0] = w * m[0]
  m[5] = h * m[5]
  return m
}
