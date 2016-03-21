/***********
 * pong.js
 * implementation of pong game 
 * Final Project for Computer Graphics class
 * B. Volegov
 * March 2016
 ***********/
var matrixresort = matrixresort || {};

matrixresort.pong = (function() {
    var gui, controls,
    _gameCanvasElementID,
    _scene,
    _renderer,
    _camera,
    _cameraControls,
    _clock,
    _gameOptions = {},
    _defaultGameOptions = {
        "fieldWidth": 384, 
        "fieldLength": 512, 
        "fieldColor": new THREE.Color("gray"), 
        "cameraPosition": {"x": 0, "y": 300, "z": -600},
        "ballColor": new THREE.Color("white"),
        "ballRadius": 8,
        "paddleWidth": 64,
        "paddleColor": new THREE.Color("blue")
    },
    _planeMesh,
    _ballMesh,

    fnInit = function(gameCanvasElementID, gameOptions) {
        _gameCanvasElementID = gameCanvasElementID;
        $.extend(_gameOptions, _defaultGameOptions, gameOptions);

        _clock = new THREE.Clock();

        var canvasWidth = window.innerWidth;
        var canvasHeight = window.innerHeight;
        var canvasRatio = canvasWidth / canvasHeight;

        _scene = new THREE.Scene();

        _renderer = new THREE.WebGLRenderer({antialias : true});
        _renderer.gammaInput = true;
        _renderer.gammaOutput = true;
        _renderer.setSize(canvasWidth, canvasHeight);
        _renderer.setClearColor(0x000000, 1.0);     

        _camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
        _camera.position.set(_gameOptions.cameraPosition.x, _gameOptions.cameraPosition.y, _gameOptions.cameraPosition.z);
        _camera.lookAt(new THREE.Vector3(0, 0, 0));

        _cameraControls = new THREE.OrbitControls(_camera, _renderer.domElement); 

        _fnCreateScene();

        _fnAddToDOM();

        _fnRender();

        _fnAnimate();        
    },

    _fnAddToDOM = function() {
        var container = document.getElementById(_gameCanvasElementID);
        var canvas = container.getElementsByTagName('canvas');
        if (canvas.length>0) {
            container.removeChild(canvas[0]);
        }
        container.appendChild(_renderer.domElement);
    },    

    _fnCreateScene = function() {
        _fnCreatePlane();

        _fnCreateBall();

        _fnCreatePaddles();

        // randomBoxes(100, 5, 20, 5, 60);

        var light1 = new THREE.PointLight(0xFFFFFF, 1, 1000 );
        light1.position.set(100, 100, 150);

        // var light2 = new THREE.PointLight(0xFFFFFF, 1, 1000 );
        // light2.position.set(-100, -100, 150);    

        var ambientLight = new THREE.AmbientLight(0x222222);

        _scene.add(light1);
        // scene.add(light2);    
        _scene.add(ambientLight);
    },

    _fnCreatePlane = function() {
        var planeGeometry = new THREE.BoxGeometry(_gameOptions.fieldWidth, 0.1, _gameOptions.fieldLength);    
        var planeMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.8, color: _gameOptions.fieldColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        _planeMesh.position.set(0, 0, 0);
        _scene.add(_planeMesh);     
    },

    _fnCreateBall = function() {
        var ballGeometry = new THREE.SphereGeometry(_gameOptions.ballRadius, 32, 32);  
        var ballMaterial = new THREE.MeshLambertMaterial({transparent: false, color: _gameOptions.ballColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);

        _scene.add(_ballMesh);

        _ballMesh.position.x = 0;
        _ballMesh.position.y = _gameOptions.ballRadius;
        _ballMesh.position.z = 0;
    },

    _fnCreatePaddles = function() {
        var paddleHeight = 32, paddleWidth = 8;
        var paddleGeometry = new THREE.CubeGeometry(_gameOptions.paddleWidth, paddleHeight, 8);  
        var paddleMaterial = new THREE.MeshLambertMaterial({transparent: true, color: _gameOptions.paddleColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _paddleMesh1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
        _paddleMesh2 = new THREE.Mesh(paddleGeometry, paddleMaterial);

        _scene.add(_paddleMesh1);
        _scene.add(_paddleMesh2);  

        _paddleMesh1.position = new THREE.Vector3(0, paddleHeight/2, -(_gameOptions.fieldLength - paddleWidth)/2);
        _paddleMesh2.position = new THREE.Vector3(0, paddleHeight/2, (_gameOptions.fieldLength - paddleWidth)/2);        
    },    

    _fnRender = function() {
        var delta = _clock.getDelta();
        _cameraControls.update(delta);
        _renderer.render(_scene, _camera);
    },


    _fnAnimate = function() {
        window.requestAnimationFrame(_fnAnimate);
        _fnRender();
    };

    return {
        init: fnInit
    };       

})();

matrixresort.pong.init('container', {});

// function randomBoxes(nbrBoxes, minSide, maxSide, minHeight, maxHeight) {
//     var planeColor = new THREE.Color("gray");
//     var planeMesh = createBoxMesh(200, 200, 0.1, planeColor, 1)
//     planeMesh.position.set(0, 0, 0);
//     scene.add(planeMesh);

//     for(var i = 0; i < nbrBoxes; i++) {
//         var xLength = minSide + (maxSide - minSide) * Math.random();
//         var yLength = minSide + (maxSide - minSide) * Math.random();
//         var zHeight = minHeight + (maxHeight - minHeight) * Math.random();

//         var hue = Math.random();
//         var saturation = 0.8 + (0.95 - 0.8) * Math.random();
//         var lightness = 0.3 + (0.7 - 0.3) * Math.random();

//         var color = new THREE.Color();
//         color.setHSL(hue, saturation, lightness);

//         var boxMesh = createBoxMesh(xLength, yLength, zHeight, color, 0.8);

//         var xPosition = (200 - xLength) * Math.random() - (200 - xLength)/2;
//         var yPosition = (200 - yLength) * Math.random() - (200 - yLength)/2;

//         boxMesh.position.set(xPosition, yPosition, zHeight/2);

//         scene.add(boxMesh)
//     }
// }


// function animate() {
// 	window.requestAnimationFrame(animate);
// 	render();
// }


// function render() {
//     var delta = clock.getDelta();
//     cameraControls.update(delta);
// 	renderer.render(scene, camera);
// }


// function init() {
// 	var canvasWidth = window.innerWidth;
// 	var canvasHeight = window.innerHeight;
// 	var canvasRatio = canvasWidth / canvasHeight;

// 	scene = new THREE.Scene();

// 	renderer = new THREE.WebGLRenderer({antialias : true});
// 	renderer.gammaInput = true;
// 	renderer.gammaOutput = true;
// 	renderer.setSize(canvasWidth, canvasHeight);
// 	renderer.setClearColor(0x000000, 1.0);

// 	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
// 	camera.position.set(200, 200, 200);
// 	camera.lookAt(new THREE.Vector3(0, 0, 0));

// 	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
// }



// function addToDOM() {
// 	var container = document.getElementById('container');
// 	var canvas = container.getElementsByTagName('canvas');
// 	if (canvas.length>0) {
// 		container.removeChild(canvas[0]);
// 	}
// 	container.appendChild( renderer.domElement );
// }



// init();
// createScene();
// // showGrids()/**/;
// addToDOM();
// render();
// animate();
