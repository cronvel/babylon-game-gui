
"use strict" ;

/* global BABYLON GAMEGUI */

var svgKit = GAMEGUI.svgKit ;



function createCardVg( id = null ) {
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

	var cardFrame = new svgKit.VGRect( {
		x , y , width , height ,
		rx: 10 ,
		ry: 10 ,
		style: {
			fill: '#7ac' ,
			stroke: '#777'
		}
	} ) ;
	vg.addEntity( cardFrame ) ;

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

	var cardRule = new svgKit.VGFlowingText( {
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
	vg.addEntity( cardRule ) ;

	var cardName = new svgKit.VGFlowingText( {
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
	vg.addEntity( cardName ) ;

	return vg ;
}



function createCard( id = null ) {
	var cardVg = createCardVg( id ) ;

	var card = new BABYLON.GUI.Card( 'card' , cardVg ) ;

	card.width = "300px" ;
	card.height = "200px" ;
	//card.stretch = BABYLON.GUI.VG.STRETCH_UNIFORM ;
	card.stretch = BABYLON.GUI.VG.STRETCH_EXTEND ; card.autoScale = true ;
	card.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;

	card.transformCenterX = 0.5 ;
	card.transformCenterY = 1 ;
	card.isPointerBlocker = true ;
	card.hoverCursor = 'pointer' ;

	card.onPointerEnterObservable.add( () => {
		card.scaleX = card.scaleY = 1.2 ;
		//card.rotation = 0.2 ;
		//card.zIndex = 1 ;
		card.shadowColor = '#ff0' ;
		card.shadowBlur = 20 ;
	} ) ;

	card.onPointerOutObservable.add( () => {
		card.scaleX = card.scaleY = 1 ;
		//card.rotation = 0 ;
		//card.zIndex = 0 ;
		card.shadowColor = '#000' ;
		card.shadowBlur = 0 ;
	} ) ;

	card.onPointerUpObservable.add( () => {
		alert( "card clicked: " + id ) ;
	} ) ;

	return card ;
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


	//var handPanel = new BABYLON.GUI.HandPanel( 'handPanel' ) ;
	var handPanel = new BABYLON.GUI.StackPanel( 'handPanel' ) ;
	handPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	handPanel.isVertical = false ;
	handPanel.clipChildren = false ;
	handPanel.clipContent = false ;
	advancedTexture.addControl( handPanel ) ;

	for ( let i = 0 ; i < 5 ; i ++ ) {
		let card = createCard( i ) ;
		handPanel.addControl( card ) ;
	}

	//advancedTexture.addControl( card ) ;
	
	return scene ;
}

