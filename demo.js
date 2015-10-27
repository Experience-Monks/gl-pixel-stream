var fs = require('fs')

var pixelStream = require('./')
var PNGEncoder = require('png-stream/encoder')
var createFBO = require('gl-fbo')
var createGL = require('webgl-context')
var createShader = require('gl-shader')

var triangle = require('a-big-triangle')
var glslify = require('glslify')
var vert = glslify('glsl-shader-basic/vert.glsl')
var frag = glslify(__dirname + '/demo.frag')

render()

function render () {
  var shape = [640, 360]
  var gl = createGL()
  var fbo = createFBO(gl, shape)
  var shader = createShader(gl, vert, frag)

  // use DevTools for timing info
  console.time('render')

  // render scene into frame buffer
  fbo.bind()
  renderScene()

  // create a write stream for the file
  var output = fs.createWriteStream('image.png')

  // create a PNG encoder stream
  var encoder = new PNGEncoder(shape[0], shape[1], {
    colorSpace: 'rgba'
  })

  // create a readPixels stream for the FBO
  // flip image on Y axis due to FBO coordinates
  var pixels = pixelStream(gl, fbo.handle, fbo.shape, {
    flipY: true
  })

  // send pixels to encoder, then to file
  pixels.pipe(encoder)
  encoder.pipe(output)

  // when file writing is finished
  output.on('close', function () {
    console.log('Saved %dx%d buffer to image.png', shape[0], shape[1])
    console.timeEnd('render')
    
    // quit the dev tools window when not in dev mode
    if (process.env.NODE_ENV === 'production') {
      window.close()
    }
  })

  // can be any type of render function
  function renderScene () {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.viewport(0, 0, shape[0], shape[1])
    shader.bind()
    shader.uniforms.iResolution = shape
    shader.uniforms.iGlobalTime = 0
    triangle(gl)
  }
}
