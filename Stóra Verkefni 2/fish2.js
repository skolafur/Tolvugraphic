var canvas;
var gl;

var N = 1000;

var NumBody = 6;
var NumTail = 3;

var boxSize = 25.0;

var checkRadius = 1;

var vBuffer;
var vBoxBuffer;
var vPosition;

var fishX = new Array(N);
fishX = CreateArrayAddition(N, 2 * boxSize, -boxSize);
var fishY = new Array(N);
fishY = CreateArrayAddition(N, 2 * boxSize, -boxSize);
var fishZ = new Array(N);
fishZ = CreateArrayAddition(N, 2 * boxSize, -boxSize);

var speed = 0.01;
var speedToggle = 1;

var fishSpeed = new Array(N);
fishSpeed = CreateArrayAddition(N, 0.2, 0.03);

var dX = new Array(N);
dX = CreateArrayAddition(N, 2 * speed, -speed);
var dY = new Array(N);
dY = CreateArrayAddition(N, 2 * speed, -speed);
var dZ = new Array(N);
dZ = CreateArrayAddition(N, 2 * speed, -speed);

InitializeD();

var fishX_new = new Array(N);
fishX_new = CreateArray(N, 0);
var fishY_new = new Array(N);
fishY_new = CreateArray(N, 0);
var fishZ_new = new Array(N);
fishZ_new = CreateArray(N, 0);

InitializeNext();

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var rotTail = new Array(N);
rotTail = CreateArray(N, 0);
var incTail = new Array(N);
incTail = CreateArrayAddition(N, 0.0, 2.0);

var zView = 60;

var weightCohesion = 0;
var weightAlignment = 0;
var weightSeperation = 0;
var weightCurrDir = 0.05;

var fishCounter;

var avgX;
var avgY;
var avgZ;

var avgXCoh;
var avgYCoh;
var avgZCoh;

var avgXAli;
var avgYAli;
var avgZAli;

var avgXSep;
var avgYSep;
var avgZSep;

var vecLength;

var rotationY;
var rotationZ;

var rotationY_new;
var rotationZ_new;

var fishColor;
fishColor = CreateArrayColor(N, 255);

var proLoc;
var mvLoc;
var colorLoc;

var vertices = [
  vec4(-0.5, 0.0, 0.0, 1.0),
  vec4(0.2, 0.2, 0.0, 1.0),
  vec4(0.5, 0.0, 0.0, 1.0),
  vec4(0.5, 0.0, 0.0, 1.0),
  vec4(0.2, -0.15, 0.0, 1.0),
  vec4(-0.5, 0.0, 0.0, 1.0),

  vec4(-0.5, 0.0, 0.0, 1.0),
  vec4(-0.65, 0.15, 0.0, 1.0),
  vec4(-0.65, -0.15, 0.0, 1.0),
];

