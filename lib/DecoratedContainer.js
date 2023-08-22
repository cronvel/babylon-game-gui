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



const VG = require( './VG.js' ) ;

const Promise = require( 'seventh' ) ;



class DecoratedContainer extends BABYLON.GUI.Container {
	_type = null ;
	_decoration = null ;
	_content = null ;

	_backgroundColor = null ;
	_borderColor = null ;
	_borderThickness = null ;
	_cornerRadius = null ;

	_source = null ;
	_stretch = VG.STRETCH_FILL ;
	_sliceLeft = null ;
	_sliceTop = null ;
	_sliceRight = null ;
	_sliceBottom = null ;

	static RECTANGLE = 0 ;
	static IMAGE = 1 ;
	static VG = 2 ;

	constructor( name ) {
		super( name ) ;
		this.type = DecoratedContainer.RECTANGLE ;
	}

	dispose() {
		super.dispose() ;
		if ( this._decoration ) { this._decoration.dispose() ; }
		if ( this._content ) { this._content.dispose() ; }
	}

	_getTypeName() { return "DecoratedContainer" ; }
	
	//*
	get width() { return super.width ; }
	set width( w ) {
		super.width = w ;
		if ( this._content ) { this._updateContentWidth() ; }
	}
	
	get height() { return super.height ; }
	set height( h ) {
		super.height = h ;
		if ( this._content ) { this._updateContentHeight() ; }
	}

	get paddingLeft() { return super.paddingLeft ; }
	set paddingLeft( v ) {
		super.paddingLeft = v ;
		if ( this._content ) { this._updateContentWidth() ; }
	}

	get paddingTop() { return super.paddingTop ; }
	set paddingTop( v ) {
		super.paddingTop = v ;
		if ( this._content ) { this._updateContentHeight() ; }
	}

	get paddingRight() { return super.paddingRight ; }
	set paddingRight( v ) {
		super.paddingRight = v ;
		if ( this._content ) { this._updateContentWidth() ; }
	}

	get paddingBottom() { return super.paddingBottom ; }
	set paddingBottom( v ) {
		super.paddingBottom = v ;
		if ( this._content ) { this._updateContentHeight() ; }
	}

	_updateContentWidth( content = this._content ) {
		content.width = this.width ;
		return ;
		console.warn( "w:" , content.name , this.width , this.widthInPixels , this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels ) ;
		//content.widthInPixels = this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels ;
	}

	_updateContentHeight( content = this._content ) {
		content.height = this.height ;
		return ;
		console.warn( "h:" , content.name , this.height , this.heightInPixels , this.heightInPixels - this.paddingTopInPixels - this.paddingBottomInPixels ) ;
		//content.heightInPixels = this.heightInPixels - this.paddingTopInPixels - this.paddingBottomInPixels ;
	}
	//*/

	get decoration() { return this._decoration ; }
	set decoration( control ) {
		control = control || null ;
		if ( control === this._decoration ) { return ; }

		if ( this._decoration ) { this.removeControl( this._decoration ) ; }
		this._decoration = control ;

		if ( this._decoration ) {
			this._decoration.zIndex = 0 ;
			this.addControl( this._decoration ) ;
		}
	}

	get content() { return this._content ; }
	set content( control ) {
		if ( this._content ) { this.removeControl( this._content ) ; }
		this._content = control ;
		this._content.zIndex = 1 ;
		this.addControl( this._content ) ;
	}

	get type() { return this._type ; }
	set type( t ) {
		this._type = t ;
		this._createDecoration() ;
	}

