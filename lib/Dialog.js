/*
	Babylon Game GUI

	Copyright (c) 2023 Cédric Ronvel

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

const svgKit = require( 'svg-kit' ) ;
const Promise = require( 'seventh' ) ;



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

		content.textWrapping = 'wordWrap' ;

		if ( this._contentProperties.textAttr ) {
			content.textAttr = this._contentProperties.textAttr ;
		}

		if ( this._contentProperties.textDynamicStyles ) {
			content.textDynamicStyles = this._contentProperties.textDynamicStyles ;
		}

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
		//return Promise.resolved ;
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
	textDynamicStyles: 'textDynamicStyles' ,
} ) ;

Dialog.autoInfotip = ( advancedTexture , control , infotipParams ) => {
	control.onInfotipObservable.add( data => {
		console.warn( "Infotip:" , data ) ;
		Dialog.openInfotip( advancedTexture  , control , data , infotipParams ) ;
	} ) ;

	control.onInfotipClosedObservable.add( data => {
		console.warn( "Infotip Closed:" , data ) ;
		Dialog.closeInfotip( control ) ;
	} ) ;
} ;

Dialog.openInfotip = ( advancedTexture , control , data , params = {} ) => {
	if ( control._infotip ) { Dialog.closeInfotip( control ) ; }
	if ( ! data.hint ) { return ; }

	var infotip = new Dialog( 'infotip' ) ;
	infotip.text = data.hint ;
	//infotip.markupText = data.hint ;

	infotip.idealWidthInPixels = params.idealWidthInPixels || 500 ;
	infotip.idealHeightInPixels = params.idealHeightInPixels || 50 ;

	infotip.textPaddingTop = params.textPaddingTop ?? '10px' ;
	infotip.textPaddingBottom = params.textPaddingBottom ?? '10px' ;
	infotip.textPaddingLeft = params.textPaddingLeft ?? '10px' ;
	infotip.textPaddingRight = params.textPaddingRight ?? '10px' ;

	infotip.type = params.type ?? BABYLON.GUI.DecoratedContainer.RECTANGLE ;
	infotip.backgroundColor = params.backgroundColor || '#888888' ;

	// Coordinate are relative to top-left
	console.log( "coord:" , data.foreignBoundingBox.xmax , data.foreignBoundingBox.ymin ) ;
	infotip.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP ;
	infotip.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT ;

	let centerX = ( data.foreignBoundingBox.xmin + data.foreignBoundingBox.xmax ) / 2 ;
	let centerY = ( data.foreignBoundingBox.ymin + data.foreignBoundingBox.ymax ) / 2 ;
	infotip.left = ( centerX - infotip.idealWidthInPixels / 2 ) + 'px' ;
	infotip.top = ( centerY - infotip.idealHeightInPixels / 2 ) + 'px' ;
	//infotip.left = data.foreignBoundingBox.xmax + 'px' ; infotip.top = data.foreignBoundingBox.ymin - 70 + 'px' ;

	if ( params.textAttr ) { infotip.textAttr = params.textAttr ; }

	//infotip.overlapGroup = params.overlapGroup ?? control.overlapGroup ;
	infotip.overlapGroup = control.overlapGroup = 1 ;
	control._fixedOnOverlap = true ;
	infotip.overlapDeltaMultiplier = params.overlapDeltaMultiplier ?? 2 ;
	infotip.isPointerBlocker = false ;

	// Force auto-scaling for all infotip
	infotip.autoScale = true ;

	var line = new BABYLON.GUI.Line( 'line' )
	line.lineWidth = 1 ;
	line.color = '#ddd' ;
	line.connectedControl = infotip ;
	//line.dash = [ 3 , 3 ] ;
	line.x1 = centerX ;
	line.y1 = centerY ;
	advancedTexture.addControl( line ) ;

	advancedTexture.addControl( infotip ) ;

	//*
	advancedTexture.onBeginRenderObservable.add( () => {
		console.warn( "Deoverlap?" ) ;
		advancedTexture.moveToNonOverlappedRealPosition_mkp() ; // this will deoverlap all controls in the AdvancedDynamicTexture with overlapGroup set to a numeric value
		//advancedTexture.moveToNonOverlappedPosition(this._buttons) ; // this will deoverlap a given array of controls
		//advancedTexture.moveToNonOverlappedPosition(1) ; // this will deoverlap button-0, button-1 and button-3 (all belongs to group 1) 
		//advancedTexture.moveToNonOverlappedPosition(2) ; // this will deoverlap button-3 and button-4 (both in group 2)
	} ) ;
	//*/

	control._infotip = infotip ;
	control._infotipLine = line ;
} ;

Dialog.closeInfotip = ( control ) => {
    if ( control._infotipLine ) {
    	control._infotipLine.dispose() ;
    	control._infotipLine = null ;
	}

    if ( control._infotip ) {
	    control._infotip.dispose() ;
	    control._infotip = null ;
	}
} ;

module.exports = Dialog ;
BABYLON.GUI.Dialog = Dialog ;
BABYLON.RegisterClass( 'BABYLON.GUI.Dialog' , Dialog ) ;

