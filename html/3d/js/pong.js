/***********
 * pong.js
 * implementation of pong game 
 * Final Project for Computer Graphics class
 * B. Volegov
 * March 2016
 ***********/
var matrixresort = matrixresort || {};

matrixresort.pong = (function($) {
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
        "cameraPosition": {"x": 0, "y": 300, "z": 600},
        "ballColor": new THREE.Color("#ADFF2F"),
        "ballRadius": 8,
        "paddleWidth": 64,
        "paddleColor": new THREE.Color("blue"),
        "wallWidth": 4,
        "wallHeight": 64,
        "wallColor": new THREE.Color("red"),
        "ballSpeed": 3
    },
    _planeMesh,
    _ballMesh,
    _humanPaddleMesh,
    _computerPaddleMesh,
    _keysPressed = {left: false, right: false},
    _directionTangent = 1,
    _ballSpeedComponents = null,

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

        _setKeyboard();

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

        _fnCreateWalls();

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

    _fnCreateWalls = function() {
        var wallGeometry = new THREE.BoxGeometry(_gameOptions.wallWidth, _gameOptions.wallHeight, _gameOptions.fieldLength);    
        var wallMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.8, color: _gameOptions.wallColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var rightWallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        var leftWallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

        leftWallMesh.position.set(-(_gameOptions.fieldWidth - _gameOptions.wallWidth)/2, _gameOptions.wallHeight/2, 0);
        rightWallMesh.position.set((_gameOptions.fieldWidth - _gameOptions.wallWidth)/2,  _gameOptions.wallHeight/2, 0);

        _scene.add(rightWallMesh);  
        _scene.add(leftWallMesh);    
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
        var paddleHeight = 32, paddleThickness = 8;
        var paddleGeometry = new THREE.CubeGeometry(_gameOptions.paddleWidth, paddleHeight, paddleThickness);  
        var paddleMaterial = new THREE.MeshLambertMaterial({transparent: true, color: _gameOptions.paddleColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _humanPaddleMesh = new THREE.Mesh(paddleGeometry, paddleMaterial);
        _computerPaddleMesh = new THREE.Mesh(paddleGeometry, paddleMaterial);

        _scene.add(_humanPaddleMesh);
        _scene.add(_computerPaddleMesh);  

        _humanPaddleMesh.position = new THREE.Vector3(0, paddleHeight/2, (_gameOptions.fieldLength - paddleThickness)/2);
        _computerPaddleMesh.position = new THREE.Vector3(0, paddleHeight/2, -(_gameOptions.fieldLength - paddleThickness)/2);        
    },  

    _fnHumanPaddleMove = function() {
        if(_keysPressed.left && _humanPaddleMesh.position.x > -(_gameOptions.fieldWidth - _gameOptions.wallWidth - _gameOptions.paddleWidth)/2) {
            _humanPaddleMesh.position.x -= 4;
        } else if(_keysPressed.right  && _humanPaddleMesh.position.x < (_gameOptions.fieldWidth - _gameOptions.wallWidth - _gameOptions.paddleWidth)/2) {     
           _humanPaddleMesh.position.x += 4;         
        }
    }, 

    _fnBallMove = function() {
        if(!_ballSpeedComponents) {
            _fnCalculateBallSpeedComponents();
        }

        _ballMesh.position.x += _ballSpeedComponents.speedX;
        _ballMesh.position.z += _ballSpeedComponents.speedZ;        
    },

    _fnCalculateBallSpeedComponents = function() {
        _ballSpeedComponents = {};
        _ballSpeedComponents.speedX = _directionTangent*_gameOptions.ballSpeed/Math.sqrt(1 + Math.pow(_directionTangent,2));
        _ballSpeedComponents.speedZ = _gameOptions.ballSpeed/Math.sqrt(1 + Math.pow(_directionTangent,2));
    },

    _setDirection = function() {

    },

    _setKeyboard = function() {
        $(document).keydown(function (e) {
                var preventEventPropogation = true;

                switch(e.keyCode) {
                case 37:
                    _keysPressed.left = true;
                    break;
                case 39:
                    _keysPressed.right = true;
                    break;
                default:
                    preventEventPropogation = false;

                if(preventEventPropogation) {
                    e.preventDefault();
                } else {
                    return;
                }
            }
        });

      $(document).keyup(function (e) {
                var preventEventPropogation = true;

                switch(e.keyCode) {
                case 37:
                    _keysPressed.left = false;
                    break;
                case 39:
                    _keysPressed.right = false;
                    break;
                default:
                    preventEventPropogation = false;

                if(preventEventPropogation) {
                    e.preventDefault();
                } else {
                    return;
                }
            }
        });      
    },

    _fnRender = function() {
        var delta = _clock.getDelta();
        _cameraControls.update(delta);
        _renderer.render(_scene, _camera);

        _fnHumanPaddleMove();
        _fnBallMove();
    },

    _fnAnimate = function() {
        window.requestAnimationFrame(_fnAnimate);
        _fnRender();
    };

    return {
        init: fnInit
    };       

})(jQuery);

matrixresort.pong.init('container', {});
