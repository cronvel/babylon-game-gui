
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

	//createActionButton( "Blah ".repeat( 22 ) + "..." ) ;
	var button = createActionButton( "Attack ([x2]<red>)" ) ;
	button.onPressedObservable.add( () => console.warn( "Button pressed" ) ) ;
	button.onPressedAndReleasedObservable.add( () => {
		console.warn( "Button pressed and released" ) ;
		button.disable() ;
		setTimeout( () => button.enable() , 2000 ) ;
	} ) ;

	return scene ;
}



function createActionButton( markupText ) {
	var button = new BABYLON.GUI.ActionButton( 'button' ) ;

	//button.width = 0.25 ; button.height = 0.1 ;
	button.width = "300px" ; button.height = "60px" ;

	//button.idealWidthInPixels = 100 ; button.idealHeightInPixels = 25 ;
	//button.autoScale = true ;
	button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	//button.paddingTop = button.paddingBottom = "10px" ;

	//button.backgroundColor = '#a5a' ;
	//button.borderColor = '#ddd' ;
	button.borderThickness = 4 ;
	button.cornerRadius = 4 ;
	button.textPaddingTop = '4px' ;
	button.textPaddingBottom = '4px' ;
	button.textPaddingLeft = '10px' ;
	button.textPaddingRight = '10px' ;

	// When it loses focus (e.g.: the mouse leaves)
	button.blurStyle = {
		backgroundColor: '#a5a' ,
		borderColor: '#ddd' ,
		textAttr: {
			color: '#eee' ,
			outlineColor: '#444'
		}
	} ;

	// When it gains focus (e.g.: the mouse is hovering, or with the keyboard/gamepad navigation, the button is selected)
	button.focusStyle = {
		backgroundColor: '#c7c' ,
		borderColor: '#eee' ,
		textAttr: {
			color: '#ffe' ,
			outlineColor: '#886'
		}
	} ;

	// When the button is pressed and its action is triggered (e.g.: it is clicked)
	button.pressedStyle = {
		duration: 300 ,		// The duration the style is used
		blinks: 2 ,			// How many times it blinks during this duration (1 blink alternate between the pressed style and the blur style)
		backgroundColor: '#e9e' ,
		borderColor: '#fff' ,
		textAttr: {
			color: '#ffe' ,
			outlineColor: '#886'
		}
	} ;

	// When the button is disabled (can't be interacted with)
	button.disabledStyle = {
		backgroundColor: '#777' ,
		borderColor: '#888' ,
		textAttr: {
			color: '#888' ,
			outlineColor: '#999'
		}
	} ;
 
	button.markupText = markupText ;

	//button.textWrapping = "wordWrap" ;
	button.textLineSpacing = 5 ;
	button.textHorizontalAlignment = 'center' ;
	button.textVerticalAlignment = 'center' ;
	
	advancedTexture.addControl( button ) ;

	return button ;
}

