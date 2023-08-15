
"use strict" ;

/* global BABYLON GAMEGUI */



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

	var button1 = BABYLON.GUI.Button.CreateSimpleButton( "but1" , "Click Me" ) ;
	button1.width = "150px" ;
	button1.height = "40px" ;
	button1.color = "white" ;
	button1.cornerRadius = 20 ;
	button1.background = "green" ;
	button1.onPointerUpObservable.add( () => {
		alert( "button clicked!" ) ;
	} ) ;
	advancedTexture.addControl( button1 ) ;

	//console.log( GAMEGUI , BABYLON.GUI ) ;
	svgKit.fontLib.setFontUrl( 'serif' , './serif.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'italic' , './serif-italic.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , './serif-bold.ttf' ) ;
	svgKit.fontLib.setFontUrl( 'serif' , 'bold' , 'italic' , './serif-bold+italic.ttf' ) ;
	await svgKit.fontLib.preloadFontFamily( 'serif' ) ;
	console.log( "OK!" ) ;

	//var vg = createTestVg() ;
	var dialog = new BABYLON.GUI.Dialog( 'dialog' ) ;
	dialog.markupText = "Hello world!" ;
	//dialog.width = vg.viewBox.width + "px" ;
	//dialog.height = vg.viewBox.height + "px" ;
	dialog.width = "300px" ;
	dialog.height = "200px" ;
	//dialog.stretch = BABYLON.GUI.VG.STRETCH_UNIFORM ;
	dialog.stretch = BABYLON.GUI.VG.STRETCH_EXTEND ; dialog.autoScale = true ;
	dialog.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	dialog.onPointerUpObservable.add( () => {
		alert( "dialog clicked!" ) ;
	} ) ;
	advancedTexture.addControl( dialog ) ;

	return scene ;
}

