"use strict";

var shadedCube = function() {

var canvas;
var gl;

var numPositions = 12;

var positionsArray = [];
var normalsArray = [];

var vertices = [
    vec4(0.0,  0.0, 1.0, 1.0),
    vec4(1.0,  0.0,  0.0, 1.0),
    vec4(0.0,  1.0,  0.0, 1.0),
    vec4(1.0,  1.0,  1.0, 1.0),
 ];
 
 var colorsArray = []; // Array untuk warna
 
 var vertexColors = [
    vec4(1.0, 0.0, 0.0, 1.0),  // Merah
    vec4(0.0, 1.0, 0.0, 1.0),  // Hijau
    vec4(0.0, 0.0, 1.0, 1.0),  // Biru
    vec4(1.0, 1.0, 0.0, 1.0),  // Kuning
    vec4(1.0, 0.0, 1.0, 1.0),  // Magenta
    vec4(0.0, 1.0, 1.0, 1.0)   // Cyan
 ];
    
// Light Properties
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 20.0;


var modelViewMatrix, projectionMatrix;
var viewerPos;
var program;

//Rotation property
var axis= 0;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var theta = vec3(0, 0, 0);

var thetaLoc;

var flag = false;

//Perspective property
var fov = 60;
var near = 0.1;
var far = 100.0;

var radius = 10.0;
var thetas = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;
var eye;

//
var velocity = vec3(0.0, 0.0, 0.0);   // Initial velocity
var acceleration = vec3(0.0, 0.0, 0.0)
var force = vec3(0.0, 0.0, 0.0); // Initial force
var position = vec3(0.0, 0.0, 0.0);   // Initial position
var bounds = vec3(5.0, 5.0, 5.0);  // X, Y, Z bounds for the cube's movement
var mass = 1.0;

var time = 0;
var curr = 0;

init();

time = 0;

function triangle(a, b, c, colorIndex) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
 
    // Tambahkan posisi dan normal untuk setiap vertex
    positionsArray.push(vertices[a]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);  // Tambahkan warna
 
    positionsArray.push(vertices[b]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);
 
    positionsArray.push(vertices[c]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[colorIndex]);
 }
 
 function colorTetrahedron()
 {
     triangle(0,1,2, 0);
     triangle(0,2,3, 1);
     triangle(1,2,3, 2);
     triangle(0,1,3, 3);
 }




function updateLightPosition() {
   var lightX = document.getElementById("lightX").value;
   var lightY = document.getElementById("lightY").value;
   var lightZ = document.getElementById("lightZ").value;
   var lightPosition = vec4(lightX, lightY, lightZ, 1.0);

   gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), lightPosition);
}


function updateLightColors() {
   var ambientR = document.getElementById("ambientR").value;
   var ambientG = document.getElementById("ambientG").value;
   var ambientB = document.getElementById("ambientB").value;
   var ambientProduct = vec4(ambientR, ambientG, ambientB, 1.0);

   var diffuseR = document.getElementById("diffuseR").value;
   var diffuseG = document.getElementById("diffuseG").value;
   var diffuseB = document.getElementById("diffuseB").value;
   var diffuseProduct = vec4(diffuseR, diffuseG, diffuseB, 1.0);

   var specularR = document.getElementById("specularR").value;
   var specularG = document.getElementById("specularG").value;
   var specularB = document.getElementById("specularB").value;
   var specularProduct = vec4(specularR, specularG, specularB, 1.0);

   gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), ambientProduct);
   gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), diffuseProduct);
   gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), specularProduct);
}

function updatePerspective() {
   fov = parseFloat(document.getElementById("fov").value);
   near = parseFloat(document.getElementById("near").value);
   far = parseFloat(document.getElementById("far").value);

   projectionMatrix = perspective(fov, canvas.width / canvas.height, near, far);
   gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, flatten(projectionMatrix));
}

function updateVelocity() {
   velocity[0] = parseFloat(document.getElementById("velocityX").value);
   velocity[1] = parseFloat(document.getElementById("velocityY").value);
   velocity[2] = parseFloat(document.getElementById("velocityZ").value);
}

function updateforce() {
   force[0] = parseFloat(document.getElementById("forceX").value);
   force[1] = parseFloat(document.getElementById("forceY").value);
   force[2] = parseFloat(document.getElementById("forceZ").value);
}

