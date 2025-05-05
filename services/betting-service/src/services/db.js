require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: process.env.DB_HOST.startsWith("/cloudsql")
      ? { socketPath: process.env.DB_HOST }
      : {}
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection successful")
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    //process.exit(1);
  })

module.exports = sequelize;