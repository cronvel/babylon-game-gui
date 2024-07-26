
"use strict" ;

/* global BABYLON GAMEGUI */

const svgKit = GAMEGUI.svgKit ;



var dialog = null ;
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

	createDialog(
		"[Hello]<green> *my* **friend**, ***stay*** [awhile]<bg:blue> and _listen_... "
		+ "Once upon a time, there was a [fearsome]<fx:quiver> dragon that was devastating the country..."
	) ;
	
	dialog.onPointerUpObservable.add( () => {
		createDialog(
			"But a valiant hero deflected the dragon's fire breath with its holy shield, "
			+ "and stabbed the dragon's heart with its divine sword... "
			+ "and the people rejoiced!"
		) ;
		dialog.onPointerUpObservable.add( () => dismissDialog() ) ;
	} ) ;

	return scene ;
}



function dismissDialog() {
	if ( dialog ) {
		advancedTexture.removeControl( dialog ) ;
		dialog = null ;
	}
}



function createDialog( markupText ) {
	dismissDialog() ;

	dialog = new BABYLON.GUI.Dialog( 'dialog' ) ;
	//dialog.text = "bob" ;
	//dialog.width = "700px" ; dialog.height = "250px" ;
	dialog.idealWidthInPixels = 500 ; dialog.idealHeightInPixels = 100 ;
	//dialog.paddingLeft = "50px" ;
	dialog.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;

	/*
	dialog.backgroundColor = 'green' ;
	dialog.borderColor = 'orange' ;
	dialog.borderThickness = 8 ;
	dialog.cornerRadius = 4 ;
	//*/
	
	//*
	dialog.type = BABYLON.GUI.DecoratedContainer.IMAGE ;
	dialog.source = "/sample/9p.png" ;
	dialog.stretch = BABYLON.GUI.Image.STRETCH_NINE_PATCH ;
	let sliceMargin = 70 ;
	dialog.sliceLeft = sliceMargin ;
	dialog.sliceTop = sliceMargin ;
	dialog.sliceRight = 256 - sliceMargin ;
	dialog.sliceBottom = 256 - sliceMargin ;
	dialog.textPaddingTop = '40px' ;
	dialog.textPaddingBottom = '40px' ;
	dialog.textPaddingLeft = '50px' ;
	dialog.textPaddingRight = '50px' ;
	//*/

	dialog.markupText = markupText ;

	
	//dialog.textWrapping = "wordWrap" ;
	dialog.textAttr = {
		color: '#777' ,
		outlineColor: '#fff'
	} ;
	dialog.autoScale = true ;
	
	advancedTexture.addControl( dialog ) ;
}

