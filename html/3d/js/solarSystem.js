/***********
 * solarSystem.js
 * B. Volegov
 * February 2016
 ***********/
(function() { 
    var camera, scene, renderer;
    var cameraControls;
    var clock = new THREE.Clock();
    var mat;
    var solarSystem;
    var angleStep = Math.PI/2;

    /* Solar System object definition */
    function SolarSystem() {};
    SolarSystem.prototype = new THREE.Object3D();
    /* the method returns an object for celestial body. 
        the object returned by this method is not assigned as satellite to some other body by defult.
        in order to add the newly created object as satellite to some parent celestial body, 
        the newly created object should be passed as a parameter to 'addSatellite' method of the parent object 
        together with orbit parameters.
    */
    SolarSystem.prototype.createCelestialBody = function(radius, color, name) {        
        var celestialBodyGroup = new CelestialBodyGroup(radius, color, name);

        if(!this.celestialBodies) {
            this.celestialBodies = [];
        }
        this.celestialBodies.push(celestialBodyGroup);

        return celestialBodyGroup;   
    };
    /* the method returns an object for the central celestial body (Sun in case of solar system)
        This central body is the root of the hierarchy.
        In this simplified model the central body is statically in the center (it doesn't wobble). 
        This way there is no need to recalculate its position.
    */  
    SolarSystem.prototype.createCentralCelestialBody = function(radius, color, name) {
        var centralCelestialBodyGroup = this.createCelestialBody(radius, color, name);
        centralCelestialBodyGroup.isSatellite = false;
        this.add(centralCelestialBodyGroup);   
        return centralCelestialBodyGroup;
    };  

    /* Celestial body group object definition */
    function CelestialBodyGroup(radius, color, name) {
        THREE.Object3D.call(this);

        this.root = createSphere(radius, color);

        this.add(this.root);

        this.name = name;
    };
    CelestialBodyGroup.prototype = new THREE.Object3D();
    CelestialBodyGroup.prototype.constructor = CelestialBodyGroup;
    // method that calculates position given time interval delta
    CelestialBodyGroup.prototype.updateSatellitePosition = function(delta) {
            this.angle += 2*Math.PI * delta / this.rotationRate;
            this.rotation.z = this.angle;      
    };
    // method that adds a satellite with the specified orbital parameters to the root celestial body (adds Moon to Earth as an example, or adds Earth to Sun)
    CelestialBodyGroup.prototype.addSatellite = function(satelliteGroup, distance, rotationRate, angle) {
            satelliteGroup.root.translateX(distance);
            satelliteGroup.isSatellite = true;
            satelliteGroup.rotationRate = rotationRate;
            satelliteGroup.angle = angle;
            satelliteGroup.rotation.z = angle;
            this.root.add(satelliteGroup);   
    };

    function createSolarSystem() {
        var solarSystem = new SolarSystem();

        var sunGroup = solarSystem.createCentralCelestialBody(10, 'yellow', 'Sun');

        var mercuryGroup = solarSystem.createCelestialBody(1, 'gray', 'Mercury');
        sunGroup.addSatellite(mercuryGroup, 18, 3, Math.PI/4);

        var venusGroup = solarSystem.createCelestialBody(2, 'orange', 'Venus');
        sunGroup.addSatellite(venusGroup, 25, 6, 3*Math.PI/2);


        var earthGroup = solarSystem.createCelestialBody(2, 'blue', 'Earth');
        sunGroup.addSatellite(earthGroup, 35, 8, 0);

        var moonGroup = solarSystem.createCelestialBody(0.7, 'white', 'Moon');
        earthGroup.addSatellite(moonGroup, 5, 1, 0); 


        var marsGroup = solarSystem.createCelestialBody(1.2, 'red', 'Mars');
        sunGroup.addSatellite(marsGroup, 50, 16, 0);

        var phobosGroup = solarSystem.createCelestialBody(0.1, 'gray', 'Phobos');
        marsGroup.addSatellite(phobosGroup, 1.5, 0.5, 0);

        var deimosGroup = solarSystem.createCelestialBody(0.1, 'gray', 'Deimos');
        marsGroup.addSatellite(deimosGroup, 3, 1, 0);        

        return solarSystem;
    }

    function createSphere(radius, color) {
        var sphereMaterial = new THREE.MeshLambertMaterial({color: color});
        var sphereGeometry = new THREE.SphereGeometry(radius, 20, 20);
        return new THREE.Mesh(sphereGeometry, sphereMaterial);
    }

    function createScene(m, n, offset) {
        solarSystem = createSolarSystem();
        scene.add(solarSystem);

        // light
        var light = new THREE.PointLight(0xFFFFFF, 1, 1000 );
        light.position.set(30, 30, 30);
        var ambientLight = new THREE.AmbientLight(0x222222);

        scene.add(light);
        scene.add(ambientLight);
    }


    function animate() {
    	window.requestAnimationFrame(animate);
    	render();
    }

    function render() {
        var delta = clock.getDelta();

        if(solarSystem.celestialBodies) {
            for(var i = 0; i < solarSystem.celestialBodies.length; i++) {
                var celestialBody = solarSystem.celestialBodies[i];  
                if(celestialBody.isSatellite)  {    
                    celestialBody.updateSatellitePosition(delta);  
                }      
            }
        }

    	cameraControls.update(delta);
    	renderer.render(scene, camera);   
    }

    function init() {
    	var canvasWidth = window.innerWidth;
    	var canvasHeight = window.innerHeight;
    	var canvasRatio = canvasWidth / canvasHeight;

    	scene = new THREE.Scene();

    	renderer = new THREE.WebGLRenderer({antialias : true});
    	renderer.gammaInput = true;
    	renderer.gammaOutput = true;
    	renderer.setSize(canvasWidth, canvasHeight);
    	renderer.setClearColor(0x000000, 1.0);
    	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
    	camera.position.set(0, 0, 120);
    	camera.lookAt(new THREE.Vector3(0, 0, 0));
    	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    }


    function showGrids() {
    	Coordinates.drawGrid({size:100,scale:1,orientation:"z"});
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

	init();
	createScene(9, 9);
//    showGrids();
	addToDOM();
    render();
	animate();
})();