var box_vertices = [
  vec4(-boxSize, -boxSize, -boxSize, 1.0),
  vec4(boxSize, -boxSize, -boxSize, 1.0),
  vec4(boxSize, boxSize, -boxSize, 1.0),
  vec4(-boxSize, boxSize, -boxSize, 1.0),
  vec4(-boxSize, -boxSize, -boxSize, 1.0),
  vec4(-boxSize, -boxSize, boxSize, 1.0),
  vec4(boxSize, -boxSize, boxSize, 1.0),
  vec4(boxSize, -boxSize, -boxSize, 1.0),
  vec4(boxSize, -boxSize, boxSize, 1.0),
  vec4(boxSize, boxSize, boxSize, 1.0),
  vec4(boxSize, boxSize, -boxSize, 1.0),
  vec4(boxSize, boxSize, boxSize, 1.0),
  vec4(-boxSize, boxSize, boxSize, 1.0),
  vec4(-boxSize, boxSize, -boxSize, 1.0),
  vec4(-boxSize, boxSize, boxSize, 1.0),
  vec4(-boxSize, -boxSize, boxSize, 1.0),
];

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.95, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  vBoxBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBoxBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(box_vertices), gl.STATIC_DRAW);

  vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  colorLoc = gl.getUniformLocation(program, "fColor");

  proLoc = gl.getUniformLocation(program, "projection");
  mvLoc = gl.getUniformLocation(program, "modelview");

  var proj = perspective(90.0, 1.0, 0.1, 100.0);
  gl.uniformMatrix4fv(proLoc, false, flatten(proj));

  canvas.addEventListener("mousedown", function (e) {
    movement = true;
    origX = e.offsetX;
    origY = e.offsetY;
    e.preventDefault();
  });

  canvas.addEventListener("mouseup", function (e) {
    movement = false;
  });

  canvas.addEventListener("mousemove", function (e) {
    if (movement) {
      spinY += (e.offsetX - origX) % 360;
      spinX += (e.offsetY - origY) % 360;
      origX = e.offsetX;
      origY = e.offsetY;
    }
  });

  window.addEventListener("mousewheel", function (e) {
    if (e.wheelDelta > 0.0) {
      zView += 0.2;
    } else {
      zView -= 0.2;
    }
  });

  var checkRadiusSlider = document.getElementById("checkRadius");
  var checkRadiusValue = document.getElementById("checkRadiusValue");
  checkRadiusSlider.addEventListener("input", function () {
    checkRadius = parseInt(checkRadiusSlider.value);
    checkRadiusValue.textContent = checkRadius;
  });

  var speedToggleSlider = document.getElementById("speedToggle");
  var speedToggleValue = document.getElementById("speedToggleValue");
  speedToggleSlider.addEventListener("input", function () {
    speedToggle = parseInt(speedToggleSlider.value);
    speedToggleValue.textContent = Math.floor(speedToggle);
  });

  var weightCohesionSlider = document.getElementById("weightCohesion");
  var weightCohesionValue = document.getElementById("weightCohesionValue");
  weightCohesionSlider.addEventListener("input", function () {
    weightCohesion = 0.005 * parseInt(weightCohesionSlider.value);
    weightCohesionValue.textContent = Math.floor(weightCohesion / 0.005);
  });

  var weightAlignmentSlider = document.getElementById("weightAlignment");
  var weightAlignmentValue = document.getElementById("weightAlignmentValue");
  weightAlignmentSlider.addEventListener("input", function () {
    weightAlignment = 0.005 * parseInt(weightAlignmentSlider.value);
    weightAlignmentValue.textContent = Math.floor(weightAlignment / 0.005);
  });

  var weightSeperationSlider = document.getElementById("weightSeperation");
  var weightSeperationValue = document.getElementById("weightSeperationValue");
  weightSeperationSlider.addEventListener("input", function () {
    weightSeperation = 0.005 * parseInt(weightSeperationSlider.value);
    weightSeperationValue.textContent = Math.floor(weightSeperation / 0.005);
  });

  var weightCurrDirSlider = document.getElementById("weightCurrDir");
  var weightCurrDirValue = document.getElementById("weightCurrDirValue");
  weightCurrDirSlider.addEventListener("input", function () {
    weightCurrDir = 0.005 * parseInt(weightCurrDirSlider.value);
    weightCurrDirValue.textContent = Math.floor(weightCurrDir / 0.005);
  });

  render();
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var mv = lookAt(
    vec3(0.0, 0.0, zView),
    vec3(0.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0)
  );
  mv = mult(mv, rotateX(spinX));
  mv = mult(mv, rotateY(spinY));

  DrawCube(mv);
  for (i = 0; i < N; i++) {
    DrawFish(mv, i);
  }
  requestAnimFrame(render);
}

