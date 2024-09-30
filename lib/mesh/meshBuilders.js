
"use strict" ;

/* global BABYLON, earcut */

// Derived from:
// https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Meshes/Builders/polygonBuilder.ts
// https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Meshes/polygonMesh.ts
/* eslint-disable camelcase */

const Vector2 = BABYLON.Vector2 ;
const Vector3 = BABYLON.Vector3 ;
const Vector4 = BABYLON.Vector4 ;
const Color4 = BABYLON.Color4 ;
const Mesh = BABYLON.Mesh ;
const VertexData = BABYLON.VertexData ;
const VertexBuffer = BABYLON.VertexBuffer ;
const EngineStore = BABYLON.EngineStore ;
const Epsilon = BABYLON.Epsilon ;
//const PolygonMeshBuilder = BABYLON.PolygonMeshBuilder ;
const useOpenGLOrientationForUV = BABYLON.useOpenGLOrientationForUV ;



const meshBuilders = {} ;
module.exports = meshBuilders ;



/**
 * Creates a polygon mesh
 * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh
 * * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors
 * * You can set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4)
 * * Remember you can only change the shape positions, not their number when updating a polygon
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @param earcutInjection can be used to inject your own earcut reference
 * @returns the polygon mesh
 */
meshBuilders.extrudePolygon = ( name , options = {} , scene = null , earcutInjection = earcut ) => {
	options.sideOrientation = Mesh._GetDefaultSideOrientation( options.sideOrientation ) ;
	const shape = options.shape ;
	const depth = options.depth || 0 ;
	const smoothingThreshold = options.smoothingThreshold || 2 ;
	const contours = [] ;

	for ( let i = 0 ; i < shape.length ; i ++ ) {
		contours[i] = new Vector2( shape[i].x , shape[i].z ) ;
	}
	const epsilon = 0.00000001 ;
	if ( contours[0].equalsWithEpsilon( contours[contours.length - 1] , epsilon ) ) {
		contours.pop() ;
	}

	const polygonTriangulation = new PolygonMeshBuilder( name , contours , scene || EngineStore.LastCreatedScene , earcutInjection ) ;

	//updatability is set during applyToMesh; setting to true in triangulation build produces errors
	const polygon = polygonTriangulation.build( false , depth , smoothingThreshold ) ;
	polygon._originalBuilderSideOrientation = options.sideOrientation ;
	const vertexData = meshBuilders.createPolygonVertexData( polygon , options.sideOrientation , options.faceUV , options.faceColors , options.frontUVs , options.backUVs , options.wrap ) ;
	vertexData.applyToMesh( polygon , options.updatable ) ;

	return polygon ;
} ;

/**
 * Creates the VertexData for an irregular Polygon in the XoZ plane using a mesh built by polygonTriangulation.build()
 * All parameters are provided by CreatePolygon as needed
 * @param polygon a mesh built from polygonTriangulation.build()
 * @param sideOrientation takes the values Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * @param fUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
 * @param fColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
 * @param frontUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * @param backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @param wrp a boolean, default false, when true and fUVs used texture is wrapped around all sides, when false texture is applied side
 * @returns the VertexData of the Polygon
 */
