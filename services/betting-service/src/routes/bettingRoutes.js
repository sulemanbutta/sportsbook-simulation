require("dotenv").config();
const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { Bet } = require("../models");
const { User } = require("../models");
const { Parlay } = require("../models");
const { ParlayLeg } = require("../models");
const { getMascotFromFullName } = require('../utils/teamMascots');
const { parseScoreboard } = require('../utils/parseScoreboard');
const { getAllScores } = require('../utils/getAllScores');
const { getLiveScores } = require('../utils/getLiveScores');
const { getOdds } = require('../utils/getOdds');
const { getAllParlays } = require('../utils/getAllParlays');
const { generateNormalizedGameId } = require('../utils/generateNormalizedGameId');
const { mergeScoresAndOdds } = require('../utils/mergeScoresAndOdds');

const router = express.Router();

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader)
    const reqBody = req.body;
    //console.log("reqBody:", reqBody)
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    const token = authHeader.split(" ")[1]; // Extract token part after "Bearer "
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        res.status(403).json({ error: "Invalid token"});
    }
};
/*
function calculatePayout(odds, stake) {
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    return parseFloat((decimalOdds * stake).toFixed(2));
}
*/
function calculateParlay(bets, stake) {
  function americanToDecimal(odds) {
    return odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
  }

  function decimalToAmerican(decimalOdds) {
    if (decimalOdds < 2.0) {
      return Math.round(-100 / (decimalOdds - 1));
    } else {
      return Math.round((decimalOdds - 1) * 100);
    }
  }

  const decimalOdds = bets.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1);
  //console.log("decimalOdds:", decimalOdds)
  const payout = Math.round(stake * decimalOdds * 100) / 100;
  const combinedAmericanOdds = decimalToAmerican(decimalOdds);

  return {
    payout: payout,
    odds: combinedAmericanOdds
  };
}

