require("dotenv").config();
const fs = require("fs");

// NO-OP BUILD MARKER: 2025-05-06T22:10:00Z
console.log("▶️ [auth db.js] Build marker: 2025-05-06T22:10:00Z");

const rawHost = process.env.DB_HOST;
console.log("▶️ [auth db.js] process.env.DB_HOST =", rawHost);
console.log("▶️ [auth db.js] typeof DB_HOST =", typeof rawHost);

// (rest of your Sequelize logic…)




const { Sequelize } = require("sequelize");
 
const port    = process.env.DB_PORT || 5432;

console.log("▶️ [db.js] Connecting via public IP:", rawHost, port);

console.log("▶️ [db.js] process.env.DB_HOST =", process.env.DB_HOST);
console.log("▶️ [db.js] typeof DB_HOST =", typeof process.env.DB_HOST);


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "postgres",
    host: rawHost,
    port,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

sequelize.authenticate()
  .then(() => {
    console.log("Database connection successful");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("All models were synchronized");
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    // process.exit(1);
  });

module.exports = sequelize;