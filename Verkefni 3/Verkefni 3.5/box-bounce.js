var canvas;
var gl;

// Núverandi staðsetning miðju ferningsins
var box = vec2(0.0, 0.0);
var box2 = vec2(0.0, 0.05);

// Stefna (og hraði) fernings
var dX;
var dY;

// Svæðið er frá -maxX til maxX og -maxY til maxY
var maxX = 1.0;
var maxY = 1.0;

// Hálf breidd/hæð ferningsins
var boxRad = 0.05;

// Ferningurinn er upphaflega í miðjunni
var vertices = new Float32Array([
  // First Rectangle
  -0.05, -0.05, 0.05, -0.05, 0.05, 0.05, -0.05, 0.05,

  // Second Rectangle (wider)
  -0.2, -0.9, -0.2, -0.86, 0.2, -0.86, 0.2, -0.9,
]);

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.8, 0.8, 0.8, 1.0);

  var speed = 0.1;

  // Gefa ferningnum slembistefnu í upphafi
  dX = Math.random() * 0.1 - 0.05;
  dY = Math.random() * 0.1 - 0.05;

  dX *= speed;
  dY *= speed;

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Load the data into the GPU
  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);

  // Associate out shader variables with our data buffer
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  locBox = gl.getUniformLocation(program, "boxPos");

  // Event listener for keyboard to control the second rectangle (box2)
  window.addEventListener("keydown", function (e) {
    var xmove = 0.0;
    switch (e.keyCode) {
      case 37: // vinstri ör
        xmove = -0.04;
        break;
      case 39: // hægri ör
        xmove = 0.04;
        break;
      default:
        xmove = 0.0;
    }

    // Calculate the new X position for the second rectangle
    var newBox2X = box2[0] + xmove;

    // Ensure that the entire width of the second rectangle remains inside the screen boundaries
    if (newBox2X - 0.08 >= -maxX + 0.08 && newBox2X + 0.08 <= maxX - 0.08) {
      box2[0] = newBox2X;
    }
  });

  render();
};

function checkCollision(box1, box2) {
  // Calculate the distance between the centers of the two rectangles
  var dx = box1[0] - box2[0];
  var dy = box1[1] - box2[1];
  var distance = Math.sqrt(dx * dx + dy * dy);

  // Check if the distance is less than the sum of half the widths of the rectangles (collision)
  return distance < boxRad * 2;
}

function render() {
  // Check for collision
  if (checkCollision(box, box2)) {
    // If there's a collision, reverse the direction of the first rectangle
    dX = -dX;
    dY = -dY;
  }

  // Láta ferninginn skoppa af veggjunum
  if (Math.abs(box[0] + dX) > maxX - boxRad) dX = -dX;
  if (box[1] + dY > maxY - boxRad) dY = -dY;

  // Uppfæra staðsetningu
  box[0] += dX;
  box[1] += dY;

  gl.clear(gl.COLOR_BUFFER_BIT);

  // Render the first rectangle
  gl.uniform2fv(locBox, flatten(box));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // Render the second rectangle
  gl.uniform2fv(locBox, flatten(box2));
  gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);

  window.requestAnimationFrame(render);
}
