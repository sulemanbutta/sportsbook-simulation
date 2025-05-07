require("dotenv").config();
const { Sequelize } = require("sequelize");
/*
// Detect whether you're running in GCP (socket path) or locally (hostname)
const isSocket = process.env.DB_HOST?.startsWith("/cloudsql/");

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
*/
const fs = require("fs");
const socketDir = process.env.DB_HOST; // "/cloudsql/…"
console.log("▶️ Checking socket:", socketDir);
try {
  const files = fs.readdirSync(socketDir);
  console.log("▶️ Socket dir contents:", files);
} catch (e) {
  console.error("❌ Could not read socket dir:", e.message);
}


// Determine if running in Cloud Run with Cloud SQL
const isCloudSQL = process.env.DB_HOST?.includes("/cloudsql/");
console.log("▶️ [db.js] DB_HOST:", process.env.DB_HOST);
console.log("▶️ [db.js] isCloudSQL:", isCloudSQL);

// Configure connection options
let config = {
  dialect: "postgres",
  logging: console.log
};

if (isCloudSQL) {
  // Cloud SQL with Unix socket
  config = {
    ...config,
    host: "/cloudsql/" + process.env.CLOUDSQL_INSTANCE,
    dialectOptions: {
      socketPath: "/cloudsql/" + process.env.CLOUDSQL_INSTANCE,
    }
  };
  console.log("▶️ [db.js] Using Cloud SQL socket connection:", `/cloudsql/${process.env.CLOUDSQL_INSTANCE}`);
} else {
  // Standard TCP connection for local development
  config = {
    ...config,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432
  };
  console.log("▶️ [db.js] Using standard TCP connection");
}
// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  config
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