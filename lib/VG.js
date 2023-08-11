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



class VG extends BABYLON.GUI.Control {
	_vg = null ;
	_vgRendered = false ;
	_offscreenCanvas = null ;
	_context = null ;

	get vg() { return this._vg ; }

	set vg( _vg ) {
		if ( ! _vg ) {
			this._vg = null ;
			this._vgRendered = false ;
			return ;
		}

		var width = _vg.viewBox.width ,
			height = _vg.viewBox.height ;

		if ( ! this._offscreenCanvas || width !== this._offscreenCanvas.width || height !== this._offscreenCanvas.height ) {
			this._offscreenCanvas = new OffscreenCanvas( width , height ) ;
			this._context = this._offscreenCanvas.getContext( '2d' ) ;
		}

		this._vg = _vg ;
		this._vgRendered = false ;
		this._vg.renderCanvas( this._context ).then( () => {
			this._vgRendered = true ;
			this._markAsDirty() ;
		} ) ;
	}

	constructor( name , vg ) {
		super( name ) ;
		this.vg = vg ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() {
		return "VG" ;
	}

	_draw( context ) {
		if ( ! this._vgRendered ) { return ; }

		context.save() ;
		this._applyStates( context ) ;
		context.drawImage(
			this._offscreenCanvas ,
			this._currentMeasure.left ,
			this._currentMeasure.top ,
			this._currentMeasure.width ,
			this._currentMeasure.height
		) ;
		context.restore() ;
	}

	_applyStates( context ) {
		super._applyStates( context ) ;
		// E.g.:
		//context.lineWidth = this.outlineWidth;
		//context.lineJoin = 'miter';
		//context.miterLimit = 2;
	}

	_processMeasures( parentMeasure , context ) {
		// Do something before...

		super._processMeasures( parentMeasure , context ) ;

		// Do something after...
	}
}

module.exports = VG ;
BABYLON.RegisterClass( 'BABYLON.GUI.VG' , VG ) ;

