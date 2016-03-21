/***********
 * oscillatingSquares.js
 * B. Volegov built on top of oscillatingSquares3.js by M. Laszlo
 * March 2016
 ***********/


var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();

var squares;
var projector = new THREE.Projector();
var theObjects = [];
var canvasWidth, canvasHeight;

var m = 60, n = 60;
var offset = 2.4;

// as we have more than one wave, instead of having individual vairables which represnt a single wave we are going to have an array of such parameters
// initially the array is empty
var waveParameters = [];

var plainColor = null;
var nbrColors = 201;
var colors;


function squareGeom() {
    var geom = new THREE.Geometry();
    var vertices = [new THREE.Vector3(1, 1, 0), new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(-1, -1, 0), new THREE.Vector3(-1, 1, 0)];
    for (var i = 0; i < vertices.length; i++)
        geom.vertices.push(vertices[i]);
    var faces = [[0, 1, 3], [3, 1, 2]];
    var normal = new THREE.Vector3(0, 0, 1);
    for (var i = 0; i < faces.length; i++)
        geom.faces.push(new THREE.Face3(faces[i][0], faces[i][1], faces[i][2], normal));
    return geom;
}

function createMatrixOfSquares(m, n, offset) {
    // fit into 10x10 square
    var root = new THREE.Object3D();
    root.scale.x = 10 / m*offset;
    root.scale.y = 10 / n*offset;

    // array of square meshes
    squares = new Array(m);
    for (var i = 0; i < m; i++) {
        squares[i] = new Array(n);
    }

    offset = offset !== undefined ? offset : 2.0;
    var geom = squareGeom();
    var xMin = -offset * ((m-1) / 2.0);
    var yMin = -offset * ((n-1) / 2.0);
    var mn = m * n;
    for (var i = 0, x = xMin; i < m; i++, x += offset) {
        for (var j = 0, y = yMin; j < n; j++, y += offset) {
            var mat = new THREE.MeshBasicMaterial({color: plainColor, shading: THREE.FlatShading, side: THREE.DoubleSide});
            var square = new THREE.Mesh(geom, mat);
            square.position.x = x;
            square.position.y = y;
            square.i = i;
            square.j = j;
            root.add(square);
            theObjects.push(square);
            squares[i][j] = square;
        }
    }
    scene.add(root);
}

function heightFunction(delta, dist, waveIndex) {
    var currentWaveParameters = waveParameters[waveIndex];
    var maxHeight = currentWaveParameters.amplitude;

    return maxHeight * Math.sin(0.5*delta);
}

function colorFunction(ht, delta, dist, waveIndex) {
    var currentWaveParameters = waveParameters[waveIndex];
    colorIndex = 0;

    if(currentWaveParameters) {
        var maxHeight = currentWaveParameters.amplitude;
        var minHeight = -currentWaveParameters.amplitude;
        var heightRange = maxHeight - minHeight;
        var colorIndex = Math.floor(((ht - minHeight) / heightRange) * nbrColors);
    }

    return colors[colorIndex];
} 

function updateSquares() {
    var changed = false;
    for (var i = 0; i < theObjects.length; i++) {
        var obj = theObjects[i];

        obj.position.z = 0;
        obj.material.color = plainColor;        

        for(var j = 0; j < waveParameters.length; j++) {
            dist = distance(waveParameters[j].selectedSquare, obj);
            var currentWaveParameters = waveParameters[j];
            delta = currentWaveParameters.curWave - dist;

            if (delta > 0 && delta < currentWaveParameters.waveLimit) {
                var ht = heightFunction(delta, dist, j);
                // square height is calculated as superposition of several waves
                obj.position.z += ht;
                obj.material.color = colorFunction(ht, delta, dist, j);
                changed = true;
            }
        }
    }

    if (!changed) {
        for(var j = 0; j < waveParameters.length; j++) {     
            var selectedSquare = waveParameters[j].selectedSquare;  

            selectedSquare.material.color = plainColor;
            initializeColors();
        }

        // reset waveParameters
        waveParameters = [];
    }
}

function distance(sq1, sq2) {
    dx = sq1.i - sq2.i;
    dy = sq1.j - sq2.j;
    return Math.sqrt(dx*dx + dy*dy);
}


function createScene() {
    initializeColors();
    var matrixOfSquares = createMatrixOfSquares(m, n, offset);
    scene.add(matrixOfSquares);
}

function initializeColors() {
    if (nbrColors % 2 == 0) {
        nbrColors++;
    }
    colors = new Array(nbrColors);    
    nbrColors2 = (nbrColors - 1) / 2;
    var hues = [Math.random(), Math.random()];
    for (var j = 0; j < nbrColors2; j++) {
        var sat = 1 - j/nbrColors2;
        colors[j] = new THREE.Color().setHSL(hues[0], sat, 0.5);
        colors[nbrColors-j-1] = new THREE.Color().setHSL(hues[1], sat, 0.5);
    }
    plainColor = colors[nbrColors2] = new THREE.Color().setHSL(0, 0, 0.5);
}


function onDocumentMouseDown(event) {
    var mouseVec = new THREE.Vector3(
        2*(event.clientX/canvasWidth)-1,
        1-2*(event.clientY/canvasHeight), 0);
    var raycaster = projector.pickingRay(mouseVec.clone(), camera);
    var intersects = raycaster.intersectObjects(theObjects);
    if (intersects.length > 0) {
        // select the closest intersected object
        var selectedSquare = intersects[0].object;
        selectedSquare.material.color = new THREE.Color(0xff0000);

        // allow peak amplitude to take values between 0.5 and 3
        var amplitude = Math.random() * (3 - 0.5) + 0.5; 

        // allow rate to take values between 3 and 10     
        var rate = Math.random() * (10 - 3) + 3;

        // add wave parameters
        waveParameters.push({'selectedSquare': selectedSquare, 'amplitude': amplitude, 'waveRate': rate, 'curWave': 0, 'waveLimit': 30});
    }
}

document.addEventListener('mousedown', onDocumentMouseDown, false);


function animate() {
    window.requestAnimationFrame(animate);
    render();
}


function render() {
    var delta = clock.getDelta();
    if (waveParameters.length > 0) {
        for(var i = 0; i < waveParameters.length; i++) {
            waveParameters[i].curWave += (waveParameters[i].waveRate * delta);
        }

        updateSquares();
    }

    cameraControls.update(delta);
    renderer.render(scene, camera);
}


function init() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    var canvasRatio = canvasWidth / canvasHeight;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({antialias : true});
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x000000, 1.0);

    camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
    camera.position.set(0, -40, 30);
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


// try {
    init();
    createScene();
    addToDOM();
    render();
    animate();
/**
} catch(e) {
    var errorMsg = "Error: " + e;
    document.getElementById("msg").innerHTML = errorMsg;
}
**/
