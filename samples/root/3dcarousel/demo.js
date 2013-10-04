// Copyright (c) 2011 David Corvoysier http://www.kaizou.org
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
// associated documentation files (the "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial
// portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
// LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// demo.js

function onCellAdded(cell,index){
	var img=document.createElement("img");
	img.src=path+images[index%images.length];
	img.onclick = (function(scopedIndex){
		return  function(event){
			carousel.select(scopedIndex);
		};
	})(index);
	cell.appendChild(img);
}

function onCellFocus(cell,index){
}

function onCellBlur(cell,index){
}

function onCellSelect(cell,index){
	window.location.assign("http://www.public-domain-image.com/nature-landscape/sunset/index2.html");
}

function moveLeft(){
	carousel.rotate(Carousel.DIRECTION.LEFT);
}

function moveRight(){
	carousel.rotate(Carousel.DIRECTION.RIGHT);
}

function handleKeyDown(event){
	switch(event.keyCode){
		case 37:
		carousel.rotate(Carousel.DIRECTION.RIGHT);
		event.preventDefault();
		break;
		case 39:
		carousel.rotate(Carousel.DIRECTION.LEFT);
		event.preventDefault();
		break;
		case 13:
		carousel.select();
		event.preventDefault();
		break;
		default:
		break;
	}
}

function buildCarousel(evt) {
    var container = document.getElementById("container");
    carousel = new Carousel(container,// Containing node
                            9,        // Nb Cells
                            465,      // Cell width
                            352,      // Cell height
                            onCellAdded,
                            onCellFocus,
                            onCellBlur,
                            onCellSelect
                            );
    swipe = new Swipe(container,moveLeft,moveRight,null,null);	
}

var images = [
'/sunsets/sunset-at-biscuit-basin.jpg',
'/sunsets/sunset-bigbury-on-the-sea.jpg',
'/sunsets/sunset-at-la-jolla-shores.jpg',
'/sunsets/sunset-bigbury-over-see.jpg',
'/sunsets/sunset-at-ocean-beach.jpg',
'/sunsets/sunset-clouds-evening-beaches.jpg',
'/sunsets/sunset-at-pacific-beach.jpg',
'/sunsets/sunsets-piers-cafes.jpg',
'/sunsets/sunset-at-point-loma.jpg',
'/sunsets/sunsets-seagulls.jpg'
];
var carousel = null;
var swipe = null;
var scripts = document.getElementsByTagName('script');
var thisScript = scripts[scripts.length-1];
var path = thisScript.src.replace(/\/demo\.js$/, '/');

window.addEventListener("keydown",handleKeyDown,false);

window.addEventListener("load",buildCarousel,false);

