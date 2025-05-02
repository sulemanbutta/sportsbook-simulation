const { generateNormalizedGameId } = require('./generateNormalizedGameId');

function parseScoreboard(data) {
    const games = [];
    const league = data.leagues[0].abbreviation
    for (const event of data.events || []) {
      const comp = event.competitions?.[0];
      if (!comp || !comp.competitors || comp.competitors.length !== 2) continue;
  
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      const isLive = comp.status?.type?.state === 'in'
      //console.log("comp.status?.type?.state: ", comp.status?.type?.state)
      //console.log("isLive:", isLive)
      if (!home || !away) continue;
  
      games.push({
        normalized_id: generateNormalizedGameId(home.team.displayName, away.team.displayName, comp.date),
        league: league,
        commence_time: comp.date,
        isLive: isLive,
        completed: comp.status?.type?.completed ?? false,
        home_team: home.team.displayName,
        home_team_mascot: home.team.name,
        away_team: away.team.displayName,
        away_team_mascot: away.team.name,
        home_team_score: parseInt(home.score, 10),
        away_team_score: parseInt(away.score, 10),
        game_clock: isLive ? comp.status?.type?.detail : comp.status?.type?.description,
      });
    }
  
    return games;
  }
  
  module.exports = { parseScoreboard };