function DrawFish(mv, i) {
  gl.uniform4fv(colorLoc, fishColor[i]);
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

  if (
    boxSize + 0.2 < Math.abs(fishX[i]) ||
    boxSize + 0.2 < Math.abs(fishY[i]) ||
    boxSize + 0.2 < Math.abs(fishZ[i])
  ) {
    fishX[i] = wrapAround(fishX[i]);
    fishY[i] = wrapAround(fishY[i]);
    fishZ[i] = wrapAround(fishZ[i]);
  }

  SetCohesion(i);
  SetAlignment(i);
  SetSeperation(i);

  dX[i] =
    dX[i] * weightCurrDir +
    avgXCoh * weightCohesion +
    avgXAli * weightAlignment +
    avgXSep * weightSeperation;
  dY[i] =
    dY[i] * weightCurrDir +
    avgYCoh * weightCohesion +
    avgYAli * weightAlignment +
    avgYSep * weightSeperation;
  dZ[i] =
    dZ[i] * weightCurrDir +
    avgZCoh * weightCohesion +
    avgZAli * weightAlignment +
    avgZSep * weightSeperation;

  vecLength = GetLength(dX[i], dY[i], dZ[i]);

  dX[i] = (dX[i] / vecLength) * fishSpeed[i] * speedToggle;
  dY[i] = (dY[i] / vecLength) * fishSpeed[i] * speedToggle;
  dZ[i] = (dZ[i] / vecLength) * fishSpeed[i] * speedToggle;

  fishX_new[i] = fishX[i] + dX[i];
  fishY_new[i] = fishY[i] + dY[i];
  fishZ_new[i] = fishZ[i] + dZ[i];

  GetAngles(i);

  mv = mult(mv, translate(fishX_new[i], fishY_new[i], fishZ_new[i]));
  mv = mult(mv, rotateY((-rotationY * 180) / Math.PI));
  mv = mult(mv, rotateZ((rotationZ * 180) / Math.PI));

  fishX[i] = fishX_new[i];
  fishY[i] = fishY_new[i];
  fishZ[i] = fishZ_new[i];

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays(gl.TRIANGLES, 0, NumBody);

  rotTail[i] += incTail[i];

  if (rotTail[i] > 35.0 || rotTail[i] < -35.0) incTail[i] *= -1;

  mv = mult(mv, translate(-0.5, 0.0, 0.0));
  mv = mult(mv, rotateY(rotTail[i]));
  mv = mult(mv, translate(0.5, 0.0, 0.0));

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays(gl.TRIANGLES, NumBody, NumTail);

}

function DrawCube(mv) {
  gl.uniform4fv(colorLoc, vec4(0.0, 0.0, 0.0, 1.0));
  gl.bindBuffer(gl.ARRAY_BUFFER, vBoxBuffer);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays(gl.LINE_STRIP, 0, 16);
}

function CreateArray(size, value) {
  var array = new Array(size);
  for (i = 0; i < size; i++) {
    array[i] = value * Math.random();
  }
  return array;
}

function CreateArrayAddition(size, value, addition) {
  var array = new Array(size);
  for (i = 0; i < size; i++) {
    array[i] = value * Math.random() + addition;
  }
  return array;
}

function CreateArrayColor(size, value) {
  var array = new Array(size);
  for (i = 0; i < size; i++) {
    array[i] = vec4(
      (value * Math.random()) / value,
      (value * Math.random()) / value,
      (value * Math.random()) / value,
      1
    );
  }
  return array;
}

