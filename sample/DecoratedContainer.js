
"use strict" ;

/* global BABYLON GAMEGUI */

var svgKit = GAMEGUI.svgKit ;



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

	var ctl = new BABYLON.GUI.DecoratedContainer( 'decoratedContainer' ) ;
	ctl.width = "700px" ;
	ctl.height = "250px" ;
	ctl.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	
	/*
	ctl.backgroundColor = 'green' ;
	ctl.borderColor = 'orange' ;
	ctl.borderThickness = 8 ;
	ctl.cornerRadius = 4 ;
	//*/
	
	//*
	ctl.type = BABYLON.GUI.DecoratedContainer.IMAGE ;
	ctl.source = "/sample/9p.png" ;
	ctl.stretch = BABYLON.GUI.Image.STRETCH_NINE_PATCH ;
	let sliceMargin = 70 ;
	ctl.sliceLeft = sliceMargin ;
	ctl.sliceTop = sliceMargin ;
	ctl.sliceRight = 256 - sliceMargin ;
	ctl.sliceBottom = 256 - sliceMargin ;
	//*/

	advancedTexture.addControl( ctl ) ;
	
	return scene ;
}

