// Copyright (c) 2011 David Corvoysier http://www.kaizou.org
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 3dcarousel.js

/*
  The carousel constructor
  
  Parameters:
  - container : the containing DOM node
  - nbcell    : the number of cells in the carousel
  - cwidth    : the width of each cell
  - cheight   : the height of each cell
  - onadded   : a callback function when a cell is added to the carousel
  - onfocus   : a callback function when the front cell is focussed
  - onblur    : a callback function when the front cell is blurred  
  - onselect  : a callback function when the front cell is selected 
*/
function Carousel(container,nbcell,cwidth,cheight,onadded,onfocus,onblur,onselect){
  this.carousel = document.createElement("div");
  this.id = "Carousel" + Math.floor((Math.random()*10000000)+1);;
  this.carousel.id = this.id;
  this.nbcell = nbcell;
  this.cwidth = cwidth;
  this.cheight = cheight;
  this.onadded = onadded;
  this.onfocus = onfocus;
  this.onblur = onblur;
  this.onselect = onselect;
  this.cells = new Array();
  this.theta = 0;
  this.frontIndex = 0;
  this.radius = Math.ceil(this.cwidth/2/Math.tan(Math.PI/this.nbcell));
  var _this = this;
  var carouselRule = '#' + this.id + ' {';
  carouselRule +='position:relative;';
  carouselRule +='transform-style: preserve-3d;';
  carouselRule +='transition: transform 0.5s;';
  carouselRule +='width:100%;';
  carouselRule +='min-width:'+this.cwidth*2+'px;';
  carouselRule +='min-height:'+this.cheight*1.2+'px;';
  carouselRule +='transform: perspective(1100px) translateZ(-'+this.radius+'px)';
  carouselRule +='}';
  this.insertRule(carouselRule);
  var cellRule = '#' + this.id + ' .cell {';
  cellRule +='position:absolute;';
  cellRule +='left: 0px;';
  cellRule +='right: 0px;';
  cellRule +='top: 0px;';
  cellRule +='bottom: 0px;';      
  cellRule +='margin: auto;';
  cellRule +='width:'+this.cwidth+'px;';
  cellRule +='height:'+this.cheight+'px;';
  cellRule +='opacity:0.8;';
  cellRule +='transition-property: all;';
  cellRule +='transition-duration: 0.5s;';
  cellRule +='}'; 
  this.insertRule(cellRule);
  for(var i=0; i<this.nbcell; i++) this.addCell(i);
  container.appendChild(this.carousel);
  this.focus();
}

Carousel.prototype.insertRule = function(rule) {
  if( document.styleSheets.length == 0 ) {
  	var style = document.createElement('style');
	style.type = 'text/css';
   	document.getElementsByTagName('head')[0].appendChild(style);
  }
  var styleSheet = document.styleSheets[document.styleSheets.length-1];
  // If prefixfree is available, use it
  rule = window.PrefixFree ? PrefixFree.prefixCSS(rule,true):rule;
  // Insert the rule
  styleSheet.insertRule(rule,styleSheet.cssRules.length);  
}

Carousel.prototype.focus = function(){
  var frontCell = this.cells[this.frontIndex];
  frontCell.focus();
  if(this.onfocus) this.onfocus(frontCell,this.frontIndex);
}

Carousel.prototype.blur = function(){
  var frontCell = this.cells[this.frontIndex];
  frontCell.blur();
  if(this.onblur) this.onblur(frontCell,this.frontIndex);
}

Carousel.prototype.select = function(index){
  selIndex = index ? index : this.frontIndex;
  if(this.onselect) this.onselect(this.cells[selIndex],selIndex);
}

Carousel.prototype.addCell = function(index){
  var nthcellRule = '#' + this.id + ' .cell:nth-child('+(index+1)+') {';
  nthcellRule +='transform: rotateY('+index*360/this.nbcell+'deg)';
  nthcellRule +='translateZ('+this.radius+'px);';
  nthcellRule +='}';
  this.insertRule(nthcellRule);
  nthcellRule = '#' + this.id + ' .cell:nth-child('+(index+1)+'):focus {';
  // Prevent outline to be displayed when the element is focussed
  nthcellRule +='outline: 0;';
  nthcellRule +='opacity: 1.0 !important;';
  nthcellRule +='transform: rotateY('+index*360/this.nbcell+'deg)';
  nthcellRule +='translateZ('+(this.radius*1.2)+'px);';
  nthcellRule +='transition-delay: 0.5s';
  nthcellRule +='}';
  this.insertRule(nthcellRule);
  var cell=document.createElement("div");
  cell.className = "cell";
  // Make div focussable
  cell.setAttribute("tabindex","-1");
  this.cells.push(cell);
  this.carousel.appendChild(cell);
  if(this.onadded) this.onadded(cell,index);
}

Carousel.DIRECTION = {
LEFT:-1,
RIGHT:1
};

/*
  Rotate the carousel to the left or right
  
  Parameters:
  - direction: Carousel.DIRECTION.LEFT or Carousel.DIRECTION.RIGHT  
  
*/
Carousel.prototype.rotate = function(direction) {
  this.blur();
  this.frontIndex = (this.frontIndex - direction + this.nbcell)%this.nbcell;
  this.theta = (this.theta + direction*( 360 / this.nbcell ));
  var style = 'transform: perspective(1100px) translateZ(-'+this.radius+'px) rotateY(' + this.theta + 'deg)';
  // If prefixfree is available, use it
  style = window.PrefixFree ? PrefixFree.prefixCSS(style,true):style;
  this.carousel.setAttribute('style',style);
  this.focus();
}
