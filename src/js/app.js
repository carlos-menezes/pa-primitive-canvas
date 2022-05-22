let canvas;

let objects = [];

const pyramidPointsArray = [
  // Front face
  0.0, 1.0, 0.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  // Right face
  0.0, 1.0, 0.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0,
  // Back face
  0.0, 1.0, 0.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0,
  // Left face
  0.0, 1.0, 0.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,
];

let pyramidColorsArray = [];

const cubePointsArray = [
  // Front
  0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
  -0.5, -0.5, 0.5,
  // Left
  -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5,
  0.5, -0.5, -0.5, -0.5,
  // Back
  -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5,
  -0.5, 0.5, -0.5, -0.5,
  // Right
  0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
  0.5, -0.5, -0.5,
  // Top
  0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
  -0.5, 0.5, -0.5,
  // Bottom
  0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,
  -0.5, -0.5, -0.5, -0.5,
];
let cubeColorsArray = [];

let gl;
let ctm;
let modelViewMatrix;

let program;

/**
 * Creates a new object.
 *
 * @param {string} shape
 * @returns an object describing the features of the object
 */
const createObject = (shape) => {
  return {
    shape,
    scale: 0.1,
    translation: {
      x: Math.floor(Math.random() * (8 - -8 + 1)) + -8,
      y: Math.floor(Math.random() * (8 - -8 + 1)) + -8,
      z: Math.floor(Math.random() * (8 - -8 + 1)) + -8,
    },
    rotation: {
      // Rotation between (0.03, 0.1) rad
      x: 0,
      y: Math.random() * (0.1 - 0.01) + 0.01,
      z: 0,
    },
    currentRotation: {
      x: 0,
      y: 0,
      z: 0,
    },
  };
};

window.onload = function () {
  init();
};

/**
 * Function that is going to be executed when the window first loads.
 * Sets up webgl boilerplate.
 */
function init() {
  // *** Get canvas ***
  canvas = document.getElementById("gl-canvas");

  /** @type {WebGLRenderingContext} */ // ONLY FOR VS CODE
  gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) {
    alert("WebGL not supported");
    return;
  }

  colorCube();
  colorPyramid();

  // *** Set viewport ***
  gl.viewport(0, 0, canvas.width, canvas.height);

  // *** Set color to the canvas ***
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // *** Initialize vertex and fragment shader ***
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  document
    .getElementById("add-primitive")
    .addEventListener("click", function () {
      const shape = document.getElementById("select-primitive").value;
      const object = createObject(shape);
      objects.push(object);
      let objectSelector = document.getElementById("select-object");
      const option = document.createElement("option");
      option.value = objects.length - 1; // The value of the "option" will be the index of the element
      option.innerText = `${shape} #${objects.length - 1}`;
      objectSelector.appendChild(option);
    });

  document
    .getElementById("select-object")
    .addEventListener("change", handleObjectSelection);

  // *** Render ***
  render();
}

function handleObjectSelection() {
  const selectObjectElement = document.getElementById("select-object");
  const selectedObjectValue =
    selectObjectElement.options[selectObjectElement.selectedIndex].value;
  const object = objects[selectedObjectValue];

  // Scaling
  const scaleInput = document.querySelector("input[id='scale']");
  scaleInput.textContent = object.scale;
  scaleInput.value = object.scale;

  // Translation
  const translationInputs = document.querySelectorAll(
    "input[id*='translation-']"
  );
  translationInputs[0].textContent = object.translation.x;
  translationInputs[0].value = object.translation.x;
  translationInputs[1].textContent = object.translation.y;
  translationInputs[1].value = object.translation.y;
  translationInputs[2].textContent = object.translation.z;
  translationInputs[2].value = object.translation.z;
}

const colorPyramid = () => {
  const vertexColors = [
    [1.0, 1.0, 0.0], // yellow
    [0.0, 1.0, 0.0], // green
    [0.0, 0.0, 1.0], // blue
    [1.0, 0.0, 1.0], // magenta
    [0.0, 1.0, 1.0], // cyan
  ];

  for (let face = 0; face < 5; face++) {
    let faceColor = vertexColors[face];
    for (let vertex = 0; vertex < 3; vertex++) {
      pyramidColorsArray.push(...faceColor);
    }
  }
};

