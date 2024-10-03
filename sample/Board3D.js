
"use strict" ;

/* global BABYLON GAMEGUI */

const svgKit = GAMEGUI.svgKit ;
const Atlas = GAMEGUI.Atlas ;



function createTileVg( id = null ) {
	let radius = 100 ;

	var vg = new svgKit.VG( {
		//viewBox: { x: 0 , y: 0 , width: 2 * radius , height: 2 * radius }
		//invertY: true
	} ) ;

	var hexTile = new svgKit.VGConvexPolygon( {
		style: {
			fill: '#7ac' ,
			stroke: '#f7d' ,
			strokeWidth: 4
		} ,
		build: {
			x: 0 ,
			y: 0 ,
			radius ,
			angleDeg: 90 ,
			sides: 6
		}
	} ) ;
	vg.addEntity( hexTile ) ;

	// We will set the VG viewbox to the polygon bounding box
	let boundingBox = hexTile.boundingBox ;
	boundingBox.shrink( 2 , 1 ).round() ;	// We have to shrink the boundingBox by 2 pixels each side to avoid aliasing on the boundary of the shape (1 pixel is not enough)
	vg.viewBox.set( boundingBox ) ;
	console.warn( vg ) ;

	var hexClippedImage = new svgKit.VGClip() ;
	vg.addEntity( hexClippedImage ) ;

	var hexClip = new svgKit.VGConvexPolygon( {
		build: {
			x: 0 ,
			y: 0 ,
			radius: radius * 0.95 ,
			angleDeg: 90 ,
			sides: 6
		}
	} ) ;
	hexClippedImage.addClippingEntity( hexClip ) ;

	var image = new svgKit.VGImage( {
		x: - radius ,
		y: - radius ,
		width: radius * 2 ,
		height: radius * 2 ,
		url: './marble.webp'
	} ) ;
	hexClippedImage.addEntity( image ) ;

	var tileName = new svgKit.VGFlowingText( {
		x: - 0.5 * radius ,
		y: - 0.65 * radius ,
		width: 1.5 * radius ,
		height: radius ,
		//clip: false ,
		//debugContainer: true ,
		//textWrapping: 'ellipsis' ,
		textWrapping: 'wordWrap' ,
		attr: {
			fontSize: 0.2 * radius ,
			color: '#444' ,
			outline: true ,
			outlineWidth: 2
		} ,
		markupText: "Tile" + ( id !== null ? ' #' + id : '' )
	} ) ;
	vg.addEntity( tileName ) ;

	vg.set( {
		data: {
			// set the correct origin for the future tile
			extrusionShape: hexTile.convexPolygon.points
		}
	} ) ;

	return vg ;
}



function createPathBasedTileVg( id = null ) {
	var vg = new svgKit.VG( {
		//invertY: true
	} ) ;

	var vgPath = new svgKit.VGPath( {
		style: {
			fill: '%lighter blue' ,
			stroke: '%red-violet' ,
			strokeWidth: 8
		}
	} ) ;
	vgPath.moveTo( { x: 0 , y: -80 } ) ;
	vgPath.lineTo( { x: 150 , y: -60 } ) ;
	vgPath.curveTo( { x: 150 , y: 140 , cx1: 250 , cy1: 40 , cx2: 50 , cy2: 40 } ) ;
	vgPath.arcTo( { x: 0 , y: 140 , rx: 125 , ry: 130 } ) ;
	vgPath.qCurveTo( { x: -150 , y: 160 , cx: -50 , cy: 40 } ) ;
	vgPath.vLineTo( 0 ) ;
	vgPath.hLineTo( -20 ) ;
	vgPath.close() ;
	vg.addEntity( vgPath ) ;
	console.warn( "VGPath:" , vgPath ) ;
	console.warn( "Path:" , vgPath.path ) ;

	var polygon = vgPath.path.toPolygon( {
		step: 10 ,
		//step: 5 ,
		forceKeyPoints: true ,
		angleThresholdDeg: 15
		//angleThresholdDeg: 5
	} )[ 0 ] ;
	//polygon.ensureOrientation( 1 ) ;

	let boundingBox = vgPath.boundingBox ;
	boundingBox.shrink( 2 , 1 ).round() ;	// We have to shrink the boundingBox by 2 pixels each side to avoid aliasing on the boundary of the shape (1 pixel is not enough)
	vg.viewBox.set( boundingBox ) ;

	vg.set( {
		data: {
			// set the correct origin for the future tile
			extrusionShape: polygon.points
		}
	} ) ;

	return vg ;
}



