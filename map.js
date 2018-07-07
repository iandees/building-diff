'use strict';

var turf = require('@turf/turf');
var cover = require('@mapbox/tile-cover');
var tilebelt = require('@mapbox/tilebelt');
var rbush = require('geojson-rbush').default;
var coverLimits = {min_zoom: 24, max_zoom: 24};

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
  // Load an rbush with the existing OSM buildings
  var osmCover = rbush();
  for (let feature of data.osm.osm.features) {
    if (feature.geometry.type !== 'Polygon' || !feature.properties.building) {
      continue;
    }
    osmCover.insert(feature);
  }

  var features = [];

  for (let bFeature of data.buildings.bingbuildings.features) {
    var bingOsmIntersect = osmCover.search(bFeature);

    if (bingOsmIntersect.features.length == 0) {
      // No intersection in the rbush means we should just write out the building
      features.push(bFeature);
      continue;
    } else if (bingOsmIntersect.features.length > 0) {
      var bCentroid = turf.centroid(bFeature);

      var matchFound = false;
      for (let oFeature of bingOsmIntersect.features) {
        var oCentroid = turf.centroid(oFeature);
        var dist = turf.distance(bCentroid, oCentroid);
        if (dist < 0.05) {
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        features.push(bFeature);
      }
    }
  }

  var fc = turf.featureCollection(features);
  writeData(JSON.stringify(fc) + '\n');

  done(null, null);
};
