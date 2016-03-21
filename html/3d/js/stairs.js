/***********
 * stairs.js
 * a program that renders a geometry for stairs made of nbrSteps where each step has specified width
 * B. Volegov with some ideas borrowed from cube020.js by M. Laszlo
 * Frbruary 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();

function createStairs(riser, tread, width, nbrStairs) {
    var geom = new THREE.Geometry();
    var xCoords = [-width/2, width/2];
    var yFirst = -riser * nbrStairs/2;
    var zFirst = tread * nbrStairs/2;

    for (var i = 0; i < nbrStairs; i++) {
        //creating six vertices representing a single step
        geom.vertices.push(new THREE.Vector3(xCoords[0], yFirst + riser*i, zFirst - tread*i));
        geom.vertices.push(new THREE.Vector3(xCoords[1], yFirst + riser*i, zFirst - tread*i)); 
        geom.vertices.push(new THREE.Vector3(xCoords[0], yFirst + riser*(i + 1), zFirst - tread*i));
        geom.vertices.push(new THREE.Vector3(xCoords[1], yFirst + riser*(i + 1), zFirst - tread*i)); 
        geom.vertices.push(new THREE.Vector3(xCoords[0], yFirst + riser*(i + 1), zFirst - tread*(i + 1)));
        geom.vertices.push(new THREE.Vector3(xCoords[1], yFirst + riser*(i + 1), zFirst - tread*(i + 1))); 
        
        //as each step is represented by 6 vertices, we skip 6 vertices to make faces for the next step
        /*renders riser of the step: face1(0,1,2) and face2(2,1,3)*/
        geom.faces.push(new THREE.Face3(0 + 6*i, 1 + 6*i, 2 + 6*i));    
        geom.faces.push(new THREE.Face3(2 + 6*i, 1 + 6*i, 3 + 6*i));  

        /*renders tread of the step: face1(2,3,4) and face2(4,3,5)*/
        geom.faces.push(new THREE.Face3(2 + 6*i, 3 + 6*i, 4 + 6*i));    
        geom.faces.push(new THREE.Face3(4 + 6*i, 3 + 6*i, 5 + 6*i)); 
    }

    geom.computeFaceNormals();

    var mat = new THREE.MeshLambertMaterial({color: 0xFF0000, shading:THREE.FlatShading, side:THREE.DoubleSide});

    var mesh = new THREE.Mesh(geom, mat);
    return mesh;
}


function createScene() {
    var mesh = createStairs(1, 2, 4, 5);

    var light = new THREE.PointLight(0xFFFFFF, 1, 1000);
    light.position.set(0, 10, 20);
    var ambientLight = new THREE.AmbientLight(0x222222);

    scene.add(light);
    scene.add(ambientLight);


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
    renderer.setClearColor(0x000000, 1.0);

    camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
    camera.position.set(20, 10, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
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


// try {
    init();
    showGrids();
    createScene();
    addToDOM();
    render();
    animate();
/*
} catch(e) {
    var errorMsg = "Error: " + e;
    document.getElementById("msg").innerHTML = errorMsg;
}
*/
