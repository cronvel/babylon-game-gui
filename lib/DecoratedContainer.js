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



//const VG = require( './VG.js' ) ;
//const svgKit = require( 'svg-kit' ) ;
//const Promise = require( 'seventh' ) ;



class DecoratedContainer extends BABYLON.GUI.Container {
	_type = null ;
	_decoration = null ;
	
	static RECTANGLE = 0 ;
	static IMAGE = 1 ;
	static VG = 2 ;

	constructor( name ) {
		super( name ) ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return "DecoratedContainer" ; }

	_createRectangle() {
		var rect = new BABYLON.GUI.Rectangle( this.name + ':rectangle' , this._imageUrl ) ;
		rect.width = this._width ;
		rect.height = this._height ;
		rect.cornerRadius = 20 ;
		rect.color = "orange" ;
		rect.thickness = 4 ;
		rect.background = "green" ;
		this._decoration = rect ;
		this.addControl( this._decoration ) ;
	}

	_createImage() {
		var image = new BABYLON.GUI.Image( this.name + ':image' , this._imageUrl ) ;
		image.width = this._width ;
		image.height = this._height ;
		image.stretch = BABYLON.GUI.Image.STRETCH_NINE_PATCH ;
	}
}

module.exports = DecoratedContainer ;
BABYLON.GUI.DecoratedContainer = DecoratedContainer ;
BABYLON.RegisterClass( 'BABYLON.GUI.DecoratedContainer' , DecoratedContainer ) ;

