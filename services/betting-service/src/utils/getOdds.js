require("dotenv").config();
const axios = require('axios');
const { getMascotFromFullName } = require('../utils/teamMascots');
const { generateNormalizedGameId } = require('./generateNormalizedGameId');

const SPORT_MAP = {
    nba: { espnSport: 'basketball', oddsSport: 'basketball_nba' },
    nhl: { espnSport: 'hockey', oddsSport: 'icehockey_nhl' },
    mlb: { espnSport: 'baseball', oddsSport: 'baseball_mlb' },
};

function normalizeTeamName(name) {
    //console.log("name:", name)
    if (name === 'Athletics') {
      return 'Oakland Athletics'
    } else if (name === 'LA Clippers') {
      return 'Los Angeles Clippers'
    } else {
      return name
      .replace(/\./g, '')        // remove all periods     
      .replace(/[\u0300-\u036f]/g, ''); // remove diacritics
    }
  }

async function getOdds() {
    try {
    const odds = [];
    const https = require('https');
    const agent = new https.Agent({ family: 4 }); // forces IPv4
    const [ nbaOddsRes, nhlOddsRes, mlbOddsRes, ] = await Promise.all([
        axios.get(process.env.ODDS_API_NBA_ODDS_URL, { httpsAgent: agent }),
        axios.get(process.env.ODDS_API_NHL_ODDS_URL, { httpsAgent: agent }),
        axios.get(process.env.ODDS_API_MLB_ODDS_URL, { httpsAgent: agent }),
        ]);
    const oddsData = [...nbaOddsRes.data, ...nhlOddsRes.data, ...mlbOddsRes.data];
    oddsData.forEach(game => {
        let home_team_odds, away_team_odds, last_odds_update;
        if (game.bookmakers[0]) {
            if (game.bookmakers[0].markets[0].outcomes[0].name === game.home_team) {
                home_team_odds = game.bookmakers[0].markets[0].outcomes[0].price
                away_team_odds = game.bookmakers[0].markets[0].outcomes[1].price
            }
            else {
                home_team_odds = game.bookmakers[0].markets[0].outcomes[1].price
                away_team_odds = game.bookmakers[0].markets[0].outcomes[0].price
            }
            last_odds_update = game.bookmakers[0].markets[0].last_update
        }
        odds.push({
            event_id: game.id,
            normalized_id: generateNormalizedGameId(normalizeTeamName(game.home_team), normalizeTeamName(game.away_team), game.commence_time),
            league: game.sport_title,
            sport: game.sport_key,
            commence_time: game.commence_time,
            isLive: new Date(game.commence_time) <= new Date(),
            completed: false,
            home_team: normalizeTeamName(game.home_team),
            home_team_mascot: getMascotFromFullName(game.home_team),
            away_team:  normalizeTeamName(game.away_team),
            away_team_mascot: getMascotFromFullName(game.away_team),
            home_team_odds: home_team_odds ?? null,
            away_team_odds: away_team_odds ?? null,
            last_odds_update: last_odds_update,
        });
    });
    //console.log("odds:", odds)
    return odds;
} catch (error) {
    console.log(`getOdds Error`, error.message);
}
};

module.exports = { getOdds };