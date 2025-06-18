require("dotenv").config();
const { getUnsettledBets } = require('./getUnsettledBets');
const { getUnsettledParlayLegs } = require('./getUnsettledParlayLegs');
const { User, Bet, ParlayLeg, Parlay, sequelize } = require('../models');
const axios = require('axios');

const groupLegsByParlay = (legs) => {
    const grouped = {};
    legs.forEach(leg => {
        if (!grouped[leg.parlay_id]) {
            grouped[leg.parlay_id] = [];
        }
        grouped[leg.parlay_id].push(leg);
    });
    return grouped;
}

const groupEventsBySport = (items) => {
    const grouped = {};
    items.forEach(item => {
        if (!grouped[item.sport]) {
            grouped[item.sport] = new Set();
        }
        grouped[item.sport].add(item.event_id);
    });
    return grouped;
}

const fetchScoresBySport = async (groupedEvents) => {
    console.log("In fetchScoresBySport()")
    const scorePromises = Object.entries(groupedEvents).map(async ([sport, eventSet]) => {
        const eventIds = Array.from(eventSet).join(',');
        console.log("sport:", sport)
        console.log("eventIds:", eventIds)
        try {
            const https = require('https');
            const agent = new https.Agent({ family: 4 }); // forces IPv4
            const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport}/scores`, {
                params : {
                    apiKey: process.env.ODDS_API_KEY,
                    daysFrom: 2,
                    eventIds,
                },
                httpsAgent: agent
            });
            console.log("response:", response.data)
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch scores for sport ${sport}:`, error.message);
            return [];
        }
    });
    const results = await Promise.all(scorePromises);

    const allScores = {};
    results.flat().forEach(score => {
      allScores[score.id] = score;
    });
  
    return allScores;
}

const gradeWager = (wager, scoreData) => {
    console.log("in gradeWager()")
    if (!scoreData || !scoreData.scores || !scoreData.completed) {
        return { status: "PENDING"};
    }
    console.log("wager:", wager)
    console.log("scoreData:", scoreData)
    const homeScore = scoreData.scores?.find(s => s.name === wager.home_team)
    const awayScore = scoreData.scores?.find(s => s.name === wager.away_team)
    const selectedTeam = wager.selected_team;
    let result;
    if (selectedTeam === homeScore.name) {
        result = Number(homeScore.score) > Number(awayScore.score) ? "WIN" : "LOSS";
    } else if (selectedTeam === awayScore.name) {
        result = Number(awayScore.score) > Number(homeScore.score) ? "WIN" : "LOSS";
    } else {
        result = "LOSS";
    }
    return { status: result };
};

async function gradeUnsettledBetsAndParlayLegs(db) {
    console.log("in gradeUnsettledBetsAndParlayLegs()")
    try {
        const { User, Bet, ParlayLeg, Parlay, sequelize } = db
        const unsettledBets =  await getUnsettledBets(db);
        const unsettledLegs = await getUnsettledParlayLegs(db);
        console.log("unsettledBets:", unsettledBets)
        console.log("unsettledLegs:", unsettledLegs)
        const parlayIds = [...new Set(unsettledLegs.map(leg => leg.parlay_id))];
        console.log("parlayIds:", parlayIds)



        if (unsettledBets.length === 0 && unsettledLegs.length === 0) {
            console.log("No unsettled bets or parlay legs to grade");
            return;
        }
        
        const groupedEvents = groupEventsBySport([...unsettledBets, ...unsettledLegs]);
        console.log("groupedEvents:", groupedEvents)
        const allScores = await fetchScoresBySport(groupedEvents);
        console.log("allScores:", allScores)

        const transaction = await sequelize.transaction();
        try {
            for (const bet of unsettledBets) {
                const scoreData = allScores[bet.event_id]
                console.log("bet:", bet)
                //console.log("scoreData:", scoreData)
                const { status } = gradeWager(bet, scoreData)
                console.log("status:", status)
                if (status !== 'PENDING') {
                    await Bet.update({ status }, { where: { bet_id: bet.bet_id }, transaction });

                    if (status === 'WIN') {
                        const user = await User.findOne({ where: { user_id: bet.user_id }, transaction });
                        const newBalance = user.balance + bet.payout
                        await user.update({ balance: newBalance }, { transaction });
                    }
                }
            }
            for (const leg of unsettledLegs) {
                const scoreData = allScores[leg.event_id]
                console.log("leg:", leg)
                //console.log("scoreData:", scoreData)
                const { status } = gradeWager(leg, scoreData)
                console.log("status:", status)
                if (status !== 'PENDING') {
                    await ParlayLeg.update({ status }, { where: { leg_id: leg.leg_id }, transaction });
                }
            }

            const allParlayLegs = await ParlayLeg.findAll({
                where: { parlay_id: parlayIds },
                raw : true,
                transaction,
              });
            const groupedParlays = groupLegsByParlay(allParlayLegs);
            console.log("groupedParlays:", groupedParlays)
            for (const [parlayId, legs] of Object.entries(groupedParlays)) {
                const allLegsSettled = legs.every(leg => leg.status !== 'PENDING');
                if (!allLegsSettled) continue;
                const parlayStatus = legs.every(leg => leg.status === 'WIN') ? 'WIN' : 'LOSS';
                await Parlay.update({ status: parlayStatus }, { where: { parlay_id: parlayId }, transaction });
                if (parlayStatus === 'WIN') {
                    const parlay = await Parlay.findOne({ where: { parlay_id: parlayId }, transaction })
                    const user = await User.findOne({ where: { user_id: parlay.user_id }, transaction });
                    const newBalance = user.balance + parlay.payout
                    await user.update({ balance: newBalance }, { transaction });
                }
            }

            await transaction.commit();
            console.log('Successfully graded bets and parlay legs.');
        } catch (error) {
            console.error('Error grading bets and legs:', error.message);
            //await transaction.rollback();
        }
        /*
        const apiKey = process.env.ODDS_API_KEY;
        const eventResults = {};
        for (const sport in groupedEvents) {
            console.log("sport:", sport)
            const eventIds = [...groupedEvents[sport]].join(',');
            console.log("eventIds:", eventIds)
            const { data } = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport}/scores`, {
            params: { apiKey, eventIds },
            });
            
            data.forEach(event => {
            eventResults[event.id] = event; // index by event ID for easy lookup
            });
        }
        console.log("eventResults:", eventResults)
        */
    /*
        for (const bet of unsettledBets) {
            const event = eventResults[bet.event_id];
            if (!event || !event.completed) continue; // Skip if not completed yet
    
            const homeScore = event.scores.home_score;
            const awayScore = event.scores.away_score;
            const selectedTeam = bet.selected_team;
    
            let betStatus = 'LOST';
            if (
            (selectedTeam === event.home_team && homeScore > awayScore) ||
            (selectedTeam === event.away_team && awayScore > homeScore)
            ) {
            betStatus = 'WON';
            }
    
            await bet.update({ status: betStatus }, { transaction: t });
            console.log(`Graded Bet: ${bet.bet_id} as ${betStatus}`);
        }
*/
    } catch (error) {
        console.error("Failed to fetch unsettled bets", error);
        return [];
      }

    return;
}

module.exports = { gradeUnsettledBetsAndParlayLegs };