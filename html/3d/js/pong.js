/***********
 * pong.js
 * implementation of pong game 
 * Final Project for Computer Graphics class
 * B. Volegovme
 * March 2016
 ***********/
var matrixresort = matrixresort || {};

matrixresort.pong = (function($) {
    var 
    _gameCanvasElementID,
    _threejs = {
        "scene": null,
        "renderer": null,
        "camera": null,
        "cameraControls": null,
        "clock": null,
    },
    _gameOptions = {},
    _defaultGameOptions = {
        "ballColor": new THREE.Color("#ADFF2F"),
        "ballRadius": 8,
        "ballSpeed": 6,     
        "cameraPosition": {"x": 0, "y": 300, "z": 600},
        "fieldColor": new THREE.Color("gray"), 
        "fieldLength": 512,     
        "fieldWidth": 384, 
        "pauseAfterScoreChange": 4,                            
        "paddleWidth": 64,
        "paddleThickness": 8,
        "paddleComputerMaxSpeed": 3.5,        
        "paddleHumanColor": new THREE.Color("blue"),
        "paddleComputerColor": new THREE.Color("red"),       
        "wallColor": new THREE.Color("beige"),
        "wallHeight": 64,   
        "wallWidth": 4,             
    },
    _gameObjects = {
        "plane": null,
        "ball": null,
        "humanPaddle": null,
        "computerPaddle": null,
        "scoreBoard": {
            "root": null,
            "humanScore": 0,
            "computerScore": 0
        }
    },
    _keysPressed = {left: false, right: false},
    _ballSpeedComponents = null,
    _deltaSinceLastScoreChange = -1,

    fnInit = function(gameCanvasElementID, gameOptions) {
        _gameCanvasElementID = gameCanvasElementID;
        $.extend(_gameOptions, _defaultGameOptions, gameOptions);

        _threejs.clock = new THREE.Clock();

        var canvasWidth = window.innerWidth;
        var canvasHeight = window.innerHeight;
        var canvasRatio = canvasWidth / canvasHeight;

        _threejs.scene = new THREE.Scene();

        _threejs.renderer = new THREE.WebGLRenderer({antialias : true});
        _threejs.renderer.gammaInput = true;
        _threejs.renderer.gammaOutput = true;
        _threejs.renderer.setSize(canvasWidth, canvasHeight);
        _threejs.renderer.setClearColor(0x000000, 1.0);     

        _threejs.camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
        _threejs.camera.position.set(_gameOptions.cameraPosition.x, _gameOptions.cameraPosition.y, _gameOptions.cameraPosition.z);
        _threejs.camera.lookAt(new THREE.Vector3(0, 0, 0));

        _threejs.cameraControls = new THREE.OrbitControls(_threejs.camera, _threejs.renderer.domElement); 

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

        container.appendChild(_threejs.renderer.domElement);
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

        _threejs.scene.add(light1);
        // scene.add(light2);    
        _threejs.scene.add(ambientLight);
    },

    _fnCreatePlane = function() {
        var planeGeometry = new THREE.BoxGeometry(_gameOptions.fieldWidth, 0.1, _gameOptions.fieldLength);    
        var planeMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.8, color: _gameOptions.fieldColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _gameObjects.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        _gameObjects.plane.position.set(0, 0, 0);
        _threejs.scene.add(_gameObjects.plane);     
    },

    _fnCreateWalls = function() {
        var wallGeometry = new THREE.BoxGeometry(_gameOptions.wallWidth, _gameOptions.wallHeight, _gameOptions.fieldLength);    
        var wallMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.8, color: _gameOptions.wallColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        var leftWall = new THREE.Mesh(wallGeometry, wallMaterial);

        leftWall.position.set(-(_gameOptions.fieldWidth - _gameOptions.wallWidth)/2, _gameOptions.wallHeight/2, 0);
        rightWall.position.set((_gameOptions.fieldWidth - _gameOptions.wallWidth)/2,  _gameOptions.wallHeight/2, 0);

        _threejs.scene.add(rightWall);  
        _threejs.scene.add(leftWall);    
    },

    _fnCreateBall = function() {
        var ballGeometry = new THREE.SphereGeometry(_gameOptions.ballRadius, 32, 32);  
        var ballMaterial = new THREE.MeshLambertMaterial({transparent: false, color: _gameOptions.ballColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _gameObjects.ball = new THREE.Mesh(ballGeometry, ballMaterial);

        _threejs.scene.add(_gameObjects.ball);

        _gameObjects.ball.position.setX(0);
        _gameObjects.ball.position.setY(_gameOptions.ballRadius);
        _gameObjects.ball.position.setZ(0);
    },

    _fnCreatePaddles = function() {
        var paddleHeight = 32;
        var paddleGeometry = new THREE.CubeGeometry(_gameOptions.paddleWidth, paddleHeight, _gameOptions.paddleThickness);  

        var paddleHumanMaterial = new THREE.MeshLambertMaterial({transparent: false, color: _gameOptions.paddleHumanColor, shading: THREE.FlatShading, side: THREE.DoubleSide});
        var paddleComputerMaterial = new THREE.MeshLambertMaterial({transparent: false, color: _gameOptions.paddleComputerColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _gameObjects.humanPaddle = new THREE.Mesh(paddleGeometry, paddleHumanMaterial);
        _gameObjects.computerPaddle = new THREE.Mesh(paddleGeometry, paddleComputerMaterial);

        _threejs.scene.add(_gameObjects.humanPaddle);
        _threejs.scene.add(_gameObjects.computerPaddle);  

        _gameObjects.humanPaddle.position.set(0, paddleHeight/2, (_gameOptions.fieldLength - _gameOptions.paddleThickness)/2);
        _gameObjects.computerPaddle.position.set(0, paddleHeight/2, -(_gameOptions.fieldLength - _gameOptions.paddleThickness)/2);        
    },  

    _fnCreateScoreBoard = function() {
        _gameObjects.scoreBoard.root = new THREE.Object3D(); 

        var scoreHuman = _fnCreateScoreBoardPiece(_gameObjects.scoreBoard.humanScore, _gameOptions.paddleHumanColor, -64);
        var scoreDivider = _fnCreateScoreBoardPiece(" : ", new THREE.Color("white"), 0);  
        var scoreComputer = _fnCreateScoreBoardPiece(_gameObjects.scoreBoard.computerScore, _gameOptions.paddleComputerColor, 64); 


        _gameObjects.scoreBoard.updateScore = function()  {
            _threejs.scene.remove(_gameObjects.scoreBoard.root);
            _fnCreateScoreBoard();
        };

        _threejs.scene.add(_gameObjects.scoreBoard.root);
        _gameObjects.scoreBoard.root.position.setY(144);
    }, 

    _fnCreateScoreBoardPiece = function(text, color, translateX) {
        var fontLoader = new THREE.FontLoader();
        fontLoader.load("fonts/helvetiker_bold.typeface.js", function (font) {
            var scorePieceGeometry = new THREE.TextGeometry(text, {font: font, weight:"bold", size: 24, height: 2, curveSegments: 3, bevelEnabled: false}); 

            var scorePieceMaterial = new THREE.MeshBasicMaterial({color: color});
        
            THREE.GeometryUtils.center(scorePieceGeometry); 

            var scorePiece = new THREE.Mesh(scorePieceGeometry, scorePieceMaterial);

            scorePiece.translateX(translateX);

            setTimeout(function(){_gameObjects.scoreBoard.root.add(scorePiece)});           
        });  
    },

    _fnHumanPaddleMove = function() {
        var maxPaddleDistanceFromCenter = _fnGetMaxPaddleDistanceFromCenter();

        if(_keysPressed.left && _gameObjects.humanPaddle.position.x > -maxPaddleDistanceFromCenter) {
            _gameObjects.humanPaddle.position.setX(_gameObjects.humanPaddle.position.x-4);
        } else if(_keysPressed.right  && _gameObjects.humanPaddle.position.x < maxPaddleDistanceFromCenter) {    
           _gameObjects.humanPaddle.position.setX(_gameObjects.humanPaddle.position.x+4);       
        }
    }, 

    _fnComputerPaddleMove = function() {
        var maxPaddleDistanceFromCenter = _fnGetMaxPaddleDistanceFromCenter();

        var shift = _gameObjects.ball.position.x - _gameObjects.computerPaddle.position.x;

        if(shift > _gameOptions.paddleComputerMaxSpeed) {
            shift = _gameOptions.paddleComputerMaxSpeed;
        }

        if(_gameObjects.computerPaddle.position.x + shift > -maxPaddleDistanceFromCenter  && _gameObjects.computerPaddle.position.x + shift < maxPaddleDistanceFromCenter) {      
            _gameObjects.computerPaddle.position.x += shift;
        }
    },    

    _fnGetMaxPaddleDistanceFromCenter = function() {
        return (_gameOptions.fieldWidth - _gameOptions.paddleWidth)/2 - _gameOptions.wallWidth;
    },

    _fnBallMove = function(delta) {
        if(!_ballSpeedComponents) {
            _fnCalculateBallSpeedComponents(1);
        }

        if(_gameObjects.ball.position.x >= _gameOptions.fieldWidth/2 - _gameOptions.wallWidth - _gameOptions.ballRadius) {
            _ballSpeedComponents.speedX = -_ballSpeedComponents.speedX;          
        }

        if(_gameObjects.ball.position.x <= -(_gameOptions.fieldWidth/2 - _gameOptions.wallWidth - _gameOptions.ballRadius)) {
            _ballSpeedComponents.speedX = -_ballSpeedComponents.speedX;                
        }   

        var paddleToInterceptBall = _fnPaddleToInterceptBall();

        if(paddleToInterceptBall != null) {
            var distanceFromPaddleCenter = _fnIsBallIntercepted(paddleToInterceptBall);
            if(distanceFromPaddleCenter >= 0) {     
                if(_fnIsHumanPaddle(paddleToInterceptBall)) {
                    _fnBallBounceOffPaddle(distanceFromPaddleCenter);  
                } else {
                    _ballSpeedComponents.speedZ = -_ballSpeedComponents.speedZ;
                }         
            } else {
                _deltaSinceLastScoreChange = 0;

                if(_fnIsHumanPaddle(paddleToInterceptBall)) {
                    _gameObjects.scoreBoard.computerScore += 1;
                } else {
                    _gameObjects.scoreBoard.humanScore += 1;
                }

                _gameObjects.scoreBoard.updateScore();
                // handle score
                _fnResetGame();  

                return;
            }
        }   

        _gameObjects.ball.position.setX(_gameObjects.ball.position.x + _ballSpeedComponents.speedX);
        _gameObjects.ball.position.setZ(_gameObjects.ball.position.z + _ballSpeedComponents.speedZ);  
    },

    _fnBallBounceOffPaddle = function(distanceFromPaddleCenter) {
        var deltaAngle = Math.PI/6 * distanceFromPaddleCenter / (_gameOptions.paddleWidth / 2) - Math.PI/12;

        var minAngle = Math.Pi/12;
        var maxAngle = 7*Math.PI/12;

        var newAngle = Math.abs(Math.atan(_ballSpeedComponents.speedX / _ballSpeedComponents.speedZ)) + deltaAngle;

        if(newAngle < minAngle) {
            newAngle =  minAngle;
        }  

        if(newAngle > maxAngle) {
            newAngle = maxAngle;
        } 

        var newAngleTan = Math.tan(newAngle);

        directionSignZ = _ballSpeedComponents.speedZ > 0 ? 1 : -1;
        directionSignX = _ballSpeedComponents.speedX > 0 ? 1 : -1;

        _ballSpeedComponents.speedZ = Math.abs(_gameOptions.ballSpeed/(Math.sqrt(1+Math.pow(newAngleTan,2))))*(-directionSignZ);
        _ballSpeedComponents.speedX = Math.abs(_ballSpeedComponents.speedZ * newAngleTan)*directionSignX;
    },

    _fnBallJump = function() {
        var maxHeight = 32;
        var unscaledHeight = Math.abs(Math.sin(2 * _deltaSinceLastScoreChange * 2 * Math.PI /_gameOptions.pauseAfterScoreChange));
        var hue = unscaledHeight;

        _gameObjects.ball.position.setY(maxHeight * unscaledHeight + _gameOptions.ballRadius);
        var currentHSL = _gameObjects.ball.material.color.getHSL();
        _gameObjects.ball.material.color.setHSL(hue, currentHSL.s, currentHSL.l);
    },

    _fnResetGame = function() {
        _gameObjects.ball.position.setX(0);
        _gameObjects.ball.position.setZ(0); 

        _fnCalculateBallSpeedComponents(1);
    },

    _fnIsHumanPaddle = function(paddle) {
        return paddle.position.z > 0;
    },

    _fnPaddleToInterceptBall = function() {
        var paddle = null;

        if(_gameObjects.ball.position.z >= _gameObjects.humanPaddle.position.z - _gameOptions.paddleThickness/2) {
            paddle = _gameObjects.humanPaddle;
        } 

        if(_gameObjects.ball.position.z <= _gameObjects.computerPaddle.position.z + _gameOptions.paddleThickness/2) {
            paddle = _gameObjects.computerPaddle;          
        }

        return paddle;
    },

    _fnIsBallIntercepted = function(paddle) {
        if(_gameObjects.ball.position.x >= (paddle.position.x - _gameOptions.paddleWidth/2) &&
        _gameObjects.ball.position.x <= (paddle.position.x + _gameOptions.paddleWidth/2)) {
            return Math.abs(_gameObjects.ball.position.x - paddle.position.x)
        } else return -1;
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
        var delta = _threejs.clock.getDelta();
        _threejs.cameraControls.update(delta);
        _threejs.renderer.render(_threejs.scene, _threejs.camera);

        _fnHumanPaddleMove();
        _fnComputerPaddleMove();

        if(_deltaSinceLastScoreChange == -1 || _deltaSinceLastScoreChange > _gameOptions.pauseAfterScoreChange) {
            if(_deltaSinceLastScoreChange > 0) {
                _deltaSinceLastScoreChange = -1;
                _gameObjects.ball.position.setY(_gameOptions.ballRadius);
                _gameObjects.ball.material.color.set(_gameOptions.ballColor);
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
