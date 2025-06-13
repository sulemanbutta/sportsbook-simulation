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

// Scheduled endpoint (called by Cloud Scheduler)
router.post('/unsettled-bets/scheduled', async (req, res) => {
  // Verify the request is from Cloud Scheduler
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.SCHEDULER_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

 try {
  await gradeUnsettledBetsAndParlayLegs(req.db);
  res.json({ 
      message: "Scheduled settlement completed successfully",
      timestamp: new Date().toISOString()
  });
  } catch (error) {
    console.log("Scheduled settlement error:", error);
    res.status(500).json({ 
        error: "Scheduled settlement failed",
        timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;