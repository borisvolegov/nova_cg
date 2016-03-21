/***********
 * torusGeometry.js
 * Exploration of the effect of parameters on Torus geometry
 * B. Volegov
 * February 2014
 ***********/

var camera, scene, renderer;
var cameraControls;
var gui, controls;
var currentMat, currentMesh;
var clock = new THREE.Clock();


function Controls() {
    this.radius = 10;
    this.tube = 3;
    this.radialSegments = 24;
    this.tubularSegments = 36;
    this.arc = 2;
    this.color = "#0000ff";
    this.isWireframe = false;

    this.Go = function() {


        updateObject();
    }
}

function createScene() {
    var light = new THREE.PointLight(0xFFFFFF, 1.0, 1000 );
    light.position.set(0, 0, 40);
    var light2 = new THREE.PointLight(0xFFFFFF, 1.0, 1000 );
    light2.position.set(0, 0, -40);
    var ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(light);
    scene.add(light2);
    scene.add(ambientLight);
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
    camera.position.set(0, 0, 40);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

    initGui();
    controls.Go();
}

function updateObject() {
    var geom;     
    if (currentMesh)
        scene.remove(currentMesh);

    geom = new THREE.TorusGeometry(controls.radius, controls.tube, controls.radialSegments, controls.tubularSegments, controls.arc * Math.PI);

    var controlsColor = new THREE.Color(controls.color);
    currentMat = new THREE.MeshLambertMaterial({ambient: 0x222222, color: controlsColor, shading: THREE.FlatShading}); 

    currentMat.wireframe = controls.isWireframe;

    if (geom) {
        currentMesh = new THREE.Mesh(geom, currentMat);
        scene.add(currentMesh);
    }
}

function initGui() {
    gui = new dat.GUI({width: 400});
    controls = new Controls();

    var radius = gui.add(controls, 'radius', 0, 50).name('Major radius').step(1);
    radius.onChange(function(value) {controls.radius = value;});  

    var tube = gui.add(controls, 'tube', 0, 50).name('Minor radius').step(1);
    tube.onChange(function(value) {controls.tube = value;});  

    var radialSegments = gui.add(controls, 'radialSegments', 1, 100).name('Num. of radial segments').step(1);
    radialSegments.onChange(function(value) {console.log(value + ';' + controls.radialSegments); controls.radialSegments = value;}); 

    var tubularSegments = gui.add(controls, 'tubularSegments', 3, 100).name('Num. of tubular segments').step(1);
    tubularSegments.onChange(function(value) {controls.tubularSegments = parseInt(value);});

    var arc = gui.add(controls, 'arc', 0, 2).name('Arc in PI radians').step(0.1);
    arc.onChange(function(value) {controls.arc = value;});

    var color = gui.addColor(controls, 'color').name('Color');
    color.onChange(function(value) {controls.color = value;});

    var isWireframe = gui.add(controls, 'isWireframe').name('Is wireframe?');
    isWireframe.onChange(function(value) {controls.isWireframe = value;});

    gui.add(controls, 'Go');
}


function showGrids() {
    // Grid step size is 1; axes meet at (0,0,0)
    // Coordinates.drawGrid({size:100,scale:1,orientation:"z"});
    // Coordinates.drawAllAxes({axisLength:11, axisRadius:0.05});
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
// showGrids()/**/;
    createScene();
    addToDOM();
//    render();
    animate();
