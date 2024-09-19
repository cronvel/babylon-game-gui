
"use strict" ;

/* global BABYLON GAMEGUI */

var svgKit = GAMEGUI.svgKit ;



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
			x: radius ,
			y: radius ,
			radius ,
			angleDeg: 90 ,
			sides: 6
		}
	} ) ;
	vg.addEntity( hexTile ) ;

	// We will set the VG viewbox to the polygon bounding box
	let boundingBox = hexTile.getBoundingBox() ;
	boundingBox.shrink( 2 , 1 ) ;	// We have to shrink the boundingBox by 2 pixels each side to avoid aliasing on the boundary of the shape (1 pixel is not enough)
	vg.viewBox.set( boundingBox ) ;
	console.warn( vg ) ;

	var hexClippedImage = new svgKit.VGClip() ;
	vg.addEntity( hexClippedImage ) ;
	
	var hexClip = new svgKit.VGConvexPolygon( {
		build: {
			x: radius ,
			y: radius ,
			radius: radius * 0.95 ,
			angleDeg: 90 ,
			sides: 6
		}
	} ) ;
	hexClippedImage.addClippingEntity( hexClip ) ;

	var image = new svgKit.VGImage( {
		x: 0 ,
		y: 0 ,
		width: radius * 2 ,
		height: radius * 2 ,
		url: './marble.webp'
	} ) ;
	hexClippedImage.addEntity( image ) ;

	var tileName = new svgKit.VGFlowingText( {
		x: 0.5 * radius ,
		y: 0.35 * radius ,
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
			extrusionShape: hexTile.points.map( point => ( { x: point.x - radius , y: point.y - radius } ) )
		}
	} ) ;

	return vg ;
}



function createTileSideVg() {
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
			fill: '#5c7' ,
			stroke: '#0f0' ,
			strokeWidth: 4
		}
	} ) ;
	vg.addEntity( side ) ;

	// We will set the VG viewbox to the polygon bounding box
	let boundingBox = side.getBoundingBox() ;
	boundingBox.shrink( 1 , 1 ) ;
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
	var tileSideVg = createTileSideVg() ;

	// Shape profile in XZ plane
	var shapeXZ = tileVg.data.extrusionShape.map( point => new BABYLON.Vector3( point.x * shapeScale , 0 , point.y * shapeScale ) ) ;

	
	// It is not possible to have multiple material/texture for the same mesh,
	// so we have to construct one single texture out of multiple VG and compute the UV mapping.
	var faceUV = [] ,
		faceCount = shapeXZ.length + 2 ,
		spacing = 1 ,
		textureWidth = tileVg.viewBox.width + tileSideVg.viewBox.width + spacing ,
		textureHeight = Math.max( tileVg.viewBox.height , tileSideVg.viewBox.height ) ;

	// BE CAREFUL, VG coordinates has Y-down, while UV has Y-up, so it is more complicated...
	
	// Top face
	faceUV[ 0 ] = new BABYLON.Vector4(
		0 ,
		1 - ( tileVg.viewBox.height / textureHeight ) ,
		tileVg.viewBox.width / textureWidth ,
		1
	) ;

	// There is only 1 UV for all side face, it cannot be customized -_-'
	faceUV[ 1 ] = new BABYLON.Vector4(
		( tileVg.viewBox.width + spacing ) / textureWidth ,
		1 - ( tileSideVg.viewBox.height / textureHeight ) ,
		1 ,
		1
	) ;

	// Bottom face, for instance we will use the top-face UV, it is flipped for both U and V so it is symetrical to the top face
	faceUV[ 2 ] = new BABYLON.Vector4(
		tileVg.viewBox.width / textureWidth ,
		1 ,
		0 ,
		1 - ( tileVg.viewBox.height / textureHeight ) ,
	) ;

	var dynamicTexture = new BABYLON.DynamicTexture("vgTexture", { width: textureWidth , height: textureHeight } , scene ) ;
	//var dynamicTexture = new BABYLON.DynamicTexture("vgTexture", 256, scene ) ;
	var ctx = dynamicTexture.getContext();
	await tileVg.renderCanvas( ctx , { stretch: true , viewport: { width: tileVg.viewBox.width , height: tileVg.viewBox.height } } ) ;
	await tileSideVg.renderCanvas( ctx , { stretch: true , viewport: { x: tileVg.viewBox.width + spacing , width: tileSideVg.viewBox.width , height: tileSideVg.viewBox.height } } ) ;
	dynamicTexture.update() ;

	var material = new BABYLON.StandardMaterial("material", scene);
	material.diffuseTexture = new BABYLON.Texture("/sample/uv-white.png");
	material.diffuseTexture = dynamicTexture;
	material.ambientColor = new BABYLON.Color3(1, 1, 1);


	var tile = BABYLON.MeshBuilder.ExtrudePolygon(
		"tile3d" ,
		{
			shape: shapeXZ ,
			// shape: [ new BABYLON.Vector3( -1 , 0 , -1 ) , new BABYLON.Vector3( -1 , 0 , 1 ) , new BABYLON.Vector3( 1 , 0 , 1 ) , new BABYLON.Vector3( 1 , 0 , -1 ) ] ,
			closeShape: true ,
			depth: 1 ,
			//sideOrientation: BABYLON.Mesh.DOUBLESIDE ,
			faceUV ,
		} ,
		scene
	) ;

	//tile.rotation.x = - Math.PI / 2 ;
	tile.position.y = 0.5 ;
	tile.material = material;

	console.warn( "Tile" , tile ) ;

	return tile ;
}



function turnToButton( scene , mesh ) {
	mesh.actionManager = new BABYLON.ActionManager(scene);
	mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, mesh.material, "wireframe", true))
		.then(new BABYLON.SetValueAction(BABYLON.ActionManager.NothingTrigger, mesh.material, "wireframe", false));

	mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh.material, "emissiveColor", mesh.material.emissiveColor));
	mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh.material, "emissiveColor", BABYLON.Color3.White()));
	mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh, "scaling", new BABYLON.Vector3(1, 1, 1), 150));
	mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh, "scaling", new BABYLON.Vector3(1.1, 1.1, 1.1), 150));
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
			wireframeTrianglesColor: new BABYLON.Color3(1, 0, 1) ,
			wireframeThickness: 1
		} ) ;
	}
};



async function createScene() {
	// This creates a basic Babylon Scene object (non-mesh)
	var scene = new BABYLON.Scene( engine ) ;

	// This creates and positions a free camera (non-mesh)
	//var camera = new BABYLON.FreeCamera( "camera1" , new BABYLON.Vector3( 0 , 5 , - 10 ) , scene ) ;
	var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 4, 20, BABYLON.Vector3.Zero());

	// This targets the camera to scene origin
	//camera.setTarget( BABYLON.Vector3.Zero() ) ;

	// This attaches the camera to the canvas
	camera.attachControl( canvas , true ) ;

	scene.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);

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

