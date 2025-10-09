/*
	Babylon Game GUI

	Copyright (c) 2024 - 2025 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;

/* global BABYLON */



const DecoratedContainer = require( './DecoratedContainer.js' ) ;
const FlowingText = require( './FlowingText.js' ) ;
const helpers = require( './helpers.js' ) ;

const Promise = require( 'seventh' ) ;



/*
	To support new SVG Kit properties:

	* Add mapping for Dialog to Dialog's content (FlowingText) in the DecoratedContainer.createCommonContentGetterSetter() call (this file)
	* Add a getter and a setter to FlowingText (FlowingText file)
	* Add support for that new property in _setContentPropertiesNow() (this file)
*/



class Dialog extends DecoratedContainer {
	_text = null ;
	_markupText = null ;
	_structuredText = null ;

	constructor( name ) {
		super( name ) ;

		this._turnVisibleOnContentSizeReady = true ;

		// Default values
		this._contentProperties.paddingTop = '10px' ;
		this._contentProperties.paddingBottom = '10px' ;
		this._contentProperties.paddingLeft = '10px' ;
		this._contentProperties.paddingRight = '10px' ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return 'Dialog' ; }

	/*
	set autoScale( v ) {
		v = !! v ;
		if ( this._autoScale === v ) { return ; }
		this._autoScale = v ;
	}
	*/

	_setContentPropertiesNow( content = this._content ) {
		content._autoScale = false ;
		content.width = '100%' ;
		content.height = '100%' ;

		content.paddingTop = this._contentProperties.paddingTop ;
		content.paddingBottom = this._contentProperties.paddingBottom ;
		content.paddingLeft = this._contentProperties.paddingLeft ;
		content.paddingRight = this._contentProperties.paddingRight ;

		if ( content.paddingTopInPixels + content.paddingBottomInPixels > this.heightInPixels ) {
			console.warn( "Warning: Dialog height < padding, expanding height" , this.heightInPixels , content.paddingTopInPixels , content.paddingBottomInPixels ) ;
			this.heightInPixels = content.paddingTopInPixels + content.paddingBottomInPixels + 1 ;
		}

		if ( content.paddingLeftInPixels + content.paddingRightInPixels > this.widthInPixels ) {
			console.warn( "Warning: Dialog width < padding, expanding width" , this.widthInPixels , content.paddingLeftInPixels , content.paddingRightInPixels ) ;
			this.widthInPixels = content.paddingLeftInPixels + content.paddingRightInPixels + 1 ;
		}

		if ( this._contentProperties.structuredText ) {
			content.structuredText = this._contentProperties.structuredText ;
		}
		else if ( this._contentProperties.markupText ) {
			content.markupText = this._contentProperties.markupText ;
		}
		else if ( this._contentProperties.text ) {
			content.text = this._contentProperties.text ;
		}

		if ( this._contentProperties.textAttr ) { content.textAttr = this._contentProperties.textAttr ; }
		if ( this._contentProperties.lineSpacing ) { content.lineSpacing = this._contentProperties.lineSpacing ; }
		if ( this._contentProperties.textWrapping ) { content.textWrapping = this._contentProperties.textWrapping ; }
		if ( this._contentProperties.textVerticalAlignment ) { content.textVerticalAlignment = this._contentProperties.textVerticalAlignment ; }
		if ( this._contentProperties.textHorizontalAlignment ) { content.textHorizontalAlignment = this._contentProperties.textHorizontalAlignment ; }
		if ( this._contentProperties.textDynamicStyles ) { content.textDynamicStyles = this._contentProperties.textDynamicStyles ; }
		if ( this._contentProperties.fx ) { content.fx = this._contentProperties.fx ; }

		content.clip = false ;

		//console.warn( "dialog's content:" , content ) ;
	}