function SetCohesion(fish) {
  fishCounter = 0;
  avgX = 0;
  avgY = 0;
  avgZ = 0;

  avgXCoh = 0;
  avgYCoh = 0;
  avgZCoh = 0;

  for (j = 0; j < N; j++) {
    if (j == fish) {
      continue;
    }
    if (
      Math.sqrt(
        Math.pow(fishX[fish] - fishX[j], 2) +
          Math.pow(fishY[fish] - fishY[j], 2) +
          Math.pow(fishZ[fish] - fishZ[j], 2)
      ) < checkRadius
    ) {
      fishCounter++;
      avgX += fishX[j];
      avgY += fishY[j];
      avgZ += fishZ[j];
    }
  }
  if (fishCounter == 0) {
    avgXCoh = dX[fish];
    avgYCoh = dY[fish];
    avgZCoh = dZ[fish];
    return;
  }
  avgX /= fishCounter;
  avgY /= fishCounter;
  avgZ /= fishCounter;

  avgX -= fishX[fish];
  avgY -= fishY[fish];
  avgZ -= fishZ[fish];

  vecLength = GetLength(avgX, avgY, avgZ);

  avgXCoh = avgX / vecLength;
  avgYCoh = avgY / vecLength;
  avgZCoh = avgZ / vecLength;
}

function SetAlignment(fish) {
  fishCounter = 0;
  avgX = 0;
  avgY = 0;
  avgZ = 0;

  for (j = 0; j < N; j++) {
    if (j == fish) {
      continue;
    }
    if (
      Math.sqrt(
        Math.pow(fishX[fish] - fishX[j], 2) +
          Math.pow(fishY[fish] - fishY[j], 2) +
          Math.pow(fishZ[fish] - fishZ[j], 2)
      ) < checkRadius
    ) {
      fishCounter++;
      avgX += dX[j];
      avgY += dY[j];
      avgZ += dZ[j];
    }
  }
  if (fishCounter == 0) {
    avgX = dX[fish];
    avgY = dY[fish];
    avgZ = dZ[fish];
  } else {
    avgX /= fishCounter;
    avgY /= fishCounter;
    avgZ /= fishCounter;
  }

  vecLength = GetLength(avgX, avgY, avgZ);

  avgXAli = avgX / vecLength;
  avgYAli = avgY / vecLength;
  avgZAli = avgZ / vecLength;
}

function SetSeperation(fish) {
  fishCounter = 0;
  avgX = 0;
  avgY = 0;
  avgZ = 0;

  for (j = 0; j < N; j++) {
    if (j === fish) {
      continue;
    }
    vecLength = GetLength(
      fishX[fish] - fishX[j],
      fishY[fish] - fishY[j],
      fishZ[fish] - fishZ[j]
    );
    if (vecLength < checkRadius) {
      fishCounter++;
      avgX += fishX[fish] - fishX[j];
      avgY += fishY[fish] - fishY[j];
      avgZ += fishZ[fish] - fishZ[j];
    }
  }
  if (fishCounter > 0) {
    vecLength = GetLength(avgX, avgY, avgZ);
    avgXSep = avgX / vecLength;
    avgYSep = avgY / vecLength;
    avgZSep = avgZ / vecLength;
  } else {
    avgXSep = 0;
    avgYSep = 0;
    avgZSep = 0;
  }
}

function wrapAround(coord) {
  if (coord > boxSize) {
    return -boxSize + 0.1;
  } else if (coord < -boxSize) {
    return boxSize - 0.1;
  }
  return coord;
}

function GetAngles(i) {
  vecLength = GetLength(dX[i], dY[i], dZ[i]);

  rotationZ = Math.asin(dY[i] / vecLength);

  if (dX[i] < 0) {
    rotationY = -Math.asin(dZ[i] / (Math.cos(rotationZ) * vecLength)) + Math.PI;
  } else {
    rotationY = Math.asin(dZ[i] / (Math.cos(rotationZ) * vecLength));
  }
}

function InitializeNext() {
  for (j = 0; j < N; j++) {
    fishX_new[j] = fishX[j] + dX[j];
    fishY_new[j] = fishY[j] + dY[j];
    fishZ_new[j] = fishZ[j] + dZ[j];
  }
}

function InitializeD() {
  for (j = 0; j < N; j++) {
    vecLength = GetLength(dX[j], dY[j], dZ[j]);
    dX[j] /= vecLength;
    dY[j] /= vecLength;
    dZ[j] /= vecLength;
  }
}

function GetLength(x, y, z) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
}
