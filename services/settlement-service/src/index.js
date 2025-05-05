require("dotenv").config();
const express = require("express");
const cors = require("cors");
const settlementRoutes = require("./routes/settlementRoutes");
const sequelize = require('./db');
const startPoller = require('./poller');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
startPoller();

app.locals.sequelize = sequelize;

// Routes
app.use("/settlement", settlementRoutes);

const PORT = process.env.PORT || process.env.SETTLEMENT_PORT || 4002;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Settlement Service running on port ${PORT}`);
});