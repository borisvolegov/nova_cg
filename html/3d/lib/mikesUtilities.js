

MikesTetrahedronGeometry = function(a, b, c, d) {
	THREE.Geometry.call(this);
	this.vertices.push(a);
	this.vertices.push(b);
	this.vertices.push(c);
	this.vertices.push(d);
	var faces = [
		[ 2, 1, 0 ], [ 0, 3, 2 ], [ 1, 3, 0 ], [ 2, 3, 1 ]
	];
	for (var i = 0; i < 4; i++) {
		var f = new THREE.Face3(faces[i][0], faces[i][1], faces[i][2]);
		this.faces.push(f);
	}
	this.computeCentroids();
	var globalCentroid = addVectorsList([a, b, c, d]).divide(4);
	var rad = globalCentroid.distanceTo(a);
	this.boundingSphere = new THREE.SphereGeometry(globalCentroid, rad);
	this.computeFaceNormals();
}

MikesTetrahedronGeometry.prototype = Object.create( THREE.Geometry.prototype );



MikesTriangleGeometry = function(a, b, c) {
	THREE.Geometry.call(this);
	this.vertices.push(a);
	this.vertices.push(b);
	this.vertices.push(c);
	var v1 = (new THREE.Vector3()).subVectors(b, a);
	var v2 = (new THREE.Vector3()).subVectors(c, a);
	var n = (new THREE.Vector3()).crossVectors(v1, v2).normalize();
	var face = new THREE.Face3(0, 1, 2);
	this.faces.push(face);
	this.computeCentroids();
	var centroid = this.faces[0].centroid;
	var rad = centroid.distanceTo(a);
	this.boundingSphere = new THREE.SphereGeometry(centroid, rad);
	this.computeFaceNormals();
}

MikesTriangleGeometry.prototype = Object.create( THREE.Geometry.prototype );



addVectorsList = function(vecs) {
	var res = new THREE.Vector3();
	for (var i = 0; i < vecs.length; i++) {
		res.addVectors(res, vecs[i]);
	}
	return res;
}

