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



const Observable = BABYLON.Observable ;

const VG = require( './VG.js' ) ;

const svgKit = require( 'svg-kit' ) ;
const Promise = require( 'seventh' ) ;



class FlowingText extends VG {
	_text = null ;
	_markupText = null ;
	_structuredText = null ;

	_lineSpacing = 5 ;
	_textWrapping = 'wordwrap' ;
	_textVerticalAlignment = 'top' ;
	_textHorizontalAlignment = 'left' ;

	_textAttr = new svgKit.TextAttribute( {
		fontSize: 30 ,
		color: '#fff' ,
		outline: true ,
		outlineColor: '#000' ,
		frameCornerRadius: '0.2em' ,
		frameOutlineWidth: '0.1em'
	} ) ;

	_textDynamicStyles = {
		linkUnderline: true ,
		linkColor: '#c88' ,
		linkHoverColor: '#aae' ,
		linkPressColor: '#bbf' ,

		infotipUnderline: true ,
		infotipColor: '#448' ,
		infotipHoverColor: '#488'
	} ;

	_fx = null ;

	_vgFlowingText = null ;
	_vgGenerated = null ;

	_lastWidth = null ;
	_lastHeight = null ;

	_isAutoVg = true ;

	onSizeUpdatedObservable = new Observable() ;

	constructor( name ) {
		super( name ) ;
	}

	dispose() {
		if ( this._dynamicManager ) {
			this._dynamicManager.destroy() ;
			this._dynamicManager = null ;
		}

		super.dispose() ;
	}

	_getTypeName() { return 'FlowingText' ; }

	set width( w ) {
		super.width = w ;
		if ( this._autoScale ) { this._adaptVgSize() ; }
	}

	set height( h ) {
		super.height = h ;
		if ( this._autoScale ) { this._adaptVgSize() ; }
	}

	get text() { return this._text ; }
	set text( _text ) {
		if ( this._text === _text ) { return ; }
		this._text = _text ;
		if ( this._text ) { this._markupText = this._structuredText = null ; }
		this._generateVg() ;
	}

	get markupText() { return this._markupText ; }
	set markupText( _markupText ) {
		if ( this._markupText === _markupText ) { return ; }
		this._markupText = _markupText ;
		if ( this._markupText ) { this._text = this._structuredText = null ; }
		this._generateVg() ;
	}

	get structuredText() { return this._structuredText ; }
	set structuredText( _structuredText ) {
		if ( this._structuredText === _structuredText ) { return ; }
		this._structuredText = _structuredText ;
		if ( this._structuredText ) { this._text = this._markupText = null ; }
		this._generateVg() ;
	}

	get textAttr() { return this._textAttr ; }
	set textAttr( _textAttr ) {
		this._textAttr.set( _textAttr ) ;
		this._generateVg() ;
	}

	get lineSpacing() { return this._lineSpacing ; }
	set lineSpacing( _lineSpacing ) {
		this._lineSpacing = _lineSpacing ;
		this._generateVg() ;
	}

	get textWrapping() { return this._textWrapping ; }
	set textWrapping( _textWrapping ) {
		this._textWrapping = _textWrapping ;
		this._generateVg() ;
	}

	get textVerticalAlignment() { return this._textVerticalAlignment ; }
	set textVerticalAlignment( _textVerticalAlignment ) {
		this._textVerticalAlignment = _textVerticalAlignment ;
		this._generateVg() ;
	}

	get textHorizontalAlignment() { return this._textHorizontalAlignment ; }
	set textHorizontalAlignment( _textHorizontalAlignment ) {
		this._textHorizontalAlignment = _textHorizontalAlignment ;
		this._generateVg() ;
	}

	get textDynamicStyles() { return this._textDynamicStyles ; }
	set textDynamicStyles( _textDynamicStyles ) {
		if ( ! _textDynamicStyles || typeof _textDynamicStyles !== 'object' ) { return ; }
		var changed = false ;

		for ( let styleName in _textDynamicStyles ) {
			if ( this._textDynamicStyles[ styleName ] !== undefined && this._textDynamicStyles[ styleName ] !== _textDynamicStyles[ styleName ]  ) {
				this._textDynamicStyles[ styleName ] = _textDynamicStyles[ styleName ] ;
				changed = true ;
			}
		}

		if ( changed ) { this._generateVg() ; }
	}

	get fx() { return this._fx ; }
	set fx( _fx ) {
		if ( this._fx === _fx ) { return ; }
		this._fx = _fx ;
		this._generateVg() ;
	}

	set autoScale( v ) {
		v = !! v ;
		if ( this._autoScale === v ) { return ; }
		this._autoScale = v ;
		if ( this._autoScale ) {
			if ( this._vgRendered ) { this.synchronizeSizeWithContent() ; }
			this._adaptVgSize() ;
		}
	}

