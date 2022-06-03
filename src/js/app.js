const MODELS_SRC = "../../assets";

let canvas; // Canvas element
let objects = []; // Objects on the canvas
let whiteTexture;
let texture;

const pyramidVertexPoints = [
  // Front face
  0.0, 1.0, 0.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  // Right face
  0.0, 1.0, 0.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0,
  // Back face
  0.0, 1.0, 0.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0,
  // Left face
  0.0, 1.0, 0.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,
];
const pyramidFaceColors = [
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
];

const cubeVertexPoints = [
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
const cubeFaceColors = [
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
];

let ambientLightUniformLocation;
let ambientLightIntensity = {
  r: 0.5,
  g: 0.5,
  b: 0.5,
};

let gl; // WebGL object
let ctm; // Transformations matrix
let modelViewMatrix;
let program; // Shaders

/**
 * Creates a new object.
 *
 * @param {string} shape
 * @returns an object describing the features of the object
 */
const createObject = (shape) => {
  return {
    shape,
    scale: 0.5,
    // [x,y,z]
    translation: [0, 0, 0],
    rotation: [0, Math.random() * (0.05 - 0.01) + 0.01, 0],
    currentRotation: [0, 0, 0],
    pointCoordinates: [],
    textureCoordinates: [],
    faceColors: [],
  };
};

window.onload = function () {
  init();
};

/**
 * Function that is going to be executed when the window first loads.
 * Sets up webgl boilerplate.
 */
async function init() {
  // *** Get canvas ***
  canvas = document.getElementById("gl-canvas");

  /** @type {WebGLRenderingContext} */ // ONLY FOR VS CODE
  gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) {
    alert("WebGL not supported");
    return;
  }

  // *** Set viewport ***
  gl.viewport(0, 0, canvas.width, canvas.height);

  // *** Set color to the canvas ***
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // *** Initialize vertex and fragment shader ***
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  whiteTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
  const whitePixel = new Uint8Array([255, 255, 255, 255]);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    whitePixel
  );

  ambientLightUniformLocation = gl.getUniformLocation(
    program,
    "fAmbientLightIntensity"
  );

  document
    .getElementById("select-primitive")
    .addEventListener("change", handleSelectPrimitive);

  document
    .getElementById("face-color")
    .addEventListener("input", handleFaceColorSelection);

  document
    .getElementById("add-primitive")
    .addEventListener("click", handleAddPrimitive);

  document
    .getElementById("select-object")
    .addEventListener("change", handleObjectSelection);

  document
    .getElementById("object-remove")
    .addEventListener("click", handleRemoveObject);

  document
    .getElementById("add-model")
    .addEventListener("click", handleAddModel);

  document
    .getElementById("object-apply-transformation")
    .addEventListener("click", handleObjectManipulation);

  document
    .getElementById("add-light-src")
    .addEventListener("click", handleAddLightSource);

  // *** Render ***
  render();
}

const handleAddLightSource = () => {
  ambientLightIntensity.r = document.getElementById(
    "light-src-intensity-r"
  ).value;
  ambientLightIntensity.g = document.getElementById(
    "light-src-intensity-g"
  ).value;
  ambientLightIntensity.b = document.getElementById(
    "light-src-intensity-b"
  ).value;
};

function handleFaceColorSelection(event) {
  const shape = document.getElementById("select-primitive").value;
  const colorHex = event.target.value;
  const normalizedColor = hexToNormalizedColor(colorHex);
  let face;
  switch (shape) {
    case "cube":
      face = document.getElementById("cube-faces-selector").value;
      cubeFaceColors[face] = [
        normalizedColor.r,
        normalizedColor.g,
        normalizedColor.b,
      ];
      break;
    case "pyramid":
      face = document.getElementById("pyramid-faces-selector").value;
      pyramidFaceColors[face] = [
        normalizedColor.r,
        normalizedColor.g,
        normalizedColor.b,
      ];
      break;
  }
}

const handleSelectPrimitive = () => {
  const shape = document.getElementById("select-primitive").value;
  const cubeFacesColor = document.getElementById("cube-faces-color");
  const pyramidFacesColor = document.getElementById("pyramid-faces-color");
  if (shape === "cube") {
    cubeFacesColor.style.display = "flex";
    pyramidFacesColor.style.display = "none";
  } else if (shape === "pyramid") {
    cubeFacesColor.style.display = "none";
    pyramidFacesColor.style.display = "flex";
  }
};

const addObjectToObjectsSelector = (object) => {
  let objectSelector = document.getElementById("select-object");
  const option = document.createElement("option");
  option.value = objects.length - 1; // The value of the "option" will be the index of the element
  option.innerText = `${object.shape} #${objects.length - 1}`;
  objectSelector.appendChild(option);
  option.selected = true;
  handleObjectSelection();
};

const handleAddModel = async () => {
  const selectModelElement = document.getElementById("select-model");
  const selectedModelValue = selectModelElement.value;
  const modelFilePath = `${MODELS_SRC}/${selectModelElement.value}.obj`; // won't work well on Linux due to path separator
  const modelContent = await loadObjResource(modelFilePath);
  const data = parseOBJ(modelContent);

  const textureFilePath = `${MODELS_SRC}/${selectedModelValue}.png`;
  let image = new Image();
  image.src = textureFilePath;
  image.onload = function () {
    configureTexture(image);
  };

  const object = createObject(selectedModelValue);
  object.pointCoordinates = data.position;
  normalize(object.pointCoordinates);
  object.textureCoordinates = data.texcoord;
  objects.push(object);
  addObjectToObjectsSelector(object);
};