router.post('/bet', authenticate, async (req, res) => {
    const { isParlay, stake, bets } = req.body
    const user_id = req.user.sub;
    const user = await User.findByPk(req.user.sub);
    
    if (typeof isParlay === 'undefined' || !stake || bets.length < 1) {
        return res.status(400).json({ error: 'Missing bet information.' });
      }
    
    if (user.balance < stake) {
        return res.status(400).json({ error: "Insufficient funds" });
    }

    if (isParlay) {
        const { payout, odds } = calculateParlay(bets, stake);
        try {
            await user.update({ balance: user.balance - stake });
            const parlay = await Parlay.create({
            user_id,
            odds: odds,
            stake,
            payout,
            status: 'PENDING',
            });
    
            const legInserts = bets.map(leg => ({
            parlay_id: parlay.parlay_id,
            event_id: leg.event_id,
            sport: leg.sport,
            home_team: leg.home_team,
            away_team: leg.away_team,
            selected_team: leg.selected_team,
            commence_time: new Date(leg.commence_timeString),
            odds: leg.odds,
            status: 'PENDING',
            }));
    
            await ParlayLeg.bulkCreate(legInserts);
    
            res.status(201).json({ parlay_id: parlay.parlay_id, payout });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to place parlay bet' });
        }
    } else {
        const { event_id, sport, home_team, away_team, selected_team, odds, commence_timeString } = bets[0];
        if (!event_id || !sport || !home_team || !away_team  || !selected_team || !selected_team || !odds || !commence_timeString) {
            return res.status(400).json({ error: 'Missing bet information.' });
          }
        const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
        const payout = parseFloat((decimalOdds * stake).toFixed(2));
        const commence_time = new Date(commence_timeString)
        try {
            await user.update({ balance: user.balance - stake });
            const newBet = await Bet.create({
                user_id,
                event_id,
                sport,
                home_team,
                away_team,
                selected_team,
                commence_time,
                odds,
                stake,
                payout,
                status: 'PENDING',
            });
            res.status(201).json(newBet);
        } catch (err) {
            console.log("Error:", err)
            res.status(500).json({ error: 'Failed to place bet' });
        }
    }
    /*
    console.log("event_id:", event_id)
    console.log("home_team:", home_team)
    console.log("away_team:", away_team)
    console.log("selected_team:", selected_team)
    console.log("odds:", odds)
    console.log("commence_time:", commence_time)
    console.log("stake:", stake)
    */
    //res.json({ message: 'endpoint success' })
});
/*
router.post('/singlebet', authenticate, async (req, res) => {
    const { event_id, home_team, away_team, selected_team, odds, commence_time, stake } = req.body;
    const user_id = req.user.sub;
  
    if (!event_id || !selected_team || !odds || !stake) {
      return res.status(400).json({ error: 'Missing bet information.' });
    }
    
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    const payout = parseFloat((decimalOdds * stake).toFixed(2));
  
    try {
      const newBet = await Bet.create({
        user_id,
        event_id,
        home_team,
        away_team,
        selected_team,
        commence_time,
        odds,
        stake,
        payout,
        status: 'PENDING',
      });
      res.status(201).json(newBet);
    } catch (err) {
      console.log("Error:", err)
      res.status(500).json({ error: 'Failed to place bet' });
    }
});

router.post('/parlaybet', authenticate, async (req, res) => {
    const { bets, stake } = req.body; // bets = array of events [{event_id, home_team, away_team, selected_team, odds}]
    const user_id = req.user.sub;

    if (!bets || bets.length < 2 || !stake) {
        return res.status(400).json({ error: 'A parlay must have at least 2 bets and a stake.' });
    }

    //const combinedOdds = bets.reduce((acc, leg) => acc * (1 + leg.odds / 100), 1) - 1;
    //console.log("leg.odds:", bets.odds)
    //console.log("combineOdds:", combinedOdds)
    //const payout = parseFloat((stake * combinedOdds).toFixed(2));

    const { payout, odds } = calculateParlay(bets, stake);
    //console.log("calculatedParlayOdds:",calculatedParlayOdds)

    try {
        const parlay = await Parlay.create({
        user_id,
        odds: odds,
        stake,
        payout,
        status: 'PENDING',
        });

        const legInserts = bets.map(leg => ({
        parlay_id: parlay.parlay_id,
        event_id: leg.event_id,
        home_team: leg.home_team,
        away_team: leg.away_team,
        selected_team: leg.selected_team,
        commence_time: leg.commence_time,
        odds: leg.odds,
        status: 'PENDING',
        }));

        await ParlayLeg.bulkCreate(legInserts);

        res.status(201).json({ parlay_id: parlay.parlay_id, payout });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to place parlay bet' });
    }
});
*/
router.get("/mybets", authenticate, async (req, res) => {
    try {
        const bets = await Bet.findAll({ where: { user_id: req.user.sub } });
        const parlays = await getAllParlays(req.user.sub)
        const wagers = [...bets, ...parlays]
        res.json(wagers);
    } catch (error) {
        console.log("Error fetching bets:", error)
        res.status(500).json({ error: "Failed to fetch bets" });
    }
});

router.get("/odds", async (req, res) => {
    try {
        const odds = await getOdds()
        res.json(odds);
    } catch (error) {
        console.log("Error fetching odds:", error)
        res.status(500).json({ error: "Failed to fetch odds" });
    }
});

router.get("/scores", async (req, res) => {
    try {
        const nbaScores = await getAllScores({league:'nba'});
        const nhlScores = await getAllScores({league:'nhl'});
        const mlbScores = await getAllScores({league:'mlb'});
        const allScores = [...nbaScores, ...nhlScores, ...mlbScores]
        res.json(allScores);
    } catch (error) {
        console.log("Error fetching scores:", error)
        res.status(500).json({ error: "Failed to fetch scores" });
    }
});

router.get("/livegames", async (req, res) => {
    try {
        const nbaScores = await getLiveScores({league:'nba'});
        const nhlScores = await getLiveScores({league:'nhl'});
        const mlbScores = await getLiveScores({league:'mlb'});
        const scoresList = [...nbaScores, ...nhlScores, ...mlbScores]
        const oddsList = await getOdds()
        const games = mergeScoresAndOdds(oddsList, scoresList)
      res.json(games)
    } catch (error) {
        console.error("Error fetching live scores:", error.message);
        res.status(500).json({ error: "Failed to fetch live game scores" });
      }
});

