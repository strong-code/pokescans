'use strict';

const _       = require('lodash');
const Scanner = require('./lib/scan');
const Mapper  = require('./lib/maps');
const Texter  = require('./lib/text');
const config  = require('./config.json');

console.log(`Notifications set to: ${_.join(config.notifications, ', ')}`);
Scanner(config.account, config.pokemon, config.notifications, (targetsFound) => {
  console.log(targetsFound)
});
