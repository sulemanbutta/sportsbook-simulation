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

async function getAllScores({ league }) {
    const sportConfig = SPORT_MAP[league];
    const mergedScores = [];
    const espnScores = [];
    const oddsScores = [];

    if (!sportConfig) {
        throw new Error(`Unsupported league: ${league}`);
    }

    const { espnSport, oddsSport } = sportConfig;

    try {
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/${league}/scoreboard`;
        const espnRes = await axios.get(espnUrl, { timeout: 5000 });
        if (espnRes.data?.events?.length) {
        //const parsed = parseScoreboard(espnRes.data);
        //return parsed.map(game => ({ ...game, source: 'espn' }));
        const league = espnRes.data.leagues[0].abbreviation
        for (const event of espnRes.data.events || []) {
            const comp = event.competitions?.[0];
            if (!comp || !comp.competitors || comp.competitors.length !== 2) continue;
            const home = comp.competitors.find(c => c.homeAway === 'home');
            const away = comp.competitors.find(c => c.homeAway === 'away');
            const isLive = comp.status?.type?.state === 'in'
            if (!home || !away) continue;
            if (isLive) {
                espnScores.push({
                    normalized_id: generateNormalizedGameId(normalizeTeamName(home.team.displayName), normalizeTeamName(away.team.displayName), comp.date),
                    league: league,
                    sport: oddsSport,
                    commence_time: comp.date,
                    isLive: isLive,
                    completed: comp.status?.type?.completed ?? false,
                    home_team: normalizeTeamName(home.team.displayName),
                    home_team_mascot: home.team.name,
                    away_team: normalizeTeamName(away.team.displayName),
                    away_team_mascot: away.team.name,
                    home_team_score: parseInt(home.score, 10),
                    away_team_score: parseInt(away.score, 10),
                    game_clock: isLive ? comp.status?.type?.detail : comp.status?.type?.description,
                    source: 'espn-api'
                });
            }
        }
        //console.log(`getAllScores: ESPN API success for ${league}.`);
        //console.log("espnScores:", espnScores)
        } else {
        console.warn(`getAllScores: ESPN API returned no events for ${league}. Falling back.`);
        }
    } catch (err) {
        console.warn(`getAllScores: ESPN API failed for ${league}. Falling back:`, err.message);
        console.log("err:", err)
    }

    try {
      const https = require('https');
      const agent = new https.Agent({ family: 4 }); // forces IPv4
      const oddsUrl = `https://api.the-odds-api.com/v4/sports/${oddsSport}/scores/?apiKey=${process.env.ODDS_API_KEY}&daysFrom=1`;
      const oddsRes = await axios.get(oddsUrl, { httpsAgent: agent })
      for (const game of oddsRes.data || []) {
      if (!game.home_team || !game.away_team) continue;
      const isLive = new Date(game.commence_time) <= new Date()
      if (isLive) {
          oddsScores.push({
              event_id: game.id,
              normalized_id: generateNormalizedGameId(game.home_team, game.away_team, game.commence_time),
              league: game.sport_title,
              sport: game.sport_key,
              commence_time: game.commence_time,
              isLive: isLive,
              completed: game.completed,
              home_team: normalizeTeamName(game.home_team),
              home_team_mascot: getMascotFromFullName(game.home_team),
              away_team:  normalizeTeamName(game.away_team),
              away_team_mascot: getMascotFromFullName(game.away_team),
              home_team_score: game.scores?.find(s => s.name === game.home_team)?.score ?? null,
              away_team_score: game.scores?.find(s => s.name === game.away_team)?.score ?? null,
              game_clock: null,
              source: 'odds-api'
          });
      }
    }
    //console.log("oddsScores", oddsScores)
    //return scores
    } catch (err) {
        console.error(`getAllScores: Odds API also failed for ${league}:`, err.message);
        console.log("err:", err)
    }
    


    const mergedGames = [];
    const espnMap = new Map();
  
    // Index ESPN games by hourly fuzzy ID
    for (const game of espnScores) {
      const id = game.normalized_id
      espnMap.set(id, game);
    }
  
    const matchedIds = new Set();
  
    for (const oddsGame of oddsScores) {
      const id = oddsGame.normalized_id
      const espnGame = espnMap.get(id);
  
      if (espnGame) {
        matchedIds.add(id);
        mergedGames.push({
          ...oddsGame,
          // Override with ESPN info where available
          home_team_score: espnGame.home_team_score ?? oddsGame.home_team_score,
          away_team_score: espnGame.away_team_score ?? oddsGame.away_team_score,
          game_clock: espnGame.game_clock ?? null,
          isLive: espnGame.isLive ?? false,
          completed: espnGame.completed ?? oddsGame.completed ?? false,
          source: 'espn+odds',
        });
      } else {
        mergedGames.push({
          ...oddsGame,
          game_clock: null,
          isLive: false,
          completed: oddsGame.completed ?? false,
          //source: 'odds',
        });
      }
    }
  
    // Add unmatched ESPN games
    for (const [id, espnGame] of espnMap.entries()) {
      if (!matchedIds.has(id)) {
        mergedGames.push({
          ...espnGame,
          //source: 'espn',
        });
      }
    }
    //console.log("mergedGames:",mergedGames)
    return mergedGames;
  }
module.exports = { getAllScores };