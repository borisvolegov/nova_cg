/***********
 * pong.js
 * implementation of 3-D pong game 
 * Final Project for Computer Graphics class
 * B. Volegov
 * March 2016
 ***********/
"use strict";

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
    _gameOptions = {}, // obect to store actual game parameters. It's constructed by combining _defaultGameOptions and gameOptions parameters passed to fnInit function
    _defaultGameOptions = {
        "ballColor": "#ADFF2F",
        "ballRadius": 8,
        "ballSpeed": 45,     
        "cameraPosition": {"x": 0, "y": 200, "z": 600},
        "fieldColor": "#808080", 
        "fieldLength": 512,     
        "fieldWidth": 384, 
        "fieldHeight": 128,
        "gameInstructions": "Use arrow keys to move the paddle horizontally and vertically. Use <b>J</b> and <b>K</b> buttons to rotate the paddle.",                        
        "pauseAfterScoreChange": 5,                            
        "paddleWidth": 86,
        "paddleHeight": 64,
        "paddleThickness": 8,
        "paddleComputerColor": "#FF0000",          
        "paddleComputerMaxSpeed": 27,        
        "paddleHumanColor": "#0000FF",
        "paddleHumanSpeed": 6, 
        "paddleHumanRotationSpeed": Math.PI/12,
        "planeThickness": 4,
        "wallColor": "#F5F5DC",  
        "wallThickness": 4,
    }, //default game parameters to be used if no corresponding parameters are passed to fnInit fucntion.
     _controlOptions = {},  //dat.GUI control is configured to read values from and write values to this object.
    _gameObjects = {
        "bottomPlane": null,
        "topPlane": null,
        "ball": null,
        "lineZ" : null,
        "lineX" : null,        
        "humanPaddle": null,
        "computerPaddle": null,
        "leftWall": null,
        "rightWall": null,
        "scoreBoard": {
            "root": null,
            "humanScore": 0,
            "computerScore": 0
        }
    }, // all the scene graph objects
    _startRuntime = {
        "keysPressed": {left: false, right: false, up: false, down: false, rotateAroundYForward: false, rotateAroundYBackward: false}, // structure to capture the keys pressed.
        "ballSpeedComponents": null,    
        "deltaSinceLastScoreChange": 0,
        "isHumanLastScored": null,    
        "deltaSinceLastIntercept": -1,
        "isHumanLastIntercepted": null
    },  // object to contain the parameters that change at runtime 
    _runtime = null, 

    /*  fnInit function takes two arguments 
        gameCanvasElementID: DOM elementID of game container DIV
        gameOptions: any game parameters specified in this object will take precedence over default parameters.
        if an ampty object is passed for gameOptions, the values specified in _defaultGameOptions are used.
    */
    fnInit = function(gameCanvasElementID, gameOptions) {
        _gameCanvasElementID = gameCanvasElementID;        

        // _defaultGameOptions and gameOptions are combined to produce the actual _gameOptions which will be used.
        $.extend(_gameOptions, _defaultGameOptions, gameOptions);
        // _controlOptions is the object
        _controlOptions = $.extend({}, _gameOptions);

        // set _runtime to contain default values from _startRuntime
        _runtime = $.extend({}, _startRuntime);

        // building and initializing three.js objects (as usual)
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
        _threejs.renderer.shadowMap.enabled = true;
  
        _threejs.camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
        _threejs.camera.position.set(_gameOptions.cameraPosition.x, _gameOptions.cameraPosition.y, _gameOptions.cameraPosition.z);
        _threejs.camera.lookAt(new THREE.Vector3(0, 0, 0));

        _threejs.cameraControls = new THREE.OrbitControls(_threejs.camera, _threejs.renderer.domElement); 

        // constructing and adding 3D-pong objects to the scene
        _fnCreateScene();

        _fnCreateLights();

        _fnInitDatGUI();        

        _fnAddToDOM();

        _fnRender();

        _setKeyboard();

        _fnAnimate();        
    },



