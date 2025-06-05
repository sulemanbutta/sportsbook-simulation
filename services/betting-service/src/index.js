require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bettingRoutes = require("./routes/bettingRoutes");
const sequelize = require("./services/db");

const app = express();
const allowed = [ 'https://sportsbook-simulation.web.app', 'https://sportsbook-simulation.firebaseapp.com', 'http://localhost:5173'];

// Middleware
app.use(express.json());
//app.use(cors());
app.use(cors({
  origin: allowed,
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.locals.sequelize = sequelize;

// Routes
app.use("/betting", bettingRoutes);

const PORT = parseInt(process.env.PORT) || 4001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Betting Service running on port ${PORT}`);
});