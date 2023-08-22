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
		content.width = "100%" ;
		content.height = "100%" ;
		content.setPadding( "40px" , "50px" ) ;
		this.content = content ;
		//this._createContent() ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return "Dialog" ; }
	
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
	}

	_setContentPropertiesNow( content = this._content ) {
		//this._updateContentWidth( content ) ;
		//this._updateContentHeight( content ) ;
		//content.width = "100%" ;
		//content.height = "100%" ;
		content.width = this.width ;
		content.height = this.height ;
		content.left = "100px" ;
		console.warn( "content:" , content ) ;
		//content.paddingTop = "100px" ;
		content.markupText = this._markupText ;
	}

	_createContentNow() {
		var flowingText = new FlowingText( this.name + ':flowingText' ) ;
		this._setContentPropertiesNow( flowingText ) ;
		// Call the setter
		this.content = flowingText ;
	}
	*/
}

//Dialog.prototype._setContentProperties = Promise.debounceNextTick( Dialog.prototype._setContentPropertiesNow ) ;
//Dialog.prototype._createContent = Promise.debounceNextTick( Dialog.prototype._createContentNow ) ;

module.exports = Dialog ;
BABYLON.GUI.Dialog = Dialog ;
BABYLON.RegisterClass( 'BABYLON.GUI.Dialog' , Dialog ) ;

