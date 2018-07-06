'use strict';

var tileReduce = require('@mapbox/tile-reduce');
var path = require('path');

tileReduce({
  zoom: 12,
  map: path.join(__dirname, '/map.js'),
  bbox: [-93.189207,44.938751,-93.17296,44.948346],
  sources: [
    {name: 'osm', mbtiles: path.join('/Users/iandees/Downloads', 'united_states_of_america.mbtiles')},
    {name: 'buildings', mbtiles: path.join('/Users/iandees/Downloads', 'bingbuildings.mbtiles')}
  ]
})
.on('reduce', function(num) {
})
.on('end', function() {
});