meshBuilders.createPolygonVertexData = ( polygon , sideOrientation , fUV = null , fColors = null , frontUVs = null , backUVs = null , wrp = null ) => {
	const faceUV = fUV || new Array( 3 ) ;
	const faceColors = fColors ;
	const colors = [] ;
	const wrap = wrp || false ;

	// default face colors and UV if undefined
	for ( let f = 0 ; f < 3 ; f ++ ) {
		if ( faceUV[f] === undefined ) {
			faceUV[f] = new Vector4( 0 , 0 , 1 , 1 ) ;
		}
		if ( faceColors && faceColors[f] === undefined ) {
			faceColors[f] = new Color4( 1 , 1 , 1 , 1 ) ;
		}
	}

	const positions = polygon.getVerticesData( VertexBuffer.PositionKind ) ;
	const normals = polygon.getVerticesData( VertexBuffer.NormalKind ) ;
	const uvs = polygon.getVerticesData( VertexBuffer.UVKind ) ;
	const indices = polygon.getIndices() ;
	const startIndex = positions.length / 9 ;
	let disp = 0 ;
	let distX = 0 ;
	let distZ = 0 ;
	let dist = 0 ;
	let totalLen = 0 ;
	const cumulate = [ 0 ] ;
	if ( wrap ) {
		for ( let idx = startIndex ; idx < positions.length / 3 ; idx += 4 ) {
			distX = positions[3 * ( idx + 2 )] - positions[3 * idx] ;
			distZ = positions[3 * ( idx + 2 ) + 2] - positions[3 * idx + 2] ;
			dist = Math.sqrt( distX * distX + distZ * distZ ) ;
			totalLen += dist ;
			cumulate.push( totalLen ) ;
		}
	}
	// set face colours and textures
	let idx = 0 ;
	let face = 0 ;
	for ( let index = 0 ; index < normals.length ; index += 3 ) {
		//Edge Face  no. 1
		if ( Math.abs( normals[index + 1] ) < 0.001 ) {		// y = 0	=> the side
			face = 1 ;
		}
		//Top Face  no. 0
		if ( Math.abs( normals[index + 1] - 1 ) < 0.001 ) {	// y = 1
			face = 0 ;
		}
		//Bottom Face  no. 2
		if ( Math.abs( normals[index + 1] + 1 ) < 0.001 ) {	// y = -1
			face = 2 ;
		}
		idx = index / 3 ;
		if ( face === 1 ) {	// the side
			disp = idx - startIndex ;
			if ( disp % 4 < 1.5 ) {
				if ( wrap ) {
					uvs[2 * idx] = faceUV[face].x + ( ( faceUV[face].z - faceUV[face].x ) * cumulate[Math.floor( disp / 4 )] ) / totalLen ;
				}
				else {
					uvs[2 * idx] = faceUV[face].x ;
				}
			}
			else {
				if ( wrap ) {
					uvs[2 * idx] = faceUV[face].x + ( ( faceUV[face].z - faceUV[face].x ) * cumulate[Math.floor( disp / 4 ) + 1] ) / totalLen ;
				}
				else {
					uvs[2 * idx] = faceUV[face].z ;
				}
			}
			if ( disp % 2 === 0 ) {
				uvs[2 * idx + 1] = useOpenGLOrientationForUV ? 1.0 - faceUV[face].w : faceUV[face].w ;
			}
			else {
				uvs[2 * idx + 1] = useOpenGLOrientationForUV ? 1.0 - faceUV[face].y : faceUV[face].y ;
			}
		}
		else {
			uvs[2 * idx] = ( 1 - uvs[2 * idx] ) * faceUV[face].x + uvs[2 * idx] * faceUV[face].z ;
			uvs[2 * idx + 1] = ( 1 - uvs[2 * idx + 1] ) * faceUV[face].y + uvs[2 * idx + 1] * faceUV[face].w ;

			if ( useOpenGLOrientationForUV ) {
				uvs[2 * idx + 1] = 1.0 - uvs[2 * idx + 1] ;
			}
		}
		if ( faceColors ) {
			colors.push( faceColors[face].r , faceColors[face].g , faceColors[face].b , faceColors[face].a ) ;
		}
	}

	// sides
	VertexData._ComputeSides( sideOrientation , positions , indices , normals , uvs , frontUVs , backUVs ) ;

	// Result
	const vertexData = new VertexData() ;
	vertexData.indices = indices ;
	vertexData.positions = positions ;
	vertexData.normals = normals ;
	vertexData.uvs = uvs ;

	if ( faceColors ) {
		const totalColors = sideOrientation === VertexData.DOUBLESIDE ? colors.concat( colors ) : colors ;
		vertexData.colors = totalColors ;
	}

	return vertexData ;
} ;



/**
 * Builds a polygon
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/polyMeshBuilder
 */
class PolygonMeshBuilder {
	_name = null ;
	_scene = null ;

	_points = [] ;
	_outlinepoints = [] ;
	_epoints = [] ;
	_bounds ;

	// Babylon reference to the earcut plugin.
	bjsEarcut = null ;

