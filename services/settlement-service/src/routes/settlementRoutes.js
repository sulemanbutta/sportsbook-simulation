require("dotenv").config();
const express = require("express");
const { gradeUnsettledBetsAndParlayLegs } = require("../services/gradeUnsettledBetsAndParlayLegs");

const router = express.Router();

router.get("/unsettled-bets", async (req, res) => {
    try {
      await gradeUnsettledBetsAndParlayLegs(req.db)
      res.json({ message: "Bets settled successfully" });
    } catch (error) {
      console.log("Error:", error)
      res.status(500).json({ error: "Failed to fetch unsettled bets" });
    }
  });


module.exports = router