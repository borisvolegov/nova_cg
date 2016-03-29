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
        "ballSpeed": 8,     
        "cameraPosition": {"x": 0, "y": 200, "z": 600},
        "fieldColor": new THREE.Color("gray"), 
        "fieldLength": 512,     
        "fieldWidth": 384, 
        "fieldHeight": 128,
        "pauseAfterScoreChange": 4,                            
        "paddleWidth": 86,
        "paddleHeight": 64,
        "paddleThickness": 8,
        "paddleComputerColor": new THREE.Color("red"),          
        "paddleComputerMaxSpeed": 5,        
        "paddleHumanColor": new THREE.Color("blue"),
        "paddleHumanSpeed": 6,     
        "planeThickness": 4,
        "wallColor": new THREE.Color("beige"),  
        "wallWidth": 4,             
    },
    _gameObjects = {
        "plane": null,
        "ball": null,
        "lineZ" : null,
        "lineX" : null,        
        "humanPaddle": null,
        "computerPaddle": null,
        "scoreBoard": {
            "root": null,
            "humanScore": 0,
            "computerScore": 0
        }
    },
    _keysPressed = {left: false, right: false, up: false, down: false},
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
        _fnCreatePlanes();

        _fnCreateWalls();

        _fnCreatePaddles();   

        _fnCreateScoreBoard();

        _fnCreateBall();

        var light1 = new THREE.PointLight(0xFFFFFF, 1, 1000 );
        light1.position.set(100, 100, 200);

        var light2 = new THREE.PointLight(0xFFFFFF, 1, 1000 );
        light2.position.set(-100, -100, -200);    

        var ambientLight = new THREE.AmbientLight(0x222222);

        _threejs.scene.add(light1);
        _threejs.scene.add(light2); 

        _threejs.scene.add(ambientLight);
    },

    _fnCreatePlanes = function() {
        var planeGeometry = new THREE.BoxGeometry(_gameOptions.fieldWidth + _gameOptions.wallWidth*2, _gameOptions.planeThickness, _gameOptions.fieldLength);    
        var planeBottomMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.8, color: _gameOptions.fieldColor, shading: THREE.FlatShading, side: THREE.DoubleSide});
        var planeTopMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: _gameOptions.fieldColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _gameObjects.bottomPlane = new THREE.Mesh(planeGeometry, planeBottomMaterial);
        _gameObjects.bottomPlane.position.set(0, -(_gameOptions.fieldHeight+_gameOptions.planeThickness)/2, 0);
        _threejs.scene.add(_gameObjects.bottomPlane);     

        _gameObjects.topPlane = new THREE.Mesh(planeGeometry, planeTopMaterial);
        _gameObjects.topPlane.position.set(0, (_gameOptions.fieldHeight+_gameOptions.planeThickness)/2, 0);
        _threejs.scene.add(_gameObjects.topPlane);         
    },

    _fnCreateWalls = function() {
        var wallSideGeometry = new THREE.BoxGeometry(_gameOptions.wallWidth, _gameOptions.fieldHeight, _gameOptions.fieldLength);    
        var wallSideMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: _gameOptions.wallColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var rightWall = new THREE.Mesh(wallSideGeometry, wallSideMaterial);
        var leftWall = new THREE.Mesh(wallSideGeometry, wallSideMaterial);

        leftWall.position.set(-(_gameOptions.fieldWidth + _gameOptions.wallWidth)/2, 0, 0);
        rightWall.position.set((_gameOptions.fieldWidth + _gameOptions.wallWidth)/2, 0, 0);      

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

        var lineMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: _gameOptions.ballColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        var lineZGeometry = new THREE.CylinderGeometry(0.5, 0.5, _gameOptions.fieldLength, 20, 20);
        var lineXGeometry = new THREE.CylinderGeometry(0.5, 0.5, _gameOptions.fieldWidth, 20, 20);
         
        
        _gameObjects.lineZ = new THREE.Mesh(lineZGeometry, lineMaterial);   
        _gameObjects.lineZ.rotation.x = Math.PI /2; 
        _gameObjects.lineX = new THREE.Mesh(lineXGeometry, lineMaterial);          
        _gameObjects.lineX.rotation.z = Math.PI /2; 

        _threejs.scene.add(_gameObjects.lineZ);  
        _threejs.scene.add(_gameObjects.lineX);  
    },

    _fnCreatePaddles = function() {
        var paddleGeometry = new THREE.CubeGeometry(_gameOptions.paddleWidth, _gameOptions.paddleHeight, _gameOptions.paddleThickness);  

        var paddleHumanMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: _gameOptions.paddleHumanColor, shading: THREE.FlatShading, side: THREE.DoubleSide});
        var paddleComputerMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: _gameOptions.paddleComputerColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _gameObjects.humanPaddle = new THREE.Mesh(paddleGeometry, paddleHumanMaterial);
        _gameObjects.computerPaddle = new THREE.Mesh(paddleGeometry, paddleComputerMaterial);

        _threejs.scene.add(_gameObjects.humanPaddle);
        _threejs.scene.add(_gameObjects.computerPaddle);  

        _gameObjects.humanPaddle.position.set(0, _gameOptions.paddleHeight/2, (_gameOptions.fieldLength + _gameOptions.paddleThickness)/2);
        _gameObjects.computerPaddle.position.set(0, _gameOptions.paddleHeight/2, -(_gameOptions.fieldLength + _gameOptions.paddleThickness)/2);        
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
        var limits = _fnGetMaxPaddleDistanceFromCenter();

        if(_keysPressed.left && _gameObjects.humanPaddle.position.x > -limits.xDirection) {
            _gameObjects.humanPaddle.position.setX(_gameObjects.humanPaddle.position.x-_gameOptions.paddleHumanSpeed);
        } else if(_keysPressed.right  && _gameObjects.humanPaddle.position.x < limits.xDirection) {    
           _gameObjects.humanPaddle.position.setX(_gameObjects.humanPaddle.position.x+_gameOptions.paddleHumanSpeed);       
        } else if(_keysPressed.up  && _gameObjects.humanPaddle.position.y < limits.yDirection) {
            _gameObjects.humanPaddle.position.setY(_gameObjects.humanPaddle.position.y+_gameOptions.paddleHumanSpeed); 
        }  else if(_keysPressed.down  && _gameObjects.humanPaddle.position.y > -limits.yDirection) {
            _gameObjects.humanPaddle.position.setY(_gameObjects.humanPaddle.position.y-_gameOptions.paddleHumanSpeed); 
        }
    }, 

    _fnComputerPaddleMove = function() {
        var limits = _fnGetMaxPaddleDistanceFromCenter();

        // shift in the direction of the ball
        var shiftX = _gameObjects.ball.position.x - _gameObjects.computerPaddle.position.x;
        var shiftY = _gameObjects.ball.position.y - _gameObjects.computerPaddle.position.y;   

        console.log('original shiftX: ' + shiftX);
        console.log('original shiftY: ' + shiftY);    

        var directionX = shiftX > 0 ? 1 : -1;
        var directionY = shiftY > 0 ? 1 : -1;

        // restrict the speed of computer to give the human chance to win
        var actualBallSpeed = Math.sqrt(Math.pow(shiftX,2) + Math.pow(shiftY,2));
        if(actualBallSpeed > _gameOptions.paddleComputerMaxSpeed) {

            if (shiftX == 0) {
                shiftY = _gameOptions.paddleComputerMaxSpeed;
            } else if (shiftY == 0) {
                shiftX = _gameOptions.paddleComputerMaxSpeed;                
            } else {
                var ratio = Math.abs(shiftX / shiftY);
                var shiftYAbs = _gameOptions.paddleComputerMaxSpeed / Math.sqrt(Math.pow(ratio, 2) + 1);
                shiftX = (ratio * shiftYAbs) * directionX;
                shiftY = shiftYAbs * directionY;
                console.log('ratio: ' + ratio);   
            }
        }

        // make sure that paddle stays on the field
        if(_gameObjects.computerPaddle.position.x + shiftX > -limits.xDirection  && _gameObjects.computerPaddle.position.x + shiftX < limits.xDirection) {      
            _gameObjects.computerPaddle.position.x += shiftX;
        }

        if(_gameObjects.computerPaddle.position.y + shiftY > -limits.yDirection  && _gameObjects.computerPaddle.position.y + shiftY < limits.yDirection) {      
            _gameObjects.computerPaddle.position.y += shiftY;
        }

        console.log('calculated shiftX: ' + shiftX);
        console.log('calculated shiftY: ' + shiftY);   
    },    

    // calculate how far the center of the paddle is allowed to shift in x-direction
    _fnGetMaxPaddleDistanceFromCenter = function() {
        return {
            "xDirection": (_gameOptions.fieldWidth - _gameOptions.paddleWidth)/2,
            "yDirection": (_gameOptions.fieldHeight - _gameOptions.paddleHeight)/2
        };
    },

    _fnGetMaxBallDistanceFromCenter = function() {
        return {
            "xDirection": _gameOptions.fieldWidth/2 - _gameOptions.ballRadius,
            "yDirection": _gameOptions.fieldHeight/2 - _gameOptions.ballRadius
        };
    },    

    _fnBallMove = function(delta) {
        // if ball doesn't know where to go, set it direction by passing direction angles tangents
        if(!_ballSpeedComponents) {
            _fnSetBallSpeedComponents(1, 1);
        }

        var limits = _fnGetMaxBallDistanceFromCenter();

        // ball bounces back off the wall
        if(_gameObjects.ball.position.x >= limits.xDirection ||
            _gameObjects.ball.position.x <= -limits.xDirection) {
            _ballSpeedComponents.speedX = -_ballSpeedComponents.speedX;                
        }   

        if(_gameObjects.ball.position.y >= limits.yDirection ||
            _gameObjects.ball.position.y <= -limits.yDirection) {
            _ballSpeedComponents.speedY = -_ballSpeedComponents.speedY;                
        }          

        var paddleToInterceptBall = _fnPaddleToInterceptBall();

        // if it's the interception situation
        if(paddleToInterceptBall != null) {
            // check if the paddle actually intercepted the ball
            var wasIntercepted = _fnIsBallIntercepted(paddleToInterceptBall);
            var isHumanPaddle = _fnIsHumanPaddle(paddleToInterceptBall);  

            // if the ball was intercepted
            if(wasIntercepted) {  
                    _ballSpeedComponents.speedZ = -_ballSpeedComponents.speedZ;

                // // if it's human paddle the bounce logic is more interesting to introduce variability to the game.
                // // the bounce angle depends on how far from the center the ball struck the paddle.
                // if(isHumanPaddle) {
                //     _fnBallBounceOffPaddle(distanceFromPaddleCenter);  
                // } else {
                //     _ballSpeedComponents.speedZ = -_ballSpeedComponents.speedZ;
                // }         
            } else {
                _deltaSinceLastScoreChange = 0;

                if(isHumanPaddle) {
                    _gameObjects.scoreBoard.computerScore += 1;
                } else {
                    _gameObjects.scoreBoard.humanScore += 1;
                }

                _gameObjects.scoreBoard.updateScore();
                // handle score
                _fnResetGame(isHumanPaddle);  

                return;
            }
        }

        _gameObjects.ball.position.setX(_gameObjects.ball.position.x + _ballSpeedComponents.speedX);
        _gameObjects.ball.position.setY(_gameObjects.ball.position.y + _ballSpeedComponents.speedY);        
        _gameObjects.ball.position.setZ(_gameObjects.ball.position.z + _ballSpeedComponents.speedZ);  

        _gameObjects.lineZ.position.setX(_gameObjects.ball.position.x);   
        _gameObjects.lineZ.position.setY(_gameObjects.ball.position.y);  

        _gameObjects.lineX.position.setZ(_gameObjects.ball.position.z); 
        _gameObjects.lineX.position.setY(_gameObjects.ball.position.y);  
    },

    _fnBallBounceOffPaddle = function(distanceFromPaddleCenter) {
        var deltaAngle = Math.PI/6 * distanceFromPaddleCenter / (_gameOptions.paddleWidth / 2) - Math.PI/12;

        var minAngle = Math.Pi/12;
        var maxAngle = 5*Math.PI/12;

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

        _fnSetBallSpeedComponents(newAngleTan);

        _ballSpeedComponents.speedZ = Math.abs(_ballSpeedComponents.speedZ)*(-directionSignZ);
        _ballSpeedComponents.speedX = Math.abs(_ballSpeedComponents.speedX)*directionSignX;
    },

    _fnBallJump = function() {
        var unscaledHeight = Math.abs(Math.sin(2 * _deltaSinceLastScoreChange * 2 * Math.PI /_gameOptions.pauseAfterScoreChange));
        var hue = unscaledHeight;

        var heightRange = _gameOptions.fieldHeight - _gameOptions.ballRadius;

        _gameObjects.ball.position.setY(heightRange * unscaledHeight - heightRange/2);
        var currentHSL = _gameObjects.ball.material.color.getHSL();
        _gameObjects.ball.material.color.setHSL(hue, currentHSL.s, currentHSL.l);
    },

    _fnResetGame = function(isHumanPaddle) {
        _gameObjects.ball.position.setX(0);
        _gameObjects.ball.position.setY(0);        
        _gameObjects.ball.position.setZ(0); 

        _fnSetBallSpeedComponents(1, 1);

        if(isHumanPaddle) {
            _ballSpeedComponents.speedZ = -_ballSpeedComponents.speedZ;
        }
    },

    _fnIsHumanPaddle = function(paddle) {
        return paddle.position.z > 0;
    },

    _fnPaddleToInterceptBall = function() {
        // if the ball is about to cross the paddle line on either side return the paddle which should intercept the ball
        if(Math.abs(_gameObjects.ball.position.z) >= Math.abs(_gameOptions.fieldLength/2 - _gameOptions.ballRadius)) {
            return _gameObjects.ball.position.z > 0 ? _gameObjects.humanPaddle : _gameObjects.computerPaddle;
        } else {
            return null;
        }
    },

    _fnIsBallIntercepted = function(paddle) {
        return (
            _gameObjects.ball.position.x >= (paddle.position.x - _gameOptions.paddleWidth/2) &&
            _gameObjects.ball.position.x <= (paddle.position.x + _gameOptions.paddleWidth/2) 
            && 
            _gameObjects.ball.position.y >= (paddle.position.y - _gameOptions.paddleHeight/2) &&
            _gameObjects.ball.position.y <= (paddle.position.y + _gameOptions.paddleHeight/2)             
        );
    },

    _fnSetBallSpeedComponents = function(directionTangentXZ, directionTangentXY) {
        if(!_ballSpeedComponents) {
            _ballSpeedComponents = {};
        }

        _ballSpeedComponents.speedX = _gameOptions.ballSpeed/Math.sqrt(1 + Math.pow(directionTangentXZ,2) + Math.pow(directionTangentXY,2));
        _ballSpeedComponents.speedY = _ballSpeedComponents.speedX * directionTangentXY;
        _ballSpeedComponents.speedZ = _ballSpeedComponents.speedX * directionTangentXZ;
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
                case 38:
                    _keysPressed.up = true;
                    break;
                case 40:
                    _keysPressed.down = true;
                    break;
                case 72:
                    _keysPressed.rotateYForward = true;
                    break;     
                case 74:
                    _keysPressed.rotateXForward = true;
                    break;
                case 75:
                    _keysPressed.rotateYBackward = true;
                    break;  
                case 76:
                    _keysPressed.rotateXBackward = true;
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
                case 38:
                    _keysPressed.up = false;
                    break;
                case 40:
                    _keysPressed.down = false;
                    break;
                case 72:
                    _keysPressed.rotateYForward = false;
                    break;     
                case 74:
                    _keysPressed.rotateXForward = false;
                    break;
                case 75:
                    _keysPressed.rotateYBackward = false;
                    break;  
                case 76:
                    _keysPressed.rotateXBackward = false;
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