	/**
	 * Creates a PolygonMeshBuilder
	 * @param name name of the builder
	 * @param contours Path of the polygon
	 * @param scene scene to add to when creating the mesh
	 * @param earcutInjection can be used to inject your own earcut reference
	 */
	constructor( name , points , scene , earcutInjection = earcut ) {
		this.bjsEarcut = earcutInjection ;
		this._name = name ;
		this._scene = scene || EngineStore.LastCreatedScene ;

		this._points = points.slice() ;
		this._outlinepoints = points.slice() ;
		points.forEach( point => this._epoints.push( point.x , point.y ) ) ;
		this.computeBounds() ;

		if ( this.bjsEarcut === undefined ) {
			console.warn( "Earcut was not found, the polygon will not be built." ) ;
		}
	}



	/**
	 * Creates the polygon
	 * @param updatable If the mesh should be updatable
	 * @param depth The depth of the mesh created
	 * @param smoothingThreshold Dot product threshold for smoothed normals
	 * @returns the created mesh
	 */
	build( updatable = false , depth = 0 , smoothingThreshold = 2 ) {
		const mesh = new Mesh( this._name , this._scene ) ;

		const vertexData = this.buildVertexData( depth , smoothingThreshold ) ;

		mesh.setVerticesData( VertexBuffer.PositionKind , vertexData.positions , updatable ) ;
		mesh.setVerticesData( VertexBuffer.NormalKind , vertexData.normals , updatable ) ;
		mesh.setVerticesData( VertexBuffer.UVKind , vertexData.uvs , updatable ) ;
		mesh.setIndices( vertexData.indices ) ;

		return mesh ;
	}

	/**
	 * Creates the polygon
	 * @param depth The depth of the mesh created
	 * @param smoothingThreshold Dot product threshold for smoothed normals
	 * @returns the created VertexData
	 */
	buildVertexData( depth = 0 , smoothingThreshold = 2 ) {
		const vertexData = new VertexData() ;
		const normals = [] ;
		const positions = [] ;
		const uvs = [] ;

		// Add the top-face
		this._points.forEach( ( p ) => {
			normals.push( 0 , 1.0 , 0 ) ;
			positions.push( p.x , 0 , p.y ) ;
			uvs.push( ( p.x - this._bounds.min.x ) / this._bounds.width , ( p.y - this._bounds.min.y ) / this._bounds.height ) ;
		} ) ;

		const indices = [] ;

		const earcutPoints = this.bjsEarcut( this._epoints ) ;

		for ( let i = 0 ; i < earcutPoints.length ; i ++ ) {
			indices.push( earcutPoints[i] ) ;
		}

		if ( depth > 0 ) {
			// Add the bottom-face
			const positionscount = positions.length / 3 ; //get the current pointcount

			this._points.forEach( ( p ) => {
				//add the elements at the depth
				normals.push( 0 , - 1.0 , 0 ) ;
				positions.push( p.x , - depth , p.y ) ;
				uvs.push( 1 - ( p.x - this._bounds.min.x ) / this._bounds.width , 1 - ( p.y - this._bounds.min.y ) / this._bounds.height ) ;
			} ) ;

			const totalCount = indices.length ;
			// indices get reversed for each tris, so front-face/back-face is correct
			for ( let i = 0 ; i < totalCount ; i += 3 ) {
				const i0 = indices[i + 0] ;
				const i1 = indices[i + 1] ;
				const i2 = indices[i + 2] ;

				indices.push( i2 + positionscount ) ;
				indices.push( i1 + positionscount ) ;
				indices.push( i0 + positionscount ) ;
			}

			// Add the sides
			this._addSide( positions , normals , uvs , indices , this._bounds , this._outlinepoints , depth , false , smoothingThreshold ) ;
		}

		vertexData.indices = indices ;
		vertexData.positions = positions ;
		vertexData.normals = normals ;
		vertexData.uvs = uvs ;

		return vertexData ;
	}

