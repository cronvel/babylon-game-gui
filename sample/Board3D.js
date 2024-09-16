
"use strict" ;

/* global BABYLON GAMEGUI */

var svgKit = GAMEGUI.svgKit ;



function createTileVg( id = null ) {
	let padding = 10 ,
		radius = 100 ;

	var vg = new svgKit.VG( {
		viewBox: { x: 0 , y: 0 , width: 2 * radius , height: 2 * radius }
		//invertY: true
	} ) ;

	var hexTile = new svgKit.VGPolygon( {
		style: {
			fill: '#7ac' ,
			stroke: '#777'
		} ,
		build: {
			x: radius ,
			y: radius ,
			radius ,
			sides: 6
		}
	} ) ;
	vg.addEntity( hexTile ) ;

	var tileName = new svgKit.VGFlowingText( {
		x: 0.5 * radius ,
		y: 0.25 * radius ,
		width: 1.5 * radius ,
		height: radius ,
		//clip: false ,
		//debugContainer: true ,
		//textWrapping: 'ellipsis' ,
		textWrapping: 'wordWrap' ,
		attr: {
			fontSize: 0.3 * radius ,
			color: '#444' ,
			outline: true ,
			outlineWidth: 2
		} ,
		markupText: "Tile" + ( id !== null ? ' #' + id : '' )
	} ) ;
	vg.addEntity( tileName ) ;

	vg.set( { data: { extrusionShape: hexTile.points } } ) ;

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



function createTile3d( scene , id = null ) {
	var shapeScale = 0.02 ,
		thickness = 1 ;

	var tileVg = createTileVg( id ) ;

	//Shape profile in XY plane
	const shape = tileVg.data.extrusionShape.map( point => new BABYLON.Vector3( point.x * shapeScale , point.y * shapeScale , 0 ) ) ;

	const extrusionPath = [
		new BABYLON.Vector3( 0 , 0 , 0 ) ,
		new BABYLON.Vector3( 0 , 0 , thickness )
	];

	const faceUV = [];
	faceUV[0] =	new BABYLON.Vector4(0, 0, 0, 0);
    faceUV[1] =	new BABYLON.Vector4(1, 0, 0.25, 1); // x, z swapped to flip image
    faceUV[2] = new BABYLON.Vector4(0, 0, 0.24, 1);
    
    const faceColors = [ ];
    faceColors[0] = new BABYLON.Color4(0.22, 0.77, 0.06)
	
	var tile = BABYLON.MeshBuilder.ExtrudeShape(
		"tile3d" ,
		{
			shape ,
			closeShape: true ,
			path: extrusionPath ,
			cap: BABYLON.Mesh.CAP_ALL ,
			sideOrientation: BABYLON.Mesh.DOUBLESIDE ,
			faceColors ,
			faceUV ,
		} ,
		scene
	) ;
	
	tile.rotation.x = - Math.PI / 2 ;

	const material = new BABYLON.StandardMaterial("material", scene);
	material.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/logo_label.jpg");
	tile.material = material;
	
	console.warn( "Tile" , tile ) ;
	
	return tile ;
}



async function createScene() {
	// This creates a basic Babylon Scene object (non-mesh)
	var scene = new BABYLON.Scene( engine ) ;

	// This creates and positions a free camera (non-mesh)
	var camera = new BABYLON.FreeCamera( "camera1" , new BABYLON.Vector3( 0 , 5 , - 10 ) , scene ) ;

	// This targets the camera to scene origin
	camera.setTarget( BABYLON.Vector3.Zero() ) ;

	// This attaches the camera to the canvas
	camera.attachControl( canvas , true ) ;

	// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
	var light = new BABYLON.HemisphericLight( "light" , new BABYLON.Vector3( 0 , 1 , 0 ) , scene ) ;

	// Default intensity is 1. Let's dim the light a small amount
	light.intensity = 0.7 ;

	// Our built-in 'ground' shape.
	var ground = BABYLON.MeshBuilder.CreateGround( "ground" , { width: 6 , height: 6 } , scene ) ;

	// GUI
	var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI( 'UI' ) ;

	svgKit.fontLib.setFontUrl( 'serif' , './serif.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'italic' , './serif-italic.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , './serif-bold.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , 'italic' , './serif-bold+italic.ttf' ) ;
	//await svgKit.fontLib.preloadFontFamily( 'serif' ) ;


	let tile3d = createTile3d( scene , 0 ) ;

	/*
	for ( let i = 0 ; i < 1 ; i ++ ) {
		let tile = createTile( i ) ;
		advancedTexture.addControl( tile ) ;
	}
	*/

	//advancedTexture.addControl( tile3d ) ;
	
	return scene ;
}

