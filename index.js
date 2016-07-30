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

  const targets = (_.isEmpty(config.pokemon) ? allPokemonNames() : _.join(config.pokemon, ', '));
  console.log(`Targeting: ${targets}\n`);

  setInterval(() => {
      Poke.Heartbeat((err, hb) => {
        if (err || !hb) {
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

        _(hb.cells)
        .filter(cell => !_.isEmpty(cell.WildPokemon))
        .flatMap(cell => cell.WildPokemon)
        .tap(cells => totalFound = cells.length)
        .filter(cell => _.includes(targets, getName(cell)))
        .tap(cells => targetsFound = cells.length)
        .map(cell => {
          cell.name = getName(cell);
          cell.img = getImage(cell);
          cell.ttl = getTTL(cell);

          return Map.generate(config.location, cell, (map) => {
            cell.map = map;
            console.log(cell)
            if (_.includes(config.notifications, "text")) {
              console.log('sending text');
              text.sendMessage(cell, config.number)
            }
            if (_.includes(config.notifications, "email")) {
              console.log('sending email');
              //TODO send an email
            }
            return true;
          });
        })
        .tap(cells => console.log(`\nSCAN COMPLETE | ${totalFound} total found | ${targetsFound} targets found\n`))
        .value();

      });
    }, config.timeout || 5000);
});
