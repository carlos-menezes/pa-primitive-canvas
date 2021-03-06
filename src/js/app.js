const MODELS_SRC = "./assets";

let canvas; // Canvas element
let objects = []; // Objects on the canvas
let whiteTexture; // Texture used for objects with plain colors
let texture; // Texture used for custom objects

/**
 * Vertex coordinates for the pyramid primitive.
 */
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

/**
 * RGB values for each face of the pyramid primitive.
 */
const pyramidFaceColors = [
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
];

/**
 * Vertex coordinates for the cube primitive.
 */
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

/**
 * RGB values for each face of the cube primitive.
 */
const cubeFaceColors = [
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
];

/**
 * Ambient light location on the vertex shader and (default) values.
 */
let ambientLightUniformLocation;
let ambientLightIntensity = {
  r: 0.5,
  g: 0.5,
  b: 0.5,
};

/**
 * Direction light location and its default values.
 */
let sunlightDirectionUniformLocation;
let sunlightDirection = {
  x: 0.5,
  y: 0.5,
  z: 0.5,
};
let sunlightIntensityUniformLocation;
let sunlightIntensity = {
  r: 0.5,
  g: 0.5,
  b: 0.5,
};

let gl; // WebGL object
let ctm; // Transformations matrix
let modelViewMatrix;
let program; // Shaders

/**
 * Creates a new object which is later prepared in either:
 * - {@link preparePrimitive}, if the object's `shape` attribute is either `pyramid` or `cube`;
 * - {@link prepareModel}, if the object's shape is not a primitive.
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
    texture: null,
    normals: [],
  };
};

/**
 * Once the page has loaded the DOM tree, run the {@link init} function.
 */
window.onload = () => {
  init();
};

/**
 * Function that is going to be executed when the window first loads.
 * Sets up webgl boilerplate.
 */

/**
 * {@link init} is executed when the window first loads.
 * It assembles WebGL boilerplate code and sets up event listeners for the the UI controls shown to the user in the page.
 * @returns `-1` if WebGL is not supported by the browser; `0` otherwise.
 */
const init = async () => {
  // Get canvas
  canvas = document.getElementById("gl-canvas");

  /** @type {WebGLRenderingContext} */ // ONLY FOR VS CODE
  gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) {
    alert("WebGL not supported");
    return -1;
  }

  // Set viewport
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Set color to the canvas
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Initialize vertex and fragment shader
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  whiteTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
  const whitePixel = new Uint8Array([255, 255, 255, 0]);
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

  sunlightIntensityUniformLocation = gl.getUniformLocation(
    program,
    "sun.color"
  );
  sunlightDirectionUniformLocation = gl.getUniformLocation(
    program,
    "sun.direction"
  );

  document
    .getElementById("select-primitive")
    .addEventListener("change", handleSelectPrimitive);

  document
    .getElementById("face-color")
    .addEventListener("input", handleFaceColorSelection);

  document
    .getElementById("load-texture")
    .addEventListener("click", handleLoadTexture);

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

  document
    .getElementById("object-stop-animation")
    .addEventListener("click", handleStopAnimation);

  document.addEventListener("wheel", handleMouseWheel);

  document.addEventListener("keydown", handleKeyDown);

  document.addEventListener("keyup", handleKeyUp);

  // Render
  render();

  return 0;
};

/**
 * Handles the scroll event.
 * @param {*} event
 */
const handleMouseWheel = (event) => {
  const objectIndex = getSelectedObjectIndex();
  if (objectIndex) {
    if (event.deltaY < 0) {
      objects[objectIndex].scale *= 1.1;
    } else {
      objects[objectIndex].scale /= 1.1;
    }
    handleObjectSelection();
  }
};

/**
 * Handles the press of a key.
 * @param {*} event
 */
const handleKeyDown = (event) => {
  const objectIndex = getSelectedObjectIndex();
  if (objectIndex) {
    switch (event.key) {
      case "a":
        objects[objectIndex].rotation[1] += 0.01;
        break;
      case "d":
        objects[objectIndex].rotation[1] -= 0.01;
        break;
      case "s":
        objects[objectIndex].rotation[0] -= 0.01;
        break;
      case "w":
        objects[objectIndex].rotation[0] += 0.01;
        break;
      case "ArrowLeft":
        objects[objectIndex].translation[0] -= 0.01;
        break;
      case "ArrowRight":
        objects[objectIndex].translation[0] += 0.01;
        break;
      case "ArrowDown":
        objects[objectIndex].translation[1] -= 0.01;
        break;
      case "ArrowUp":
        objects[objectIndex].translation[1] += 0.01;
        break;
      case "z":
        objects[objectIndex].translation[2] += 0.01;
        break;
      case "x":
        objects[objectIndex].translation[2] -= 0.01;
        break;
    }
  }
};

/**
 * Handles the release of a key.
 * @param {*} event
 */
