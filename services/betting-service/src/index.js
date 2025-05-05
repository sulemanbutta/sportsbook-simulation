require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bettingRoutes = require("./routes/bettingRoutes");
const sequelize = require('./services/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.locals.sequelize = sequelize;

// Routes
app.use("/betting", bettingRoutes);

const PORT = process.env.PORT || process.env.BETTING_PORT || 4001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Betting Service running on port ${PORT}`);
});