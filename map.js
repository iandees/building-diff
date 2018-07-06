'use strict';

var turf = require('@turf/turf');
var cover = require('@mapbox/tile-cover');
var tilebelt = require('@mapbox/tilebelt');
var coverLimits = {min_zoom: 19, max_zoom: 19};

function difference(setA, setB) {
    var _difference = new Set(setA);
    for (var elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}

module.exports = function(data, tile, writeData, done) {
  var bingCover = new Set();
  for (let feature of data.buildings.bingbuildings.features) {
    var polyCover = cover.indexes(feature.geometry, coverLimits);
    for (let p of polyCover) {
      bingCover.add(p);
    }
  }

  var osmCover = new Set();
  for (let feature of data.osm.osm.features) {
    if (feature.geometry.type !== 'Polygon' || !feature.properties.building) {
      continue;
    }
    var polyCover = cover.indexes(feature.geometry, coverLimits);
    for (let p of polyCover) {
      osmCover.add(p);
    }
  }

  var bingMinusOsm = difference(bingCover, osmCover);
  var osmMinusBing = difference(osmCover, bingCover);

  // console.log("bing: " + bingCover.size + " osm: " + osmCover.size + " bing-osm: " + bingMinusOsm.size + " osm-bing: " + osmMinusBing.size);

  var features = [];
  for (let i of bingMinusOsm) {
    var t = tilebelt.quadkeyToTile(i);
    var g = tilebelt.tileToGeoJSON(t);
    features.push(turf.feature(g));
  }
  var fc = turf.featureCollection(features);
  // fc = turf.dissolve(fc);
  writeData(JSON.stringify(fc) + '\n');

  done(null, null);
};
