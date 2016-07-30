'use strict';

const gMap        = require('googlemaps');
const config      = require('./config.json').googleMaps;
const Map         = new gMap(config);
const querystring = require('querystring');

function reverseGeocode (lat, lon, cb) {
  const params = {
    "latlng": `${lat},${lon}`,
    "language": 'en',
    "location_type": 'APPROXIMATE'
  };
  return Map.reverseGeocode(params, (err, res) => {
    if (res.status !== 'OK') {
      return null;
    }
    return cb(res.results[0].formatted_address);
  });
}

module.exports = {

  generate: function (start, cell, cb) {
    const params = {
      center: start,
      zoom: 16,
      size: '500x500',
      mapType: 'roadmap',
      markers: [
        {
          location: `${cell.Latitude},${cell.Longitude}`,
          icon: cell.img
        }
      ],
      style: {
        feature: 'road',
        element: 'all',
      }
    };

    const map = Map.staticMap(params);
    const baseUrl = map.split('?')[0];
    const qs = querystring.parse(map.split('?')[1]);
    delete qs.key
    const mapUrl = baseUrl + '?' + querystring.stringify(qs);

    return reverseGeocode(cell.Latitude, cell.Longitude, (mapAddress) => {
      return cb({
        url: mapUrl,
        address: mapAddress
      });
    });
  }

};
