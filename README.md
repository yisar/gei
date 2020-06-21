<p align="center"><img src="http://wx1.sinaimg.cn/mw690/0060lm7Tly1ftpfy740m8j30jn0jnaat.jpg" alt="gay logo" width="150"></p>
<h1 align="center">Gei</h1>
<p align="center">Fast 1kb game engine.</p>

### Feature

- :leaves: Minimal, gzip just 1kb
- :cyclone: High Performance, 60 FPS

### Use

```js
import { create } from './src/index.js'
const stage = create('#canvas')
let sprite = stage.add('hj.png')
function loop() {
  sprite.x = Math.random() * stage.gl.canvas.width
  sprite.y = Math.random() * stage.gl.canvas.height
  stage.draw()
  // requestAnimationFrame(loop)
}
loop()
```

#### P.S.

logo 不是鸟，是鸡，好吧也是鸟，反正就是那个地方，你懂的