function createTileSideVg( fillColor = '#5c7' , strokeColor = '#0f0' ) {
	var vg = new svgKit.VG( {
		//viewBox: { x: 0 , y: 0 , width: 2 * radius , height: 2 * radius }
		//invertY: true
	} ) ;

	var side = new svgKit.VGRect( {
		x: 0 ,
		y: 0 ,
		width: 50 ,
		height: 50 ,
		style: {
			fill: fillColor ,
			stroke: strokeColor ,
			strokeWidth: 4
		}
	} ) ;
	vg.addEntity( side ) ;

	var upMark = new svgKit.VGRect( {
		x: 20 ,
		y: 5 ,
		width: 10 ,
		height: 5 ,
		style: {
			fill: '#c75' ,
			stroke: 'none'
		}
	} ) ;
	vg.addEntity( upMark ) ;

	// We will set the VG viewbox to the polygon bounding box
	let boundingBox = side.boundingBox ;
	boundingBox.shrink( 1 , 1 ).round() ;
	vg.viewBox.set( boundingBox ) ;

	return vg ;
}



function createTile( id = null ) {
	var tileVg = createTileVg( id ) ;

	var tile = new BABYLON.GUI.VG( 'tile3d' + ( id !== null ? '#' + id : '' ) , tileVg ) ;

	tile.width = "300px" ;
	tile.height = "300px" ;
	//tile3d.stretch = BABYLON.GUI.VG.STRETCH_UNIFORM ;
	tile.stretch = BABYLON.GUI.VG.STRETCH_EXTEND ;

	return tile ;
}



async function createTile3d( scene , id = null ) {
	var shapeScale = 0.02 ,
		thickness = 1 ;

	var tileVg = createTileVg( id ) ;
	//var tileVg = createPathBasedTileVg( id ) ;
	var tileSideVg = [
		createTileSideVg( '#4ea' , '#488' ) ,
		createTileSideVg( '#64e' , '#448' ) ,
		createTileSideVg( '#e64' , '#844' ) ,
		createTileSideVg( '#f90' , '#884' ) ,
		createTileSideVg( '#ae4' , '#884' ) ,
		createTileSideVg( '#4f6' , '#484' ) ,
	] ;

	// Shape profile in XZ plane, we use Z=-Y because images have Y-down
	// First, revert Y
	var extrusionShape = tileVg.data.extrusionShape.map( point => ( { x: point.x , y: - point.y } ) ) ;
	// Ensure a trigonometric orientation of points, since the mesh builder expect that points are produced
	// in the correct orientation/rotation (counter-clockwise)
	svgKit.Polygon.ensureOrientation( extrusionShape , 1 ) ;
	var shapeXY = extrusionShape.map( point => new BABYLON.Vector2( point.x * shapeScale , point.y * shapeScale ) ) ;

	// It is not possible to have multiple material/texture for the same mesh,
	// so we have to construct one single texture out of multiple VG and compute the UV mapping.
	var atlas = new Atlas() ;
	atlas.addArea( 'top' , tileVg.viewBox ) ;
	tileSideVg.forEach( vg => atlas.addArea( 'side' , vg.viewBox ) ) ;
	console.warn( "ATLAS:" , atlas ) ;
	
	// BE CAREFUL, VG coordinates has Y-down, while UV has Y-up, so it is more complicated...

	const topFaceUV = atlas.getAreaUV( 'top' ) ;
	const sideFaceUV =  atlas.getAreaUV( 'side' ) ;
	const bottomFaceUV = atlas.getAreaUV( 'top' ) ;

	var dynamicTexture = new BABYLON.DynamicTexture( "vgTexture" , { width: atlas.width , height: atlas.height } , scene ) ;
	//var dynamicTexture = new BABYLON.DynamicTexture("vgTexture", 256, scene ) ;
	var ctx = dynamicTexture.getContext() ;
	await tileVg.renderCanvas( ctx , { stretch: true , viewport: atlas.getArea( 'top' ) } ) ;

	var sideAreaList = atlas.getArea( 'side' ) ;
	for ( let i = 0 ; i < tileSideVg.length ; i ++ ) {
		await tileSideVg[ i ].renderCanvas( ctx , { stretch: true , viewport: sideAreaList[ i ] } ) ;
	}

	dynamicTexture.update() ;

	var material = new BABYLON.StandardMaterial( "material" , scene ) ;
	//material.diffuseTexture = new BABYLON.Texture( "/sample/uv-white.png" ) ;
	material.diffuseTexture = dynamicTexture ;
	material.ambientColor = new BABYLON.Color3( 1 , 1 , 1 ) ;

	var polygonMeshBuilder = new GAMEGUI.PolygonMeshBuilder(
		"tile3d#" + id ,
		shapeXY ,
		{
			depth: 1 ,
			//top: false ,
			//bottom: false ,
			//side: false ,
			//sideOrientation: BABYLON.Mesh.DOUBLESIDE ,
			topFaceUV , sideFaceUV , bottomFaceUV ,
			//wrapSideUV: true ,
			updatable: true
		} ,
		scene
	) ;
	var tile = polygonMeshBuilder.build() ;

	//tile.rotation.x = - Math.PI / 2 ;
	tile.position.y = 0.5 ;
	tile.material = material ;

	console.warn( "Tile" , tile ) ;
	
	//addTexturePlane( scene , dynamicTexture ) ;

	return tile ;
}



