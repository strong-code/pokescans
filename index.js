'use strict';

const config   = require('./config.json');
const account  = config.account;
const Map      = require('./maps');
const _        = require('lodash');
const text     = require('./text');
const PoGo     = require('pokemon-go-node-api');
const Poke     = new PoGo.Pokeio();
const username = account.username;
const password = account.password;
const provider = account.provider;
const location = {
  type: 'name',
  name: account.location
};

// Only used for google auth, not needed for PTC login
// Poke.GetAccessToken(username, password, (err, __) => {
//   if (err) throw err;
// });

Poke.init(username, password, location, provider, (err) => {
  console.log(`Notifications set to: ${_.join(config.notifications, ', ')}`);
  console.log(`Current location set to: ${Poke.playerInfo.locationName}`);
  const targeting = (_.isEmpty(config.pokemon) ? 'all' : _.join(config.pokemon, ', '));
  console.log(`Targeting: ${targeting}\n`);

  setInterval(() => {
      Poke.Heartbeat((err, hb) => {
        if (err) {
            console.log(err);
        }

        function getName(poke) {
          const num = parseInt(poke.PokedexTypeId);
          return Poke.pokemonlist[num-1].name;
        }

        let totalFound = 0;
        const targetsFound = {};

        _(hb.cells)
        .filter(cell => !_.isEmpty(cell.MapPokemon))
        .flatMap(cell => cell.MapPokemon)
        .filter(cell => _.includes(config.pokemon, getName(cell)))
        .map(cell => {
          cell.name = getName(cell);
          cell.mapURL = Map.generate(config.location, cell.Latitude, cell.Longitude);
          if (_.includes(config.notifications, "text")) {
            text.sendMessage(cell, config.number)
          }
          if (_.includes(config.notifications, "email")) {
            //TODO send an email
          }
          console.log(cell)
          return true;
        })
        .value()

        // _.each(hb.cells, (cell) => {
        //   let target = cell.MapPokemon;
        //   if (!_.isEmpty(target)) {
        //     totalFound += target.length;
        //     _.each(target, (poke) => {
        //       let name = getName(poke);
        //       if (_.isEmpty(config.pokemon) || (_.includes(config.pokemon, name) && !targetsFound[name])) {
        //         targetsFound[name] = poke;
        //         targetsFound[name].mapUrl = Map.generateFromCoordinates(config.location, poke.Latitude, poke.Longitude);
        //
        //         console.log(`Found a ${name} at ${poke.Latitude},${poke.Longitude}`);
        //         console.log(`Map URL: ${targetsFound[name].mapUrl}\n`)
        //
        //         if (_.includes(config.notifications, "text")) {
        //           text.sendMessage(targetsFound, number);
        //         }
        //         if (_.includes(config.notifications, "email")) {
        //           //TODO send an email
        //         }
        //       }
        //     });
        //   }
        // });

        console.log(`\nSCAN COMPLETE | ${totalFound} total found | ${_.keys(targetsFound).length} targets found\n`);
      });
    }, config.timeout || 5000);
});
