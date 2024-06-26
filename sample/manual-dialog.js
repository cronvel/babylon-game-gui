
"use strict" ;

/* global BABYLON GAMEGUI */

const svgKit = GAMEGUI.svgKit ;



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

	var container = new BABYLON.GUI.Container( 'container' ) ;
	container.width = "700px" ;
	container.height = "250px" ;
	container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	advancedTexture.addControl( container ) ;

	var image = new BABYLON.GUI.Image( 'image' ) ;
	image.width = "100%" ;
	image.height = "100%" ;
	//image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
	
	image.source = "/sample/9p.png" ;
	image.stretch = BABYLON.GUI.Image.STRETCH_NINE_PATCH ;
	let sliceMargin = 70 ;
	image.sliceLeft = sliceMargin ;
	image.sliceTop = sliceMargin ;
	image.sliceRight = 256 - sliceMargin ;
	image.sliceBottom = 256 - sliceMargin ;
	container.addControl( image ) ;

	var flowingText = new BABYLON.GUI.FlowingText( 'flowingText' ) ;
	flowingText.width = "100%" ;
	flowingText.height = "100%" ;
    flowingText.setPadding( "50px" ) ;
    flowingText.markupText = "[Hello]<green> *my* **friend**, ***stay*** [awhile]<bg:blue> and _listen_..." ;
    flowingText.textWrapping = "wordWrap" ;
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
    flowingText.debugContainer = true ;
    flowingText.clip = false ;
    //flowingText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM ;
    //flowingText.autoScale = true ;
	//advancedTexture.addControl( flowingText ) ;
	container.addControl( flowingText ) ;

	return scene ;
}



