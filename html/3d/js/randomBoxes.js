/***********
 * ziggurat.js
 * B. Volegov
 * February 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();
var gui, controls;

function createScene() {
    randomBoxes(100, 5, 20, 5, 60);

    var light1 = new THREE.PointLight(0xFFFFFF, 1, 1000 );
    light1.position.set(100, 100, 150);

    var light2 = new THREE.PointLight(0xFFFFFF, 1, 1000 );
    light2.position.set(-100, -100, 150);    


    var ambientLight = new THREE.AmbientLight(0x222222);

    scene.add(light1);
    scene.add(light2);    
    scene.add(ambientLight);
}

function randomBoxes(nbrBoxes, minSide, maxSide, minHeight, maxHeight) {
    var planeColor = new THREE.Color("gray");
    var planeMesh = createBoxMesh(200, 200, 0.1, planeColor, 1)
    planeMesh.position.set(0, 0, 0);
    scene.add(planeMesh);

    for(var i = 0; i < nbrBoxes; i++) {
        var xLength = minSide + (maxSide - minSide) * Math.random();
        var yLength = minSide + (maxSide - minSide) * Math.random();
        var zHeight = minHeight + (maxHeight - minHeight) * Math.random();

        var hue = Math.random();
        var saturation = 0.8 + (0.95 - 0.8) * Math.random();
        var lightness = 0.3 + (0.7 - 0.3) * Math.random();

        var color = new THREE.Color();
        color.setHSL(hue, saturation, lightness);

        var boxMesh = createBoxMesh(xLength, yLength, zHeight, color, 0.8);

        var xPosition = (200 - xLength) * Math.random() - (200 - xLength)/2;
        var yPosition = (200 - yLength) * Math.random() - (200 - yLength)/2;

        boxMesh.position.set(xPosition, yPosition, zHeight/2);

        scene.add(boxMesh)
    }
}

function createBoxMesh(xLength, yLength, zHeight, color, opacity) {
    var boxGeometry = new THREE.BoxGeometry(xLength, yLength, zHeight);

    var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.8, color: color, shading: THREE.FlatShading, side: THREE.DoubleSide});
    var boxMesh = new THREE.Mesh(boxGeometry, material);

    return boxMesh;
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

	renderer = new THREE.WebGLRenderer({antialias : true});
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(0x000000, 1.0);

	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
	camera.position.set(200, 200, 200);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
}

function showGrids() {
    // Grid step size is 1; axes meet at (0,0,0)
    // Coordinates.drawGrid({size:100,scale:1,orientation:"z"});
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



init();
createScene();
// showGrids()/**/;
addToDOM();
render();
animate();
