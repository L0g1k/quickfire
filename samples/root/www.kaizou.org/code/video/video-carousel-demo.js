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
//
// video-effects-demo.js
//    
var videos = [
{
    name: "Sintel",
    urls: ["http://media.kaizou.org/sintel_trailer-480p.mp4",
    "http://media.kaizou.org/sintel_trailer-480p.ogg"],
    author: "Blender Foundation",
    license: "http://creativecommons.org/licenses/by/3.0/"
},
{
    name: "Big Buck Bunny",
    urls: ["http://media.kaizou.org/bbunny_trailer.ogg",
    "http://media.kaizou.org/bbunny_trailer.mov"],
    author: "Peach Open Movie Project",
    license: "http://creativecommons.org/licenses/by/3.0/"
},
{
    name: "Elephant Dreams",
    urls: ["http://media.kaizou.org/edreams.mp4",
    "http://media.kaizou.org/edreams.ogg"],
    author: "Orange Open Movie Project",
    license: "http://creativecommons.org/licenses/by/2.5/"
},
{
    name: "Gizmo",
    urls: ["http://media.kaizou.org/gizmo.mp4",
    "http://media.kaizou.org/gizmo.webm"],
    author: "Ulrik D. Hansen",
    license: "http://creativecommons.org/licenses/by/3.0/"
},
{
    name: "A Shared Culture",
    urls: ["http://media.kaizou.org/ASharedCulture_480p.webm",
    "http://media.kaizou.org/ASharedCulture_480p.m4v"],
    author: "Jesse Dylan",
    name: "http://creativecommons.org/licenses/by-nc-sa/3.0/us/"
},
{
    name: "Mayer And Beetle 2",
    urls: ["http://media.kaizou.org/MayerandBettle2_240p.webm"],
    author: "Creative Commons Australia IV Motion and Black Brow",
    license: "http://creativecommons.org/licenses/by/2.5/au/"
},
{
    name: "Wired NextMusic",
    urls: ["http://media.kaizou.org/WiredNextMusic_360p.webm"],
    author: "Creative Commons",
    license: "http://creativecommons.org/licenses/by/3.0/"
}
];
var carousel = null;
var swipe = null;

function onCellAdded(cell,index){
  var video=document.createElement("video");
  var urls = videos[index%videos.length].urls;
  for(var i=0;i<urls.length;i++){
    var source = document.createElement("source");
    source.src=urls[i];
    video.appendChild(source);
  }
  video.autoplay=true;
  video.loop=true;
  video.muted=true;
  cell.appendChild(video);
}

function onCellFocus(cell,index){
    var video = cell.getElementsByTagName("video")[0];
    if(video){
        video.muted=false;
    }
}

function onCellBlur(cell,index){
    var video = cell.getElementsByTagName("video")[0];
    if(video){
        video.muted=true;
    }
}

function onCellSelect(cell,index){
    var video = cell.getElementsByTagName("video")[0];
    if(video){
        video.play();
    }
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

function init(event) {
  var container = document.getElementById("container");
  carousel = new Carousel(container,// Containing node
                          7,        // Nb Cells
                          465,      // Cell width
                          352,      // Cell height
                          onCellAdded,
                          onCellFocus,
                          onCellBlur,
                          onCellSelect
                          );
  var credits = document.getElementById("credits");
  for (var i=0; (i<videos.length) && (i<7);i++){
      video = videos[i%videos.length];
      credits.innerHTML += "<p>" + video.name + " <a href=" + video.license + ">Copyright</a> " + video.author + "</p>";
  }
  window.addEventListener("keydown",handleKeyDown,false);
  swipe = new Swipe(container,moveLeft,moveRight,null,null);	
}

window.addEventListener("load",init,false);