	_createContentNow() {
		var flowingText = new FlowingText( this.name + ':flowingText' ) ;

		// Call the setter
		this.content = flowingText ;
		flowingText.isPointerBlocker = this.isPointerBlocker ;

		//this._setContentProperties( flowingText ) ;
		this._setContentPropertiesNow( flowingText ) ;
	}

	/*
	_layout( parentMeasure , context ) {
		console.warn( "Calling Dialog _layout(), width:" , this.width , this.widthInPixels , this._content?.width , this._content?.widthInPixels ) ;
		return super._layout( parentMeasure , context ) ;
	}
	*/
}

Dialog.prototype._setContentProperties = Promise.debounceNextTick( Dialog.prototype._setContentPropertiesNow ) ;
Dialog.prototype._createContent = Promise.debounceNextTick( Dialog.prototype._createContentNow ) ;
//Dialog.prototype._createContent = Promise.debounceUpdate( { waitFn: () => Promise.resolveTimeout(1000) } , Dialog.prototype._createContentNow ) ;

DecoratedContainer.createCommonContentGetterSetter( Dialog.prototype , {
	text: 'text' ,
	markupText: 'markupText' ,
	structuredText: 'structuredText' ,

	textPaddingTop: 'paddingTop' ,
	textPaddingBottom: 'paddingBottom' ,
	textPaddingLeft: 'paddingLeft' ,
	textPaddingRight: 'paddingRight' ,

	textAttr: 'textAttr' ,
	textLineSpacing: 'lineSpacing' ,
	textWrapping: 'textWrapping' ,
	textVerticalAlignment: 'textVerticalAlignment' ,
	textHorizontalAlignment: 'textHorizontalAlignment' ,
	textDynamicStyles: 'textDynamicStyles' ,
	textFx: 'fx'
} ) ;



const CONTROL_INFOTIPS_MAP = new Map() ;

Dialog.autoInfotip = ( advancedTexture , control , infotipParams , openAllOnInit = false ) => {
	var timer = null ,
		overlapGroup = infotipParams.overlapGroup ?? null ,
		controlInfotips = Dialog.getControlInfotips( control ) ;

	const cleanup = () => {
		Dialog.closeAllInfotips( control ) ;
		control.onInfotipObservable.removeCallback( openInfotip ) ;
		control.onInfotipClosedObservable.removeCallback( closeInfotip ) ;
		clearInterval( timer ) ;
		timer = null ;
		CONTROL_INFOTIPS_MAP.delete( control ) ;
	} ;

	if ( openAllOnInit ) {
		const openAllInfotips = ( dynamicManager , now = false ) => {
			if ( ! now ) {
				if ( control.autoScaleReady ) {
					console.log( "waiting for control.autoScaleReady" ) ;
					control.autoScaleReady.then( () => openAllInfotips( dynamicManager , true ) ) ;
					return ;
				}
				/*
				else if ( control.onSizeUpdatedObservable ) {
					control.onSizeUpdatedObservable.addOnce( () => openAllInfotips( dynamicManager , true ) ) ;
					return ;
				}
				*/
			}
			
			/*
				/!\ For some reason, we have to apply a somewhat big timeout, since there is
				too much asyncness and no event exists that fire when things are stabilized.

				/!\ This is really dirty, and a more reliable way should be found. /!\

				This happens because control._currentMeasure.left/top are not correct at the time the method is called,
				even if it should, and it seems to be caused by alignment, that for some reasons is delayed in Babylon GUI?
				Or is it?
			*/
			setTimeout( () => {
				let allInfotips = dynamicManager.getAllBabylonControlEmittableEvents( 'infotip' ) ;
				//console.log( "dynamicManager:" , dynamicManager ) ;
				//console.log( "All infotips:" , allInfotips ) ;
				for ( let data of allInfotips ) {
					openInfotip( data ) ;
				}
			} , 150 ) ;
		} ;

		// This is a bit tedious, but we don't know if anything is ready and where it is located
		if ( control._dynamicManager ) {
			openAllInfotips( control._dynamicManager ) ;
		}
		else if ( control._content ) {
			if ( control._content._dynamicManager ) {
				openAllInfotips( control._content._dynamicManager ) ;
			}
			else if ( control._content.onDynamicManagerCreatedObservable ) {
				control._content.onDynamicManagerCreatedObservable.addOnce( dynamicManager => openAllInfotips( dynamicManager ) ) ;
			}
		}
		else if ( control.onDynamicManagerCreatedObservable ) {
			control.onDynamicManagerCreatedObservable.addOnce( dynamicManager => openAllInfotips( dynamicManager ) ) ;
		}
		else if ( control.onContentCreatedObservable ) {
			control.onContentCreatedObservable.addOnce( content => {
				if ( content.onDynamicManagerCreatedObservable ) {
					content.onDynamicManagerCreatedObservable.addOnce( dynamicManager => openAllInfotips( dynamicManager ) ) ;
				}
			} ) ;
		}
	}
	
	const deoverlap = () => {
		if ( overlapGroup === null ) { return ; }

		// This will deoverlap all controls in the AdvancedDynamicTexture with that overlapGroup
		helpers.deoverlapControls( advancedTexture , overlapGroup ) ;
	} ;

	const openInfotip = data => {
		//console.warn( "Infotip:" , data ) ;
		Dialog.openInfotip( advancedTexture  , control , data , infotipParams ) ;
		if ( Object.keys( controlInfotips ).length === 1 ) {
			timer = setInterval( deoverlap , 20 ) ;
		}
	} ;

	const closeInfotip = data => {
		//console.warn( "Infotip Closed:" , data ) ;
		Dialog.closeInfotip( control , data ) ;
		if ( ! Object.keys( controlInfotips ).length ) {
			clearInterval( timer ) ;
			timer = null ;
		}
	} ;

	control.onInfotipObservable.add( openInfotip ) ;
	control.onInfotipClosedObservable.add( closeInfotip ) ;
	control.onDisposeObservable.addOnce( cleanup ) ;
} ;

