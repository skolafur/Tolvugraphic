var canvas;
var gl;

var N = 1000;

var numVertices = 9;
var NumBody = 6;
var NumTail = 3;

var boxSize = 25.0;

var checkRadius = 2.0;

var vBuffer;
var vBoxBuffer;
var vPosition;

var fishX = new Array(N);
fishX = CreateArrayAddition(N, 2 * boxSize, -boxSize);
var fishY = new Array(N);
fishY = CreateArrayAddition(N, 2 * boxSize, -boxSize);
var fishZ = new Array(N);
fishZ = CreateArrayAddition(N, 2 * boxSize, -boxSize);

var speed = new Array(N);
speed = CreateArrayAddition(N, 0.1, 0.02);

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var rotTail;
rotTail = CreateArray(N, 0);
var incTail = 2.0;

var rotFishY;
rotFishY = CreateArray(N, 2 * Math.PI);
var incFishY = 0.2;

var rotFishZ;
rotFishZ = CreateArray(N, 2 * Math.PI);
var incFishZ = 0.2;

var zView = 2.0;

var superRotY;
var superRotZ;

var weightCohesion = 33;
var weightAlignment = 33;
var weightSeperation = 33;

var fishCounter;
var avgRotY;
var avgRotZ;
var avgX;
var avgY;
var avgZ;
var vecLength;

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

  window.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 37: // vinstri ör
        for (i = 0; i < N; i++) {
          rotFishY[i] -= incFishY;
        }
        break;
      case 38: // upp ör
        for (i = 0; i < N; i++) {
          rotFishZ[i] += incFishZ;
        }
        break;
      case 39: // hægri ör
        for (i = 0; i < N; i++) {
          rotFishY[i] += incFishY;
        }
        break;
      case 40: // niður ör
        for (i = 0; i < N; i++) {
          rotFishZ[i] -= incFishZ;
        }
        break;
    }
  });

  window.addEventListener("mousewheel", function (e) {
    if (e.wheelDelta > 0.0) {
      zView += 0.2;
    } else {
      zView -= 0.2;
    }
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
  gl.uniform4fv(colorLoc, vec4(0.2, 0.6, 0.9, 1.0));
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

  fishX[i] += Math.cos(rotFishY[i]) * Math.cos(rotFishZ[i]) * speed[i];
  fishY[i] += Math.sin(rotFishZ[i]) * speed[i];
  fishZ[i] += Math.sin(rotFishY[i]) * Math.cos(rotFishZ[i]) * speed[i];

  SetCohesion(i);
  SetAlignment(i);
  SetSeperation(i);

  rotFishY[i] = superRotY / 3;
  rotFishZ[i] = superRotZ / 3;

  mv = mult(mv, translate(fishX[i], fishY[i], fishZ[i]));
  mv = mult(mv, rotateY((-rotFishY[i] * 180) / Math.PI));
  mv = mult(mv, rotateZ((rotFishZ[i] * 180) / Math.PI));

  rotTail[i] += incTail;

  if (rotTail[i] > 35.0 || rotTail[i] < -35.0) incTail *= -1;

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays(gl.TRIANGLES, 0, NumBody);

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

function SetAlignment(fish) {

  fishCounter = 0;
  avgRotY = 0;
  avgRotZ = 0;

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
      avgRotY += rotFishY[j];
      avgRotZ += rotFishZ[j];
    }
  }
  if (fishCounter == 0) {
    avgRotY = rotFishY[fish];
    avgRotZ = rotFishZ[fish];
  } else {
    avgRotY = avgRotY / fishCounter;
    avgRotZ = avgRotZ / fishCounter;
  }
  if (Math.abs(rotFishY[fish] - avgRotY) < (7 * Math.PI) / 8) {
    superRotY += avgRotY * weightAlignment  / (weightAlignment + weightCohesion + weightSeperation);
  }
  if (Math.abs(rotFishZ[fish] - avgRotZ) < (7 * Math.PI) / 8) {
    superRotZ += avgRotZ * weightAlignment  / (weightAlignment + weightCohesion + weightSeperation);
  }
}

