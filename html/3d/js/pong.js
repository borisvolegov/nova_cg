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
        "paddleThickness": 8,
        "paddleHumanColor": new THREE.Color("blue"),
        "paddleComputerColor": new THREE.Color("red"),       
        "wallWidth": 4,
        "wallHeight": 64,
        "wallColor": new THREE.Color("beige"),
        "ballSpeed": 4,
        "pauseAfterScoreChange": 4
    },
    _planeMesh,
    _ballMesh,
    _humanPaddleMesh,
    _computerPaddleMesh,
    _keysPressed = {left: false, right: false},
    _ballSpeedComponents = null,
    _deltaSinceLastScoreChange = -1,
    _humanScore = 0,
    _computerScore = 0,
    _scoreBoard,

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

        _fnCreateScoreBoard();

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
        var paddleHeight = 32;
        var paddleGeometry = new THREE.CubeGeometry(_gameOptions.paddleWidth, paddleHeight, _gameOptions.paddleThickness);  

        var paddleHumanMaterial = new THREE.MeshLambertMaterial({transparent: true, color: _gameOptions.paddleHumanColor, shading: THREE.FlatShading, side: THREE.DoubleSide});
        var paddleComputerMaterial = new THREE.MeshLambertMaterial({transparent: true, color: _gameOptions.paddleComputerColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _humanPaddleMesh = new THREE.Mesh(paddleGeometry, paddleHumanMaterial);
        _computerPaddleMesh = new THREE.Mesh(paddleGeometry, paddleComputerMaterial);

        _scene.add(_humanPaddleMesh);
        _scene.add(_computerPaddleMesh);  

        _humanPaddleMesh.position = new THREE.Vector3(0, paddleHeight/2, (_gameOptions.fieldLength - _gameOptions.paddleThickness)/2);
        _computerPaddleMesh.position = new THREE.Vector3(0, paddleHeight/2, -(_gameOptions.fieldLength - _gameOptions.paddleThickness)/2);        
    },  

    _fnCreateScoreBoard = function() {
        _scoreBoard = new THREE.Object3D(); 

        var scoreHumanMesh = _fnCreateScoreBoardPiece(_humanScore, _gameOptions.paddleHumanColor, -64);
        var scoreDividerMesh = _fnCreateScoreBoardPiece(" : ", new THREE.Color("white"), 0);  
        var scoreComputerMesh = _fnCreateScoreBoardPiece(_computerScore, _gameOptions.paddleComputerColor, 64); 
         
        _scoreBoard.add(scoreHumanMesh);
        _scoreBoard.add(scoreDividerMesh);
        _scoreBoard.add(scoreComputerMesh);

        _scoreBoard.updateScore = function()  {
            _scene.remove(_scoreBoard);
            _fnCreateScoreBoard();
        };

        _scene.add(_scoreBoard);
        _scoreBoard.position.y = 144;
    }, 

    _fnCreateScoreBoardPiece = function(text, color, translateX) {
        var scorePieceGeometry = new THREE.TextGeometry(text, {font: "helvetiker", style:"normal", size: 24, height: 2, curveSegments: 3, bevelEnabled: false});  
        var scorePieceMaterial = new THREE.MeshBasicMaterial({color: color});

        THREE.GeometryUtils.center(scorePieceGeometry); 

        var scorePieceMesh = new THREE.Mesh(scorePieceGeometry, scorePieceMaterial);

        scorePieceMesh.translateX(translateX);

        return scorePieceMesh;
    },

    _fnHumanPaddleMove = function() {
        var maxPaddleDistanceFromCenter = _fnGetMaxPaddleDistanceFromCenter();

        if(_keysPressed.left && _humanPaddleMesh.position.x > -maxPaddleDistanceFromCenter) {
            _humanPaddleMesh.position.x -= 4;
        } else if(_keysPressed.right  && _humanPaddleMesh.position.x < maxPaddleDistanceFromCenter) {    
           _humanPaddleMesh.position.x += 4;         
        }
    }, 

    _fnComputerPaddleMove = function() {
        var maxPaddleDistanceFromCenter = _fnGetMaxPaddleDistanceFromCenter();

        var shift = _ballMesh.position.x - _computerPaddleMesh.position.x;

        if(_computerPaddleMesh.position.x + shift > -maxPaddleDistanceFromCenter  && _computerPaddleMesh.position.x + shift < maxPaddleDistanceFromCenter) {      
            _computerPaddleMesh.position.x += shift;
        }
    },    

    _fnGetMaxPaddleDistanceFromCenter = function() {
        return (_gameOptions.fieldWidth - _gameOptions.wallWidth - _gameOptions.paddleWidth)/2;
    },

    _fnBallMove = function(delta) {
        if(!_ballSpeedComponents) {
            _fnCalculateBallSpeedComponents(1);
        }

        if(_ballMesh.position.x >= _gameOptions.fieldWidth/2 - _gameOptions.wallWidth - _gameOptions.ballRadius) {
            _ballSpeedComponents.speedX = -_ballSpeedComponents.speedX;          
        }

        if(_ballMesh.position.x <= -(_gameOptions.fieldWidth/2 - _gameOptions.wallWidth - _gameOptions.ballRadius)) {
            _ballSpeedComponents.speedX = -_ballSpeedComponents.speedX;                
        }   

        var paddleToInterceptBall = _fnPaddleToInterceptBall();

        if(paddleToInterceptBall != null) {
            if(_fnIsBallIntercepted(paddleToInterceptBall)) {
                _ballSpeedComponents.speedZ = -_ballSpeedComponents.speedZ;      
            } else {
                _deltaSinceLastScoreChange = 0;

                if(_fnIsHumanPaddle(paddleToInterceptBall)) {
                    _computerScore += 1;
                } else {
                    _humanScore += 1;
                }

                _scoreBoard.updateScore();
                // handle score
                _fnResetGame();  

                return;
            }
        }   

        _ballMesh.position.x += _ballSpeedComponents.speedX;
        _ballMesh.position.z += _ballSpeedComponents.speedZ;        
    },

    _fnBallJump = function() {
        var maxHeight = 32;
        var unscaledHeight = Math.abs(Math.sin(2 * _deltaSinceLastScoreChange * 2 * Math.PI /_gameOptions.pauseAfterScoreChange));
        var hue = unscaledHeight;

        _ballMesh.position.y = maxHeight * unscaledHeight + _gameOptions.ballRadius;
        var currentHSL = _ballMesh.material.color.getHSL();
        _ballMesh.material.color.setHSL(hue, currentHSL.s, currentHSL.l);
    },

    _fnResetGame = function() {
        _ballMesh.position.x = 0;
        _ballMesh.position.z = 0; 

        _fnCalculateBallSpeedComponents(1);
    },

    _fnIsHumanPaddle = function(paddle) {
        return paddle.position.z > 0;
    },

    _fnPaddleToInterceptBall = function() {
        var paddle = null;

        if(_ballMesh.position.z >= _humanPaddleMesh.position.z - _gameOptions.paddleThickness/2) {
            paddle = _humanPaddleMesh;
        } 

        if(_ballMesh.position.z <= _computerPaddleMesh.position.z + _gameOptions.paddleThickness/2) {
            paddle = _computerPaddleMesh;          
        }

        return paddle;
    },

    _fnIsBallIntercepted = function(paddle) {
        return _ballMesh.position.x >= (paddle.position.x - _gameOptions.paddleWidth/2) &&
        _ballMesh.position.x <= (paddle.position.x + _gameOptions.paddleWidth/2);
    },

    _fnCalculateBallSpeedComponents = function(directionTangent) {
        _ballSpeedComponents = {};
        _ballSpeedComponents.speedX = directionTangent*_gameOptions.ballSpeed/Math.sqrt(1 + Math.pow(directionTangent,2));
        _ballSpeedComponents.speedZ = _gameOptions.ballSpeed/Math.sqrt(1 + Math.pow(directionTangent,2));
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
        _fnComputerPaddleMove();

        if(_deltaSinceLastScoreChange == -1 || _deltaSinceLastScoreChange > _gameOptions.pauseAfterScoreChange) {
            if(_deltaSinceLastScoreChange > 0) {
                _deltaSinceLastScoreChange = -1;
                _ballMesh.position.y = _gameOptions.ballRadius;
                _ballMesh.material.color.set(_gameOptions.ballColor);
            }

            _fnBallMove(delta);
        } else {
            _deltaSinceLastScoreChange += delta;               
            _fnBallJump();         
        }
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