router.get("/games", async (req, res) => {
    try {
          const nbaScores = await getAllScores({league:'nba'});
          const nhlScores = await getAllScores({league:'nhl'});
          const mlbScores = await getAllScores({league:'mlb'});
          const scoresList = [...nbaScores, ...nhlScores, ...mlbScores]
          const oddsList = await getOdds()
            const games = mergeScoresAndOdds(oddsList, scoresList)
        res.json(games)
    } catch (error) {
        console.error('Error fetching game data', error);
        res.status(500).json({ error: 'Failed to fetch game data' });
    }
});
/*
router.post("/wager", authenticate, async (req, res) => {
    const { odds, stake, payout, event_id, home_team, away_team, selected_team } = req.body;
    if (!odds || !stake || !payout || !event_id, !home_team, !away_team, !selected_team) return res.status(400).json({ error: "Invalid input" });
    const user = await User.findByPk(req.user.sub);

    console.log(user)
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < stake) {
        return res.status(400).json({ error: "Insufficient funds" });
    }
    await user.update({ balance: user.balance - stake });
    try {
        const bet = await Bet.create({
            user_id: req.user.sub,
            odds, 
            stake,
            payout,
            event_id,
            home_team,
            away_team,
            selected_team,
            status: "PENDING",
        });
        console.log(bet)
        res.json({ success: true, bet });
    } catch (error) {
        console.log("Error placing bet:", error)
        res.status(500).json({ error: "Failed to place bet" });
    }
});*/

//router.get("/games2", async (req, res) => {
//    try {
        //const oddsResponse = await axios.get(process.env.ODDS_API_NBA_ODDS_URL);

        /*
        const [oddsResponse, scoresResponse] = await Promise.all([
            axios.get(process.env.ODDS_API_NBA_ODDS_URL),
            axios.get(process.env.ODDS_API_NBA_SCORES_URL_LOAD),
          ]);
        
        const oddsData = oddsResponse.data;
        const scoresData = scoresResponse.data;
        */
        /*
        const [
            //nbaOddsRes,
            nhlOddsRes,
            //nbaScoresRes,
            nhlScoresRes
          ] = await Promise.all([
            //axios.get(process.env.ODDS_API_NBA_ODDS_URL),
            axios.get(process.env.ODDS_API_NHL_ODDS_URL),
            //axios.get(process.env.ODDS_API_NBA_SCORES_URL_LOAD),
            axios.get(process.env.ODDS_API_NHL_SCORES_URL_LOAD)
          ]);
          
          // Now merge odds and scores
          const oddsData = [...nhlOddsRes.data]; //...nbaOddsRes.data,
          const scoresData = [...nhlScoresRes.data]; //...nbaScoresRes.data, 
          */
        /*
        const now = new Date();
        const updatedOdds = oddsData.map(game => {
            const gameTime = new Date(game.commence_time);
            const isLive = gameTime <= now;
            return { ...game, isLive };
        });
        */
        //console.log("updatedOdds: ", updatedOdds);
        //console.log("scoresData: ", scoresData);


        /*
        const liveGameIds = updatedGames.filter(game => game.isLive === true).map(game => game.id);
        console.log("liveGameIds: ", liveGameIds)
        let scoresData = [];
        // Step 3: Fetch scoes only if there are live games
        if (liveGameIds.length > 0) {
            const scoresResponse = await axios.get(SCORES_API, {
                params: { eventIds: liveGameIds.join(',') }
            });
            scoresData = scoresResponse.data;
        }
        console.log("scoresData: ", scoresData)
        */
        /*
        // Step 4: Merge scores into a games list
        const mergedGames = updatedOdds.map(gameOdds => {
            const gameScores = scoresData.find(game => game.id === gameOdds.id) || {};
            return { ...gameOdds, ...gameScores };

        });
        */

        /*
        const mergedGames = oddsData.map((gameOdds) => {
            const scoreInfo = scoresData.find(gameScores => gameScores.id === gameOdds.id) || {};
            return {
                "id": gameOdds.id,
                "sport_key": gameOdds.sport_key,
                "sport_title": gameOdds.sport_key,
                "commence_time": gameOdds.commence_time,
                "home_team": gameOdds.home_team,
                "away_team":  gameOdds.away_team,
                "bookmakers": gameOdds.bookmakers,
                "isLive": gameOdds.isLive,
                "completed": scoreInfo.completed,
                "scores": scoreInfo.scores
            };
        });
        console.log("mergedGames: ", mergedGames)
        res.json(mergedGames)
        */
    /*
        //console.log("oddsData: ", oddsData)
        const mergedGamesMap = new Map();
        oddsData.forEach(game => {
            //console.log("ID:", game.id)
            //console.log("GAME: ", game.home_team, "VS", game.away_team)
            //const home_team_mascot = (game.home_team.split(" ")).at(-1)
            //const away_team_mascot = (game.away_team.split(" ")).at(-1)
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
            mergedGamesMap.set(game.id, {
                id: game.id,
                //sport_key: game.sport_key,
                league: game.sport_title,
                commence_time: game.commence_time,
                isLive: new Date(game.commence_time) <= new Date(),
                completed: false,
                home_team: game.home_team,
                home_team_mascot: getMascotFromFullName(game.home_team),
                away_team:  game.away_team,
                away_team_mascot: getMascotFromFullName(game.away_team),
                home_team_odds: home_team_odds || null,
                away_team_odds: away_team_odds || null,
                last_odds_update: last_odds_update,
                //scores: null,
                //bookmakers: game.bookmakers,
            });
            /*
            if (game.bookmakers[0]) {
                console.log("ODDS: ", game.bookmakers[0].markets[0].outcomes)
                console.log("Team1: ", game.bookmakers[0].markets[0].outcomes[0].name)
                console.log("Team2: ", game.bookmakers[0].markets[0].outcomes[1].name)
            }
            */
        //});
