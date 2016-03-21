/***********
 * cylinder.js
 * An n-sided cylinder of specified height, radius (with or without bottom and top)
 * B. Volegov with some ideas borrowed from openPyramidText.js by M. Laszlo
 * February 2016
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();

function createCylinder(n, len, rad, isCappedBot, isCappedTop) {
    var geom = new THREE.Geometry();

    isCappedBot = !!isCappedBot;
    isCappedTop = !!isCappedTop;

    var len2 = len / 2;
    var inc = 2 * Math.PI / n;


    var bottomVertices = [];
    var topVertices = [];

    for (var i = 0, a = 0; i < n; i++, a += inc) {
        var cos = Math.cos(a);
        var sin = Math.sin(a);
        var topVertex = new THREE.Vector3(cos * rad, len2, sin * rad); 
        var bottomVertex = new THREE.Vector3(cos * rad, -len2, sin * rad);

        topVertices.push(topVertex);
        bottomVertices.push(bottomVertex);
    }

    geom.vertices.push.apply(geom.vertices, bottomVertices);
    geom.vertices.push.apply(geom.vertices, topVertices);

    for(var j = 0; j < n; j++) {
        var bottomVertexIndex = j;
        var topVertexIndex = n + j;

        // normally just the next index, but for last j (j == n-1) the next index is not n but n%n = 0 instead
        var nextRelativeIndexOnTheRing = (j + 1) % n;

        var nextBottomVertexIndex = nextRelativeIndexOnTheRing;
        var nextTopVertexIndex = n + nextRelativeIndexOnTheRing;

        var face1 = new THREE.Face3(nextTopVertexIndex, nextBottomVertexIndex, bottomVertexIndex);
        var face2 = new THREE.Face3(nextTopVertexIndex, bottomVertexIndex, topVertexIndex);

        geom.faces.push(face1);
        geom.faces.push(face2);
    }

    if(isCappedBot) {
       for(var k = 1; k < n-1; k++) {
            var bottomFace = new THREE.Face3(k, k+1, 0);
            geom.faces.push(bottomFace);
        }      
    }

    if(isCappedTop) {
       for(var k = 1; k < n-1; k++) {
            var offset = n*nbrSegments;
            var topFace = new THREE.Face3(offset + k, offset + (k+1), offset);
            geom.faces.push(topFace);
        }      
    }    

    geom.computeFaceNormals();

    var mat = new THREE.MeshLambertMaterial({color: 0x0000FF, shading:THREE.FlatShading, side:THREE.DoubleSide});

    var mesh = new THREE.Mesh(geom, mat);
    return mesh;
}


function createScene() {
    var mesh = createCylinder(12, 6, 2, true, false);

    var light = new THREE.PointLight(0xFFFFFF, 1, 1000);
    light.position.set(10, 10, 10);
    var light2 = new THREE.PointLight(0xFFFFFF, 1, 1000);
    light2.position.set(-10, -10, -10);    
    var ambientLight = new THREE.AmbientLight(0x222222);

    scene.add(light);
    scene.add(light2);    
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
    camera.position.set(10, 20, 10);
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