// Used to debug dynamic texture, and texture Atlas
function addTexturePlane( scene , texture ) {
	var width = 10 ,
		height = 10 ,
		txSize = texture.getSize() ;
	
	if ( txSize.width !== txSize.height ) {
		let ratio = Math.sqrt( txSize.width / txSize.height ) ;
		width *= ratio ;
		height /= ratio ;
	}
	
	var ground = BABYLON.MeshBuilder.CreateGround( "ground" , { width , height } , scene ) ;
	var material = new BABYLON.StandardMaterial( "material" , scene ) ;
	material.diffuseTexture = texture ;
	//material.ambientColor = new BABYLON.Color3(1, 1, 1) ;
	ground.material = material ;
	ground.position.x = -10 ;
	ground.position.y = -2 ;
	return ground ;
}



function turnToButton( scene , mesh ) {
	const ActionManager = BABYLON.ActionManager ;

	mesh.actionManager = new ActionManager( scene ) ;
	
	//mesh.actionManager.registerAction( new BABYLON.SetValueAction( ActionManager.OnPickTrigger , mesh.material , "wireframe" , true ) )
	//	.then( new BABYLON.SetValueAction( ActionManager.NothingTrigger , mesh.material , "wireframe" , false ) ) ;

	//mesh.actionManager.registerAction( new BABYLON.ExecuteCodeAction( ActionManager.OnPickTrigger , () => alert( "Mesh: " + mesh.name ) ) ) ;
	mesh.actionManager.registerAction( new BABYLON.ExecuteCodeAction( ActionManager.OnPickTrigger , () => console.log( "Mesh: " + mesh.name ) ) ) ;

	mesh.actionManager.registerAction( new BABYLON.SetValueAction( ActionManager.OnPointerOutTrigger , mesh.material , "emissiveColor" , mesh.material.emissiveColor ) ) ;
	mesh.actionManager.registerAction( new BABYLON.SetValueAction( ActionManager.OnPointerOverTrigger , mesh.material , "emissiveColor" , BABYLON.Color3.White() ) ) ;
	mesh.actionManager.registerAction( new BABYLON.InterpolateValueAction( ActionManager.OnPointerOutTrigger , mesh , "scaling" , new BABYLON.Vector3( 1 , 1 , 1 ) , 150 ) ) ;
	mesh.actionManager.registerAction( new BABYLON.InterpolateValueAction( ActionManager.OnPointerOverTrigger , mesh , "scaling" , new BABYLON.Vector3( 1.1 , 1.1 , 1.1 ) , 150 ) ) ;
}



