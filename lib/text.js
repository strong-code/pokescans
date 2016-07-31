'use strict';

const _      = require('lodash');
const config = require('../config.json');
const twilio = require('twilio')(config.twilio.sid, config.twilio.token);

function makeBody (data) {
  let body;

  if (data.map.address) {
    body = `PokeScans found a ${data.name} at ${data.map.address}! Despawns in ${data.ttl}`;
  } else {
    body = `PokeScans found a ${data.name}! Despawns in ${data.ttl}`;
  }

  return body;
}

module.exports = {

  sendMessage: function (data, recipient) {
    return twilio.sendMessage({
      to: recipient,
      from: config.twilio.number,
      body: makeBody(data),
      mediaUrl: data.map.url
    }, (err, res) => {
      if (err) throw err;
      console.log(`[SMS] -> ${recipient} | Found ${data.name} at ${data.map.address}`);
      return true;
    });
  },

}
