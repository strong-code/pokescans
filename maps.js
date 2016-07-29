'use strict';

const gMap        = require('googlemaps');
const config      = require('./config.json').googleMaps;
const Map         = new gMap(config);
const querystring = require('querystring');

module.exports = {

  generate: function (start, lat, lon) {
    const params = {
      center: start,
      zoom: 15,
      size: '500x500',
      mapType: 'roadmap',
      markers: [
        {
          location: `${lat},${lon}`,
          label: 'A',
          color: 'green',
          shadow: true
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
    return baseUrl + '?' + querystring.stringify(qs);
  }

};
