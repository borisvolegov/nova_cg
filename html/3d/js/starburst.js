/***********
 * starburst.js
 * A simple triangle with orbit control
 * B. Volegov with some ideas borrowed from triangleStroke006.js by M. Laszlo
 * January 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();


function createScene() {
    var line = starburst(200, 0xff0000, 0x00ff00)
    scene.add(line);
}

function starburst(n, innerColor, outerColor) {
    var geom = new THREE.Geometry();

    // vertex to represent the center of every ray
    var center = new THREE.Vector3(0, 0, 0);

    var innerColor = new THREE.Color(innerColor);
    var outerColor = new THREE.Color(outerColor);

    // foreach ray:
    for(var i =0; i < n; i++) {
      	// gets coordinates of random point on the sphere with the center at 0,0,0 and radius 2
   		var pointOnSphere = getRandomSpherePoint(0, 0, 0, 2);  
   		  	
   		// push start and end points of the ray
   		geom.vertices.push(center);   
   		geom.vertices.push(new THREE.Vector3(pointOnSphere[0], pointOnSphere[1], pointOnSphere[2]));

   		// push colors for start and end points of the ray
   		geom.colors.push(innerColor);	
   		geom.colors.push(outerColor);    		
    }

    // line material
    var mat = new THREE.LineBasicMaterial({vertexColors: true, linewidth: 1});

    //  mesh
    return new THREE.Line(geom, mat, THREE.LinePieces);	
}

// routine to randomly generate coordinates of points on a sphere
function getRandomSpherePoint(x0,y0,z0,radius){
   var u = Math.random();
   var v = Math.random();
   var theta = 2 * Math.PI * u;
   var phi = Math.acos(2 * v - 1);
   var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
   var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
   var z = z0 + (radius * Math.cos(phi));
   return [x,y,z];
}


function animate() {
	window.requestAnimationFrame(animate);
	render();
}


function render() {
    var delta = clock.getDelta();
    cameraControls.update(delta);
	renderer.render(scene, camera);
}


function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({antialias : true, preserveDrawingBuffer: true});
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(0x000000, 1.0);

	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
	camera.position.set(0, 0, 10);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
}

function addToDOM() {
	var container = document.getElementById('container');
	var canvas = container.getElementsByTagName('canvas');
	if (canvas.length>0) {
		container.removeChild(canvas[0]);
	}
	container.appendChild( renderer.domElement );
}


try {
	init();
	createScene();
	addToDOM();
    render();
	animate();
} catch(e) {
    var errorMsg = "Error: " + e;
    document.getElementById("msg").innerHTML = errorMsg;
}
