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

function intersection(setA, setB) {
    var _intersection = new Set();
    for (var elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}

module.exports = function(data, tile, writeData, done) {
  // Find coverage for the existing OSM buildings
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

  var features = [];

  // For each of the Bing buildings, check to see if its coverage intersects
  // with the OSM coverage. If it does not, then output the Bing building.
  for (let feature of data.buildings.bingbuildings.features) {
    var bingCover = new Set(cover.indexes(feature.geometry, coverLimits));
    var bingOsmIntersect = intersection(bingCover, osmCover);
    var coverIntersectRatio = bingOsmIntersect.size / bingCover.size;

    if (coverIntersectRatio > 0.4) {
      continue;
    } else {
      feature.properties.coverRatio = coverIntersectRatio;
      features.push(feature);
      // writeData(JSON.stringify(feature) + '\n');
      // for (let c of bingCover) {
      //   osmCover.delete(c);
      // }
    }
  }

  var fc = turf.featureCollection(features);
  writeData(JSON.stringify(fc) + '\n');

  done(null, null);
};
