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
		var content = new FlowingText( this.name + ':flowingText' ) ;
		content._autoScale = false ;
		this.content = content ;
		//this._createContent() ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return "Dialog" ; }
	
	get width() { return super.width ; }
	set width( w ) {
		super.width = w ;
		this._content.width = w ;
	}

	get height() { return super.height ; }
	set height( h ) {
		super.height = h ;
		this._content.width = h ;
	}

	get markupText() { return this._content.markupText ; }
	set markupText( _markupText ) { this._content.markupText = _markupText ; }

	/*
	get markupText() { return this._markupText ; }
	set markupText( _markupText ) {
		if ( this._markupText === _markupText ) { return ; }
		this._markupText = _markupText ;
		if ( this._markupText ) { this._text = this._structuredText = null ; }
		this._setContentProperties() ;
	}
	//*/

	/*
	set autoScale( v ) {
		v = !! v ;
		if ( this._autoScale === v ) { return ; }
		this._autoScale = v ;
		if ( this._autoScale && this._vgRendered ) { this.synchronizeSizeWithContent() ; }

		if ( this._autoScale && this._vg ) {
			this._vgFlowingText.getContentBoundingBox().then( bbox => {
				this._vg.set( {
					viewBox: {
						x: 0 , y: 0 , width: this.widthInPixels , height: Math.min( bbox.height , this.heightInPixels )
					}
				} ) ;
			} ) ;
		}
	}
	*/

	_setContentPropertiesNow( content = this._content ) {
		content.width = this._width ;
		content.height = this._height ;
		content.markupText = this._markupText ;
	}

	_createContentNow() {
		var flowingText = new FlowingText( this.name + ':flowingText' ) ;
		this._setContentPropertiesNow( flowingText ) ;
		// Call the setter
		this.content = flowingText ;
	}
}

Dialog.prototype._setContentProperties = Promise.debounceNextTick( Dialog.prototype._setContentPropertiesNow ) ;
Dialog.prototype._createContent = Promise.debounceNextTick( Dialog.prototype._createContentNow ) ;

module.exports = Dialog ;
BABYLON.GUI.Dialog = Dialog ;
BABYLON.RegisterClass( 'BABYLON.GUI.Dialog' , Dialog ) ;

