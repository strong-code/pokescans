'use strict';

const config   = require('./config.json');
const account  = config.account;
const Map      = require('./maps');
const _        = require('lodash');
const text     = require('./text');
const allPokes = require('./pokemons').pokemon;
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

function allPokemonNames() {
  return _.map(allPokes, (poke) => {
    return poke.name;
  });
}

Poke.init(username, password, location, provider, (err) => {
  console.log(`Notifications set to: ${_.join(config.notifications, ', ')}`);
  console.log(`Current location set to: ${Poke.playerInfo.locationName}`);

  const targetsByName = (_.isEmpty(config.pokemon) ? allPokemonNames() : config.pokemon);
  const targets = _.zipObject(targetsByName, _.map(targetsByName, () => {return false}));
  console.log(`Targeting: ${targetsByName}\n`);

  setInterval(() => {
    if (_.isEmpty(_.filter(targets, (poke) => !poke))) {
      console.log('Found all targeted pokemon, exiting');
      process.exit(0);
    }

    Poke.Heartbeat((err, hb) => {
      if (err || hb === undefined) {
          console.log(err);
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

      let targetsFound;
      let totalFound;

      // TODO:
      // walking can be done by increasing/decreasing the lat/lon coords.
      // approx 0.001 ~= 360ft (walkable distance)
      // Increment by hexogonal walk pattern until max delta is ~0.003

      _(hb.cells)
      .filter(cell => !_.isEmpty(cell.WildPokemon))
      .flatMap(cell => cell.WildPokemon)
      .tap(cells => totalFound = cells.length)
      .filter(cell => _.includes(targetsByName, getName(cell)))
      .map(cell => {
        cell.name = getName(cell);
        cell.img  = getImage(cell);
        cell.ttl  = getTTL(cell);

        if (targets[cell.name]) {
          console.log('already found ' + cell.name)
          return;
        }

        return Map.generate(config.location, cell, (map) => {
          cell.map = map;
          if (_.includes(config.notifications, "text")) {
            console.log('sending text');
            text.sendMessage(cell, config.number)
          }
          if (_.includes(config.notifications, "email")) {
            console.log('sending email');
            //TODO send an email
          }
          return targets[cell.name] = true;
        });
      })
      // .tap(cells => console.log(`\nSCAN COMPLETE | ${totalFound} total found | ${targetsFound} targets found\n`))
      .value();

    });
  }, config.timeout || 5000);
});
