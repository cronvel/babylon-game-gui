
"use strict" ;

/* global BABYLON */



var canvas = document.getElementById( 'renderCanvas' ) ;

function startRenderLoop( engine , canvas_ ) {
	engine.runRenderLoop( () => {
		if ( sceneToRender && sceneToRender.activeCamera ) {
			sceneToRender.render() ;
		}
	} ) ;
}

var engine = null ;
var scene = null ;
var sceneToRender = null ;

function createDefaultEngine() {
	return new BABYLON.Engine( canvas , true , { preserveDrawingBuffer: true , stencil: true ,  disableWebGL2Support: false } ) ;
}



window.initFunction = async function() {
	async function asyncEngineCreation() {
		try {
			return createDefaultEngine() ;
		}
		catch( e ) {
			console.log( "the available createEngine function failed. Creating the default engine instead" ) ;
			return createDefaultEngine() ;
		}
	}

	window.engine = await asyncEngineCreation() ;

	if ( ! engine ) throw 'engine should not be null.' ;
	startRenderLoop( engine , canvas ) ;
	window.scene = await createScene() ;
} ;

window.initFunction().then( () => {
	sceneToRender = scene ;
} ) ;

// Resize
window.addEventListener( "resize" , () => {
	engine.resize() ;
} ) ;