async function createBoard3d( scene ) {
	var sqrt3 = Math.sqrt( 3 ) ,
		sqrt3_2 = sqrt3 * 0.5 ,
		tiles = [] ,
		delta = 2 * sqrt3_2 * 1.075 ,
		startingX = - 10 ,
		startingZ = - 6 ;

	for ( let j = 0 ; j < 5 ; j ++ ) {
		let z = startingZ + delta * sqrt3 * j ;

		for ( let i = 0 ; i < 5 ; i ++ ) {
			let x = startingX + delta * ( 2 * i + ( j % 2 ? 2 : 1 ) ) ;
			let tile3d = await createTile3d( scene , i + '-' + j ) ;
			tile3d.position.x = x ;
			tile3d.position.z = z ;
			turnToButton( scene , tile3d ) ;
			tiles.push( tile3d ) ;
		}
	}

	return tiles ;
}



function displayWireframe( scene ) {
	// Modify mesh's geometry to prepare for TRIANGLES mode in plugin
	for ( let mesh of scene.meshes ) {
		BABYLON.MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode( mesh ) ;
	}

	// Add plugin to all materials
	for ( let material of scene.materials ) {
		let plugin = new BABYLON.MeshDebugPluginMaterial( material , {
			mode: BABYLON.MeshDebugMode.TRIANGLES ,
			wireframeTrianglesColor: new BABYLON.Color3( 1 , 0 , 1 ) ,
			wireframeThickness: 1
		} ) ;
	}
}



async function createScene() {
	// This creates a basic Babylon Scene object (non-mesh)
	var scene = new BABYLON.Scene( engine ) ;

	// This creates and positions a free camera (non-mesh)
	//var camera = new BABYLON.FreeCamera( "camera1" , new BABYLON.Vector3( 0 , 5 , - 10 ) , scene ) ;
	var camera = new BABYLON.ArcRotateCamera( "Camera" , 3 * Math.PI / 2 , Math.PI / 4 , 20 , BABYLON.Vector3.Zero() ) ;
	camera.wheelPrecision = 10 ;	// Mouse wheel will move the camera less with that setting

	// This targets the camera to scene origin
	//camera.setTarget( BABYLON.Vector3.Zero() ) ;

	// This attaches the camera to the canvas
	camera.attachControl( canvas , true ) ;

	scene.ambientColor = new BABYLON.Color3( 0.1 , 0.1 , 0.1 ) ;

	// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
	var light = new BABYLON.HemisphericLight( "light" , new BABYLON.Vector3( 0 , 1 , 0 ) , scene ) ;

	// Default intensity is 1. Let's dim the light a small amount
	light.intensity = 0.7 ;

	// Our built-in 'ground' shape.
	/*
	var ground = BABYLON.MeshBuilder.CreateGround( "ground" , { width: 6 , height: 6 } , scene ) ;
	var material = new BABYLON.StandardMaterial("material", scene);
	material.diffuseTexture = new BABYLON.Texture("/sample/uv-white.png");
	material.ambientColor = new BABYLON.Color3(1, 1, 1);
	ground.material = material;
	//*/

	// GUI
	var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI( 'UI' ) ;

	svgKit.fontLib.setFontUrl( 'serif' , './serif.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'italic' , './serif-italic.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , './serif-bold.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , 'italic' , './serif-bold+italic.ttf' ) ;
	//await svgKit.fontLib.preloadFontFamily( 'serif' ) ;



	let board3d = await createBoard3d( scene ) ;

	//let tile3d = await createTile3d( scene , 0 ) ;

	/*
	for ( let i = 0 ; i < 1 ; i ++ ) {
		let tile = createTile( i ) ;
		advancedTexture.addControl( tile ) ;
	}
	*/

	//advancedTexture.addControl( tile3d ) ;

	//displayWireframe( scene ) ;

	return scene ;
}

