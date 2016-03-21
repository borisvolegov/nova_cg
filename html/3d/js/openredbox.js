/***********
 * openRedBox.js
 * An open red box
 * B. Volegov with some ideas borrowed from triangle022.js; cubeWtihVertexNumbers.js; cube020.js by M. Laszlo
 * January 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();

function createCube() {
    var geom = new THREE.Geometry();
    var coords = [-1.0, 1.0];

    // pushing all the possible vertices of a cube (all permutations of [(-1 or 1),(-1 or 1),(-1 or 1)])
    for (var x = 0; x < 2; x++)
        for (var y = 0; y < 2; y++)
            for (var z = 0; z < 2; z++)
                geom.vertices.push(new THREE.Vector3(coords[x], coords[y], coords[z]));

    // combining vertices which constitute each face into tuple. Two trangular faces define an actual face of a cube.
    var faces = [[0, 6, 4],  // back
                 [6, 0, 2],
                 [1, 7, 3],  // front
                 [7, 1, 5],
                 [5, 6, 7],  // right
                 [6, 5, 4],
                 [1, 2, 0],  // left
                 [2, 1, 3],
                 // no need to create the top face (we want to look inside the cube)
                 // [2, 7, 6],  // top
                 // [7, 2, 3],
                 [5, 0, 4],   // bottom
                 [0, 5, 1]
                ];

    // creating threejs faces
    for (var i = 0; i < 10; i++)
        geom.faces.push(new THREE.Face3(faces[i][0], faces[i][1], faces[i][2]));

    // a lot of trial and error here. just empirically figured out that the next line makes it work.
    geom.computeFaceNormals();

    var mat = new THREE.MeshLambertMaterial({color: 0xFF0000, shading:THREE.FlatShading, side:THREE.DoubleSide});

    var mesh = new THREE.Mesh(geom, mat);
    return mesh;
}


function createScene() {
    var mesh = createCube();

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
    camera.position.set(5, 5, 10);
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
