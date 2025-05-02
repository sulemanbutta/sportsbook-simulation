require("dotenv").config();
const express = require("express");
const { Bet } = require("../models");
const { User } = require("../models");
const { fetchEventResults } = require("../services/eventService");
const { getUnsettledBets } = require("../services/getUnsettledBets");
const { gradeUnsettledBetsAndParlayLegs } = require("../services/gradeUnsettledBetsAndParlayLegs");

const router = express.Router();

const processPayouts = async () => {
  try {
    const settledBets = await Bet.findAll({ where: { statust: "WON" } });

    for (const bet of settledBets) {
      const user = await User.findByPk(bet.user_id);
      if (!user) continue;

      await user.update({ balance: user.balance + bet.payout });

      console.log("User ${user.user_id} receieved payout of ${bet.payout}");
    }
  } catch (error) {
    console.error("Error processing payout:", error);
  }
};

const settleBets = async () => {
  try {
    console.log("In settleBets");
    const unsettledBets = await getUnsettledBets();
    if (unsettledBets.length === 0) {
      console.log("No bets to be settled.");
      return;
    }

    const eventResults = await fetchEventResults();
    if (!eventResults) {
      console.error("Failed to fetch event results.");
      return;
    }
    
    for (const bet of unsettledBets) {
      if (!(eventResults.has(bet.event_id))) {
        console.error(`No result found for event ${bet.event_id}`);
        continue;
      }
      const result = eventResults.get(bet.event_id)

      console.log("bet: ", bet)
      console.log("result:", result)
      console.log("result.scores:", result.scores)

      const winner = result.scores[0].score > result.scores[1].score ? result.scores[0].name : result.scores[1].name
      console.log("winner:", winner)
      let status, payout;
      if (bet.selected_team === winner){
        status = "WON"
        payout = bet.payout
      }
      else {
        status = "LOSE"
        payout = 0
      }

      await Bet.update({ status }, { where: {bet_id: bet.bet_id} } );
      const user = await User.findByPk(bet.user_id);
      await user.update({ balance: user.balance + payout });
      console.log(`Bet ${bet.id} settled as ${status} with payout ${payout}`);
    }

  } catch (error) {
    console.error("Error settling bets:", error);
  }
};
router.get("/unsettled-bets", async (req, res) => {
    try {
      await gradeUnsettledBetsAndParlayLegs()
      res.json({ message: "Bets settled successfully" });
    } catch (error) {
      console.log("Error:", error)
      res.status(500).json({ error: "Failed to fetch unsettled bets" });
    }
  });


module.exports = router