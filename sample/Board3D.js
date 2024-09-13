
"use strict" ;

/* global BABYLON GAMEGUI */

var svgKit = GAMEGUI.svgKit ;



function createTileVg_( id = null ) {
	let x = 0 ,
		y = 0 ,
		width = 250 ,
		height = 400 ,
		padding = 20 ,
		topRect = {
			x: padding ,
			y: padding ,
			width: width - padding * 2 ,
			height: 0.5 * height - padding * 1.5
		} ,
		bottomRect = {
			x: padding ,
			y: topRect.height + 2 * padding ,
			width: width - 2 * padding ,
			height: 0.5 * height - 1.5 * padding
		} ;

	var vg = new svgKit.VG( {
		viewBox: { x , y , width , height }
		//invertY: true
	} ) ;

	var tile3dFrame = new svgKit.VGRect( {
		x , y , width , height ,
		rx: 10 ,
		ry: 10 ,
		style: {
			fill: '#7ac' ,
			stroke: '#777'
		}
	} ) ;
	vg.addEntity( tile3dFrame ) ;

	var image = new svgKit.VGImage( {
		x: topRect.x ,
		y: topRect.y ,
		width: topRect.width ,
		height: topRect.height ,
		url: './dragon.webp'
	} ) ;
	vg.addEntity( image ) ;

	var textRect = new svgKit.VGRect( {
		x: bottomRect.x ,
		y: bottomRect.y ,
		width: bottomRect.width ,
		height: bottomRect.height ,
		rx: 5 ,
		ry: 5 ,
		style: {
			fill: '#eee'
		}
	} ) ;
	vg.addEntity( textRect ) ;

	var tile3dRule = new svgKit.VGFlowingText( {
		x: bottomRect.x + 0.5 * padding ,
		y: bottomRect.y + 0.5 * padding ,
		width: bottomRect.width - padding ,
		height: bottomRect.height - padding ,
		//clip: false ,
		//debugContainer: true ,
		//textWrapping: 'ellipsis' ,
		textWrapping: 'wordWrap' ,
		attr: {
			fontSize: 22 ,
			color: '#444' ,
			outline: true
		} ,
		markupText: "A fierce dragon breathing fire..."
	} ) ;
	vg.addEntity( tile3dRule ) ;

	var tile3dName = new svgKit.VGFlowingText( {
		x: 0.5 * padding ,
		y: 0.25 * padding ,
		width: width - padding ,
		height: 2 * padding ,
		//clip: false ,
		//debugContainer: true ,
		//textWrapping: 'ellipsis' ,
		textWrapping: 'wordWrap' ,
		attr: {
			fontSize: 30 ,
			color: '#444' ,
			outline: true ,
			outlineWidth: 2
		} ,
		markupText: "Black Dragon" + ( id !== null ? ' #' + id : '' )
	} ) ;
	vg.addEntity( tile3dName ) ;

	return vg ;
}



function createTileVg( id = null ) {
	let padding = 10 ,
		radius = 100 ,
		rCos60 = 0.5 * radius ,
		rSin60 = Math.sin( Math.PI / 3 ) * radius ,
		offsetX = rSin60 + padding ,
		offsetY = radius + padding ,
		northX = offsetX , northY = offsetY - radius ,
		southX = offsetX , southY = offsetY + radius ,
		northWestX = offsetX - rSin60 , northWestY = offsetY - rCos60 ,
		northEastX = offsetX + rSin60 , northEastY = offsetY - rCos60 ,
		southWestX = offsetX - rSin60 , southWestY = offsetY + rCos60 ,
		southEastX = offsetX + rSin60 , southEastY = offsetY + rCos60 ;

	console.warn( "coords:" , { 
		padding,radius,rCos60,rSin60,offsetX,offsetY,coords: {
			northX,northY,southX,southY,northWestX,northWestY,northEastX,northEastY,southWestX,southWestY,southEastX,southEastY
		}
	} ) ;

	var vg = new svgKit.VG( {
		viewBox: { x: 0 , y: 0 , width: 2 * offsetX , height: 2 * offsetY }
		//invertY: true
	} ) ;
	

	var hexFrame = new svgKit.VGPath( {
		style: {
			fill: '#7ac' ,
			stroke: '#777'
		}
	} ) ;
	hexFrame.moveTo( { x: northX , y: northY } )
		.lineTo( { x: northEastX , y: northEastY } )
		.lineTo( { x: southEastX , y: southEastY } )
		.lineTo( { x: southX , y: southY } )
		.lineTo( { x: southWestX , y: southWestY } )
		.lineTo( { x: northWestX , y: northWestY } )
		.lineTo( { x: northX , y: northY } )
		.close() ;
	vg.addEntity( hexFrame ) ;

	var tileName = new svgKit.VGFlowingText( {
		x: offsetX - 0.5 * radius ,
		y: offsetY + 0.25 * radius ,
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

	return vg ;
}



function createTile( id = null ) {
	var tile3dVg = createTileVg( id ) ;

	var tile3d = new BABYLON.GUI.VG( 'tile3d' + ( id !== null ? '#' + id : '' ) , tile3dVg ) ;

	tile3d.width = "300px" ;
	tile3d.height = "350px" ;
	//tile3d.stretch = BABYLON.GUI.VG.STRETCH_UNIFORM ;
	tile3d.stretch = BABYLON.GUI.VG.STRETCH_EXTEND ;

	return tile3d ;
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


	for ( let i = 0 ; i < 1 ; i ++ ) {
		let tile3d = createTile( i ) ;
		advancedTexture.addControl( tile3d ) ;
	}

	//advancedTexture.addControl( tile3d ) ;
	
	return scene ;
}