/*
        console.log("scoresData: ", scoresData)
        scoresData.forEach(game => {
            //console.log("ID:", game.id)
            //console.log("GAME:", game.home_team, "VS", game.away_team)
            //const home_team_mascot = (game.home_team.split(" ")).at(-1)
            //const away_team_mascot = (game.away_team.split(" ")).at(-1)
            let home_team_score, away_team_score
            if (game.scores) {
                //console.log("scores:", game.scores)
                if (game.scores[0].name === game.home_team) {
                    home_team_score = game.scores[0].score
                    away_team_score = game.scores[1].score
                } else {
                    home_team_score = game.scores[1].score
                    away_team_score = game.scores[0].score
                }
                //console.log("home_team_score:", home_team_score)
                //console.log("away_team_score:", away_team_score)
            }
            if (mergedGamesMap.has(game.id)) {
                const existingGame = mergedGamesMap.get(game.id);
                //existingGame.scores = game.scores;
                existingGame.completed = game.completed;
                existingGame.home_team_score = home_team_score
                existingGame.away_team_score = away_team_score
                existingGame.game_clock = null
                //existingGame.last_score_update = game.last_update
            } else {
                mergedGamesMap.set(game.id, {
                    id: game.id,
                    //sport_key: game.sport_key,
                    league: game.sport_title,
                    commence_time: game.commence_time,
                    isLive: false,
                    completed: true,
                    home_team: game.home_team,
                    home_team_mascot: getMascotFromFullName(game.home_team),
                    away_team:  game.away_team,
                    away_team_mascot: getMascotFromFullName(game.away_team),
                    //scores: game.scores,
                    home_team_score: home_team_score,
                    away_team_score: away_team_score,
                    //last_score_update: game.last_update,
                    game_clock: null,
                });
            }
            /*
            if (game.scores) {
                console.log("SCORES:", game.scores[0])
            }
            */
        //});

        //const mergedGames = Array.from(mergedGamesMap.values());
        //res.json(mergedGames);
    //} catch (error) {
       // console.error('Error fetching game data', error);
       // res.status(500).json({ error: 'Failed to fetch game data' });
   //}
//});

module.exports = router;