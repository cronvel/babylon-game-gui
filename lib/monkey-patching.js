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

// We will append the suffix _mkp to all method to mark MonKey Patch

const AdvancedDynamicTexture = BABYLON.GUI.AdvancedDynamicTexture ;
const Vector2 = BABYLON.Vector2 ;



// Code derived from AdvancedDynamicTexture#moveToNonOverlappedPosition()
AdvancedDynamicTexture.prototype.moveToNonOverlappedRealPosition_mkp = function( overlapGroup , deltaStep = 1 , repelFactor = 1 ) {
	let controlsForGroup ;

	if ( Array.isArray( overlapGroup ) ) {
		controlsForGroup = overlapGroup ;
	}
	else {
		const descendants = this.getDescendants( true ) ;
		// get only the controls with an overlapGroup property set
		// if the overlapGroup parameter is set, filter the controls and get only the controls belonging to that overlapGroup
		controlsForGroup = overlapGroup === undefined ? descendants.filter( ( c ) => c.overlapGroup !== undefined ) : descendants.filter( ( c ) => c.overlapGroup === overlapGroup ) ;
	}

	controlsForGroup.forEach( ( control1 ) => {
		// CR:
		if ( control1._fixedOverlap ) { return ; }
		// ---

		let velocity = Vector2.Zero() ;
		const center = new Vector2( control1.centerX , control1.centerY ) ;

		controlsForGroup.forEach( ( control2 ) => {
			if ( control1 !== control2 && AdvancedDynamicTexture._Overlaps( control1 , control2 ) ) {
				// if the two controls overlaps get a direction vector from one control's center to another control's center
				const diff = center.subtract( new Vector2( control2.centerX , control2.centerY ) ) ;
				const diffLength = diff.length() ;

				if ( diffLength > 0 ) {
					// calculate the velocity
					velocity = velocity.add( diff.normalize().scale( repelFactor / diffLength ) ) ;
				}
			}
		} ) ;

		if ( velocity.length() > 0 ) {
			// move the control along the direction vector away from the overlapping control
			velocity = velocity.normalize().scale( deltaStep * ( control1.overlapDeltaMultiplier ?? 1 ) ) ;

			// CR:
			control1.leftInPixels += velocity.x ;
			control1.topInPixels += velocity.y ;
			// ---
		}
	} ) ;
} ;

