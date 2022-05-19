window.onload = function () {
  init();
}

/**
 * Function that is going to be executed when the window first loads.
 * Sets up webgl boilerplate.
 */
function init() {
  // *** Get canvas ***
  const canvas = document.getElementById('gl-canvas');

  /** @type {WebGLRenderingContext} */ // ONLY FOR VS CODE
  gl = canvas.getContext('webgl') || canvas.getContext("experimental-webgl");
  if (!gl) {
      alert('WebGL not supported');
      return;
  }

  // *** Set viewport ***
  gl.viewport(0, 0, canvas.width, canvas.height)

  // *** Set color to the canvas ***
  gl.clearColor(1.0, 1.0, 1.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // *** Initialize vertex and fragment shader ***
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // *** Render ***
  render();
}

/**
 * Functions that renders all the elements into the canvas
 */
function render() {
  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Make the new frame
  requestAnimationFrame(render);
}