
"use strict" ;



const svgKit = require( 'svg-kit' ) ;
const BoundingBox = svgKit.BoundingBox ;



/*
	Build a texture atlas model, store multiple rectangular area and place them inside a bigger rectangle.
*/
class Atlas {
	_width = 0 ;
	_height = 0 ;
	_areas = [] ;
	_unusedAreas = new Set() ;
	_byName = {} ;	// Areas by name
	_wastedThreshold = 20 ;	// The threshold for wasted size (either width or height), if it exceed, an unused area is recycled



	get width() { return this._width ; }
	get height() { return this._height ; }



	constructor( options = {} ) {
		this._wastedThreshold = options.wastedThreshold !== undefined ? + options.wastedThreshold || 0 : 20 ;
	}



	// .addArea( name , width , height )
	// .addArea( name , viewbox )
	addArea( name , width , height ) {
		// Manage arguments
		if ( this._byName[ name ] ) {
			console.warn( "Area name already existing:" , name ) ;
			return false ;
		}

		if ( width && typeof width ==='object' ) {
			height = width.height ;
			width = width.width ;
		}


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
		// The simplest way is to make it so we are adding a new recycling area, so it will reuse the column/row recycling
		let unusedArea = new BoundingBox( {
			x: this._width ,
			y: 0 ,
			width ,
			height: this._height
		} ) ;

		this._unusedAreas.add( unusedArea ) ;
		this._width += width ;
		this._recycleArea( name , width , height , unusedArea ) ;
	}



	_enlargeHeight( name , width , height ) {
		// The simplest way is to make it so we are adding a new recycling area, so it will reuse the column/row recycling
		let unusedArea = new BoundingBox( {
			x: 0 ,
			y: this._height ,
			width: this._width ,
			height
		} ) ;

		this._unusedAreas.add( unusedArea ) ;
		this._height += height ;
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
		// Create the new area from the recycling unused area

		let area = recyclingArea.dup() ;
		area.width = width ;
		area.height = height ;
		this._areas.push( area ) ;
		this._byName[ name ] = area ;


		// Keep left-over as recycling area?

		let extraWidth = recyclingArea.width - area.width ;
		let extraHeight = recyclingArea.height - area.height ;

		if ( extraWidth >= this._wastedThreshold || extraHeight >= this._wastedThreshold ) {
			let columnPixels = ( recyclingArea.width - area.width ) * recyclingArea.height ;
			let rowPixels = recyclingArea.width * ( recyclingArea.height - area.height ) ;
			let newUnusedArea = recyclingArea.dup() ;

			if ( rowPixels >= columnPixels ) {
				// Reuse the bottom row
				recyclingArea.ymin += area.height ;

				if ( extraWidth >= this._wastedThreshold && extraHeight >= this._wastedThreshold ) {
					// Also add the left-over small rectangle
					recyclingArea.xmin += area.width ;
					newUnusedArea.height = area.height ;
					this._unusedAreas.add( newUnusedArea ) ;
				}
			}
			else {
				// Reuse the right column
				recyclingArea.xmin += area.width ;

				if ( extraWidth >= this._wastedThreshold && extraHeight >= this._wastedThreshold ) {
					// Also add the left-over small rectangle
					newUnusedArea.ymin += area.height ;
					newUnusedArea.width = area.width ;
					this._unusedAreas.add( newUnusedArea ) ;
				}
			}
		}
		else {
			// Don't recycle, remove it
			this._unusedAreas.delete( recyclingArea ) ;
		}

		return true ;
	}
}

module.exports = Atlas ;

