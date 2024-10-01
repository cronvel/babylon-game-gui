
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



/**
 * Builds a polygon
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/polyMeshBuilder
 */
class PolygonMeshBuilder {
	_name = null ;
	_scene = null ;
	_shapePoints ;
	_hasTop = true ;	// build the top face?
	_hasSide = false ;	// build the side faces?
	_hasBottom = false ;	// build the bottom face?
	_depth = 0 ;	// the depth of the extrusion, if depth=0, force _hasSide and _hasBottom to false
	_sideOrientation ;
	_smoothingThreshold ;
	_faceUV ;	// DEPRECATED, to be removed
	_faceColors ;	// DEPRECATED, to be removed
	_topFaceUV ;
	_topFaceColor ;
	_bottomFaceUV ;
	_bottomFaceColor ;
	_sideFaceUV ;
	_sideFaceColor ;
	_frontUVs ;
	_backUVs ;
	_wrapSideUV = false ;
	_updatable = false ;

	_bounds ;
	_earcutIndices ;
	_vertexData = null ;

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
	 * @returns the polygon mesh
	 */
	constructor( name , shapePoints , options = {} , scene = null ) {
		this._name = name ;
		this._scene = scene || EngineStore.LastCreatedScene ;
		this._shapePoints = Array.from( shapePoints ) ;	// options.shape, this._points
		this._depth = + options.depth || 0 ;
		this._hasTop = options.top !== undefined ? !! options.top : true ;
		this._hasSide = options.side !== undefined ? !! options.side : !! this._depth ;
		this._hasBottom = options.bottom !== undefined ? !! options.bottom : !! this._depth ;
		this._sideOrientation = Mesh._GetDefaultSideOrientation( options.sideOrientation ) ;
		this._smoothingThreshold = + options.smoothingThreshold || 2 ;
		this._faceUV = options.faceUV || new Array( 3 ) ;
		this._faceColors = options.faceColors ;
		this._topFaceUV = options.topFaceUV ;
		this._topFaceColor = options.topFaceColor ;
		this._bottomFaceUV = options.bottomFaceUV ;
		this._bottomFaceColor = options.bottomFaceColor ;
		this._sideFaceUV = options.sideFaceUV ;
		this._sideFaceColor = options.sideFaceColor ;
		this._frontUVs = options.frontUVs ;
		this._backUVs = options.backUVs ;
		this._wrapSideUV = !! options.wrapSideUV ;	// options.wrap
		this._updatable = !! options.updatable ;

		if ( ! this._depth ) {
			this._hasSide = this._hasBottom = false ;
		}

		// face colors if undefined
		if ( this._topFaceColor || this._bottomFaceColor || this._sideFaceColor ) {
			if ( ! this._topFaceColor ) { this._topFaceColor = new Color4( 1 , 1 , 1 , 1 ) ; }
			if ( ! this._bottomFaceColor ) { this._bottomFaceColor = new Color4( 1 , 1 , 1 , 1 ) ; }
			if ( ! this._sideFaceColor ) { this._sideFaceColor = new Color4( 1 , 1 , 1 , 1 ) ; }
		}

		this._computeBounds() ;
	}



	// Build the mesh
	build() {
		// Create the mesh
		const mesh = new Mesh( this._name , this._scene ) ;

		// Create vertex data
		this._buildVertexData() ;

		// Apply vertex data to the mesh
		// updatability MUST be set to false during the triangulation process (it would produce errors),
		// it will be set during .applyToMesh()
		mesh.setVerticesData( VertexBuffer.PositionKind , this._vertexData.positions , false ) ;
		mesh.setVerticesData( VertexBuffer.NormalKind , this._vertexData.normals , false ) ;
		mesh.setVerticesData( VertexBuffer.UVKind , this._vertexData.uvs , false ) ;
		mesh.setIndices( this._vertexData.indices ) ;
		return mesh ;

		
		// This was inside another function, it should be fused properly
		mesh._originalBuilderSideOrientation = this._sideOrientation ;
		const vertexData2 = this._buildVertexData_2( mesh ) ;
		vertexData2.applyToMesh( mesh , this._updatable ) ;

		return mesh ;
	}



