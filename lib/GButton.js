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



const DecoratedContainer = require( './DecoratedContainer.js' ) ;
const FlowingText = require( './FlowingText.js' ) ;
const helpers = require( './helpers.js' ) ;

const Promise = require( 'seventh' ) ;



/*
	To support future new SVG Kit properties:

	* Add mapping for GButton to GButton's content (FlowingText) in the DecoratedContainer.createCommonContentGetterSetter() call (this file)
	* Add a getter and a setter to FlowingText (FlowingText file)
	* Add support for that new property in _setContentPropertiesNow() (this file)
*/



class GButton extends DecoratedContainer {
	_text = null ;
	_markupText = null ;
	_structuredText = null ;

	constructor( name ) {
		super( name ) ;

		this._turnVisibleOnContentSizeReady = true ;

		// Default values
		this._contentProperties.paddingTop = '10px' ;
		this._contentProperties.paddingBottom = '10px' ;
		this._contentProperties.paddingLeft = '10px' ;
		this._contentProperties.paddingRight = '10px' ;
	}

	dispose() {
		super.dispose() ;
	}

	_getTypeName() { return 'GButton' ; }

	_setContentPropertiesNow( content = this._content ) {
		content._autoScale = false ;
		content.width = '100%' ;
		content.height = '100%' ;

		content.paddingTop = this._contentProperties.paddingTop ;
		content.paddingBottom = this._contentProperties.paddingBottom ;
		content.paddingLeft = this._contentProperties.paddingLeft ;
		content.paddingRight = this._contentProperties.paddingRight ;

		if ( content.paddingTopInPixels + content.paddingBottomInPixels > this.heightInPixels ) {
			console.warn( "Warning: GButton height < padding, expanding height" , this.heightInPixels , content.paddingTopInPixels , content.paddingBottomInPixels ) ;
			this.heightInPixels = content.paddingTopInPixels + content.paddingBottomInPixels + 1 ;
		}

		if ( content.paddingLeftInPixels + content.paddingRightInPixels > this.widthInPixels ) {
			console.warn( "Warning: GButton width < padding, expanding width" , this.widthInPixels , content.paddingLeftInPixels , content.paddingRightInPixels ) ;
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

	/*
	_layout( parentMeasure , context ) {
		console.warn( "Calling GButton _layout(), width:" , this.width , this.widthInPixels , this._content?.width , this._content?.widthInPixels ) ;
		return super._layout( parentMeasure , context ) ;
	}
	*/
}

GButton.prototype._setContentProperties = Promise.debounceNextTick( GButton.prototype._setContentPropertiesNow ) ;
GButton.prototype._createContent = Promise.debounceNextTick( GButton.prototype._createContentNow ) ;
//GButton.prototype._createContent = Promise.debounceUpdate( { waitFn: () => Promise.resolveTimeout(1000) } , GButton.prototype._createContentNow ) ;

DecoratedContainer.createCommonContentGetterSetter( GButton.prototype , {
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



module.exports = GButton ;
BABYLON.GUI.GButton = GButton ;
BABYLON.RegisterClass( 'BABYLON.GUI.GButton' , GButton ) ;