/************************************************************************************************/
//  all the _fnCreateXXXXXX methods
    _fnCreateScene = function() {
        // creating top and bottom planes
        _fnCreatePlanes();

        // creating walls
        _fnCreateWalls();

        // creating human and computer paddles
        _fnCreatePaddles();   

        // creating score board
        _fnCreateScoreBoard();

        // creating ball
        _fnCreateBall();
    },

    _fnClearScene = function() {
        _threejs.scene.remove(_gameObjects.bottomPlane);
        _threejs.scene.remove(_gameObjects.topPlane);        
        _threejs.scene.remove(_gameObjects.ball);   
        _threejs.scene.remove(_gameObjects.humanPaddle);  
        _threejs.scene.remove(_gameObjects.computerPaddle); 
        _threejs.scene.remove(_gameObjects.scoreBoard.root); 
        _threejs.scene.remove(_gameObjects.leftWall); 
        _threejs.scene.remove(_gameObjects.rightWall); 
    },    

    _fnCreatePlanes = function() {
        // 'width of the plane' is sum of 'width of the field' and thickness of both walls
        var planeGeometry = new THREE.BoxGeometry(_gameOptions.fieldWidth + _gameOptions.wallThickness*2, _gameOptions.planeThickness, _gameOptions.fieldLength);   

        var fieldColor = new THREE.Color(_gameOptions.fieldColor); 

        var planeBottomMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.8, color: fieldColor, shading: THREE.FlatShading, side: THREE.DoubleSide});
        var planeTopMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: fieldColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        // place the top plane half of the 'field hieght' above the 'y = 0' plane
        var planeTopPositionY = _gameOptions.fieldHeight/2 + _gameOptions.planeThickness/2;

        _gameObjects.topPlane = new THREE.Mesh(planeGeometry, planeTopMaterial);
        _gameObjects.topPlane.position.set(0, planeTopPositionY, 0);

        _gameObjects.bottomPlane = new THREE.Mesh(planeGeometry, planeBottomMaterial);
        _gameObjects.bottomPlane.position.set(0, -planeTopPositionY, 0);
        _gameObjects.bottomPlane.receiveShadow = true; // make bottom plane to receive shadow from the ball

        _threejs.scene.add(_gameObjects.bottomPlane);     
        _threejs.scene.add(_gameObjects.topPlane);         
    },

    _fnCreateWalls = function() {
        var wallColor = new THREE.Color(_gameOptions.wallColor);
        var wallSideGeometry = new THREE.BoxGeometry(_gameOptions.wallThickness, _gameOptions.fieldHeight, _gameOptions.fieldLength);    
        var wallSideMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: wallColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _gameObjects.rightWall = new THREE.Mesh(wallSideGeometry, wallSideMaterial);
        _gameObjects.leftWall = new THREE.Mesh(wallSideGeometry, wallSideMaterial);

        // place the right wall half of the 'field width' to the right of the 'x = 0' plane
        var wallRightPositionX = _gameOptions.fieldWidth/2 + _gameOptions.wallThickness/2;

        _gameObjects.leftWall.position.set(-wallRightPositionX, 0, 0);
        _gameObjects.rightWall.position.set(wallRightPositionX, 0, 0);           

        _threejs.scene.add(_gameObjects.rightWall);  
        _threejs.scene.add(_gameObjects.leftWall);   
    },

    _fnCreatePaddles = function() {
        var paddleGeometry = new THREE.CubeGeometry(_gameOptions.paddleWidth, _gameOptions.paddleHeight, _gameOptions.paddleThickness);  

        var paddleHumanColor = new THREE.Color(_gameOptions.paddleHumanColor);
        var paddleHumanMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: paddleHumanColor, shading: THREE.FlatShading, side: THREE.DoubleSide});        

        var paddleComputerColor = new THREE.Color(_gameOptions.paddleComputerColor);
        var paddleComputerMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.4, color: paddleComputerColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _gameObjects.humanPaddle = new THREE.Mesh(paddleGeometry, paddleHumanMaterial);
        _gameObjects.computerPaddle = new THREE.Mesh(paddleGeometry, paddleComputerMaterial);

        _threejs.scene.add(_gameObjects.humanPaddle);
        _threejs.scene.add(_gameObjects.computerPaddle);  

        // place the human paddle half of the 'field length' in front of the 'z = 0' plane
        var paddleHumanPositionZ = _gameOptions.fieldLength/2 + _gameOptions.paddleThickness/2;

        _gameObjects.humanPaddle.position.set(0, 0, paddleHumanPositionZ);
        _gameObjects.computerPaddle.position.set(0, 0, -paddleHumanPositionZ);  
    },  

    _fnCreateScoreBoard = function() {
        // create Object3D to represent the entire scoreboard
        _gameObjects.scoreBoard.root = new THREE.Object3D(); 

        _threejs.scene.add(_gameObjects.scoreBoard.root);

        // place scoreboard above the 3D field
        // use 'y = 144' by default or if the fieldHeight is too large calculate a reasonable value
        _gameObjects.scoreBoard.root.position.setY(Math.max(144, _gameOptions.fieldHeight/2 + _gameOptions.planeThickness + 24));        

        var paddleHumanColor = new THREE.Color(_gameOptions.paddleHumanColor);
        var paddleComputerColor = new THREE.Color(_gameOptions.paddleComputerColor);

        var scoreHuman = _fnCreateScoreBoardPiece(_gameObjects.scoreBoard.humanScore, paddleHumanColor, -64);
        var scoreDivider = _fnCreateScoreBoardPiece(" : ", new THREE.Color("white"), 0);  
        var scoreComputer = _fnCreateScoreBoardPiece(_gameObjects.scoreBoard.computerScore, paddleComputerColor, 64); 

        // create the updateScore function on _gameObjects.scoreBoard object
        // the function updates backing score properties and re-render the entire scoreboard
        _gameObjects.scoreBoard.updateScore = function()  {         
            _threejs.scene.remove(_gameObjects.scoreBoard.root);
            _fnCreateScoreBoard();
        };

        _gameObjects.scoreBoard.incrementScore = function(isHumanPaddle)  {
            if(isHumanPaddle) {
                _gameObjects.scoreBoard.computerScore += 1;
            } else {
                _gameObjects.scoreBoard.humanScore += 1;
            }

            _gameObjects.scoreBoard.updateScore();
        };        
    }, 

    _fnCreateScoreBoardPiece = function(text, color, translateX) {
        var fontLoader = new THREE.FontLoader();
        fontLoader.load("fonts/helvetiker_bold.typeface.js", function (font) {
            var scorePieceGeometry = new THREE.TextGeometry(text, {font: font, weight:"bold", size: 24, height: 2, curveSegments: 3, bevelEnabled: false}); 

            var scorePieceMaterial = new THREE.MeshBasicMaterial({color: color});
        
            scorePieceGeometry.center(); 

            var scorePiece = new THREE.Mesh(scorePieceGeometry, scorePieceMaterial);

            // move scorePiece to the right or left of the scoreboard center
            scorePiece.translateX(translateX);
            _gameObjects.scoreBoard.root.add(scorePiece);
        });  
    },  

    _fnCreateBall = function() {
        var ballGeometry = new THREE.SphereGeometry(_gameOptions.ballRadius, 32, 32);  
        var ballColor = new THREE.Color(_gameOptions.ballColor);
        var ballMaterial = new THREE.MeshLambertMaterial({transparent: false, color: ballColor, shading: THREE.FlatShading, side: THREE.DoubleSide});

        _gameObjects.ball = new THREE.Mesh(ballGeometry, ballMaterial);

        _threejs.scene.add(_gameObjects.ball);    

        // pladce the ball in the middle of the field
        _gameObjects.ball.position.setX(0);
        _gameObjects.ball.position.setY(0);
        _gameObjects.ball.position.setZ(0);

        // make the ball cast shadow
        _gameObjects.ball.castShadow = true;
    },