	/**
	 * Adds a side to the polygon
	 * @param positions points that make the polygon
	 * @param normals normals of the polygon
	 * @param uvs uvs of the polygon
	 * @param indices indices of the polygon
	 * @param bounds bounds of the polygon
	 * @param points points of the polygon
	 * @param depth depth of the polygon
	 * @param flip flip of the polygon
	 * @param smoothingThreshold
	 */
	_addSide( positions , normals , uvs , indices , bounds , points , depth , flip , smoothingThreshold ) {
		let startIndex = positions.length / 3 ;
		let ulength = 0 ;
		for ( let i = 0 ; i < points.length ; i ++ ) {
			const p = points[i] ;
			const p1 = points[( i + 1 ) % points.length] ;

			positions.push( p.x , 0 , p.y ) ;
			positions.push( p.x , - depth , p.y ) ;
			positions.push( p1.x , 0 , p1.y ) ;
			positions.push( p1.x , - depth , p1.y ) ;

			const p0 = points[( i + points.length - 1 ) % points.length] ;
			const p2 = points[( i + 2 ) % points.length] ;

			let vc = new Vector3( - ( p1.y - p.y ) , 0 , p1.x - p.x ) ;
			let vp = new Vector3( - ( p.y - p0.y ) , 0 , p.x - p0.x ) ;
			let vn = new Vector3( - ( p2.y - p1.y ) , 0 , p2.x - p1.x ) ;

			if ( ! flip ) {
				vc = vc.scale( - 1 ) ;
				vp = vp.scale( - 1 ) ;
				vn = vn.scale( - 1 ) ;
			}

			const vc_norm = vc.normalizeToNew() ;
			let vp_norm = vp.normalizeToNew() ;
			let vn_norm = vn.normalizeToNew() ;

			const dotp = Vector3.Dot( vp_norm , vc_norm ) ;
			if ( dotp > smoothingThreshold ) {
				if ( dotp < Epsilon - 1 ) {
					vp_norm = new Vector3( p.x , 0 , p.y ).subtract( new Vector3( p1.x , 0 , p1.y ) ).normalize() ;
				}
				else {
					// cheap average weighed by side length
					vp_norm = vp.add( vc ).normalize() ;
				}
			}
			else {
				vp_norm = vc_norm ;
			}

			const dotn = Vector3.Dot( vn , vc ) ;
			if ( dotn > smoothingThreshold ) {
				if ( dotn < Epsilon - 1 ) {
					// back to back
					vn_norm = new Vector3( p1.x , 0 , p1.y ).subtract( new Vector3( p.x , 0 , p.y ) ).normalize() ;
				}
				else {
					// cheap average weighed by side length
					vn_norm = vn.add( vc ).normalize() ;
				}
			}
			else {
				vn_norm = vc_norm ;
			}

			uvs.push( ulength / bounds.width , 0 ) ;
			uvs.push( ulength / bounds.width , 1 ) ;
			ulength += vc.length() ;
			uvs.push( ulength / bounds.width , 0 ) ;
			uvs.push( ulength / bounds.width , 1 ) ;

			normals.push( vp_norm.x , vp_norm.y , vp_norm.z ) ;
			normals.push( vp_norm.x , vp_norm.y , vp_norm.z ) ;
			normals.push( vn_norm.x , vn_norm.y , vn_norm.z ) ;
			normals.push( vn_norm.x , vn_norm.y , vn_norm.z ) ;

			if ( ! flip ) {
				indices.push( startIndex ) ;
				indices.push( startIndex + 1 ) ;
				indices.push( startIndex + 2 ) ;

				indices.push( startIndex + 1 ) ;
				indices.push( startIndex + 3 ) ;
				indices.push( startIndex + 2 ) ;
			}
			else {
				indices.push( startIndex ) ;
				indices.push( startIndex + 2 ) ;
				indices.push( startIndex + 1 ) ;

				indices.push( startIndex + 1 ) ;
				indices.push( startIndex + 2 ) ;
				indices.push( startIndex + 3 ) ;
			}
			startIndex += 4 ;
		}
	}

	computeBounds() {
		const lmin = new Vector2(this._points[0].x, this._points[0].y);
		const lmax = new Vector2(this._points[0].x, this._points[0].y);

		this._points.forEach( point => {
			// x
			if (point.x < lmin.x) {
				lmin.x = point.x;
			} else if (point.x > lmax.x) {
				lmax.x = point.x;
			}

			// y
			if (point.y < lmin.y) {
				lmin.y = point.y;
			} else if (point.y > lmax.y) {
				lmax.y = point.y;
			}
		});

		this._bounds = {
			min: lmin,
			max: lmax,
			width: lmax.x - lmin.x,
			height: lmax.y - lmin.y,
		};
	}
}
