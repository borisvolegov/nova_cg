/***********
 * cubeMatrix3D.js
 * 3-Dimensional matrix of cubes
 * B. Volegov (based on )
 * February 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();
var mat;

// m x n x p matrix of boxes centered in the xyz-space
function createScene(m, n, p, offset) {
    offset = offset !== undefined ? offset : 2.0;
    var geom = new THREE.CubeGeometry(1, 1, 1);
    mat = new THREE.MeshLambertMaterial({transparent: true});
    var xMin = -offset * ((m-1) / 2.0);
    var yMin = -offset * ((n-1) / 2.0);
    var zMin = -offset * ((n-1) / 2.0);    
    for (i = 0, x = xMin; i < m; i++, x += offset) {
        for (j = 0, y = yMin; j < n; j++, y += offset) {
            for (k = 0, z = zMin; k < p; k++, z+= offset) {
                var box = new THREE.Mesh(geom, mat)
                box.position.x = x;
                box.position.y = y;
                box.position.z = z;
                scene.add(box);
            }
        }
    }

    // light
    var light = new THREE.PointLight(0xFFFFFF, 1, 1000 );
    light.position.set(0, 0, 10);
    var ambientLight = new THREE.AmbientLight(0x222222);

    scene.add(light);
    scene.add(ambientLight);
}

var controls = new function() {
    this.color = '#ff0000';
    this.opacity = 0.8;
}


function animate() {
	window.requestAnimationFrame(animate);
	render();
}


function render() {
    var delta = clock.getDelta();
    cameraControls.update(delta);
    mat.color = new THREE.Color(controls.color);
    mat.opacity = controls.opacity;
	renderer.render(scene, camera);
}


function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({antialias : true});
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(0x000000, 1.0);
	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
	camera.position.set(20, 20, 20);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

    var gui = new dat.GUI();
    gui.addColor(controls, 'color');
    gui.add(controls, 'opacity', 0.0, 1.0).step(0.1);
}


function showGrids() {
    // Grid step size is 1; axes meet at (0,0,0)
	Coordinates.drawGrid({size:100,scale:1,orientation:"z"});
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
	createScene(9, 9, 9);
// showGrids()/**/;
	addToDOM();
    render();
	animate();
} catch(e) {
    var errorMsg = "Error: " + e;
    document.getElementById("msg").innerHTML = errorMsg;
}
