
"use strict" ;

/* global BABYLON GAMEGUI */

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
	GAMEGUI.setFontUrl( 'serif' , './serif.ttf' ) ;
	GAMEGUI.setFontUrl( 'serif' , 'italic' , './serif-italic.ttf' ) ;
	GAMEGUI.setFontUrl( 'serif' , 'bold' , './serif-bold.ttf' ) ;
	GAMEGUI.setFontUrl( 'serif' , 'bold' , 'italic' , './serif-bold+italic.ttf' ) ;

	var flowingText = new BABYLON.GUI.FlowingText( 'flowingText' ) ;

	//flowingText.markupText = "[Hello]<green> *my* **friend**, ***stay*** [awhile]<bg:blue> and _listen_... Don't [shake]<fx:shake> !" ;
	//flowingText.text = "Some regular text !" ;
	//flowingText.markupText = "Some ?[text with infotip][Secret message]! Don't [shake]<fx:shake> !" ;
	//flowingText.markupText = "Some ?[text with infotip][This is a secret message...]! Don't [shake]<fx:shake> !" ;
	flowingText.markupText = "?[Lot][Thousands] of ?[infotip][This is a secret message... This is a secret message... This is a secret message... This is a secret message... This is a secret message... ]: ?[infotip1][infotip1] ?[infotip2][infotip2] ?[infotip3][infotip3]..."
	//flowingText.markupText = "?[Lot][Thousands] of ?[infotip][secret message...]: ?[infotip1][infotip1] ?[infotip2][infotip2] ?[infotip3][infotip3]..."
	//flowingText.markupText = "Some ?[text with infotip][Secret message...]! Don't [shake]<fx:shake> !" ;
	//flowingText.markupText = "Don't [shake]<fx:shake> !" ;

	flowingText.width = '300px' ;
	flowingText.height = '200px' ;
	//flowingText.textWrapping = "wordWrap" ;

	//*
	flowingText.textAttr = {
		color: '#777' ,
		outlineColor: '#fff'
	} ;
	//*/

	//flowingText.fx = { slowTyping: true } ;
	//flowingText.fx = { slowTyping: { speed: 0.5 } } ;

	//flowingText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP ; flowingText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT ;
	flowingText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	flowingText.autoScale = true ;
	advancedTexture.addControl( flowingText ) ;

	//BABYLON.GUI.Dialog.autoInfotip( advancedTexture , flowingText , {
	BABYLON.GUI.Dialog.autoOpenAllInfotips( advancedTexture , flowingText , {
		overlapGroup: 10
		//textAttr: { color: '#77f' }
	} ) ;

	return scene ;
}

