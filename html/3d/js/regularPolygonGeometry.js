/***********
 * regularPolygonGeometry.js
 * An n-sided polygon of specified radius with interpolated colors
 * B.Volegov with some ideas borrowed from triangle016.js by M. Laszlo
 * January 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();


function createScene() {
    // get verices
    var geom = regularPolygonGeometry(8, 2, 0xff0000, 0x0000ff);
    // material
    var mat = new THREE.MeshBasicMaterial( {vertexColors: THREE.VertexColors, side: THREE.DoubleSide })
    //  mesh
    var mesh = new THREE.Mesh(geom, mat);

    scene.add(mesh);
}

function regularPolygonGeometry(n, radius, innerColor, outerColor) {	
	var geom = new THREE.Geometry();

	// adds a vertex which represents a center of the polygon
	geom.vertices.push(new THREE.Vector3(0, 0, 0.1));

	// pushes all the n vertices of the polygon into geom.vertices array
	for(var i = 0; i < n; i++) {
		geom.vertices.push(new THREE.Vector3(radius * Math.cos(2 * Math.PI * i / n), radius * Math.sin(2 * Math.PI * i / n), 0.1));
	}

	// creates faces and adds them to geom.faces array. Each face is a triangle with one vertex in the center of polygon 
	// and two others are adjucent to each other polygon vertices (i.e. [center, 1, 2], [centrer, 2, 3], ..., [center, n, 1])
	for(var j = 1; j <= n; j++) {
		// build faces with vertices at indeces: [0, j, j+1] for exception the last one which is [0, j, 1]
		var face = new THREE.Face3(0, j, (j+1) <= n ? (j+1) : 1);
		face.vertexColors.push(new THREE.Color(innerColor));
		face.vertexColors.push(new THREE.Color(outerColor));
		face.vertexColors.push(new THREE.Color(outerColor));		
		geom.faces.push(face);
	}

	return geom;
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

