var Readable = require('readable-stream').Readable
var DEFAULT_CHUNK_SIZE = 128

module.exports = glPixelStream
function glPixelStream (gl, fboHandle, size, opt) {
  if (!gl) {
    throw new TypeError('must specify gl context')
  }
  if (typeof fboHandle === 'undefined') {
    throw new TypeError('must specify a FrameBufferObject handle')
  }
  if (!Array.isArray(size)) {
    throw new TypeError('must specify a [width, height] size')
  }
  
  opt = opt || {}
  
  var width = size[0]
  var height = size[1]
  var flipY = opt.flipY
  var format = opt.format || gl.RGBA
  var stride = typeof opt.stride === 'number'
    ? opt.stride : guessStride(gl, format)
  var chunkSize = typeof opt.chunkSize !== 'undefined'
    ? opt.chunkSize : DEFAULT_CHUNK_SIZE
  
  // clamp chunk size
  chunkSize = Math.min(chunkSize | 0, height)

  var totalChunks = Math.ceil(height / chunkSize)
  var currentChunk = 0
  var chunkData = new Uint8Array(width * chunkSize * stride)
  var stream = new Readable()
  stream._read = read
  return stream

  function read () {
    if (currentChunk > totalChunks - 1) {
      return process.nextTick(function () {
        stream.push(null)
      })
    }

    var yOffset = chunkSize * currentChunk
    if (flipY) {
      yOffset = height - yOffset - chunkSize
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fboHandle)
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      var self = this
      return process.nextTick(function () {
        self.emit('error', new Error('Framebuffer not complete, cannot gl.readPixels'))
      })
    }

    gl.viewport(0, 0, width, height)
    gl.readPixels(0, yOffset, width, chunkSize, format, gl.UNSIGNED_BYTE, chunkData)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    var rowBuffer = Buffer.from(chunkData)
    if (flipY) {
      for (var y = chunkSize - 1, c = 0; y >= 0; y--) {
        var offset = (y * width) * stride
        for (var j = 0; j < width * stride; j++) {
          rowBuffer[c++] = chunkData[offset + j]
        }
      }
    }
    currentChunk++
    stream.push(rowBuffer)
  }
}

function guessStride (gl, format) {
  switch (format) {
    case gl.RGB:
      return 3
    case gl.LUMINANCE_ALPHA:
      return 2
    case gl.ALPHA:
    case gl.LUMINANCE:
      return 1
    default:
      return 4
  }
}