function updateBound() {
    bounds[0] = document.getElementById("bounds").value;
    bounds[1] = document.getElementById("bounds").value;
    bounds[2] = document.getElementById("bounds").value;
}

function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available");


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
   
    colorTetrahedron();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation(program, "theta");

    viewerPos = vec3(0.0, 0.0, -40.0);

   //projectionMatrix = perspective(60.0,canvas.width/canvas.height, 0.3, 40.0)
   //  projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);

   updatePerspective();

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    document.getElementById("ambientR").oninput = updateLightColors;
    document.getElementById("ambientG").oninput = updateLightColors;
    document.getElementById("ambientB").oninput = updateLightColors;
    
    document.getElementById("diffuseR").oninput = updateLightColors;
    document.getElementById("diffuseG").oninput = updateLightColors;
    document.getElementById("diffuseB").oninput = updateLightColors;

    document.getElementById("specularR").oninput = updateLightColors;
    document.getElementById("specularG").oninput = updateLightColors;
    document.getElementById("specularB").oninput = updateLightColors;

    document.getElementById("lightX").oninput = updateLightPosition;
    document.getElementById("lightY").oninput = updateLightPosition;
    document.getElementById("lightZ").oninput = updateLightPosition;

    document.getElementById("fov").oninput = updatePerspective;
   document.getElementById("near").oninput = updatePerspective;
   document.getElementById("far").oninput = updatePerspective;
   document.getElementById("radius").oninput = function(event) {
      radius = event.target.value;
  };
  document.getElementById("theta").oninput = function(event) {
      thetas += (event.target.value * Math.PI/180.0);
   };
   document.getElementById("phi").oninput = function(event) {
      phi += (event.target.value * Math.PI/180.0);
  };

    document.getElementById("mass").oninput = function(event) {
        mass = event.target.value;
    };
   document.getElementById("velocityX").oninput = updateVelocity;
   document.getElementById("velocityY").oninput = updateVelocity;
   document.getElementById("velocityZ").oninput = updateVelocity;
   
   document.getElementById("forceX").oninput = updateforce;
   document.getElementById("forceY").oninput = updateforce;
   document.getElementById("forceZ").oninput = updateforce;

   document.getElementById("bounds").oninput = updateBound;

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
       ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
       diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
       specularProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
       lightPosition );

    gl.uniform1f(gl.getUniformLocation(program,
       "uShininess"), materialShininess);

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),
       false, flatten(projectionMatrix));
    render();
    
}


function render(){

   time += 1;

   const deltaTime = time - curr;
   curr = time;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 2.0;

    for (let i = 0; i < 3; i++) {
        if (position[i] > bounds[i] || position[i] < -bounds[i]) {
           // If the position exceeds the bounds, reverse the velocity (bounce)
           velocity[i] *= -1;
           
           // Optionally, you can also clamp the position to the boundary:
           position[i] = Math.max(Math.min(position[i], bounds[i]), -bounds[i]);
        }
     }

    acceleration[0] = force[0]/mass;
    acceleration[1] = force[1]/mass;
    acceleration[2] = force[2]/mass;

    for (let k = 0; k < 3; k++) {     
        if (velocity[k] < -1) {
            acceleration[k] *= -1;
        }
    
    }
    velocity[0] += acceleration[0] * (deltaTime/100);
    velocity[1] += acceleration[1] * (deltaTime/100);
    velocity[2] += acceleration[2] * (deltaTime/100);

    
    position[0] += velocity[0] * (deltaTime/100);
    position[1] += velocity[1] * (deltaTime/100);
    position[2] += velocity[2] * (deltaTime/100);


    eye = vec3(radius*Math.sin(thetas)*Math.cos(phi),
    radius*Math.sin(thetas)*Math.sin(phi), radius*Math.cos(thetas));

    modelViewMatrix = lookAt(eye, vec3(0, 0, 0), vec3(0, 1, 0));  // Look at the origin
    modelViewMatrix = mult(modelViewMatrix, translate(position[0], position[1], position[2]));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));

    //console.log(modelView);

    gl.uniformMatrix4fv(gl.getUniformLocation(program,
            "uModelViewMatrix"), false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);


    requestAnimationFrame(render);
}

}

shadedCube();
