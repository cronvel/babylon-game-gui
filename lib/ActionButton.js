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



/*
	An ActionButton is a simple button with text (supporting markup) used to trigger an action.
	For an on/off button, something like a StateButton class should be created.
*/



const Observable = BABYLON.Observable ;

const DecoratedContainer = require( './DecoratedContainer.js' ) ;
const FlowingText = require( './FlowingText.js' ) ;
const helpers = require( './helpers.js' ) ;

const Promise = require( 'seventh' ) ;



/*
	To support future new SVG Kit properties:

	* Add mapping for ActionButton to ActionButton's content (FlowingText) in the DecoratedContainer.createCommonContentGetterSetter() call (this file)
	* Add a getter and a setter to FlowingText (FlowingText file)
	* Add support for that new property in _setContentPropertiesNow() (this file)
*/



class ActionButton extends DecoratedContainer {
	_state = ActionButton.BLUR ;
	_nextState = ActionButton.BLUR ;

	_text = null ;
	_markupText = null ;
	_structuredText = null ;

	_blurStyle = null ;
	_focusStyle = null ;
	_pressedStyle = null ;
	_disabledStyle = null ;

	_switchStateTimer = null ;
	_animationTimer = null ;

	onPressedObservable = new Observable() ;		// Immediately
	onPressedAndReleasedObservable = new Observable() ;	// After animation ended

	static DISABLED = - 1 ;
	static BLUR = 0 ;
	static FOCUS = 1 ;
	static PRESSED = 2 ;

	// Allowed keys in blurStyle/focusStyle/pressedStyle/disabledStyle
	static STYLES = new Set( [
		// DecoratedContainer
		'backgroundColor' , 'borderColor' , 'borderThickness' , 'cornerRadius' ,
		'source' , 'stretch' , 'sliceLeft' , 'sliceRight' , 'sliceTop' , 'sliceBottom' ,
		// ActionButton
		'text' , 'markupText' , 'structuredText' ,
		'textPaddingTop' , 'textPaddingBottom' , 'textPaddingLeft' , 'textPaddingRight' ,
		'textAttr' , 'textLineSpacing' , 'textWrapping' , 'textVerticalAlignment' , 'textHorizontalAlignment' , 'textDynamicStyles' , 'textFx'
	] ) ;

	constructor( name ) {
		super( name ) ;

		this._turnVisibleOnContentSizeReady = true ;

		// Default values
		this._contentProperties.paddingTop = '10px' ;
		this._contentProperties.paddingBottom = '10px' ;
		this._contentProperties.paddingLeft = '10px' ;
		this._contentProperties.paddingRight = '10px' ;

		this._registerEvents() ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return 'ActionButton' ; }

	get blurStyle() { return this._blurStyle ; }
	set blurStyle( v ) {
		if ( typeof v === 'object' && v !== this._blurStyle ) {
			this._blurStyle = v ;
			if ( this._state === ActionButton.BLUR ) {
				this._applyStyle() ;
			}
		}
	}

	get focusStyle() { return this._focusStyle ; }
	set focusStyle( v ) {
		if ( typeof v === 'object' && v !== this._focusStyle ) {
			this._focusStyle = v ;
			if ( this._state === ActionButton.FOCUS ) {
				this._applyStyle() ;
			}
		}
	}

	get pressedStyle() { return this._pressedStyle ; }
	set pressedStyle( v ) {
		if ( typeof v === 'object' && v !== this._pressedStyle ) {
			this._pressedStyle = v ;
			if ( this._state === ActionButton.PRESSED ) {
				this._applyStyle() ;
			}
		}
	}

	get disabledStyle() { return this._disabledStyle ; }
	set disabledStyle( v ) {
		if ( typeof v === 'object' && v !== this._disabledStyle ) {
			this._disabledStyle = v ;
			if ( this._state === ActionButton.DISABLED ) {
				this._applyStyle() ;
			}
		}
	}

