function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

function mergeScoresAndOdds(oddsList, scoreList) {
    const scoreMapByNormalizedId = new Map();
    const scoreMapByEventId = new Map();
    const matchedScoreIds = new Set();
  
    for (const score of scoreList) {
      if (score.normalized_id) {
        scoreMapByNormalizedId.set(score.normalized_id, score);
      }
      if (score.event_id) {
        scoreMapByEventId.set(score.event_id, score);
      }
    }
  
    const mergedGames = oddsList.map(odds => {
      const matchByEventId = odds.event_id && scoreMapByEventId.get(odds.event_id);
      const matchByNormalizedId = scoreMapByNormalizedId.get(odds.normalized_id);
      const matchedScore = matchByEventId || matchByNormalizedId || null;
  
      if (matchedScore) {
        matchedScoreIds.add(matchedScore.event_id);
        matchedScoreIds.add(matchedScore.normalized_id);
      }

      const isLive = matchedScore?.isLive !== undefined ? matchedScore.isLive : odds.isLive;
      const completed = matchedScore?.completed !== undefined ? matchedScore.completed : odds.completed;
      //console.log("odds:", odds)
      //console.log("matchedScore:", matchedScore)
      return {
        normalized_id: odds.normalized_id,
        event_id: odds.event_id,
        commence_time: odds.commence_time,
        league: odds.league,
        sport: odds.sport,
        home_team: odds.home_team,
        away_team: odds.away_team,
        home_team_mascot: odds.home_team_mascot,
        away_team_mascot: odds.away_team_mascot,
        isLive,
        completed,
        odds: {
          home_team_odds: odds.home_team_odds,
          away_team_odds: odds.away_team_odds,
          last_odds_update: odds.last_odds_update,
        },
        score: {
          home_team_score: matchedScore ? matchedScore.home_team_score : null,
          away_team_score: matchedScore ? matchedScore.away_team_score : null,
          game_clock: matchedScore ? matchedScore.game_clock : null,
          source: matchedScore ? matchedScore.source: null,
        },
      };
    });
  
    const unmatchedScores = scoreList
      .filter(score => (
        !matchedScoreIds.has(score.event_id) &&
        !matchedScoreIds.has(score.normalized_id)
      ))
      .map(score => ({
        normalized_id: score.normalized_id,
        event_id: score.event_id,
        commence_time: score.commence_time,
        league: score.league,
        sport: score.sport,
        home_team: score.home_team,
        away_team: score.away_team,
        home_team_mascot: score.home_team_mascot,
        away_team_mascot: score.away_team_mascot,
        isLive: score.isLive,
        completed: score.completed,
        odds: null,
        score: {
          home_team_score: score.home_team_score,
          away_team_score: score.away_team_score,
          game_clock: score.game_clock,
          source: score.source,
        },
      }));
    //console.log("mergedGames:", mergedGames)
    //console.log("unmatchedScores:", unmatchedScores)
    return [...mergedGames, ...unmatchedScores];
  }

  module.exports = { mergeScoresAndOdds };
