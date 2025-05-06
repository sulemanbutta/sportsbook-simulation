require("dotenv").config();
const { Sequelize } = require("sequelize");

// Detect whether you're running in GCP (socket path) or locally (hostname)
const isSocket = process.env.DB_HOST?.startsWith("/cloudsql/");


console.log("▶️ [db.js] Sequelize init - DB_HOST:", process.env.DB_HOST);
console.log("▶️ [db.js] Sequelize init - isSocket:", isSocket);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "postgres",
    // If socket mode, leave host/port undefined (driver will use socketPath)
    host: isSocket ? undefined : process.env.DB_HOST,
    port: isSocket ? undefined : process.env.DB_PORT,
    dialectOptions: isSocket
      ? { socketPath: process.env.DB_HOST }
      : {}
  }
);

console.log("▶️ [db.js] Sequelize options:", {
  host: isSocket ? undefined : process.env.DB_HOST,
  port: isSocket ? undefined : process.env.DB_PORT,
  socketPath: isSocket ? process.env.DB_HOST : null
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection successful")
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    //process.exit(1);
  })
/*
async function init() {
  await sequelize.authenticate();
  console.log("✅ Auth DB connected");
  // await sequelize.sync({ alter: true });

}
*/
module.exports = sequelize;