const handleKeyUp = (event) => {
  const objectIndex = getSelectedObjectIndex();
  event.preventDefault();
  if (objectIndex) {
    switch (event.key) {
      case "s":
      case "w":
        objects[objectIndex].rotation[0] = 0;
        break;
      case "a":
      case "d":
        objects[objectIndex].rotation[1] = 0;
        break;
    }
  }
};

/**
 * Handles the click of the `Stop Animation` button.
 * Resets the rotation of the object to 0 in all axis.
 */
const handleStopAnimation = () => {
  const objectIndex = getSelectedObjectIndex();
  if (objectIndex) {
    objects[objectIndex].currentRotation[0] = 0;
    objects[objectIndex].currentRotation[1] = 0;
    objects[objectIndex].currentRotation[2] = 0;
    objects[objectIndex].rotation[0] = 0;
    objects[objectIndex].rotation[1] = 0;
    objects[objectIndex].rotation[2] = 0;
  }
};

/**
 * Gets the index of the selected object.
 * @returns the index of the selected object
 */
const getSelectedObjectIndex = () => {
  const selectObjectElement = document.getElementById("select-object");
  const objectIndex =
    selectObjectElement.options[selectObjectElement.selectedIndex];
  return objectIndex.value;
};

/**
 * Handles the manipulation of the LIGHT SOURCE UI controls.
 */
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

  sunlightDirection.x = document.getElementById("light-src-direction-x").value;
  sunlightDirection.y = document.getElementById("light-src-direction-y").value;
  sunlightDirection.z = document.getElementById("light-src-direction-z").value;

  sunlightIntensity.r = document.getElementById(
    "light-src-intensity-sun-r"
  ).value;
  sunlightIntensity.g = document.getElementById(
    "light-src-intensity-sun-g"
  ).value;
  sunlightIntensity.b = document.getElementById(
    "light-src-intensity-sun-b"
  ).value;
};

/**
 * Handles the manipulation of the PRIMITIVE FACE COLOR UI controls.
 * @param {Event} event
 */
const handleFaceColorSelection = (event) => {
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
};

/**
 * Handles the manipulation of the SELECT PRIMITIVE UI controls.
 */
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

/**
 * Adds an object (created with {@link createObject}) to the "SELECT OBJECT" select UI element.
 *
 * @param {*} object
 */
const addObjectToObjectsSelector = (object) => {
  let objectSelector = document.getElementById("select-object");
  const option = document.createElement("option");
  option.value = objects.length - 1; // The value of the "option" will be the index of the element
  option.innerText = `${object.shape} #${objects.length - 1}`;
  objectSelector.appendChild(option);
  option.selected = true;
  handleObjectSelection();
};

/**
 * Adds a custom model to the list of objects to be rendered.
 * This loads the object and the corresponding texture (names must match).
 */
const handleAddModel = async () => {
  const selectModelElement = document.getElementById("select-model");
  const selectedModelValue = selectModelElement.value;
  const modelFilePath = `${MODELS_SRC}/${selectModelElement.value}.obj`; // won't work well on Linux due to path separator
  const modelContent = await loadObjResource(modelFilePath);
  const data = parseOBJ(modelContent);

  const object = createObject(selectedModelValue);
  object.pointCoordinates = data.position;
  normalize(object.pointCoordinates);
  object.textureCoordinates = data.texcoord;
  object.normals = data.normal;

  const textureFilePath = `${MODELS_SRC}/${selectedModelValue}.png`;
  let image = new Image();
  image.src = textureFilePath;
  image.onload = () => {
    configureTexture(object, image);
  };

  objects.push(object);
  addObjectToObjectsSelector(object);
};

/**
 * Removes an object from the "SELECT OBJECT" select UI element.
 * @returns `-1` if there is no child to be removed; `0` otherwise.
 */
const handleRemoveObject = () => {
  const selectObjectElement = document.getElementById("select-object");
  const selectedObjectIndex = selectObjectElement.value;

  objects.splice(selectedObjectIndex, 1);

  const childToRemove = document.querySelector(
    `#select-object > option[value='${selectedObjectIndex}']`
  );

  if (childToRemove === null) {
    return -1;
  }

  selectObjectElement.removeChild(childToRemove);

  // As the array of objects has changed, `option`s must be reassigned their values again
  let count = 0;
  selectObjectElement.childNodes.forEach((child, i) => {
    child.value = count;
    count++;
  });

  return 0;
};

/**
 * Handles texture loading.
 */
const handleLoadTexture = () => {
  if (objects.length === 0) {
    alert("Sem primitivas e/ou modelos para adicionar textura.");
  }
};

/**
 * Adds a primitive to the scene.
 */
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
  addObjectToObjectsSelector(object);
};

/**
 * Handles option selection of the "SELECT OBJECT" select UI element.
 * This function gets the values of the object from the `objects` array and loads them into the inputs.
 * TODO: when values are modified with keys, update values of the input elements
 */
