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



const svgKit = require( 'svg-kit' ) ;
const BoundingBox = svgKit.BoundingBox ;
const Vector4 = BABYLON.Vector4 ;



/*
	Build a texture atlas model, store multiple rectangular area and place them inside a bigger rectangle.
*/
class Atlas {
	_width = 0 ;
	_height = 0 ;
	_areas = [] ;
	_unusedAreas = new Set() ;
	_byName = {} ;	// Areas by name, each value is either a bonding box OR an array of bounding box if multiple names
	_wastedThreshold = 20 ;	// The threshold for wasted size (either width or height), if it exceed, an unused area is recycled



	constructor( options = {} ) {
		this._wastedThreshold = options.wastedThreshold !== undefined ? + options.wastedThreshold || 0 : 20 ;
	}



	get width() { return this._width ; }
	get height() { return this._height ; }
	getArea( name ) { return this._byName[ name ] || null ; }



	/*
		Automatically compute face UV coordinates for an area.
		
		Arguments:
			epsilon: (in pixel) ensure there is no leak, by reducing the UV window by that amount of pixel, on all 4 direction,
			  3 (the default) is a good value
			invertY: (default: true) most of time you should have it set to true, because 2D canvas is Y-down but UV is Y-up (i.e. V-up)
	*/
	getAreaUV( name , epsilon = 3 , invertY = true ) {
		if ( ! this._byName[ name ] ) { return null ; }
		if ( Array.isArray( this._byName[ name ] ) ) {
			return this._byName[ name ].map( area => this._getOneAreaUV( area , epsilon , invertY ) ) ;
		}
		return this._getOneAreaUV( this._byName[ name ] , epsilon , invertY ) ;
	}



	_getOneAreaUV( area , epsilon , invertY ) {
		// Ensure epsilon would not cause issues
		epsilon = Math.min( + epsilon || 0 , Math.floor( area.width / 2 ) , Math.floor( area.height / 2 ) ) ;
		
		if ( invertY ) {
			return new Vector4(
				( area.xmin + epsilon ) / this._width ,
				1 - ( area.ymax - epsilon ) / this._height ,
				( area.xmax - epsilon ) / this._width ,
				1 - ( area.ymin + epsilon ) / this._height
			) ;
		}
		else {
			return new Vector4(
				( area.xmin + epsilon ) / this._width ,
				( area.ymin + epsilon ) / this._height ,
				( area.xmax - epsilon ) / this._width ,
				( area.ymax - epsilon ) / this._height
			) ;
		}
	}



	_addNamedArea( name , area ) {
		if ( this._byName[ name ] ) {
			if ( Array.isArray( this._byName[ name ] ) ) {
				this._byName[ name ].push( area ) ;
			}
			else {
				this._byName[ name ] = [ this._byName[ name ] , area ] ;
			}
		}
		else {
			this._byName[ name ] = area ;
		}
	}
	
	
	
	// .addArea( name , width , height )
	// .addArea( name , viewbox )
	addArea( name , width , height ) {
		// Manage arguments
		if ( width && typeof width ==='object' ) {
			height = width.height ;
			width = width.width ;
		}
		//console.warn( "Adding area '" + name + "': " + width + "x" + height + " to atlas " + this._width + "x" + this._height ) ;


		// First try to recycle an existing area
		if ( this._recycle( name , width , height ) ) { return true ; }


		// Nothing found, enlarge the atlas

		// There are 4 cases
		if ( width <= this._width && height > this._height ) {
			// 100% sure we prefer to enlarge the height and move the new area to the bottom
			this._enlargeHeight( name , width , height ) ;
			return true ;
		}

		if ( height <= this._height && width > this._width ) {
			// 100% sure we prefer to enlarge the width and move the new area to the right
			this._enlargeWidth( name , width , height ) ;
			return true ;
		}

		// Check which enlargement would produce the least atlas pixels
		if ( this._width * ( this._height + height ) <= ( this._width + width ) * this._height ) {
			this._enlargeHeight( name , width , height ) ;
		}
		else {
			this._enlargeWidth( name , width , height ) ;
		}

		return true ;
	}



	_enlargeWidth( name , width , height ) {
		if ( height > this._height ) {
			if ( this._width > 0 ) {
				// Height should also be enlarged, so create an extra unused area below existing atlas area
				let extraUnusedArea = new BoundingBox( {
					x: 0 ,
					y: this._height ,
					width: this._width ,
					height: height - this._height
				} ) ;

				//console.log( "Add new unused area (enlarge width extra): " , extraUnusedArea.export() ) ;
				this._unusedAreas.add( extraUnusedArea ) ;
			}

			this._height = height ;
		}

		// The simplest way is to make it so we are adding a new recycling area, so it will reuse the column/row recycling
		let unusedArea = new BoundingBox( {
			x: this._width ,
			y: 0 ,
			width ,
			height: this._height
		} ) ;

		//console.log( "Add new temporary unused area (enlarge width): " , unusedArea.export() ) ;
		this._unusedAreas.add( unusedArea ) ;
		this._width += width ;
		//console.log( "Enlarging width of atlas to " + this._width + "x" + this._height ) ;
		this._recycleArea( name , width , height , unusedArea ) ;
	}



