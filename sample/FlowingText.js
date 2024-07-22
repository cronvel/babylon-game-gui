
"use strict" ;

/* global BABYLON GAMEGUI */

var svgKit = GAMEGUI.svgKit ;



async function createScene() {
	// This creates a basic Babylon Scene object (non-mesh)
	var scene = new BABYLON.Scene( engine ) ;

	// This creates and positions a free camera (non-mesh)
	var camera = new BABYLON.FreeCamera( 'camera1' , new BABYLON.Vector3( 0 , 5 , - 10 ) , scene ) ;

	// This targets the camera to scene origin
	camera.setTarget( BABYLON.Vector3.Zero() ) ;

	// This attaches the camera to the canvas
	camera.attachControl( canvas , true ) ;

	// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
	var light = new BABYLON.HemisphericLight( 'light' , new BABYLON.Vector3( 0 , 1 , 0 ) , scene ) ;

	// Default intensity is 1. Let's dim the light a small amount
	light.intensity = 0.7 ;

	// Our built-in 'ground' shape.
	var ground = BABYLON.MeshBuilder.CreateGround( 'ground' , { width: 6 , height: 6 } , scene ) ;

	// GUI
	var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI( 'UI' ) ;

	//console.log( GAMEGUI , BABYLON.GUI ) ;
	svgKit.fontLib.setFontUrl( 'serif' , './serif.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'italic' , './serif-italic.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , './serif-bold.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , 'italic' , './serif-bold+italic.ttf' ) ;

	var flowingText = new BABYLON.GUI.FlowingText( 'flowingText' ) ;
	//console.log( "BF flowingText.markupText =" ) ;
	//flowingText.markupText = "[Hello]<green> *my* **friend**, ***stay*** [awhile]<bg:blue> and _listen_... Don't [shake]<fx:shake> !" ;
	//flowingText.text = "Some regular text !" ;
	//flowingText.markupText = "Some ?[text with infotip][Secret message]! Don't [shake]<fx:shake> !" ;
	flowingText.markupText = "Some ?[text with infotip][Secret message...]! Don't [shake]<fx:shake> !" ;
	//flowingText.markupText = "Some ?[text with infotip][Secret message...]! Don't [shake]<fx:shake> !" ;
	//flowingText.markupText = "Don't [shake]<fx:shake> !" ;
	//console.log( "BF flowingText.width =" ) ;
	flowingText.width = '300px' ;
	//console.log( "BF flowingText.height =" ) ;
	flowingText.height = '200px' ;
	//flowingText.textWrapping = "wordWrap" ;
	/*
	flowingText.textAttr = {
		fontSize: 30 ,
		color: '#777' ,
		outline: true ,
		frameCornerRadius: '0.2em' ,
		frameOutlineWidth: '0.1em'
		//outlineColor: '#afa' ,
		//lineOutline: true ,
		//lineColor: '#559'
	} ;
	//*/
	//flowingText.fx = { slowTyping: true } ;
	//console.log( "BF flowingText.verticalAlignment =" ) ;
	//flowingText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP ; flowingText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT ;
	flowingText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	//console.log( "BF flowingText.autoScale =" ) ;
	flowingText.autoScale = true ;
	//console.log( "BF advancedTexture.addControl" ) ;
	advancedTexture.addControl( flowingText ) ;

	flowingText.onInfotipObservable.add( data => {
		console.warn( "Infotip:" , data ) ;
		openInfotip( advancedTexture  , data ) ;
	} ) ;

	flowingText.onInfotipClosedObservable.add( data => {
		console.warn( "Infotip Closed:" , data ) ;
		closeInfotip() ;
	} ) ;

	return scene ;
}



var infotip = null ;

function openInfotip( advancedTexture , data ) {
	if ( infotip ) { closeInfotip() ; }
	if ( ! data.hint ) { return ; }

	infotip = new BABYLON.GUI.Dialog( 'infotip' ) ;
	infotip.text = data.hint ;
	//infotip.markupText = data.hint ;
	infotip.idealWidthInPixels = 300 ; infotip.idealHeightInPixels = 50 ;
	infotip.textPaddingTop = '10px' ;
	infotip.textPaddingBottom = '10px' ;
	infotip.textPaddingLeft = '10px' ;
	infotip.textPaddingRight = '10px' ;
	infotip.type = BABYLON.GUI.DecoratedContainer.RECTANGLE ;
	infotip.backgroundColor = '#888888' ;
	//infotip.adaptWidthToChildren = true ; infotip.adaptHeightToChildren = true ;
	console.log( "coord:" , data.foreignBoundingBox.xmax , data.foreignBoundingBox.ymin ) ;
	infotip.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP ; infotip.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT ;
	infotip.left = data.foreignBoundingBox.xmax + 'px' ; infotip.top = data.foreignBoundingBox.ymin - 70 + 'px' ;
	//infotip.left = '-100px' ; infotip.top = '-100px' ;
	/*
	infotip.textAttr = {
		fontSize: 30 ,
		color: '#777' ,
		outline: true ,
		frameCornerRadius: '0.2em' ,
		frameOutlineWidth: '0.1em'
		//outlineColor: '#afa' ,
		//lineOutline: true ,
		//lineColor: '#559'
	} ;
	//*/
	infotip.autoScale = true ;
	advancedTexture.addControl( infotip ) ;
}



function closeInfotip() {
	if ( ! infotip ) { return ; }
	infotip.dispose() ;
}

