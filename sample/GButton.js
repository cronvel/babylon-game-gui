
"use strict" ;

/* global BABYLON GAMEGUI */

const svgKit = GAMEGUI.svgKit ;



var advancedTexture = null ;



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
	advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI( 'UI' ) ;

	svgKit.fontLib.setFontUrl( 'serif' , './serif.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'italic' , './serif-italic.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , './serif-bold.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , 'italic' , './serif-bold+italic.ttf' ) ;

	//createGButton( "Blah ".repeat( 22 ) + "..." ) ;
	var gbutton = createGButton( "Attack" ) ;
	//gbutton.onPointerUpObservable.addOnce( () => gbutton.dispose() ) ;

	return scene ;
}



function createGButton( markupText ) {
	var gbutton = new BABYLON.GUI.GButton( 'gbutton' ) ;

	gbutton.width = "300px" ; gbutton.height = "60px" ;
	//gbutton.idealWidthInPixels = 100 ; gbutton.idealHeightInPixels = 25 ;
	//gbutton.autoScale = true ;
	gbutton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	//gbutton.paddingTop = gbutton.paddingBottom = "10px" ;

	//gbutton.backgroundColor = '#a5a' ;
	//gbutton.borderColor = '#ddd' ;
	gbutton.borderThickness = 4 ;
	gbutton.cornerRadius = 4 ;
	gbutton.textPaddingTop = '4px' ;
	gbutton.textPaddingBottom = '4px' ;
	gbutton.textPaddingLeft = '10px' ;
	gbutton.textPaddingRight = '10px' ;

	// /!\ TODO /!\

	// When it loses focus (e.g.: the mouse leaves)
	gbutton.blurStyle = {
		backgroundColor: '#a5a' ,
		borderColor: '#ddd'
	} ;

	// When it gains focus (e.g.: the mouse is hovering, or with the keyboard/gamepad navigation, the button is selected)
	gbutton.focusStyle = {
		backgroundColor: '#c7c' ,
		borderColor: '#eee'
	} ;

	// When the button is pressed and its action is triggered (e.g.: it is clicked)
	gbutton.pressedStyle = {
		duration: 250 ,		// The duration the style is used
		blinks: 2 ,			// How many times it blinks during this duration (1 blink alternate between the pressed style and the blur style)
		backgroundColor: '#e9e' ,
		borderColor: '#fff'
	} ;

	// When the button is disabled (can't be interacted with)
	gbutton.disabledStyle = {
		backgroundColor: '#848' ,
		borderColor: '#777'
	} ;
 


	gbutton.markupText = markupText ;

	//gbutton.textWrapping = "wordWrap" ;
	gbutton.textLineSpacing = 5 ;
	gbutton.textHorizontalAlignment = 'center' ;
	gbutton.textVerticalAlignment = 'center' ;
	gbutton.textAttr = {
		color: '#eee' ,
		outlineColor: '#444'
	} ;
	
	gbutton._registerEvents() ;

	advancedTexture.addControl( gbutton ) ;

	return gbutton ;
}