	_enlargeHeight( name , width , height ) {
		if ( width > this._width ) {
			if ( this._height > 0 ) {
				// Width should also be enlarged, so create an extra unused area to the left of the existing atlas area
				let extraUnusedArea = new BoundingBox( {
					x: this._width ,
					y: 0 ,
					width: width - this._width ,
					height: this._height
				} ) ;

				//console.log( "Add new unused area (enlarge height extra): " , extraUnusedArea.export() ) ;
				this._unusedAreas.add( extraUnusedArea ) ;
			}

			this._width = width ;
		}


		// The simplest way is to make it so we are adding a new recycling area, so it will reuse the column/row recycling
		let unusedArea = new BoundingBox( {
			x: 0 ,
			y: this._height ,
			width: this._width ,
			height
		} ) ;

		//console.log( "Add new temporary unused area (enlarge height): " , unusedArea.export() ) ;
		this._unusedAreas.add( unusedArea ) ;
		this._height += height ;
		//console.log( "Enlarging height of atlas to " + this._width + "x" + this._height ) ;
		this._recycleArea( name , width , height , unusedArea ) ;
	}



	_recycle( name , width , height ) {
		let pixels = width * height ,
			bestWastedPixels = Infinity ,
			bestUnusedArea = null ;


		// Search for the best fitting recycling area

		for ( let unusedArea of this._unusedAreas ) {
			if ( unusedArea.width >= width && unusedArea.height >= height ) {
				let wastedPixels = unusedArea.width * unusedArea.height - pixels ;
				if ( wastedPixels < bestWastedPixels ) {
					bestUnusedArea = unusedArea ;
				}
			}
		}

		// Nothing found
		if ( ! bestUnusedArea ) { return false ; }

		// Recycle the found area
		this._recycleArea( name , width , height , bestUnusedArea ) ;

		return true ;
	}



	_recycleArea( name , width , height , recyclingArea ) {
		//console.log( "Recycle area: " , recyclingArea.export() ) ;

		// Create the new area from the recycling unused area

		let area = recyclingArea.dup() ;
		area.width = width ;
		area.height = height ;
		this._areas.push( area ) ;
		this._addNamedArea( name , area ) ;


		// Keep left-over as recycling area?

		let extraWidth = recyclingArea.width - area.width ;
		let extraHeight = recyclingArea.height - area.height ;

		if ( 
			//extraWidth >= 0 && extraHeight >= 0 &&
			( extraWidth >= this._wastedThreshold || extraHeight >= this._wastedThreshold )
		) {
			let columnPixels = ( recyclingArea.width - area.width ) * recyclingArea.height ;
			let rowPixels = recyclingArea.width * ( recyclingArea.height - area.height ) ;
			let newUnusedArea = recyclingArea.dup() ;
			//console.log( "Recycling... row pixels: " + rowPixels + "   column pixels: " + columnPixels ) ;

			if ( rowPixels >= columnPixels ) {
				// Reuse the bottom row
				recyclingArea.ymin += area.height ;

				if ( extraWidth >= this._wastedThreshold && area.height >= this._wastedThreshold ) {
					// Also add the left-over small rectangle
					recyclingArea.xmin += area.width ;
					newUnusedArea.height = area.height ;
					this._unusedAreas.add( newUnusedArea ) ;
					//console.log( "Add new unused area (row left-over): " , newUnusedArea.export() ) ;
				}
			}
			else {
				// Reuse the right column
				recyclingArea.xmin += area.width ;

				if ( area.width >= this._wastedThreshold && extraHeight >= this._wastedThreshold ) {
					// Also add the left-over small rectangle
					newUnusedArea.ymin += area.height ;
					newUnusedArea.width = area.width ;
					this._unusedAreas.add( newUnusedArea ) ;
					//console.log( "Add new unused area (column left-over): " , newUnusedArea.export() ) ;
				}
			}
			//console.log( "Resized recycling area: " , recyclingArea.export() ) ;
		}
		else {
			// Don't recycle, remove it
			//console.log( "Remove unused area: " , recyclingArea.export() ) ;
			this._unusedAreas.delete( recyclingArea ) ;
		}

		return true ;
	}
}

module.exports = Atlas ;

