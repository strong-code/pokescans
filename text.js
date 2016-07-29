'use strict';

const _      = require('lodash');
const config = require('./config.json');
const twilio = require('twilio')(config.twilio.sid, config.twilio.token);

module.exports = {

  sendMessage: function (data, recipient) {
    return twilio.sendMessage({
      to: recipient,
      from: config.twilio.number,
      body: `PokeScans found a ${data.name} at ${data.Latitude},${data.Longitude}!`,
      mediaUrl: data.mapUrl
    }, (err, res) => {
      // TODO see why twilio doesnt like this now
      console.log(err)
      if (err) throw err;
      console.log(`[SMS] -> ${recipient} | Found ${data.name} at ${data.mapUrl}`);
      return true;
    });
  },

}
