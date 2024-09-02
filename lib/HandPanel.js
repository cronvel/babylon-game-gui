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



//const Observable = BABYLON.Observable ;

//const Promise = require( 'seventh' ) ;



class HandPanel extends BABYLON.GUI.Container {

	_isVertical = true ;
	_spacing = 0 ;
	

	constructor( name ) {
		super( name ) ;
	}

	_getTypeName() { return 'HandPanel' ; }


	get isVertical() { return this._isVertical ; }
	set isVertical( value ) {
		if ( this._isVertical === value ) { return ; }

		this._isVertical = value ;
		this._markAsDirty() ;
	}

	get spacing() { return this._spacing ; }
	set spacing( value ) {
		if ( this._spacing === value ) { return ; }

		this._spacing = value ;
		this._markAsDirty() ;
	}

	_preMeasure( parentMeasure , context ) {
		for ( let child of this._children ) {
			if ( this._isVertical ) {
				child.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP ;
			}
			else {
				child.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT ;
			}
		}

		super._preMeasure( parentMeasure , context ) ;
	}

	_postMeasure() {
		var stackWidth = 0 ;
		var stackHeight = 0 ;
		var childrenCount = this._children.length ;

		var rotationIncrement = ( 5 / 180 ) * Math.PI ;
		var rotation = - rotationIncrement * ( childrenCount - 1 ) / 2 ;

		for ( let index = 0 ; index < childrenCount ; index ++ ) {
			let child = this._children[index] ;

			if ( ! child.isVisible || child.notRenderable ) {
				continue ;
			}

			if ( this._isVertical ) {
				if ( child.top !== stackHeight + "px" ) {
					child.top = stackHeight + "px" ;
					this._rebuildLayout = true ;
					child._top.ignoreAdaptiveScaling = true ;
				}

				stackHeight += child._currentMeasure.height + child._paddingTopInPixels + child._paddingBottomInPixels + ( index < childrenCount - 1 ? this._spacing : 0 ) ;
				//child.left = '0px' ;
			}
			else {
				if ( child.left !== stackWidth + "px" ) {
					child.left = stackWidth + "px" ;
					this._rebuildLayout = true ;
					child._left.ignoreAdaptiveScaling = true ;
				}

				stackWidth += child._currentMeasure.width + child._paddingLeftInPixels + child._paddingRightInPixels + ( index < childrenCount - 1 ? this._spacing : 0 ) ;
				//child.top = '0px' ;
				child.rotation = rotation ;
				rotation += rotationIncrement ;
			}
		}

		stackWidth += this._paddingLeftInPixels + this._paddingRightInPixels ;
		stackHeight += this._paddingTopInPixels + this._paddingBottomInPixels ;

		// Let stack panel width or height default to stackHeight and stackWidth if dimensions are not specified.
		// User can now define their own height and width for stack panel.

		let panelWidthChanged = false ;
		let panelHeightChanged = false ;

		if ( this._isVertical ) {
			let previousHeight = this.height ;
			this.height = stackHeight + "px" ;
			panelHeightChanged = previousHeight !== this.height || ! this._height.ignoreAdaptiveScaling ;
		}
		else {
			let previousWidth = this.width ;
			this.width = stackWidth + "px" ;
			panelWidthChanged = previousWidth !== this.width || ! this._width.ignoreAdaptiveScaling ;
		}

		if ( panelHeightChanged ) {
			this._height.ignoreAdaptiveScaling = true ;
		}

		if ( panelWidthChanged ) {
			this._width.ignoreAdaptiveScaling = true ;
		}

		if ( panelWidthChanged || panelHeightChanged ) {
			this._rebuildLayout = true ;
		}

		super._postMeasure() ;
	}
}

module.exports = HandPanel ;
BABYLON.GUI.HandPanel = HandPanel ;
BABYLON.RegisterClass( 'BABYLON.GUI.HandPanel' , HandPanel ) ;

