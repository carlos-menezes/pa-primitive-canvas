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
    // [x,y,z]
    translation: [
      Math.floor(Math.random() * (8 - -8 + 1)) + -8,
      Math.floor(Math.random() * (8 - -8 + 1)) + -8,
      Math.floor(Math.random() * (8 - -8 + 1)) + -8,
    ],
    rotation: [0, Math.random() * (0.1 - 0.01) + 0.01, 0],
    currentRotation: [0, 0, 0],
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
    .addEventListener("click", handleAddPrimitive);

  document
    .getElementById("select-object")
    .addEventListener("change", handleObjectSelection);

  document
    .getElementById("object-remove")
    .addEventListener("click", handleRemoveObject);

  // *** Render ***
  render();
}

function handleRemoveObject() {
  const selectObjectElement = document.getElementById("select-object");
  const selectedObjectValue =
    selectObjectElement.options[selectObjectElement.selectedIndex].value;

  objects.splice(selectedObjectValue, 1);

  const childToRemove = document.querySelector(
    `option[value='${selectedObjectValue}']`
  );
  selectObjectElement.removeChild(childToRemove);

  // As the array of objects has changed, `option`s must be reassigned their values again
  console.log(selectObjectElement.childNodes);
  let count = 0;
  selectObjectElement.childNodes.forEach((child, i) => {
    if (i !== 0) {
      child.value = count;
      count++;
    }
  });
}

function handleAddPrimitive() {
  const shape = document.getElementById("select-primitive").value;
  const object = createObject(shape);
  objects.push(object);
  let objectSelector = document.getElementById("select-object");
  const option = document.createElement("option");
  option.value = objects.length - 1; // The value of the "option" will be the index of the element
  option.innerText = `${shape} #${objects.length - 1}`;
  objectSelector.appendChild(option);
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
  translationInputs.forEach((input, idx) => {
    input.textContent = object.translation[idx];
    input.value = object.translation[idx];
  });

  // Rotation
  const rotationInputs = document.querySelectorAll("input[id*='rotation-']");
  rotationInputs.forEach((input, idx) => {
    input.textContent = object.rotation[idx];
    input.value = object.rotation[idx];
  });

  console.log(objects);
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

const prepareObject = (object, objectPointsArray, objectColorsArray) => {
  // *** Send position data to the GPU ***
  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objectPointsArray),
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
    new Float32Array(objectColorsArray),
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
  mat4.scale(ctm, ctm, [object.scale, object.scale, object.scale]);
  mat4.translate(ctm, ctm, [
    object.translation[0],
    object.translation[1],
    object.translation[2],
  ]);

  // *** Rotate cube (if necessary) ***
  object.currentRotation[0] += object.rotation[0];
  object.currentRotation[1] += object.rotation[1];
  object.currentRotation[2] += object.rotation[2];
  mat4.rotateX(ctm, ctm, object.currentRotation[0]);
  mat4.rotateY(ctm, ctm, object.currentRotation[1]);
  mat4.rotateZ(ctm, ctm, object.currentRotation[2]);

  // *** Transfer the information to the model viewer ***
  gl.uniformMatrix4fv(modelViewMatrix, false, ctm);

  // *** Draw the triangles ***
  gl.drawArrays(gl.TRIANGLES, 0, objectPointsArray.length / 3);
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

/**
 * Functions that renders all the elements into the canvas
 */
function render() {
  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  for (const object of objects) {
    switch (object.shape) {
      case "cube":
        prepareObject(object, cubePointsArray, cubeColorsArray);
        break;
      case "pyramid":
        prepareObject(object, pyramidPointsArray, pyramidColorsArray);
        break;
    }
  }
  // Make the new frame
  requestAnimationFrame(render);
}
