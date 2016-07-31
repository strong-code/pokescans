'use strict';

const _        = require('lodash');
const allPokes = require('./pokemons').pokemon;
const PoGo     = require('pokemon-go-node-api');
const Poke     = new PoGo.Pokeio();
const Map      = require('./maps');

// Only used for google auth, not needed for PTC login
// Poke.GetAccessToken(username, password, (err, __) => {
//   if (err) throw err;
// });

function allPokemonNames() {
  return _.map(allPokes, (poke) => {
    return poke.name;
  });
}

module.exports = function (opts, targetedPokemon, notifications, cb) {
  Poke.init(opts.username, opts.password, opts.location, opts.provider, (err) => {
    console.log(`Current location set to: ${Poke.playerInfo.locationName}`);

    const targetsByName = (_.isEmpty(targetedPokemon) ? allPokemonNames() : targetedPokemon);
    const targets = _.zipObject(targetsByName, _.map(targetsByName, () => {return false}));
    console.log(`Targeting: ${targetsByName}\n`);

    const interval = setInterval(() => {
      Poke.Heartbeat((err, hb) => {
        if (err) {
          throw err;
        }

        // Check if all targeted Pokemon are found. If so, call CB with all pokes
        if (_.isEmpty(_.filter(targets, (poke) => !poke))) {
          console.log('Found all targeted pokemon, exiting');
          clearInterval(interval)
          return cb(targets);
        }

        if (hb === undefined) {
          console.log('Heartbeat undefined, recursing');
          return module.exports();
        }

        function getName(poke) {
          const num = parseInt(poke.pokemon.PokemonId);
          return Poke.pokemonlist[num-1].name;
        }

        function getImage(poke) {
          const baseUrl = 'http://ugc.pokevision.com/images/pokemon/';
          return baseUrl + '' + poke.pokemon.PokemonId + '.png';
        }

        function getTTL(poke) {
          const ttlMillis = poke.TimeTillHiddenMs;
          const mins = Math.floor(ttlMillis / 60000);
          const secs = ((ttlMillis % 60000) / 1000).toFixed(0);
          return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }

        // TODO:
        // walking can be done by increasing/decreasing the lat/lon coords.
        // approx 0.001 ~= 360ft (walkable distance)
        // Increment by hexogonal walk pattern until max delta is ~0.003

        _(hb.cells)
        .filter(cell => !_.isEmpty(cell.WildPokemon))
        .tap(cells => {if (cells.length === 0) console.log('No wild pokemon found!')})
        .flatMap(cell => cell.WildPokemon)
        .filter(cell => _.includes(targetsByName, getName(cell)))
        .map(cell => {
          cell.name = getName(cell);
          cell.img  = getImage(cell);
          cell.ttl  = getTTL(cell);
          console.log(cell)

          if (targets[cell.name]) {
            return;
          }

          return Map.generate(opts.location, cell, (map) => {
            cell.map = map;
            if (_.includes(notifications, "text")) {
              console.log('sending text');
              // text.sendMessage(cell, config.number)
            }
            if (_.includes(notifications, "email")) {
              console.log('sending email');
              //TODO send an email
            }
            targets[cell.name] = true;
            console.log(`SCAN COMPLETE | FOUND ${_.filter(targets, t => t).length}/${_.keys(targets).length}`);
            return;
          });
        })
        .value();

      });
    }, opts.timeout || 5000);
  });
};