const handleObjectSelection = () => {
  const selectedObjectIndex = getSelectedObjectIndex();
  const object = objects[selectedObjectIndex];

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

/**
 * Handles manipulation of the selected object, namely it's `scale`, `rotation` and `translation` values.
 */
const handleObjectManipulation = () => {
  const selectObjectElement = document.getElementById("select-object");
  const objectIndex =
    selectObjectElement.options[selectObjectElement.selectedIndex].value;

  const scale = parseFloat(document.getElementById("scale").value);
  const rotateX = parseFloat(document.getElementById("rotation-x").value);
  const rotateY = parseFloat(document.getElementById("rotation-y").value);
  const rotateZ = parseFloat(document.getElementById("rotation-z").value);
  const translateX = parseFloat(document.getElementById("translation-x").value);
  const translateY = parseFloat(document.getElementById("translation-y").value);
  const translateZ = parseFloat(document.getElementById("translation-z").value);

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

/**
 * Generates an array of colors for each vertex of the cube.
 * @returns array of colors
 */
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

/**
 * Generates an array of colors for each vertex of the pyramid.
 * @returns array of colors
 */
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

/**
 * Configures the texture of an object.
 *
 * @param {*} object
 * @param {*} image
 */
const configureTexture = (object, image) => {
  object.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, object.texture);
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
};

/**
 * Prepares a primitive to be rendered on the canvas.
 * This function sets up the buffer and loads the needed data into them.
 * @param {*} object
 */
const preparePrimitive = (object) => {
  // Send position data to the GPU
  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(object.pointCoordinates),
    gl.STATIC_DRAW
  );

  // Define the form of the data
  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

  // Send color data to the GPU
  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(object.faceColors),
    gl.STATIC_DRAW
  );

  // Define the color of the data
  let vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, whiteTexture);

  // Get a pointer for the model vi
  modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
  ctm = mat4.create();

  // Apply transformations
  mat4.scale(ctm, ctm, [object.scale, object.scale, object.scale]);
  mat4.translate(ctm, ctm, [
    object.translation[0],
    object.translation[1],
    object.translation[2],
  ]);

  // Rotate cube (if necessary)
  object.currentRotation[0] += object.rotation[0];
  object.currentRotation[1] += object.rotation[1];
  object.currentRotation[2] += object.rotation[2];
  mat4.rotateX(ctm, ctm, object.currentRotation[0]);
  mat4.rotateY(ctm, ctm, object.currentRotation[1]);
  mat4.rotateZ(ctm, ctm, object.currentRotation[2]);

  // Transfer the information to the model viewer
  gl.uniformMatrix4fv(modelViewMatrix, false, ctm);

  // Draw the triangles
  gl.drawArrays(gl.TRIANGLES, 0, object.pointCoordinates.length / 3);
};

/**
 * Prepares a custom model to be rendered on the canvas.
 * This function sets up the buffer and loads the needed data into them.
 * @param {*} object
 */
const prepareModel = (object) => {
  // Send position data to the GPU
  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(object.pointCoordinates),
    gl.STATIC_DRAW
  );

  // Define the form of the data
  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, object.texture);
  // gl.bindTexture(gl.TEXTURE_2D, texture);

  // Send color data to the GPU
  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 1]), gl.STATIC_DRAW);

  // Define the color of the data
  let vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

  // Send texture data to the GPU
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

  // Send normals to the GPU
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(object.normals),
    gl.STATIC_DRAW
  );
  var vNormData = gl.getAttribLocation(program, "aNormal");
  gl.vertexAttribPointer(vNormData, 3, gl.FLOAT, gl.TRUE, 0, 0);
  gl.enableVertexAttribArray(vNormData);

  // Get a pointer for the model viewer
  modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
  ctm = mat4.create();

  // Apply transformations
  mat4.scale(ctm, ctm, [object.scale, object.scale, object.scale]);
  mat4.translate(ctm, ctm, [
    object.translation[0],
    object.translation[1],
    object.translation[2],
  ]);

  // Rotate cube (if necessary)
  object.currentRotation[0] += object.rotation[0];
  object.currentRotation[1] += object.rotation[1];
  object.currentRotation[2] += object.rotation[2];
  mat4.rotateX(ctm, ctm, object.currentRotation[0]);
  mat4.rotateY(ctm, ctm, object.currentRotation[1]);
  mat4.rotateZ(ctm, ctm, object.currentRotation[2]);

  // Transfer the information to the model viewer
  gl.uniformMatrix4fv(modelViewMatrix, false, ctm);

  // Draw the triangles
  gl.drawArrays(gl.TRIANGLES, 0, object.pointCoordinates.length / 3);
};

/**
 * Renders the scene to the `canvas` element.
 */
const render = () => {
  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform3f(
    ambientLightUniformLocation,
    ambientLightIntensity.r,
    ambientLightIntensity.g,
    ambientLightIntensity.b
  );

  gl.uniform3f(
    sunlightDirectionUniformLocation,
    sunlightDirection.x,
    sunlightDirection.y,
    sunlightDirection.z
  );
  gl.uniform3f(
    sunlightIntensityUniformLocation,
    sunlightIntensity.r,
    sunlightIntensity.g,
    sunlightIntensity.b
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
};
