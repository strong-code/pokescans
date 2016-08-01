'use strict';

const _       = require('lodash');
const Scanner = require('./lib/scan');
const Mapper  = require('./lib/maps');
const Texter  = require('./lib/text');
const config  = require('./config.json');
const express = require('express');

const server = express();
server.set('views', __dirname + '/views');
server.set('view engine', 'ejs');
server.use(require('body-parser').urlencoded({ extended: false }));

server.use((req, res, next) => {
  console.log('[' + res.statusCode + ' ' + req.method + '] -> ' + req.hostname + req.path);
  next();
});

server.get('/scan', (req, res) => {
  res.render('scan');
});

server.post('/scan', (req, res) => {
  let pokemon = _.split(req.body.poke, ', ');
  console.log(pokemon)
  Scanner(config.account, pokemon, config.notifications, (targetsFound) => {
    console.log(targetsFound);
  });
  res.send('Searching for ' + pokemon)
});

server.listen(3000, () => {
  console.log('Server started on port: ' + 3000);
});

// console.log(`Notifications set to: ${_.join(config.notifications, ', ')}`);
// Scanner(config.account, config.pokemon, config.notifications, (targetsFound) => {
//   console.log(targetsFound)
// });