function SetCohesion(fish) {

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
      avgX += fishX[j];
      avgY += fishY[j];
      avgZ += fishZ[j];
    }
  }

  if (fishCounter == 0) {return;}

  avgX = avgX / fishCounter;
  avgY = avgY / fishCounter;
  avgZ = avgZ / fishCounter;

  avgX = avgX - fishX[fish];
  avgY = avgY - fishY[fish];
  avgZ = avgZ - fishZ[fish];

  if (avgX >= 0) {
    if (avgY >= 0) {
      if (avgZ >= 0) {
        superRotY = (Math.atan2(avgZ, avgX)) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ = (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
      }
      else {
        superRotY = (Math.atan2(avgZ, avgX) + 2 * (Math.PI / 2 - Math.atan2(avgZ, avgX))) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ = (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
      }
    }
    else {
      if (avgZ >= 0) {
        superRotY = (Math.atan2(avgZ, avgX)) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ = (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY) + 2 * (Math.PI / 2 - (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)))) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
      }
      else {
        superRotY = (Math.atan2(avgZ, avgX) + 2 * (Math.PI / 2 - Math.atan2(avgZ, avgX))) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ = (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY) + 2 * (Math.PI / 2 - (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)))) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
      }
    } 
  }
  else {
    if (avgY >= 0) {
      if (avgZ >= 0) {
        superRotY = (2 * Math.PI - Math.atan2(avgZ, avgX)) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ = (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
      }
      else {
        superRotY = (2 * Math.PI - (Math.atan2(avgZ, avgX) + 2 * (Math.PI / 2 - Math.atan2(avgZ, avgX)))) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ = (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
      }
    }
    else {
      if (avgZ >= 0) {
        superRotY = (2 * Math.PI - Math.atan2(avgZ, avgX)) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ = (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY) + 2 * (Math.PI / 2 - (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)))) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
      }
      else {
        superRotY = (2 * Math.PI - (Math.atan2(avgZ, avgX) + 2 * (Math.PI / 2 - Math.atan2(avgZ, avgX)))) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ = (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY) + 2 * (Math.PI / 2 - (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)))) * weightCohesion / (weightAlignment + weightCohesion + weightSeperation);
      }
    } 
  }
}

function SetSeperation(fish) {

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
      vecLength = Math.sqrt(
        Math.pow(fishX[fish] - fishX[j], 2) +
          Math.pow(fishY[fish] - fishY[j], 2) +
          Math.pow(fishZ[fish] - fishZ[j], 2)
      )
      avgX += (checkRadius - vecLength) * (fishX[fish] - fishX[j]);
      avgY += (checkRadius - vecLength) * (fishY[fish] - fishY[j]);
      avgZ += (checkRadius - vecLength) * (fishZ[fish] - fishZ[j]);
    }
  }

  if (fishCounter == 0) {return;}

  avgX = avgX / fishCounter;
  avgY = avgY / fishCounter;
  avgZ = avgZ / fishCounter;

  avgX = avgX - fishX[fish];
  avgY = avgY - fishY[fish];
  avgZ = avgZ - fishZ[fish];

  if (avgX >= 0) {
    if (avgY >= 0) {
      if (avgZ >= 0) {
        superRotY += (Math.atan2(avgZ, avgX)) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ += (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
      }
      else {
        superRotY += (Math.atan2(avgZ, avgX) + 2 * (Math.PI / 2 - Math.atan2(avgZ, avgX))) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ + (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
      }
    }
    else {
      if (avgZ >= 0) {
        superRotY += (Math.atan2(avgZ, avgX)) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ + (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY) + 2 * (Math.PI / 2 - (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)))) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
      }
      else {
        superRotY += (Math.atan2(avgZ, avgX) + 2 * (Math.PI / 2 - Math.atan2(avgZ, avgX))) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ += (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY) + 2 * (Math.PI / 2 - (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)))) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
      }
    } 
  }
  else {
    if (avgY >= 0) {
      if (avgZ >= 0) {
        superRotY += (2 * Math.PI - Math.atan2(avgZ, avgX)) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ += (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
      }
      else {
        superRotY += (2 * Math.PI - (Math.atan2(avgZ, avgX) + 2 * (Math.PI / 2 - Math.atan2(avgZ, avgX)))) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ += (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
      }
    }
    else {
      if (avgZ >= 0) {
        superRotY += (2 * Math.PI - Math.atan2(avgZ, avgX)) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ += (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY) + 2 * (Math.PI / 2 - (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)))) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
      }
      else {
        superRotY += (2 * Math.PI - (Math.atan2(avgZ, avgX) + 2 * (Math.PI / 2 - Math.atan2(avgZ, avgX)))) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
        superRotZ += (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY) + 2 * (Math.PI / 2 - (Math.atan2(Math.sqrt(Math.pow(avgZ, 2) + Math.pow(avgX, 2)), avgY)))) * weightSeperation  / (weightAlignment + weightCohesion + weightSeperation);
      }
    } 
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