	_buildVertexData() {
		if ( this._vertexData ) { return ; }

		this._vertexData = new VertexData() ;
		this._vertexData.positions = [] ;
		this._vertexData.normals = [] ;
		this._vertexData.uvs = [] ;
		this._vertexData.indices = [] ;
		this._vertexData.colors = [] ;

		if ( this._hasTop ) { this._buildTopFaceVertexData() ; }
		if ( this._hasBottom ) { this._buildBottomFaceVertexData() ; }
		if ( this._hasSide ) { this._buildSideFacesVertexData( false ) ; }
	}



	_buildTopFaceVertexData() {
		const { positions , normals , uvs , indices } = this._vertexData ;
		const faceUV = this._topFaceUV ;
		const faceColor = this._topFaceColor ;
		const indiceOffset = positions.length / 3 ;	// There is 1 indice for 3 positions

		if ( ! this._earcutIndices ) { this._buildEarcutIndices() ; }

		this._shapePoints.forEach( ( p ) => {
			normals.push( 0 , 1.0 , 0 ) ;
			positions.push( p.x , 0 , p.y ) ;

			// Place vertex UV relative to its position
			let u = ( p.x - this._bounds.min.x ) / this._bounds.width ;
			let v = ( p.y - this._bounds.min.y ) / this._bounds.height ;

			// If there is a specific top face UV region...
			if ( faceUV ) {
				u = ( 1 - u ) * faceUV.x + u * faceUV.z ;
				v = ( 1 - v ) * faceUV.y + v * faceUV.w ;
			}

			if ( useOpenGLOrientationForUV ) { v = 1 - v ; }
			
			uvs.push( u , v ) ;

			if ( faceColor ) {
				colors.push( faceColor.r , faceColor.g , faceColor.b , faceColor.a ) ;
			}
		} ) ;

		for ( let i = 0 ; i < this._earcutIndices.length ; i ++ ) {
			indices.push( indiceOffset + this._earcutIndices[ i ] ) ;
		}
	}



	_buildBottomFaceVertexData() {
		const { positions , normals , uvs , indices } = this._vertexData ;
		const faceUV = this._bottomFaceUV ;
		const faceColor = this._bottomFaceColor ;
		const indiceOffset = positions.length / 3 ;	// There is 1 indice for 3 positions

		if ( ! this._earcutIndices ) { this._buildEarcutIndices() ; }

		this._shapePoints.forEach( ( p ) => {
			//add the elements at the depth
			normals.push( 0 , - 1.0 , 0 ) ;
			positions.push( p.x , - this._depth , p.y ) ;

			// Place vertex UV relative to its *inverted* position
			let u = 1 - ( p.x - this._bounds.min.x ) / this._bounds.width ;
			let v = 1 - ( p.y - this._bounds.min.y ) / this._bounds.height ;

			// If there is a specific top face UV region...
			if ( faceUV ) {
				u = ( 1 - u ) * faceUV.x + u * faceUV.z ;
				v = ( 1 - v ) * faceUV.y + v * faceUV.w ;
			}

			if ( useOpenGLOrientationForUV ) { v = 1 - v ; }
			
			uvs.push( u , v ) ;

			if ( faceColor ) {
				colors.push( faceColor.r , faceColor.g , faceColor.b , faceColor.a ) ;
			}
		} ) ;

		// indices get reversed for each tris, so front-face/back-face is correct
		for ( let i = 0 ; i < this._earcutIndices.length ; i += 3 ) {
			indices.push( indiceOffset + this._earcutIndices[ i + 2 ] ) ;
			indices.push( indiceOffset + this._earcutIndices[ i + 1 ] ) ;
			indices.push( indiceOffset + this._earcutIndices[ i + 0 ] ) ;
		}
	}