	get backgroundColor() { return this._backgroundColor ; }
	set backgroundColor( v ) {
		this._backgroundColor = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.RECTANGLE ) {
			this._decoration.background = this._backgroundColor ;
		}
	}

	get borderColor() { return this._borderColor ; }
	set borderColor( v ) {
		this._borderColor = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.RECTANGLE ) {
			this._decoration.color = this._borderColor ;
		}
	}

	get borderThickness() { return this._borderThickness ; }
	set borderThickness( v ) {
		this._borderThickness = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.RECTANGLE ) {
			this._decoration.thickness = this._borderThickness ;
		}
	}

	get cornerRadius() { return this._cornerRadius ; }
	set cornerRadius( v ) {
		this._cornerRadius = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.RECTANGLE ) {
			this._decoration.thickness = this._cornerRadius ;
		}
	}

	get source() { return this._source ; }
	set source( v ) {
		this._source = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.IMAGE ) {
			this._decoration.source = this._source ;
		}
	}

	get stretch() { return this._stretch ; }
	set stretch( v ) {
		this._stretch = v ?? VG.STRETCH_FILL ;
		if ( this._decoration && this._type === DecoratedContainer.IMAGE || this._type === DecoratedContainer.VG ) {
			this._decoration.stretch = this._stretch ;
		}
	}

	get sliceLeft() { return this._sliceLeft ; }
	set sliceLeft( v ) {
		this._sliceLeft = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.IMAGE || this._type === DecoratedContainer.VG ) {
			this._decoration.sliceLeft = this._sliceLeft ;
		}
	}

	get sliceTop() { return this._sliceTop ; }
	set sliceTop( v ) {
		this._sliceTop = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.IMAGE || this._type === DecoratedContainer.VG ) {
			this._decoration.sliceTop = this._sliceTop ;
		}
	}

	get sliceRight() { return this._sliceRight ; }
	set sliceRight( v ) {
		this._sliceRight = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.IMAGE || this._type === DecoratedContainer.VG ) {
			this._decoration.sliceRight = this._sliceRight ;
		}
	}

	get sliceBottom() { return this._sliceBottom ; }
	set sliceBottom( v ) {
		this._sliceBottom = v || null ;
		if ( this._decoration && this._type === DecoratedContainer.IMAGE || this._type === DecoratedContainer.VG ) {
			this._decoration.sliceBottom = this._sliceBottom ;
		}
	}

	_createDecorationNow() {
		switch ( this._type ) {
			case DecoratedContainer.RECTANGLE :
				this._createRectangleNow() ;
				break ;
			case DecoratedContainer.IMAGE :
				this._createImageNow() ;
				break ;
			case DecoratedContainer.VG :
				this._createVgNow() ;
				break ;
			default :
				this.decoration = null ;
				break ;
		}
	}

	_setRectanglePropertiesNow( rect = this._decoration ) {
		rect.width = this._width ;
		rect.height = this._height ;
		rect.background = this._backgroundColor ;
		rect.color = this._borderColor ;
		rect.thickness = this._borderThickness ;
		rect.cornerRadius = this._cornerRadius ;
	}

	_createRectangleNow() {
		var rect = new BABYLON.GUI.Rectangle( this.name + ':rectangle' , this._imageUrl ) ;
		this._setRectanglePropertiesNow( rect ) ;
		// Call the setter
		this.decoration = rect ;
	}

	_setImagePropertiesNow( image = this._decoration ) {
		image.width = this._width ;
		image.height = this._height ;
		image.source = this._source ;
		image.stretch = this._stretch ;

		image.sliceLeft = this._sliceLeft ;
		image.sliceRight = this._sliceRight ;
		image.sliceTop = this._sliceTop ;
		image.sliceBottom = this._sliceBottom ;
	}

	_createImageNow() {
		//var image = new BABYLON.GUI.Image( this.name + ':image' , this._source ) ;
		var image = new BABYLON.GUI.Image( this.name + ':image' ) ;
		this._setImagePropertiesNow( image ) ;
		// Call the setter
		this.decoration = image ;
	}
}

DecoratedContainer.prototype._createDecoration = Promise.debounceNextTick( DecoratedContainer.prototype._createDecorationNow ) ;
DecoratedContainer.prototype._setRectangleProperties = Promise.debounceNextTick( DecoratedContainer.prototype._setRectanglePropertiesNow ) ;
DecoratedContainer.prototype._setImageProperties = Promise.debounceNextTick( DecoratedContainer.prototype._setImagePropertiesNow ) ;

module.exports = DecoratedContainer ;
BABYLON.GUI.DecoratedContainer = DecoratedContainer ;
BABYLON.RegisterClass( 'BABYLON.GUI.DecoratedContainer' , DecoratedContainer ) ;

