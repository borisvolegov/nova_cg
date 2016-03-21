/***********
 * ruledCylinder.js
 * An n-sided ruled cylinder of specified height, radius and color
 * B. Volegov with some ideas borrowed from triangle016.js by M. Laszlo
 * January 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();


function createScene() {
    var line = ruledCylinder(10, 4, 2, 0xff0000)
    scene.add(line);
}

function ruledCylinder(n, height, radius, lineColor) {	
	var geom = new THREE.Geometry();

	// pushes all the n vertices of the polygon into geom.vertices array
	for(var i = 0; i < n; i++) {
		var next_i = (i+1) <= n ? (i+1) : 1;

		//vertices for top face edge
		geom.vertices.push(new THREE.Vector3(radius * Math.cos(2 * Math.PI * next_i / n), height/2, radius * Math.sin(2 * Math.PI * next_i / n)));
		geom.vertices.push(new THREE.Vector3(radius * Math.cos(2 * Math.PI * i / n), height/2, radius * Math.sin(2 * Math.PI * i / n)));

		//vertices for side edge
		geom.vertices.push(new THREE.Vector3(radius * Math.cos(2 * Math.PI * i / n), height/2, radius * Math.sin(2 * Math.PI * i / n)));
		geom.vertices.push(new THREE.Vector3(radius * Math.cos(2 * Math.PI * i / n), -height/2, radius * Math.sin(2 * Math.PI * i / n)));

		//vertices for bottom face edge
		geom.vertices.push(new THREE.Vector3(radius * Math.cos(2 * Math.PI * i / n), -height/2, radius * Math.sin(2 * Math.PI * i / n)));	
		geom.vertices.push(new THREE.Vector3(radius * Math.cos(2 * Math.PI * next_i / n), -height/2, radius * Math.sin(2 * Math.PI * next_i / n)));		
	}

    // line material
    var mat = new THREE.LineBasicMaterial({color: lineColor, linewidth: 1});

    //  mesh
    return new THREE.Line(geom, mat, THREE.LinePieces);	
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
	renderer.setClearColorHex(0x000000, 1.0);

	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
	camera.position.set(5, 10, 10);
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

