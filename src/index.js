const vertexShader = `
attribute vec2 g;
attribute vec2 a;
attribute vec2 t;
attribute float r;
attribute vec2 s;
attribute vec4 u;
attribute vec4 c;
attribute float z;
uniform mat4 m;
varying vec2 v;
varying vec4 i;
void main(){
v=u.xy+g*u.zw;
i=c.abgr;
vec2 p=(g-a)*s;
float q=cos(r);
float w=sin(r);
p=vec2(p.x*q-p.y*w,p.x*w+p.y*q);
p+=a+t;
gl_Position=m*vec4(p,z,1);
}`

const fragmentShader = `
precision mediump float;
uniform sampler2D x;
uniform float j;
varying vec2 v;
varying vec4 i;
void main(){
vec4 c=texture2D(x,v);
gl_FragColor=c*i;
if(j>0.0){
if(c.a<j)discard;
gl_FragColor.a=1.0;};
}`

const maxBatch = 65535
const depth = 1e5
const nullFrame = { p: { t: 0 } }

export const Stage = (canvas, options) => {
	const zeroLayer = new Layer()
	const layers = [zeroLayer]

	const floatSize = 2 + 2 + 1 + 2 + 4 + 1 + 1
	const byteSize = floatSize * 4
	const arrayBuffer = new ArrayBuffer(maxBatch * byteSize)
	const floatView = new Float32Array(arrayBuffer)
	const uintView = new Uint32Array(arrayBuffer)
	const opts = Object.assign({ antialias: false, alpha: false }, options)
	const gl = canvas.getContext('webgl', opts)

	const ext = gl.getExtension('ANGLE_instanced_arrays')

	const compileShader = (source, type) => {
		const shader = gl.createShader(type)
		gl.shaderSource(shader, source)
		gl.compileShader(shader)
		return shader
	}

	const program = gl.createProgram()
	gl.attachShader(program, compileShader(vertexShader, gl.VERTEX_SHADER))
	gl.attachShader(program, compileShader(fragmentShader, gl.FRAGMENT_SHADER))
	gl.linkProgram(program)

	const createBuffer = (type, src, usage) => {
		gl.bindBuffer(type, gl.createBuffer())
		gl.bufferData(type, src, usage || gl.STATIC_DRAW)
	}

	const bindAttrib = (name, size, stride, divisor, offset, type, norm) => {
		const location = gl.getAttribLocation(program, name)
		gl.enableVertexAttribArray(location)
		gl.vertexAttribPointer(
			location,
			size,
			type || gl.FLOAT,
			!!norm,
			stride || 0,
			offset || 0
		)
		divisor && ext.vertexAttribDivisorANGLE(location, divisor)
	}

	createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([0, 1, 2, 2, 1, 3]))
	createBuffer(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]))
	bindAttrib('g', 2)
	createBuffer(gl.ARRAY_BUFFER, arrayBuffer, gl.DYNAMI_CDRAW)
	bindAttrib('a', 2, byteSize, 1)
	bindAttrib('s', 2, byteSize, 1, 8)
	bindAttrib('r', 1, byteSize, 1, 16)
	bindAttrib('t', 2, byteSize, 1, 20)
	bindAttrib('u', 4, byteSize, 1, 28)
	bindAttrib('c', 4, byteSize, 1, 44, gl.UNSIGNED_BYTE, true)
	bindAttrib('z', 1, byteSize, 1, 48)

	const getUniformLocation = name => gl.getUniformLocation(program, name)
	const matrixLocation = getUniformLocation('m')
	const alphaTestLocation = getUniformLocation('j')

	let width
	let height

	let count = 0
	let currentFrame

	const resize = () => {
		width = canvas.clientWidth | 0
		height = canvas.clientHeight | 0
		const change = canvas.width !== width || canvas.height !== height
		canvas.width = width
		canvas.height = height
		return change
	}

	const flush = () => {
		if (!count) return
		gl.uniform1f(alphaTestLocation, 1)
		gl.bufferSubData(
			gl.ARRAY_BUFFER,
			0,
			floatView.subarray(0, count * floatSize)
		)
		ext.drawElementsInstancedANGLE(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, count)
		count = 0
	}

	const draw = sprite => {
		if (!sprite.visible) return
		if (count === maxBatch) flush()

		const { frame } = sprite
		const { uvs } = frame

		if (currentFrame.t !== frame.t) {
			currentFrame.t && flush()
			currentFrame = frame
		}

		let i = count * floatSize

		floatView[i++] = frame.anchor.x
		floatView[i++] = frame.anchor.y
		floatView[i++] = frame.size.x
		floatView[i++] = frame.size.y

		floatView[i++] = sprite.rotation
		floatView[i++] = sprite.position.x
		floatView[i++] = sprite.position.y

		floatView[i++] = uvs[0]
		floatView[i++] = uvs[1]
		floatView[i++] = uvs[2]
		floatView[i++] = uvs[3]

		uintView[i++] = ((sprite.tint & 0xffffff) << 8) >>> 0
		floatView[i] = 0
		count++
	}

	const renderer = {
		gl,
		camera: {
			at: new Point(),
			to: new Point(),
			angle: 0,
		},
		background(r, g, b, a) {
			gl.clearColor(r, g, b, a === 0 ? 0 : a || 1)
		},
		add(sprite) {
			sprite.node = zeroLayer.add(sprite)
		},
		texture(source) {
			const w = source.width
			const h = source.height
			const t = gl.createTexture()
			gl.bindTexture(gl.TEXTURE_2D, t)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				source
			)

			return {
				size: new Point(w, h),
				anchor: new Point(),
				uvs: [0, 0, 1, 1],
				t,
			}
		},
		resize,
		render() {
			resize()
			const { at, to, angle } = renderer.camera
			const x = at.x - width * to.x
			const y = at.y - height * to.y
			const c = Math.cos(angle)
			const s = Math.sin(angle)
			const w = 2 / width
			const h = -2 / height

			const projection = [
				c * w,
				s * h,
				0,
				0,
				-s * w,
				c * h,
				0,
				0,
				0,
				0,
				-1 / depth,
				0,
				(at.x * (1 - c) + at.y * s) * w - (2 * x) / width - 1,
				(at.y * (1 - c) - at.x * s) * h + (2 * y) / height + 1,
				0,
				1,
			]

			gl.useProgram(program)
			gl.uniformMatrix4fv(matrixLocation, false, projection)
			gl.viewport(0, 0, width, height)
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

			currentFrame = nullFrame
			layers.forEach(layer => layer.loop(draw))
			flush()
		},
	}

	resize()

	return renderer
}

export class Point {
	constructor(x, y) {
		this.set(x, y)
	}

	set(x, y) {
		this.x = x || 0
		this.y = y || (y !== 0 ? this.x : 0)
	}
}

export class Sprite {
	constructor(frame, props) {
		Object.assign(
			this,
			{
				frame,
				visible: true,
				position: new Point(),
				rotation: 0,
				tint: 0xffffff,
				alpha: 1,
			},
			props
		)
	}
}

class Node {
	constructor(layer, current, next) {
		this.layer = layer
		this.current = current
		this.next = next
	}
}

class Layer {
	constructor() {
		this.node = null
	}

	add(sprite) {
		const node = new Node(this, sprite, this.node)
		this.node = node
		return node
	}

	loop(draw) {
		let node = this.node
		while (node) {
			draw(node.current)
			node = node.next
		}
	}
}

export default {
	Stage,
	Sprite,
	Point,
}
