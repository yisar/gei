class Stage {
	constructor(canvas, options) {
		this.zeroLayer = new Layer(0)
		this.layers = [zeroLayer]
		this.gl = canvas.getContext('webgl', options)
		this.camera = {
			at: Point(),
			to: Point(),
			angle: 0,
		}
	}

	background(r, g, b, a) {
		this.gl.clearColor(r, g, b, a === 0 ? 0 : a || 1)
	}

	add(sprite) {
		this.zeroLayer.add(sprite)
	}

	resize() {
		let width = (canvas.clientWidth * scale) | 0
		let height = (canvas.clientHeight * scale) | 0
		const change = canvas.width !== width || canvas.height !== height
		canvas.width = width
		canvas.height = height
		return change
	}
}

Stage.Point = class Point {
	constructor(x, y) {
		if (!(this instanceof Stage.Point)) {
			return new Stage.Point(x, y)
		}
		this.set(x, y)
	}

	set(x, y) {
		this.x = x || 0
		this.y = y || (y !== 0 ? this.x : 0)
		return this
	}
}

class Layer {
	constructor(z) {
		this.z = z
		this.o = new List()
		this.t = new List()
	}

	add(sprite) {
		sprite.remove()
		sprite.l = this
		sprite.n = (sprite.a !== 1 || sprite.frame.p.a === 0 ? this.t : this.o).add(
			sprite
		)
	}
}

class List {
	constructor() {
		this.h = null
	}

	add(cargo) {
		const node = new Node(this, cargo, this.h)
		this.h && (this.h.p = node)
		this.h = node
		return node
	}

	i(fn) {
		let node = this.h
		while (node) {
			fn(node.c)
			node = node.n
		}
	}
}
