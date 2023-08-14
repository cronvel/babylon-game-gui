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



const Image = BABYLON.GUI.Image ;
const Observable = BABYLON.Observable ;



class VG extends BABYLON.GUI.Control {
	_vg = null ;
	_vgRendered = false ;
	_vgWidth = null ;
	_vgHeight = null ;

	_offscreenCanvas = null ;
	_context = null ;

	_stretch = Image.STRETCH_FILL ;
	_autoScale = false ;

	onRenderedObservable = new Observable() ;

	constructor( name , vg ) {
		super( name ) ;
		this.vg = vg ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return "VG" ; }

	get stretch() { return this._stretch ; }
	set stretch( v ) { this._stretch = v ; }

	get autoScale() { return this._autoScale ; }
	set autoScale( v ) {
		if ( this._autoScale === v ) { return ; }
		this._autoScale = v ;
		if ( v && this._vgRendered ) { this.synchronizeSizeWithContent() ; }
	}

	get vg() { return this._vg ; }
	set vg( _vg ) {
		if ( ! _vg ) {
			this._vg = null ;
			this._vgRendered = false ;
			this._vgWidth = null ;
			this._vgHeight = null ;
			return ;
		}

		this._vgWidth = _vg.viewBox.width ;
		this._vgHeight = _vg.viewBox.height ;

		if ( ! this._offscreenCanvas || this._vgWidth !== this._offscreenCanvas.width || this._vgHeight !== this._offscreenCanvas.height ) {
			this._offscreenCanvas = new OffscreenCanvas( this._vgWidth , this._vgHeight ) ;
			this._context = this._offscreenCanvas.getContext( '2d' ) ;
		}

		this._vg = _vg ;
		this._vgRendered = false ;
		this._vg.renderCanvas( this._context ).then( () => this._onRendered() ) ;
	}

	_onRendered() {
		this._vgRendered = true ;
		if ( this._autoScale ) { this.synchronizeSizeWithContent() ; }
		this.onRenderedObservable.notifyObservers( this ) ;
		this._markAsDirty() ;
	}

	_draw( context ) {
		if ( ! this._vgRendered ) { return ; }

		context.save() ;
		this._applyStates( context ) ;

		if ( this._stretch === Image.STRETCH_UNIFORM ) {
			let hRatio = this._currentMeasure.width / this._vgWidth ,
				vRatio = this._currentMeasure.height / this._vgHeight ,
				ratio = Math.min( hRatio , vRatio ) ,
				centerX = ( this._currentMeasure.width - this._vgWidth * ratio ) / 2 ,
				centerY = ( this._currentMeasure.height - this._vgHeight * ratio ) / 2 ;

			context.drawImage(
				this._offscreenCanvas ,
				this._currentMeasure.left + centerX ,
				this._currentMeasure.top + centerY ,
				this._vgWidth * ratio ,
				this._vgHeight * ratio
			) ;
		}
		else {
			context.drawImage(
				this._offscreenCanvas ,
				this._currentMeasure.left ,
				this._currentMeasure.top ,
				this._currentMeasure.width ,
				this._currentMeasure.height
			) ;
		}

		context.restore() ;
	}

	_applyStates( context ) {
		super._applyStates( context ) ;
		// E.g.:
		//context.lineWidth = this.outlineWidth;
		//context.lineJoin = 'miter';
		//context.miterLimit = 2;
	}

	synchronizeSizeWithContent() {
		// From Babylon GUI image.ts
		if ( ! this._vgRendered ) { return ; }

		this.width = this._vgWidth + "px" ;
		this.height = this._vgHeight + "px" ;
	}

	_processMeasures( parentMeasure , context ) {
		// From Babylon GUI image.ts
		if ( this._vgRendered ) {
			switch ( this._stretch ) {
				case Image.STRETCH_NONE :
				case Image.STRETCH_FILL :
				case Image.STRETCH_UNIFORM :
				case Image.STRETCH_NINE_PATCH :
				case Image.STRETCH_EXTEND :
					if ( this._autoScale ) {
						this.synchronizeSizeWithContent() ;
					}
					if ( this.parent && this.parent.parent ) {
						// Will update root size if root is not the top root
						this.parent.adaptWidthToChildren = true ;
						this.parent.adaptHeightToChildren = true ;
					}
					break ;
			}
		}

		super._processMeasures( parentMeasure , context ) ;
	}
}

module.exports = VG ;
BABYLON.RegisterClass( 'BABYLON.GUI.VG' , VG ) ;