	_registerEvents() {
		this.onPointerEnterObservable.add( () => this.focus() ) ;
		this.onPointerMoveObservable.add( () => this.focus() ) ;
		this.onPointerOutObservable.add( () => this.blur() ) ;
		this.onPointerClickObservable.add( () => this.press() ) ;
	}

	_applyStyle( style ) {
		if ( style === undefined || typeof style !== 'object' ) {
			switch ( this._state ) {
				case ActionButton.BLUR : style = this._blurStyle ; break ;
				case ActionButton.FOCUS : style = this._focusStyle ; break ;
				case ActionButton.PRESSED : style = this._pressedStyle ; break ;
				case ActionButton.DISABLED : style = this._disabledStyle ; break ;
			}
		}

		if ( ! style ) { return ; }

		for ( let key of Object.keys( style ) ) {
			if ( ActionButton.STYLES.has( key ) ) {
				this[ key ] = style[ key ] ;
			}
		}
	}

	blur() {
		if ( this._state === ActionButton.DISABLED || this._state === ActionButton.PRESSED || this._state === ActionButton.BLUR ) {
			this._nextState = ActionButton.BLUR ;
			return ;
		}

		this._state = ActionButton.BLUR ;
		this._resetTimers() ;
		this._applyStyle() ;
	}

	focus() {
		if ( this._state === ActionButton.DISABLED || this._state === ActionButton.PRESSED || this._state === ActionButton.FOCUS ) {
			this._nextState = ActionButton.FOCUS ;
			return ;
		}

		this._state = ActionButton.FOCUS ;
		this._resetTimers() ;
		this._applyStyle() ;
	}

	press() {
		if ( this._state === ActionButton.DISABLED || this._state === ActionButton.PRESSED ) { return ; }

		this._nextState = this._state ;
		this._state = ActionButton.PRESSED ;
		this._resetTimers() ;
		this._applyStyle() ;

		var duration = + this._pressedStyle.duration > 0 ? + this._pressedStyle.duration : 100 ;
		this._switchStateTimer = setTimeout( () => this.release() , duration ) ;

		if ( this._pressedStyle.blinks && this._pressedStyle.blinks >= 2 ) {
			let switchCount = 0 ,
				maxSwitchCount = ( this._pressedStyle.blinks - 1 ) * 2 ,
				blinkDuration = duration / ( maxSwitchCount + 1 ) ;
			//console.warn( "BLINKS " , switchCount , maxSwitchCount , blinkDuration ) ;

			this._animationTimer = setInterval( () => {
				if ( switchCount % 2 ) {
					// Turn on
					this._applyStyle( this._pressedStyle ) ;
				}
				else {
					// Turn off
					this._applyStyle( this._blurStyle ) ;
				}

				switchCount ++ ;
				if ( switchCount >= maxSwitchCount ) {
					clearInterval( this._animationTimer ) ;
					this._animationTimer = null ;
				}
			} , blinkDuration ) ;
		}

		this.onPressedObservable.notifyObservers() ;
	}

	release() {
		if ( this._state !== ActionButton.PRESSED ) { return ; }
		this._state = this._nextState ;
		this._resetTimers() ;
		this._applyStyle() ;
		this.onPressedAndReleasedObservable.notifyObservers() ;
	}

	enable() {
		if ( this._state !== ActionButton.DISABLED ) { return ; }
		this._state = this._nextState ;
		this._resetTimers() ;
		this._applyStyle() ;
	}

	disable() {
		if ( this._state === ActionButton.DISABLED ) { return ; }
		this._nextState = this._state ;
		this._state = ActionButton.DISABLED ;
		this._resetTimers() ;
		this._applyStyle() ;
	}

	_resetTimers() {
		if ( this._switchStateTimer ) {
			clearTimeout( this._switchStateTimer ) ;
			this._switchStateTimer = null ;
		}

		if ( this._animationTimer ) {
			clearInterval( this._animationTimer ) ;
			this._animationTimer = null ;
		}
	}

