/**********
 * segmentedCylinder.js
 * An n-sided segmented cylinder given radius, height (with or without bottom and top)
 * B. Volegov built upon cylinder.js, segmentedCylinder.js 
 * February 2016
 ***********/


var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();

function createSegmentedCylinder(n, nbrSegments, segmentHeight, radius, isCappedBot, isCappedTop) {
    var geom = new THREE.Geometry();

    isCappedBot = !!isCappedBot;
    isCappedTop = !!isCappedTop;

    var inc = 2 * Math.PI / n;

    var xz_plane_coords = [];

    /* as coordinates of vertices for non-scaled cylinder of radius "1" on x-z plane 
    are independent of a layer , we calculate them only once by caching values in xz_plane_coords object. */
    for (var i = 0, a = 0; i < n; i++, a += inc) {
        var coord = {};
        coord.cos = Math.cos(a);
        coord.sin = Math.sin(a);
        xz_plane_coords.push(coord);
    }   

    /* creating vertices by using radius as scale factor for x and z coords 
    and progressively increasing (by "segmentHeight") height   for y coordinate*/
    for (var s = 0, ringOfVerticesHeight = 0; s <= nbrSegments; s++, ringOfVerticesHeight += segmentHeight) {
        for (var i = 0; i < n; i++) {
            var vertex = new THREE.Vector3(xz_plane_coords[i].cos * radius, ringOfVerticesHeight, xz_plane_coords[i].sin * radius);
            geom.vertices.push(vertex);
        }
    }

    // predefined list of colors
    var colors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
    var material = new THREE.MeshFaceMaterial();

    for (var t = 0; t < nbrSegments; t++) {
        /*creating a new material with the specific color for all the faces of the segment. 
        The colors are reused (hence modulo operator) if there are more segments than there are colors*/
        var coloredFaceMaterial = new THREE.MeshLambertMaterial({color:colors[t % colors.length], shading:THREE.FlatShading, side:THREE.DoubleSide});
        material.materials.push(coloredFaceMaterial);

        for(var j = 0; j < n; j++) {
            var bottomVertexIndex = t*n + j;
            var topVertexIndex = (t+1)*n + j;

            // normally just the next index, but for last j (j == n-1) the next index is not n but n%n = 0 instead
            var nextRelativeIndexOnTheRing = (j + 1) % n;

            var nextBottomVertexIndex = t*n + nextRelativeIndexOnTheRing;
            var nextTopVertexIndex = (t+1)*n + nextRelativeIndexOnTheRing;

            var face1 = new THREE.Face3(nextTopVertexIndex, nextBottomVertexIndex, bottomVertexIndex);
            var face2 = new THREE.Face3(nextTopVertexIndex, bottomVertexIndex, topVertexIndex);

            face1.materialIndex = face2.materialIndex = t % colors.length;

            geom.faces.push(face1);
            geom.faces.push(face2);
        }
    }

    // bottom has the same color as the first segment
    if(isCappedBot) {
       for(var k = 1; k < n-1; k++) {
            var bottomFace = new THREE.Face3(k, k+1, 0);
            bottomFace.materialIndex = 0;
            geom.faces.push(bottomFace);
        }      
    }

    // top has the same cplor as the last segment
    if(isCappedTop) {
       for(var k = 1; k < n-1; k++) {
            var offset = n*nbrSegments;
            var topFace = new THREE.Face3(offset + k, offset + (k+1), offset);
            topFace.materialIndex = (nbrSegments-1) % colors.length;
            geom.faces.push(topFace);
        }      
    }    

    geom.computeFaceNormals();
    //for (var i = 0; i < 12; i++)
    //    geom.faces.push(construct(THREE.Face3, faces[i]));
    // var mat = new THREE.MeshLambertMaterial({color: 0x0000FF, shading:THREE.FlatShading, side:THREE.DoubleSide});
    // set material indexes of cube's faces, into the
    // meshFaceMaterial that follows

    var mesh = new THREE.Mesh(geom, material);
    return mesh;
}


function createScene() {
    var mesh = createSegmentedCylinder(12, 15, 0.5,  2, true, true);

    var light = new THREE.PointLight(0xFFFFFF, 1, 1000);
    light.position.set(10, 10, 5);
    var light2 = new THREE.PointLight(0xFFFFFF, 1, 1000);
    light2.position.set(-20, -5, -15);    
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
    camera.position.set(15, 20, 15);
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