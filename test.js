var pixelStream = require('./')
var test = require('tape')
var FBO = require('gl-fbo')
var getGL = require('webgl-context')
var concat = require('concat-stream')

test('streaming gl.readPixels from an FBO', run(new Buffer([
  0, 255, 0, 255,
  0, 255, 0, 255,
  0, 0, 0, 255,
  0, 0, 0, 255
])))

test('streaming gl.readPixels from an FBO', run(new Buffer([
  0, 0, 0, 255,
  0, 0, 0, 255,
  0, 255, 0, 255,
  0, 255, 0, 255
]), { flipY: true }))

function run (expected, opts) {
  return function (t) {
    t.plan(1)
    var gl = getGL()
    
    var width = 2
    var height = 2
    var shape = [width, height]
    
    var fbo = FBO(gl, shape)
    
    fbo.bind()
    gl.viewport(0, 0, width, height)
    // all black
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    // green
    gl.clearColor(0, 1, 0, 1)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(0, 0, width, height/2)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.disable(gl.SCISSOR_TEST)
    
    pixelStream(gl, fbo.handle, shape, opts)
      .pipe(concat(function (body) {
        t.deepEqual(body, expected, 'matches pixels')
      }))
  }
}
