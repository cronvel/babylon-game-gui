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

		// Default values
		this._contentProperties.paddingTop = '40px' ;
		this._contentProperties.paddingBottom = '40px' ;
		this._contentProperties.paddingLeft = '50px' ;
		this._contentProperties.paddingRight = '50px' ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return 'Dialog' ; }
	
	_setContentPropertiesNow( content = this._content ) {
		this._fixContentAutoScale( content ) ;

		content.paddingTop = this._contentProperties.paddingTop ;
		content.paddingBottom = this._contentProperties.paddingBottom ;
		content.paddingLeft = this._contentProperties.paddingLeft ;
		content.paddingRight = this._contentProperties.paddingRight ;

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
		content.textAttr = {
			fontSize: 30 ,
			color: '#777' ,
			outline: true ,
			frameCornerRadius: '0.2em' ,
			frameOutlineWidth: '0.1em'
			//outlineColor: '#afa' ,
			//lineOutline: true ,
			//lineColor: '#559'
		} ;
		content.debugContainer = true ;
		content.clip = false ;

		
		console.warn( "dialog's content:" , content ) ;
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
} ) ;

module.exports = Dialog ;
BABYLON.GUI.Dialog = Dialog ;
BABYLON.RegisterClass( 'BABYLON.GUI.Dialog' , Dialog ) ;

