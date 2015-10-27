precision mediump float;

uniform float iGlobalTime;
uniform vec2 iResolution;

#pragma glslify: planet = require('glsl-earth')

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  //% of screen
  float size = 0.75;

  //create our planet 
  gl_FragColor.rgb = planet(uv, iResolution.xy, size);
  gl_FragColor.a = 1.0;  
}