console.log("▶️ [index.js] Starting Auth Service…1");
require("dotenv").config();
console.log("▶️ [index.js] Starting Auth Service…2");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const sequelize = require("./services/db");

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

app.locals.sequelize = sequelize;

// Routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || process.env.AUTH_PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth Service running on port ${PORT}`);
});