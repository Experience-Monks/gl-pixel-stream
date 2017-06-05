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
  
  var width = Math.floor(size[0])
  var height = Math.floor(size[1])
  var flipY = opt.flipY
  var format = opt.format || gl.RGBA
  var stride = typeof opt.stride === 'number'
    ? opt.stride : guessStride(gl, format)
  var chunkSize = typeof opt.chunkSize === 'number'
    ? opt.chunkSize : DEFAULT_CHUNK_SIZE
  var onProgress = opt.onProgress
  
  // clamp chunk size
  chunkSize = Math.min(Math.floor(chunkSize), height)

  var totalChunks = Math.ceil(height / chunkSize)
  var currentChunk = 0
  var stream = new Readable()
  stream._read = read
  return stream

  function read () {
    if (currentChunk > totalChunks - 1) {
      return process.nextTick(function () {
        stream.push(null)
      })
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fboHandle)
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      var self = this
      return process.nextTick(function () {
        self.emit('error', new Error('Framebuffer not complete, cannot gl.readPixels'))
      })
    }

    var yOffset = chunkSize * currentChunk
    var dataHeight = Math.min(chunkSize, height - yOffset)
    if (flipY) {
      yOffset = height - yOffset - dataHeight
    }

    var outBuffer = new Buffer(width * dataHeight * stride)
    gl.viewport(0, 0, width, height)
    gl.readPixels(0, yOffset, width, dataHeight, format, gl.UNSIGNED_BYTE, outBuffer)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    var rowBuffer = outBuffer
    if (flipY) {
      flipVertically(outBuffer, width, dataHeight, stride)
    }
    currentChunk++
    if (typeof onProgress === 'function') {
      onProgress({
        bounds: [ 0, yOffset, width, dataHeight ],
        current: currentChunk,
        total: totalChunks
      })
    }
    stream.push(rowBuffer)
  }
}

function flipVertically (pixels, width, height, stride) {
  var rowLength = width * stride
  var temp = Buffer.allocUnsafe(rowLength)
  var halfRows = Math.floor(height / 2)
  for (var rowIndex = 0; rowIndex < halfRows; rowIndex++) {
    var otherRowIndex = height - rowIndex - 1;

    var curRowStart = rowLength * rowIndex;
    var curRowEnd = curRowStart + rowLength;
    var otherRowStart = rowLength * otherRowIndex;
    var otherRowEnd = otherRowStart + rowLength;

    // copy current row into temp
    pixels.copy(temp, 0, curRowStart, curRowEnd)
    // now copy other row into current row
    pixels.copy(pixels, curRowStart, otherRowStart, otherRowEnd)
    // and now copy temp back to other slot
    temp.copy(pixels, otherRowStart, 0, rowLength)
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
