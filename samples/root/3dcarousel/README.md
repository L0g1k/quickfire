#3dcarousel.js 
An all-purpose pure CSS 3D carousel.

The Carousel takes advantage of CSS 3D transforms using a strictly compliant syntax.

To use the Carousel in a browser using vendor-specific CSS 3D transforms, you have to include [PrefixFree](http://leaverou.github.com/prefixfree/) before the 3dcarousel script to automatically convert the generic CSS rules to your browser specific ones.  

Check here the status of CSS 3D Transforms: [Can I use CSS3 3D Transforms?](http://caniuse.com/transforms3d)

##Usage

    <script type='text/javascript' src='prefixfree.js'></script>
    <script type='text/javascript' src='3dcarousel.js'></script>

    function onCellAdded(cell,index) {
    	// Here define what goes inside the cell at given index
    }
    
    ...
    
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

##Demo

[Try out the demo](http://kaizouman.github.com/3dcarousel/).

##License

You may use this code under the terms of the MIT license.
