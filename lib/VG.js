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

const Promise = require( 'seventh' ) ;



class VG extends BABYLON.GUI.Control {
	_vg = null ;
	_vgRendered = false ;
	_vgWidth = null ;
	_vgHeight = null ;

	_offscreenCanvas = null ;
	_context = null ;
	_emptyContext = true ;

	_stretch = VG.STRETCH_FILL ;
	_autoScale = false ;

	_isAutoVg = false ;		// if set, the VG is produced automatically, e.g. FlowingText

	_dynamicManager = null ;

	onRenderedObservable = new Observable() ;
	onInfotipObservable = new Observable() ;
	onInfotipClosedObservable = new Observable() ;

	// For interoperability, it should follow BABYLON.GUI.Image constants
	static STRETCH_NONE = BABYLON.GUI.Image.STRETCH_NONE ;	// =0
	static STRETCH_FILL = BABYLON.GUI.Image.STRETCH_FILL ;	// =1
	static STRETCH_UNIFORM = BABYLON.GUI.Image.STRETCH_UNIFORM ;	// =2
	static STRETCH_EXTEND = BABYLON.GUI.Image.STRETCH_EXTEND ;	// =3
	//static STRETCH_NINE_PATCH = BABYLON.GUI.Image.STRETCH_NINE_PATCH ;	// =4

	constructor( name , vg ) {
		super( name ) ;
		if ( vg ) { this.vg = vg ; }
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return 'VG' ; }

	get stretch() { return this._stretch ; }
	set stretch( v ) {
		if ( this._stretch === v ) { return ; }
		this._stretch = v ?? VG.STRETCH_FILL ;
		this._markAsDirty() ;
	}

	get autoScale() { return this._autoScale ; }
	set autoScale( v ) {
		v = !! v ;
		if ( this._autoScale === v ) { return ; }
		this._autoScale = v ;
		if ( this._autoScale && this._vgRendered ) { this.synchronizeSizeWithContent() ; }
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

		this._vg = _vg ;
		this._afterVgUpdate() ;
	}

	async _afterVgUpdate() {
		this._vgWidth = Math.ceil( this._vg.viewBox.width ) ;
		this._vgHeight = Math.ceil( this._vg.viewBox.height ) ;
		
		if ( ! this._offscreenCanvas ) {
			//console.warn( "new OffscreenCanvas:" , this._vgWidth , this._vgHeight ) ;
			this._offscreenCanvas = new OffscreenCanvas( this._vgWidth , this._vgHeight ) ;
			this._context = this._offscreenCanvas.getContext( '2d' ) ;
		}
		else {
			if ( this._vgWidth !== this._offscreenCanvas.width || this._vgHeight !== this._offscreenCanvas.height ) {
				//console.warn( "resize OffscreenCanvas:" , this._vgWidth , this._vgHeight ) ;
				this._offscreenCanvas.width = this._vgWidth ;
				this._offscreenCanvas.height = this._vgHeight ;
			}
		}
		
		await this._renderCanvas() ;

		if ( ! this._dynamicManager && this._vg.isDynamic() ) {
			this._generateDynamicManager() ;
		}
	}
	
	_generateDynamicManager() {
		if ( this._dynamicManager ) { return ; }
		//console.warn( "### Generate this._dynamicManager" , this._context , this._vg ) ;
		this._dynamicManager = new svgKit.DynamicManager( this._context , this._vg , 50 ) ;

		//this._dynamicManager.manageBrowserCanvas() ;
		this._dynamicManager.manageBabylonControl( this ) ;

		//this._dynamicManager.on( 'redraw' , () => this._markAsDirty() ) ;
		this._dynamicManager.on( 'redraw' , () => {
			//console.warn( "### dynamicManager REDRAW" ) ;
			this._markAsDirty() ;
		} ) ;

		// Forward dynamic manager's events to the Babylon Control's observable
		this._dynamicManager.on( 'infotip' , data => this.onInfotipObservable.notifyObservers( data ) ) ;
		this._dynamicManager.on( 'infotipClosed' , data => this.onInfotipClosedObservable.notifyObservers( data ) ) ;
	}

	async _renderCanvasNow() {
		this._vgRendered = false ;

		// VG#renderCanvas() should be called on a cleared context
		if ( ! this._emptyContext ) { this._context.reset() ; }

		this._emptyContext = false ;
		await this._vg.renderCanvas( this._context ) ;
		this._onRendered() ;
	}

	_onRendered() {
		this._vgRendered = true ;
		if ( this._autoScale ) { this.synchronizeSizeWithContent() ; }
		this.onRenderedObservable.notifyObservers( this ) ;
		this._markAsDirty() ;
	}

	_draw( context ) {
		if ( ! this._vgRendered ) { return ; }
		if ( ! this._offscreenCanvas.width || ! this._offscreenCanvas.height ) {
			console.warn( "._offscreenCanvas has no size" , this._offscreenCanvas ) ;
			return ;
		}

		context.save() ;
		this._applyStates( context ) ;

		if ( this._stretch === VG.STRETCH_UNIFORM ) {
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

		// Setting this.width/this.height instead of super.width/super.height causes FlowingText setter to be called, calling again this._adaptVgSizeNow()
		super.width = this._vgWidth + 'px' ;
		super.height = this._vgHeight + 'px' ;
	}

	_processMeasures( parentMeasure , context ) {
		// From Babylon GUI image.ts
		if ( this._vgRendered && ! this._isAutoVg ) {
			switch ( this._stretch ) {
				case VG.STRETCH_NONE :
				case VG.STRETCH_FILL :
				case VG.STRETCH_UNIFORM :
				case VG.STRETCH_NINE_PATCH :
				case VG.STRETCH_EXTEND :
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

VG.prototype._renderCanvas = Promise.debounceUpdate( { waitNextTick: true } , VG.prototype._renderCanvasNow ) ;

module.exports = VG ;
BABYLON.GUI.VG = VG ;
BABYLON.RegisterClass( 'BABYLON.GUI.VG' , VG ) ;

