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



const Promise = require( 'seventh' ) ;

const eventBubbling = {} ;
module.exports = eventBubbling ;



eventBubbling.registerChild = ( parentControl , childControl ) => {
	parentControl._pointerHoverBubblingData = null ;

	childControl.onPointerClickObservable.add( data => eventBubbling.pointerClickBubbling( data , parentControl , childControl ) ) ;
	childControl.onPointerEnterObservable.add( data => eventBubbling.pointerEnterBubbling( data , parentControl , childControl ) ) ;
	childControl.onPointerOutObservable.add( data => eventBubbling.pointerOutBubbling( data , parentControl , childControl ) ) ;
	childControl.onPointerMoveObservable.add( data => eventBubbling.pointerMoveBubbling( data , parentControl , childControl ) ) ;
} ;



eventBubbling.pointerClickBubbling = ( data , parentControl , childControl ) => {
	// Should already sort of bubble if not pointer blocker
	if ( ! childControl.isPointerBlocker ) { return ; }
	//console.log( "Click bubbling" ) ;
	parentControl.onPointerClickObservable.notifyObservers( data ) ;
} ;



eventBubbling.BUBBLING_ENTER = 1 ;
eventBubbling.BUBBLING_OUT = 2 ;
eventBubbling.BUBBLING_MOVE = 3 ;



eventBubbling.pointerEnterBubbling = ( data , parentControl , childControl ) => {
	// Should already sort of bubble if not pointer blocker
	if ( ! childControl.isPointerBlocker ) { return ; }
	//console.log( "Enter bubbling next tick" ) ;
	parentControl._pointerHoverBubblingData = data ;
	eventBubbling.pointerHoverBubbling( parentControl , eventBubbling.BUBBLING_ENTER ) ;
} ;



eventBubbling.pointerOutBubbling = ( data , parentControl , childControl ) => {
	// Should already sort of bubble if not pointer blocker
	if ( ! childControl.isPointerBlocker ) { return ; }
	//console.log( "Out bubbling next tick" ) ;
	parentControl._pointerHoverBubblingData = data ;
	eventBubbling.pointerHoverBubbling( parentControl , eventBubbling.BUBBLING_OUT ) ;
} ;



eventBubbling.pointerMoveBubbling = ( data , parentControl , childControl ) => {
	// Should already sort of bubble if not pointer blocker
	if ( ! childControl.isPointerBlocker ) { return ; }
	//console.log( "Move bubbling next tick" ) ;
	parentControl._pointerHoverBubblingData = data ;
	eventBubbling.pointerHoverBubbling( parentControl , eventBubbling.BUBBLING_MOVE ) ;
} ;



eventBubbling.pointerHoverBubblingNow = ( parentControl , type ) => {
	let data = parentControl._pointerHoverBubblingData ;
	parentControl._pointerHoverBubblingData = null ;

	switch ( type ) {
		case eventBubbling.BUBBLING_ENTER :
			//console.log( "Enter bubbling now" ) ;
			parentControl.onPointerEnterObservable.notifyObservers( data ) ;
			break ;
		case eventBubbling.BUBBLING_OUT :
			//console.log( "Out bubbling now" ) ;
			parentControl.onPointerOutObservable.notifyObservers( data ) ;
			break ;
		case eventBubbling.BUBBLING_MOVE :
			//console.log( "Move bubbling now" ) ;
			parentControl.onPointerMoveObservable.notifyObservers( data ) ;
			break ;
	}
} ;

eventBubbling.pointerHoverBubbling = Promise.debounceNextTick( eventBubbling.pointerHoverBubblingNow ) ;

