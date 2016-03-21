/***********
 * ziggurat.js
 * B. Volegov
 * February 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();
var gui, controls;
var currentZiggurat;

function Controls() {
    this.n = 30;
    this.zheight = 0.2;
    this.sf = 0.9;

    this.Go = function() {
        updateObject();
    }
}

function createScene() {
    var light = new THREE.PointLight(0xFFFFFF, 1, 1000 );
    light.position.set(0, 0, 10);
    var ambientLight = new THREE.AmbientLight(0x222222);

    scene.add(light);
    scene.add(ambientLight);
}

function getZigguratBoxes(n, zheight, sf) {
    if (n < 1) {
        return [];
    }

    //base case of recursion
    if(n==1) {
        var newBoxGeom = new THREE.CubeGeometry(2, zheight, 2);
        return [newBoxGeom];
    }

    //general case of recursion
    var boxesBelow = getZigguratBoxes(n-1, zheight, sf);

    var boxRightBelow = boxesBelow[boxesBelow.length - 1];
    var newBoxGeom = new THREE.CubeGeometry(boxRightBelow.width * sf, zheight, boxRightBelow.depth * sf);

    boxesBelow.push(newBoxGeom);
    return boxesBelow;
}

function createZiggurat(n, zheight, sf) {
    var ziggurat = new THREE.Object3D();

    var zigguratBoxes = getZigguratBoxes(n, zheight, sf);

    for(var i = 0; i < zigguratBoxes.length; i++) {
        var boxGeom = zigguratBoxes[i];

        var color = new THREE.Color(0, 0, 0);
        color.setHSL(1.0 * i / n, 1.0, 0.5);
        var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 1, color: color, shading: THREE.FlatShading, side: THREE.DoubleSide});
        var boxMesh = new THREE.Mesh(boxGeom, material); 

        boxMesh.position.set(0, -(zheight * n) / 2 + i * zheight, 0); 
        ziggurat.add(boxMesh);  
    }

    return ziggurat;
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
	camera.position.set(8, 4, 8);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

    initGui();
    controls.Go();
}

function updateObject() {
    var geom;     
    if (currentZiggurat)
        scene.remove(currentZiggurat);

    currentZiggurat = createZiggurat(controls.n, controls.zheight, controls.sf);

    if (currentZiggurat) {
        scene.add(currentZiggurat);
    }
}

function initGui() {
    gui = new dat.GUI({width: 400});
    controls = new Controls();

    var n = gui.add(controls, 'n', 0, 100).name('Number of steps').step(1);
    n.onChange(function(value) {controls.n = value;});  

    var zheight = gui.add(controls, 'zheight', 0, 5).name('Step height').step(0.1);
    zheight.onChange(function(value) {controls.zheight = value;});  

    var sf = gui.add(controls, 'sf', 0, 1).name('Scale factor').step(0.1);
    sf.onChange(function(value) {controls.sf = value;}); 

    gui.add(controls, 'Go');
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
