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
	_type = DecoratedContainer.RECTANGLE ;
	_decoration = null ;
	_content = null ;

	_autoScale = false ;	// if true, the box will fit its content
	_contentSizeReady = false ;
	_turnVisibleOnContentSizeReady = false ;

	// Things like Dialog (Infotip) need a size (usually width) to preformat its content
	_idealHeightInPixels = 0 ;
	_idealWidthInPixels = 0 ;

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

	_contentProperties = {} ;

	static RECTANGLE = 0 ;
	static IMAGE = 1 ;
	static VG = 2 ;

	constructor( name ) {
		super( name ) ;
		this._createDecoration() ;
		this._createContent() ;
	}

	dispose() {
		if ( this._decoration ) { this._decoration.dispose() ; }
		if ( this._content ) { this._content.dispose() ; }
		super.dispose() ;
	}

	_getTypeName() { return 'DecoratedContainer' ; }
	
	get idealWidthInPixels() { return this._idealWidthInPixels ; }
	set idealWidthInPixels( w ) {
		this._idealWidthInPixels = w ;
		this.widthInPixels = w ;
	}

	get idealHeightInPixels() { return this._idealHeightInPixels ; }
	set idealHeightInPixels( h ) {
		this._idealHeightInPixels = h ;
		this.heightInPixels = h ;
	}

	get decoration() { return this._decoration ; }
	set decoration( control ) {
		control = control || null ;
		if ( control === this._decoration ) { return ; }

		if ( this._decoration ) { this.removeControl( this._decoration ) ; }
		this._decoration = control ;

		if ( ! this._decoration ) { return ; }

		this._decoration.zIndex = 0 ;
		this.addControl( this._decoration ) ;

		if ( this._autoScale && this._turnVisibleOnContentSizeReady && ! this._contentSizeReady ) {
			this._decoration.isVisible = false ;
		}
	}

	get content() { return this._content ; }
	set content( control ) {
		if ( this._content ) { this.removeControl( this._content ) ; }

		this._content = control ;
		if ( ! this._content ) { return ; }

		this._content.zIndex = 1 ;
		this._content.onSizeUpdatedObservable.add( size => this._onContentSizeUpdated( size ) ) ;
		this.addControl( this._content ) ;
		
		if ( this._autoScale ) {
			if ( this._turnVisibleOnContentSizeReady ) {
				this._contentSizeReady = false ;
				this._content.isVisible = false ;
			}

			this._onContentSizeUpdated() ;
		}
	}

	get type() { return this._type ; }
	set type( t ) {
		this._type = t ;
		this._createDecoration() ;
	}

	get autoScale() { return this._autoScale ; }
	set autoScale( v ) {
		this._autoScale = !! v ;

		if ( this._autoScale ) {
			if ( this._content ) { this._onContentSizeUpdated() ; }
		}
		else {
			if ( this._turnVisibleOnContentSizeReady ) {
				if ( this._decoration ) { this._decoration.isVisible = true ; }
				if ( this._content ) { this._content.isVisible = true ; }
			}
		}
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

	// Must be subclassed
	_createContentNow() {}

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
		rect.width = '100%' ;
		rect.height = '100%' ;
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
		image.width = '100%' ;
		image.height = '100%' ;
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
	
	async _onContentSizeUpdated( size ) {
		if ( ! this._autoScale || ! this._content || ! this._idealWidthInPixels || ! this._idealHeightInPixels ) { return ; }
		console.error( "DecoratedContainer size BF: " , size ) ;
		if ( ! size ) { size = await this._content._getSizes() ; }

		// When it's zero sized, it's probably in progress
		console.error( "DecoratedContainer size AFT: " , size ) ;
		if ( ! size || ! size.width || ! size.height || ! size.innerWidth || ! size.innerHeight  ) { return ; }
		
		var width = size.innerWidth ,
			height = size.innerHeight ;

		console.error( "DecoratedContainer _onContentSizeUpdated() padding: " , this._content.paddingLeftInPixels , this._content.paddingRightInPixels , this._content.paddingTopInPixels , this._content.paddingBottomInPixels ) ;
		width += this._content.paddingLeftInPixels + this._content.paddingRightInPixels ;
		height += this._content.paddingTopInPixels + this._content.paddingBottomInPixels ;

		this.widthInPixels = width ;
		this.heightInPixels = height ;

		if ( ! this._contentSizeReady ) {
			this._contentSizeReady = true ;
			if ( this._turnVisibleOnContentSizeReady ) {
				this._decoration.isVisible = true ;
				this._content.isVisible = true ;
			}
		}
	}
	
	/*
	_layout( parentMeasure , context ) {
		console.warn( "Calling DecoratedContainer _layout()" ) ;
		return super._layout( parentMeasure , context ) ;
	}
	*/
}

DecoratedContainer.prototype._createContent = Promise.debounceNextTick( DecoratedContainer.prototype._createContentNow ) ;
DecoratedContainer.prototype._createDecoration = Promise.debounceNextTick( DecoratedContainer.prototype._createDecorationNow ) ;
DecoratedContainer.prototype._setRectangleProperties = Promise.debounceNextTick( DecoratedContainer.prototype._setRectanglePropertiesNow ) ;
DecoratedContainer.prototype._setImageProperties = Promise.debounceNextTick( DecoratedContainer.prototype._setImagePropertiesNow ) ;

DecoratedContainer.createCommonContentGetterSetter = ( prototype , properties ) => {
	for ( let fromProperty in properties ) {
		let toProperty = properties[ fromProperty ] ;

		Object.defineProperty( prototype , fromProperty , {
			get: function() {
				return this._contentProperties[ toProperty ] ;
			} ,
			set: function( value ) {
				if ( this._content ) {
					this._content[ toProperty ] = value ;
					// It may have changed because of content's setter, so we do it in that order
					this._contentProperties[ toProperty ] = this._content[ toProperty ] ;
				}
				else {
					this._contentProperties[ toProperty ] = value ;
				}
			}
		} ) ;
	}
} ;

module.exports = DecoratedContainer ;
BABYLON.GUI.DecoratedContainer = DecoratedContainer ;
BABYLON.RegisterClass( 'BABYLON.GUI.DecoratedContainer' , DecoratedContainer ) ;

