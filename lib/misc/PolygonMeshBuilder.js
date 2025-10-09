/*
	Babylon Game GUI

	Copyright (c) 2024 - 2025 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/
"use strict" ;

/* global BABYLON, earcut */

// Derived from:
// https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Meshes/Builders/polygonBuilder.ts
// https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Meshes/polygonMesh.ts
/* eslint-disable camelcase */

const Vector2 = BABYLON.Vector2 ;
const Vector3 = BABYLON.Vector3 ;
//const Vector4 = BABYLON.Vector4 ;
const Color4 = BABYLON.Color4 ;
const Mesh = BABYLON.Mesh ;
const VertexData = BABYLON.VertexData ;
const VertexBuffer = BABYLON.VertexBuffer ;
const EngineStore = BABYLON.EngineStore ;
const Epsilon = BABYLON.Epsilon ;
//const PolygonMeshBuilder = BABYLON.PolygonMeshBuilder ;
const useOpenGLOrientationForUV = BABYLON.useOpenGLOrientationForUV ;



/*
	Builds a polygon mesh, with or without extrusion.
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
	_topFaceUV ;
	_topFaceColor ;
	_bottomFaceUV ;
	_bottomFaceColor ;
	_sideFaceUV ;
	_sideFaceColor ;
	_wrapSideUV = false ;
	_updatable = false ;

	_hasFaceColors = false ;
	_bounds ;
	_perimeter = 0 ;
	_perimeterOffsets = [] ;
	_earcutIndices ;
	_vertexData = null ;

	/*
		Creates and returns a polygon mesh, given an array of points defining the shape.
		The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh.

		Arguments:
			name: the name of the mesh to produce
			shapePoints: array of object {x,y}, the successive 2D coordinates of the points of the polygon (but it will be produced
			  in the XoZ plane, so y->z)
			scene: the scene where to add the mesh
			options: an object of options, where:
				depth: depth size for the extrusion, if not set it default to 0 (= no extrusion, produce only the top-face)
				top: boolean (default: true), if true, the mesh will have the top end cap
				bottom: boolean, if true, the mesh will have the bottom end cap
				side: boolean, if true, the mesh will have the side faces
				sideOrientation: (default: Mesh.FRONTSIDE,) define if the front-face, back-face or both are visible (values:
				  Mesh.FRONTSIDE, Mesh.BACKSIDE or Mesh.DOUBLESIDE)
				smoothingThreshold: (default: 2) threshold for the side's normals
				topFaceUV: specific UV for the whole top face, if not provided the whole texture will be used
				bottomFaceUV: specific UV for the whole bottom face, if not provided the whole texture will be used
				sideFaceUV: specific UV for the whole side face, if not provided the whole texture will be used,
				  also see option `wrapSideUV`
				topFaceColor: specific vertex color for the top face
				bottomFaceColor: specific vertex color for the bottom face
				sideFaceColor: specific vertex color for the side faces
				wrapSideUV: boolean (default: false), if set the texture will wrap around the whole side, if false,
				  each side face (even tiny) will have the whole side-face texture (or part of it, if sideFaceUV is set)
				updatable: boolean (default: false), set to true if its internal geometry is supposed to change once created
	 */
	constructor( name , shapePoints , options = {} , scene = null ) {
		this._name = name ;
		this._scene = scene || EngineStore.LastCreatedScene ;
		this._shapePoints = Array.from( shapePoints ) ;	// options.shape, this._points
		this._depth = + options.depth || 0 ;
		this._hasTop = options.top !== undefined ? !! options.top : true ;
		this._hasBottom = options.bottom !== undefined ? !! options.bottom : !! this._depth ;
		this._hasSide = options.side !== undefined ? !! options.side : !! this._depth ;
		this._sideOrientation = Mesh._GetDefaultSideOrientation( options.sideOrientation ) ;
		this._smoothingThreshold = + options.smoothingThreshold || 2 ;
		this._topFaceUV = options.topFaceUV ;
		this._topFaceColor = options.topFaceColor ;
		this._bottomFaceUV = options.bottomFaceUV ;
		this._bottomFaceColor = options.bottomFaceColor ;
		this._sideFaceUV = ! options.sideFaceUV ? null :
			Array.isArray( options.sideFaceUV ) ? options.sideFaceUV :
			[ options.sideFaceUV ] ;
		this._sideFaceColor = ! options.sideFaceColor ? null :
			Array.isArray( options.sideFaceColor ) ? options.sideFaceColor :
			[ options.sideFaceColor ] ;
		this._wrapSideUV = !! options.wrapSideUV ;	// options.wrap
		this._updatable = !! options.updatable ;

		if ( ! this._depth ) {
			this._hasSide = this._hasBottom = false ;
		}

		// face colors if undefined
		if ( this._topFaceColor || this._bottomFaceColor || this._sideFaceColor ) {
			this._hasFaceColors = true ;
			if ( ! this._topFaceColor ) { this._topFaceColor = new Color4( 1 , 1 , 1 , 1 ) ; }
			if ( ! this._bottomFaceColor ) { this._bottomFaceColor = new Color4( 1 , 1 , 1 , 1 ) ; }
			if ( ! this._sideFaceColor ) { this._sideFaceColor = new Color4( 1 , 1 , 1 , 1 ) ; }
		}

		this._computeBounds() ;
		this._computePerimeter() ;
	}



	// Build the mesh
	build() {
		// Create the mesh
		const mesh = new Mesh( this._name , this._scene ) ;

		// Create vertex data
		this._buildVertexData() ;

		// Apply vertex data to the mesh
		mesh.setVerticesData( VertexBuffer.PositionKind , this._vertexData.positions , this._updatable ) ;
		mesh.setVerticesData( VertexBuffer.NormalKind , this._vertexData.normals , this._updatable ) ;
		mesh.setVerticesData( VertexBuffer.UVKind , this._vertexData.uvs , this._updatable ) ;
		mesh.setIndices( this._vertexData.indices ) ;

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

		if ( this._hasFaceColors && this._sideOrientation === VertexData.DOUBLESIDE ) {
			let colors = this._vertexData.colors ;
			// Duplicate colors for the backfaces.
			// We could do: colors.push( ... colors )
			// ... but the spread operator has a limit (probably 10k but it depends on the JS engine)
			for ( let l = colors.length , i = 0 ; i < l ; i ++ ) { colors[ l + i ]( colors[ i ] ) ; }
		}
	}



	_buildTopFaceVertexData() {
		const { positions , normals , indices , colors } = this._vertexData ;
		const faceUV = this._topFaceUV ;
		const faceColor = this._topFaceColor ;
		const indiceOffset = positions.length / 3 ;	// There is 1 indice for 3 positions

		if ( ! this._earcutIndices ) { this._buildEarcutIndices() ; }

		this._shapePoints.forEach( ( p ) => {
			normals.push( 0 , 1.0 , 0 ) ;
			positions.push( p.x , 0 , p.y ) ;

			// Place vertex UV relative to its position
			this._buildUV(
				( p.x - this._bounds.min.x ) / this._bounds.width ,
				( p.y - this._bounds.min.y ) / this._bounds.height ,
				faceUV
			) ;

			if ( faceColor ) {
				colors.push( faceColor.r , faceColor.g , faceColor.b , faceColor.a ) ;
			}
		} ) ;

		for ( let i = 0 ; i < this._earcutIndices.length ; i ++ ) {
			indices.push( indiceOffset + this._earcutIndices[ i ] ) ;
		}
	}



	_buildBottomFaceVertexData() {
		const { positions , normals , indices , colors } = this._vertexData ;
		const faceUV = this._bottomFaceUV ;
		const faceColor = this._bottomFaceColor ;
		const indiceOffset = positions.length / 3 ;	// There is 1 indice for 3 positions

		if ( ! this._earcutIndices ) { this._buildEarcutIndices() ; }

		this._shapePoints.forEach( ( p ) => {
			//add the elements at the depth
			normals.push( 0 , - 1.0 , 0 ) ;
			positions.push( p.x , - this._depth , p.y ) ;

			// Place vertex UV relative to its *inverted* position
			this._buildUV(
				1 - ( p.x - this._bounds.min.x ) / this._bounds.width ,
				1 - ( p.y - this._bounds.min.y ) / this._bounds.height ,
				faceUV
			) ;

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
		const { positions , normals , indices , colors } = this._vertexData ;
		let indiceOffset = positions.length / 3 ;	// There is 1 indice for 3 positions

		for ( let i = 0 ; i < this._shapePoints.length ; i ++ ) {

			// Preliminaries

			const p = this._shapePoints[i] ;
			const p1 = this._shapePoints[( i + 1 ) % this._shapePoints.length] ;
			const p0 = this._shapePoints[( i + this._shapePoints.length - 1 ) % this._shapePoints.length] ;
			const p2 = this._shapePoints[( i + 2 ) % this._shapePoints.length] ;
			const perimeterOffset0 = i > 0 ? this._perimeterOffsets[ i - 1 ] : 0 ;
			const perimeterOffset1 = this._perimeterOffsets[ i ] ;
			const faceUV = this._sideFaceUV?.[ i % this._sideFaceUV.length ] ;
			const faceColor = this._sideFaceColor?.[ i % this._sideFaceColor.length ] ;


			// Positions

			positions.push( p.x , 0 , p.y ) ;
			positions.push( p.x , - this._depth , p.y ) ;
			positions.push( p1.x , 0 , p1.y ) ;
			positions.push( p1.x , - this._depth , p1.y ) ;


			// Vertex normals + smoothing

			let vc = new Vector3( - ( p1.y - p.y ) , 0 , p1.x - p.x ) ;
			let vp = new Vector3( - ( p.y - p0.y ) , 0 , p.x - p0.x ) ;
			let vn = new Vector3( - ( p2.y - p1.y ) , 0 , p2.x - p1.x ) ;

			if ( ! flip ) {
				vc = vc.scale( - 1 ) ;
				vp = vp.scale( - 1 ) ;
				vn = vn.scale( - 1 ) ;
			}

			let vc_norm = vc.normalizeToNew() ;
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

			normals.push( vp_norm.x , vp_norm.y , vp_norm.z ) ;
			normals.push( vp_norm.x , vp_norm.y , vp_norm.z ) ;
			normals.push( vn_norm.x , vn_norm.y , vn_norm.z ) ;
			normals.push( vn_norm.x , vn_norm.y , vn_norm.z ) ;


			// Vertex UVs

			if ( this._wrapSideUV ) {
				this._buildUV( perimeterOffset0 / this._perimeter , 1 , faceUV ) ;
				this._buildUV( perimeterOffset0 / this._perimeter , 0 , faceUV ) ;
				this._buildUV( perimeterOffset1 / this._perimeter , 1 , faceUV ) ;
				this._buildUV( perimeterOffset1 / this._perimeter , 0 , faceUV ) ;
			}
			else {
				this._buildUV( 0 , 1 , faceUV ) ;
				this._buildUV( 0 , 0 , faceUV ) ;
				this._buildUV( 1 , 1 , faceUV ) ;
				this._buildUV( 1 , 0 , faceUV ) ;
			}


			// Vertex colors...

			if ( faceColor ) {
				colors.push( faceColor.r , faceColor.g , faceColor.b , faceColor.a ) ;
			}


			// Indices...

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



	// Build the vertex data indices for the top/bottom face, using earcut behind the scene
	_buildEarcutIndices() {
		const flatPoints = [] ;
		this._shapePoints.forEach( point => flatPoints.push( point.x , point.y ) ) ;
		this._earcutIndices = earcut( flatPoints ) ;
	}



	_buildUV( u , v , faceUV ) {
		// If there is a specific face UV...
		if ( faceUV ) {
			u = ( 1 - u ) * faceUV.x + u * faceUV.z ;
			v = ( 1 - v ) * faceUV.y + v * faceUV.w ;
		}

		if ( useOpenGLOrientationForUV ) { v = 1 - v ; }

		this._vertexData.uvs.push( u , v ) ;
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



	_computePerimeter() {
		this._perimeter = 0 ;
		this._perimeterOffsets.length = 0 ;

		for ( let i = 0 ; i < this._shapePoints.length ; i ++ ) {
			let point = this._shapePoints[ i ] ;
			let nextPoint = this._shapePoints[ ( i + 1 ) % this._shapePoints.length ] ;
			let dx = nextPoint.x - point.x ;
			let dy = nextPoint.y - point.y ;
			let dist = Math.sqrt( dx * dx + dy * dy ) ;
			this._perimeter += dist ;
			this._perimeterOffsets.push( this._perimeter ) ;
		}
	}
}

module.exports = PolygonMeshBuilder ;

