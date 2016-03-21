/***********
 * bluesquare.js
 * A simple blue square
 * B. Volegov with some ideas borrowed from triangle015.js by M. Laszlo
 * January 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();


function createScene() {
    // triangle geometry
    var geom = new THREE.Geometry();
    geom.vertices.push(new THREE.Vector3(0, 0, 0.1));
    geom.vertices.push(new THREE.Vector3(4, 0, 0.1));
    geom.vertices.push(new THREE.Vector3(0, 4, 0.1));
    geom.vertices.push(new THREE.Vector3(4, 4, 0.1));

    var face1 = new THREE.Face3(0, 1, 2);
    var face2 = new THREE.Face3(2, 3, 1);

    geom.faces.push(face1);
    geom.faces.push(face2);    

    // material
    var mat = new THREE.MeshBasicMaterial( {color: 0x0000FF, side: THREE.DoubleSide })
    //  mesh
    var mesh = new THREE.Mesh(geom, mat);

    scene.add(mesh);
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
	renderer.setClearColor(0xFFFFFF, 1.0);

	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
	camera.position.set(0, 0, 40);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
}


function showGrids() {
    // Grid step size is 1; axes meet at (0,0,0)
//	Coordinates.drawGrid({size:100,scale:1,orientation:"z"});
    Coordinates.drawAllAxes({axisLength:11, axisRadius:0.05});
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
    showGrids();
	createScene();
	addToDOM();
    render();
	animate();
} catch(e) {
    var errorMsg = "Error: " + e;
    document.getElementById("msg").innerHTML = errorMsg;
}
