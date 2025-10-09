/*
	Babylon Game GUI

	Copyright (c) 2024 - 2025 Cédric Ronvel

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



//const AdvancedDynamicTexture = BABYLON.GUI.AdvancedDynamicTexture ;
const Vector2 = BABYLON.Vector2 ;

const helpers = exports ;



// Force it on-screen
helpers.forceControlOnScreen = ( advancedTexture , control ) => {
	var overflow = false ,
		{ width , height } = advancedTexture.getSize() ;

	var leftOverflow = - control.leftInPixels + control.paddingLeftInPixels ;
	var rightOverflow = control.leftInPixels + control.widthInPixels + control.paddingRightInPixels - width ;
	var topOverflow = - control.topInPixels + control.paddingTopInPixels ;
	var bottomOverflow = control.topInPixels + control.heightInPixels + control.paddingBottomInPixels - height ;

	if ( leftOverflow > 0 && rightOverflow <= 0 ) { control.leftInPixels += leftOverflow ; overflow = true ; }
	if ( rightOverflow > 0 && leftOverflow <= 0 ) { control.leftInPixels -= rightOverflow ; overflow = true ; }
	if ( topOverflow > 0 && bottomOverflow <= 0 ) { control.topInPixels += topOverflow ; overflow = true ; }
	if ( bottomOverflow > 0 && topOverflow <= 0 ) { control.topInPixels -= bottomOverflow ; overflow = true ; }
	//console.warn( "bottom:" , height , control.topInPixels , control.heightInPixels , control.paddingBottomInPixels ) ;

	return overflow ;
} ;



// Initially derived from AdvancedDynamicTexture#moveToNonOverlappedPosition(), but almost rewritten entirely.
// It returns true if something has moved.
helpers.deoverlapControls = ( advancedTexture , overlapGroup , deltaStep = 10 , repelFactor = 1 ) => {
	let controlsForGroup ,
		overlap = false ,
		overflow = false ,
		velocities = new Map() ;


	if ( Array.isArray( overlapGroup ) ) {
		controlsForGroup = overlapGroup ;
	}
	else {
		const descendants = advancedTexture.getDescendants( true ) ;
		// get only the controls with an overlapGroup property set
		// if the overlapGroup parameter is set, filter the controls and get only the controls belonging to that overlapGroup
		controlsForGroup = overlapGroup === undefined ? descendants.filter( ( c ) => c.overlapGroup !== undefined ) : descendants.filter( ( c ) => c.overlapGroup === overlapGroup ) ;
	}

	for ( let control of controlsForGroup ) {
		velocities.set( control , Vector2.Zero() ) ;
	}

	for ( let i = 0 ; i < controlsForGroup.length - 1 ; i ++ ) {
		let control1 = controlsForGroup[ i ] ,
			velocity1 = velocities.get( control1 ) ;

		const center = new Vector2( control1.centerX , control1.centerY ) ;

		for ( let j = i + 1 ; j < controlsForGroup.length ; j ++ ) {
			let control2 = controlsForGroup[ j ] ,
				velocity2 = velocities.get( control2 ) ;

			if ( helpers.areControlsOverlaping( control1 , control2 ) ) {
				// if the two controls overlaps get a direction vector from one control's center to another control's center
				const diff = center.subtract( new Vector2( control2.centerX , control2.centerY ) ) ;
				let diffLength = diff.length() ;

				// Force a diff even if null
				if ( diffLength <= 0.001 ) {
					diffLength = 0.001 ;
					diff.x = 0 ;
					diff.y = - 1 ;
				}

				const delta = diff.normalize().scale( repelFactor / diffLength ) ;

				// update the velocities
				velocity1.addInPlace( delta ) ;
				velocity2.subtractInPlace( delta ) ;
			}
		}
	}

	for ( let control of controlsForGroup ) {
		if ( control._fixedOnOverlap ) { continue ; }
		let velocity = velocities.get( control ) ;

		if ( velocity.length() > 0 ) {
			// move the control along the direction vector away from the overlapping control
			velocity = velocity.normalize().scaleInPlace( deltaStep * ( control.overlapDeltaMultiplier ?? 1 ) ) ;
			control.leftInPixels += velocity.x ;
			control.topInPixels += velocity.y ;
			overlap = true ;
		}

		// Force it on-screen
		if ( helpers.forceControlOnScreen( advancedTexture , control ) ) { overflow = true ; }
		//console.warn( "bottom:" , height , control1.topInPixels , control1.heightInPixels , control1.paddingBottomInPixels ) ;
	}

	return overlap || overflow ;
} ;



// The original Babylon GUI function was doing really strange things,
// e.g.: using control1 width and control2 width randomly instead of the average width value...
helpers.areControlsOverlaping = ( control1 , control2 ) => {
	let width = ( control1.widthInPixels + control2.widthInPixels ) / 2 ;
	let height = ( control1.heightInPixels + control2.heightInPixels ) / 2 ;

	return ! (
		control1.centerX > control2.centerX + width ||
		control1.centerX + width < control2.centerX ||
		control1.centerY > control2.centerY + height ||
		control1.centerY + height < control2.centerY
	) ;
} ;