Dialog.autoOpenAllInfotips = ( advancedTexture , control , infotipParams ) => Dialog.autoInfotip( advancedTexture , control , infotipParams , true ) ;



Dialog.getControlInfotips = control => {
	var controlInfotips = CONTROL_INFOTIPS_MAP.get( control ) ;

	if ( ! controlInfotips ) {
		controlInfotips = {} ;
		CONTROL_INFOTIPS_MAP.set( control , controlInfotips ) ;
	}

	return controlInfotips ;
} ;



Dialog.openInfotip = async ( advancedTexture , control , data , params = {} ) => {
	var controlInfotips = Dialog.getControlInfotips( control ) ,
		uid = data.entityUid ;

	if ( controlInfotips[ uid ] ) { Dialog.closeInfotip( control , uid ) ; }
	if ( ! data.hint ) { return ; }
	var infotipControls = controlInfotips[ uid ] = {} ;

	//console.log( "Dialog.openInfotip" , data.hint ) ;

	var dialog = infotipControls.dialog = new Dialog( 'infotipDialog' ) ;
	dialog.text = data.hint ;
	dialog._entityUid = data.entityUid ;
	//dialog.markupText = data.hint ;

	dialog.idealWidthInPixels = params.idealWidthInPixels || 500 ;
	dialog.idealHeightInPixels = params.idealHeightInPixels || 50 ;

	dialog.textPaddingTop = params.textPaddingTop ?? '10px' ;
	dialog.textPaddingBottom = params.textPaddingBottom ?? '10px' ;
	dialog.textPaddingLeft = params.textPaddingLeft ?? '10px' ;
	dialog.textPaddingRight = params.textPaddingRight ?? '10px' ;

	dialog.type = params.type ?? BABYLON.GUI.DecoratedContainer.RECTANGLE ;
	dialog.backgroundColor = params.backgroundColor || '#888888' ;

	if ( params.textAttr ) { dialog.textAttr = params.textAttr ; }

	//dialog.overlapGroup = params.overlapGroup ?? control.overlapGroup ;
	if ( typeof params.overlapGroup === 'number' ) {
		dialog.overlapGroup = control.overlapGroup = params.overlapGroup ;
		control._fixedOnOverlap = true ;	// Prevent the control itself to move, only the infotip's dialogs
		dialog.overlapDeltaMultiplier = params.overlapDeltaMultiplier ?? 2 ;
	}

	// Force auto-scaling for all infotip dialog
	dialog.autoScale = true ;

	// Coordinate are relative to top-left
	dialog.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP ;
	dialog.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT ;

	var areaCenterX = ( data.foreignBoundingBox.xmin + data.foreignBoundingBox.xmax ) / 2 ;
	var areaCenterY = ( data.foreignBoundingBox.ymin + data.foreignBoundingBox.ymax ) / 2 ;

	dialog.autoScaleReady.then( async () => {
		let margin = 5 ;	// Security margin, to avoid bug with infotip overlapping the triggering area, thus closing the infotip immediately
		let dx = areaCenterX - control.centerX ;
		let dy = areaCenterY - control.centerY ;

		// For some reasons, contentSizes.width and contentSizes.height are not ready soon enough...
		let contentSizes = await dialog._content._getSizes() ;
		let width = contentSizes.innerWidth + dialog._content.paddingLeftInPixels + dialog._content.paddingRightInPixels ;
		let height = contentSizes.innerHeight + dialog._content.paddingTopInPixels + dialog._content.paddingBottomInPixels ;

		dialog.leftInPixels = dx > 0 ? data.foreignBoundingBox.xmax + margin : data.foreignBoundingBox.xmin - width - margin ;
		dialog.topInPixels = dy > 0 ? data.foreignBoundingBox.ymax + margin : data.foreignBoundingBox.ymin - height - margin ;
		helpers.forceControlOnScreen( advancedTexture , dialog ) ;
		//console.log( "coord:" , data.foreignBoundingBox , width , height , contentSizes , dialog._content.paddingLeftInPixels , dialog._content.paddingRightInPixels ) ;
		//dialog.isVisible = false ;
		line.isVisible = true ;
	} ) ;


	var line = infotipControls.line = new BABYLON.GUI.Line( 'infotipLine' ) ;
	line.lineWidth = 1 ;
	line.color = '#ddd' ;
	line.connectedControl = dialog ;
	//line.dash = [ 3 , 3 ] ;
	line.x1 = areaCenterX ;
	line.y1 = areaCenterY ;
	line.isVisible = false ;
	advancedTexture.addControl( line ) ;

	advancedTexture.addControl( dialog ) ;
} ;



// If data is null, force closing, else close only if the opened infotip is the one who need to be closed
// Dialog.closeInfotip( control , uid | data )
Dialog.closeInfotip = ( control , data = null ) => {
	var controlInfotips = Dialog.getControlInfotips( control ) ,
		uid = data && typeof data === 'object' ? data.entityUid : data ;

	var infotipControls = controlInfotips[ uid ] ;
	if ( ! infotipControls ) { return ; }

	if ( infotipControls.dialog ) {
		infotipControls.dialog.dispose() ;
	}

	if ( infotipControls.line ) {
		infotipControls.line.dispose() ;
	}

	delete controlInfotips[ uid ] ;
} ;



Dialog.closeAllInfotips = ( control ) => {
	var controlInfotips = Dialog.getControlInfotips( control ) ;
	for ( let uid of Object.keys( controlInfotips ) ) { Dialog.closeInfotip( control , uid ) ; }
} ;



module.exports = Dialog ;
BABYLON.GUI.Dialog = Dialog ;
BABYLON.RegisterClass( 'BABYLON.GUI.Dialog' , Dialog ) ;