const preparePyramid = (pyramid) => {
  // *** Send position data to the GPU ***
  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(pyramidPointsArray),
    gl.STATIC_DRAW
  );

  // *** Define the form of the data ***
  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

  // *** Send color data to the GPU ***
  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(pyramidColorsArray),
    gl.STATIC_DRAW
  );

  // *** Define the color of the data ***
  let vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

  // *** Get a pointer for the model viewer
  modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
  ctm = mat4.create();

  // *** Apply transformations ***
  mat4.scale(ctm, ctm, [pyramid.scale, pyramid.scale, pyramid.scale]);
  mat4.translate(ctm, ctm, [
    pyramid.translation.x,
    pyramid.translation.y,
    pyramid.translation.z,
  ]);

  // *** Rotate cube (if necessary) ***
  pyramid.currentRotation.x += pyramid.rotation.x;
  pyramid.currentRotation.y += pyramid.rotation.y;
  pyramid.currentRotation.z += pyramid.rotation.z;
  mat4.rotateX(ctm, ctm, pyramid.currentRotation.x);
  mat4.rotateY(ctm, ctm, pyramid.currentRotation.y);
  mat4.rotateZ(ctm, ctm, pyramid.currentRotation.z);

  // *** Transfer the information to the model viewer ***
  gl.uniformMatrix4fv(modelViewMatrix, false, ctm);

  // *** Draw the triangles ***
  gl.drawArrays(gl.TRIANGLES, 0, pyramidPointsArray.length / 3);
};

const colorCube = () => {
  // Specify the colors of the faces
  let vertexColors = [
    [1.0, 1.0, 0.0], // yellow
    [0.0, 1.0, 0.0], // green
    [0.0, 0.0, 1.0], // blue
    [1.0, 0.0, 1.0], // magenta
    [0.0, 1.0, 1.0], // cyan
    [1.0, 0.0, 0.0], // red
  ];

  // Set the color of the faces
  for (let face = 0; face < 6; face++) {
    let faceColor = vertexColors[face];
    for (let vertex = 0; vertex < 6; vertex++) {
      cubeColorsArray.push(...faceColor);
    }
  }
};

const prepareCube = (cube) => {
  // *** Send position data to the GPU ***
  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(cubePointsArray),
    gl.STATIC_DRAW
  );

  // *** Define the form of the data ***
  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

  // *** Send color data to the GPU ***
  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(cubeColorsArray),
    gl.STATIC_DRAW
  );

  // *** Define the color of the data ***
  let vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

  // *** Get a pointer for the model viewer
  modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
  ctm = mat4.create();

  // *** Apply transformations ***
  mat4.scale(ctm, ctm, [cube.scale, cube.scale, cube.scale]);
  mat4.translate(ctm, ctm, [
    cube.translation.x,
    cube.translation.y,
    cube.translation.z,
  ]);

  // *** Rotate cube (if necessary) ***
  cube.currentRotation.x += cube.rotation.x;
  cube.currentRotation.y += cube.rotation.y;
  cube.currentRotation.z += cube.rotation.z;
  mat4.rotateX(ctm, ctm, cube.currentRotation.x);
  mat4.rotateY(ctm, ctm, cube.currentRotation.y);
  mat4.rotateZ(ctm, ctm, cube.currentRotation.z);

  // *** Transfer the information to the model viewer ***
  gl.uniformMatrix4fv(modelViewMatrix, false, ctm);

  // *** Draw the triangles ***
  gl.drawArrays(gl.TRIANGLES, 0, cubePointsArray.length / 3);
};

/**
 * Functions that renders all the elements into the canvas
 */
function render() {
  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  for (const object of objects) {
    switch (object.shape) {
      case "cube":
        prepareCube(object);
        break;
      case "pyramid":
        preparePyramid(object);
        break;
      // TODO: preparePyramid
    }
  }
  // Make the new frame
  requestAnimationFrame(render);
}
