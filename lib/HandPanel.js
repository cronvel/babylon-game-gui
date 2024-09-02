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

	_spacing = 0 ;
	_rotationPerCardInDegree = 5 ;
	_pseudoRadius = 2500 ;
	_layoutOrderedChildren = [] ;


	constructor( name ) {
		super( name ) ;
	}

	_getTypeName() { return 'HandPanel' ; }


	get spacing() { return this._spacing ; }
	set spacing( value ) {
		if ( this._spacing === value ) { return ; }
		this._spacing = value ;
		this._markAsDirty() ;
	}

	get rotationPerCardInDegree() { return this._rotationPerCardInDegree ; }
	set rotationPerCardInDegree( value ) {
		if ( this._rotationPerCardInDegree === value ) { return ; }
		this._rotationPerCardInDegree = value ;
		this._markAsDirty() ;
	}

	get pseudoRadius() { return this._pseudoRadius ; }
	set pseudoRadius( value ) {
		if ( this._pseudoRadius === value ) { return ; }
		this._pseudoRadius = value ;
		this._markAsDirty() ;
	}

	addControl( control ) {
		if ( ! control ) { return this ; }

		var index = this._children.indexOf( control ) ;
		if ( index !== -1 ) { return this ; }

		// Force a zIndex
		control._zIndex = this._children.length ;

		control._link( this._host ) ;
		control._markAllAsDirty() ;
		this._reOrderControl( control ) ;

		// We have to keep track of the real layout order, because ._children is rendering dependent,
		// e.g. it sorts by zIndex, so making card appearing on top would move it at the end (the right).
		this._layoutOrderedChildren.push( control ) ;

		this._markAsDirty();

		return this ;
	}

	clearControls() {
		super.clearControls() ;
		this._layoutOrderedChildren.length = 0 ;
		return this ;
	}

	removeControl( control ) {
		var countBefore = this._children.length ;
		super.removeControl( control ) ;
		if ( countBefore === this._children.length ) { return this ; }

		var index = this._layoutOrderedChildren.indexOf( control ) ;
		if ( index === - 1 ) { return this ; }	// Should never happen, except in case of a bug
		this._layoutOrderedChildren.splice( index , 1 ) ;

		return this ;
	}

	getControlLayoutOrder( control ) {
		return this._layoutOrderedChildren.indexOf( control ) ;
	}

	_reOrderControl( control ) {
		// The only difference with super._reOrderControl() is calling super.removeControl() instead of this.removeControl() here:
		super.removeControl( control ) ;

		let wasAdded = false ;
		for ( let index = 0 ; index < this._children.length ; index ++ ) {
			if ( this._children[index].zIndex > control.zIndex ) {
				this._children.splice( index , 0 , control ) ;
				wasAdded = true ;
				break ;
			}
		}

		if ( ! wasAdded ) {
			this._children.push( control ) ;
		}

		control.parent = this ;

		this._markAsDirty() ;
	}

	_preMeasure( parentMeasure , context ) {
		for ( let child of this._children ) {
			child.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT ;
		}

		super._preMeasure( parentMeasure , context ) ;
	}

	_postMeasure() {
		var stackWidth = 0 ;
		//var stackHeight = 0 ;
		var childrenCount = this._layoutOrderedChildren.length ;

		var rotationIncrement = ( this._rotationPerCardInDegree / 180 ) * Math.PI ;
		var rotationMax = rotationIncrement * ( childrenCount - 1 ) / 2 ;
		var offsetMin = ( this._pseudoRadius + Math.cos( rotationMax ) * this._pseudoRadius ) / 2 ;
		var rotation = - rotationMax ;

		for ( let index = 0 ; index < childrenCount ; index ++ ) {
			let child = this._layoutOrderedChildren[ index ] ;
			if ( ! child.isVisible || child.notRenderable ) { continue ; }

			let top = - ( Math.cos( rotation ) * this._pseudoRadius - offsetMin ) ;

			if ( child.top !== top + "px" ) {
				child.top = top + "px" ;
				this._rebuildLayout = true ;
				child._top.ignoreAdaptiveScaling = true ;
			}

			if ( child.left !== stackWidth + "px" ) {
				child.left = stackWidth + "px" ;
				this._rebuildLayout = true ;
				child._left.ignoreAdaptiveScaling = true ;
			}

			if ( child.rotation !== rotation ) {
				child.rotation = rotation ;
				this._rebuildLayout = true ;
			}

			stackWidth += child._currentMeasure.width + child._paddingLeftInPixels + child._paddingRightInPixels + ( index < childrenCount - 1 ? this._spacing : 0 ) ;

			rotation += rotationIncrement ;
		}

		stackWidth += this._paddingLeftInPixels + this._paddingRightInPixels ;
		//stackHeight += this._paddingTopInPixels + this._paddingBottomInPixels ;

		// Let stack panel width or height default to stackHeight and stackWidth if dimensions are not specified.
		// User can now define their own height and width for stack panel.

		let panelWidthChanged = false ;
		let panelHeightChanged = false ;

		let previousWidth = this.width ;
		this.width = stackWidth + "px" ;
		panelWidthChanged = previousWidth !== this.width || ! this._width.ignoreAdaptiveScaling ;

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