	// flip: flip normals, indices, etc...
	_buildSideFacesVertexData( flip ) {
		const { positions , normals , uvs , indices } = this._vertexData ;
		let indiceOffset = positions.length / 3 ;	// There is 1 indice for 3 positions

		let ulength = 0 ;

		for ( let i = 0 ; i < this._shapePoints.length ; i ++ ) {
			const p = this._shapePoints[i] ;
			const p1 = this._shapePoints[( i + 1 ) % this._shapePoints.length] ;

			positions.push( p.x , 0 , p.y ) ;
			positions.push( p.x , - this._depth , p.y ) ;
			positions.push( p1.x , 0 , p1.y ) ;
			positions.push( p1.x , - this._depth , p1.y ) ;

			const p0 = this._shapePoints[( i + this._shapePoints.length - 1 ) % this._shapePoints.length] ;
			const p2 = this._shapePoints[( i + 2 ) % this._shapePoints.length] ;

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

			if ( dotp > this._smoothingThreshold ) {
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

			if ( dotn > this._smoothingThreshold ) {
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

			uvs.push( ulength / this._bounds.width , 0 ) ;
			uvs.push( ulength / this._bounds.width , 1 ) ;
			ulength += vc.length() ;
			uvs.push( ulength / this._bounds.width , 0 ) ;
			uvs.push( ulength / this._bounds.width , 1 ) ;

			normals.push( vp_norm.x , vp_norm.y , vp_norm.z ) ;
			normals.push( vp_norm.x , vp_norm.y , vp_norm.z ) ;
			normals.push( vn_norm.x , vn_norm.y , vn_norm.z ) ;
			normals.push( vn_norm.x , vn_norm.y , vn_norm.z ) ;

			if ( ! flip ) {
				indices.push( indiceOffset ) ;
				indices.push( indiceOffset + 1 ) ;
				indices.push( indiceOffset + 2 ) ;

				indices.push( indiceOffset + 1 ) ;
				indices.push( indiceOffset + 3 ) ;
				indices.push( indiceOffset + 2 ) ;
			}
			else {
				indices.push( indiceOffset ) ;
				indices.push( indiceOffset + 2 ) ;
				indices.push( indiceOffset + 1 ) ;

				indices.push( indiceOffset + 1 ) ;
				indices.push( indiceOffset + 2 ) ;
				indices.push( indiceOffset + 3 ) ;
			}

			indiceOffset += 4 ;
		}
	}



	_buildVertexData_2( mesh ) {
		const colors = [] ;

		const positions = mesh.getVerticesData( VertexBuffer.PositionKind ) ;
		const normals = mesh.getVerticesData( VertexBuffer.NormalKind ) ;
		const uvs = mesh.getVerticesData( VertexBuffer.UVKind ) ;
		const indices = mesh.getIndices() ;
		const indiceOffset = positions.length / 9 ;	// point_count = pos_count/3 , point_count/3 = start of the side
		let disp = 0 ;
		let distX = 0 ;
		let distZ = 0 ;
		let dist = 0 ;
		let totalLen = 0 ;
		const cumulate = [ 0 ] ;

		if ( this._wrapSideUV ) {
			for ( let idx = indiceOffset ; idx < positions.length / 3 ; idx += 4 ) {
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
				disp = idx - indiceOffset ;
				if ( disp % 4 < 1.5 ) {
					if ( this._wrapSideUV ) {
						uvs[2 * idx] = this._faceUV[face].x + ( ( this._faceUV[face].z - this._faceUV[face].x ) * cumulate[Math.floor( disp / 4 )] ) / totalLen ;
					}
					else {
						uvs[2 * idx] = this._faceUV[face].x ;
					}
				}
				else {
					if ( this._wrapSideUV ) {
						uvs[2 * idx] = this._faceUV[face].x + ( ( this._faceUV[face].z - this._faceUV[face].x ) * cumulate[Math.floor( disp / 4 ) + 1] ) / totalLen ;
					}
					else {
						uvs[2 * idx] = this._faceUV[face].z ;
					}
				}
				if ( disp % 2 === 0 ) {
					uvs[2 * idx + 1] = useOpenGLOrientationForUV ? 1.0 - this._faceUV[face].w : this._faceUV[face].w ;
				}
				else {
					uvs[2 * idx + 1] = useOpenGLOrientationForUV ? 1.0 - this._faceUV[face].y : this._faceUV[face].y ;
				}
			}
			else {
				uvs[2 * idx] = ( 1 - uvs[2 * idx] ) * this._faceUV[face].x + uvs[2 * idx] * this._faceUV[face].z ;
				uvs[2 * idx + 1] = ( 1 - uvs[2 * idx + 1] ) * this._faceUV[face].y + uvs[2 * idx + 1] * this._faceUV[face].w ;

				if ( useOpenGLOrientationForUV ) {
					uvs[2 * idx + 1] = 1.0 - uvs[2 * idx + 1] ;
				}
			}
			if ( this._faceColors ) {
				colors.push( this._faceColors[face].r , this._faceColors[face].g , this._faceColors[face].b , this._faceColors[face].a ) ;
			}
		}

		// sides
		VertexData._ComputeSides( this._sideOrientation , positions , indices , normals , uvs , this._frontUVs , this._backUVs ) ;

		// Result
		const vertexData = new VertexData() ;
		vertexData.indices = indices ;
		vertexData.positions = positions ;
		vertexData.normals = normals ;
		vertexData.uvs = uvs ;

		if ( this._faceColors ) {
			const totalColors = this._sideOrientation === VertexData.DOUBLESIDE ? colors.concat( colors ) : colors ;
			vertexData.colors = totalColors ;
		}

		return vertexData ;
	}



	_buildVertexData_2_remaining_code_to_port( mesh ) {
		const colors = [] ;

		const positions = mesh.getVerticesData( VertexBuffer.PositionKind ) ;
		const normals = mesh.getVerticesData( VertexBuffer.NormalKind ) ;
		const uvs = mesh.getVerticesData( VertexBuffer.UVKind ) ;
		const indices = mesh.getIndices() ;
		const indiceOffset = positions.length / 9 ;	// point_count = pos_count/3 , point_count/3 = start of the side
		let disp = 0 ;
		let distX = 0 ;
		let distZ = 0 ;
		let dist = 0 ;
		let totalLen = 0 ;
		const cumulate = [ 0 ] ;

		if ( this._wrapSideUV ) {
			for ( let idx = indiceOffset ; idx < positions.length / 3 ; idx += 4 ) {
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
			idx = index / 3 ;
			if ( face === 1 ) {	// the side
				disp = idx - indiceOffset ;
				if ( disp % 4 < 1.5 ) {
					if ( this._wrapSideUV ) {
						uvs[2 * idx] = this._faceUV[face].x + ( ( this._faceUV[face].z - this._faceUV[face].x ) * cumulate[Math.floor( disp / 4 )] ) / totalLen ;
					}
					else {
						uvs[2 * idx] = this._faceUV[face].x ;
					}
				}
				else {
					if ( this._wrapSideUV ) {
						uvs[2 * idx] = this._faceUV[face].x + ( ( this._faceUV[face].z - this._faceUV[face].x ) * cumulate[Math.floor( disp / 4 ) + 1] ) / totalLen ;
					}
					else {
						uvs[2 * idx] = this._faceUV[face].z ;
					}
				}
				if ( disp % 2 === 0 ) {
					uvs[2 * idx + 1] = useOpenGLOrientationForUV ? 1.0 - this._faceUV[face].w : this._faceUV[face].w ;
				}
				else {
					uvs[2 * idx + 1] = useOpenGLOrientationForUV ? 1.0 - this._faceUV[face].y : this._faceUV[face].y ;
				}
			}
			else {
				// PORTED for top and bottom
			}
			if ( this._faceColors ) {
				// PORTED for top and bottom , but not for side
				colors.push( this._faceColors[face].r , this._faceColors[face].g , this._faceColors[face].b , this._faceColors[face].a ) ;
			}
		}

		// sides
		// ?? should it be ported or not ??
		VertexData._ComputeSides( this._sideOrientation , positions , indices , normals , uvs , this._frontUVs , this._backUVs ) ;

		if ( this._faceColors ) {
			const totalColors = this._sideOrientation === VertexData.DOUBLESIDE ? colors.concat( colors ) : colors ;
			vertexData.colors = totalColors ;
		}

		return vertexData ;
	}



	// Build the vertex data indices for the top/bottom face, using earcut behind the scene
	_buildEarcutIndices() {
		const flatPoints = [] ;
		this._shapePoints.forEach( point => flatPoints.push( point.x , point.y ) ) ;
		this._earcutIndices = earcut( flatPoints ) ;
	}



	_computeBounds() {
		const lmin = new Vector2( this._shapePoints[0].x , this._shapePoints[0].y ) ;
		const lmax = new Vector2( this._shapePoints[0].x , this._shapePoints[0].y ) ;

		this._shapePoints.forEach( point => {
			// x
			if ( point.x < lmin.x ) {
				lmin.x = point.x ;
			}
			else if ( point.x > lmax.x ) {
				lmax.x = point.x ;
			}

			// y
			if ( point.y < lmin.y ) {
				lmin.y = point.y ;
			}
			else if ( point.y > lmax.y ) {
				lmax.y = point.y ;
			}
		} ) ;

		this._bounds = {
			min: lmin ,
			max: lmax ,
			width: lmax.x - lmin.x ,
			height: lmax.y - lmin.y
		} ;
	}
}

module.exports = PolygonMeshBuilder ;

