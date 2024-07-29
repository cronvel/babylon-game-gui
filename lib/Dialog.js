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

	infotip.idealWidthInPixels = params.idealWidthInPixels || 300 ;
	infotip.idealHeightInPixels = params.idealHeightInPixels || 50 ;

	infotip.textPaddingTop = params.textPaddingTop ?? '10px' ;
	infotip.textPaddingBottom = params.textPaddingBottom ?? '10px' ;
	infotip.textPaddingLeft = params.textPaddingLeft ?? '10px' ;
	infotip.textPaddingRight = params.textPaddingRight ?? '10px' ;

	infotip.type = params.type ?? BABYLON.GUI.DecoratedContainer.RECTANGLE ;
	infotip.backgroundColor = params.backgroundColor || '#888888' ;

	//infotip.adaptWidthToChildren = true ; infotip.adaptHeightToChildren = true ;
	console.log( "coord:" , data.foreignBoundingBox.xmax , data.foreignBoundingBox.ymin ) ;
	console.log( "control alignment:" ,  control.verticalAlignment , control.horizontalAlignment , BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP , BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT ) ;
	//infotip.verticalAlignment = control.verticalAlignment ;
	//infotip.horizontalAlignment = control.horizontalAlignment ;
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

	control._infotip = infotip ;
} ;

Dialog.closeInfotip = ( control ) => {
    if ( ! control._infotip ) { return ; }
    control._infotip.dispose() ;
    control._infotip = null ;
} ;

module.exports = Dialog ;
BABYLON.GUI.Dialog = Dialog ;
BABYLON.RegisterClass( 'BABYLON.GUI.Dialog' , Dialog ) ;