	async _generateVgNow() {
		var params = {
			x: 0 ,
			y: 0 ,
			width: this.widthInPixels ,
			height: this.heightInPixels ,
			attr: this._textAttr ,
			clip: false ,
			lineSpacing: this._lineSpacing ,
			textWrapping: this._textWrapping ,
			textVerticalAlignment: this._textVerticalAlignment ,
			textHorizontalAlignment: this._textHorizontalAlignment ,
			dynamicStyles: this._textDynamicStyles ,
			fx: this._fx
		} ;

		if ( this._structuredText ) { params.structuredText = this._structuredText ; }
		else if ( this._markupText ) { params.markupText = this._markupText ; }
		else if ( this._text ) { params.text = this._text ; }

		//console.warn( "### VGFlowingText( params ):" , params ) ;
		this._vg = new svgKit.VG() ;
		this._vgFlowingText = new svgKit.VGFlowingText( params ) ;
		this._vg.addEntity( this._vgFlowingText ) ;

		if ( this._dynamicManager ) {
			//console.warn( "### Destroy this._dynamicManager" ) ;
			this._dynamicManager.destroy() ;
			this._dynamicManager = null ;
		}

		await this._adaptVgSize() ;
		this._afterVgUpdate() ;
	}

	async _adaptVgSizeNow() {
		if ( ! this._vg ) { return ; }
		//console.error( "Entering _adaptVgSizeNow()" ) ;

		var viewBox ;

		if ( this._autoScale ) {
			let bbox = await this._vgFlowingText.getContentBoundingBox() ;

			// The VG can be gone by the time we got the bounding box
			if ( ! this._vg ) { return ; }

			viewBox = {
				x: 0 ,
				y: 0 ,
				width: Math.max( 0 , this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels ) ,
				height: Math.max( 0 , Math.min( bbox.height , this.heightInPixels - this.paddingTopInPixels - this.paddingBottomInPixels ) )
			} ;
		}
		else {
			viewBox = {
				x: 0 ,
				y: 0 ,
				width: Math.max( 0 , this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels ) ,
				height: Math.max( 0 , this.heightInPixels - this.paddingTopInPixels - this.paddingBottomInPixels )
			} ;
		}

		if ( ! this._vg.viewBox.isEqualToObject( viewBox ) ) {
			//console.warn( "_adaptVgSizeNow() " , this._autoScale ? '[autoscale] :' : ':' , viewBox , this.widthInPixels , this.paddingLeftInPixels , this.paddingRightInPixels , this.heightInPixels , this.paddingTopInPixels , this.paddingBottomInPixels ) ;
			this._vg.viewBox.set( viewBox ) ;
			this._vgFlowingText.set( viewBox ) ;
			this._notifySizeUpdated() ;
		}
		//console.error( "Exiting _adaptVgSizeNow()" ) ;
	}

	async _notifySizeUpdatedNow() {
		this.onSizeUpdatedObservable.notifyObservers( await this._getSizes() ) ;
	}

	async _getSizes() {
		if ( ! this._vg || ! this._vgFlowingText ) { return null ; }

		return {
			width: Math.ceil( this._vg.viewBox.width ) ,
			height: Math.ceil( this._vg.viewBox.height ) ,
			innerWidth: Math.ceil( await this._vgFlowingText.getContentWidth() ) ,
			innerHeight: Math.ceil( await this._vgFlowingText.getContentHeight() )
		} ;
	}

	/*
	_layout( parentMeasure , context ) {
		//console.warn( "Calling FlowingText _layout() , width:" , this.width , this.widthInPixels , this._host , this._cachedParentMeasure.width ) ;
		return super._layout( parentMeasure , context ) ;
	}
	*/

	_processMeasures( parentMeasure , context ) {
		//console.warn( "!!!!!!! Calling FlowingText _processMeasures() , width:" , this.width , this.widthInPixels , this._host , this._cachedParentMeasure.width ) ;
		var width = this.widthInPixels ,
			height = this.heightInPixels ;

		if ( this._lastWidth !== width || this._lastHeight !== height ) {
			this._lastWidth = width ;
			this._lastHeight = height ;

			if ( this._vg ) {
				this._adaptVgSize().then( () => this._afterVgUpdate() ) ;
			}
		}

		return super._processMeasures( parentMeasure , context ) ;
	}
}

FlowingText.prototype._notifySizeUpdated = Promise.debounceUpdate( { waitNextTick: true } , FlowingText.prototype._notifySizeUpdatedNow ) ;
FlowingText.prototype._generateVg = Promise.debounceUpdate( { waitNextTick: true } , FlowingText.prototype._generateVgNow ) ;
FlowingText.prototype._adaptVgSize = Promise.debounceUpdate( { waitNextTick: true } , FlowingText.prototype._adaptVgSizeNow ) ;

module.exports = FlowingText ;
BABYLON.GUI.FlowingText = FlowingText ;
BABYLON.RegisterClass( 'BABYLON.GUI.FlowingText' , FlowingText ) ;

