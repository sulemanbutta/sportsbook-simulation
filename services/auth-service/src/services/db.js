require("dotenv").config();
const buildTimestamp = process.env.BUILD_TIMESTAMP || 'unknown';
const commitSha = process.env.COMMIT_SHA || 'unknown';
console.log(`▶️ [auth db.js] Auth DB Code Version: JUNE1_V1`);
console.log(`▶️ [auth db.js] Build: ${buildTimestamp}`);
console.log(`▶️ [auth db.js] Commit: ${commitSha}`);
console.log(`▶️ [auth db.js] K_SERVICE: ${process.env.K_SERVICE}`);
console.log(`▶️ [auth db.js] DB_INSTANCE_CONNECTION_NAME: ${process.env.DB_INSTANCE_CONNECTION_NAME}`);
console.log(`▶️ [auth db.js] DB_HOST from env: ${process.env.DB_HOST}`);
console.log(`▶️ [auth db.js] DB_USER from env: ${process.env.DB_USER}`);

const { Sequelize } = require("sequelize");

const instanceConnectionName = process.env.DB_INSTANCE_CONNECTION_NAME; // e.g., my-project:us-central1:my-instance
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] Connecting to Cloud SQL instance via Unix socket: /cloudsql/${instanceConnectionName}`);
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  /*
  dialect: "postgres",
  host: process.env.DB_HOST,
  port: 5432,  
  dialectOptions: {},
  logging: console.log, 
*/
    dialect: "postgres",
    dialectOptions: {
      socketPath: `/cloudsql/${instanceConnectionName}`
    },
    logging: console.log,
  });

// Add retry logic for more resilient connections
let retries = 3;

const connectWithRetry = async () => {
  try {
    console.log("[auth db.js] Attempting database connection...");
    await sequelize.authenticate();
    console.log("[auth db.js] ✅ Database connection successful!");
    
    // Only sync if authentication was successful
    console.log("[auth db.js] Synchronizing models...");
    await sequelize.sync({ alter: true });
    console.log("[auth db.js] ✅ All models synchronized successfully!");
  } catch (err) {
    console.error(`[auth db.js] ❌ Database connection failed (${retries} retries left):`, err);
    
    if (retries > 0) {
      retries--;
      const delay = 5000; // 5 seconds
      console.log(`[auth db.js] Retrying in ${delay/1000} seconds...`);
      setTimeout(connectWithRetry, delay);
    } else {
      console.error("[auth db.js] ❌ Max retries reached. Database connection failed.");
    }
  }
};

// Start connection process with retry
connectWithRetry();

/*
sequelize
  .authenticate()
  .then(() => {
    console.log("[auth db.js] Database connection successful.");
    return sequelize.sync({ alter: true }); 
  })
  .then(() => {
    console.log("[auth db.js] All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("[auth db.js] Database connection failed:", err);
    // process.exit(1);
  });
*/
module.exports = sequelize;