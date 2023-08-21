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

const svgKit = require( 'svg-kit' ) ;
const Promise = require( 'seventh' ) ;



class FlowingText extends VG {
	_text = null ;
	_markupText = null ;
	_structuredText = null ;

	_vgFlowingText = null ;
	_vgGenerated = null ;

	constructor( name ) {
		super( name ) ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return "FlowingText" ; }
	
	get width() { return super.width ; }
	set width( w ) {
		super.width = w ;
		if ( this._autoScale ) { this._adaptVgSizeNow() ; }
	}

	get height() { return super.height ; }
	set height( h ) {
		super.height = h ;
		if ( this._autoScale ) { this._adaptVgSizeNow() ; }
	}

	get markupText() { return this._markupText ; }
	set markupText( _markupText ) {
		if ( this._markupText === _markupText ) { return ; }
		this._markupText = _markupText ;
		if ( this._markupText ) { this._text = this._structuredText = null ; }
		this._generateVg() ;
	}

	set autoScale( v ) {
		v = !! v ;
		if ( this._autoScale === v ) { return ; }
		this._autoScale = v ;
		if ( this._autoScale ) {
			if ( this._vgRendered ) { this.synchronizeSizeWithContent() ; }
			this._adaptVgSizeNow() ;
		}
	}

	async _generateVgNow() {
		var vg ;

		var params = {
			x: 0 ,
			y: 0 ,
			width: this.widthInPixels ,
			height: this.heightInPixels ,
			//clip: false ,
			//debugContainer: true ,
			//textWrapping: 'ellipsis' ,
			textWrapping: 'wordWrap'
		} ;

		params.attr = {
			fontSize: 30 ,
			color: '#777' ,
			outline: true ,
			frameCornerRadius: '0.2em' ,
			frameOutlineWidth: '0.1em'
			//outlineColor: '#afa' ,
			//lineOutline: true ,
			//lineColor: '#559'
		} ;

		if ( this._structuredText ) { params.structuredText = this._structuredText ; }
		else if ( this._markupText ) { params.markupText = this._markupText ; }
		else if ( this._text ) { params.text = this._text ; }

		this._vgFlowingText = new svgKit.VGFlowingText( params ) ;

		if ( this._autoScale ) {
			let bbox = await this._vgFlowingText.getContentBoundingBox() ;

			vg = new svgKit.VG( {
				viewBox: {
					x: 0 , y: 0 , width: this.widthInPixels , height: Math.min( bbox.height , this.heightInPixels )
				}
				//invertY: true
			} ) ;
		}
		else {
			vg = new svgKit.VG( {
				viewBox: {
					x: 0 , y: 0 , width: this.widthInPixels , height: this.heightInPixels
				}
				//invertY: true
			} ) ;
		}

		vg.addEntity( this._vgFlowingText ) ;

		this._vg = vg ;
		this._afterVgUpdate() ;
	}

	async _adaptVgSizeNow() {
		if ( ! this._autoScale || ! this._vg ) { return ; }

		var bbox = await this._vgFlowingText.getContentBoundingBox() ;

		// The VG can be gone by the time we got the bounding box
		if ( ! this._vg ) { return ; }
		this._vg.set( {
			viewBox: {
				x: 0 , y: 0 , width: this.widthInPixels , height: Math.min( bbox.height , this.heightInPixels )
			}
		} ) ;
	}
}

FlowingText.prototype._generateVg = Promise.debounceUpdate( { waitNextTick: true } , FlowingText.prototype._generateVgNow ) ;
FlowingText.prototype._adaptVgSize = Promise.debounceUpdate( { waitNextTick: true } , FlowingText.prototype._adaptVgSizeNow ) ;

module.exports = FlowingText ;
BABYLON.GUI.FlowingText = FlowingText ;
BABYLON.RegisterClass( 'BABYLON.GUI.FlowingText' , FlowingText ) ;

