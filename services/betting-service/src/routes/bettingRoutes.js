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
console.log('force revision betting-service')
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader)
    const reqBody = req.body;
  
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
    const { User } = req.db;
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
            const { Parlay } = req.db;
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
            const { ParlayLeg } = req.db;
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
            const { Bet } = req.db;
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
});

router.get("/mybets", authenticate, async (req, res) => {
    try {
        const { Bet } = req.db;
        const bets = await Bet.findAll({ where: { user_id: req.user.sub } });
        const parlays = await getAllParlays(req)
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

module.exports = router;