const handleRemoveObject = () => {
  const selectObjectElement = document.getElementById("select-object");
  const selectedObjectValue = selectObjectElement.value;

  objects.splice(selectedObjectValue, 1);

  const childToRemove = document.querySelector(
    `#select-object > option[value='${selectedObjectValue}']`
  );

  if (childToRemove === null) {
    return;
  }

  selectObjectElement.removeChild(childToRemove);

  // As the array of objects has changed, `option`s must be reassigned their values again
  console.log(selectObjectElement.childNodes);
  let count = 0;
  selectObjectElement.childNodes.forEach((child, i) => {
    child.value = count;
    count++;
  });
};

const handleAddPrimitive = () => {
  const shape = document.getElementById("select-primitive").value;
  const object = createObject(shape);
  switch (shape) {
    case "cube":
      getCubeColors(object);
      object.faceColors = getCubeColors();
      object.pointCoordinates = cubeVertexPoints;
      break;
    case "pyramid":
      object.faceColors = getPyramidColors();
      object.pointCoordinates = pyramidVertexPoints;
      break;
  }
  objects.push(object);
  console.log(object);
  addObjectToObjectsSelector(object);
};

const handleObjectSelection = () => {
  const selectObjectElement = document.getElementById("select-object");
  const selectedObjectValue =
    selectObjectElement.options[selectObjectElement.selectedIndex].value;
  const object = objects[selectedObjectValue];

  // Scaling
  const scaleInput = document.querySelector("input[id='scale']");
  scaleInput.textContent = object.scale * 100;
  scaleInput.value = object.scale * 100;

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
    input.textContent = radToDeg(object.rotation[idx]);
    input.value = radToDeg(object.rotation[idx]);
  });
};

const handleObjectManipulation = () => {
  const selectObjectElement = document.getElementById("select-object");
  const objectIndex =
    selectObjectElement.options[selectObjectElement.selectedIndex].value;
  console.log(objects[objectIndex]);

  const scale = parseFloat(document.getElementById("scale").value);
  const rotateX = parseFloat(document.getElementById("rotation-x").value);
  const rotateY = parseFloat(document.getElementById("rotation-y").value);
  const rotateZ = parseFloat(document.getElementById("rotation-z").value);
  const translateX = parseFloat(document.getElementById("translation-x").value);
  const translateY = parseFloat(document.getElementById("translation-y").value);
  const translateZ = parseFloat(document.getElementById("translation-z").value);

  console.log(rotateX, degToRad(rotateX));

  objects[objectIndex].rotation = [0, 0, 0];
  objects[objectIndex].currentRotation = [0, 0, 0];

  if (scale) objects[objectIndex].scale = scale / 100;
  if (rotateX) objects[objectIndex].rotation[0] = degToRad(rotateX);
  if (rotateY) objects[objectIndex].rotation[1] = degToRad(rotateY);
  if (rotateZ) objects[objectIndex].rotation[2] = degToRad(rotateZ);
  if (translateX) objects[objectIndex].translation[0] = translateX / 100;
  if (translateY) objects[objectIndex].translation[1] = translateY / 100;
  if (translateZ) objects[objectIndex].translation[2] = translateZ / 100;
};

const getCubeColors = () => {
  let colors = [];
  for (let face = 0; face < 6; face++) {
    let faceColor = cubeFaceColors[face];
    for (let vertex = 0; vertex < 6; vertex++) {
      colors.push(...faceColor);
    }
  }
  return colors;
};

const getPyramidColors = () => {
  let colors = [];
  for (let face = 0; face < 4; face++) {
    let faceColor = pyramidFaceColors[face];
    for (let vertex = 0; vertex < 3; vertex++) {
      colors.push(...faceColor);
    }
  }
  return colors;
};

function configureTexture(image) {
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

const preparePrimitive = (object) => {
  // *** Send position data to the GPU ***
  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(object.pointCoordinates),
    gl.STATIC_DRAW
  );

  // *** Define the form of the data ***
  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, whiteTexture);

  // *** Send color data to the GPU ***
  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(object.faceColors),
    gl.STATIC_DRAW
  );

  // *** Define the color of the data ***
  let vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, whiteTexture);

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
  gl.drawArrays(gl.TRIANGLES, 0, object.pointCoordinates.length / 3);
};

const prepareModel = (object) => {
  // *** Send position data to the GPU ***
  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(object.pointCoordinates),
    gl.STATIC_DRAW
  );

  // *** Define the form of the data ***
  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // *** Send color data to the GPU ***
  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 1]), gl.STATIC_DRAW);

  // *** Define the color of the data ***
  let vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

  // *** Send texture data to the GPU ***
  let tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(object.textureCoordinates),
    gl.STATIC_DRAW
  );

  let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.enableVertexAttribArray(vTexCoord);
  gl.vertexAttribPointer(vTexCoord, 3, gl.FLOAT, false, 0, 0);

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
  gl.drawArrays(gl.TRIANGLES, 0, object.pointCoordinates.length / 3);
};

/**
 * Renders the scene to the `canvas` element.
 */
function render() {
  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform3f(
    ambientLightUniformLocation,
    ambientLightIntensity.r,
    ambientLightIntensity.g,
    ambientLightIntensity.b
  );

  for (const object of objects) {
    if (object.shape === "cube" || object.shape === "pyramid") {
      preparePrimitive(object);
    } else {
      prepareModel(object);
    }
  }
  // Make the new frame
  requestAnimationFrame(render);
}
