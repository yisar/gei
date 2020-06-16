<p align="center"><img src="http://wx1.sinaimg.cn/mw690/0060lm7Tly1ftpfy740m8j30jn0jnaat.jpg" alt="gay logo" width="150"></p>
<h1 align="center">Gei</h1>
<p align="center">Fast 1kb game engine.</p>

### Feature

- :leaves: Minimal, gzip just 1kb
- :cyclone: High Performance, 60 FPS

### Use

```js
import Gei, { Point, Sprite } from 'gei'
// create a stage
const stage = new Gei(400, 500, document.getElementById('canvas'))
// get a frame
const frame = stage.texture(img).frame(Point(), Point(32))
// create a sprite
const sprite = Sprite(frame)
// add too state
stage.add(sprite)

const loop = () => {
	const { width, height } = stage.canvas
	sprite.position.set(Math.random() * width, Math.random() * height)
	stage.render() // rerender the stage
	requestAnimationFrame(loop)
}
loop()
```

#### P.S.

logo 不是鸟，是鸡，好吧也是鸟，反正就是那个地方，你懂的
