/***********
 * helixFunc.js
 * B. Volegov
 * Renders helix of objects
 * Generalization of helix.js 
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


function generateSpheres(n, radius, widthSegments, heightSegments) {
    return function(i) {
        var color = new THREE.Color(0, 0, 0);
        //closure captures the value of parameter "n"
        color.setHSL(1.0 * i / n, 1.0, 0.5);
        var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 1, color: color, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var geom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        var mesh = new THREE.Mesh(geom, material);

        return mesh;
    };
}


function generateTori(n, radius, tube, radialSegments, tubularSegments) {
    return function(i) {
        var color = new THREE.Color(0, 0, 0);
        //closure captures the value of parameter "n"
        color.setHSL(1.0 * i / n, 1.0, 0.5);
        var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 1, color: color, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var geom = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
        var mesh = new THREE.Mesh(geom, material);

        return mesh;
    };
}

function generateOctahedrons(n, radius) {
    return function(i) {
        var color = new THREE.Color(0, 0, 0);
        //closure captures the value of parameter "n"
        color.setHSL(1.0 * i / n, 1.0, 0.5);
        var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 1, color: color, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var geom = new THREE.OctahedronGeometry(radius);
        var mesh = new THREE.Mesh(geom, material);

        return mesh;
    };
}

function generateIcosahedrons(n, radius) {
    return function(i) {
        var color = new THREE.Color(0, 0, 0);
        //closure captures the value of parameter "n"
        color.setHSL(1.0 * i / n, 1.0, 0.5);
        var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 1, color: color, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var geom = new THREE.IcosahedronGeometry(radius);
        var mesh = new THREE.Mesh(geom, material);

        return mesh;
    };
}

function generateCylinders(n, radiusTop, radiusBottom, height) {
    return function(i) {
        var color = new THREE.Color(0, 0, 0);
        //closure captures the value of parameter "n"
        color.setHSL(1.0 * i / n, 1.0, 0.5);
        var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 1, color: color, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height);
        var mesh = new THREE.Mesh(geom, material);

        return mesh;
    };
}

function generateKnots(n, radius, tube, radialSegments, tubularSegments) {
    return function(i) {
        var color = new THREE.Color(0, 0, 0);
        //closure captures the value of parameter "n"
        color.setHSL(1.0 * i / n, 1.0, 0.5);
        var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 1, color: color, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var geom = new THREE.TorusKnotGeometry(radius, tube, radialSegments, tubularSegments);
        var mesh = new THREE.Mesh(geom, material);

        return mesh;
    };
}

function createHelix(func,  n, radius, angle, dist) {
    var helix = new THREE.Object3D();

    var newObject;

    for(var i = 0; i < n; i++) {
        if(typeof func === 'function') {
            newObject = func(i);
        } else {
            newObject = object.clone();
        }

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

    var func;

    switch (controls.objectType) {
        case 'Sphere': func = generateSpheres(controls.n, 1, 24, 24)
                       break;
        case 'Torus' : func = generateTori(controls.n, 1, 0.5, 24, 24);
                       break;                    
        case 'Octahedron' : func = generateOctahedrons(controls.n, 1);
                       break;              
        case 'Icosahedron' : func = generateIcosahedrons(controls.n, 1);
                       break;    
        case 'Cylinder' : func = generateCylinders(controls.n, 1, 1, 1);
                       break;    
        case 'Knot' : func = generateKnots(controls.n, 1, 0.5, 24, 24);
                       break;                                                                      
    }

    currentHelix = createHelix(func, controls.n, controls.radius, controls.angle, controls.distance);

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
