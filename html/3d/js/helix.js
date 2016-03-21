/***********
 * helix.js
 * B. Volegov
 * Renders helix of objects
 * February 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();
var gui, controls;
var currentHelix;

function Controls() {
    this.objectType = 'Sphere';
    this.n = 49;
    this.radius = 2;
    this.angle = 1/4;
    this.distance = 0.5;
    this.color = "#0000ff";

    this.Go = function() {
        updateObject();
    }
}

function createScene() {
    var light = new THREE.PointLight(0xFFFFFF, 1, 1000 );
    light.position.set(0, 0, controls.n * controls.distance + 10);
    var ambientLight = new THREE.AmbientLight(0x222222);

    scene.add(light);
    scene.add(ambientLight);
}

function createHelix(object,  n, radius, angle, dist) {
    var helix = new THREE.Object3D();

    for(var i = 0; i < n; i++) {
        var newObject = object.clone();

        var objectAngle = angle * Math.PI * i;

        var x = Math.cos(objectAngle) * radius;
        var y = Math.sin(objectAngle) * radius;
        var z = i * dist;

        newObject.position.set(x, y, z);

        helix.add(newObject);  
    }

    return helix;
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
    camera.position.set(20, 10, 45);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

    initGui();
    controls.Go();
}

function updateObject() {
    var geom;     
    if (currentHelix)
        scene.remove(currentHelix);

    var controlsColor = new THREE.Color(controls.color);
    var material = new THREE.MeshLambertMaterial({ambient: 0x222222, color: controlsColor, shading: THREE.FlatShading}); 

    switch (controls.objectType) {
        case 'Sphere': geom = new THREE.SphereGeometry(1, 12, 12);
                       break;
        case 'Torus' : geom = new THREE.TorusGeometry(1, 0.5, 24, 36);
                       break;
        case 'Octahedron' : geom = new THREE.OctahedronGeometry(1);
                       break;              
        case 'Icosahedron' : geom = new THREE.IcosahedronGeometry(1);
                       break;    
        case 'Cylinder' : geom = new THREE.CylinderGeometry(1, 1, 1, 16);
                       break;    
        case 'Knot' : geom = new THREE.TorusKnotGeometry(1, 0.5);
                       break;                                                                      
    }

    var mesh = new THREE.Mesh(geom, material);
    currentHelix = createHelix(mesh, controls.n, controls.radius, controls.angle, controls.distance);

    if (currentHelix) {
        scene.add(currentHelix);
    }
}

function initGui() {
    gui = new dat.GUI({width: 500});
    controls = new Controls();

    var objectTypes = ['Sphere', 'Torus', 'Octahedron', 'Icosahedron', 'Cylinder', 'Knot'];
    var typeItem = gui.add(controls, 'objectType', objectTypes);
    typeItem.onChange(function(value) {controls.objectType = value;});  

    var n = gui.add(controls, 'n', 0, 100).name('Number of objects').step(1);
    n.onChange(function(value) {controls.n = value;});  

    var radius = gui.add(controls, 'radius', 0, 10).name('Helix radius').step(0.1);
    radius.onChange(function(value) {controls.radius = value;});  

    var angle = gui.add(controls, 'angle', 0, 2).name('Rotation in PI radians').step(0.1);
    angle.onChange(function(value) {controls.angle = value;}); 

    var distance = gui.add(controls, 'distance', 0, 10).name('Distance from predecessor').step(0.1);
    distance.onChange(function(value) {controls.distance = value;});     

    var color = gui.addColor(controls, 'color').name('Color');
    color.onChange(function(value) {controls.color = value;});  

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
