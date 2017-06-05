# gl-pixel-stream

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Streams chunks of `gl.readPixels` from the specified FrameBuffer Object. This is primarily useful for exporting WebGL scenes and textures to high resolution images (i.e. print-ready). 

Before calling this method, ensure your FBO is populated with the content you wish to export. On each chunk, this will bind the given FBO, set the viewport, read the new pixels, and then unbind all FBOs.

The following image was generated with the [demo.js](./demo.js) in this module. This approach can render upwards of 10000x10000 images on a late 2013 MacBookPro.

![earth](http://i.imgur.com/ee6nE6i.png)

[(download full 3200x1800 image)](https://www.dropbox.com/s/crojjnh5in2bgsi/gl-pixel-stream.png?dl=0)

## Install

```sh
npm install gl-pixel-stream --save
```

## Example

A simple example with [gl-fbo](https://github.com/stackgl/gl-fbo) might look like this:

```js
var pixelStream = require('gl-pixel-stream')

// bind your FBO
fbo.bind()

// draw your scene to it
drawScene()

// get a pixel stream
var stream = pixelStream(gl, fbo.handle, fbo.shape)

// pipe it out somewhere
stream.pipe(output)
```

A more practical example involves streaming through [png-stream/encoder](https://github.com/devongovett/png-stream) to a write stream. See [demo.js](./demo.js) for an example of this, which uses Electron (through [hihat](https://github.com/Jam3/hihat)) to merge the WebGL and Node.js APIs.

See [Running From Source](#running-from-source) for details.

## Usage

[![NPM](https://nodei.co/npm/gl-pixel-stream.png)](https://www.npmjs.com/package/gl-pixel-stream)

#### `stream = glPixelStream(gl, fboHandle, shape, [opts])`

Creates a new stream which streams the data from `gl.readPixels`, reading from the given FrameBuffer. It is assumed to already be populated with your scene/texture.

The stream emits a `Buffer` containing the uint8 pixels, default RGBA.

- `gl` (required) the WebGL context
- `fboHandle` (required) the handle for the WebGLFramebuffer instance
- `shape` (required) an Array, the `[width, height]` of the output
- `opts` (optional) additional settings

The additional settings can be:

- `chunkSize` (Number) the number of rows to fetch from the GPU in a single call to `gl.readPixels`, defaults to 128
- `flipY` (Boolean) whether to flip the output image on the Y axis (default false)
- `format` a WebGL format like `gl.RGBA` or `gl.RGB` for reading, default `gl.RGBA`
- `stride` (Number) the number of channels in a pixel, guessed from the specified `format`, or defaults to `4`
- `onProgress` (Function) a function that has an `event` parameter with `current` and `total` chunk count, as well as `bounds` array with `[ x, y, width, height ]` from readPixels

## Running from Source

Clone and install:

```sh
git clone https://github.com/Jam3/gl-pixel-stream.git
cd gl-pixel-stream
npm install
```

To run the tests:

```sh
npm run test
```

To run the demo in "production" mode (no DevTools window). This will output an `image.png` in the current folder.

```sh
npm run start
```

To run the demo in "development" mode. This opens a DevTools window and reloads the bundle on `demo.js` file-save.

```sh
npm run dev
```

The output `image.png` should look like this, and be the size specified in the `demo.js` file:

![earth](http://i.imgur.com/ee6nE6i.png)

## License

MIT, see [LICENSE.md](http://github.com/Jam3/gl-pixel-stream/blob/master/LICENSE.md) for details.