//  done with all the _fnCreateXXXXXX methods
/************************************************************************************************/


    
    _fnCreateLights = function() {
        // crete a directional light to support shading
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 1, 1000 );
        light1.position.set(0, 250, 300);
        light1.castShadow = true;

        //set parameters for shadow camera
        light1.shadow.camera.near = 100;
        light1.shadow.camera.far = 1000;
        light1.shadow.camera.left = -250;
        light1.shadow.camera.right = 250;
        light1.shadow.camera.top = 250;
        light1.shadow.camera.bottom = -250;   

        _threejs.scene.add(light1);     

        var ambientLight = new THREE.AmbientLight(0x222222);
        _threejs.scene.add(ambientLight);    
    },   

    // init the dat.GUI control 
    _fnInitDatGUI = function() {
        var gui = new dat.GUI({width: 500});

        // do not attach to any onChange handler as this is read-only text for game instructions
        gui.add(_gameOptions, 'gameInstructions').name('Game instructions:');


        // ball parameters
        var ballFolder = gui.addFolder('Parameters of the ball');

        var ballColor = ballFolder.addColor(_controlOptions, 'ballColor').name('Color of the ball');
        ballColor.onChange(function(value) {_controlOptions.ballColor = value;}); 

        var ballRadius = ballFolder.add(_controlOptions, 'ballRadius', 1, 16).name('Radius of the ball').step(0.1);
        ballRadius.onChange(function(value) {_controlOptions.ballRadius = value;});   

        var ballSpeed = ballFolder.add(_controlOptions, 'ballSpeed', 15, 150).name('Speed of the ball');
        ballSpeed.onChange(function(value) {_controlOptions.ballSpeed = value;}); 


        // field parameters
        var fieldFolder = gui.addFolder('Parameters of the field');        

        var fieldColor = fieldFolder.addColor(_controlOptions, 'fieldColor').name('Color of the field');
        fieldColor.onChange(function(value) {_controlOptions.fieldColor = value;});

        var fieldLength = fieldFolder.add(_controlOptions, 'fieldLength', 100, 600).name('Length of the field');
        fieldLength.onChange(function(value) {_controlOptions.fieldLength = value;}); 

        var fieldWidth = fieldFolder.add(_controlOptions, 'fieldWidth', 100, 600).name('Width of the field');
        fieldWidth.onChange(function(value) {_controlOptions.fieldWidth = value;});  

        var fieldHeight = fieldFolder.add(_controlOptions, 'fieldHeight', 100, 600).name('Height of the field');
        fieldHeight.onChange(function(value) {_controlOptions.fieldHeight = value;});  

        var planeThickness = fieldFolder.add(_controlOptions, 'planeThickness', 0.1, 10).name('Thickness of the top/bottom planes').step(0.1);
        planeThickness.onChange(function(value) {_controlOptions.planeThickness = value;}); 

        var wallColor = fieldFolder.addColor(_controlOptions, 'wallColor').name('Color of the walls');
        wallColor.onChange(function(value) {_controlOptions.wallColor = value;});

        var wallThickness = fieldFolder.add(_controlOptions, 'wallThickness', 0.1, 10).name('Thickness of the walls').step(0.1);
        wallThickness.onChange(function(value) {_controlOptions.wallThickness = value;}); 
 

        // paddle parameters
        var paddleFolder = gui.addFolder('Parameters of the paddles');  

        var paddleHumanColor = paddleFolder.addColor(_controlOptions, 'paddleHumanColor').name('Color of the human paddle');
        paddleHumanColor.onChange(function(value) {_controlOptions.paddleHumanColor = value;});

        var paddleComputerColor = paddleFolder.addColor(_controlOptions, 'paddleComputerColor').name('Color of the computer paddle');
        paddleComputerColor.onChange(function(value) {_controlOptions.paddleComputerColor = value;});        

        var paddleWidth = paddleFolder.add(_controlOptions, 'paddleWidth', 20, 160).name('Width of the paddle');
        paddleWidth.onChange(function(value) {_controlOptions.paddleWidth = value;}); 

        var paddleHeight = paddleFolder.add(_controlOptions, 'paddleHeight', 10, 100).name('Height of the paddle');
        paddleHeight.onChange(function(value) {_controlOptions.paddleHeight = value;}); 

        var paddleThickness = paddleFolder.add(_controlOptions, 'paddleThickness', 1, 12).name('Thickness of the paddle');
        paddleThickness.onChange(function(value) {_controlOptions.paddleThickness = value;});  

        var paddleComputerMaxSpeed = paddleFolder.add(_controlOptions, 'paddleComputerMaxSpeed', 10, 50).name('Speed limit of the computer paddle');
        paddleComputerMaxSpeed.onChange(function(value) {_controlOptions.paddleComputerMaxSpeed = value;});     

        var paddleHumanSpeed = paddleFolder.add(_controlOptions, 'paddleHumanSpeed', 1, 16).name('Speed of the human paddle').step(0.1);
        paddleHumanSpeed.onChange(function(value) {_controlOptions.paddleHumanSpeed = value;});  
 
        // apply the specified settings   
        gui.add(matrixresort.pong, 'updateSettings').name('Update settings');

        // reset score (but keep the current settings)
        gui.add(matrixresort.pong, 'resetScore').name('Reset score');        
    },      

    fnUpdateSettings = function(){
        // populate actual _gameOptions from the options stored in _controlOptions (set by dat.GUI)
        $.extend(_gameOptions, _controlOptions);

        // reset all the runtime game parameters
        _fnResetGame();    

        // recreate scene using new _gameOptions
        _fnClearScene();
        _fnCreateScene();
    },  

    fnResetScore = function() {
        if(_gameObjects != null && _threejs.scene != null) {
            // reset all the runtime game parameters
            _fnResetGame();
        }

        _gameObjects.scoreBoard.updateScore();
    },

    //reset all the runtime parameters
   _fnResetGame = function() {
        _gameObjects.scoreBoard.humanScore = 0;
        _gameObjects.scoreBoard.computerScore = 0;

        // set _runtime to contain default values from _startRuntime
        _runtime = $.extend({}, _startRuntime); 
    },
    
    _fnAddToDOM = function() {
        var container = document.getElementById(_gameCanvasElementID);
        var canvas = container.getElementsByTagName('canvas');
        if (canvas.length>0) {
            container.removeChild(canvas[0]);
        }

        container.appendChild(_threejs.renderer.domElement);

        // finding the first line in dat.GUI menu and replacing its content with div containing game instructions
        var menuGameInstructions = $("div.dg.main.a li.cr.string:first-child");
        menuGameInstructions.attr("id", "gameInfo");
        var gameInstructionsInput = menuGameInstructions.find("div.c input[type='text']");
        gameInstructionsInput.replaceWith($("<div style='color:#2FA1D6'>" + gameInstructionsInput.val() + "</div>"));
    },

    _fnRender = function() {
        var delta = _threejs.clock.getDelta();
        _threejs.cameraControls.update(delta);
        _threejs.renderer.render(_threejs.scene, _threejs.camera);

        if (_runtime.deltaSinceLastScoreChange == -1) {
            _fnHumanPaddleMove();
            _fnComputerPaddleMove(delta);            
            _fnBallMove(delta);       
        } else if (_runtime.deltaSinceLastScoreChange > _gameOptions.pauseAfterScoreChange) {
            _runtime.deltaSinceLastScoreChange = -1;
            _fnContinueGame();
        } else {
            _runtime.deltaSinceLastScoreChange += delta;               
            _fnBallJump();         
        }

        if(_runtime.deltaSinceLastIntercept >= 0) {
            _runtime.deltaSinceLastIntercept += delta;              
            _fnPaddleWobble();            
        }  
    },        

    _fnHumanPaddleMove = function() {
        var paddleRotationLimitAngle = 5*Math.PI/12;
        var paddleRotationAngleIncrement = Math.PI/12;

        var humanPaddle = _gameObjects.humanPaddle;
        var limits  = _fnGetMaxPaddleDistanceFromCenter(humanPaddle.rotation.y);

        if(_runtime.keysPressed.left)  {
            humanPaddle.position.setX(humanPaddle.position.x-_gameOptions.paddleHumanSpeed);
            if(humanPaddle.position.x < -limits.xDirection) {
                humanPaddle.position.setX(-limits.xDirection);
            }
        } else if(_runtime.keysPressed.right) {    
           humanPaddle.position.setX(humanPaddle.position.x+_gameOptions.paddleHumanSpeed);  
            if(humanPaddle.position.x > limits.xDirection) {
                humanPaddle.position.setX(limits.xDirection);
            }         
        } else if(_runtime.keysPressed.up) {
            humanPaddle.position.setY(humanPaddle.position.y+_gameOptions.paddleHumanSpeed); 
            if(humanPaddle.position.y > limits.yDirection) {
                humanPaddle.position.setY(limits.yDirection);
            }             
        } else if(_runtime.keysPressed.down) {
            humanPaddle.position.setY(humanPaddle.position.y-_gameOptions.paddleHumanSpeed); 
            if(humanPaddle.position.y < -limits.yDirection) {
                humanPaddle.position.setY(-limits.yDirection);
            }               
        } else if(_runtime.keysPressed.rotateAroundYForward) {  
            var newLimits  = _fnGetMaxPaddleDistanceFromCenter(humanPaddle.rotation.y + Math.PI/12); 
            if(humanPaddle.position.x >= -newLimits.xDirection && humanPaddle.position.x <= newLimits.xDirection && humanPaddle.rotation.y + paddleRotationAngleIncrement <= paddleRotationLimitAngle) {
                humanPaddle.rotation.y += paddleRotationAngleIncrement;
            }
        } else if(_runtime.keysPressed.rotateAroundYBackward) {
            var newLimits  = _fnGetMaxPaddleDistanceFromCenter(humanPaddle.rotation.y + Math.PI/12); 
            if(humanPaddle.position.x >= -newLimits.xDirection && humanPaddle.position.x <= newLimits.xDirection && humanPaddle.rotation.y - paddleRotationAngleIncrement >= -paddleRotationLimitAngle) {
                humanPaddle.rotation.y -= paddleRotationAngleIncrement;
            }         
        }        
    }, 

    _fnComputerPaddleMove = function(delta) {
        var limits = _fnGetMaxPaddleDistanceFromCenter(0);

        // shift in the direction of the ball
        var shiftX = _gameObjects.ball.position.x - _gameObjects.computerPaddle.position.x;
        var shiftY = _gameObjects.ball.position.y - _gameObjects.computerPaddle.position.y;   

        var directionX = shiftX > 0 ? 1 : -1;
        var directionY = shiftY > 0 ? 1 : -1;

        var paddleComputerMaxAllowedShift = _gameOptions.paddleComputerMaxSpeed * delta;

    // restrict the speed of computer to give the human chance to win
        // shift required to get to ball current location
        var ballLocationShift = Math.sqrt(Math.pow(shiftX,2) + Math.pow(shiftY,2));        
        if(ballLocationShift > paddleComputerMaxAllowedShift) {
            // if there is no X component, paddle moves only in Y direction
            if (shiftX == 0) {
                shiftY = paddleComputerMaxAllowedShift;
            // if there is no Y component, paddle moves only in X direction                
            } else if (shiftY == 0) {
                shiftX = _gameOptions.paddleComputerMaxSpeed;
            // given total speed value, calculate its X and Y components.                                   
            } else {
                var ratio = Math.abs(shiftX / shiftY);
                var shiftYAbs = _gameOptions.paddleComputerMaxSpeed * delta / Math.sqrt(Math.pow(ratio, 2) + 1);
                shiftX = (ratio * shiftYAbs) * directionX;
                shiftY = shiftYAbs * directionY;
            }
        }

        // make sure that paddle stays on the field
        if(_gameObjects.computerPaddle.position.x + shiftX > -limits.xDirection  && _gameObjects.computerPaddle.position.x + shiftX < limits.xDirection) {      
            _gameObjects.computerPaddle.position.x += shiftX;
        }

        if(_gameObjects.computerPaddle.position.y + shiftY > -limits.yDirection  && _gameObjects.computerPaddle.position.y + shiftY < limits.yDirection) {      
            _gameObjects.computerPaddle.position.y += shiftY;
        }
    },    

    // calculate how far the center of the paddle is allowed to shift in x-direction
    _fnGetMaxPaddleDistanceFromCenter = function(rotationAngle) {
        var paddleWidthAdjustedForRotation = _gameOptions.paddleWidth;

        if(rotationAngle !== 0) {
            paddleWidthAdjustedForRotation = _gameOptions.paddleWidth * Math.abs(Math.cos(rotationAngle)) + _gameOptions.paddleThickness * Math.abs(Math.sin(rotationAngle));
        }

        return {
            "xDirection": (_gameOptions.fieldWidth - paddleWidthAdjustedForRotation)/2,
            "yDirection": (_gameOptions.fieldHeight - _gameOptions.paddleHeight)/2
        };
    },

    _fnGetMaxBallDistanceFromCenter = function() {
        return {
            "xDirection": _gameOptions.fieldWidth/2 - _gameOptions.ballRadius,
            "yDirection": _gameOptions.fieldHeight/2 - _gameOptions.ballRadius
        };
    },   

    _fnPaddleWobble  = function() {
        var paddle = _runtime.isHumanLastIntercepted ? _gameObjects.humanPaddle : _gameObjects.computerPaddle;
        var timeToWobble = 1;

        var unscaledOffset = 0;
        if(_runtime.deltaSinceLastIntercept > timeToWobble) {
            unscaledOffset = 0;
            _runtime.deltaSinceLastIntercept = -1;
        } else {
            unscaledOffset = Math.sin(_runtime.deltaSinceLastIntercept *  Math.PI / timeToWobble);
        }

        var wobbleDirection = _runtime.isHumanLastIntercepted ? 1 : -1;
        var newZ = ((_gameOptions.fieldLength + _gameOptions.paddleThickness)/2 + 32 * unscaledOffset) * wobbleDirection;

        paddle.position.setZ(newZ);
    },

    _fnGetLogInfo = function(wasIntercepted) {
        var logInfo = wasIntercepted ? "Intercepted!\n" : "Missed\n";
        logInfo+= "ball position: [x: " + _gameObjects.ball.position.x + "]" + ", [y: " + _gameObjects.ball.position.y + "]" + ", [z: " + _gameObjects.ball.position.z + "]\n";
        var transformedBallPosition = _fnConvertCoordinatesY(_gameObjects.ball.position, _gameObjects.humanPaddle.rotation.y);
        logInfo += "ball transformed position: [x: " + transformedBallPosition.x + "]" + ", [y: " + transformedBallPosition.y + "]" + ", [z: " + transformedBallPosition.z + "]\n";
        logInfo += "paddle center position: [x: " + _gameObjects.humanPaddle.position.x + "]" + ", [y: " + _gameObjects.humanPaddle.position.y + "]" + ", [z: " + (_gameObjects.humanPaddle.position.z+_gameOptions.paddleThickness) + "]\n";                  
        var transformedPaddlePosition = _fnConvertCoordinatesY(new THREE.Vector3(_gameObjects.humanPaddle.position.x, _gameObjects.humanPaddle.position.y, _gameObjects.humanPaddle.position.z - _gameOptions.paddleThickness/2), _gameObjects.humanPaddle.rotation.y);
        logInfo += "paddle center transformed position: [x: " + transformedPaddlePosition.x + "]" + ", [y: " + transformedPaddlePosition.y + "]" + ", [z: " + transformedPaddlePosition.z + "]\n";  
        logInfo += "paddle rotation angle: " + _gameObjects.humanPaddle.rotation.y;

        return logInfo;
    },


    _fnBallMove = function(delta) {
        var limits = _fnGetMaxBallDistanceFromCenter();

        var paddleToInterceptBall = _fnPaddleToInterceptBall();

        // if it's the interception situation
        if(paddleToInterceptBall != null) {
            // check if the paddle actually intercepted the ball
            var wasIntercepted = _fnIsBallIntercepted(paddleToInterceptBall);
            var isHumanPaddle = _fnIsHumanPaddle(paddleToInterceptBall);  

            // if the ball was intercepted
            if(wasIntercepted) {  

                _runtime.deltaSinceLastIntercept = 0;
                _runtime.isHumanLastIntercepted = isHumanPaddle;

                if(isHumanPaddle && _gameObjects.humanPaddle.rotation.y != 0) {
                    var logInfo = "speed: [x: " + _runtime.ballSpeedComponents.x + "], [y: " + _runtime.ballSpeedComponents.y + "], [z: " + _runtime.ballSpeedComponents.z + "]\n";
                    var ballSpeedVectorTranslated = _fnConvertCoordinatesY(_runtime.ballSpeedComponents, _gameObjects.humanPaddle.rotation.y);
                    logInfo += "translated current speed: [x: " + ballSpeedVectorTranslated.x + "], [y: " + ballSpeedVectorTranslated.y + "], [z: " + ballSpeedVectorTranslated.z + "]\n";                    
                    ballSpeedVectorTranslated.z = -ballSpeedVectorTranslated.z;
                    logInfo += "translated bounced speed: [x: " + ballSpeedVectorTranslated.x + "], [y: " + ballSpeedVectorTranslated.y + "], [z: " + ballSpeedVectorTranslated.z + "]\n";                      
                    var ballSpeedComponentsAfterBouncing = _fnConvertCoordinatesY(ballSpeedVectorTranslated, -_gameObjects.humanPaddle.rotation.y);
                    logInfo += "bounced speed: [x: " + ballSpeedComponentsAfterBouncing.x + "], [y: " + ballSpeedComponentsAfterBouncing.y + "], [z: " + ballSpeedComponentsAfterBouncing.z + "]\n";                                        

                    console.log(logInfo);

                    _runtime.ballSpeedComponents.x = ballSpeedComponentsAfterBouncing.x;
                    _runtime.ballSpeedComponents.y = ballSpeedComponentsAfterBouncing.z;
                } else {
                    _runtime.ballSpeedComponents.z = -_runtime.ballSpeedComponents.z;               
                }

                if(isHumanPaddle) {
                    console.log(_fnGetLogInfo(true));
                }
                    

                // // if it's human paddle the bounce logic is more interesting to introduce variability to the game.
                // // the bounce angle depends on how far from the center the ball struck the paddle.
                // if(isHumanPaddle) {
                //     _fnBallBounceOffPaddle(distanceFromPaddleCenter);  
                // } else {
                //     _runtime.ballSpeedComponents.speedZ = -_runtime.ballSpeedComponents.speedZ;
                // }         
            } else if(Math.abs(_gameObjects.ball.position.z) > _gameOptions.fieldWidth/2) {
                _runtime.deltaSinceLastScoreChange = 0;
                _gameObjects.scoreBoard.incrementScore(isHumanPaddle);

                _runtime.isHumanLastScored = !isHumanPaddle;

                if(isHumanPaddle) {
                    console.log(_fnGetLogInfo(false));
                }

                return;
            }
        }


        _gameObjects.ball.position.setX(_gameObjects.ball.position.x + _runtime.ballSpeedComponents.x * delta);
        _gameObjects.ball.position.setY(_gameObjects.ball.position.y + _runtime.ballSpeedComponents.y * delta);        
        _gameObjects.ball.position.setZ(_gameObjects.ball.position.z + _runtime.ballSpeedComponents.z * delta);  

        // ball bounces back off the walls or top/bottom planes
        if(_gameObjects.ball.position.x >= limits.xDirection) {
            _gameObjects.ball.position.setX(limits.xDirection);
            _runtime.ballSpeedComponents.x = -_runtime.ballSpeedComponents.x;   
        } 

        if(_gameObjects.ball.position.x <= -limits.xDirection) {
            _gameObjects.ball.position.setX(-limits.xDirection);
            _runtime.ballSpeedComponents.x = -_runtime.ballSpeedComponents.x;   
        } 

        if(_gameObjects.ball.position.y >= limits.yDirection) {
            _gameObjects.ball.position.setY(limits.yDirection);
            _runtime.ballSpeedComponents.y = -_runtime.ballSpeedComponents.y;   
        }  

        if(_gameObjects.ball.position.y <= -limits.yDirection) {
            _gameObjects.ball.position.setY(-limits.yDirection);
            _runtime.ballSpeedComponents.y = -_runtime.ballSpeedComponents.y;   
        } 

        // _gameObjects.lineZ.position.setX(_gameObjects.ball.position.x);   
        // _gameObjects.lineZ.position.setY(_gameObjects.ball.position.y);  

        // _gameObjects.lineX.position.setZ(_gameObjects.ball.position.z); 
        // _gameObjects.lineX.position.setY(_gameObjects.ball.position.y);  
    },

    _fnBallBounceOffPaddle = function(distanceFromPaddleCenter) {
        var deltaAngle = Math.PI/6 * distanceFromPaddleCenter / (_gameOptions.paddleWidth / 2) - Math.PI/12;

        var minAngle = Math.Pi/12;
        var maxAngle = 5*Math.PI/12;

        var newAngle = Math.abs(Math.atan(_runtime.ballSpeedComponents.x / _runtime.ballSpeedComponents.z)) + deltaAngle;

        if(newAngle < minAngle) {
            newAngle =  minAngle;
        }  

        if(newAngle > maxAngle) {
            newAngle = maxAngle;
        } 

        var newAngleTan = Math.tan(newAngle);

        directionSignZ = _runtime.ballSpeedComponents.z > 0 ? 1 : -1;
        directionSignX = _runtime.ballSpeedComponents.x > 0 ? 1 : -1;

        _fnSetBallSpeedComponents(newAngleTan);

        _runtime.ballSpeedComponents.z = Math.abs(_runtime.ballSpeedComponents.z)*(-directionSignZ);
        _runtime.ballSpeedComponents.x = Math.abs(_runtime.ballSpeedComponents.x)*directionSignX;
    },

    _fnBallJump = function() {
        if(_runtime.deltaSinceLastScoreChange < _gameOptions.pauseAfterScoreChange / 3) {
            _gameObjects.ball.material.color = _runtime.isHumanLastScored ? new THREE.Color(_gameOptions.paddleHumanColor) : new THREE.Color(_gameOptions.paddleComputerColor);
        } else {
            _gameObjects.ball.position.setX(0);
            _gameObjects.ball.position.setY(0);        
            _gameObjects.ball.position.setZ(0); 

            var limits = _fnGetMaxBallDistanceFromCenter();

            var unscaledHeight = Math.abs(Math.sin(2 * _runtime.deltaSinceLastScoreChange * 2 * Math.PI /_gameOptions.pauseAfterScoreChange));
            var hue = unscaledHeight;

            _gameObjects.ball.position.setY(limits.yDirection * unscaledHeight - limits.yDirection/2);
            var currentHSL = _gameObjects.ball.material.color.getHSL();
            _gameObjects.ball.material.color.setHSL(hue, currentHSL.s, currentHSL.l);
        }
    },

    _fnContinueGame = function() {
        _gameObjects.ball.material.color.set(_gameOptions.ballColor);
                   
        _gameObjects.ball.position.setX(0);
        _gameObjects.ball.position.setY(0);        
        _gameObjects.ball.position.setZ(0); 

        // if ball doesn't know where to go, set it direction by passing direction angles tangents
        _fnSetBallSpeedComponents(1, 1);

        if(_runtime.isHumanLastScored == null) {
            _runtime.isHumanLastScored = _fnGetRandomBoolean();              
        }
        
        if(!_runtime.isHumanLastScored) {
            _runtime.ballSpeedComponents.z = -_runtime.ballSpeedComponents.z;
        }
    },

    _fnGetRandomBoolean = function() {
        return Math.random() < 0.5 ? false : true;                      
    },

    _fnIsHumanPaddle = function(paddle) {
        return paddle.position.z > 0;
    },

    _fnPaddleToInterceptBall = function() {
        if(Math.abs(_gameObjects.ball.position.z) < _gameOptions.fieldLength/2 - _gameOptions.paddleWidth/2){
            return null;
        }

        if(Math.abs(_gameObjects.ball.position.z) > (_gameOptions.fieldLength + _gameOptions.paddleWidth)/2) {
            return _gameObjects.ball.position.z > 0 ? _gameObjects.humanPaddle : _gameObjects.computerPaddle;
        }

        var newBallCoordinates = _gameObjects.ball.position;
        var paddlePlaneRotatedZ = _gameOptions.fieldLength/2;

        if(_gameObjects.ball.position.z > 0) {
            if(_gameObjects.humanPaddle.rotation.y != 0) {
                newBallCoordinates = _fnConvertCoordinatesY(_gameObjects.ball.position, _gameObjects.humanPaddle.rotation.y);               
                paddlePlaneRotatedZ = _fnConvertCoordinatesY(new THREE.Vector3(_gameObjects.humanPaddle.position.x, _gameObjects.humanPaddle.position.y, _gameOptions.fieldLength/2), _gameObjects.humanPaddle.rotation.y).z;
            }
        }

        // if the ball is about to cross the paddle line on either side return the paddle which should intercept the ball
        if(Math.abs(newBallCoordinates.z) >= Math.abs(paddlePlaneRotatedZ - _gameOptions.ballRadius)) {
            if(_gameObjects.ball.position.z > 0) {
                console.log("Inside: _fnPaddleToInterceptBall" + _fnGetLogInfo(true));
            }
            return _gameObjects.ball.position.z > 0 ? _gameObjects.humanPaddle : _gameObjects.computerPaddle;
        } else {
            return null;
        }
    },

    _fnIsBallIntercepted = function(paddle) {
        var newBallCoordinates = _gameObjects.ball.position;
        var newRotatedXOfPaddleCeneter = paddle.position.x;
        var paddlePlaneRotatedZ = _gameOptions.fieldLength/2;

        if(Math.abs(newBallCoordinates.z) > (_gameOptions.fieldLength + _gameOptions.paddleWidth)/2) {
            return false;
        }

        if(_fnIsHumanPaddle(paddle)) {
            if(_gameObjects.humanPaddle.rotation.y != 0) {
                newBallCoordinates = _fnConvertCoordinatesY(_gameObjects.ball.position, _gameObjects.humanPaddle.rotation.y);
                paddlePlaneRotatedZ = _fnConvertCoordinatesY(new THREE.Vector3(_gameObjects.humanPaddle.position.x, _gameObjects.humanPaddle.position.y, _gameOptions.fieldLength/2), _gameObjects.humanPaddle.rotation.y).z;
                newRotatedXOfPaddleCeneter = _fnConvertCoordinatesY(_gameObjects.humanPaddle.position, _gameObjects.humanPaddle.rotation.y).x;
            }
        }        

        return (
            (
                newBallCoordinates.x >= (newRotatedXOfPaddleCeneter - _gameOptions.paddleWidth/2) &&
                newBallCoordinates.x <= (newRotatedXOfPaddleCeneter + _gameOptions.paddleWidth/2) 
                || 
                newBallCoordinates.x >= (newRotatedXOfPaddleCeneter - _gameOptions.paddleWidth/2 - _gameOptions.ballRadius) &&
                _gameObjects.ball.position.x + _gameOptions.fieldWidth/2 < _gameOptions.ballRadius 
                ||
                newBallCoordinates.x <= (newRotatedXOfPaddleCeneter + _gameOptions.paddleWidth/2 + _gameOptions.ballRadius) &&
                _gameOptions.fieldWidth/2 - _gameObjects.ball.position.x < _gameOptions.ballRadius               
            )            
            && 
            (
                _gameObjects.ball.position.y >= (paddle.position.y - _gameOptions.paddleHeight/2) &&
                _gameObjects.ball.position.y <= (paddle.position.y + _gameOptions.paddleHeight/2) 
                ||
                _gameObjects.ball.position.y >= (paddle.position.y - _gameOptions.paddleHeight/2 - _gameOptions.ballRadius) &&
                _gameObjects.ball.position.y + _gameOptions.fieldHeight/2 < _gameOptions.ballRadius 
                ||
                _gameObjects.ball.position.y <= (paddle.position.y + _gameOptions.paddleHeight/2 + _gameOptions.ballRadius) &&
                _gameOptions.fieldHeight/2 - _gameObjects.ball.position.y < _gameOptions.ballRadius                
            )
        );
    },

    _fnConvertCoordinatesY = function(originalCoordinates, rotationAngleAroundY) {
        var z = originalCoordinates.z * Math.cos(rotationAngleAroundY) + originalCoordinates.x * Math.sin(rotationAngleAroundY);
        var x = originalCoordinates.x * Math.cos(rotationAngleAroundY) - originalCoordinates.z * Math.sin(rotationAngleAroundY);

        return new THREE.Vector3(x, originalCoordinates.y, z);
    }, 

    // _fnGetRotatedZCoordinateOfHumanPaddleY = function() {
    //     var paddle = _gameObjects.humanPaddle;
    //     return 1/2*(Math.cos(paddle.rotation.y)*(_gameOptions.paddleThickness+_gameOptions.fieldLength)-_gameOptions.paddleThickness);
    // },

    _fnSetBallSpeedComponents = function(directionTangentXZ, directionTangentXY) {
        if(!_runtime.ballSpeedComponents) {
            _runtime.ballSpeedComponents = new THREE.Vector3(0,0,0);
        }

        _runtime.ballSpeedComponents.x = _gameOptions.ballSpeed/Math.sqrt(1 + Math.pow(directionTangentXZ,2) + Math.pow(directionTangentXY,2));
        _runtime.ballSpeedComponents.y = _runtime.ballSpeedComponents.x * directionTangentXY;
        _runtime.ballSpeedComponents.z = _runtime.ballSpeedComponents.x * directionTangentXZ;
    },

    _setKeyboard = function() {
        $(document).keydown(function (e) {
                var preventEventPropogation = true;

                switch(e.keyCode) {
                case 37:
                    _runtime.keysPressed.left = true;
                    break;
                case 39:
                    _runtime.keysPressed.right = true;
                    break;
                case 38:
                    _runtime.keysPressed.up = true;
                    break;
                case 40:
                    _runtime.keysPressed.down = true;
                    break;
                case 72:
                    _runtime.keysPressed.rotateAroundXForward = true;
                    break;     
                case 74:
                    _runtime.keysPressed.rotateAroundYForward = true;
                    break;
                case 75:
                    _runtime.keysPressed.rotateAroundYBackward = true;
                    break;  
                case 76:
                    _runtime.keysPressed.rotateAroundXBackward = true;
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
                    _runtime.keysPressed.left = false;
                    break;
                case 39:
                    _runtime.keysPressed.right = false;
                    break;
                case 38:
                    _runtime.keysPressed.up = false;
                    break;
                case 40:
                    _runtime.keysPressed.down = false;
                    break;
                case 72:
                    _runtime.keysPressed.rotateAroundXForward = false;
                    break;    
                case 74:
                    _runtime.keysPressed.rotateAroundYForward = false;
                    break;
                case 75:
                    _runtime.keysPressed.rotateAroundYBackward = false;
                    break;  
                case 76:
                    _runtime.keysPressed.rotateAroundXBackward = false;
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

    _fnAnimate = function() {
        window.requestAnimationFrame(_fnAnimate);
        _fnRender();
    };

    return {
        init: fnInit,
        updateSettings: fnUpdateSettings,
        resetScore: fnResetScore        
    };       

})(jQuery);

matrixresort.pong.init('container', {});
