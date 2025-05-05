require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.locals.sequelize = sequelize;

// Routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || process.env.AUTH_PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth Service running on port ${PORT}`);
});