	_setContentPropertiesNow( content = this._content ) {
		content._autoScale = false ;
		content.width = '100%' ;
		content.height = '100%' ;

		content.paddingTop = this._contentProperties.paddingTop ;
		content.paddingBottom = this._contentProperties.paddingBottom ;
		content.paddingLeft = this._contentProperties.paddingLeft ;
		content.paddingRight = this._contentProperties.paddingRight ;

		if ( content.paddingTopInPixels + content.paddingBottomInPixels > this.heightInPixels ) {
			console.warn( "Warning: ActionButton height < padding, expanding height" , this.heightInPixels , content.paddingTopInPixels , content.paddingBottomInPixels ) ;
			this.heightInPixels = content.paddingTopInPixels + content.paddingBottomInPixels + 1 ;
		}

		if ( content.paddingLeftInPixels + content.paddingRightInPixels > this.widthInPixels ) {
			console.warn( "Warning: ActionButton width < padding, expanding width" , this.widthInPixels , content.paddingLeftInPixels , content.paddingRightInPixels ) ;
			this.widthInPixels = content.paddingLeftInPixels + content.paddingRightInPixels + 1 ;
		}

		if ( this._contentProperties.structuredText ) {
			content.structuredText = this._contentProperties.structuredText ;
		}
		else if ( this._contentProperties.markupText ) {
			content.markupText = this._contentProperties.markupText ;
		}
		else if ( this._contentProperties.text ) {
			content.text = this._contentProperties.text ;
		}

		if ( this._contentProperties.textAttr ) { content.textAttr = this._contentProperties.textAttr ; }
		if ( this._contentProperties.lineSpacing ) { content.lineSpacing = this._contentProperties.lineSpacing ; }
		if ( this._contentProperties.textWrapping ) { content.textWrapping = this._contentProperties.textWrapping ; }
		if ( this._contentProperties.textVerticalAlignment ) { content.textVerticalAlignment = this._contentProperties.textVerticalAlignment ; }
		if ( this._contentProperties.textHorizontalAlignment ) { content.textHorizontalAlignment = this._contentProperties.textHorizontalAlignment ; }
		if ( this._contentProperties.textDynamicStyles ) { content.textDynamicStyles = this._contentProperties.textDynamicStyles ; }
		if ( this._contentProperties.fx ) { content.fx = this._contentProperties.fx ; }

		content.clip = false ;

		//console.warn( "gbutton's content:" , content ) ;
	}

	_createContentNow() {
		var flowingText = new FlowingText( this.name + ':flowingText' ) ;

		// Call the setter
		this.content = flowingText ;
		flowingText.isPointerBlocker = this.isPointerBlocker ;

		//this._setContentProperties( flowingText ) ;
		this._setContentPropertiesNow( flowingText ) ;
	}
}

ActionButton.prototype._setContentProperties = Promise.debounceNextTick( ActionButton.prototype._setContentPropertiesNow ) ;
ActionButton.prototype._createContent = Promise.debounceNextTick( ActionButton.prototype._createContentNow ) ;
//ActionButton.prototype._createContent = Promise.debounceUpdate( { waitFn: () => Promise.resolveTimeout(1000) } , ActionButton.prototype._createContentNow ) ;

DecoratedContainer.createCommonContentGetterSetter( ActionButton.prototype , {
	text: 'text' ,
	markupText: 'markupText' ,
	structuredText: 'structuredText' ,

	textPaddingTop: 'paddingTop' ,
	textPaddingBottom: 'paddingBottom' ,
	textPaddingLeft: 'paddingLeft' ,
	textPaddingRight: 'paddingRight' ,

	textAttr: 'textAttr' ,
	textLineSpacing: 'lineSpacing' ,
	textWrapping: 'textWrapping' ,
	textVerticalAlignment: 'textVerticalAlignment' ,
	textHorizontalAlignment: 'textHorizontalAlignment' ,
	textDynamicStyles: 'textDynamicStyles' ,
	textFx: 'fx'
} ) ;



module.exports = ActionButton ;
BABYLON.GUI.ActionButton = ActionButton ;
BABYLON.RegisterClass( 'BABYLON.GUI.ActionButton' , ActionButton ) ;

