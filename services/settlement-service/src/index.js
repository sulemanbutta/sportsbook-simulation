require("dotenv").config();
const express = require("express");
const cors = require("cors");
const settlementRoutes = require("./routes/settlementRoutes");
const sequelize = require('./services/db');
const startPoller = require('./poller');

const app = express();
const allowed = [ 'https://sportsbook-simulation.web.app', 'https://sportsbook-simulation.firebaseapp.com' ];

// Middleware
app.use(express.json());
//app.use(cors());
app.use(cors({
  origin: allowed,
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
startPoller();

app.locals.sequelize = sequelize;

// Routes
app.use("/settlement", settlementRoutes);

const PORT = process.env.PORT || process.env.SETTLEMENT_PORT || 4002;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Settlement Service running on port ${PORT}`);
});