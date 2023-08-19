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
	_flowingText = null ;

	constructor( name ) {
		super( name ) ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return "Dialog" ; }

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
}

module.exports = Dialog ;
BABYLON.GUI.Dialog = Dialog ;
BABYLON.RegisterClass( 'BABYLON.GUI.Dialog' , Dialog ) ;

