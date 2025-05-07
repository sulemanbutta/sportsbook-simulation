require("dotenv").config();
const { Sequelize } = require("sequelize");
 
const rawHost = process.env.DB_HOST;  // now the public IP
const port    = process.env.DB_PORT || 5432;

console.log("▶️ [db.js] Connecting via public IP:", rawHost, port);

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